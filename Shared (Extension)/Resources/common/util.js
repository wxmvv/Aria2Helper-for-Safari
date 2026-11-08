/**
 * Small, dependency-free helpers shared by every surface.
 * Classic script: attaches itself to globalThis.Aria2Helper.util.
 */
(function (global) {
	"use strict";

	const Aria2Helper = (global.Aria2Helper = global.Aria2Helper || {});

	const SIZE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"];

	/** Parse an aria2 byte counter (decimal string) without losing precision for common sizes. */
	function toNumber(value) {
		if (typeof value === "number") return Number.isFinite(value) ? value : 0;
		if (typeof value !== "string") return 0;
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}

	function formatBytes(value, precision = 1) {
		const bytes = toNumber(value);
		if (bytes <= 0) return "0 B";
		const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), SIZE_UNITS.length - 1);
		if (exponent === 0) return `${Math.round(bytes)} B`;
		const digits = Math.max(0, Math.min(3, precision));
		return `${(bytes / 1024 ** exponent).toFixed(digits)} ${SIZE_UNITS[exponent]}`;
	}

	function formatSpeed(value) {
		const speed = toNumber(value);
		if (speed <= 0) return "0 B/s";
		return `${formatBytes(speed, 1)}/s`;
	}

	/** Seconds -> compact duration ("2d 3h", "4m 05s"), without locale-specific words. */
	function formatDuration(seconds) {
		const total = Math.max(0, Math.floor(toNumber(seconds)));
		const days = Math.floor(total / 86400);
		const hours = Math.floor((total % 86400) / 3600);
		const minutes = Math.floor((total % 3600) / 60);
		const secs = total % 60;
		if (days > 0) return `${days}d ${hours}h`;
		if (hours > 0) return `${hours}h ${minutes}m`;
		if (minutes > 0) return `${minutes}m ${String(secs).padStart(2, "0")}s`;
		return `${secs}s`;
	}

	/** Remaining seconds for a task, or null when unknown. */
	function remainingSeconds(completedLength, totalLength, downloadSpeed) {
		const completed = toNumber(completedLength);
		const total = toNumber(totalLength);
		const speed = toNumber(downloadSpeed);
		if (total <= 0 || speed <= 0) return null;
		return Math.max(0, Math.floor((total - completed) / speed));
	}

	/**
	 * Progress in percent (0..100, two decimals) or null when the total is unknown.
	 * aria2-next media tasks report totalLength "0" and expose media.progress instead.
	 */
	function progressPercent(item) {
		if (!item || typeof item !== "object") return null;
		const total = toNumber(item.totalLength);
		if (total > 0) {
			const completed = toNumber(item.completedLength);
			return Math.min(100, Math.max(0, (completed / total) * 100));
		}
		if (item.media && item.media.progress != null) {
			const ratio = toNumber(item.media.progress);
			if (ratio >= 0) return Math.min(100, Math.max(0, ratio * 100));
		}
		if (item.ed2k && toNumber(item.ed2k.length) > 0) {
			return Math.min(100, Math.max(0, (toNumber(item.ed2k.completedLength) / toNumber(item.ed2k.length)) * 100));
		}
		return null;
	}

	function formatPercent(percent) {
		if (percent == null) return "";
		return `${percent.toFixed(percent >= 10 ? 0 : 1)}%`;
	}

	/** Human-readable size for a task, preferring media/ed2k totals when aria2 reports zero. */
	function effectiveTotalLength(item) {
		const total = toNumber(item && item.totalLength);
		if (total > 0) return total;
		if (item && item.ed2k) return toNumber(item.ed2k.length);
		if (item && item.media && item.media.downloadedLength != null) return toNumber(item.media.downloadedLength);
		return 0;
	}

	function effectiveCompletedLength(item) {
		const completed = toNumber(item && item.completedLength);
		if (completed > 0) return completed;
		if (item && item.ed2k) return toNumber(item.ed2k.completedLength);
		if (item && item.media && item.media.downloadedLength != null) return toNumber(item.media.downloadedLength);
		return 0;
	}

	function sleep(ms) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	function randomId() {
		return Math.random().toString(36).slice(2, 11);
	}

	/** Resolve after `ms`, or reject with `onTimeout()` when the timer wins. */
	function withTimeout(promise, ms, onTimeout) {
		let timer = null;
		const timeout = new Promise((_, reject) => {
			timer = setTimeout(() => reject(onTimeout ? onTimeout() : new Error("timeout")), ms);
		});
		return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
	}

	function safeDecodeURIComponent(value) {
		if (typeof value !== "string") return "";
		try {
			return decodeURIComponent(value);
		} catch {
			return value;
		}
	}

	function truncate(value, maxLength) {
		const text = String(value == null ? "" : value);
		if (text.length <= maxLength) return text;
		return `${text.slice(0, Math.max(0, maxLength - 1))}…`;
	}

	Aria2Helper.util = Object.freeze({
		toNumber,
		formatBytes,
		formatSpeed,
		formatDuration,
		remainingSeconds,
		progressPercent,
		formatPercent,
		effectiveTotalLength,
		effectiveCompletedLength,
		sleep,
		randomId,
		withTimeout,
		safeDecodeURIComponent,
		truncate,
	});
})(typeof globalThis !== "undefined" ? globalThis : this);
