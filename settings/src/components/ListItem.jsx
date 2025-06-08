export function ListItem(props) {
	const { children, className } = props;
	return <div className={`${className} flex flex-col justify-center items-center p-[12px] w-full`}>{children}</div>;
}
