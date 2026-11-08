import test from "node:test";
import assert from "node:assert/strict";
import { loadCommon } from "../helpers/load-common.mjs";

const plain = (value) => JSON.parse(JSON.stringify(value));

const A = loadCommon();
const { parseTorrent, decode } = A.bencode;

function encode(value) {
	if (typeof value === "number") return `i${value}e`;
	if (typeof value === "string") return `${Buffer.byteLength(value, "utf8")}:${value}`;
	if (Array.isArray(value)) return `l${value.map(encode).join("")}e`;
	const entries = Object.keys(value)
		.sort()
		.map((key) => `${encode(key)}${encode(value[key])}`);
	return `d${entries.join("")}e`;
}

function torrent(info) {
	return new TextEncoder().encode(encode({ announce: "udp://tracker", info }));
}

test("decodes nested bencode", () => {
	const value = decode(encode({ name: "test", files: ["abc"] }));
	assert.equal(value.name, "test");
	assert.deepEqual(plain(value.files), ["abc"]);
});

test("parses a multi-file torrent with 1-based indexes", () => {
	const bytes = torrent({
		name: "Show",
		"piece length": 16384,
		pieces: "x".repeat(20),
		files: [
			{ length: 100, path: ["e01.mkv"] },
			{ length: 5, path: ["e01.nfo"] },
			{ length: 50, path: ["sub", "e02.MP4"] },
		],
	});
	const parsed = parseTorrent(bytes);
	assert.equal(parsed.name, "Show");
	assert.equal(parsed.totalLength, 155);
	assert.deepEqual(
		plain(parsed.files.map((file) => [file.index, file.path, file.extension])),
		[
			[1, "e01.mkv", ".mkv"],
			[2, "e01.nfo", ".nfo"],
			[3, "sub/e02.MP4", ".mp4"],
		]
	);
});

test("parses a single-file torrent", () => {
	const parsed = parseTorrent(torrent({ name: "single.zip", length: 1024 }));
	assert.equal(parsed.files.length, 1);
	assert.equal(parsed.files[0].index, 1);
	assert.equal(parsed.files[0].extension, ".zip");
	assert.equal(parsed.totalLength, 1024);
});

test("rejects junk without throwing a parse-free crash", () => {
	assert.throws(() => parseTorrent(new TextEncoder().encode("d3:fooi1ee")), /missing info/);
	assert.throws(() => decode("i12"), /Unterminated/);
	assert.throws(() => decode("3:ab"), /past end/);
});
