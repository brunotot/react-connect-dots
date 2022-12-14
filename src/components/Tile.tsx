import { useContext } from "react";
import styles from "./../assets/scss/Tile.module.scss";
import { BoardContext, ColorStateConfig, updateGameStateGlobal } from "./Board";

export type ColorType = undefined | 0 | 1 | 2 | 3 | 4;

export type TileProps = {
	color?: ColorType;
	index: number;
};

let movingIndex: number | undefined = undefined;

export default function Tile(props: TileProps) {
	const state = useContext(BoardContext);
	const index = props.index;
	const color: ColorType = getColor();

	function getColor(): ColorType {
		return state.gameState.find(({ idxEnd1, idxEnd2, idxDrawingLinks }) =>
			[idxEnd1, idxEnd2, ...idxDrawingLinks].includes(index)
		)?.color as ColorType;
	}

	function updateGameState(
		colorState: ColorStateConfig,
		color?: ColorType
	): void {
		updateGameStateGlobal(state, colorState, color);
	}

	const onClickHold = (e: any) => {
		if (e.type !== "touchstart") {
			e.preventDefault();
		}
		if (color !== undefined) {
			updateGameState({ dragging: true, idxCurrent: index }, color);
		}
	};

	const onClickStop = () => {
		if (state.gameState.some(({ dragging }) => dragging)) {
			updateGameState({ dragging: false });
		}
	};

	const onMouseEnter = (currentIndex?: number) => {
		const draggingColorState = state.gameState.find(
			(colorState) => colorState.dragging
		);
		if (draggingColorState) {
			const draggingColorType = draggingColorState.color as ColorType;
			updateGameState(
				{ idxCurrent: typeof currentIndex === "number" ? currentIndex : index },
				draggingColorType
			);
		}
	};

	const tileItemClass =
		props.color === undefined ? "" : `${styles["tile__item"]}`;

	const isCurrent =
		color !== undefined &&
		index ===
			state.gameState[color].idxDrawingLinks?.[
				state.gameState[color].idxDrawingLinks.length - 1
			];

	const isPopulated = state.gameState.some((colorState) =>
		colorState.idxDrawingLinks.includes(index)
	);

	const onTouchStart = (e: any) => {
		movingIndex = index;
		onClickHold(e);
	};

	const onTouchEnd = () => {
		movingIndex = undefined;
		onClickStop();
	};

	const onTouchMove = (e: any) => {
		const touch = e.touches[0];
		const { clientX, clientY } = touch;
		const elemInTouchPos = document.elementFromPoint(clientX, clientY);
		const elemInTouchPosIndexString =
			elemInTouchPos?.getAttribute("data-index");
		if (typeof elemInTouchPosIndexString === "string") {
			const elemInTouchPosIndex = parseInt(elemInTouchPosIndexString);
			if (movingIndex !== elemInTouchPosIndex) {
				movingIndex = elemInTouchPosIndex;
				onMouseEnter(elemInTouchPosIndex);
			}
		}
	};

	return (
		<div
			onMouseEnter={() => onMouseEnter()}
			onMouseDown={onClickHold}
			onMouseUp={onClickStop}
			onTouchMove={onTouchMove}
			onTouchStart={onTouchStart}
			onTouchEnd={onTouchEnd}
			className={`${styles["tile"]} ${tileItemClass}`}
			data-color={color}
			data-populated={isPopulated ? "" : undefined}
			data-current={isCurrent ? "" : undefined}
			data-index={index}
		></div>
	);
}
