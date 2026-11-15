/**
 * Content script: hands matching link clicks to aria2.
 * Loaded after common/*.js (see manifest.json), guarded against double injection.
 */
(function () {
	"use strict";

	if (window.__aria2HelperContentLoaded) return;
	window.__aria2HelperContentLoaded = true;

	const A = window.Aria2Helper;
	if (!A || !A.filters || !A.messaging) return;

	const { filters, files, storage, messaging, i18n } = A;

	let settings = null;

	function refreshSettings() {
		storage
			.loadState()
			.then((state) => {
				settings = state.settings;
			})
			.catch(() => {
				settings = null;
			});
	}

	refreshSettings();
	if (window.browser && window.browser.storage && window.browser.storage.onChanged) {
		window.browser.storage.onChanged.addListener(() => refreshSettings());
	}

	function findAnchor(node) {
		let element = node;
		while (element && element.nodeType === Node.ELEMENT_NODE) {
			if (element.nodeName === "A") return element;
			// A button inside a link usually has its own click behaviour; leave it alone.
			if (element.nodeName === "BUTTON" && element.parentElement && element.parentElement.nodeName === "A") return null;
			element = element.parentElement;
		}
		return null;
	}

	function resolvedHttpUrl(anchor) {
		const raw = anchor.getAttribute("href");
		if (!raw || raw.startsWith("#") || /^(javascript|mailto|tel|data|blob):/i.test(raw)) return "";
		const absolute = files.resolveUrl(raw, document.baseURI);
		if (!absolute || !files.isHttpUrl(absolute)) return "";
		try {
			const url = new URL(absolute);
			return `${url.origin}${url.pathname}`;
		} catch {
			return "";
		}
	}

	function openNatively(anchor) {
		const href = anchor.href;
		if (!href) return;
		try {
			if (anchor.hasAttribute("download")) {
				const link = anchor.cloneNode(true);
				// Replaying the click must bypass our document-level interceptor.
				link.setAttribute("data-aria2helper-ignore", "");
				link.style.display = "none";
				document.body.appendChild(link);
				link.click();
				link.remove();
				return;
			}
			const target = anchor.getAttribute("target");
			if (target === "_blank") {
				const opened = window.open(href, "_blank", "noopener");
				if (opened) return;
			}
			if (target === "_top" && window.top) {
				window.top.location.href = href;
				return;
			}
			if (target === "_parent" && window.parent) {
				window.parent.location.href = href;
				return;
			}
			window.location.href = href;
		} catch (error) {
			console.warn("[Aria2Helper] Could not open the link: ", error);
		}
	}

	function notify(title, body) {
		if (!settings || !settings.showNotification) return;
		messaging.send({ api: "native.notify", title, body }, { timeoutMs: 5000 }).catch(() => {});
	}

	async function handleClick(event) {
		if (event.defaultPrevented) return;
		if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
		const anchor = findAnchor(event.target);
		if (!anchor) return;
		if (anchor.hasAttribute("data-aria2helper-ignore")) return;
		const href = anchor.getAttribute("href");
		if (!href) return;
		if (anchor.href && anchor.href.includes("github.com") && anchor.href.includes("archive/refs/heads")) return;

		const url = resolvedHttpUrl(anchor);
		if (!url) return;
		if (!settings) {
			// Settings have not loaded yet: let Safari handle the click instead of blocking it.
			return;
		}
		// "Listen for downloads" is the master switch for automatic interception.
		if (!settings.listenDownloads) return;
		const decision = filters.decideInterception(url, settings);
		if (!decision.intercept) return;

		event.preventDefault();
		const parts = files.getFileParts(url);
		let cookie = "";
		try {
			cookie = document.cookie || "";
		} catch {
			/* sandboxed frames may hide document.cookie */
		}
		const response = await messaging.send(
			{
				api: "downloads.addUri",
				url: anchor.href,
				referer: location.href,
				cookie,
			},
			{ timeoutMs: 8000 }
		);
		if (response.ok) {
			notify(i18n.t("Task_added_successfully", "Download started"), parts.filename || url);
		} else {
			console.warn("[Aria2Helper] aria2 rejected the link, falling back to Safari: ", response.error);
			openNatively(anchor);
			notify(i18n.t("Task_added_failed", "Could not reach aria2"), response.error ? response.error.message : "");
		}
	}

	document.addEventListener("click", (event) => {
		handleClick(event).catch((error) => console.warn("[Aria2Helper] click handler failed: ", error));
	});

	window.addEventListener("pagehide", () => {
		window.__aria2HelperContentLoaded = false;
	});
})();
