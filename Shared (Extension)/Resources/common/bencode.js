/**
 * Minimal bencode decoder and .torrent inspector.
 * Used to list torrent files before adding a task, so unwanted file types can be
 * excluded via aria2's `select-file` option (works on aria2 1.x and aria2-next).
 */
(function (global) {
	"use strict";

	const Aria2Helper = (global.Aria2Helper = global.Aria2Helper || {});
	const { extensionOf } = Aria2Helper.files;

	const MAX_DEPTH = 64;
	const MAX_FILES = 20000;

	function BencodeError(message) {
		const error = new Error(message);
		error.name = "BencodeError";
		return error;
	}

	function toBytes(input) {
		if (input instanceof Uint8Array) return input;
		if (input instanceof ArrayBuffer) return new Uint8Array(input);
		if (ArrayBuffer.isView(input)) return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
		if (typeof input === "string") return new TextEncoder().encode(input);
		throw BencodeError("Unsupported input for bencode decoding");
	}

	function decodeText(bytes) {
		return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
	}

	/**
	 * Decode exactly one bencoded value.
	 * @param {Uint8Array|ArrayBuffer|string} input
	 */
	function decode(input) {
		const bytes = toBytes(input);
		let position = 0;

		function readInteger() {
			const end = bytes.indexOf(0x65, position); // 'e'
			if (end < 0) throw BencodeError("Unterminated integer");
			const text = decodeText(bytes.subarray(position + 1, end));
			if (!/^-?\d+$/.test(text)) throw BencodeError(`Invalid integer: ${text}`);
			position = end + 1;
			return Number(text);
		}

		function readString() {
			const colon = bytes.indexOf(0x3a, position); // ':'
			if (colon < 0) throw BencodeError("Missing string separator");
			const lengthText = decodeText(bytes.subarray(position, colon));
			if (!/^\d+$/.test(lengthText)) throw BencodeError(`Invalid string length: ${lengthText}`);
			const length = Number(lengthText);
			const start = colon + 1;
			const end = start + length;
			if (end > bytes.length) throw BencodeError("String runs past end of buffer");
			position = end;
			return decodeText(bytes.subarray(start, end));
		}

		function readValue(depth) {
			if (depth > MAX_DEPTH) throw BencodeError("Bencode nesting too deep");
			const marker = bytes[position];
			if (marker === undefined) throw BencodeError("Unexpected end of buffer");
			if (marker === 0x69) return readInteger(); // 'i'
			if (marker === 0x6c) {
				// 'l'
				position += 1;
				const list = [];
				while (bytes[position] !== 0x65) {
					if (position >= bytes.length) throw BencodeError("Unterminated list");
					list.push(readValue(depth + 1));
				}
				position += 1;
				return list;
			}
			if (marker === 0x64) {
				// 'd'
				position += 1;
				const dictionary = Object.create(null);
				while (bytes[position] !== 0x65) {
					if (position >= bytes.length) throw BencodeError("Unterminated dictionary");
					const key = readString();
					dictionary[key] = readValue(depth + 1);
				}
				position += 1;
				return dictionary;
			}
			return readString();
		}

		return readValue(0);
	}

	function pickLocalized(entry, key) {
		if (!entry || typeof entry !== "object") return "";
		const utf8 = entry[`${key}.utf-8`];
		if (typeof utf8 === "string" && utf8) return utf8;
		const raw = entry[key];
		return typeof raw === "string" ? raw : "";
	}

	function joinPath(segments) {
		return (segments || []).filter((segment) => typeof segment === "string" && segment).join("/");
	}

	/**
	 * Parse a .torrent and return its files with 1-based indexes (aria2 select-file).
	 * @param {Uint8Array|ArrayBuffer} input
	 * @returns {{name: string, totalLength: number, files: Array<{index:number,path:string,length:number,extension:string}>}}
	 */
	function parseTorrent(input) {
		const root = decode(input);
		if (!root || typeof root !== "object" || !root.info) throw BencodeError("Not a torrent: missing info dictionary");
		const info = root.info;
		const name = pickLocalized(info, "name") || "torrent";
		const files = [];
		let totalLength = 0;

		if (Array.isArray(info.files)) {
			if (info.files.length > MAX_FILES) throw BencodeError("Torrent has too many files");
			info.files.forEach((entry, index) => {
				const segments = Array.isArray(entry["path.utf-8"]) ? entry["path.utf-8"] : entry.path;
				const path = joinPath(segments) || `file-${index + 1}`;
				const length = Number(entry.length) || 0;
				totalLength += length;
				files.push({ index: index + 1, path, length, extension: extensionOf(path) });
			});
		} else {
			const length = Number(info.length) || 0;
			totalLength = length;
			files.push({ index: 1, path: name, length, extension: extensionOf(name) });
		}

		return { name, totalLength, files };
	}

	Aria2Helper.bencode = Object.freeze({ decode, parseTorrent });
})(typeof globalThis !== "undefined" ? globalThis : this);
