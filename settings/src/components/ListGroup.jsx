export function ListGroup(props) {
	const { children, className } = props;
	return <div className={`mb-[20px] ${className} flex flex-col border-gray-500/50 rounded-xl border divide-y divide-gray-500/50`}>{children}</div>;
}
