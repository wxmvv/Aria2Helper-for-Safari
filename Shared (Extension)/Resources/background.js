/**
 * Aria2Helper background service worker.
 *
 * Responsibilities: message routing, RPC orchestration, context menus, badge.
 * All RPC and storage logic lives in common/*.js so the popup, settings and
 * tests exercise the same code paths.
 */
(function (global) {
	"use strict";

	importScripts(
		"common/constants.js",
		"common/util.js",
		"common/files.js",
		"common/filters.js",
		"common/bencode.js",
		"common/storage.js",
		"common/rpc.js",
		"common/messaging.js",
		"common/i18n.js"
	);

	const { storage, rpc, files, bencode, constants, i18n } = global.Aria2Helper;

	const MENU_IDS = {
		link: "Aria2HelperWebDownloadLink",
		selection: "Aria2HelperWebDownloadSelection",
		image: "Aria2HelperWebDownloadImage",
		video: "Aria2HelperWebDownloadVideo",
		audio: "Aria2HelperWebDownloadAudio",
	};

	let engineCache = { at: 0, value: null };

	function ok(data) {
		return { ok: true, data };
	}

	function fail(error) {
		const e = error || {};
		return {
			ok: false,
			error: {
				code: e.code || "EUNKNOWN",
				message: e.message || String(error || "Unknown error"),
				rpcCode: e.rpcCode,
				data: e.data,
			},
		};
	}

	async function getState() {
		return storage.loadState();
	}

	async function activeProfile() {
		const state = await getState();
		const profile = storage.activeProfile(state);
		if (!storage.hasUsableProfile(profile)) {
			throw new rpc.Aria2Error(rpc.ErrorCode.CONFIG, "Aria2Helper has no configured aria2 connection yet");
		}
		return { state, profile };
	}

	function clientFor(profile) {
		return rpc.createClient(profile);
	}

	/**
	 * Build aria2 task options from the profile plus page context.
	 * Merge order: profile headers, page headers, cookie, referer.
	 */
	function buildOptions(profile, settings, extra) {
		const options = {};
		if (profile.dir) options.dir = profile.dir;
		const headers = [];
		for (const line of profile.header || []) headers.push(line);
		for (const line of (extra && extra.header) || []) headers.push(line);
		if (settings.sendCookies && extra && extra.cookie) {
			const value = String(extra.cookie).trim();
			if (value && !headers.some((line) => /^cookie\s*:/i.test(line))) headers.push(`Cookie: ${value}`);
		}
		if (headers.length) options.header = headers;
		if (settings.sendReferer && extra && extra.referer) options.referer = String(extra.referer);
		if (extra && extra.out) options.out = String(extra.out);
		if (extra && extra.split) options.split = String(extra.split);
		if (extra && extra.selectFile) options["select-file"] = String(extra.selectFile);
		if (extra && extra.options && typeof extra.options === "object") Object.assign(options, extra.options);
		return options;
	}

	async function getEngine(force) {
		const now = Date.now();
		if (!force && engineCache.value && now - engineCache.at < 30000) return engineCache.value;
		const { profile } = await activeProfile();
		const version = await clientFor(profile).getVersion();
		engineCache = { at: now, value: { version, profile } };
		return engineCache.value;
	}

	async function addSingleUri(profile, settings, url, extra) {
		const urls = Array.isArray(url) ? url.filter(Boolean) : [url].filter(Boolean);
		if (urls.length === 0) throw new Error("No URL to download");
		const client = clientFor(profile);
		const options = buildOptions(profile, settings, extra);
		return client.call("aria2.addUri", [urls, options]);
	}

	async function addTorrentTask(profile, settings, base64, extra) {
		const client = clientFor(profile);
		const options = buildOptions(profile, settings, extra);
		return client.call("aria2.addTorrent", [base64, (extra && extra.urls) || [], options]);
	}

	async function addMetalinkTask(profile, settings, base64, extra) {
		const client = clientFor(profile);
		const options = buildOptions(profile, settings, extra);
		return client.call("aria2.addMetalink", [base64, options]);
	}

	async function listDownloads() {
		const { profile } = await activeProfile();
		const client = clientFor(profile);
		const results = await client.multicall([
			{ method: "aria2.tellActive", params: [] },
			{ method: "aria2.tellWaiting", params: [0, 1000] },
			{ method: "aria2.tellStopped", params: [0, 1000] },
			{ method: "aria2.getGlobalStat", params: [] },
		]);
		const [active, waiting, stopped, stat] = results;
		const firstError = results.find((entry) => !entry.ok);
		if (firstError && results.slice(0, 3).every((entry) => !entry.ok)) throw firstError.error;
		return {
			active: active.ok ? active.result || [] : [],
			waiting: waiting.ok ? waiting.result || [] : [],
			stopped: stopped.ok ? stopped.result || [] : [],
			stat: stat.ok ? stat.result || {} : {},
			partial: Boolean(firstError),
		};
	}

	async function batchLimit(items, limit, worker) {
		const results = new Array(items.length);
		let cursor = 0;
		async function runner() {
			while (cursor < items.length) {
				const index = cursor++;
				try {
					results[index] = { ok: true, value: await worker(items[index], index) };
				} catch (error) {
					results[index] = { ok: false, error };
				}
			}
		}
		const runners = Array.from({ length: Math.min(limit, items.length) }, runner);
		await Promise.all(runners);
		return results;
	}

	async function addBatch(message) {
		const { state, profile } = await activeProfile();
		const settings = state.settings;
		const items = Array.isArray(message.items) ? message.items : [];
		const seen = new Set();
		const prepared = [];
		const skipped = [];
		for (const item of items) {
			if (!item || typeof item !== "object") continue;
			const id = String(item.id || "");
			if (item.kind === "uri") {
				const url = String(item.url || "").trim();
				if (!url) continue;
				if (seen.has(url)) {
					skipped.push({ id, kind: item.kind, name: url, reason: "duplicate" });
					continue;
				}
				seen.add(url);
				// The skip list governs automatic link interception, not an explicit paste.
				prepared.push({ id, kind: "uri", url, extra: item.extra || {} });
			} else if (item.kind === "torrent" || item.kind === "metalink") {
				if (!item.file) throw new Error(`Missing ${item.kind} payload`);
				if (seen.has(item.file)) {
					skipped.push({ id, kind: item.kind, name: item.name || "", reason: "duplicate" });
					continue;
				}
				seen.add(item.file);
				prepared.push({ id, kind: item.kind, file: item.file, name: item.name || "", extra: item.extra || {} });
			}
		}
		const results = await batchLimit(prepared, constants.RPC_MAX_CONCURRENT_ADDS, async (task) => {
			if (task.kind === "uri") return addSingleUri(profile, settings, task.url, task.extra);
			if (task.kind === "torrent") return addTorrentTask(profile, settings, task.file, task.extra);
			return addMetalinkTask(profile, settings, task.file, task.extra);
		});
		const added = [];
		const failed = [];
		results.forEach((result, index) => {
			const task = prepared[index];
			if (result.ok) added.push({ id: task.id, kind: task.kind, name: task.name || task.url || "", gid: result.value });
			else failed.push({ id: task.id, kind: task.kind, name: task.name || task.url || "", error: result.error.message || String(result.error) });
		});
		refreshBadgeSoon();
		return { added, failed, skipped, total: items.length };
	}

	async function inspectTorrent(base64) {
		const binary = atob(base64);
		const bytes = new Uint8Array(binary.length);
		for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
		const parsed = bencode.parseTorrent(bytes);
		let engine = null;
		try {
			engine = await getEngine();
		} catch {
			engine = null;
		}
		return { ...parsed, engine: engine ? engine.version.product : "" };
	}

	async function resolveFilename(message) {
		const url = String(message.url || "");
		const { profile } = await activeProfile();
		const client = clientFor(profile);
		let engine = null;
		try {
			engine = await getEngine();
		} catch {
			engine = null;
		}
		if (engine && engine.version.supportsProbe) {
			const probe = await client.call("aria2.probe", [url, buildOptions(profile, (await getState()).settings, {})]);
			return {
				filename: (probe && probe.filename) || files.basename(probe && probe.finalUrl) || files.basename(url),
				contentType: (probe && probe.contentType) || "",
				totalLength: (probe && probe.totalLength) || 0,
				resumable: Boolean(probe && probe.resumable),
			};
		}
		return { filename: files.basename(url), contentType: "", totalLength: 0, resumable: false };
	}

	async function handleMessage(message) {
		if (!message || typeof message !== "object" || typeof message.api !== "string") {
			throw new Error("Unsupported message");
		}
		const api = message.api;
		const state = await getState();

		switch (api) {
			case "state.get":
				return ok(state);
			case "settings.update": {
				const patch = message.patch && typeof message.patch === "object" ? message.patch : {};
				const next = await storage.saveState(
					{
						settings: {
							...state.settings,
							...patch,
							filterLists: { ...state.settings.filterLists, ...(patch.filterLists || {}) },
							appearance: { ...state.settings.appearance, ...(patch.appearance || {}) },
						},
					},
					undefined
				);
				refreshBadgeSoon();
				return ok(next.settings);
			}
			case "profile.save": {
				const profileId = String(message.profileId || "");
				if (!profileId) throw new Error("profileId is required");
				const profiles = { ...state.profiles, [profileId]: storage.normalizeProfile(profileId, message.profile) };
				let defaultProfileId = state.defaultProfileId;
				if (message.makeDefault || !storage.hasUsableProfile(state.profiles[defaultProfileId])) defaultProfileId = profileId;
				const next = await storage.saveState({ profiles, defaultProfileId, currentProfileId: profileId });
				engineCache = { at: 0, value: null };
				refreshBadgeSoon();
				return ok({ state: next });
			}
			case "profile.setDefault": {
				const profileId = String(message.profileId || "");
				if (!state.profiles[profileId]) throw new Error("Unknown profile");
				await storage.saveState({ defaultProfileId: profileId, currentProfileId: profileId });
				engineCache = { at: 0, value: null };
				refreshBadgeSoon();
				return ok(true);
			}
			case "listen.toggle": {
				const settings = await storage.saveState({ settings: { ...state.settings, listenDownloads: !state.settings.listenDownloads } });
				return ok({ listenDownloads: settings.settings.listenDownloads });
			}
			case "engine.getVersion": {
				const { version } = await getEngine(true);
				return ok(version);
			}
			case "engine.test": {
				const profile = storage.normalizeProfile("test", message.profile || storage.activeProfile(state) || {});
				const result = await rpc.testConnection(profile);
				return ok(result);
			}
			case "engine.discover": {
				const candidates = (message.candidates || constants.LOCAL_ENGINE_CANDIDATES).map((candidate) => ({
					...candidate,
					rpcSecret: message.secret || "",
				}));
				const found = await rpc.discoverLocalEngines(candidates, { timeoutMs: message.timeoutMs || 2500 });
				return ok(found);
			}
			case "downloads.list":
				return ok(await listDownloads());
			case "downloads.getGlobalStat": {
				const { profile } = await activeProfile();
				return ok(await clientFor(profile).call("aria2.getGlobalStat"));
			}
			case "downloads.pause": {
				const { profile } = await activeProfile();
				return ok(await clientFor(profile).call(message.force === false ? "aria2.pause" : "aria2.forcePause", [String(message.gid)]));
			}
			case "downloads.unpause": {
				const { profile } = await activeProfile();
				return ok(await clientFor(profile).call("aria2.unpause", [String(message.gid)]));
			}
			case "downloads.pauseAll": {
				const { profile } = await activeProfile();
				await clientFor(profile).call("aria2.pauseAll");
				return ok(true);
			}
			case "downloads.unpauseAll": {
				const { profile } = await activeProfile();
				await clientFor(profile).call("aria2.unpauseAll");
				return ok(true);
			}
			case "downloads.remove": {
				const { profile } = await activeProfile();
				const gid = String(message.gid || "");
				if (!gid) throw new Error("gid is required");
				return ok(await clientFor(profile).call(message.force === false ? "aria2.remove" : "aria2.forceRemove", [gid]));
			}
			case "downloads.removeResult": {
				const { profile } = await activeProfile();
				await clientFor(profile).call("aria2.removeDownloadResult", [String(message.gid)]);
				return ok(true);
			}
			case "downloads.purgeResults": {
				const { profile } = await activeProfile();
				await clientFor(profile).call("aria2.purgeDownloadResult");
				return ok(true);
			}
			case "downloads.addUri": {
				const { profile } = await activeProfile();
				const gid = await addSingleUri(profile, state.settings, message.url || message.urls, {
					cookie: message.cookie,
					referer: message.referer,
					header: message.header,
					out: message.out,
					split: message.split,
				});
				refreshBadgeSoon();
				return ok({ gid });
			}
			case "downloads.addTorrent": {
				const { profile } = await activeProfile();
				if (!message.file) throw new Error("Torrent payload is required");
				const gid = await addTorrentTask(profile, state.settings, String(message.file), {
					urls: message.urls,
					selectFile: message.selectFile,
					out: message.out,
				});
				refreshBadgeSoon();
				return ok({ gid });
			}
			case "downloads.addMetalink": {
				const { profile } = await activeProfile();
				if (!message.file) throw new Error("Metalink payload is required");
				const gid = await addMetalinkTask(profile, state.settings, String(message.file), {});
				refreshBadgeSoon();
				return ok({ gid });
			}
			case "downloads.addBatch":
				return ok(await addBatch(message));
			case "torrent.inspect": {
				if (!message.file) throw new Error("Torrent payload is required");
				return ok(await inspectTorrent(String(message.file)));
			}
			case "downloads.resolveFilename":
				return ok(await resolveFilename(message));
			case "native.selectFile": {
				const { profile } = await activeProfile();
				const local = /^(localhost|127\.0\.0\.1|::1)$/i.test(profile.rpcHost);
				if (!local) return ok({ isLocal: false, result: false });
				const native = await global.Aria2Helper.messaging.sendNative({ message: "select-file", url: String(message.url || "") });
				return ok({ isLocal: true, result: native.ok ? (native.data && native.data.result) || false : false, error: native.ok ? undefined : native.error });
			}
			case "native.notify": {
				const native = await global.Aria2Helper.messaging.sendNative({
					message: "open-notification",
					title: message.title || constants.APP_NAME,
					subtitle: message.subtitle || "",
					body: message.body || "",
				});
				return ok(native.ok ? native.data : null);
			}
			case "native.themeColor": {
				const native = await global.Aria2Helper.messaging.sendNative({ message: "get-color" });
				if (!native.ok || !native.data || !native.data.result) return ok(null);
				const result = native.data.result;
				await storage.saveState({ device: result.device || "", themeColor: `rgba(${result.r - 10}, ${result.g + 30}, ${result.b + 9}, 0.8)` });
				return ok(result);
			}
			case "menu.refresh":
				createMenus();
				return ok(true);
			default:
				throw new Error(`Unknown API: ${api}`);
		}
	}

	// --- badge -------------------------------------------------------------

	let badgeTimer = null;

	function refreshBadgeSoon() {
		if (badgeTimer) clearTimeout(badgeTimer);
		badgeTimer = setTimeout(() => {
			badgeTimer = null;
			refreshBadge().catch(() => {});
		}, 400);
	}

	async function refreshBadge() {
		const { browser } = global;
		if (!browser) return;
		const action = browser.action || browser.browserAction;
		if (!action || !action.setBadgeText) return;
		const clear = async () => {
			try {
				await action.setBadgeText({ text: "" });
			} catch {
				/* badge is optional */
			}
		};
		let state;
		try {
			state = await getState();
		} catch {
			return;
		}
		if (!state.settings.showBadge) {
			await clear();
			return;
		}
		const profile = storage.activeProfile(state);
		if (!storage.hasUsableProfile(profile)) {
			await clear();
			return;
		}
		try {
			const client = clientFor(profile);
			const active = await client.call("aria2.tellActive", []);
			const count = Array.isArray(active) ? active.length : 0;
			await action.setBadgeText({ text: count > 0 ? String(count) : "" });
		} catch {
			await clear();
		}
	}

	// --- notifications ------------------------------------------------------

	async function notify(title, body) {
		try {
			const state = await getState();
			if (!state.settings.showNotification) return;
			await global.Aria2Helper.messaging.sendNative({ message: "open-notification", title, subtitle: "", body });
		} catch {
			/* notifications are best-effort */
		}
	}

	// --- context menus ------------------------------------------------------

	function createMenus() {
		if (!global.browser || !global.browser.contextMenus) return;
		global.browser.contextMenus.removeAll(() => {
			const menus = [
				[MENU_IDS.link, "Download_link_with_Aria2", ["link"], ["*://*/*"]],
				[MENU_IDS.selection, "Download_selection_with_Aria2", ["selection"], null],
				[MENU_IDS.image, "Download_image_with_Aria2", ["image"], null],
				[MENU_IDS.video, "Download_video_with_Aria2", ["video"], null],
				[MENU_IDS.audio, "Download_audio_with_Aria2", ["audio"], null],
			];
			for (const [id, key, contexts, patterns] of menus) {
				const props = { id, title: i18n.t(key), contexts };
				if (patterns) props.targetUrlPatterns = patterns;
				try {
					global.browser.contextMenus.create(props);
				} catch {
					/* duplicate ids after a reload are harmless */
				}
			}
		});
	}

	async function handleMenuClick(info) {
		const state = await getState();
		const profile = storage.activeProfile(state);
		if (!storage.hasUsableProfile(profile)) {
			await notify(constants.APP_NAME, i18n.t("please_connect_first"));
			return;
		}
		let url = "";
		if (info.menuItemId === MENU_IDS.link) url = info.linkUrl || "";
		else if (info.menuItemId === MENU_IDS.selection) url = (info.selectionText || "").trim();
		else url = info.srcUrl || "";
		if (!url) return;
		const parts = files.getFileParts(url);
		try {
			await addSingleUri(profile, state.settings, url, { referer: info.pageUrl || "" });
			await notify(i18n.t("Task_added_successfully"), parts.filename || parts.nameWithoutExtension);
			refreshBadgeSoon();
		} catch (error) {
			await notify(i18n.t("Task_added_failed"), error.message || String(error));
		}
	}

	// --- wiring -------------------------------------------------------------

	if (global.browser && global.browser.runtime && global.browser.runtime.onMessage) {
		global.browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
			handleMessage(message, sender)
				.then(sendResponse)
				.catch((error) => sendResponse(fail(error)));
			return true;
		});
	}

	if (global.browser && global.browser.contextMenus && global.browser.contextMenus.onClicked) {
		global.browser.contextMenus.onClicked.addListener((info) => {
			handleMenuClick(info).catch(() => {});
		});
	}

	if (global.browser && global.browser.runtime && global.browser.runtime.onInstalled) {
		global.browser.runtime.onInstalled.addListener(() => {
			storage.loadState().then(createMenus).catch(() => {});
		});
	}

	if (global.browser && global.browser.runtime && global.browser.runtime.onStartup) {
		global.browser.runtime.onStartup.addListener(() => {
			storage.loadState().then(createMenus).catch(() => {});
		});
	}

	getState()
		.then(() => {
			createMenus();
			return refreshBadge();
		})
		.catch(() => {});

	global.Aria2HelperBackground = { handleMessage, addSingleUri, listDownloads, refreshBadge };
})(typeof globalThis !== "undefined" ? globalThis : this);
