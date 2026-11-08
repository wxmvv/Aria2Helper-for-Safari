import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire("/Users/wxm/Developer/ImageHelper/package.json");
const puppeteer = require("puppeteer-core");

const here = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(here, "output");
const base = process.env.UI_BASE || "http://127.0.0.1:8123";

const browser = await puppeteer.launch({
	executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	headless: "new",
	args: ["--hide-scrollbars", "--force-color-profile=srgb"],
});

const problems = [];

async function open(url, options = {}) {
	const page = await browser.newPage();
	await page.setViewport({ width: options.width || 440, height: options.height || 760, deviceScaleFactor: 2 });
	if (options.dark) await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
	page.on("pageerror", (error) => problems.push(`${url}: ${error.message}`));
	page.on("console", (message) => {
		if (message.type() !== "error") return;
		const text = message.text();
		const where = message.location() && message.location().url ? message.location().url : "";
		if (where.endsWith("favicon.ico") || text.includes("ERR_CONNECTION_REFUSED")) return;
		problems.push(`${url}: console ${text}`);
	});
	await page.goto(`${base}${url}`, { waitUntil: "networkidle0" });
	await new Promise((resolve) => setTimeout(resolve, options.wait || 600));
	return page;
}

async function shot(page, name) {
	await page.screenshot({ path: path.join(output, `${name}.png`), fullPage: true });
	console.log(`[shot] ${name}`);
}

const configured = await open("/popup.html?lang=zh-CN", { width: 440, height: 420 });
await shot(configured, "popup-zh");
await configured.close();

const english = await open("/popup.html?lang=en", { width: 440, height: 420 });
await shot(english, "popup-en");
await english.close();

const dark = await open("/popup.html?lang=zh-CN", { width: 440, height: 420, dark: true });
await shot(dark, "popup-dark");
await dark.close();

const empty = await open("/popup.html?lang=zh-CN&seed=empty", { width: 440, height: 360 });
await shot(empty, "popup-empty-zh");
await empty.close();

const add = await open("/popup.html?lang=zh-CN", { width: 440, height: 900 });
await add.click("#addtask");
await new Promise((resolve) => setTimeout(resolve, 600));
await shot(add, "popup-add-zh");

// Feed a fake torrent through the real file input so the inspection UI renders.
await add.evaluate(() => {
	const input = document.getElementById("inputFile");
	const file = new File([new Uint8Array([100, 52, 58, 110, 97, 109, 101, 52, 58, 116, 101, 115, 116, 101, 101])], "Example.Show.S01.torrent", {
		type: "application/x-bittorrent",
	});
	const transfer = new DataTransfer();
	transfer.items.add(file);
	input.files = transfer.files;
	input.dispatchEvent(new Event("change", { bubbles: true }));
});
await new Promise((resolve) => setTimeout(resolve, 1200));
await shot(add, "popup-add-torrent-zh");
await add.close();

const welcome = await open("/settings.html?lang=zh-CN&seed=empty", { width: 900, height: 820 });
await shot(welcome, "settings-welcome-zh");
await welcome.evaluate(() => {
	const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent.includes("扫描"));
	if (button) button.click();
});
await new Promise((resolve) => setTimeout(resolve, 3500));
await shot(welcome, "settings-welcome-scan-zh");
await welcome.close();

const settings = await open("/settings.html?lang=zh-CN&seed=configured", { width: 900, height: 820 });
await shot(settings, "settings-helper-zh");

await settings.evaluate(() => {
	const item = Array.from(document.querySelectorAll(".nav-tab")).find((element) => element.textContent.includes("Rayburst"));
	if (item) item.click();
});
await new Promise((resolve) => setTimeout(resolve, 500));
await shot(settings, "settings-rpc-zh");

await settings.evaluate(() => {
	const item = Array.from(document.querySelectorAll(".nav-tab")).find((element) => element.textContent.includes("其他设置"));
	if (item) item.click();
});
await new Promise((resolve) => setTimeout(resolve, 500));
await shot(settings, "settings-appearance-zh");
await settings.close();

const settingsDark = await open("/settings.html?lang=zh-CN&seed=configured", { width: 900, height: 820, dark: true });
await shot(settingsDark, "settings-helper-dark");
await settingsDark.close();

await browser.close();

if (problems.length) {
	console.log("\n[problems]");
	for (const problem of problems) console.log(`- ${problem}`);
	process.exitCode = 1;
} else {
	console.log("\n[problems] none");
}
