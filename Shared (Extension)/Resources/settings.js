const extensions = {
	video: {
		name: "Videos",
		extensions: [
			".3g2",
			".3gp",
			".3gp2",
			".3gpp",
			".asf",
			".asx",
			".avi",
			".dat",
			".divx",
			".flv",
			".m1v",
			".m2ts",
			".m2v",
			".m4v",
			".mkv",
			".mov",
			".mp4",
			".mpe",
			".mpeg",
			".mpg",
			".mts",
			".ogv",
			".qt",
			".ram",
			".rm",
			".rmvb",
			".ts",
			".vob",
			".wmv",
		],
	},
	audio: {
		name: "Audios",
		extensions: [
			".aac",
			".ac3",
			".adts",
			".amr",
			".ape",
			".eac3",
			".flac",
			".m1a",
			".m2a",
			".m4a",
			".mid",
			".mka",
			".mp2",
			".mp3",
			".mpa",
			".mpc",
			".ogg",
			".ra",
			".tak",
			".vqf",
			".wm",
			".wav",
			".wma",
			".wv",
		],
	},
	picture: {
		name: "Pictures",
		extensions: [
			".abr",
			".bmp",
			".emf",
			".gif",
			".j2c",
			".j2k",
			".jfif",
			".jif",
			".jp2",
			".jpc",
			".jpe",
			".jpeg",
			".jpf",
			".jpg",
			".jpk",
			".jpx",
			".pcx",
			".pct",
			".pic",
			".pict",
			".png",
			".pns",
			".psd",
			".psdx",
			".raw",
			".svg",
			".svgz",
			".tga",
			".tif",
			".tiff",
			".wbm",
			".wbmp",
			".webp",
			".wmf",
			".xif",
		],
	},
	document: {
		name: "Documents",
		extensions: [
			".csv",
			".doc",
			".docm",
			".docx",
			".dot",
			".dotm",
			".dotx",
			".key",
			".mpp",
			".numbers",
			".odp",
			".ods",
			".odt",
			".pages",
			".pdf",
			".pot",
			".potm",
			".potx",
			".pps",
			".ppsm",
			".ppsx",
			".ppt",
			".pptm",
			".pptx",
			".rtf",
			".txt",
			".vsd",
			".vsdx",
			".wk1",
			".wk2",
			".wk3",
			".wk4",
			".wks",
			".wpd",
			".wps",
			".xla",
			".xlam",
			".xll",
			".xlm",
			".xls",
			".xlsb",
			".xlsm",
			".xlsx",
			".xlt",
			".xltx",
			".xlw",
			".xps",
		],
	},
	application: {
		name: "Applications",
		extensions: [".apk", ".bat", ".com", ".deb", ".dll", ".dmg", ".exe", ".ipa", ".jar", ".msi", ".rpm", ".sh"],
	},
	archive: {
		name: "Archives",
		extensions: [
			".001",
			".7z",
			".ace",
			".arj",
			".bz2",
			".cab",
			".cbr",
			".cbz",
			".gz",
			".img",
			".iso",
			".lzh",
			".qcow2",
			".r",
			".rar",
			".sef",
			".tar",
			".taz",
			".tbz",
			".tbz2",
			".uue",
			".vdi",
			".vhd",
			".vmdk",
			".wim",
			".xar",
			".xz",
			".z",
			".zip",
		],
	},
	others: {
		name: "Others",
		extensions: [".bin", ".db", ".torrent", ".sig", ".eaglepack"],
	},
};

let currentProfileId;
let defaultProfileId;
let profiles;
let settings;

const initProfiles = {
	init: {
		alias: "New",
		rpcHost: "",
		rpcIshttps: false,
		rpcPort: "",
		rpcSecret: "",
		rpcParameters: "",
		isDefault: true,
	},
};

const initSettings = {
	showBadge: false, // show badge
	showNotification: true, // show notifications
	listenDownloads: false, // listen downloads
	filterLists: {
		blacklist: {
			name: "Blacklist",
			extensions: [],
		},
		whitelist: {
			name: "Whitelist",
			extensions: [],
		},
	},
};

const initCurrentProfileId = "init";
const initDefaultProfileId = "init";
let extensionsChangeFlag = false;

