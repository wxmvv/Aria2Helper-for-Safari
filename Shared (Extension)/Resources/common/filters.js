/**
 * Link-interception and file-selection policy. Pure functions only.
 */
(function (global) {
	"use strict";

	const Aria2Helper = (global.Aria2Helper = global.Aria2Helper || {});
	const { CATALOG } = Aria2Helper.constants;
	const { extensionOf, matchesExtensionList, normalizeExtensionList } = Aria2Helper.files;

	const SKIP = "skip";

	function catalogEntryFor(value) {
		const extension = extensionOf(value);
		if (!extension) return null;
		for (const [category, entry] of Object.entries(CATALOG)) {
			if (entry.extensions.includes(extension)) {
				return { category, name: entry.name, extension };
			}
		}
		return null;
	}

	/**
	 * Decide whether a link should be handed to aria2.
	 * Order: skip list > whitelist > blacklist > built-in catalogue.
	 * @returns {{intercept: boolean, reason: string, extension: string, category: string}}
	 */
	function decideInterception(url, settings) {
		const extension = extensionOf(url);
		const skipExtensions = normalizeExtensionList((settings && settings.skipExtensions) || []);
		if (extension && skipExtensions.includes(extension)) {
			return { intercept: false, reason: SKIP, extension, category: "skip" };
		}
		const filterLists = (settings && settings.filterLists) || {};
		const whitelist = normalizeExtensionList((filterLists.whitelist && filterLists.whitelist.extensions) || []);
		const blacklist = normalizeExtensionList((filterLists.blacklist && filterLists.blacklist.extensions) || []);
		if (extension && whitelist.includes(extension)) {
			return { intercept: true, reason: "whitelist", extension, category: "whitelist" };
		}
		if (extension && blacklist.includes(extension)) {
			return { intercept: false, reason: "blacklist", extension, category: "blacklist" };
		}
		const entry = catalogEntryFor(url);
		if (entry) return { intercept: true, reason: "catalog", extension, category: entry.category };
		return { intercept: false, reason: "none", extension, category: "" };
	}

	function shouldSkipUrl(url, settings) {
		const skipExtensions = normalizeExtensionList((settings && settings.skipExtensions) || []);
		if (matchesExtensionList(url, skipExtensions)) return true;
		const blacklist = (settings && settings.filterLists && settings.filterLists.blacklist && settings.filterLists.blacklist.extensions) || [];
		return matchesExtensionList(url, blacklist);
	}

	/** Group ascending 1-based indexes into aria2's "1-3,5,8-9" syntax. */
	function compactIndexList(indexes) {
		const sorted = Array.from(new Set(indexes.filter((index) => Number.isInteger(index) && index > 0))).sort((a, b) => a - b);
		const parts = [];
		let start = null;
		let previous = null;
		for (const index of sorted) {
			if (start === null) {
				start = index;
				previous = index;
				continue;
			}
			if (index === previous + 1) {
				previous = index;
				continue;
			}
			parts.push(start === previous ? String(start) : `${start}-${previous}`);
			start = index;
			previous = index;
		}
		if (start !== null) parts.push(start === previous ? String(start) : `${start}-${previous}`);
		return parts.join(",");
	}

	/**
	 * Pick the torrent files aria2 should download.
	 * @param {Array<{index:number,path:string,length:number,extension?:string}>} files
	 * @param {string[]} skipExtensions
	 * @returns {{spec: string, selected: number[], skipped: object[]}}
	 */
	function selectTorrentFiles(files, skipExtensions) {
		const skip = normalizeExtensionList(skipExtensions);
		const selected = [];
		const skipped = [];
		for (const file of files || []) {
			if (matchesExtensionList(file.path, skip)) skipped.push(file);
			else selected.push(file.index);
		}
		return { spec: compactIndexList(selected), selected, skipped };
	}

	Aria2Helper.filters = Object.freeze({
		catalogEntryFor,
		decideInterception,
		shouldSkipUrl,
		compactIndexList,
		selectTorrentFiles,
	});
})(typeof globalThis !== "undefined" ? globalThis : this);
