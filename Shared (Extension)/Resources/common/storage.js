/**
 * Storage schema, normalisation and migration.
 *
 * Every surface reads storage through this module so that a profile saved by an
 * older release (1.x) keeps working and never produces `undefined` field access
 * later. Normalisation is idempotent.
 */
(function (global) {
	"use strict";

	const Aria2Helper = (global.Aria2Helper = global.Aria2Helper || {});
	const { SCHEMA_VERSION, DEFAULT_SETTINGS, DEFAULT_RPC_PATH } = Aria2Helper.constants;
	const { normalizeExtensionList } = Aria2Helper.files;
	const { randomId } = Aria2Helper.util;

	function normalizePort(value) {
		const text = String(value == null ? "" : value).trim();
		if (!text) return "";
		const port = Number(text);
		if (!Number.isInteger(port) || port < 1 || port > 65535) return "";
		return String(port);
	}

	function normalizeHost(value) {
		let host = String(value == null ? "" : value).trim();
		host = host.replace(/^https?:\/\//i, "");
		host = host.replace(/\/.*$/, "");
		return host;
	}

	/** Split "host:6800" / "[::1]:6800" so the port field stays authoritative. */
	function splitHostPort(value) {
		const text = String(value == null ? "" : value).trim();
		const bracketed = text.match(/^\[([^\]]+)\](?::(\d+))?$/);
		if (bracketed) return { host: bracketed[1], port: bracketed[2] || "" };
		const plain = text.match(/^([^:/]+):(\d{1,5})$/);
		if (plain) return { host: plain[1], port: plain[2] };
		return { host: text, port: "" };
	}

	function normalizeRpcPath(value) {
		let path = String(value == null ? "" : value).trim();
		if (!path) return DEFAULT_RPC_PATH;
		if (!path.startsWith("/")) path = `/${path}`;
		if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
		return path;
	}

	function normalizeHeader(value) {
		const list = Array.isArray(value) ? value : String(value == null ? "" : value).split("\n");
		const seen = new Set();
		const result = [];
		for (const item of list) {
			const line = String(item == null ? "" : item).trim();
			if (!line || !line.includes(":")) continue;
			const name = line.slice(0, line.indexOf(":")).trim().toLowerCase();
			if (!name || seen.has(name)) continue;
			seen.add(name);
			result.push(line);
		}
		return result;
	}

	function normalizeProfile(profileId, raw) {
		const source = raw && typeof raw === "object" ? raw : {};
		const hostParts = splitHostPort(normalizeHost(source.rpcHost));
		const port = normalizePort(source.rpcPort) || normalizePort(hostParts.port);
		return {
			id: String(source.id || profileId || randomId()),
			alias: String(source.alias || "").trim() || "aria2",
			rpcHost: hostParts.host,
			rpcPort: port,
			rpcIshttps: Boolean(source.rpcIshttps),
			rpcPath: normalizeRpcPath(source.rpcPath),
			rpcSecret: String(source.rpcSecret == null ? "" : source.rpcSecret),
			dir: String(source.dir == null ? "" : source.dir).trim(),
			header: normalizeHeader(source.header),
			isDefault: Boolean(source.isDefault),
		};
	}

	function normalizeFilterList(raw, fallbackName) {
		const source = raw && typeof raw === "object" ? raw : {};
		return {
			name: String(source.name || fallbackName),
			extensions: normalizeExtensionList(source.extensions || []),
		};
	}

	function normalizeSettings(raw) {
		const source = raw && typeof raw === "object" ? raw : {};
		const filterLists = source.filterLists && typeof source.filterLists === "object" ? source.filterLists : {};
		const appearance = source.appearance && typeof source.appearance === "object" ? source.appearance : {};
		return {
			...DEFAULT_SETTINGS,
			...source,
			schemaVersion: SCHEMA_VERSION,
			showBadge: Boolean(source.showBadge),
			showNotification: Boolean(source.showNotification),
			listenDownloads: Boolean(source.listenDownloads),
			sendCookies: source.sendCookies !== false,
			sendReferer: source.sendReferer !== false,
			skipExtensions: normalizeExtensionList(source.skipExtensions || []),
			skipFilesInTorrent: source.skipFilesInTorrent !== false,
			confirmTorrentSelection: source.confirmTorrentSelection !== false,
			appearance: {
				...DEFAULT_SETTINGS.appearance,
				...appearance,
				liquidGlass: appearance.liquidGlass === true,
				showBackground: appearance.showBackground === true,
			},
			filterLists: {
				blacklist: normalizeFilterList(filterLists.blacklist, "Blacklist"),
				whitelist: normalizeFilterList(filterLists.whitelist, "Whitelist"),
			},
		};
	}

	function normalizeProfiles(raw) {
		const profiles = {};
		if (raw && typeof raw === "object") {
			for (const [profileId, profile] of Object.entries(raw)) {
				profiles[profileId] = normalizeProfile(profileId, profile);
			}
		}
		if (Object.keys(profiles).length === 0) {
			const id = "init";
			profiles[id] = normalizeProfile(id, { alias: "aria2", isDefault: true });
			profiles[id].id = id;
		}
		return profiles;
	}

	function pickProfileId(profiles, preferred) {
		if (preferred && profiles[preferred]) return preferred;
		const byDefault = Object.keys(profiles).find((id) => profiles[id].isDefault);
		return byDefault || Object.keys(profiles)[0];
	}

	/**
	 * Normalise a raw storage snapshot into the current schema.
	 * @returns {{state: object, changed: boolean}}
	 */
	function normalizeState(raw) {
		const source = raw && typeof raw === "object" ? raw : {};
		const profiles = normalizeProfiles(source.profiles);
		const previousProfiles = source.profiles && typeof source.profiles === "object" ? source.profiles : null;
		const defaultProfileId = pickProfileId(profiles, source.defaultProfileId);
		const currentProfileId = pickProfileId(profiles, source.currentProfileId || defaultProfileId);
		// A profile id is written both as the map key and inside the object; keep them in sync.
		for (const [profileId, profile] of Object.entries(profiles)) {
			profile.id = profileId;
			profile.isDefault = profileId === defaultProfileId;
		}
		const settings = normalizeSettings(source.settings);
		const changed =
			source.schemaVersion !== SCHEMA_VERSION ||
			!previousProfiles ||
			JSON.stringify(previousProfiles) !== JSON.stringify(profiles) ||
			JSON.stringify(source.settings || {}) !== JSON.stringify(settings) ||
			source.defaultProfileId !== defaultProfileId ||
			source.currentProfileId !== currentProfileId;
		return {
			state: {
				schemaVersion: SCHEMA_VERSION,
				profiles,
				defaultProfileId,
				currentProfileId,
				settings,
				device: source.device || "",
				themeColor: source.themeColor || "",
			},
			changed,
		};
	}

	function activeProfile(state) {
		if (!state || !state.profiles) return null;
		const id = state.defaultProfileId || state.currentProfileId;
		return state.profiles[id] || state.profiles[Object.keys(state.profiles)[0]] || null;
	}

	function hasUsableProfile(profile) {
		return Boolean(profile && profile.rpcHost && normalizePort(profile.rpcPort));
	}

	/** Browser storage area when available, otherwise an in-memory area (dev/tests). */
	function defaultArea() {
		if (global.browser && global.browser.storage && global.browser.storage.local) return global.browser.storage.local;
		if (global.chrome && global.chrome.storage && global.chrome.storage.local) return global.chrome.storage.local;
		return createMemoryArea();
	}

	function createMemoryArea(seed) {
		let data = { ...(seed || {}) };
		return {
			async get(keys) {
				if (keys == null) return { ...data };
				const list = Array.isArray(keys) ? keys : [keys];
				const result = {};
				for (const key of list) if (key in data) result[key] = data[key];
				return result;
			},
			async set(patch) {
				data = { ...data, ...patch };
			},
		};
	}

	const STATE_KEYS = ["schemaVersion", "profiles", "currentProfileId", "defaultProfileId", "settings", "device", "themeColor"];

	async function loadState(area) {
		const storage = area || defaultArea();
		let raw = {};
		let readFailed = false;
		try {
			raw = (await storage.get(STATE_KEYS)) || {};
		} catch {
			readFailed = true;
		}
		const { state, changed } = normalizeState(raw);
		// Never write defaults over real data after a failed read.
		if (changed && !readFailed) {
			try {
				await storage.set(state);
			} catch {
				/* a read-only storage area must not break the popup */
			}
		}
		return state;
	}

	async function saveState(patch, area) {
		const storage = area || defaultArea();
		const { state } = normalizeState({ ...(await loadState(storage)), ...patch });
		await storage.set(state);
		return state;
	}

	Aria2Helper.storage = Object.freeze({
		normalizeProfile,
		normalizeSettings,
		normalizeState,
		normalizeHeader,
		normalizePort,
		splitHostPort,
		activeProfile,
		hasUsableProfile,
		createMemoryArea,
		loadState,
		saveState,
	});
})(typeof globalThis !== "undefined" ? globalThis : this);
