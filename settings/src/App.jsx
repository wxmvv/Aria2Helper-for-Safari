import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";

import Aria2helperTab from "./aria2helperTab";
import Aria2Tab from "./aria2Tab";
import OthersTab from "./othersTab";

function App() {
	const [count, setCount] = useState(0);

	return (
		<>
			<div className="md:p-20 w-full h-full">
				<div className="tabs tabs-box">
					<input type="radio" name="my_tabs_6" className="tab" aria-label="ARIA2Helper" />
					<div className="tab-content bg-base-100 border-base-300 p-6">
						<Aria2helperTab></Aria2helperTab>
					</div>
					<input type="radio" name="my_tabs_6" className="tab" aria-label="ARIA2" defaultChecked />
					<div className="tab-content bg-base-100 border-base-300 p-6">
						<Aria2Tab></Aria2Tab>
					</div>
					<input type="radio" name="my_tabs_6" className="tab" aria-label="Others" />
					<div className="tab-content bg-base-100 border-base-300 p-6">
						<OthersTab></OthersTab>
					</div>
				</div>
			</div>
		</>
	);
}

export default App;
