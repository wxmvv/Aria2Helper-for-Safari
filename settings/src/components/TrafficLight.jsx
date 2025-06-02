export function TrafficLight({ className }) {
	return (
		<div id="traffic-light" className={`${className} flex flex-row justify-center items-center gap-[8px]`}>
			<div className="traffic-light-dot w-[12px] h-[12px] rounded-[50%] bg-red-500"></div>
			<div className="traffic-light-dot w-[12px] h-[12px] rounded-[50%] bg-yellow-500"></div>
			<div className="traffic-light-dot w-[12px] h-[12px] rounded-[50%] bg-green-500"></div>
		</div>
	);
}
