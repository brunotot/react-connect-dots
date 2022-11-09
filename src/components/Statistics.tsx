import styles from "./../assets/scss/Statistics.module.scss";
import { useContext, useEffect, useState } from "react";
import { BoardContext } from "./Board";

export default function Statistics() {
	const { gameState, rows, largestColor, progress, setProgress } =
		useContext(BoardContext);
	const colorCount = largestColor + 1;
	const tilesCount = Math.pow(rows, 2);
	const [flows, setFlows] = useState(0);

	function calculateProgress(): number {
		const filledCount = gameState.reduce(
			(prev, curr) => prev + curr.idxDrawingLinks.length,
			0
		);
		return Math.floor((filledCount / tilesCount) * 100);
	}

	function calculateFlows(): number {
		return gameState.filter(({ idxDrawingLinks, idxEnd1, idxEnd2 }) => {
			if (idxDrawingLinks.length < 2) {
				return false;
			}
			const firstIdxDrawingLink = idxDrawingLinks[0];
			const lastIdxDrawingLink = idxDrawingLinks[idxDrawingLinks.length - 1];
			return firstIdxDrawingLink === idxEnd1
				? lastIdxDrawingLink === idxEnd2
				: lastIdxDrawingLink === idxEnd1;
		}).length;
	}

	useEffect(() => {
		setFlows(calculateFlows());
		setProgress(calculateProgress());
	}, gameState);

	return (
		<div className={styles["stats"]}>
			<div className={styles["stats-box"]}>
				<span className={styles["white"]}>Flows:</span>
				<span className={styles["yellow"]}>
					{flows}/{colorCount}
				</span>
			</div>
			<div className={styles["stats-box"]}>
				<span className={styles["white"]}>Pipe:</span>
				<span className={styles["lightblue"]}>{progress}%</span>
			</div>
		</div>
	);
}
