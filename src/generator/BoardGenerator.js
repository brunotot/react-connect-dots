import { loadPyodide } from "pyodide";
import script from "./script.py";

const runScript = async (code) => {
	const PYODIDE_URL = "https://cdn.jsdelivr.net/pyodide/v0.21.3/full/";
	const pyodide = await loadPyodide({
		indexURL: PYODIDE_URL,
		stdout: () => {},
		fullStdLib: false,
	});

	return await pyodide.runPythonAsync(code);
};

const getRandomBoardScheme = async (rows, colors) => {
	let scriptText = await (await fetch(script)).text();
	scriptText = scriptText.replace("__rows__", `${rows}`);
	scriptText = scriptText.replace("__colors__", `${colors}`);
	const scriptOutput = await runScript(scriptText);
	return scriptOutput;
};

export { getRandomBoardScheme };
