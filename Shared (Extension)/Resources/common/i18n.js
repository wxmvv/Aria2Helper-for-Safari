/**
 * Thin i18n wrapper with a readable fallback when a key is missing.
 */
(function (global) {
	"use strict";

	const Aria2Helper = (global.Aria2Helper = global.Aria2Helper || {});

	function t(key, fallback) {
		try {
			if (global.browser && global.browser.i18n && global.browser.i18n.getMessage) {
				const value = global.browser.i18n.getMessage(key);
				if (value) return value;
			}
		} catch {
			/* i18n is unavailable in unit tests */
		}
		return fallback == null ? key : fallback;
	}

	Aria2Helper.i18n = Object.freeze({ t });
})(typeof globalThis !== "undefined" ? globalThis : this);
