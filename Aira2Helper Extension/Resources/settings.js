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
	extensionsValue: "exe,zip,rar,tar,gz,7z,dmg,pkg,apk,iso,img,sig,zst,bz2,xz,pdf,doc,docx,xls,xlsx,ppt,pptx,mp3,mp4,avi,mkv,jpg,png,gif",
	extensions: [
		".exe",
		".zip",
		".rar",
		".tar",
		".gz",
		".7z",
		".dmg",
		".pkg",
		".apk",
		".iso",
		".img",
		".sig",
		".zst",
		".bz2",
		".xz",
		".pdf",
		".doc",
		".docx",
		".xls",
		".xlsx",
		".ppt",
		".pptx",
		".mp3",
		".mp4",
		".avi",
		".mkv",
		".jpg",
		".png",
		".gif",
	],
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
	browser.storage.local.set({
		settings: settings,
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
	// 如果 extensionsChangeFlag 为 true，则可以点击按钮，否则disabled按钮
	document.getElementById("save-extensions").disabled = !extensionsChangeFlag;
}

function updateSetDefaultCss() {
	if (defaultProfileId === currentProfileId) {
		// set-default button 关闭点击 并且改变内部文本
		document.getElementById("set-default").textContent = "It's Default";
		document.getElementById("set-default").disabled = true;
	} else {
		// set-default button 开启点击 并且改变内部文本
		document.getElementById("set-default").textContent = "Set Default";
		document.getElementById("set-default").disabled = false;
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
	document.getElementById("listen-downloads-extensions").value = settings.extensionsValue || initSettings.extensionsValue;
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
		alert(`Profile saved: ${profile.alias}`);
	});

	// add
	// document.getElementById("add-profile").addEventListener("click", () => {
	// 	addProfile();
	// });

	// remove
	document.getElementById("remove-profile").addEventListener("click", () => {
		// 提示框
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
	document.getElementById("set-default").addEventListener("click", () => {
		defaultProfileId = currentProfileId;
		alert(`Default profile set to ${profiles[defaultProfileId].alias}`);
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
			toggleButton.textContent = "hide";
		} else {
			passwordInput.type = "password";
			toggleButton.textContent = "show";
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

	document.getElementById("save-extensions").addEventListener("click", (e) => {
		settings.extensionsValue = document.getElementById("listen-downloads-extensions").value;
		// 用,分割每一项，然后去掉前后空格，并在前加.,放入列表
		settings.extensions = settings.extensionsValue.split(",").map((item) => (item.trim().startsWith(".") ? item.trim() : `.${item.trim()}`));
		saveSettings();
		extensionsChangeFlag = false;
		updateSaveExtensionsBtnCss();
	});

	document.getElementById("listen-downloads-extensions").addEventListener("input", (e) => {
		extensionsChangeFlag = true;
		updateSaveExtensionsBtnCss();
	});

	document.getElementById("listen-downloads").addEventListener("click", (e) => {
		settings.listenDownloads = e.target.checked;
		saveSettings();
	});
}

document.addEventListener("DOMContentLoaded", function () {
	getLocalStorage().then(() => {
		renderTabs(profiles);
		loadProfile(currentProfileId);
		loadSettings(settings);
		setupEventListeners();
	});
});

// MARK utils
// gen random Id
function generateProfileId() {
	return Math.random().toString(36).substr(2, 9);
}
