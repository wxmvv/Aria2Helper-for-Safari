import { useEffect, useMemo, useState } from "react";

import core from "../lib/core.js";
import { ListGroup } from "../components/ListGroup";
import { ListItem } from "../components/ListItem";
import { ListGroupTitle } from "../components/ListGroupTitle";
import { t } from "../utils/i18n";

const { constants, storage, util } = core;

const EMPTY_PROFILE = {
	alias: "aria2",
	rpcHost: "127.0.0.1",
	rpcPort: "6800",
	rpcPath: "/jsonrpc",
	rpcIshttps: false,
	rpcSecret: "",
	dir: "",
	header: [],
	isDefault: true,
};

function presetProfile(candidate) {
	return {
		...EMPTY_PROFILE,
		alias: candidate.alias || candidate.label || "aria2",
		rpcHost: candidate.rpcHost || candidate.host || "127.0.0.1",
		rpcPort: String(candidate.rpcPort || candidate.port || ""),
		rpcPath: candidate.rpcPath || "/jsonrpc",
		rpcIshttps: Boolean(candidate.rpcIshttps),
		rpcSecret: candidate.rpcSecret || "",
	};
}

export function WelcomeTab({ helper, onConfigured }) {
	const current = helper.getCurrentProfile();
	const initial = current && storage.hasUsableProfile(current) ? current : EMPTY_PROFILE;
	const [profile, setProfile] = useState({ ...initial, ...EMPTY_PROFILE, ...(current || {}) });
	const [status, setStatus] = useState({ state: "idle", message: "" });
	const [engine, setEngine] = useState(null);
	const [scanning, setScanning] = useState(false);
	const [candidates, setCandidates] = useState([]);
	const [rpcUrl, setRpcUrl] = useState("");
	const [copied, setCopied] = useState("");
	const [saved, setSaved] = useState(false);

	const presets = useMemo(() => constants.LOCAL_ENGINE_CANDIDATES.slice(0, 3), []);
	const installCommand = "brew install aria2";
	const runCommand = 'aria2c --enable-rpc --rpc-listen-all=false --rpc-secret="YOUR_SECRET"';

	useEffect(() => {
		setSaved(false);
	}, [profile.rpcHost, profile.rpcPort, profile.rpcSecret]);

	const update = (patch) => setProfile((value) => ({ ...value, ...patch }));

	const copy = async (text, key) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(key);
			setTimeout(() => setCopied(""), 1500);
		} catch {
			setCopied("");
		}
	};

	const parseRpcUrl = () => {
		if (!rpcUrl.trim()) return;
		let url;
		try {
			url = new URL(rpcUrl.trim());
		} catch {
			setStatus({ state: "error", message: t("setup_parse_failed") });
			return;
		}
		if (!/^https?:$/.test(url.protocol)) {
			setStatus({ state: "error", message: t("setup_parse_failed") });
			return;
		}
		update({
			rpcHost: url.hostname,
			rpcPort: url.port || (url.protocol === "https:" ? "443" : "80"),
			rpcPath: url.pathname || "/jsonrpc",
			rpcIshttps: url.protocol === "https:",
		});
		setStatus({ state: "idle", message: "" });
	};

	const scan = async () => {
		setScanning(true);
		setCandidates([]);
		setStatus({ state: "idle", message: "" });
		try {
			const found = await helper.discoverEngines(profile.rpcSecret);
			setCandidates(found.filter((item) => item.reachable));
			if (!found.some((item) => item.reachable)) setStatus({ state: "error", message: t("setup_scan_none") });
		} catch (error) {
			setStatus({ state: "error", message: error.message || String(error) });
		} finally {
			setScanning(false);
		}
	};

	const applyCandidate = (candidate) => {
		setProfile((value) => ({
			...value,
			alias: candidate.alias || candidate.label || value.alias,
			rpcHost: candidate.rpcHost,
			rpcPort: String(candidate.rpcPort),
			rpcPath: candidate.rpcPath || "/jsonrpc",
			rpcIshttps: Boolean(candidate.rpcIshttps),
		}));
		setEngine(candidate.version || null);
		if (candidate.requiresSecret) setStatus({ state: "warning", message: t("setup_secret_required") });
		else setStatus({ state: "ok", message: `${candidate.version ? candidate.version.product : candidate.label} ${candidate.version ? candidate.version.version : ""}`.trim() });
	};

	const test = async () => {
		if (!profile.rpcHost || !profile.rpcPort) {
			setStatus({ state: "error", message: t("setup_required") });
			return;
		}
		setStatus({ state: "testing", message: t("setup_testing") });
		try {
			const result = await helper.testProfile(profile);
			setEngine(result.version);
			setStatus({ state: "ok", message: `${result.version.product} ${result.version.version}`.trim() });
		} catch (error) {
			setEngine(null);
			setStatus({ state: "error", message: error.message || String(error) });
		}
	};

	const save = () => {
		if (!profile.rpcHost || !profile.rpcPort) {
			setStatus({ state: "error", message: t("setup_required") });
			return;
		}
		const currentId = helper.getCurrentProfileId();
		const existing = helper.getProfileById(currentId);
		const profileId = existing && !storage.hasUsableProfile(existing) ? currentId : util.randomId();
		helper.saveProfile(profileId, profile, true);
		setSaved(true);
		setStatus({ state: "ok", message: t("setup_saved") });
		if (onConfigured) onConfigured(profileId);
	};

	const statusClass =
		status.state === "error" ? "alert-error" : status.state === "warning" ? "alert-warning" : status.state === "ok" ? "alert-success" : "alert-info";

	return (
		<>
			<ListGroupTitle title={t("setup_title")} />
			<div className="wizard-intro mb-[16px]">{t("setup_intro")}</div>

			{status.message && (
				<div role="status" className={`alert ${statusClass} mb-[16px] text-sm`}>
					<span>{status.message}</span>
				</div>
			)}

			<div className="wizard-steps mb-[16px]">
				<div className="wizard-step">
					<div className="wizard-step-index">1</div>
					<div>
						<div className="font-semibold">{t("setup_step_install")}</div>
						<code className="wizard-command">{installCommand}</code>
						<button className="btn btn-xs ml-2" onClick={() => copy(installCommand, "install")}>
							{copied === "install" ? t("setup_copied") : t("setup_copy")}
						</button>
						<code className="wizard-command">{runCommand}</code>
						<button className="btn btn-xs ml-2" onClick={() => copy(runCommand, "run")}>
							{copied === "run" ? t("setup_copied") : t("setup_copy")}
						</button>
						<div className="wizard-note">{t("setup_install_next")}</div>
					</div>
				</div>
				<div className="wizard-step">
					<div className="wizard-step-index">2</div>
					<div className="grow">
						<div className="font-semibold">{t("setup_step_connect")}</div>
						<div className="wizard-note">{t("setup_secret_hint")}</div>
					</div>
				</div>
				<div className="wizard-step">
					<div className="wizard-step-index">3</div>
					<div>
						<div className="font-semibold">{t("setup_step_enable")}</div>
						<div className="wizard-note">{t("setup_enable_hint")}</div>
					</div>
				</div>
			</div>

			<ListGroupTitle title={t("setup_preset")} />
			<div className="flex flex-row flex-wrap gap-2 mb-[16px]">
				{presets.map((preset) => (
					<button key={preset.id} className="btn btn-sm" onClick={() => setProfile((value) => ({ ...value, ...presetProfile(preset) }))}>
						{preset.label}
					</button>
				))}
				<button className="btn btn-sm btn-outline btn-primary" onClick={scan} disabled={scanning}>
					{scanning ? t("setup_scanning") : t("setup_scan")}
				</button>
			</div>

			{candidates.length > 0 && (
				<div className="scan-results mb-[16px]">
					{candidates.map((candidate) => (
						<button key={`${candidate.rpcHost}:${candidate.rpcPort}`} className="scan-result" onClick={() => applyCandidate(candidate)}>
							<span className="font-semibold">{candidate.label}</span>
							<span className="text-xs opacity-70">
								{candidate.rpcHost}:{candidate.rpcPort}
							</span>
							<span className="text-xs">{candidate.version ? `${candidate.version.product} ${candidate.version.version}` : candidate.requiresSecret ? t("setup_secret_required") : ""}</span>
						</button>
					))}
				</div>
			)}

			<ListGroup>
				<ListItem>
					<div>{t("setup_paste_url")}</div>
					<div className="flex flex-row gap-2 w-3/5">
						<input className="input grow" value={rpcUrl} onChange={(event) => setRpcUrl(event.target.value)} placeholder={t("setup_paste_url_hint")} />
						<button className="btn btn-sm" onClick={parseRpcUrl}>
							{t("confirm")}
						</button>
					</div>
				</ListItem>
				<ListItem>
					<div>{t("alias")}</div>
					<input className="input w-3/5" value={profile.alias} onChange={(event) => update({ alias: event.target.value })} placeholder={t("input_alias")} />
				</ListItem>
				<ListItem>
					<div>{t("rpc_host")}</div>
					<input className="input w-3/5" value={profile.rpcHost} onChange={(event) => update({ rpcHost: event.target.value })} placeholder={t("host_example")} />
				</ListItem>
				<ListItem>
					<div>{t("rpc_port")}</div>
					<input className="input w-3/5" value={profile.rpcPort} onChange={(event) => update({ rpcPort: event.target.value })} placeholder={t("port_example")} />
				</ListItem>
				<ListItem>
					<div>{t("rpc_secret")}</div>
					<input
						className="input w-3/5"
						type="password"
						value={profile.rpcSecret}
						onChange={(event) => update({ rpcSecret: event.target.value })}
						placeholder={t("input_secret")}
					/>
				</ListItem>
				<ListItem>
					<div>{t("rpc_is_https")}</div>
					<input
						type="checkbox"
						className="toggle checked:bg-primary checked:border-primary checked:text-white"
						checked={profile.rpcIshttps}
						onChange={(event) => update({ rpcIshttps: event.target.checked })}
					/>
				</ListItem>
				<ListItem>
					<div>{t("dir_--dir")}</div>
					<input className="input w-3/5" value={profile.dir} onChange={(event) => update({ dir: event.target.value })} placeholder={t("dir_placeholder")} />
				</ListItem>
				<ListItem>
					<div className="wizard-note">{t("setup_secret_hint")}</div>
				</ListItem>
			</ListGroup>

			{engine && (
				<div className="engine-card mb-[16px]">
					<div className="font-semibold">
						{t("engine_info")}: {engine.product} {engine.version}
					</div>
					<div className="text-xs opacity-70">RPC {engine.rpcVersion}</div>
					{engine.enabledFeatures && engine.enabledFeatures.length > 0 && <div className="text-xs mt-1">{engine.enabledFeatures.join(" · ")}</div>}
				</div>
			)}

			<div className="flex flex-row gap-2">
				<button className="btn btn-outline btn-primary" onClick={test} disabled={status.state === "testing"}>
					{status.state === "testing" ? t("setup_testing") : t("setup_test")}
				</button>
				<button className="btn btn-primary" onClick={save} disabled={saved}>
					{saved ? t("setup_saved") : t("setup_save")}
				</button>
			</div>
		</>
	);
}
