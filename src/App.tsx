import Game from "./components/Game";
import * as qs from "query-string";

function App() {
	const queryParams = qs.parse(location.search);
	const fullScreen = queryParams["fullscreen"] === "true";
	return <Game rows={10} colors={5} fullScreen={fullScreen} />;
}

export default App;
