/**
 * aria2 JSON-RPC client shared by the popup, settings and background.
 * Works with aria2 1.3x and aria2-next 3.x (same JSON-RPC surface, richer errors).
 */
(function (global) {
	"use strict";

	const Aria2Helper = (global.Aria2Helper = global.Aria2Helper || {});
	const { RPC_TIMEOUT_MS } = Aria2Helper.constants;
	const { withTimeout } = Aria2Helper.util;

	const ErrorCode = Object.freeze({
		CONFIG: "ECONFIG",
		NETWORK: "ENETWORK",
		TIMEOUT: "ETIMEOUT",
		HTTP: "EHTTP",
		BAD_RESPONSE: "EBADRESPONSE",
		RPC: "ERPC",
	});

	class Aria2Error extends Error {
		constructor(code, message, details) {
			super(message);
			this.name = "Aria2Error";
			this.code = code;
			this.rpcCode = details && details.rpcCode;
			this.data = details && details.data;
			this.httpStatus = details && details.httpStatus;
			this.hint = details && details.hint;
		}
	}

	function endpointOf(profile) {
		if (!profile) throw new Aria2Error(ErrorCode.CONFIG, "No aria2 profile configured");
		const host = String(profile.rpcHost || "").trim();
		const port = String(profile.rpcPort || "").trim();
		if (!host || !port) throw new Aria2Error(ErrorCode.CONFIG, "RPC host and port are required");
		const scheme = profile.rpcIshttps ? "https" : "http";
		const path = String(profile.rpcPath || "/jsonrpc");
		const authority = host.includes(":") && !host.startsWith("[") ? `[${host}]` : host;
		return `${scheme}://${authority}:${port}${path.startsWith("/") ? path : `/${path}`}`;
	}

	function withToken(secret, params) {
		const list = Array.isArray(params) ? params.slice() : [];
		if (!secret) return list;
		const token = `token:${secret}`;
		if (typeof list[0] === "string" && list[0].startsWith("token:")) return list;
		return [token, ...list];
	}

	function parsePayload(payload, httpStatus) {
		if (!payload || typeof payload !== "object") {
			throw new Aria2Error(ErrorCode.BAD_RESPONSE, "Empty or non-JSON RPC response", { httpStatus });
		}
		if (payload.error) {
			const error = payload.error;
			throw new Aria2Error(ErrorCode.RPC, String(error.message || "aria2 RPC error"), {
				rpcCode: error.code,
				data: error.data,
				httpStatus,
			});
		}
		if (!("result" in payload)) {
			throw new Aria2Error(ErrorCode.BAD_RESPONSE, "RPC response has no result", { httpStatus });
		}
		return payload.result;
	}

	function createClient(profile, options) {
		const opts = options || {};
		const fetchImpl = opts.fetchImpl || global.fetch;
		const timeoutMs = opts.timeoutMs || RPC_TIMEOUT_MS;
		let nextId = 1;

		async function callRaw(method, params, callOptions) {
			if (!fetchImpl) throw new Aria2Error(ErrorCode.NETWORK, "fetch is not available");
			const url = endpointOf(profile);
			const id = nextId++;
			const timeout = callOptions && callOptions.timeoutMs ? callOptions.timeoutMs : timeoutMs;
			const skipToken = Boolean(callOptions && callOptions.skipToken);
			const controller = typeof AbortController === "function" ? new AbortController() : null;
			let timer = null;
			if (controller) timer = setTimeout(() => controller.abort(), timeout);
			const request = fetchImpl(url, {
				method: "POST",
				headers: { "Content-Type": "application/json", Accept: "application/json" },
				body: JSON.stringify({
					jsonrpc: "2.0",
					id,
					method,
					params: skipToken ? params || [] : withToken(profile.rpcSecret, params),
				}),
				signal: controller ? controller.signal : undefined,
			});
			let response;
			let status = 0;
			let text = "";
			try {
				response = controller
					? await request
					: await withTimeout(request, timeout + 250, () => new Aria2Error(ErrorCode.TIMEOUT, `aria2 did not answer within ${timeout} ms`));
				status = response.status;
				// Keep the timeout armed while the body is consumed: a stalled body is
				// just as much of a hang as a stalled connection.
				const bodyRequest = response.text();
				text = controller
					? await bodyRequest
					: await withTimeout(bodyRequest, timeout + 250, () => new Aria2Error(ErrorCode.TIMEOUT, `aria2 did not answer within ${timeout} ms`));
			} catch (error) {
				if (error instanceof Aria2Error) throw error;
				if (error && error.name === "AbortError") throw new Aria2Error(ErrorCode.TIMEOUT, `aria2 did not answer within ${timeout} ms`);
				throw new Aria2Error(ErrorCode.NETWORK, "Cannot reach aria2. Check the host, port and CORS setting.", { data: error && error.message });
			} finally {
				if (timer) clearTimeout(timer);
			}

			let payload = null;
			if (text) {
				try {
					payload = JSON.parse(text);
				} catch {
					payload = null;
				}
			}
			if (!response.ok && !payload) {
				throw new Aria2Error(ErrorCode.HTTP, `aria2 answered HTTP ${status}`, { httpStatus: status });
			}
			if (payload && Array.isArray(payload)) {
				// A bare JSON-RPC batch is not part of aria2, but tolerate it.
				const first = payload.find((entry) => entry && entry.id === id) || payload[0];
				return parsePayload(first, status);
			}
			if (payload && payload.id !== undefined && payload.id !== id) {
				// Some proxies renumber ids; accept the response as long as it is well-formed.
			}
			return parsePayload(payload, status);
		}

		async function call(method, params, callOptions) {
			if (typeof method !== "string" || !method) throw new Aria2Error(ErrorCode.CONFIG, "RPC method name is required");
			return callRaw(method, params, callOptions);
		}

		/**
		 * system.multicall with a sequential fallback when the engine refuses it.
		 * @returns {Promise<Array<{ok: boolean, result?: any, error?: Aria2Error}>>}
		 */
		async function multicall(calls) {
			const list = Array.isArray(calls) ? calls : [];
			if (list.length === 0) return [];
			try {
				const payload = list.map((entry) => ({ methodName: entry.method, params: withToken(profile.rpcSecret, entry.params) }));
				const raw = await callRaw("system.multicall", [payload], { skipToken: true });
				if (!Array.isArray(raw)) throw new Aria2Error(ErrorCode.BAD_RESPONSE, "multicall response is not an array");
				return raw.map((entry) => {
					if (entry && typeof entry === "object" && !Array.isArray(entry)) {
						// aria2 answers {"code","message"}; XML-RPC style faults use faultCode/faultString.
						const faultCode = entry.faultCode != null ? entry.faultCode : entry.code;
						const faultMessage = entry.faultString || entry.message;
						if (faultCode != null) {
							return {
								ok: false,
								error: new Aria2Error(ErrorCode.RPC, String(faultMessage || "aria2 RPC error"), { rpcCode: faultCode }),
							};
						}
					}
					if (Array.isArray(entry)) return { ok: true, result: entry[0] };
					return { ok: true, result: entry };
				});
			} catch (error) {
				if (!(error instanceof Aria2Error) || (error.rpcCode !== -32601 && !/not found/i.test(error.message))) throw error;
				const results = [];
				for (const entry of list) {
					try {
						results.push({ ok: true, result: await call(entry.method, entry.params) });
					} catch (callError) {
						results.push({ ok: false, error: callError });
					}
				}
				return results;
			}
		}

		return {
			profile,
			endpoint: () => endpointOf(profile),
			call,
			multicall,
			getVersion: () => call("aria2.getVersion").then(classifyEngine),
		};
	}

	function classifyEngine(version) {
		const info = version && typeof version === "object" ? version : {};
		const product = String(info.product || "aria2");
		const enabledFeatures = Array.isArray(info.enabledFeatures) ? info.enabledFeatures : [];
		const mediaFeatures = Array.isArray(info.mediaFeatures) ? info.mediaFeatures : [];
		const downloadFeatures = Array.isArray(info.downloadFeatures) ? info.downloadFeatures : [];
		const isAria2Next = /aria2-next/i.test(product);
		return {
			product,
			version: String(info.version || ""),
			rpcVersion: String(info.rpcVersion || ""),
			isAria2Next,
			enabledFeatures,
			mediaFeatures,
			downloadFeatures,
			hasFeature: (name) => enabledFeatures.some((feature) => feature.toLowerCase() === String(name).toLowerCase()),
			// aria2-next 3.x adds these; classic aria2 does not implement `probe`/`inspectTorrent`.
			supportsProbe: isAria2Next && downloadFeatures.includes("filename-hints"),
			supportsTorrentInspect: isAria2Next,
			supportsMedia: enabledFeatures.some((feature) => /HLS|DASH/i.test(feature)),
		};
	}

	async function testConnection(profile, options) {
		const client = createClient(profile, options);
		const version = await client.getVersion();
		return { ok: true, version, endpoint: client.endpoint() };
	}

	function normalizeCandidate(candidate) {
		const isHttps = Boolean(candidate.rpcIshttps);
		return {
			...candidate,
			rpcHost: candidate.rpcHost || candidate.host || "127.0.0.1",
			rpcPort: String(candidate.rpcPort || candidate.port || ""),
			rpcIshttps: isHttps,
			rpcPath: candidate.rpcPath || "/jsonrpc",
			rpcSecret: candidate.rpcSecret || "",
			alias: candidate.alias || candidate.label || "aria2",
		};
	}

	/**
	 * Probe well-known local RPC endpoints. A reachable engine that rejects the
	 * (missing) token is reported with `requiresSecret: true` instead of failing.
	 */
	async function discoverLocalEngines(candidates, options) {
		const opts = options || {};
		const fetchImpl = opts.fetchImpl || global.fetch;
		const timeoutMs = opts.timeoutMs || 2500;
		const list = Array.isArray(candidates) ? candidates : [];
		const probe = list.map(async (raw) => {
			const profile = normalizeCandidate(raw);
			try {
				const client = createClient(profile, { fetchImpl, timeoutMs });
				const version = await client.getVersion();
				return { ...profile, reachable: true, requiresSecret: false, version };
			} catch (error) {
				const unauthorized = error instanceof Aria2Error && error.rpcCode === 1;
				if (unauthorized) {
					return {
						...profile,
						reachable: true,
						requiresSecret: true,
						version: null,
						error: error.message,
					};
				}
				return { ...profile, reachable: false, requiresSecret: false, version: null, error: error.message };
			}
		});
		const results = await Promise.all(probe);
		return results.sort((a, b) => Number(b.reachable) - Number(a.reachable));
	}

	Aria2Helper.rpc = Object.freeze({
		ErrorCode,
		Aria2Error,
		endpointOf,
		withToken,
		parsePayload,
		createClient,
		classifyEngine,
		testConnection,
		discoverLocalEngines,
	});
})(typeof globalThis !== "undefined" ? globalThis : this);
