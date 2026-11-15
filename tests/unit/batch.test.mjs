import test from "node:test";
import assert from "node:assert/strict";
import { backgroundPage } from "../helpers/background-page.mjs";

const reply = (body, payload) => new Response(JSON.stringify({ jsonrpc: "2.0", id: body.id, ...payload }), { status: 200 });

test("batch results identify same-name files individually, including failures", async () => {
	const page = backgroundPage(async (_url, options) => {
		const body = JSON.parse(options.body);
		return body.params[0] === "bad" ? reply(body, { error: { code: 1, message: "rejected" } }) : reply(body, { result: ["gid"] });
	});
	const response = await page.send({ api: "downloads.addBatch", items: [
		{ id: "file-1", kind: "metalink", name: "download.meta4", file: "good" },
		{ id: "file-2", kind: "metalink", name: "download.meta4", file: "bad" },
	] });
	assert.equal(response.ok, true);
	assert.equal(response.data.added[0].id, "file-1");
	assert.equal(response.data.failed[0].id, "file-2");
});

test("duplicate payloads report skipped IDs without adding the same download twice", async () => {
	let calls = 0;
	const page = backgroundPage(async (_url, options) => { calls++; return reply(JSON.parse(options.body), { result: ["gid"] }); });
	const response = await page.send({ api: "downloads.addBatch", items: [
		{ id: "file-1", kind: "metalink", name: "one.meta4", file: "same" },
		{ id: "file-2", kind: "metalink", name: "two.meta4", file: "same" },
	] });
	assert.equal(response.ok, true);
	assert.equal(calls, 1);
	assert.equal(response.data.skipped[0]?.id, "file-2");
});
