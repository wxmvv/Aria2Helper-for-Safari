export function ListGroup(props) {
	const { children, className } = props;
	return <div className={`${className} flex flex-col border-gray-400 rounded-xl border bg-blue-200`}>{children}</div>;
}
