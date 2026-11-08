import test from "node:test";
import assert from "node:assert/strict";
import { loadCommon } from "../helpers/load-common.mjs";

const plain = (value) => JSON.parse(JSON.stringify(value));

const A = loadCommon();
const { createClient, classifyEngine, endpointOf, withToken, Aria2Error, ErrorCode } = A.rpc;

function jsonResponse(payload, status = 200) {
	return new Response(JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
}

function profile(overrides = {}) {
	return {
		rpcHost: "127.0.0.1",
		rpcPort: "6800",
		rpcSecret: "s3cret",
		rpcIshttps: false,
		rpcPath: "/jsonrpc",
		...overrides,
	};
}

test("endpointOf builds http/https/IPv6 endpoints", () => {
	assert.equal(endpointOf(profile()), "http://127.0.0.1:6800/jsonrpc");
	assert.equal(endpointOf(profile({ rpcIshttps: true, rpcPath: "rpc" })), "https://127.0.0.1:6800/rpc");
	assert.equal(endpointOf(profile({ rpcHost: "::1" })), "http://[::1]:6800/jsonrpc");
	assert.throws(() => endpointOf(profile({ rpcHost: "" })), /required/);
});

test("withToken never doubles a token", () => {
	assert.deepEqual(plain(withToken("abc", ["x"])), ["token:abc", "x"]);
	assert.deepEqual(plain(withToken("abc", ["token:abc", "x"])), ["token:abc", "x"]);
	assert.deepEqual(plain(withToken("", ["x"])), ["x"]);
});

test("call sends JSON-RPC with token and returns the result", async () => {
	let captured = null;
	const client = createClient(profile(), {
		fetchImpl: async (url, init) => {
			captured = { url, body: JSON.parse(init.body) };
			return jsonResponse({ jsonrpc: "2.0", id: captured.body.id, result: "gid-1" });
		},
	});
	const gid = await client.call("aria2.addUri", [["https://example.com/a.zip"], {}]);
	assert.equal(gid, "gid-1");
	assert.equal(captured.url, "http://127.0.0.1:6800/jsonrpc");
	assert.equal(captured.body.method, "aria2.addUri");
	assert.equal(captured.body.params[0], "token:s3cret");
});

test("RPC errors keep the aria2 code", async () => {
	const client = createClient(profile(), {
		fetchImpl: async () => jsonResponse({ jsonrpc: "2.0", id: 1, error: { code: 1, message: "Unauthorized" } }),
	});
	await assert.rejects(client.call("aria2.getVersion"), (error) => {
		assert.ok(error instanceof Aria2Error);
		assert.equal(error.code, ErrorCode.RPC);
		assert.equal(error.rpcCode, 1);
		return true;
	});
});

test("network failures are mapped, not leaked as TypeError", async () => {
	const client = createClient(profile(), {
		fetchImpl: async () => {
			throw new TypeError("Load failed");
		},
	});
	await assert.rejects(client.call("aria2.getVersion"), (error) => error.code === ErrorCode.NETWORK);
});

test("timeouts abort the request", async () => {
	let aborted = false;
	const client = createClient(profile(), {
		timeoutMs: 20,
		fetchImpl: (url, init) =>
			new Promise((resolve, reject) => {
				init.signal.addEventListener("abort", () => {
					aborted = true;
					const error = new Error("aborted");
					error.name = "AbortError";
					reject(error);
				});
			}),
	});
	await assert.rejects(client.call("aria2.getVersion"), (error) => error.code === ErrorCode.TIMEOUT);
	assert.equal(aborted, true);
});

test("timeouts stay active while reading a stalled body", async () => {
	let aborted = false;
	const client = createClient(profile(), {
		timeoutMs: 25,
		fetchImpl: (url, init) =>
			Promise.resolve(
				new Response(
					new ReadableStream({
						start(controller) {
							init.signal.addEventListener("abort", () => {
								aborted = true;
								const error = new Error("aborted");
								error.name = "AbortError";
								controller.error(error);
							});
						},
					})
				)
			),
	});
	await assert.rejects(client.call("aria2.getVersion"), (error) => error.code === ErrorCode.TIMEOUT);
	assert.equal(aborted, true);
});

test("multicall passes the token inside each entry only", async () => {
	let outer = null;
	const client = createClient(profile(), {
		fetchImpl: async (url, init) => {
			outer = JSON.parse(init.body);
			return jsonResponse({
				jsonrpc: "2.0",
				id: outer.id,
				result: [[["active"]], { code: 2, message: "bad" }],
			});
		},
	});
	const results = await client.multicall([
		{ method: "aria2.tellActive", params: [] },
		{ method: "aria2.tellStopped", params: [0, 10] },
	]);
	assert.equal(outer.method, "system.multicall");
	assert.equal(outer.params.length, 1);
	assert.deepEqual(plain(outer.params[0][0].params), ["token:s3cret"]);
	assert.equal(results[0].ok, true);
	assert.deepEqual(plain(results[0].result), ["active"]);
	assert.equal(results[1].ok, false);
	assert.equal(results[1].error.rpcCode, 2);
});

test("multicall falls back to sequential calls when unsupported", async () => {
	const methods = [];
	const client = createClient(profile(), {
		fetchImpl: async (url, init) => {
			const body = JSON.parse(init.body);
			methods.push(body.method);
			if (body.method === "system.multicall") {
				return jsonResponse({ jsonrpc: "2.0", id: body.id, error: { code: -32601, message: "Method not found" } });
			}
			return jsonResponse({ jsonrpc: "2.0", id: body.id, result: body.method });
		},
	});
	const results = await client.multicall([
		{ method: "aria2.tellActive", params: [] },
		{ method: "aria2.getGlobalStat", params: [] },
	]);
	assert.deepEqual(plain(results.map((entry) => entry.result)), ["aria2.tellActive", "aria2.getGlobalStat"]);
	assert.deepEqual(plain(methods), ["system.multicall", "aria2.tellActive", "aria2.getGlobalStat"]);
});

test("local discovery accepts host/port shorthand and reports missing secrets", async () => {
	const { discoverLocalEngines } = A.rpc;
	const urls = [];
	const found = await discoverLocalEngines([{ id: "rayburst", label: "Rayburst", host: "127.0.0.1", port: "29100" }], {
		fetchImpl: async (url) => {
			urls.push(url);
			return jsonResponse({ jsonrpc: "2.0", id: 1, error: { code: 1, message: "Unauthorized" } });
		},
	});
	assert.deepEqual(plain(urls), ["http://127.0.0.1:29100/jsonrpc"]);
	assert.equal(found[0].rpcHost, "127.0.0.1");
	assert.equal(found[0].rpcPort, "29100");
	assert.equal(found[0].reachable, true);
	assert.equal(found[0].requiresSecret, true);
});

test("classifyEngine understands aria2-next capabilities", () => {
	const next = classifyEngine({
		product: "aria2-next",
		version: "3.0.9",
		enabledFeatures: ["BitTorrent", "ED2K", "HLS/DASH"],
		downloadFeatures: ["filename-hints", "filename-resolution"],
		mediaFeatures: ["structured-errors"],
	});
	assert.equal(next.isAria2Next, true);
	assert.equal(next.supportsProbe, true);
	assert.equal(next.supportsTorrentInspect, true);
	assert.equal(next.supportsMedia, true);
	const classic = classifyEngine({ product: "aria2", version: "1.37.0", enabledFeatures: ["BitTorrent"] });
	assert.equal(classic.isAria2Next, false);
	assert.equal(classic.supportsProbe, false);
	assert.equal(classic.supportsMedia, false);
});
