import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { loadCommon, resourcesDir } from "./load-common.mjs";

export const settle = () => new Promise((resolve) => setImmediate(resolve));
const clone = (value) => JSON.parse(JSON.stringify(value));

// Minimal DOM used to run the complete popup controller and dispatch its real
// event handlers in Node, without a browser installation or test-only hooks.
class Element {
	constructor(tag = "div") {
		this.tagName = tag.toUpperCase();
		this.children = [];
		this.parentElement = null;
		this.dataset = {};
		this.style = { setProperty() {} };
		this.listeners = {};
		this.classes = new Set();
		this.classList = {
			add: (...names) => names.forEach((name) => this.classes.add(name)),
			remove: (...names) => names.forEach((name) => this.classes.delete(name)),
			contains: (name) => this.classes.has(name),
			toggle: (name, force = !this.classes.has(name)) => { if (force) this.classes.add(name); else this.classes.delete(name); return force; },
		};
	}
	set className(value) { this.classes = new Set(value.split(/\s+/).filter(Boolean)); }
	get className() { return [...this.classes].join(" "); }
	set innerHTML(value) { this.children.forEach((child) => { child.parentElement = null; }); this.children = []; this._text = value; }
	set textContent(value) { this.innerHTML = value; }
	get textContent() { return this._text || ""; }
	appendChild(child) { this.children.push(child); child.parentElement = this; return child; }
	remove() { if (this.parentElement) this.parentElement.children = this.parentElement.children.filter((child) => child !== this); this.parentElement = null; }
	setAttribute(key, value) { this[key] = value; }
	addEventListener(name, callback) { (this.listeners[name] ||= []).push(callback); }
	click() { if (!this.disabled) for (const callback of this.listeners.click || []) callback({ stopPropagation() {}, preventDefault() {} }); }
	focus() {}
	querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
	querySelectorAll(selector) {
		const match = (el) => selector.startsWith("#") ? el.id === selector.slice(1) : selector.startsWith(".") ? selector.slice(1).split(".").every((name) => el.classes.has(name)) : el.tagName.toLowerCase() === selector;
		return this.children.flatMap((child) => [...(match(child) ? [child] : []), ...child.querySelectorAll(selector)]);
	}
}

export async function popupPage(tasks = []) {
	const html = new Element("html");
	const body = html.appendChild(new Element("body"));
	const add = (parent, id, className = "") => { const el = parent.appendChild(new Element()); el.id = id; el.className = className; return el; };
	const header = add(body, "", "header");
	add(header, "appTitle"); add(header, "engineBadge");
	const navbar = add(body, "", "navbar");
	add(navbar, "", "navbar-left"); add(navbar, "", "navbar-right");
	add(body, "notification"); add(body, "dialogue"); add(body, "downloadList");
	const empty = add(body, "noTask"); add(empty, "noTaskText"); add(empty, "noTaskActions");
	const document = {
		documentElement: html, body, readyState: "complete", visibilityState: "visible",
		getElementById: (id) => html.querySelector(`#${id}`), querySelector: (selector) => html.querySelector(selector),
		createElement: (tag) => new Element(tag), addEventListener() {},
	};
	const common = loadCommon();
	const state = common.storage.normalizeState({ profiles: { local: { rpcHost: "localhost", rpcPort: "6800" } } }).state;
	let currentTasks = tasks;
	let poll;
	const requests = [];
	const replies = new Map();
	const core = {
		...common, storage: { ...common.storage, async loadState() { return clone(state); } },
		messaging: { async send(message) {
			requests.push(message);
			if (replies.has(message.api)) return replies.get(message.api)(message);
			if (message.api === "engine.getVersion") return { ok: true, data: { product: "aria2", version: "1.37", enabledFeatures: [] } };
			if (message.api === "downloads.list") return { ok: true, data: clone({ active: currentTasks.filter((t) => t.status === "active"), waiting: currentTasks.filter((t) => t.status === "paused" || t.status === "waiting"), stopped: currentTasks.filter((t) => ["complete", "error", "removed"].includes(t.status)) }) };
			return { ok: true, data: { isLocal: true, result: true } };
		} },
	};
	vm.runInNewContext(fs.readFileSync(path.join(resourcesDir(), "popup.js"), "utf8"), {
		window: { Aria2Helper: core, addEventListener() {} }, document, navigator: { userAgent: "Macintosh", maxTouchPoints: 0 }, location: { hash: "" },
		setTimeout: () => 1, clearTimeout() {}, setInterval(callback) { poll = callback; return 1; }, clearInterval() {}, console,
	});
	await settle();
	return { document, requests, replies, async refresh(tasks) { currentTasks = tasks; poll(); await settle(); } };
}
