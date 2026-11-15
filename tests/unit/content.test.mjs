import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { loadCommon, resourcesDir } from "../helpers/load-common.mjs";

const settle = () => new Promise((resolve) => setImmediate(resolve));

function contentPage(response) {
	let listener;
	let nativeDownloads = 0;
	const requests = [];
	const location = { href: "https://example.test/page" };
	class Anchor {
		constructor(attributes) {
			this.attributes = { ...attributes };
			this.href = new URL(attributes.href, location.href).href;
			this.nodeType = 1;
			this.nodeName = "A";
			this.style = {};
		}
		hasAttribute(key) { return key in this.attributes; }
		getAttribute(key) { return this.attributes[key] ?? null; }
		setAttribute(key, value) { this.attributes[key] = value; }
		cloneNode() { return new Anchor(this.attributes); }
		remove() {}
		click() {
			const event = { target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
			listener(event);
			if (!event.defaultPrevented && this.hasAttribute("download")) nativeDownloads++;
		}
	}
	const core = {
		...loadCommon(),
		storage: { async loadState() { return { settings: { listenDownloads: true, showNotification: false } }; } },
		messaging: { async send(message) {
			requests.push(message);
			// Bound a broken fallback loop so the regression fails without hanging.
			if (requests.length > 3) return new Promise(() => {});
			return response;
		} },
	};
	const document = {
		baseURI: location.href, cookie: "", body: { appendChild() {} },
		addEventListener(name, callback) { if (name === "click") listener = callback; },
	};
	vm.runInNewContext(fs.readFileSync(path.join(resourcesDir(), "content.js"), "utf8"), {
		window: { Aria2Helper: core, location, addEventListener() {} }, document, location, URL,
		Node: { ELEMENT_NODE: 1 }, console: { warn() {} },
	});
	return { Anchor, requests, location, nativeDownloads: () => nativeDownloads };
}

test("failed download-attribute link falls back once without interception", async () => {
	const page = contentPage({ ok: false, error: { message: "offline" } });
	await settle();
	const anchor = new page.Anchor({ href: "/archive.zip", download: "archive.zip" });
	anchor.click();
	await settle();
	assert.equal(page.requests.length, 1);
	assert.equal(page.nativeDownloads(), 1);
	assert.equal(anchor.hasAttribute("data-aria2helper-ignore"), false, "original link remains interceptable");
});

test("successful download handoff does not also start a native download", async () => {
	const page = contentPage({ ok: true, data: { gid: "123" } });
	await settle();
	new page.Anchor({ href: "/archive.zip", download: "archive.zip" }).click();
	await settle();
	assert.equal(page.requests.length, 1);
	assert.equal(page.nativeDownloads(), 0);
});

test("failed ordinary link falls back to navigation with its query intact", async () => {
	const page = contentPage({ ok: false, error: { message: "offline" } });
	await settle();
	new page.Anchor({ href: "/archive.zip?token=example" }).click();
	await settle();
	assert.equal(page.requests.length, 1);
	assert.equal(page.location.href, "https://example.test/archive.zip?token=example");
});
