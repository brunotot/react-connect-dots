import random
import collections
import string

T, L, R = range(3)
LOOP_TRIES = 1000


def unrotate(x, y, dx, dy):
    while (dx, dy) != (0, 1):
        x, y, dx, dy = -y, x, -dy, dx
    return x, y


def sign(x):
    if x == 0:
        return x
    return -1 if x < 0 else 1


def has_loops(grid, uf):
    groups = len({uf.find((x, y)) for y in range(grid.h) for x in range(grid.w)})
    ends = sum(bool(grid[x, y] in 'v^<>') for y in range(grid.h) for x in range(grid.w))
    return ends != 2 * groups


def has_pair(tg, uf):
    for y in range(tg.h):
        for x in range(tg.w):
            for dx, dy in ((1, 0), (0, 1)):
                x1, y1 = x + dx, y + dy
                if x1 < tg.w and y1 < tg.h:
                    if tg[x, y] == tg[x1, y1] == 'x' and uf.find( (x, y)) == uf.find( (x1, y1)):
                        return True
    return False


def has_tripple(tg, uf):
    for y in range(tg.h):
        for x in range(tg.w):
            r = uf.find( (x, y))
            nbs = 0
            for dx, dy in ((1, 0), (0, 1), (-1, 0), (0, -1)):
                x1, y1 = x + dx, y + dy
                if 0 <= x1 < tg.w and 0 <= y1 < tg.h and uf.find( (x1, y1)) == r:
                    nbs += 1
            if nbs >= 3:
                return True
    return False


def make(w, h, mitm, min_numbers=0, max_numbers=1000):
    def test_ready(grid):
        sg = grid.shrink()
        stg, uf = sg.make_tubes()
        numbers = list(stg.values()).count('x') // 2
        return min_numbers <= numbers <= max_numbers and not has_loops(sg, uf) and not has_pair(stg, uf) and not has_tripple(stg, uf) \

    grid = Grid(2 * w + 1, 2 * h + 1)

    while True:
        grid.clear()

        path = mitm.rand_path2(h, h, 0, -1)
        if not grid.test_path(path, 0, 0):
            continue
        grid.draw_path(path, 0, 0)
        grid[0, 0], grid[0, 2 * h] = '\\', '/'

        path2 = mitm.rand_path2(h, h, 0, -1)
        if not grid.test_path(path2, 2 * w, 2 * h, 0, -1):
            continue
        grid.draw_path(path2, 2 * w, 2 * h, 0, -1)
        grid[2 * w, 0], grid[2 * w, 2 * h] = '/', '\\'

        if test_ready(grid):
            return grid.shrink()

        tg, _ = grid.make_tubes()
        for tries in range(LOOP_TRIES):
            x, y = 2 * random.randrange(w), 2 * random.randrange(h)

            if tg[x, y] not in '-|':
                continue

            path = mitm.rand_loop(clock=1 if tg[x, y] == '-' else -1)
            if grid.test_path(path, x, y):
                grid.clear_path(path, x, y)

                grid.draw_path(path, x, y, loop=True)
                tg, _ = grid.make_tubes()

                sg = grid.shrink()
                stg, uf = sg.make_tubes()
                numbers = list(stg.values()).count('x') // 2
                if numbers > max_numbers:
                    break
                if test_ready(grid):
                    return sg


def color_tubes(grid):
    colors = ['']
    reset = ''
    tube_grid, uf = grid.make_tubes()
    letters = string.digits[1:] + string.ascii_letters
    char = collections.defaultdict(lambda: letters[len(char)])
    col = collections.defaultdict(lambda: colors[len(col) % len(colors)])
    for x in range(tube_grid.w):
        for y in range(tube_grid.h):
            if tube_grid[x, y] == 'x':
                tube_grid[x, y] = char[uf.find((x, y))]
            tube_grid[x, y] = col[uf.find((x, y))] + tube_grid[x, y] + reset
    return tube_grid, char


