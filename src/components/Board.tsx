import { CSSProperties, useContext, useEffect } from "react";
import { IdentifierKey } from "../service/GameService";
import { GameContext } from "./Game";
import Statistics from "./Statistics";
import Tile from "./Tile";
import styles from "./../assets/scss/Board.module.scss";

export type BoardProps = {
	onRestart: () => void;
	fullScreen: boolean;
};

export type DraggingColorType = {
	color?: IdentifierKey;
	prevIndex?: number;
	currIndex?: number;
};

export default function Board(props: BoardProps) {
	const { service, game } = useContext(GameContext);
	const { fullScreen, onRestart } = props;
	const { rows, scheme, tilesCount } = service;

	const onMouseLeave = () => {
		if (service.draggingColor) {
			service.updateGame({ draggingActive: false });
		}
	};

	function getColor(index: number): IdentifierKey | undefined {
		const char = scheme.charAt(index);
		return char === "-" ? undefined : char;
	}

	useEffect(() => {
		if (service.progressPercentage === 100 && !service.draggingColor) {
			setTimeout(() => onRestart(), 125);
		}
	}, [game]);

	return (
		<div data-fullscreen={fullScreen} className={styles["board-container"]}>
			<Statistics />
			<div
				onMouseLeave={onMouseLeave}
				className={styles["board"]}
				style={{ "--rows-count": rows } as CSSProperties}
			>
				{[...Array(tilesCount)].map((_, i) => (
					<Tile key={i} index={i} color={getColor(i)} />
				))}
			</div>
		</div>
	);
}
