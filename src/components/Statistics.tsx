import styles from "./../assets/scss/Statistics.module.scss";
import { useContext, useEffect, useState } from "react";
import { GameContext } from "./Game";

export default function Statistics() {
	const { service, game } = useContext(GameContext);
	const { progressPercentage, colorCount } = service;
	const [flows, setFlows] = useState(0);

	function calculateFlows(): number {
		return Object.values(game).filter(({ filled, position }) => {
			if (filled.length < 2) {
				return false;
			}
			const firstIdxDrawingLink = filled[0];
			const lastIdxDrawingLink = filled[filled.length - 1];
			return firstIdxDrawingLink === position.tail
				? lastIdxDrawingLink === position.head
				: lastIdxDrawingLink === position.tail;
		}).length;
	}

	useEffect(() => {
		setFlows(calculateFlows());
	}, [game]);

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
				<span className={styles["lightblue"]}>{progressPercentage}%</span>
			</div>
		</div>
	);
}
