import { getRandomBoardScheme } from "../generator/BoardGenerator";
import { createContext, useEffect, useMemo, useState } from "react";
import Board from "./Board";
import Loader from "./Loader";
import GameService, {
	GameState,
	loadGameService,
} from "../service/GameService";

export type GameProps = {
	rows: number;
	colors: number;
	scheme?: string;
	fullScreen?: boolean;
};

export type IGameContext = {
	service: GameService;
	game: GameState;
};

export const GameContext: React.Context<IGameContext> = createContext(
	{} as any
);

export default function Game({ rows, colors, scheme, fullScreen }: GameProps) {
	const [game, setGame] = useState<GameState | undefined>(undefined);
	const [restartFlag, setRestartFlag] = useState(false);
	const [service, setService] = useState<GameService | undefined>(undefined);

	useEffect(() => {
		async function load() {
			const loadedService = await loadGameService(
				rows,
				colors,
				(state) => setGame(state),
				scheme
			);
			setService(loadedService);
			loadedService.triggerChange();
		}
		setService(undefined);
		load();
	}, [rows, colors, scheme, restartFlag]);

	if (!service || !game) {
		return <Loader message={"Loading new game..."} />;
	}

	return (
		<GameContext.Provider value={{ service: service!, game: game! }}>
			<Board
				onRestart={() => setRestartFlag((prev) => !prev)}
				fullScreen={!!fullScreen}
			/>
		</GameContext.Provider>
	);
}