async function getLocalStorage() {
	const res = await browser.storage.local.get(["settings", "profiles", "currentProfileId", "defaultProfile"]).then((result) => {
		// first time init
		if (!result["settings"] && !result["profiles"] && !result["currentProfileId"] && !result["defaultProfile"]) {
			profiles = initProfiles;
			settings = initSettings;
			currentProfileId = initCurrentProfileId;
			defaultProfileId = initDefaultProfileId;
			return "init";
		}
		// init
		console.log("result", result);
		if (JSON.stringify(result["profiles"]) === "{}" || !result["profiles"]) {
			profiles = initProfiles;
		} else profiles = result["profiles"];
		settings = result["settings"] || initSettings;
		if (!result["currentProfileId"] || result["currentProfileId"] === "" || !profiles[result["currentProfileId"]]) {
			currentProfileId = Object.keys(profiles)[0];
		} else currentProfileId = result["currentProfileId"];
		if (!result["defaultProfileId"] || result["defaultProfileId"] === "" || !profiles[result["defaultProfileId"]]) {
			defaultProfileId = Object.keys(profiles)[0];
		} else defaultProfileId = result["defaultProfileId"];
		return "init success";
	});
	return res;
}

function saveLocalStorage() {
	browser.storage.local.set({
		profiles: profiles,
		settings: settings,
		currentProfileId: currentProfileId,
		defaultProfileId: defaultProfileId,
	});
}

function saveSettings() {
	browser.storage.local
		.set({
			settings: settings,
		})
		.then((res) => {
			console.log("saveSettings", res);
			console.log(settings);
		});
}

function renderTabs(profiles) {
	const tabsContainer = document.getElementById("profile-tabs");
	tabsContainer.innerHTML = "";
	Object.keys(profiles).forEach((profileId) => {
		const tab = document.createElement("button");
		tab.className = "tab";
		tab.textContent = profiles[profileId].alias || "unTitled";
		tab.dataset.profileId = profileId;
		tab.addEventListener("click", () => {
			currentProfileId = profileId;
			updateActiveCss();
			loadProfile(profileId);
			updateSetDefaultCss();
		});
		tabsContainer.appendChild(tab);
	});
	// add new profile button
	let newTab = document.createElement("button");
	newTab.className = "tab";
	newTab.type = "button";
	newTab.id = "add-profile";
	newTab.textContent = "+";
	newTab.addEventListener("click", () => {
		addProfile();
	});
	tabsContainer.appendChild(newTab);

	updateActiveCss();
	updateDefaultCss();
	updateSetDefaultCss();
}

function updateActiveCss() {
	document.querySelectorAll(".tab").forEach((tab) => {
		tab.classList.toggle("active", tab.dataset.profileId === currentProfileId);
	});
}

function updateDefaultCss() {
	document.querySelectorAll(".tab").forEach((tab) => {
		tab.classList.toggle("default", tab.dataset.profileId === defaultProfileId);
	});
}

function updateSaveExtensionsBtnCss() {
	document.getElementById("saveExtensions").disabled = !extensionsChangeFlag; // disable btn if no change
}

function updateSetDefaultCss() {
	if (defaultProfileId === currentProfileId) {
		document.getElementById("setDefault").textContent = browser.i18n.getMessage("default");
		document.getElementById("setDefault").disabled = true;
	} else {
		document.getElementById("setDefault").textContent = browser.i18n.getMessage("set_default");
		document.getElementById("setDefault").disabled = false;
	}
}

function loadProfile(profileId) {
	const profile = profiles[profileId] || {
		alias: "New",
		rpcHost: "",
		rpcIshttps: false,
		rpcPort: "",
		rpcSecret: "",
		rpcParameters: "",
	};
	document.getElementById("alias").value = profiles[profileId].alias || "";
	document.getElementById("rpc-host").value = profiles[profileId].rpcHost || "";
	document.getElementById("rpc-ishttps").checked = profiles[profileId].rpcIshttps || false;
	document.getElementById("rpc-port").value = profiles[profileId].rpcPort || "";
	document.getElementById("rpc-secret").value = profiles[profileId].rpcSecret || "";
	document.getElementById("rpc-parameters").value = profiles[profileId].rpcParameters || "";
	document.getElementById("profile-id").value = profileId;
}

function loadSettings(settings) {
	document.getElementById("listen-downloads").checked = settings.listenDownloads || false;
	document.getElementById("show-badge").checked = settings.showBadge || false;
	document.getElementById("show-notification").checked = settings.showNotification || true;
	// Blacklist Whitelist
	if (settings.filterLists) {
		document.getElementById("extensionsBlackList").value = settings.filterLists.blacklist.extensions.toString();
		document.getElementById("extensionsWhiteList").value = settings.filterLists.whitelist.extensions.toString();
	} else {
		document.getElementById("extensionsBlackList").value = initSettings.filterLists.blacklist.extensions.toString();
		document.getElementById("extensionsWhiteList").value = initSettings.filterLists.whitelist.extensions.toString();
	}
}

