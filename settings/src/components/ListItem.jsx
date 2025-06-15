export function ListItem(props) {
	const { children, className, col } = props;
	return <div className={`flex ${col ? "flex-col" : "flex-row"} justify-between items-center p-[12px] w-full ${className}`}>{children}</div>;
}
