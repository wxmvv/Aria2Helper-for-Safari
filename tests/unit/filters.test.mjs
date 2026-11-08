import test from "node:test";
import assert from "node:assert/strict";
import { loadCommon } from "../helpers/load-common.mjs";

const plain = (value) => JSON.parse(JSON.stringify(value));

const A = loadCommon();
const { decideInterception, selectTorrentFiles, compactIndexList } = A.filters;

const baseSettings = {
	skipExtensions: [],
	filterLists: { whitelist: { extensions: [] }, blacklist: { extensions: [] } },
};

test("catalogue extensions are intercepted by default", () => {
	assert.equal(decideInterception("https://example.com/a.zip", baseSettings).intercept, true);
	assert.equal(decideInterception("https://example.com/a.mp4", baseSettings).intercept, true);
	assert.equal(decideInterception("https://example.com/page", baseSettings).intercept, false);
	assert.equal(decideInterception("https://example.com/a.exe", baseSettings).reason, "catalog");
});

test("skip list wins over the catalogue", () => {
	const settings = { ...baseSettings, skipExtensions: [".jpg"] };
	assert.equal(decideInterception("https://example.com/a.jpg", settings).intercept, false);
	assert.equal(decideInterception("https://example.com/a.jpg", settings).reason, "skip");
	assert.equal(decideInterception("https://example.com/a.JPG?x=1", settings).intercept, false);
});

test("whitelist wins over blacklist, blacklist wins over catalogue", () => {
	const settings = {
		...baseSettings,
		filterLists: { whitelist: { extensions: [".zip"] }, blacklist: { extensions: [".zip", ".mp4"] } },
	};
	assert.equal(decideInterception("https://example.com/a.zip", settings).intercept, true);
	assert.equal(decideInterception("https://example.com/a.mp4", settings).intercept, false);
});

test("torrent file selection builds aria2 select-file syntax", () => {
	assert.equal(compactIndexList([1, 2, 3, 5, 7, 8]), "1-3,5,7-8");
	assert.equal(compactIndexList([2]), "2");
	assert.equal(compactIndexList([]), "");
	const files = [
		{ index: 1, path: "Show/e01.mkv" },
		{ index: 2, path: "Show/e01.nfo" },
		{ index: 3, path: "Show/e02.mkv" },
		{ index: 4, path: "Show/sample.mp4" },
	];
	const result = selectTorrentFiles(files, [".nfo", ".mp4"]);
	assert.deepEqual(plain(result.selected), [1, 3]);
	assert.equal(result.spec, "1,3");
	assert.equal(result.skipped.length, 2);
});
