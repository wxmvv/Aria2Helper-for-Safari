import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

import Helper from "./Helper.js";
import { ThemeProviders } from "./components/ThemeProviders.jsx";

const helper = new Helper();
const root = createRoot(document.getElementById("root"));

// 等待初始化完成后再渲染
helper.init().then(() => {
	root.render(
		<StrictMode>
			<ThemeProviders>
				<App helper={helper} />
			</ThemeProviders>
		</StrictMode>
	);
});
