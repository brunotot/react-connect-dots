import React, { CSSProperties, useEffect, useMemo, useState } from "react";
import { getLargestColor, isNumber } from "../utils/BoardUtils";
import styles from "./../assets/scss/Board.module.scss";
import Statistics from "./Statistics";
import Tile, { ColorType } from "./Tile";

export type BoardProps = {
	onRestart: () => void;
	rows: number;
	scheme: string;
};

export type DraggingColorType = {
	color?: ColorType;
	prevIndex?: number;
	currIndex?: number;
};

export interface IBoardContext {
	progress: number;
	setProgress: (value: number) => void;
	largestColor: number;
	rows: number;
	gameState: GameState;
	setGameState: (
		gameState: GameState | ((value: GameState) => GameState)
	) => void;
}

export const BoardContext: React.Context<IBoardContext> = React.createContext(
	{} as any
);

export type ColorState = {
	color: number;
	idxEnd1: number;
	idxEnd2: number;
	idxDrawingLinks: number[];
	idxCurrent?: number;
	dragging: boolean;
};

export type ColorStateConfig = {
	color?: number;
	idxEnd1?: number;
	idxEnd2?: number;
	idxDrawingLinks?: number[];
	idxCurrent?: number;
	idxDrawingStart?: "idxEnd1" | "idxEnd2";
	dragging?: boolean;
};

export type GameState = ColorState[];

function buildInitialGameState(
	scheme: string,
	largestColor: number
): GameState {
	const initialGameState: GameState = [];

	for (let i = 0; i <= largestColor; i++) {
		initialGameState.push({
			color: i as ColorType,
			idxDrawingLinks: [],
			dragging: false,
			idxCurrent: undefined,
		} as unknown as ColorState);
	}

	for (let i = 0; i < scheme.length; i++) {
		const char = scheme.charAt(i);
		if (isNumber(char)) {
			const color = Number.parseInt(char);
			if (initialGameState[color].idxEnd1 === undefined) {
				initialGameState[color].idxEnd1 = i;
			} else {
				initialGameState[color].idxEnd2 = i;
			}
		}
	}

	return initialGameState;
}

export function updateGameStateGlobal(
	state: IBoardContext,
	colorState: ColorStateConfig,
	color?: ColorType
): void {
	function cloneGameState(gameState: GameState) {
		const gameStateClone = [...gameState];
		for (let i = 0; i < gameStateClone.length; i++) {
			gameStateClone[i] = { ...gameState[i] };
		}
		return gameStateClone;
	}
	const rows = state.rows;
	const clonedGameState = cloneGameState(state.gameState);
	if (color === undefined) {
		for (let i = 0; i < clonedGameState.length; i++) {
			clonedGameState[i] = {
				...clonedGameState[i],
				...colorState,
			};
		}
	} else {
		clonedGameState[color] = {
			...clonedGameState[color],
			...colorState,
		};

		const idxCurrent = colorState.idxCurrent;
		const idxDrawingLinks = clonedGameState[color].idxDrawingLinks;

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
				(idxCurrent === clonedGameState[color].idxEnd1 ||
					idxCurrent === clonedGameState[color].idxEnd2) &&
				!state.gameState[color].dragging
			) {
				idxDrawingLinks.length = 0;
			}

			const indexOfIdxCurrent = idxDrawingLinks.indexOf(idxCurrent);
			if (indexOfIdxCurrent !== -1) {
				idxDrawingLinks.length = indexOfIdxCurrent;
			}
		}

		function isFinished(): boolean {
			if (color === undefined) {
				return false;
			}
			const colorState = clonedGameState[color];
			const idxDrawingLinks = colorState.idxDrawingLinks;
			if (idxDrawingLinks.length < 2) {
				return false;
			}
			const firstIdxDrawingLink = idxDrawingLinks[0];
			const lastIdxDrawingLink = idxDrawingLinks[idxDrawingLinks.length - 1];
			return firstIdxDrawingLink === colorState.idxEnd1
				? lastIdxDrawingLink === colorState.idxEnd2
				: lastIdxDrawingLink === colorState.idxEnd1;
		}

		const isPossible =
			idxCurrent !== undefined &&
			!clonedGameState
				.filter(({ color: clr }) => clr !== color)
				.some(({ idxEnd1, idxEnd2 }) =>
					[idxEnd1, idxEnd2].includes(idxCurrent)
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

			const clashingColorState = clonedGameState
				.filter(({ color: clr }) => clr !== color)
				.find(({ idxDrawingLinks: idxDL }) => idxDL.includes(idxCurrent));
			if (clashingColorState) {
				const clashingIdxDrawingLinks = clashingColorState.idxDrawingLinks;
				const clashingIndexOfIdxCurrent =
					clashingIdxDrawingLinks.indexOf(idxCurrent);
				clashingIdxDrawingLinks.length = clashingIndexOfIdxCurrent;
			}
		}
	}
	state.setGameState(clonedGameState);
}

export default function Board(props: BoardProps) {
	const rows = props.rows;
	const tilesCount = Math.pow(rows, 2);
	const tilesArray = [...Array(tilesCount)];
	const style = { "--rows-count": rows } as CSSProperties;
	const scheme = props.scheme;
	const largestColor = getLargestColor(scheme);
	const [progress, setProgress] = useState(0);
	const initialGameState: GameState = useMemo(
		() => buildInitialGameState(scheme, largestColor),
		[]
	);
	const [gameState, setGameState] = useState(initialGameState);
	const onMouseLeave = () => {
		if (state.gameState.some(({ dragging }) => dragging)) {
			updateGameStateGlobal(state, { dragging: false });
		}
	};

	function getColor(index: number) {
		const char = scheme.charAt(index);
		return char === "-" ? undefined : (Number.parseInt(char) as ColorType);
	}

	const state: IBoardContext = {
		progress,
		setProgress,
		largestColor,
		rows,
		gameState,
		setGameState,
	};

	useEffect(() => {
		if (progress === 100) {
			setTimeout(() => props.onRestart(), 125);
		}
	}, [progress]);

	return (
		<BoardContext.Provider value={state}>
			<div className={styles["board-container"]}>
				<Statistics />
				<div
					onMouseLeave={onMouseLeave}
					className={styles["board"]}
					style={style}
				>
					{tilesArray.map((_, i) => (
						<Tile key={i} index={i} color={getColor(i)} />
					))}
				</div>
			</div>
		</BoardContext.Provider>
	);
}
