import { initProfiles, initSettings, initCurrentProfileId, initDefaultProfileId } from "./utils/initial";
import { generateProfileId } from "./utils/utils";

class Helper {
	constructor() {
		this.App = "Aria2Helpers";
		this.Version = "v1.3.5";

		this.settings = null;
		this.profiles = null;
		this.currentProfileId = null;
		this.defaultProfile = null;
		this.device = null;

		this.init();
	}

	async init() {
		const res = {
			settings: initSettings,
			profiles: initProfiles,
			currentProfileId: initCurrentProfileId,
			defaultProfileId: initDefaultProfileId,
			device: "macos",
		};
		// const res = await this.getLocalStorages();
		// 检查
		if (!res["settings"] && !res["profiles"] && !res["currentProfileId"] && !res["defaultProfile"]) {
			this.settings = initSettings;
			this.profiles = initProfiles;
			this.currentProfileId = initCurrentProfileId;
			this.defaultProfileId = initDefaultProfileId;
			this.device = "macos";
			return res;
		}
		if (!res["profiles"] || JSON.stringify(res["profiles"]) === "{}") this.profiles = initProfiles;
		else this.profiles = res["profiles"];
		if (!res["settings"]) this.settings = initSettings;
		else this.settings = res["settings"];
		if (!res["currentProfileId"] || res["currentProfileId"] === "" || !this.profiles[res["currentProfileId"]]) this.currentProfileId = Object.keys(profiles)[0];
		else this.currentProfileId = res["currentProfileId"];
		if (!res["defaultProfileId"] || res["defaultProfileId"] === "" || !this.profiles[res["defaultProfileId"]]) this.defaultProfileId = Object.keys(profiles)[0];
		else this.defaultProfileId = res["defaultProfileId"];
		if (!res["device"]) this.device = "macos";
		return res;
	}

	addProfile() {
		const profileId = generateProfileId();
		const profile = {
			alias: "New",
			rpcHost: "",
			rpcIshttps: false,
			rpcPort: "",
			rpcSecret: "",
			rpcParameters: "",
		};
		this.profiles[profileId] = profile;
		this.currentProfileId = profileId;
		// TODO
		// renderTabs(profiles);
		// loadProfile(profileId);
		// saveLocalStorage();
	}
	removeCurrentProfile() {
		delete this.profiles[this.currentProfileId];
		if (Object.keys(this.profiles).length === 0)
			this.profiles = {
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
		if (this.currentProfileId === this.defaultProfileId) this.defaultProfileId = Object.keys(this.profiles)[0];
		this.currentProfileId = Object.keys(this.profiles)[0];
		// renderTabs(profiles);
		// loadProfile(currentProfileId);
		// saveLocalStorage();
	}
	setCurrentProfileById(profileId) {
		this.currentProfileId = profileId;
		// saveLocalStorage();
	}

	getSettings() {
		return this.settings;
	}

	getProfiles() {
		return this.profiles;
	}

	getCurrentProfile() {
		if (this.profiles && this.currentProfileId) {
			if (this.profiles[this.currentProfileId]) return this.profiles[this.currentProfileId];
			else return this.profiles[0];
		}
		return this.defaultProfile;
	}
	getCurrentProfileId() {
		return this.currentProfileId;
	}

	// MARK LocalStorage
	async getLocalStorages() {
		return await browser.storage.local.get(["settings", "profiles", "currentProfileId", "defaultProfile", "device"]);
	}

	async setLocalStorages(profiles, settings, currentProfileId, defaultProfileId) {
		await browser.storage.local.set({
			profiles,
			settings,
			currentProfileId,
			defaultProfileId,
		});
	}
	async setLocalStorageSettings() {
		browser.storage.local
			.set({
				settings: settings,
			})
			.then((res) => {
				console.log("saveSettings", res);
				console.log(settings);
			});
	}
}

export default Helper;
