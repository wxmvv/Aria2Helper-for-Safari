import { useEffect, useState } from "react";

import { ListGroup } from "../components/ListGroup";
import { ListItem } from "../components/ListItem";
import { ListGroupTitle } from "../components/ListGroupTitle";
import { extensions } from "../utils/extension";
import { t } from "../utils/i18n";

function normalizeListText(value) {
	return value
		.split(/[\s,;]+/)
		.map((item) => item.trim())
		.filter(Boolean)
		.map((item) => (item.startsWith(".") ? item.toLowerCase() : `.${item.toLowerCase()}`))
		.filter((item, index, all) => all.indexOf(item) === index);
}

function Aria2HelperSettings({ helper }) {
	const settings = helper.getSettings();
	const [showBadge, setShowBadge] = useState(settings.showBadge);
	const [showNotification, setShowNotification] = useState(settings.showNotification);
	const [listenDownloads, setListenDownloads] = useState(settings.listenDownloads);
	const [sendCookies, setSendCookies] = useState(settings.sendCookies);
	const [sendReferer, setSendReferer] = useState(settings.sendReferer);
	const [skipFilesInTorrent, setSkipFilesInTorrent] = useState(settings.skipFilesInTorrent);
	const [confirmTorrentSelection, setConfirmTorrentSelection] = useState(settings.confirmTorrentSelection);
	const [skipExtensions, setSkipExtensions] = useState((settings.skipExtensions || []).join(", "));
	const [whitelist, setWhitelist] = useState(helper.getWhitelist().join(", "));
	const [blacklist, setBlacklist] = useState(helper.getBlacklist().join(", "));

	useEffect(() => {
		helper.updateSettings({ showBadge, showNotification, listenDownloads, sendCookies, sendReferer, skipFilesInTorrent, confirmTorrentSelection });
	}, [helper, showBadge, showNotification, listenDownloads, sendCookies, sendReferer, skipFilesInTorrent, confirmTorrentSelection]);

	const saveSkipList = () => {
		const extensionsList = normalizeListText(skipExtensions);
		setSkipExtensions(extensionsList.join(", "));
		helper.updateSettings({ skipExtensions: extensionsList });
	};

	const saveList = (kind) => {
		const value = kind === "white" ? whitelist : blacklist;
		const list = normalizeListText(value);
		const payload = { name: kind === "white" ? "Whitelist" : "Blacklist", extensions: list };
		if (kind === "white") {
			setWhitelist(list.join(", "));
			helper.setWhiteList(payload);
		} else {
			setBlacklist(list.join(", "));
			helper.setBlackList(payload);
		}
	};

	const toggle = (checked, setter) => (
		<input type="checkbox" checked={Boolean(checked)} onChange={(event) => setter(event.target.checked)} className="toggle checked:bg-primary checked:border-primary checked:text-white" />
	);

	return (
		<>
			<ListGroupTitle title={t("helper_settings")} />
			<ListGroup>
				<ListItem>
					<div>{t("show_badge")}</div>
					{toggle(showBadge, setShowBadge)}
				</ListItem>
				<ListItem>
					<div>{t("show_notification")}</div>
					{toggle(showNotification, setShowNotification)}
				</ListItem>
				<ListItem>
					<div>{t("listen_downloads")}</div>
					{toggle(listenDownloads, setListenDownloads)}
				</ListItem>
				<ListItem>
					<div>{t("send_cookies")}</div>
					{toggle(sendCookies, setSendCookies)}
				</ListItem>
				<ListItem>
					<div>{t("send_referer")}</div>
					{toggle(sendReferer, setSendReferer)}
				</ListItem>
			</ListGroup>

			<ListGroupTitle title={t("skip_extensions")} />
			<ListGroup>
				<ListItem col className="items-start gap-2">
					<div className="w-full">
						<fieldset className="fieldset">
							<textarea value={skipExtensions} onChange={(event) => setSkipExtensions(event.target.value)} className="textarea h-20 w-full" placeholder=".jpg, .png, .nfo"></textarea>
							<button className="btn justify-self-end btn-primary m-2 w-32 h-8" onClick={saveSkipList}>
								{t("save")}
							</button>
						</fieldset>
					</div>
					<div className="label w-full whitespace-break-spaces">{t("skip_extensions_hint")}</div>
				</ListItem>
				<ListItem>
					<div>{t("skip_in_torrent")}</div>
					{toggle(skipFilesInTorrent, setSkipFilesInTorrent)}
				</ListItem>
				<ListItem>
					<div>{t("confirm_torrent_selection")}</div>
					{toggle(confirmTorrentSelection, setConfirmTorrentSelection)}
				</ListItem>
			</ListGroup>

			<ListGroupTitle title={t("label_default_extensions")} />
			<ListGroup>
				<ListItem col>
					<div className="w-full">
						<fieldset className="fieldset">
							<legend className="text-base">{t("label_extensions_whitelist")}</legend>
							<textarea value={whitelist} onChange={(event) => setWhitelist(event.target.value)} className="textarea h-24 w-full" placeholder=".zip, .dmg"></textarea>
							<button className="btn justify-self-end btn-primary m-2 w-32 h-8" onClick={() => saveList("white")}>
								{t("save_white_list")}
							</button>
						</fieldset>
					</div>
					<div className="w-full">
						<fieldset className="fieldset">
							<legend className="text-base">{t("label_extensions_blacklist")}</legend>
							<textarea value={blacklist} onChange={(event) => setBlacklist(event.target.value)} className="textarea h-24 w-full" placeholder=".jpg, .png"></textarea>
							<button className="btn justify-self-end btn-primary m-2 w-32 h-8" onClick={() => saveList("black")}>
								{t("save_black_list")}
							</button>
						</fieldset>
					</div>
					<div className="label w-full whitespace-break-spaces">{t("listen_downloads_extensions")}</div>
				</ListItem>
				<ListItem col className="gap-4 items-start">
					{Object.keys(extensions).map((key) => (
						<div key={key} className="collapse collapse-arrow bg-base-100 border-base-300 border w-full">
							<input type="checkbox" />
							<div className="collapse-title font-semibold">
								{extensions[key].name} ({extensions[key].extensions.length})
							</div>
							<div className="collapse-content text-sm w-full wrap-anywhere text-left">{extensions[key].extensions.join(", ")}</div>
						</div>
					))}
				</ListItem>
			</ListGroup>
		</>
	);
}

export default Aria2HelperSettings;