class Path:
    def __init__(self, steps):
        self.steps = steps

    def xys(self, dx=0, dy=1):
        x, y = 0, 0
        yield x, y
        for step in self.steps:
            x, y = x + dx, y + dy
            yield x, y
            if step == L:
                dx, dy = -dy, dx
            if step == R:
                dx, dy = dy, -dx
            elif step == T:
                x, y = x + dx, y + dy
                yield x, y

    def test(self):
        ps = list(self.xys())
        return len(set(ps)) == len(ps)

    def test_loop(self):
        ps = list(self.xys())
        seen = set(ps)
        return len(ps) == len(seen) or len(ps) == len(seen) + 1 and ps[0] == ps[-1]

    def winding(self):
        return self.steps.count(R) - self.steps.count(L)

    def __repr__(self):
        return ''.join({T: '2', R: 'R', L: 'L'}[x] for x in self.steps)

    def show(self):
        import matplotlib.pyplot as plt
        xs, ys = zip(*self.xys())
        plt.plot(xs, ys)
        plt.axis('scaled')
        plt.show()


class Mitm:
    def __init__(self, lr_price, t_price):
        self.lr_price = lr_price
        self.t_price = t_price
        self.inv = collections.defaultdict(list)
        self.list = []

    def prepare(self, budget):
        dx0, dy0 = 0, 1
        for path, (x, y, dx, dy) in self._good_paths(0, 0, dx0, dy0, budget):
            self.list.append((path, x, y, dx, dy))
            self.inv[x, y, dx, dy].append(path)

    def rand_path(self, xn, yn, dxn, dyn):
        while True:
            path, x, y, dx, dy = random.choice(self.list)
            path2s = self._lookup(dx, dy, xn - x, yn - y, dxn, dyn)
            if path2s:
                path2 = random.choice(path2s)
                joined = Path(path + path2)
                if joined.test():
                    return joined

    def rand_path2(self, xn, yn, dxn, dyn):
        seen = set()
        path = []
        while True:
            seen.clear()
            del path[:]
            x, y, dx, dy = 0, 0, 0, 1
            seen.add((x, y))
            for _ in range(2 * (abs(xn) + abs(yn))):
                # We sample with weights proportional to what they are in _good_paths()
                step, = random.choices(
                    [L, R, T], [1 / self.lr_price, 1 / self.lr_price, 2 / self.t_price])
                path.append(step)
                x, y = x + dx, y + dy
                if (x, y) in seen:
                    break
                seen.add((x, y))
                if step == L:
                    dx, dy = -dy, dx
                if step == R:
                    dx, dy = dy, -dx
                elif step == T:
                    x, y = x + dx, y + dy
                    if (x, y) in seen:
                        break
                    seen.add((x, y))
                if (x, y) == (xn, yn):
                    return Path(path)
                ends = self._lookup(dx, dy, xn - x, yn - y, dxn, dyn)
                if ends:
                    return Path(tuple(path) + random.choice(ends))

    def rand_loop(self, clock=0):
        """ Set clock = 1 for clockwise, -1 for anti clockwise. 0 for don't care. """
        while True:
            # The list only contains 0,1 starting directions
            path, x, y, dx, dy = random.choice(self.list)
            # Look for paths ending with the same direction
            path2s = self._lookup(dx, dy, -x, -y, 0, 1)
            if path2s:
                path2 = random.choice(path2s)
                joined = Path(path + path2)
                # A clockwise path has 4 R's more than L's.
                if clock and joined.winding() != clock * 4:
                    continue
                if joined.test_loop():
                    return joined

    def _good_paths(self, x, y, dx, dy, budget, seen=None):
        if seen is None:
            seen = set()
        if budget >= 0:
            yield (), (x, y, dx, dy)
        if budget <= 0:
            return
        seen.add((x, y))
        x1, y1 = x + dx, y + dy
        if (x1, y1) not in seen:
            for path, end in self._good_paths(
                    x1, y1, -dy, dx, budget - self.lr_price, seen):
                yield (L,) + path, end
            for path, end in self._good_paths(
                    x1, y1, dy, -dx, budget - self.lr_price, seen):
                yield (R,) + path, end
            seen.add((x1, y1))
            x2, y2 = x1 + dx, y1 + dy
            if (x2, y2) not in seen:
                for path, end in self._good_paths(
                        x2, y2, dx, dy, budget - self.t_price, seen):
                    yield (T,) + path, end
            seen.remove((x1, y1))
        seen.remove((x, y))

    def _lookup(self, dx, dy, xn, yn, dxn, dyn):
        xt, yt = unrotate(xn, yn, dx, dy)
        dxt, dyt = unrotate(dxn, dyn, dx, dy)
        return self.inv[xt, yt, dxt, dyt]


