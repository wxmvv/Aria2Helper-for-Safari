/**
 * Promise wrapper around browser.runtime messaging.
 * Safari returns a promise only on newer versions, so both shapes are consumed.
 */
(function (global) {
	"use strict";

	const Aria2Helper = (global.Aria2Helper = global.Aria2Helper || {});

	function runtime() {
		return global.browser && global.browser.runtime ? global.browser.runtime : global.chrome && global.chrome.runtime ? global.chrome.runtime : null;
	}

	function normalizeResponse(response) {
		if (!response || typeof response !== "object") {
			return { ok: false, error: { code: "EEMPTY", message: "No response from the extension background" } };
		}
		if (typeof response.ok === "boolean") return response;
		// Legacy envelope (1.x): { error: "..." } / { error: { code, message } } / raw result.
		if (response.error) {
			const error = typeof response.error === "string" ? { code: "ELEGACY", message: response.error } : response.error;
			return { ok: false, error };
		}
		return { ok: true, data: response };
	}

	/**
	 * @param {{api: string}} message
	 * @param {{timeoutMs?: number}} [options]
	 * @returns {Promise<{ok: true, data: any} | {ok: false, error: {code: string, message: string}}>}
	 */
	function send(message, options) {
		const opts = options || {};
		const timeoutMs = opts.timeoutMs || 20000;
		const api = runtime();
		if (!api) return Promise.resolve({ ok: false, error: { code: "ENORUNTIME", message: "Extension runtime unavailable" } });
		return new Promise((resolve) => {
			let settled = false;
			const finish = (value) => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				resolve(value);
			};
			const timer = setTimeout(() => {
				finish({ ok: false, error: { code: "ETIMEOUT", message: "The background did not answer in time" } });
			}, timeoutMs);
			const callback = (response) => {
				if (api.lastError) {
					finish({ ok: false, error: { code: "ELAST", message: api.lastError.message || "Extension messaging failed" } });
					return;
				}
				finish(normalizeResponse(response));
			};
			let returned;
			try {
				returned = api.sendMessage(message, callback);
			} catch (error) {
				finish({ ok: false, error: { code: "ESEND", message: error && error.message ? error.message : String(error) } });
				return;
			}
			if (returned && typeof returned.then === "function") {
				returned.then(callback, (error) =>
					finish({ ok: false, error: { code: "ESEND", message: error && error.message ? error.message : String(error) } })
				);
			}
		});
	}

	function sendNative(message, options) {
		const opts = options || {};
		const timeoutMs = opts.timeoutMs || 10000;
		const api = runtime();
		if (!api) return Promise.resolve({ ok: false, error: { code: "ENORUNTIME", message: "Extension runtime unavailable" } });
		return new Promise((resolve) => {
			let settled = false;
			const finish = (value) => {
				if (settled) return;
				settled = true;
				clearTimeout(timer);
				resolve(value);
			};
			const timer = setTimeout(() => finish({ ok: false, error: { code: "ETIMEOUT", message: "Native host did not answer in time" } }), timeoutMs);
			try {
				api.sendNativeMessage(message, (response) => {
					if (api.lastError) {
						finish({ ok: false, error: { code: "ENATIVE", message: api.lastError.message || "Native messaging failed" } });
						return;
					}
					finish({ ok: true, data: response });
				});
			} catch (error) {
				finish({ ok: false, error: { code: "ENATIVE", message: error && error.message ? error.message : String(error) } });
			}
		});
	}

	Aria2Helper.messaging = Object.freeze({ send, sendNative, normalizeResponse });
})(typeof globalThis !== "undefined" ? globalThis : this);
