export function RPCTabView({ helper }) {
	const profile = helper.getCurrentProfile();
	const profileId = helper.getCurrentProfileId();
	return (
		<>
			<div>
				<h2>RPC</h2>
				<div>profileId:{profileId}</div>
				<div>alias:{profile.alias}</div>
				<div>rpcHost:{profile.rpcHost}</div>
				<div>rpcIshttps:{profile.rpcIshttps === true ? "true" : "false"}</div>
				<div>rpcPort:{profile.rpcPort}</div>
				<div>rpcSecret:{profile.rpcSecret}</div>
				<div>rpcParameters:{profile.rpcParameters}</div>
				<div>isDefault:{profile.isDefault === true ? "true" : "false"}</div>
			</div>
		</>
	);
}