class UnionFind:
    def __init__(self, initial=None):
        self.uf = initial or {}

    def union(self, a, b):
        a_par, b_par = self.find(a), self.find(b)
        self.uf[a_par] = b_par

    def find(self, a):
        if self.uf.get(a, a) == a:
            return a
        par = self.find(self.uf.get(a, a))
        # Path compression
        self.uf[a] = par
        return par


class Grid:
    def __init__(self, w, h):
        self.w, self.h = w, h
        self.grid = {}

    def __setitem__(self, key, val):
        self.grid[key] = val

    def __getitem__(self, key):
        return self.grid.get(key, ' ')

    def __repr__(self):
        res = []
        for y in range(self.h):
            res.append(''.join(self[x, y] for x in range(self.w)))
        return '\n'.join(res)

    def __iter__(self):
        return iter(self.grid.items())

    def __contains__(self, key):
        return key in self.grid

    def __delitem__(self, key):
        del self.grid[key]

    def clear(self):
        self.grid.clear()

    def values(self):
        return self.grid.values()

    def shrink(self):
        small_grid = Grid(self.w // 2, self.h // 2)
        for y in range(self.h // 2):
            for x in range(self.w // 2):
                small_grid[x, y] = self[2 * x + 1, 2 * y + 1]
        return small_grid

    def test_path(self, path, x0, y0, dx0=0, dy0=1):
        return all(0 <= x0 - x + y < self.w and 0 <= y0 + x + y < self.h
                   and (x0 - x + y, y0 + x + y) not in self for x, y in path.xys(dx0, dy0))

    def draw_path(self, path, x0, y0, dx0=0, dy0=1, loop=False):
        ps = list(path.xys(dx0, dy0))
        if loop:
            assert ps[0] == ps[-1], (path, ps)
            ps.append(ps[1])
        for i in range(1, len(ps) - 1):
            xp, yp = ps[i - 1]
            x, y = ps[i]
            xn, yn = ps[i + 1]
            self[x0 - x + y, y0 + x + y] = {
                (1, 1, 1): '<', (-1, -1, -1): '<',
                (1, 1, -1): '>', (-1, -1, 1): '>',
                (-1, 1, 1): 'v', (1, -1, -1): 'v',
                (-1, 1, -1): '^', (1, -1, 1): '^',
                (0, 2, 0): '\\', (0, -2, 0): '\\',
                (2, 0, 0): '/', (-2, 0, 0): '/'
            }[xn - xp, yn - yp, sign((x - xp) * (yn - y) - (xn - x) * (y - yp))]

    def make_tubes(self):
        uf = UnionFind()
        tube_grid = Grid(self.w, self.h)
        for x in range(self.w):
            d = '-'
            for y in range(self.h):
                for dx, dy in {
                        '/-': [(0, 1)], '\\-': [(1, 0), (0, 1)],
                        '/|': [(1, 0)],
                        ' -': [(1, 0)], ' |': [(0, 1)],
                        'v|': [(0, 1)], '>|': [(1, 0)],
                        'v-': [(0, 1)], '>-': [(1, 0)],
                }.get(self[x, y] + d, []):
                    uf.union((x, y), (x + dx, y + dy))
                tube_grid[x, y] = {
                    '/-': '┐', '\\-': '┌',
                    '/|': '└', '\\|': '┘',
                    ' -': '-', ' |': '|',
                }.get(self[x, y] + d, 'x')
                if self[x, y] in '\\/v^':
                    d = '|' if d == '-' else '-'
        return tube_grid, uf

    def clear_path(self, path, x, y):
        path_grid = Grid(self.w, self.h)
        path_grid.draw_path(path, x, y, loop=True)
        for key, val in path_grid.make_tubes()[0]:
            if val == '|':
                self.grid.pop(key, None)


def get_random_scheme(rows, colors):
    random_scheme = ''
    mitm = Mitm(lr_price=2, t_price=1)
    mitm.prepare(min(20, max(rows, 6)))

    grid = make(rows, rows, mitm, colors, colors)
    color_grid, mapping = color_tubes(grid)

    for y in range(color_grid.h):
        for x in range(color_grid.w):
            if grid[x, y] in 'v^<>':
                normalized_int_value = ord(color_grid[x, y]) - 1
                normalized_char_value = chr(normalized_int_value)
                random_scheme += normalized_char_value
            else:
                random_scheme += '-'

    return random_scheme


get_random_scheme(__rows__, __colors__)
