import test from "node:test";
import assert from "node:assert/strict";
import { loadCommon } from "../helpers/load-common.mjs";

const A = loadCommon();
const { formatBytes, formatSpeed, formatDuration, progressPercent, remainingSeconds, effectiveTotalLength } = A.util;

test("formatBytes handles zero, bytes and binary units", () => {
	assert.equal(formatBytes(0), "0 B");
	assert.equal(formatBytes("0"), "0 B");
	assert.equal(formatBytes(1023), "1023 B");
	assert.equal(formatBytes(1536), "1.5 KB");
	assert.equal(formatBytes(1024 * 1024 * 3), "3.0 MB");
	assert.equal(formatBytes(undefined), "0 B");
});

test("formatSpeed and formatDuration", () => {
	assert.equal(formatSpeed(0), "0 B/s");
	assert.equal(formatSpeed(2048), "2.0 KB/s");
	assert.equal(formatDuration(0), "0s");
	assert.equal(formatDuration(65), "1m 05s");
	assert.equal(formatDuration(3660), "1h 1m");
	assert.equal(formatDuration(90000), "1d 1h");
});

test("progress falls back to aria2-next media and ed2k fields", () => {
	assert.equal(progressPercent({ totalLength: "200", completedLength: "50" }), 25);
	assert.equal(progressPercent({ totalLength: "0", completedLength: "0", media: { progress: "0.5" } }), 50);
	assert.equal(progressPercent({ totalLength: "0", completedLength: "0", ed2k: { length: "100", completedLength: "25" } }), 25);
	assert.equal(progressPercent({ totalLength: "0", completedLength: "0" }), null);
	assert.equal(effectiveTotalLength({ totalLength: "0", ed2k: { length: "42" } }), 42);
});

test("remainingSeconds avoids division by zero", () => {
	assert.equal(remainingSeconds("0", "0", "0"), null);
	assert.equal(remainingSeconds("100", "1000", "100"), 9);
});
