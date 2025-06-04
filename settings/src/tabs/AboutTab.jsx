import aria2helperIcon from "../assets/tabIcon/o.png";
export function AboutTab({ className, onClick }) {
	return (
		<>
			<div className={`${className} select-none py-[4px] px-[6px] my-[20px] flex flex-col gap-[8px] items-center justify-start rounded-[6px]`} onClick={onClick}>
				<div className="flex justify-center items-center rounded-full bg-[#287ed1] w-[100px] h-[100px]">
					<img src={aria2helperIcon} className="w-[80px] h-[80px]" alt="" />
				</div>
				<div className="flex flex-col gap-[5px]">
					<div id="title" className="text-xl font-bold leading-6">
						Aria2 Helper
					</div>
					<div id="subTitle" className="leading-4">
						Use Aria2 Easily
					</div>
				</div>
			</div>
		</>
	);
}
