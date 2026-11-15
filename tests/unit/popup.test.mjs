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

async function chooseFiles(page, files) {
	page.document.getElementById("addtask").click();
	const input = page.document.getElementById("inputFile");
	input.files = files;
	for (const callback of input.listeners.change) callback();
	await settle();
}

const file = (name, base64) => ({ name, base64, size: 10 });

test("partial batch failure keeps only the failed same-name file for retry", async () => {
	const page = await popupPage();
	page.replies.set("downloads.addBatch", (message) => ({ ok: true, data: {
		added: message.items.filter((item) => item.file === "good").map((item) => ({ id: item.id, name: item.name })),
		failed: message.items.filter((item) => item.file === "bad").map((item) => ({ id: item.id, name: item.name, error: "rejected" })), skipped: [],
	} }));
	await chooseFiles(page, [file("download.meta4", "good"), file("download.meta4", "bad")]);
	const confirm = page.document.querySelector(".dialogue-actions").children[0];
	confirm.click();
	await settle();
	confirm.click();
	await settle();
	const batches = page.requests.filter((message) => message.api === "downloads.addBatch");
	assert.equal(batches.length, 2);
	assert.equal(batches[0].items.length, 2);
	assert.equal(batches[1].items.length, 1);
	assert.equal(batches[1].items[0].file, "bad");
	assert.equal(batches[1].items[0].id, batches[0].items[1].id);
});

test("skipped duplicate files are not sent again when another task fails", async () => {
	const page = await popupPage();
	page.replies.set("downloads.addBatch", (message) => ({ ok: true, data: {
		added: [{ id: message.items[0].id, name: message.items[0].name }],
		skipped: [{ id: message.items[1].id, name: message.items[1].name }],
		failed: [{ id: message.items[2].id, name: message.items[2].name, error: "rejected" }],
	} }));
	await chooseFiles(page, [file("one.meta4", "same"), file("two.meta4", "same"), file("bad.meta4", "bad")]);
	const confirm = page.document.querySelector(".dialogue-actions").children[0];
	confirm.click();
	await settle();
	page.replies.set("downloads.addBatch", () => ({ ok: true, data: { added: [], skipped: [], failed: [] } }));
	confirm.click();
	await settle();
	const batches = page.requests.filter((message) => message.api === "downloads.addBatch");
	assert.deepEqual(Array.from(batches[1].items, (item) => item.file), ["bad"]);
});

test("partial URI batch retries only links that failed", async () => {
	const page = await popupPage();
	page.document.getElementById("addtask").click();
	page.document.getElementById("addtask-textarea").value = "https://example.test/good.zip\nhttps://example.test/bad.zip";
	page.replies.set("downloads.addBatch", (message) => ({ ok: true, data: {
		added: message.items.filter((item) => item.url.includes("good")).map((item) => ({ id: item.id, name: item.url })),
		failed: message.items.filter((item) => item.url.includes("bad")).map((item) => ({ id: item.id, name: item.url, error: "rejected" })), skipped: [],
	} }));
	const confirm = page.document.querySelector(".dialogue-actions").children[0];
	confirm.click();
	await settle();
	assert.equal(page.document.getElementById("addtask-textarea").value, "https://example.test/bad.zip");
	confirm.click();
	await settle();
	const batches = page.requests.filter((message) => message.api === "downloads.addBatch");
	assert.deepEqual(Array.from(batches[1].items, (item) => item.url), ["https://example.test/bad.zip"]);
});
