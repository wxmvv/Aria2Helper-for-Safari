export function SidebarItem({ iconSrc, title, className, selected, onClick }) {
	return (
		<div
			className={`${className} ${selected ? "bg-[var(--apple-system-accent-bg)] text-white" : ""} cursor-pointer select-none nav-tab py-[4px] px-[6px] flex flex-row gap-[10px] items-center justify-start rounded-[6px]`}
			onClick={onClick}
		>
			{iconSrc && <img src={iconSrc} className="w-5 h-5" alt="" />}
			<span className="leading-5">{title}</span>
		</div>
	);
}

export function SidebarProfile({ iconSrc, title, subTitle, className, selected, onClick }) {
	return (
		<div
			className={`${className} ${selected ? "bg-[var(--apple-system-accent-bg)] text-white" : ""} cursor-pointer select-none nav-tab py-[4px] px-[6px] flex flex-row gap-[8px] items-center justify-start rounded-[6px]`}
			onClick={onClick}
		>
			{iconSrc && (
				<div className="flex justify-center items-center rounded-full bg-[#287ed1] w-[40px] h-[40px]">
					<img src={iconSrc} className="w-[30px] h-[30px]" alt="" />
				</div>
			)}
			<div className="flex flex-col gap-[2px]">
				<div className="leading-5 text-[1rem]">{title}</div>
				<div className="leading-4 text-[.7rem]">{subTitle}</div>
			</div>
		</div>
	);
}
