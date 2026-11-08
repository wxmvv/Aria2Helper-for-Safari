import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadCommon } from "../helpers/load-common.mjs";

const endpoint = process.env.ARIA2_RPC || "";
const secret = process.env.ARIA2_SECRET || "";
const skip = endpoint ? false : "Set ARIA2_RPC (and ARIA2_SECRET) to run against a live engine";

const A = loadCommon();
const plain = (value) => JSON.parse(JSON.stringify(value));
const { createClient } = A.rpc;

function profileFromEndpoint() {
	const url = new URL(endpoint);
	return {
		rpcHost: url.hostname,
		rpcPort: url.port || (url.protocol === "https:" ? "443" : "80"),
		rpcIshttps: url.protocol === "https:",
		rpcPath: url.pathname || "/jsonrpc",
		rpcSecret: secret,
	};
}

async function waitForStatus(client, gid, wanted, timeoutMs = 20000) {
	const started = Date.now();
	let last = null;
	while (Date.now() - started < timeoutMs) {
		last = await client.call("aria2.tellStatus", [gid, ["status", "completedLength", "totalLength", "errorMessage"]]);
		if (wanted.includes(last.status)) return last;
		await new Promise((resolve) => setTimeout(resolve, 250));
	}
	throw new Error(`Timed out waiting for ${gid}: ${JSON.stringify(last)}`);
}

test("live engine advertises its product and capabilities", { skip }, async () => {
	const client = createClient(profileFromEndpoint(), { timeoutMs: 5000 });
	const version = await client.getVersion();
	assert.ok(version.version, "engine reports a version");
	assert.ok(version.product, "engine reports a product");
	assert.ok(Array.isArray(version.enabledFeatures));
	console.log(`[engine] ${version.product} ${version.version} (rpc ${version.rpcVersion})`);
});

test("downloads a file end to end and reports progress", { skip }, async () => {
	const payload = Buffer.alloc(64 * 1024, 0x41);
	const server = http.createServer((request, response) => {
		response.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": String(payload.length) });
		response.end(payload);
	});
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const port = server.address().port;
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aria2helper-"));
	const client = createClient(profileFromEndpoint(), { timeoutMs: 5000 });
	let gid = null;
	try {
		gid = await client.call("aria2.addUri", [[`http://127.0.0.1:${port}/sample.bin`], { dir, out: "sample.bin" }]);
		assert.match(gid, /^[0-9a-f]{16}$/i);
		const status = await waitForStatus(client, gid, ["complete", "error", "removed"]);
		assert.equal(status.status, "complete", status.errorMessage);
		assert.equal(Number(status.completedLength), payload.length);
		assert.equal(fs.statSync(path.join(dir, "sample.bin")).size, payload.length);
	} finally {
		if (gid) await client.call("aria2.removeDownloadResult", [gid]).catch(() => {});
		await client.call("aria2.purgeDownloadResult").catch(() => {});
		server.close();
		fs.rmSync(dir, { recursive: true, force: true });
	}
});

test("download list and global stat support the popup refresh path", { skip }, async () => {
	const client = createClient(profileFromEndpoint(), { timeoutMs: 5000 });
	const results = await client.multicall([
		{ method: "aria2.tellActive", params: [] },
		{ method: "aria2.tellWaiting", params: [0, 100] },
		{ method: "aria2.tellStopped", params: [0, 100] },
		{ method: "aria2.getGlobalStat", params: [] },
	]);
	assert.deepEqual(plain(results.map((entry) => entry.ok)), [true, true, true, true]);
	assert.ok(Array.isArray(results[0].result));
	assert.ok(results[3].result.downloadSpeed != null);
});

test("aria2-next extensions are usable when advertised", { skip }, async () => {
	const client = createClient(profileFromEndpoint(), { timeoutMs: 5000 });
	const version = await client.getVersion();
	if (!version.isAria2Next) {
		console.log("[engine] classic aria2, skipping aria2-next extension checks");
		return;
	}
	const methods = await client.call("system.listMethods");
	assert.ok(methods.includes("aria2.probe"));
	assert.ok(methods.includes("aria2.inspectTorrent"));

	const server = http.createServer((request, response) => {
		response.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": "8" });
		response.end("12345678");
	});
	await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
	const port = server.address().port;
	try {
		const probe = await client.call("aria2.probe", [`http://127.0.0.1:${port}/clip.mp4`, {}]);
		assert.equal(String(probe.status), "200");
		assert.equal(probe.filename || new URL(probe.finalUrl).pathname.split("/").pop(), "clip.mp4");
		assert.ok(probe.resumable === false || probe.resumable === "false");
	} finally {
		server.close();
	}
});
