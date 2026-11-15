import test from "node:test";
import assert from "node:assert/strict";
import { loadCommon } from "../helpers/load-common.mjs";

const clone = (value) => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done; }); return { promise, resolve }; };
let area;
const browser = { storage: { local: { get: (...args) => area.get(...args), set: (...args) => area.set(...args) } } };
globalThis.browser = browser;
globalThis.Aria2Helper = loadCommon(null, { browser });
const { storage } = globalThis.Aria2Helper;
const { default: Helper } = await import("../../settings/src/Helper.js");

async function fixture() {
	let stored = clone(storage.normalizeState({ profiles: {
		a: { rpcHost: "localhost", rpcPort: "6800", alias: "A" },
		b: { rpcHost: "localhost", rpcPort: "6801", alias: "B" },
	}, defaultProfileId: "a", currentProfileId: "a" }).state);
	let gate;
	let readGate;
	area = {
		async get() {
			const result = clone(stored);
			if (readGate) { const pending = readGate; readGate = null; pending.started.resolve(); await pending.release.promise; }
			return result;
		},
		async set(patch) {
			if (gate) { const pending = gate; gate = null; pending.started.resolve(); await pending.release.promise; }
			stored = { ...stored, ...clone(patch) };
		},
	};
	const helper = new Helper();
	await helper.init();
	return {
		helper,
		stored: () => clone(stored),
		external(patch) { stored = { ...stored, ...clone(patch) }; },
		pauseRead() { readGate = { started: deferred(), release: deferred() }; return readGate; },
		pauseWrite() { gate = { started: deferred(), release: deferred() }; return gate; },
	};
}

test("settings edited during a pending write are saved by the queued write", async () => {
	const f = await fixture();
	const gate = f.pauseWrite();
	f.helper.updateSettings({ appearance: { liquidGlass: true } });
	await gate.started.promise;
	f.helper.updateSettings({ appearance: { showBackground: true } });
	gate.release.resolve();
	await f.helper.saveChain;
	assert.deepEqual(f.stored().settings.appearance, { liquidGlass: true, showBackground: true });
	assert.deepEqual(clone(f.helper.getSettings().appearance), f.stored().settings.appearance);
});

test("reverting a setting during a pending write keeps the final user choice", async () => {
	const f = await fixture();
	const gate = f.pauseWrite();
	f.helper.updateSettings({ showBadge: true });
	await gate.started.promise;
	f.helper.updateSettings({ showBadge: false });
	gate.release.resolve();
	await f.helper.saveChain;
	assert.equal(f.stored().settings.showBadge, false);
});

test("profile edits and selection changes survive a pending settings write", async () => {
	const f = await fixture();
	const gate = f.pauseWrite();
	f.helper.updateSettings({ showBadge: true });
	await gate.started.promise;
	f.helper.setProfileById("b", { ...f.helper.getProfileById("b"), alias: "New B" });
	f.helper.setDefaultProfileById("b");
	f.helper.setCurrentProfileById("b");
	f.helper.removeProfileById("a");
	gate.release.resolve();
	await f.helper.saveChain;
	assert.equal(f.stored().profiles.b.alias, "New B");
	assert.equal(f.stored().profiles.a, undefined);
	assert.equal(f.stored().defaultProfileId, "b");
	assert.equal(f.stored().currentProfileId, "b");
});

test("saving a local field preserves an unrelated change from another surface", async () => {
	const f = await fixture();
	f.external({ settings: { ...f.stored().settings, listenDownloads: true } });
	f.helper.updateSettings({ showBadge: true });
	await f.helper.saveChain;
	assert.equal(f.stored().settings.listenDownloads, true);
	assert.equal(f.stored().settings.showBadge, true);
});


test("a stale refresh cannot roll back an edit saved while the read was pending", async () => {
	const f = await fixture();
	const gate = f.pauseRead();
	const refresh = f.helper.refresh();
	await gate.started.promise;
	f.helper.updateSettings({ showBadge: true });
	await f.helper.saveChain;
	gate.release.resolve();
	await refresh;
	assert.equal(f.stored().settings.showBadge, true);
	assert.equal(f.helper.getSettings().showBadge, true);
});
