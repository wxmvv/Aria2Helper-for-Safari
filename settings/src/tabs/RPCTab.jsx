import { useEffect, useState } from "react";

import { ListGroup } from "../components/ListGroup";
import { ListItem } from "../components/ListItem";
import { ListGroupTitle } from "../components/ListGroupTitle";
import { t } from "../utils/i18n";

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
			<ListGroupTitle title="RPC HOST"></ListGroupTitle>
			<div className="text-sm text-gray-500/20">{`ID:${profileId}`}</div>
			<ListGroup>
				<ListItem>
					<div>{t("alias")}</div>
					<input type="text" value={rpc.alias} onChange={(e) => setRPC({ ...rpc, alias: e.target.value })} placeholder={t("input_alias")} className="input w-3/5" />
				</ListItem>
				<ListItem>
					<div>{t("rpc_host")}</div>
					{/* TODO 如果没输入则默认localhost */}
					<input type="text" value={rpc.rpcHost} onChange={(e) => setRPC({ ...rpc, rpcHost: e.target.value })} placeholder={t("host_example")} className="input w-3/5" />
				</ListItem>
				<ListItem>
					<div>{t("rpc_port")}</div>
					<input type="text" value={rpc.rpcPort} onChange={(e) => setRPC({ ...rpc, rpcPort: e.target.value })} placeholder={t("port_example")} className="input w-3/5" />
				</ListItem>
				<ListItem>
					<div>{t("rpc_is_https")}</div>
					<input type="checkbox" value={rpc.rpcIshttps} onChange={(e) => setRPC({ ...rpc, rpcIshttps: e.target.checked })} checked={rpc.rpcIshttps} className="toggle checked:bg-primary checked:border-primary checked:text-white" />
				</ListItem>

				<ListItem>
					<div>{t("rpc_secret")}</div>
					<input type="text" value={rpc.rpcSecret} onChange={(e) => setRPC({ ...rpc, rpcSecret: e.target.value })} placeholder={t("input_secret")} className="input w-3/5" />
				</ListItem>
				<ListItem>
					<div>{t("default")}</div>
					<input type="checkbox" disabled checked={rpc.isDefault} onChange={(e) => setRPC({ ...rpc, isDefault: e.target.checked })} className="toggle checked:bg-primary checked:border-primary checked:text-white" />
				</ListItem>
				<button disabled={rpc.isDefault} onClick={setDefault} className="btn btn-accent m-2">
					{t("set_default")}
				</button>
				<button className="btn btn-primary m-2" onClick={saveRpc}>
					{t("save")}
				</button>
			</ListGroup>
			<ListGroupTitle title="Advanced"></ListGroupTitle>
			<ListGroup>
				{/* <ListItem>
					<div className="w-full">
						<fieldset className="fieldset">
							<legend className="fieldset-legend">{t("rpc_parameters")}</legend>
							<textarea value={rpc.rpcParameters} onChange={(e) => setRPC({ ...rpc, rpcParameters: e.target.value })} className="textarea h-24 w-full" placeholder={t("parameters_example")}></textarea>
						</fieldset>
					</div>
				</ListItem> */}
				{/* TODO 保存提示 */}
				{/* TODO RPC参数 */}
				<ListItem col className="items-start">
					<div className="">out 下载文件夹</div>
					<input type="text" value={rpc.out} onChange={(e) => setRPC({ ...rpc, out: e.target.value })} placeholder="如何服务的下载地址" className="input w-full" />
					<div className="label">*输入错误会导致下载失败</div>
				</ListItem>
				<ListItem col className="items-start">
					<div className="w-full">
						<fieldset className="fieldset">
							<legend className="text-base">header 请求头</legend>
							<textarea value={rpc.header} onChange={(e) => setRPC({ ...rpc, header: e.target.value })} className="textarea h-24 w-full" placeholder=""></textarea>
						</fieldset>
					</div>
					{/* <div>header 请求头</div> */}
					{/* <input type="text" value={rpc.out} onChange={(e) => setRPC({ ...rpc, out: e.target.value })} placeholder="输入下载地址" className="input w-full" /> */}
				</ListItem>
			</ListGroup>
		</>
	);
}
