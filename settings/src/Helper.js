/* global browser */
import core from "./lib/core.js";

const { storage, rpc, constants } = core;

/**
 * Settings-side state container.
 *
 * It keeps the small synchronous surface the React components expect while all
 * persistence and normalisation is delegated to the shared core.
 */
class Helper {
	constructor() {
		this.App = constants.APP_NAME;
		this.Version = typeof browser !== "undefined" && browser.runtime && browser.runtime.getManifest ? browser.runtime.getManifest().version : "2.0.0";

		this.settings = null;
		this.profiles = null;
		this.currentProfileId = null;
		this.defaultProfileId = null;
		this.device = "macos";
		this.state = null;
	}

	async init() {
		await this.loadLocalStorages();
	}

	get hasStorage() {
		return typeof browser !== "undefined" && Boolean(browser.storage && browser.storage.local);
	}

	addNewProfile() {
		const profileId = core.util.randomId();
		const profile = storage.normalizeProfile(profileId, { alias: "aria2" });
		this.profiles[profileId] = profile;
		this.currentProfileId = profileId;
		this.persist();
	}

	removeProfileById(profileId) {
		if (!this.profiles[profileId]) return;
		delete this.profiles[profileId];
		if (Object.keys(this.profiles).length === 0) {
			const fallback = storage.normalizeProfile("init", { alias: "aria2" });
			this.profiles = { init: fallback };
		}
		if (profileId === this.defaultProfileId) this.defaultProfileId = Object.keys(this.profiles)[0];
		if (profileId === this.currentProfileId) this.currentProfileId = Object.keys(this.profiles)[0];
		this.persist();
	}

	setDefaultProfileById(profileId) {
		if (!this.profiles[profileId]) return;
		this.defaultProfileId = profileId;
		for (const id of Object.keys(this.profiles)) this.profiles[id].isDefault = id === profileId;
		this.persist();
	}

	setCurrentProfileById(profileId) {
		if (!this.profiles[profileId]) return;
		this.currentProfileId = profileId;
		this.persist();
	}

	setProfileById(profileId, profile) {
		if (!profileId) return;
		this.profiles[profileId] = storage.normalizeProfile(profileId, profile);
		this.persist();
	}

	saveProfile(profileId, profile, makeDefault) {
		const normalized = storage.normalizeProfile(profileId, profile);
		this.profiles[profileId] = normalized;
		this.currentProfileId = profileId;
		if (makeDefault || !this.profiles[this.defaultProfileId] || !storage.hasUsableProfile(this.profiles[this.defaultProfileId])) {
			this.defaultProfileId = profileId;
			for (const id of Object.keys(this.profiles)) this.profiles[id].isDefault = id === profileId;
		}
		this.persist();
		return normalized;
	}

	setSettings(settings) {
		this.settings = storage.normalizeSettings({ ...this.settings, ...settings });
		this.persist();
	}

	updateSettings(patch) {
		this.settings = storage.normalizeSettings({
			...this.settings,
			...patch,
			filterLists: { ...this.settings.filterLists, ...(patch.filterLists || {}) },
			appearance: { ...this.settings.appearance, ...(patch.appearance || {}) },
		});
		this.persist();
	}

	setBlackList(blacklist) {
		this.settings.filterLists.blacklist = blacklist;
		this.persist();
	}

	setWhiteList(whitelist) {
		this.settings.filterLists.whitelist = whitelist;
		this.persist();
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
		if (this.profiles && this.currentProfileId && this.profiles[this.currentProfileId]) return this.profiles[this.currentProfileId];
		return this.profiles ? this.profiles[Object.keys(this.profiles)[0]] : null;
	}

	getCurrentProfileId() {
		return this.currentProfileId;
	}

	getDevice() {
		return this.device;
	}

	isConfigured() {
		return Object.values(this.profiles || {}).some((profile) => storage.hasUsableProfile(profile));
	}

	async testProfile(profile) {
		const normalized = storage.normalizeProfile(this.currentProfileId || "test", profile);
		return rpc.testConnection(normalized);
	}

	async discoverEngines(secret) {
		const candidates = constants.LOCAL_ENGINE_CANDIDATES.map((candidate) => ({ ...candidate, rpcSecret: secret || "" }));
		return rpc.discoverLocalEngines(candidates, { timeoutMs: 2500 });
	}

	async loadLocalStorages() {
		const state = await storage.loadState();
		this.applyState(state);
		if (this.hasStorage && browser.storage.onChanged && !this.storageListenerAttached) {
			this.storageListenerAttached = true;
			browser.storage.onChanged.addListener((changes, areaName) => {
				if (areaName && areaName !== "local") return;
				if (!changes || (!changes.settings && !changes.profiles && !changes.currentProfileId && !changes.defaultProfileId)) return;
				if (this.saving) return;
				this.refresh().catch((error) => console.error("[settings] refresh failed", error));
			});
		}
		return state;
	}

	applyState(state) {
		this.state = state;
		this.settings = state.settings;
		this.profiles = state.profiles;
		this.currentProfileId = state.currentProfileId;
		this.defaultProfileId = state.defaultProfileId;
		this.device = state.device || "macos";
		// Snapshot used to detect which fields this page actually edited.
		this.baseline = JSON.parse(JSON.stringify(state));
	}

	/**
	 * Merge only the fields this page changed into the latest stored state, so a
	 * popup action (default profile, listening) is not overwritten by an old tab.
	 */
	async persistNow() {
		if (!this.hasStorage) return;
		const latest = await storage.loadState();
		const base = this.baseline || latest;
		const merged = { ...latest };
		if (JSON.stringify(this.settings) !== JSON.stringify(base.settings)) {
			merged.settings = mergeChanged(latest.settings, base.settings, this.settings);
		}
		if (JSON.stringify(this.profiles) !== JSON.stringify(base.profiles)) {
			merged.profiles = mergeProfiles(latest.profiles, base.profiles, this.profiles);
		}
		if (this.currentProfileId !== base.currentProfileId) merged.currentProfileId = this.currentProfileId;
		if (this.defaultProfileId !== base.defaultProfileId) merged.defaultProfileId = this.defaultProfileId;
		const normalized = storage.normalizeState(merged).state;
		this.saving = true;
		try {
			await browser.storage.local.set(normalized);
			this.applyState(normalized);
		} finally {
			this.saving = false;
		}
	}

	persist() {
		if (!this.hasStorage) return;
		this.saveChain = (this.saveChain || Promise.resolve())
			.then(() => this.persistNow())
			.catch((error) => console.error("[settings] save failed", error));
	}

	async refresh() {
		this.applyState(await storage.loadState());
	}
}

function mergeChanged(latest, base, local) {
	if (!local || typeof local !== "object" || Array.isArray(local)) return local;
	const out = latest && typeof latest === "object" ? { ...latest } : {};
	for (const key of Object.keys(local)) {
		const next = local[key];
		const previous = base ? base[key] : undefined;
		if (JSON.stringify(next) === JSON.stringify(previous)) continue;
		const current = out[key];
		if (next && previous && current && typeof next === "object" && typeof previous === "object" && typeof current === "object" && !Array.isArray(next) && !Array.isArray(current)) {
			out[key] = mergeChanged(current, previous, next);
		} else {
			out[key] = next;
		}
	}
	return out;
}

function mergeProfiles(latest, base, local) {
	const out = mergeChanged(latest, base, local);
	if (base && typeof base === "object") {
		for (const profileId of Object.keys(base)) {
			if (local && !(profileId in local)) delete out[profileId];
		}
	}
	return out;
}

export default Helper;
