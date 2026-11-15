import test from "node:test";
import assert from "node:assert/strict";
import { loadCommon } from "../helpers/load-common.mjs";

const plain = (value) => JSON.parse(JSON.stringify(value));

const A = loadCommon();
const { normalizeState, normalizeProfile, normalizeSettings, createMemoryArea, loadState, saveState, activeProfile } = A.storage;

const legacy = {
	profiles: {
		init: {
			alias: "New",
			rpcHost: "http://127.0.0.1/",
			rpcPort: 29100,
			rpcSecret: "secret",
			isDefault: true,
			header: "Referer: https://example.com\nbroken",
		},
	},
	currentProfileId: "missing",
	defaultProfileId: "init",
	settings: {
		showBadge: true,
		listenDownloads: true,
		filterLists: { blacklist: { name: "Blacklist", extensions: ["MP4", ".mkv", ".mp4"] } },
	},
	device: "macos",
};

test("migrates legacy profiles without losing data", () => {
	const { state, changed } = normalizeState(legacy);
	assert.equal(changed, true);
	assert.equal(state.schemaVersion, 2);
	const profile = state.profiles.init;
	assert.equal(profile.rpcHost, "127.0.0.1");
	assert.equal(profile.rpcPort, "29100");
	assert.equal(profile.rpcPath, "/jsonrpc");
	assert.deepEqual(plain(profile.header), ["Referer: https://example.com"]);
	assert.equal(profile.isDefault, true);
	assert.equal(state.currentProfileId, "init");
	assert.equal(state.settings.showBadge, true);
	assert.deepEqual(plain(state.settings.filterLists.blacklist.extensions), [".mp4", ".mkv"]);
	assert.deepEqual(plain(state.settings.skipExtensions), []);
	assert.equal(state.settings.sendCookies, true);
});

test("normalisation is idempotent", () => {
	const once = normalizeState(legacy).state;
	const twice = normalizeState(once);
	assert.equal(twice.changed, false);
	assert.deepEqual(plain(twice.state), plain(once));
});

test("invalid or empty profiles get a usable placeholder", () => {
	const { state } = normalizeState({});
	assert.equal(Object.keys(state.profiles).length, 1);
	assert.equal(state.defaultProfileId, "init");
	assert.equal(state.settings.skipFilesInTorrent, true);
	assert.equal(activeProfile(state).id, "init");
});

test("profile normalisation clamps ports, paths and headers", () => {
	const profile = normalizeProfile("x", {
		rpcHost: "https://aria.local:6800/path",
		rpcPort: "70000",
		rpcPath: "rpc",
		header: ["A: 1", "a: 2", ""],
	});
	assert.equal(profile.rpcHost, "aria.local");
	assert.equal(profile.rpcPort, "6800");
	assert.equal(profile.rpcPath, "/rpc");
	assert.deepEqual(plain(profile.header), ["A: 1"]);
});

test("settings keep explicit false values", () => {
	const settings = normalizeSettings({ sendCookies: false, sendReferer: false, skipFilesInTorrent: false, appearance: { liquidGlass: false } });
	assert.equal(settings.sendCookies, false);
	assert.equal(settings.sendReferer, false);
	assert.equal(settings.skipFilesInTorrent, false);
	assert.equal(settings.appearance.liquidGlass, false);
});

test("experimental appearance defaults off for new and legacy storage", async () => {
	for (const snapshot of [{}, legacy]) {
		const area = createMemoryArea(snapshot);
		const state = await loadState(area);
		assert.deepEqual(plain(state.settings.appearance), { liquidGlass: false, showBackground: false });
		const stored = await area.get(null);
		assert.deepEqual(plain(stored.settings.appearance), { liquidGlass: false, showBackground: false });
	}
});

test("experimental appearance preserves saved choices and defaults missing flags off", async () => {
	for (const appearance of [
		{ liquidGlass: true, showBackground: true },
		{ liquidGlass: true, showBackground: false },
		{ liquidGlass: false, showBackground: true },
		{ liquidGlass: false, showBackground: false },
	]) {
		const area = createMemoryArea({ settings: { appearance } });
		assert.deepEqual(plain((await loadState(area)).settings.appearance), appearance);
	}
	assert.deepEqual(plain(normalizeSettings({ appearance: { liquidGlass: true } }).appearance), {
		liquidGlass: true, showBackground: false,
	});
	assert.deepEqual(plain(normalizeSettings({ appearance: { showBackground: true } }).appearance), {
		liquidGlass: false, showBackground: true,
	});
});

test("loadState persists the migrated schema once", async () => {
	const area = createMemoryArea(legacy);
	const state = await loadState(area);
	assert.equal(state.schemaVersion, 2);
	const stored = await area.get(null);
	assert.equal(stored.schemaVersion, 2);
	const saved = await saveState({ settings: { ...state.settings, showBadge: false } }, area);
	assert.equal(saved.settings.showBadge, false);
	assert.deepEqual(plain((await area.get(null)).settings.skipExtensions), []);
});
