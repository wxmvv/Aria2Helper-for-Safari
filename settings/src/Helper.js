import { initProfiles, initSettings, initCurrentProfileId, initDefaultProfileId } from "./utils/initial";
import { generateProfileId } from "./utils/utils";

class Helper {
	constructor() {
		this.App = "Aria2Helpers";
		this.Version = "v1.3.5";

		this.settings = null;
		this.profiles = null;
		this.currentProfileId = null;
		this.defaultProfileId = null;

		this.device = null;
	}

	async init() {
		const res = await this.loadLocalStorages();
	}

	addNewProfile() {
		const profileId = generateProfileId();
		const profile = {
			alias: "New",
			rpcHost: "",
			rpcIshttps: false,
			rpcPort: "",
			rpcSecret: "",
			rpcParameters: "",
			isDefault: false,
		};
		this.profiles[profileId] = profile;
		this.currentProfileId = profileId;
		this.saveLocalStorages();
	}
	removeProfileById(profileId) {
		delete this.profiles[profileId];
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
		if (profileId === this.defaultProfileId) this.currentProfileId = Object.keys(this.profiles)[0];
		if (profileId === this.currentProfileId) this.currentProfileId = Object.keys(this.profiles)[0];
		this.saveLocalStorages();
	}
	setDefaultProfileById(profileId) {
		this.defaultProfileId = profileId;
		Object.keys(this.profiles).forEach((profileId) => {
			this.profiles[profileId].isDefault = false;
		});
		this.profiles[profileId].isDefault = true;
		this.saveLocalStorages();
	}
	setCurrentProfileById(profileId) {
		this.currentProfileId = profileId;
		this.saveLocalStorages();
	}
	setProfileById(profileId, profile) {
		this.profiles[profileId] = profile;
		this.saveLocalStorages();
	}
	setSettings(settings) {
		this.settings = { ...this.settings, ...settings };
		this.saveLocalStorageSettings();
	}
	setBlackList(blacklist) {
		this.settings.filterLists.blacklist = blacklist;
		this.saveLocalStorageSettings();
	}
	setWhiteList(whitelist) {
		this.settings.filterLists.whitelist = whitelist;
		this.saveLocalStorageSettings();
	}

	getProfiles() {
		return { ...this.profiles };
	}
	getProfileById(profileId) {
		return this.profiles[profileId];
	}
	getSettings() {
		return this.settings;
	}
	getWhitelist() {
		return this.settings.filterLists.whitelist.extensions || [];
	}
	getBlacklist() {
		return this.settings.filterLists.blacklist.extensions || [];
	}

	getCurrentProfile() {
		if (this.profiles && this.currentProfileId) {
			if (this.profiles[this.currentProfileId]) return this.profiles[this.currentProfileId];
			else return this.profiles[0];
		}
	}
	getCurrentProfileId() {
		return this.currentProfileId;
	}

	// LocalStorage
	async loadLocalStorages() {
		if (typeof browser !== "undefined" && browser && browser.storage && browser.storage.local) {
			console.log("[extions mode]");
			return await browser.storage.local.get(["settings", "profiles", "currentProfileId", "defaultProfileId", "device"]).then((res) => {
				if (!res["settings"] && !res["profiles"] && !res["currentProfileId"] && !res["defaultProfileId"]) {
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
			});
		} else {
			// DEV
			this.settings = initSettings;
			this.profiles = initProfiles;
			this.currentProfileId = initCurrentProfileId;
			this.defaultProfileId = initDefaultProfileId;
			this.device = "macos";
			return Promise.resolve({
				settings: initSettings,
				profiles: initProfiles,
				currentProfileId: initCurrentProfileId,
				defaultProfileId: initDefaultProfileId,
				device: "macos",
			});
		}
	}
	async saveLocalStorages() {
		if (typeof browser !== "undefined" && browser && browser.storage && browser.storage.local) {
			await browser.storage.local
				.set({
					profiles: this.profiles,
					settings: this.settings,
					currentProfileId: this.currentProfileId,
					defaultProfileId: this.defaultProfileId,
				})
				.then((res) => {
					console.log("[save local storage]", this.profiles, this.settings, this.currentProfileId, this.defaultProfileId);
				});
		}
	}
	async saveLocalStorageSettings() {
		if (typeof browser !== "undefined" && browser && browser.storage && browser.storage.local) {
			await browser.storage.local
				.set({
					settings: this.settings,
				})
				.then((res) => {
					console.log("[save settings]", this.settings);
				});
		}
	}
}

export default Helper;
