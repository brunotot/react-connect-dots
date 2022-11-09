import { loadPyodide } from "pyodide";
import script from "./script.py";

const runScript = async (code: string) => {
	const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.21.3/full/";
	const pyodide = await loadPyodide({
		indexURL: PYODIDE_URL,
	});

	return await pyodide.runPythonAsync(code);
};

const getRandomBoardScheme = async (rows: number, colors: number) => {
	let scriptText = await (await fetch(script)).text();
	scriptText = scriptText.replace("__rows__", `${rows}`);
	scriptText = scriptText.replace("__colors__", `${colors}`);
	const scriptOutput = await runScript(scriptText);
	return scriptOutput;
};

export { getRandomBoardScheme };
