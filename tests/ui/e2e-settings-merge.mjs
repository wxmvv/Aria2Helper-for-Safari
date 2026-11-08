/**
 * Verifies that an edit made in a stale settings tab does not overwrite a field
 * changed elsewhere (for example the popup's listening switch).
 */
import { createRequire } from "node:module";

const require = createRequire("/Users/wxm/Developer/ImageHelper/package.json");
const puppeteer = require("puppeteer-core");
const base = process.env.UI_BASE || "http://127.0.0.1:8123";

const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 900 });
page.on("pageerror", (error) => console.log("[pageerror]", error.message));
await page.goto(`${base}/settings.html?lang=en&seed=configured`, { waitUntil: "networkidle0" });

await page.evaluate(async () => {
	const snapshot = await browser.storage.local.get(null);
	snapshot.settings.listenDownloads = false;
	await browser.storage.local.set({ settings: snapshot.settings });
});
await new Promise((resolve) => setTimeout(resolve, 200));

// The first toggle on the Helper Settings tab is "show badge".
await page.click(".toggle");
await new Promise((resolve) => setTimeout(resolve, 600));

const result = await page.evaluate(async () => {
	const snapshot = await browser.storage.local.get(null);
	return { listenDownloads: snapshot.settings.listenDownloads, showBadge: snapshot.settings.showBadge };
});
console.log("[merge]", JSON.stringify(result));
if (result.listenDownloads !== false || result.showBadge !== false) {
	console.error("[merge] FAILED: stale settings overwrote a newer value");
	process.exitCode = 1;
}
await browser.close();
