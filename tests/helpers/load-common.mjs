import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const resources = path.resolve(here, "../../Shared (Extension)/Resources");

export function loadCommon(files = null) {
	const context = {
		console,
		TextEncoder,
		TextDecoder,
		URL,
		URLSearchParams,
		AbortController,
		setTimeout,
		clearTimeout,
		atob,
		btoa,
		fetch: globalThis.fetch,
		Response,
	};
	context.globalThis = context;
	vm.createContext(context);
	const list =
		files || ["constants.js", "util.js", "files.js", "filters.js", "bencode.js", "storage.js", "rpc.js", "messaging.js", "i18n.js"];
	for (const file of list) {
		const code = fs.readFileSync(path.join(resources, "common", file), "utf8");
		vm.runInContext(code, context, { filename: `common/${file}` });
	}
	return context.Aria2Helper;
}

export function resourcesDir() {
	return resources;
}
