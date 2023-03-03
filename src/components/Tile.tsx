import { useContext } from "react";
import { IdentifierKey } from "../service/GameService";
import { GameContext } from "./Game";
import styles from "./../assets/scss/Tile.module.scss";

export type TileProps = {
	color?: IdentifierKey;
	index: number;
};

let movingIndex: number | undefined = undefined;

export default function Tile({ index, color: thisIdentifier }: TileProps) {
	const { service, game } = useContext(GameContext);
	const colorValues = Object.values(game);
	const color: IdentifierKey | undefined = colorValues.find(
		({ position, filled }) =>
			[position.tail, position.head, ...filled].includes(index)
	)?.identifier;

	const onClickHold = (e: any) => {
		if (e.type !== "touchstart") {
			e.preventDefault();
		}
		if (color !== undefined) {
			service.updateGame({ draggingActive: true, current: index }, color);
		}
	};

	const onClickStop = () => {
		if (service.draggingColor) {
			service.updateGame({ draggingActive: false }, undefined, true);
		}
	};

	const onMouseEnter = (currentIndex?: number) => {
		const draggingColorState = colorValues.find(
			(colorState) => colorState.draggingActive
		);
		if (draggingColorState) {
			service.updateGame(
				{ current: typeof currentIndex === "number" ? currentIndex : index },
				draggingColorState.identifier
			);
		}
	};

	const tileItemClass =
		thisIdentifier === undefined ? "" : `${styles["tile__item"]}`;

	const isCurrent =
		color !== undefined &&
		index === game[color].filled?.[game[color].filled.length - 1];

	const isPopulated = Object.values(game).some((colorState) =>
		colorState.filled.includes(index)
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
