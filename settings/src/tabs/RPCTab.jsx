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
	const [testState, setTestState] = useState({ state: "idle", message: "" });
	const [engine, setEngine] = useState(null);

	useEffect(() => {
		setProfileId(helper.getCurrentProfileId());
		setRPC(helper.getCurrentProfile());
		setTestState({ state: "idle", message: "" });
		setEngine(null);
	}, [helper, helper.currentProfileId]);

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

	const testConnection = async () => {
		setTestState({ state: "testing", message: t("setup_testing") });
		try {
			const result = await helper.testProfile(rpc);
			setEngine(result.version);
			setTestState({ state: "ok", message: `${result.version.product} ${result.version.version}`.trim() });
		} catch (error) {
			setEngine(null);
			setTestState({ state: "error", message: error.message || String(error) });
		}
	};

	if (!rpc) return null;

	const testClass = testState.state === "error" ? "alert-error" : testState.state === "ok" ? "alert-success" : "alert-info";

	return (
		<>
			<ListGroupTitle title={t("rpc_host")}></ListGroupTitle>
			<div className="text-sm text-gray-500/60">{`ID:${profileId}`}</div>
			<div role="alert" className={`fixed top-[20px] alert alert-success transition-all z-[999] ${showAlert ? "opacity-100 h-[50px]" : "opacity-0 h-0"}`}>
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
					<input type="text" value={rpc.rpcHost} onChange={(e) => setRPC({ ...rpc, rpcHost: e.target.value })} placeholder={t("host_example")} className="input w-3/5" />
				</ListItem>
				<ListItem>
					<div>{t("rpc_port")}</div>
					<input type="text" value={rpc.rpcPort} onChange={(e) => setRPC({ ...rpc, rpcPort: e.target.value })} placeholder={t("port_example")} className="input w-3/5" />
				</ListItem>
				<ListItem>
					<div>{t("rpc_is_https")}</div>
					<input
						type="checkbox"
						checked={Boolean(rpc.rpcIshttps)}
						onChange={(e) => setRPC({ ...rpc, rpcIshttps: e.target.checked })}
						className="toggle checked:bg-primary checked:border-primary checked:text-white"
					/>
				</ListItem>
				<ListItem>
					<div>{t("rpc_secret")}</div>
					<div className="flex flex-row gap-2 w-3/5 items-center">
						<input
							type={isShowPassword ? "text" : "password"}
							value={rpc.rpcSecret || ""}
							onChange={(e) => setRPC({ ...rpc, rpcSecret: e.target.value })}
							placeholder={t("input_secret")}
							className="input grow"
							autoComplete="off"
						/>
						<button className="btn btn-ghost w-12 p-0 fill-accent" onClick={() => setIsShowPassword(!isShowPassword)} aria-label={t(isShowPassword ? "hide_password" : "show_password")}>
							{isShowPassword ? <EyeSlash width={24} height={24} color={"inhert"} /> : <Eye width={24} height={24} color={"inhert"} />}
						</button>
					</div>
				</ListItem>
				<ListItem>
					<div>{t("default")}</div>
					<input type="checkbox" disabled checked={Boolean(rpc.isDefault)} className="toggle checked:bg-primary checked:border-primary checked:text-white" />
				</ListItem>
				<div className="flex flex-wrap flex-row gap-2 p-2">
					<button className="btn btn-outline btn-primary" onClick={testConnection} disabled={testState.state === "testing"}>
						{testState.state === "testing" ? t("setup_testing") : t("rpc_test")}
					</button>
					<button disabled={rpc.isDefault} onClick={setDefault} className="btn">
						{t("set_default")}
					</button>
					<button className="btn btn-primary" onClick={saveRpc}>
						{t("save")}
					</button>
				</div>
			</ListGroup>

			{testState.message && (
				<div role="status" className={`alert ${testClass} mb-[16px] text-sm`}>
					<span>
						{testState.state === "ok" ? `${t("setup_connected")}: ` : ""}
						{testState.message}
					</span>
				</div>
			)}
			{engine && (
				<div className="engine-card mb-[16px]">
					<div className="font-semibold">
						{t("engine_info")}: {engine.product} {engine.version}
					</div>
					<div className="text-xs opacity-70">RPC {engine.rpcVersion}</div>
					{engine.enabledFeatures && engine.enabledFeatures.length > 0 && <div className="text-xs mt-1">{engine.enabledFeatures.join(" · ")}</div>}
					{engine.isAria2Next && <div className="text-xs mt-1 opacity-70">filename hints · torrent inspection · probe</div>}
				</div>
			)}

			<ListGroupTitle title={t("rpc_advanced")}></ListGroupTitle>
			<ListGroup>
				<ListItem col className="items-start">
					<div>{t("dir_--dir")}</div>
					<input type="text" value={rpc.dir || ""} onChange={(e) => setRPC({ ...rpc, dir: e.target.value })} placeholder="" className="input w-full" />
					<div className="label whitespace-break-spaces">{t("dir_placeholder")}</div>
					<div className="label whitespace-break-spaces">{t("dir_notice")}</div>
				</ListItem>
				<ListItem col className="items-start">
					<div className="w-full">
						<fieldset className="fieldset">
							<legend className="text-base">{t("header_--header")}</legend>
							<textarea
								value={Array.isArray(rpc.header) ? rpc.header.join("\n") : ""}
								onChange={(e) => setRPC({ ...rpc, header: e.target.value.split("\n") })}
								className="textarea h-24 w-full"
								placeholder={"Referer: https://example.com"}
							></textarea>
						</fieldset>
						<div className="label whitespace-break-spaces">{t("header_notice")}</div>
					</div>
				</ListItem>
			</ListGroup>
		</>
	);
}
