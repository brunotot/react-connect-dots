import { getRandomBoardScheme } from "./../generator/BoardGenerator";

const UNKNOWN_POINT: Point = -1;

export type IdentifierKey = string;

export type Point = number;

export type GameState = { [key: IdentifierKey]: ColorState };

export type ColorStateConfig = Partial<ColorState>;

export type IdentifierData = {
	valid: boolean;
	index: number;
};

export type ColorPosition = {
	head: Point;
	tail: Point;
};

export type ColorState = {
	identifier: IdentifierKey;
	position: ColorPosition;
	filled: Point[];
	draggingActive: boolean;
	current?: Point;
};

export async function loadGameService(
	rows: number,
	colorCount: number,
	render: (state: GameState) => void,
	scheme?: string
) {
	const service = new GameService(rows, colorCount, render, scheme);
	await service.init();
	return service;
}

export default class GameService {
	private _identifiers!: IdentifierKey[];
	private _scheme!: string;
	private _game!: GameState;
	private _colorCount: number;
	private _rows: number;
	private _render: (state: GameState) => void;

	get rows() {
		return this._rows;
	}

	get progressPercentage(): number {
		const tilesCount = Math.pow(this.rows, 2);
		const filledCount = this.colors.reduce(
			(value, color) => value + color.filled.length,
			0
		);
		return Math.floor((filledCount / tilesCount) * 100);
	}

	get tilesCount() {
		return Math.pow(this.rows, 2);
	}

	get colorCount() {
		return this._colorCount;
	}

	get scheme() {
		return this._scheme;
	}

	constructor(
		rows: number,
		colorCount: number,
		render: (state: GameState) => void,
		scheme?: string
	) {
		this._render = render;
		this._rows = rows;
		this._colorCount = colorCount;
		if (scheme) {
			this.scheme = scheme;
		}
	}

	async init() {
		if (!this.scheme) {
			const value = await getRandomBoardScheme(this.rows, this.colorCount);
			this.scheme = value;
		}
	}

	updateGame(
		colorState: ColorStateConfig,
		identifier?: IdentifierKey,
		flag?: boolean
	): void {
		const clonedGameState = structuredClone(this._game);

		const rows = this.rows;
		if (identifier === undefined) {
			for (const identifier of this._identifiers) {
				clonedGameState[identifier] = {
					...clonedGameState[identifier],
					...colorState,
				};
			}
		} else {
			clonedGameState[identifier] = {
				...clonedGameState[identifier],
				...colorState,
			};

			const idxCurrent = colorState.current;
			const idxDrawingLinks = clonedGameState[identifier].filled;

			function isProperDirection(): boolean {
				if (idxDrawingLinks.length === 0) {
					return true;
				}
				const lastIdxDrawingLink = idxDrawingLinks[idxDrawingLinks.length - 1];
				return (
					idxCurrent === lastIdxDrawingLink + 1 ||
					idxCurrent === lastIdxDrawingLink - 1 ||
					idxCurrent === lastIdxDrawingLink + rows ||
					idxCurrent === lastIdxDrawingLink - rows
				);
			}

			if (idxCurrent !== undefined) {
				if (
					(idxCurrent === clonedGameState[identifier].position.tail ||
						idxCurrent === clonedGameState[identifier].position.head) &&
					!this._game[identifier].draggingActive
				) {
					idxDrawingLinks.length = 0;
				}

				const indexOfIdxCurrent = idxDrawingLinks.indexOf(idxCurrent);
				if (indexOfIdxCurrent !== -1) {
					idxDrawingLinks.length = indexOfIdxCurrent;
				}
			}

			const isFinished = () => {
				if (identifier === undefined) {
					return false;
				}
				const colorState = clonedGameState[identifier];
				const idxDrawingLinks = colorState.filled;
				if (idxDrawingLinks.length < 2) {
					return false;
				}
				const firstIdxDrawingLink = idxDrawingLinks[0];
				const lastIdxDrawingLink = idxDrawingLinks[idxDrawingLinks.length - 1];
				return firstIdxDrawingLink === colorState.position.tail
					? lastIdxDrawingLink === colorState.position.head
					: lastIdxDrawingLink === colorState.position.tail;
			};

			const isPossible =
				idxCurrent !== undefined &&
				!Object.values(clonedGameState)
					.filter(({ identifier: clr }) => clr !== identifier)
					.some(({ position }) =>
						[position.tail, position.head].includes(idxCurrent)
					) &&
				isProperDirection() &&
				!isFinished();

			if (isPossible) {
				const secondToLastDrawingIndex =
					idxDrawingLinks[idxDrawingLinks.length - 2];
				if (secondToLastDrawingIndex === idxCurrent) {
					idxDrawingLinks.pop();
				} else {
					idxDrawingLinks.push(idxCurrent);
				}

				const clashingColorState = Object.values(clonedGameState)
					.filter(({ identifier: clr }) => clr !== identifier)
					.find(({ filled: idxDL }) => idxDL.includes(idxCurrent));
				if (clashingColorState) {
					const clashingIdxDrawingLinks = clashingColorState.filled;
					const clashingIndexOfIdxCurrent =
						clashingIdxDrawingLinks.indexOf(idxCurrent);
					clashingIdxDrawingLinks.length = clashingIndexOfIdxCurrent;
				}
			}
		}

		this._game = clonedGameState;
		this.triggerChange();
	}

	triggerChange() {
		this._render(this._game);
	}

	get draggingColor(): ColorState | undefined {
		return this.colors.find(({ draggingActive }) => draggingActive);
	}

	get colors() {
		return Object.values(this._game);
	}

	private set scheme(scheme: string) {
		this._scheme = scheme;
		this._identifiers = this.buildIdentifiers();
		this._game = this.buildInitialGameState();
	}

	private isValidIdentifier(possibleIdentifier: IdentifierKey): boolean {
		const identifierIndexOf = this._identifiers.indexOf(possibleIdentifier);
		return identifierIndexOf > -1;
	}

	private buildInitialGameState(): GameState {
		const initialGameState: GameState = this._identifiers
			.map((identifier) => ({
				identifier,
				position: {
					head: UNKNOWN_POINT,
					tail: UNKNOWN_POINT,
				},
				filled: [],
				draggingActive: false,
			}))
			.reduce(
				(prev, curr) => ({
					...prev,
					[String(curr.identifier)]: { ...curr },
				}),
				{}
			);

		for (let charIndex = 0; charIndex < this._scheme.length; charIndex++) {
			const possibleIdentifier: IdentifierKey = this._scheme.charAt(charIndex);
			if (this.isValidIdentifier(possibleIdentifier)) {
				if (
					initialGameState[possibleIdentifier].position.tail === UNKNOWN_POINT
				) {
					initialGameState[possibleIdentifier].position.tail = charIndex;
				} else {
					initialGameState[possibleIdentifier].position.head = charIndex;
				}
			}
		}

		return initialGameState;
	}

	private buildIdentifiers(): string[] {
		const uniqueChars: Set<string> = new Set();
		for (const char of this._scheme) {
			if (char !== "-") {
				uniqueChars.add(char);
			}
		}
		return Array.from(uniqueChars).sort();
	}
}
