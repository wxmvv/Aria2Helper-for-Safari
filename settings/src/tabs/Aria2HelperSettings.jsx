import { useRef, useEffect, useState } from "react";
import { ListGroup } from "../components/ListGroup";

function Aria2HelperSettings() {
	const [isChecked, setIsChecked] = useState(false);
	return (
		<>
			<ListGroup>
				<h2 className="">Aria2helperSettings</h2>
				<p>Aria2helper相关设置</p>
			</ListGroup>
		</>
	);
}

export default Aria2HelperSettings;
