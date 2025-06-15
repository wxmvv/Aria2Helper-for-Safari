import { useRef, useEffect, useState } from "react";

import { ListGroup } from "../components/ListGroup";
import { ListItem } from "../components/ListItem";
import { ListGroupTitle } from "../components/ListGroupTitle";
import { extensions } from "../utils/extension";

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
		else whitelistExtensions = wl.split(",").map((item) => (item.trim().startsWith(".") ? item.trim() : `.${item.trim()}`));
		helper.setWhiteList({ name: "Whitelist", extensions: whitelistExtensions });
		setWhitelist(whitelistExtensions.toString());
		oldWhitelist = whitelistExtensions.toString();
	};

	const saveBlackList = () => {
		const bl = blacklist.trim();
		let blacklistExtensions;
		if (bl === "") blacklistExtensions = [];
		else blacklistExtensions = bl.split(",").map((item) => (item.trim().startsWith(".") ? item.trim() : `.${item.trim()}`));
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
					<div>Show Badge</div>
					<input type="checkbox" onChange={(e) => setShowBadge(!showBadge)} checked={showBadge} className="toggle checked:bg-primary checked:border-primary checked:text-white" />
				</ListItem>
				<ListItem>
					<div>Show Notification</div>
					<input type="checkbox" onChange={(e) => setShowNotification(!showNotification)} checked={showNotification} className="toggle checked:bg-primary checked:border-primary checked:text-white" />
				</ListItem>
			</ListGroup>
			<ListGroup>
				<ListItem>
					<div>Listen Downloads</div>
					<input type="checkbox" onChange={(e) => setListenDownloads(!listenDownloads)} checked={listenDownloads} className="toggle checked:bg-primary checked:border-primary checked:text-white" />
				</ListItem>
				<ListItem>
					<div className="w-full">
						<fieldset className="fieldset">
							<legend className="fieldset-legend">White List</legend>
							<textarea value={whitelist} onChange={(e) => setWhitelist(e.target.value)} className="textarea h-24 w-full" placeholder="Bio"></textarea>
							<button disabled={oldWhitelist === whitelist} className="btn justify-self-end btn-primary m-2 w-32 h-8" onClick={saveWhiteList}>
								保存白名单
							</button>
						</fieldset>
					</div>
				</ListItem>
				<ListItem>
					<div className="w-full">
						<fieldset className="fieldset">
							<legend className="fieldset-legend">Black List</legend>
							<textarea value={blacklist} onChange={(e) => setBlacklist(e.target.value)} className="textarea h-24 w-full" placeholder="Bio"></textarea>
							<button disabled={oldBlacklist === blacklist} className="btn justify-self-end btn-primary m-2 w-32 h-8" onClick={saveBlackList}>
								保存黑名单
							</button>
						</fieldset>
					</div>
				</ListItem>
				<ListItem col className="gap-4">
					<div>Default Extensions Listened To</div>
					{Object.keys(extensions).map((ext, index) => {
						return (
							<div key={index} className="collapse collapse-arrow bg-base-100 border-base-300 border w-full">
								<input type="checkbox" />
								<div className="collapse-title font-semibold">
									{extensions[ext].name} ({extensions[ext].extensions.length})
								</div>
								<div className="collapse-content text-sm w-100% wrap-anywhere">{extensions[ext].extensions.toString()}</div>
							</div>
						);
					})}
				</ListItem>
			</ListGroup>
		</>
	);
}

export default Aria2HelperSettings;
