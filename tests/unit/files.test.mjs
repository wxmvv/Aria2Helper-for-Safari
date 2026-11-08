import test from "node:test";
import assert from "node:assert/strict";
import { loadCommon } from "../helpers/load-common.mjs";

const plain = (value) => JSON.parse(JSON.stringify(value));

const A = loadCommon();
const { extensionOf, basename, getFileParts, normalizeExtensionList, parseUriList, resolveUrl, isMagnet } = A.files;

test("extensionOf ignores query, hash and percent-encoding", () => {
	assert.equal(extensionOf("https://example.com/a/B.MKV?token=x#t=1"), ".mkv");
	assert.equal(extensionOf("https://example.com/file%20name.tar.gz"), ".gz");
	assert.equal(extensionOf("https://example.com/dir/"), "");
	assert.equal(extensionOf("https://example.com/.gitignore"), "");
	assert.equal(extensionOf("not a url"), "");
});

test("basename decodes and keeps the last segment", () => {
	assert.equal(basename("https://example.com/a/%E6%B5%8B%E8%AF%95.mp4?x=1"), "测试.mp4");
	assert.equal(basename("C:\\\\Users\\\\me\\\\file.zip"), "file.zip");
});

test("getFileParts splits at the last dot", () => {
	assert.deepEqual(plain(getFileParts("https://example.com/archive.tar.gz")), {
		filename: "archive.tar.gz",
		extension: ".gz",
		nameWithoutExtension: "archive.tar",
	});
	assert.deepEqual(plain(getFileParts("https://example.com/README")), {
		filename: "README",
		extension: "",
		nameWithoutExtension: "README",
	});
});

test("normalizeExtensionList accepts free-form input", () => {
	assert.deepEqual(plain(normalizeExtensionList("mp4, .MKV\n.avi  mp4")), [".mp4", ".mkv", ".avi"]);
	assert.deepEqual(plain(normalizeExtensionList(["*.mp4", ".", ""])), [".mp4"]);
});

test("parseUriList trims comments and blanks", () => {
	const parsed = plain(parseUriList(" https://a/1.zip\r\n\r\n# note\nmagnet:?xt=urn:btih:abc "));
	assert.deepEqual(parsed, ["https://a/1.zip", "magnet:?xt=urn:btih:abc"]);
});

test("resolveUrl and isMagnet", () => {
	assert.equal(resolveUrl("/a/b", "https://example.com/dir/page"), "https://example.com/a/b");
	assert.equal(resolveUrl("http://[", "https://example.com"), "");
	assert.equal(isMagnet("magnet:?xt=urn:btih:abc"), true);
	assert.equal(isMagnet("https://example.com"), false);
});
