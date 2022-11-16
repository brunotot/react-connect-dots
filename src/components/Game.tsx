import { getRandomBoardScheme } from "../generator/BoardGenerator";
import { useEffect, useState } from "react";
import Board from "./Board";
import Loader from "./Loader";

const LOADER_MESSAGE = "Loading game...";
const LOADER_MESSAGE_NEW = "Loading new game...";

export type GameProps = {
	rows: number;
	colors?: number;
	scheme?: string;
	fullScreen?: boolean;
};

export default function Game(props: GameProps) {
	const fullScreen = !!props.fullScreen;
	const rows = props.rows;
	const colors = props.colors;
	const [loaderMessage, setLoaderMessage] = useState(LOADER_MESSAGE);
	const [scheme, setScheme] = useState(props.scheme ?? "");

	const onRestart = () => {
		setLoaderMessage(LOADER_MESSAGE_NEW);
		setScheme("");
	};

	useEffect(() => {
		if (scheme.length === 0) {
			getRandomBoardScheme(rows, colors!).then((scheme: string) =>
				setScheme(scheme)
			);
		}
	}, [scheme]);

	return (
		<>
			{scheme.length > 0 && (
				<Board
					rows={rows}
					scheme={scheme}
					onRestart={onRestart}
					fullScreen={fullScreen}
				/>
			)}
			{scheme.length === 0 && <Loader message={loaderMessage} />}
		</>
	);
}