function addProfile() {
	const profileId = generateProfileId();
	const profile = {
		alias: "New",
		rpcHost: "",
		rpcIshttps: false,
		rpcPort: "",
		rpcSecret: "",
		rpcParameters: "",
	};
	profiles[profileId] = profile;
	currentProfileId = profileId;
	renderTabs(profiles);
	loadProfile(profileId);
	saveLocalStorage();
}

// 生成折叠列表
function renderExtensions() {
	const container = document.getElementById("listen-downloads-extensions");

	Object.entries(extensions).forEach(([category, data]) => {
		// 创建分类容器
		const categoryDiv = document.createElement("div");
		categoryDiv.className = "category";

		// 创建头部
		const header = document.createElement("div");
		header.className = "category-header";
		header.textContent = `${data.name} (${data.extensions.length})`;

		// 创建扩展名列表
		const extList = document.createElement("div");
		extList.className = "extensions-list";
		extList.innerHTML = data.extensions.map((ext) => `<span>${ext}</span>`).join(", ");

		// 点击事件 - 切换显示/隐藏
		header.addEventListener("click", () => {
			extList.classList.toggle("show");
		});

		// 添加到 DOM
		categoryDiv.appendChild(header);
		categoryDiv.appendChild(extList);
		container.appendChild(categoryDiv);
	});
}

function setupEventListeners() {
	// save
	document.getElementById("settings-form").addEventListener("submit", (e) => {
		e.preventDefault();
		const profileId = currentProfileId === "" ? generateProfileId() : currentProfileId;
		const profile = {
			alias: document.getElementById("alias").value,
			rpcHost: document.getElementById("rpc-host").value,
			rpcIshttps: document.getElementById("rpc-ishttps").checked,
			rpcPort: document.getElementById("rpc-port").value,
			rpcSecret: document.getElementById("rpc-secret").value,
			rpcParameters: document.getElementById("rpc-parameters").value,
			isDefault: false,
		};
		profiles[profileId] = profile;
		renderTabs(profiles);
		saveLocalStorage();
		alert(browser.i18n.getMessage("save_profile_alert") + profile.alias);
	});

	// add
	// document.getElementById("add-profile").addEventListener("click", () => {
	// 	addProfile();
	// });

	// remove
	document.getElementById("removeProfile").addEventListener("click", () => {
		if (confirm(`Are you sure to remove profile ${profiles[currentProfileId].alias}?`)) {
			delete profiles[currentProfileId];
			if (Object.keys(profiles).length === 0)
				profiles = {
					init: {
						alias: "New",
						rpcHost: "",
						rpcIshttps: false,
						rpcPort: "",
						rpcSecret: "",
						rpcParameters: "",
						isDefault: true,
					},
				};
			if (currentProfileId === defaultProfileId) defaultProfileId = Object.keys(profiles)[0];
			currentProfileId = Object.keys(profiles)[0];
			renderTabs(profiles);
			loadProfile(currentProfileId);
			saveLocalStorage();
		}
	});

	// set default
	document.getElementById("setDefault").addEventListener("click", () => {
		defaultProfileId = currentProfileId;
		alert(browser.i18n.getMessage("set_default_profile_alert") + profiles[defaultProfileId].alias);
		updateDefaultCss();
		updateSetDefaultCss();
		saveLocalStorage();
	});

	// toggle password
	document.getElementById("toggle-password").addEventListener("click", () => {
		const passwordInput = document.getElementById("rpc-secret");
		const toggleButton = document.getElementById("toggle-password");
		if (passwordInput.type === "password") {
			passwordInput.type = "text";
			toggleButton.textContent = browser.i18n.getMessage("hide_password");
		} else {
			passwordInput.type = "password";
			toggleButton.textContent = browser.i18n.getMessage("show_password");
		}
	});

	// MARK settings
	document.getElementById("show-badge").addEventListener("click", (e) => {
		settings.showBadge = e.target.checked;
		saveSettings();
	});

	document.getElementById("show-notification").addEventListener("click", (e) => {
		settings.showNotification = e.target.checked;
		saveSettings();
	});

	document.getElementById("listen-downloads").addEventListener("click", (e) => {
		settings.listenDownloads = e.target.checked;
		saveSettings();
	});
	// Blacklist Whitelist
	document.getElementById("saveExtensions").addEventListener("click", (e) => {
		let whitelist = document.getElementById("extensionsWhiteList").value;
		let blacklist = document.getElementById("extensionsBlackList").value; // TODO 检查当前是否合规 1. 是否有全角符号 2. 是否带.

		whitelist = whitelist.trim();
		blacklist = blacklist.trim();

		let whitelistExtensions;
		let blacklistExtensions;

		if (whitelist === "") whitelistExtensions = [];
		else whitelistExtensions = whitelist.split(",").map((item) => (item.trim().startsWith(".") ? item.trim() : `.${item.trim()}`));

		if (blacklist === "") blacklistExtensions = [];
		else blacklistExtensions = blacklist.split(",").map((item) => (item.trim().startsWith(".") ? item.trim() : `.${item.trim()}`));

		settings.filterLists = {
			blacklist: { name: "Blacklist", extensions: blacklistExtensions },
			whitelist: { name: "Whitelist", extensions: whitelistExtensions },
		};

		saveSettings();
		extensionsChangeFlag = false;
		updateSaveExtensionsBtnCss();
	});

	document.getElementById("extensionsBlackList").addEventListener("input", (e) => {
		extensionsChangeFlag = true;
		updateSaveExtensionsBtnCss();
	});
	document.getElementById("extensionsWhiteList").addEventListener("input", (e) => {
		extensionsChangeFlag = true;
		updateSaveExtensionsBtnCss();
	});
}

