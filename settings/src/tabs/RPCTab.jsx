import { useEffect, useState } from "react";

import { ListGroup } from "../components/ListGroup";
import { ListItem } from "../components/ListItem";
import { ListGroupTitle } from "../components/ListGroupTitle";

export function RPCTabView({ helper, onRPCUpdate }) {
	const [rpc, setRPC] = useState(helper.getCurrentProfile());
	const [profileId, setProfileId] = useState(helper.getCurrentProfileId());

	useEffect(() => {
		setProfileId(helper.getCurrentProfileId());
		setRPC(helper.getCurrentProfile());
	}, [helper.currentProfileId]);

	const saveRpc = () => {
		helper.setProfileById(profileId, rpc);
		onRPCUpdate();
	};
	const setDefault = () => {
		helper.setDefaultProfileById(profileId);
		setRPC({ ...rpc, isDefault: true });
		onRPCUpdate();
	};

	return (
		<>
			<ListGroupTitle title={`RPC HOST ID:${profileId}`}></ListGroupTitle>
			<ListGroup>
				<ListItem>
					<div>alias:</div>
					<input type="text" value={rpc.alias} onChange={(e) => setRPC({ ...rpc, alias: e.target.value })} placeholder="Type here" className="input w-3/5" />
				</ListItem>
				<ListItem>
					<div>rpcHost:</div>
					<input type="text" value={rpc.rpcHost} onChange={(e) => setRPC({ ...rpc, rpcHost: e.target.value })} placeholder="Type here" className="input w-3/5" />
				</ListItem>
				<ListItem>
					<div>rpcPort:</div>
					<input type="text" value={rpc.rpcPort} onChange={(e) => setRPC({ ...rpc, rpcPort: e.target.value })} placeholder="Type here" className="input w-3/5" />
				</ListItem>
				<ListItem>
					<div>use Https</div>
					<input type="checkbox" value={rpc.rpcIshttps} onChange={(e) => setRPC({ ...rpc, rpcIshttps: e.target.checked })} checked={rpc.rpcIshttps} className="toggle checked:bg-primary checked:border-primary checked:text-white" />
				</ListItem>

				<ListItem>
					<div>rpcSecret:</div>
					<input type="text" value={rpc.rpcSecret} onChange={(e) => setRPC({ ...rpc, rpcSecret: e.target.value })} placeholder="Type here" className="input w-3/5" />
				</ListItem>
				<ListItem>
					<div>rpcParameters:</div>
					<input type="text" value={rpc.rpcParameters} onChange={(e) => setRPC({ ...rpc, rpcParameters: e.target.value })} placeholder="Type here" className="input w-3/5" />
				</ListItem>
				<ListItem>
					<div>isDefault</div>
					<input type="checkbox" disabled checked={rpc.isDefault} onChange={(e) => setRPC({ ...rpc, isDefault: e.target.checked })} className="toggle checked:bg-primary checked:border-primary checked:text-white" />
				</ListItem>
				<button disabled={rpc.isDefault} onClick={setDefault} className="btn btn-accent m-2">
					设为默认
				</button>
				<button className="btn btn-primary m-2" onClick={saveRpc}>
					保存
				</button>
			</ListGroup>
		</>
	);
}
