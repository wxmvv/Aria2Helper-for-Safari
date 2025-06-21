import { useEffect, useState } from "react";

import { ListGroup } from "../components/ListGroup";
import { ListItem } from "../components/ListItem";
import { ListGroupTitle } from "../components/ListGroupTitle";
import { Eye, EyeSlash } from "../icon/eye";
import { t } from "../utils/i18n";

export function RPCTabView({ helper, onRPCUpdate }) {
	const [rpc, setRPC] = useState(helper.getCurrentProfile());
	const [profileId, setProfileId] = useState(helper.getCurrentProfileId());
	const [showAlert, setShowAlert] = useState(false);

	const [isShowPassword, setIsShowPassword] = useState(false);

	useEffect(() => {
		setProfileId(helper.getCurrentProfileId());
		setRPC(helper.getCurrentProfile());
	}, [helper.currentProfileId]);

	const saveRpc = () => {
		helper.setProfileById(profileId, rpc);
		setShowAlert(true);
		setTimeout(() => setShowAlert(false), 5000);
		onRPCUpdate();
	};
	const setDefault = () => {
		helper.setDefaultProfileById(profileId);
		setRPC({ ...rpc, isDefault: true });
		onRPCUpdate();
	};

	return (
		<>
			<ListGroupTitle title={t("rpc_host")}></ListGroupTitle>
			<div className="text-sm text-gray-500/20">{`ID:${profileId}`}</div>
			<div role="alert" className={`fixed top-[20px] alert alert-success transition-all ${showAlert ? "opacity-100 h-[50px]" : "opacity-0 h-0"}`}>
				<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<span>{t("save_profile_alert")}</span>
			</div>
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
					{/* 显示星号 */}
					<div className="flex flex-row gap-2 w-3/5 items-center">
						<input type={isShowPassword ? "text" : "password"} value={rpc.rpcSecret} onChange={(e) => setRPC({ ...rpc, rpcSecret: e.target.value })} placeholder={t("input_secret")} className="input grow" />
						<button className="btn btn-ghost w-12 p-0 fill-accent" onClick={() => setIsShowPassword(!isShowPassword)}>
							{isShowPassword ? <EyeSlash width={24} height={24} color={"inhert"} /> : <Eye width={24} height={24} color={"inhert"} />}
						</button>
					</div>
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
			<ListGroupTitle title={t("rpc_advanced")}></ListGroupTitle>
			<ListGroup>
				{/* <ListItem>
					<div className="w-full">
						<fieldset className="fieldset">
							<legend className="fieldset-legend">{t("rpc_parameters")}</legend>
							<textarea value={rpc.rpcParameters} onChange={(e) => setRPC({ ...rpc, rpcParameters: e.target.value })} className="textarea h-24 w-full" placeholder={t("parameters_example")}></textarea>
						</fieldset>
					</div>
				</ListItem> */}
				{/* TODO RPC参数 */}
				<ListItem col className="items-start">
					<div className="">{t("dir_--dir")}</div>
					<input type="text" value={rpc.dir} onChange={(e) => setRPC({ ...rpc, dir: e.target.value })} placeholder="" className="input w-full" />
					<div className="label whitespace-break-spaces">{t("dir_placeholder")}</div>
					<div className="label whitespace-break-spaces">{t("dir_notice")}</div>
				</ListItem>
				<ListItem col className="items-start">
					<div className="w-full">
						<fieldset className="fieldset">
							<legend className="text-base">{t("header_--header")}</legend>
							<textarea
								value={rpc.header && Array.isArray(rpc.header) && rpc.header.join("\n")}
								onChange={(e) => setRPC({ ...rpc, header: e.target.value.split("\n") })}
								className="textarea h-24 w-full"
								placeholder=""
							></textarea>
						</fieldset>
						<div className="label whitespace-break-spaces">{t("header_notice")}</div>
					</div>
				</ListItem>
			</ListGroup>
		</>
	);
}
