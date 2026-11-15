/**
 * Browser API mock for rendering popup.html / settings.html outside Safari.
 * Injected by tests/ui/serve.mjs before the real page scripts.
 */
(function () {
	"use strict";

	const params = new URLSearchParams(location.search);
	const lang = params.get("lang") === "en" ? "en" : "zh-CN";
	const messages = (window.__MESSAGES__ && (window.__MESSAGES__[lang] || window.__MESSAGES__["en"])) || {};
	const seed = params.get("seed") || "configured";

	const settings = {
		schemaVersion: 2,
		showBadge: true,
		showNotification: true,
		listenDownloads: true,
		sendCookies: true,
		sendReferer: true,
		skipExtensions: [".nfo", ".txt"],
		skipFilesInTorrent: true,
		confirmTorrentSelection: true,
		appearance: { liquidGlass: params.get("glass") === "1", showBackground: params.get("bg") === "1" },
		filterLists: {
			blacklist: { name: "Blacklist", extensions: [".jpg"] },
			whitelist: { name: "Whitelist", extensions: [] },
		},
	};

	const configuredProfile = {
		id: "rayburst",
		alias: "Rayburst",
		rpcHost: "127.0.0.1",
		rpcPort: "29100",
		rpcPath: "/jsonrpc",
		rpcIshttps: false,
		rpcSecret: "demo",
		dir: "/Users/wxm/Downloads",
		header: [],
		isDefault: true,
	};

	const state =
		seed === "empty"
			? {
					schemaVersion: 2,
					profiles: { init: { ...configuredProfile, id: "init", alias: "aria2", rpcHost: "", rpcPort: "", rpcSecret: "", dir: "", isDefault: true } },
					currentProfileId: "init",
					defaultProfileId: "init",
					settings,
					device: "macos",
					themeColor: "rgba(88, 217, 77, 0.8)",
				}
			: {
					schemaVersion: 2,
					profiles: { rayburst: configuredProfile },
					currentProfileId: "rayburst",
					defaultProfileId: "rayburst",
					settings,
					device: "macos",
					themeColor: "rgba(88, 217, 77, 0.8)",
				};

	let data = JSON.parse(JSON.stringify(state));

	const storage = {
		async get(keys) {
			if (keys == null) return JSON.parse(JSON.stringify(data));
			const list = Array.isArray(keys) ? keys : [keys];
			const result = {};
			for (const key of list) if (key in data) result[key] = JSON.parse(JSON.stringify(data[key]));
			return result;
		},
		async set(patch) {
			data = { ...data, ...JSON.parse(JSON.stringify(patch)) };
		},
	};

	const version = {
		product: "aria2-next",
		version: "3.0.9",
		rpcVersion: "1.1.0",
		enabledFeatures: ["BitTorrent", "ED2K", "GZip", "HTTPS", "HLS/DASH", "Message Digest", "Metalink", "SFTP"],
		mediaFeatures: ["request-contexts", "stable-track-ids", "structured-errors", "captured-inputs"],
		downloadFeatures: ["filename-hints", "filename-resolution"],
		isAria2Next: true,
		supportsProbe: true,
		supportsTorrentInspect: true,
		supportsMedia: true,
	};

	const gid = (suffix) => `${suffix}0123456789abcdef`.slice(0, 16);

	const activeTorrent = {
		gid: gid("a1"),
		status: "active",
		totalLength: "4509715660",
		completedLength: "1962934272",
		uploadLength: "1048576",
		downloadSpeed: "12582912",
		uploadSpeed: "262144",
		connections: "24",
		dir: "/Users/wxm/Downloads",
		files: [{ index: "1", path: "/Users/wxm/Downloads/Show.S01E01.1080p.mkv", length: "4509715660", completedLength: "1962934272", selected: "true", uris: [] }],
		bittorrent: { info: { name: "Show.S01E01.1080p.mkv" }, numPeers: "24", numSeeds: "12" },
	};

	const activeMedia = {
		gid: gid("a2"),
		status: "active",
		totalLength: "0",
		completedLength: "0",
		downloadSpeed: "0",
		uploadSpeed: "0",
		dir: "/Users/wxm/Downloads",
		files: [{ index: "1", path: "/Users/wxm/Downloads/keynote-live.mp4", length: "0", completedLength: "0", selected: "true", uris: [{ uri: "https://example.com/keynote/live.m3u8", status: "used" }] }],
		media: { state: "downloading", protocol: "hls", live: "true", progress: "0.4167", downloadedLength: "157286400", duration: "7200000", completedDuration: "3000000" },
	};

	const waiting = {
		gid: gid("b1"),
		status: "waiting",
		totalLength: "2684354560",
		completedLength: "0",
		downloadSpeed: "0",
		uploadSpeed: "0",
		dir: "/Users/wxm/Downloads",
		files: [{ index: "1", path: "/Users/wxm/Downloads/Xcode_26.2.xip", length: "2684354560", completedLength: "0", selected: "true", uris: [{ uri: "https://developer.apple.com/xcode.xip", status: "waiting" }] }],
	};

	const complete = {
		gid: gid("c1"),
		status: "complete",
		totalLength: "1073741824",
		completedLength: "1073741824",
		downloadSpeed: "0",
		uploadSpeed: "0",
		dir: "/Users/wxm/Downloads",
		files: [{ index: "1", path: "/Users/wxm/Downloads/MotrixNext-1.0.dmg", length: "1073741824", completedLength: "1073741824", selected: "true", uris: [{ uri: "https://example.com/MotrixNext-1.0.dmg", status: "used" }] }],
	};

	const failed = {
		gid: gid("d1"),
		status: "error",
		totalLength: "0",
		completedLength: "0",
		downloadSpeed: "0",
		uploadSpeed: "0",
		errorCode: "3",
		errorMessage: "Resource not found",
		dir: "/Users/wxm/Downloads",
		files: [{ index: "1", path: "/Users/wxm/Downloads/ubuntu-26.04.iso", length: "0", completedLength: "0", selected: "true", uris: [{ uri: "https://example.com/ubuntu.iso", status: "used" }] }],
	};

	const list = { active: [activeTorrent, activeMedia], waiting: [waiting], stopped: [complete, failed], stat: { downloadSpeed: "12582912", uploadSpeed: "262144", numActive: "2", numWaiting: "1", numStopped: "2" } };

	const torrentFiles = {
		name: "Example.Show.S01",
		totalLength: 15000000000,
		files: [
			{ index: 1, path: "Example.Show.S01E01.1080p.mkv", length: 4200000000, extension: ".mkv" },
			{ index: 2, path: "Example.Show.S01E01.nfo", length: 4096, extension: ".nfo" },
			{ index: 3, path: "Example.Show.S01E02.1080p.mkv", length: 4300000000, extension: ".mkv" },
			{ index: 4, path: "Subs/Example.Show.S01E01.zh.srt", length: 64000, extension: ".srt" },
			{ index: 5, path: "Sample/sample.mp4", length: 84000000, extension: ".mp4" },
		],
		engine: "aria2-next",
	};

	function reply(message, sendResponse) {
		const api = message && message.api;
		const ok = (value) => sendResponse({ ok: true, data: value });
		const fail = (code, text) => sendResponse({ ok: false, error: { code, message: text } });
		if (seed === "empty" && (api === "engine.getVersion" || api === "downloads.list" || api === "downloads.getGlobalStat")) {
			return fail("ECONFIG", "Aria2Helper has no configured aria2 connection yet");
		}
		switch (api) {
			case "engine.getVersion":
				return ok(version);
			case "downloads.list":
				return ok(list);
			case "engine.test":
				return ok({ ok: true, version, endpoint: "http://127.0.0.1:29100/jsonrpc" });
			case "torrent.inspect":
				return ok(torrentFiles);
			case "downloads.addBatch":
			case "downloads.addUri":
			case "downloads.addTorrent":
			case "downloads.addMetalink":
				return ok({ gid: gid("e1"), added: [{ kind: "uri", gid: gid("e1") }], failed: [], skipped: [] });
			case "downloads.pause":
			case "downloads.unpause":
			case "downloads.remove":
			case "downloads.removeResult":
			case "downloads.purgeResults":
				return ok(true);
			case "native.selectFile":
				return ok({ isLocal: true, result: true });
			case "listen.toggle": {
				data.settings.listenDownloads = !data.settings.listenDownloads;
				return ok({ listenDownloads: data.settings.listenDownloads });
			}
			case "profile.setDefault":
				data.defaultProfileId = message.profileId;
				return ok(true);
			case "state.get":
			case "get-local-storage":
				return ok(data);
			default:
				return fail("EUNKNOWN", `mock has no handler for ${api}`);
		}
	}

	window.browser = {
		storage: { local: storage, onChanged: { addListener() {} } },
		runtime: {
			lastError: null,
			getManifest: () => ({ version: "2.0.0" }),
			getURL: (path) => path,
			openOptionsPage: () => {
				location.href = "settings.html?seed=configured";
			},
			sendMessage: (message, callback) => {
				setTimeout(() => {
					if (callback) reply(message, callback);
				}, 30);
			},
			sendNativeMessage: (message, callback) => {
				setTimeout(() => callback && callback({ result: { r: 88, g: 187, b: 68, a: 255, device: "macos" } }), 20);
			},
			onMessage: { addListener() {} },
			onInstalled: { addListener() {} },
			onStartup: { addListener() {} },
		},
		i18n: {
			getMessage: (key) => messages[key] || "",
		},
		contextMenus: { removeAll() {}, create() {}, onClicked: { addListener() {} } },
		action: { setBadgeText: async () => {} },
	};
})();
