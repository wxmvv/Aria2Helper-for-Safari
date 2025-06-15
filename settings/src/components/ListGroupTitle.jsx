export function ListGroupTitle(props) {
	const { title, className } = props;
	return <div className={`font-semibold mb-[12px] ${className}`}>{title}</div>;
}
