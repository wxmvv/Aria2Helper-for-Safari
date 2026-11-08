/**
 * File-name and extension helpers. Kept free of DOM and browser APIs.
 */
(function (global) {
	"use strict";

	const Aria2Helper = (global.Aria2Helper = global.Aria2Helper || {});
	const { safeDecodeURIComponent } = Aria2Helper.util;

	/** Return the last path segment of a URL or file path, decoded, without query/hash. */
	function basename(value) {
		if (typeof value !== "string") return "";
		let text = value.trim();
		if (!text) return "";
		const cut = Math.min(...[text.indexOf("?"), text.indexOf("#")].filter((index) => index >= 0));
		if (Number.isFinite(cut) && cut >= 0) text = text.slice(0, cut);
		const segment = text.split(/[\\/]/).filter(Boolean).pop() || "";
		return safeDecodeURIComponent(segment);
	}

	/** Extension including the leading dot, lowercase; "" when the name has none. */
	function extensionOf(value) {
		const name = basename(value);
		if (!name) return "";
		const dot = name.lastIndexOf(".");
		if (dot <= 0 || dot === name.length - 1) return "";
		return name.slice(dot).toLowerCase();
	}

	function getFileParts(value) {
		const name = basename(value);
		const extension = extensionOf(name);
		if (!extension) return { filename: name, extension: "", nameWithoutExtension: name };
		return {
			filename: name,
			extension,
			nameWithoutExtension: name.slice(0, name.length - extension.length),
		};
	}

	/** Accept "MP4, .mkv\n.avi" or an array and return a deduped lowercase list with dots. */
	function normalizeExtensionList(input) {
		const items = Array.isArray(input) ? input : String(input == null ? "" : input).split(/[\s,;]+/);
		const seen = new Set();
		const result = [];
		for (const item of items) {
			let extension = String(item == null ? "" : item).trim().toLowerCase().replace(/^\*/, "");
			if (!extension) continue;
			if (!extension.startsWith(".")) extension = `.${extension}`;
			if (extension.length < 2 || extension === ".") continue;
			if (seen.has(extension)) continue;
			seen.add(extension);
			result.push(extension);
		}
		return result;
	}

	function matchesExtensionList(value, extensions) {
		const extension = extensionOf(value);
		if (!extension) return false;
		return (extensions || []).some((candidate) => extension === String(candidate).toLowerCase());
	}

	/** Resolve a possibly relative href against a page URL, without throwing on junk. */
	function resolveUrl(href, baseUrl) {
		try {
			return new URL(href, baseUrl).href;
		} catch {
			return "";
		}
	}

	function isHttpUrl(value) {
		try {
			const url = new URL(value);
			return url.protocol === "http:" || url.protocol === "https:";
		} catch {
			return false;
		}
	}

	function isMagnet(value) {
		return typeof value === "string" && /^magnet:\?/i.test(value.trim());
	}

	function isEd2k(value) {
		return typeof value === "string" && /^ed2k:\/\//i.test(value.trim());
	}

	function isThunder(value) {
		return typeof value === "string" && /^thunder:\/\//i.test(value.trim());
	}

	/** Split pasted text into usable URIs, ignoring blank lines and comments. */
	function parseUriList(text) {
		return String(text == null ? "" : text)
			.split(/[\r\n]+/)
			.map((line) => line.trim())
			.filter((line) => line && !line.startsWith("#"));
	}

	Aria2Helper.files = Object.freeze({
		basename,
		extensionOf,
		getFileParts,
		normalizeExtensionList,
		matchesExtensionList,
		resolveUrl,
		isHttpUrl,
		isMagnet,
		isEd2k,
		isThunder,
		parseUriList,
	});
})(typeof globalThis !== "undefined" ? globalThis : this);
