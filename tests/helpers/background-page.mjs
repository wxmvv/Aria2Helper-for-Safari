import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { loadCommon, resourcesDir } from "./load-common.mjs";

export function backgroundPage(fetchImpl) {
	let listener;
	let data;
	const browser = {
		storage: { local: {
			async get() { return JSON.parse(JSON.stringify(data)); },
			async set(patch) { data = { ...data, ...JSON.parse(JSON.stringify(patch)) }; },
		} },
		runtime: { onMessage: { addListener(callback) { listener = callback; } } },
	};
	const common = loadCommon(null, { browser, fetch: fetchImpl });
	data = common.storage.normalizeState({ profiles: { local: { rpcHost: "localhost", rpcPort: "6800" } } }).state;
	vm.runInNewContext(fs.readFileSync(path.join(resourcesDir(), "background.js"), "utf8"), {
		Aria2Helper: common, browser, importScripts() {}, setTimeout: () => 1, clearTimeout() {}, console,
	});
	return { send: (message) => new Promise((resolve) => listener(message, {}, resolve)) };
}
