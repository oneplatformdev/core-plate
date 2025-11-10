import { createRoot } from "react-dom/client";
const App = () => {
	return (
		<div>
			app
		</div>
	)
}

const rootId = "root";
const container = document.getElementById(rootId)!;
createRoot(container).render(<App/>);