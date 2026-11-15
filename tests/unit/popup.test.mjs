import test from "node:test";
import assert from "node:assert/strict";
import { popupPage, settle } from "../helpers/popup-page.mjs";

const task = (patch = {}) => ({ gid: "123", status: "active", totalLength: "100", completedLength: "10", files: [{ path: "/Downloads/initial.bin", uris: [] }], ...patch });

test("open file and double click use the latest task path after polling", async () => {
	const page = await popupPage([task()]);
	await page.refresh([task({ status: "complete", files: [{ path: "/Downloads/final.zip", uris: [] }] })]);
	const row = page.document.querySelector(".item");
	row.querySelector(".btn-open-icon").click();
	for (const callback of row.listeners.dblclick) callback({ preventDefault() {} });
	await settle();
	const calls = page.requests.filter((message) => message.api === "native.selectFile");
	assert.equal(calls.length, 2);
	assert.ok(calls.every((message) => message.url === "/Downloads/final.zip"));
});

test("restart uses the latest URI after a task finishes", async () => {
	const page = await popupPage([task()]);
	await page.refresh([task({ status: "complete", files: [{ path: "/Downloads/final.zip", uris: [{ uri: "https://example.test/final.zip" }] }] })]);
	page.document.querySelector(".btn-restart-icon").click();
	await settle();
	assert.equal(page.requests.find((message) => message.api === "downloads.addUri")?.url, "https://example.test/final.zip");
});

test("a task that becomes a torrent is not restarted as an ordinary URI", async () => {
	const page = await popupPage([task({ files: [{ path: "/Downloads/initial.bin", uris: [{ uri: "https://example.test/initial.bin" }] }] })]);
	await page.refresh([task({ status: "complete", bittorrent: { info: { name: "Torrent" } }, files: [{ path: "/Downloads/final.bin", uris: [] }] })]);
	page.document.querySelector(".btn-delete-icon").click();
	await settle();
	assert.equal(page.requests.filter((message) => message.api === "downloads.removeResult").length, 1);
	assert.equal(page.requests.filter((message) => message.api === "downloads.addUri").length, 0);
});
