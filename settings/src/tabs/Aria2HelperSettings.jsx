import { useRef, useEffect, useState } from "react";

import { ListGroup } from "../components/ListGroup";
import { ListItem } from "../components/ListItem";
import { ListGroupTitle } from "../components/ListGroupTitle";
import { extensions } from "../utils/extension";
import { t } from "../utils/i18n";

function Aria2HelperSettings({ helper }) {
	const [showBadge, setShowBadge] = useState(helper.getSettings().showBadge);
	const [showNotification, setShowNotification] = useState(helper.getSettings().showNotification);
	const [listenDownloads, setListenDownloads] = useState(helper.getSettings().listenDownloads);
	const [whitelist, setWhitelist] = useState(helper.getWhitelist().toString() || "");
	const [blacklist, setBlacklist] = useState(helper.getBlacklist().toString() || "");
	let oldWhitelist = helper.getWhitelist().toString();
	let oldBlacklist = helper.getBlacklist().toString();

	const saveSettings = () => {
		helper.setSettings({
			showBadge,
			showNotification,
			listenDownloads,
		});
	};

	const saveWhiteList = () => {
		const wl = whitelist.trim();
		let whitelistExtensions;
		if (wl === "") whitelistExtensions = [];
		else {
			// 去除wl.split(",")中的空项目
			whitelistExtensions = wl.split(",").filter((item) => item.trim() !== "");
			whitelistExtensions = whitelistExtensions.map((item) => (item.trim().startsWith(".") ? item.trim() : `.${item.trim()}`));
		}
		helper.setWhiteList({ name: "Whitelist", extensions: whitelistExtensions });
		setWhitelist(whitelistExtensions.toString());
		oldWhitelist = whitelistExtensions.toString();
	};

	const saveBlackList = () => {
		const bl = blacklist.trim();
		let blacklistExtensions;
		if (bl === "") blacklistExtensions = [];
		else {
			blacklistExtensions = bl.split(",").filter((item) => item.trim() !== "");
			blacklistExtensions = blacklistExtensions.map((item) => (item.trim().startsWith(".") ? item.trim() : `.${item.trim()}`));
		}
		helper.setBlackList({ name: "Blacklist", extensions: blacklistExtensions });
		setBlacklist(blacklistExtensions.toString());
		oldBlacklist = blacklistExtensions.toString();
	};

	useEffect(() => {
		saveSettings();
	}, [showBadge, showNotification, listenDownloads]);

	return (
		<>
			<ListGroup>
				<ListItem>
					<div>{t("show_badge")}</div>
					<input type="checkbox" onChange={(e) => setShowBadge(!showBadge)} checked={showBadge} className="toggle checked:bg-primary checked:border-primary checked:text-white" />
				</ListItem>
				<ListItem>
					<div>{t("show_notification")}</div>
					<input type="checkbox" onChange={(e) => setShowNotification(!showNotification)} checked={showNotification} className="toggle checked:bg-primary checked:border-primary checked:text-white" />
				</ListItem>
			</ListGroup>
			<ListGroup>
				<ListItem>
					<div>{t("listen_downloads")}</div>
					<input type="checkbox" onChange={(e) => setListenDownloads(!listenDownloads)} checked={listenDownloads} className=" toggle checked:bg-primary checked:border-primary checked:text-white" />
				</ListItem>
				<ListItem col>
					<div className="w-full">
						<fieldset className="fieldset">
							<legend className="text-base">{t("label_extensions_whitelist")}</legend>
							<textarea value={whitelist} onChange={(e) => setWhitelist(e.target.value)} className="textarea h-24 w-full" placeholder=""></textarea>
							<button disabled={oldWhitelist === whitelist} className="btn justify-self-end btn-primary m-2 w-32 h-8" onClick={saveWhiteList}>
								{t("save_white_list")}
							</button>
						</fieldset>
					</div>
					<div className="w-full">
						<fieldset className="fieldset">
							<legend className="text-base">{t("label_extensions_blacklist")}</legend>
							<textarea value={blacklist} onChange={(e) => setBlacklist(e.target.value)} className="textarea h-24 w-full" placeholder=""></textarea>
							<button disabled={oldBlacklist === blacklist} className="btn justify-self-end btn-primary m-2 w-32 h-8" onClick={saveBlackList}>
								{t("save_black_list")}
							</button>
						</fieldset>
					</div>
					<div className="label w-full whitespace-break-spaces">{t("listen_downloads_extensions")}</div>
				</ListItem>
				<ListItem col className="gap-4">
					<div>{t("label_default_extensions")}</div>
					{Object.keys(extensions).map((ext, index) => {
						return (
							<div key={index} className="collapse collapse-arrow bg-base-100 border-base-300 border">
								<input type="checkbox" />
								<div className="collapse-title font-semibold">
									{extensions[ext].name} ({extensions[ext].extensions.length})
								</div>
								<div className="collapse-content text-sm w-full wrap-anywhere">{extensions[ext].extensions.toString()}</div>
							</div>
						);
					})}
				</ListItem>
			</ListGroup>
		</>
	);
}

export default Aria2HelperSettings;