// MARK main
document.addEventListener("DOMContentLoaded", function () {
	// i18n
	// label
	document.getElementById("settingsTitle").textContent = browser.i18n.getMessage("extension_name");
	document.getElementById("titleAlias").textContent = browser.i18n.getMessage("alias");
	document.getElementById("titleRpcHost").textContent = browser.i18n.getMessage("rpc_host");
	document.getElementById("titleRpcIsHttps").textContent = browser.i18n.getMessage("rpc_is_https");
	document.getElementById("titleRpcPort").textContent = browser.i18n.getMessage("rpc_port");
	document.getElementById("titleRpcSecret").textContent = browser.i18n.getMessage("rpc_secret");
	document.getElementById("titleRpcParameters").textContent = browser.i18n.getMessage("rpc_parameters");
	document.getElementById("toggle-password").textContent = browser.i18n.getMessage("show_password");
	document.getElementById("saveBtn").textContent = browser.i18n.getMessage("save");
	document.getElementById("setDefault").textContent = browser.i18n.getMessage("set_default");
	document.getElementById("removeProfile").textContent = browser.i18n.getMessage("remove_profile");
	document.getElementById("otherSettingsTitle").textContent = browser.i18n.getMessage("other_settings");
	document.getElementById("labelShowBadge").textContent = browser.i18n.getMessage("show_badge");
	document.getElementById("labelShowNotification").textContent = browser.i18n.getMessage("show_notification");
	document.getElementById("labelListenDownloads").textContent = browser.i18n.getMessage("listen_downloads");
	document.getElementById("labelListenDownloadsExtensions").textContent = browser.i18n.getMessage("listen_downloads_extensions");
	document.getElementById("labelDefaultExtensions").textContent = browser.i18n.getMessage("label_default_extensions");
	document.getElementById("labelExtensionsWhiteList").textContent = browser.i18n.getMessage("label_extensions_whitelist");
	document.getElementById("labelExtensionsBlackList").textContent = browser.i18n.getMessage("label_extensions_blacklist");
	document.getElementById("saveExtensions").textContent = browser.i18n.getMessage("save_extensions");
	// placeholder
	document.getElementById("alias").placeholder = browser.i18n.getMessage("input_alias");
	document.getElementById("rpc-host").placeholder = browser.i18n.getMessage("host_example");
	document.getElementById("rpc-port").placeholder = browser.i18n.getMessage("port_example");
	document.getElementById("rpc-secret").placeholder = browser.i18n.getMessage("input_secret");
	document.getElementById("rpc-parameters").placeholder = browser.i18n.getMessage("parameters_example");

	getLocalStorage().then(() => {
		renderTabs(profiles);
		loadProfile(currentProfileId);
		loadSettings(settings);
		renderExtensions();
		setupEventListeners();
	});
});

// MARK utils
// gen random Id
function generateProfileId() {
	return Math.random().toString(36).substring(2, 11);
}
