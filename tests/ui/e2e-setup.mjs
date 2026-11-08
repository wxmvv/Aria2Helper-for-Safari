/**
 * End-to-end check of the onboarding wizard against a live engine.
 * Requires ARIA2_RPC and ARIA2_SECRET (same variables as the integration tests),
 * plus tests/ui/serve.mjs running on 8123.
 */
import { createRequire } from "node:module";

const require = createRequire("/Users/wxm/Developer/ImageHelper/package.json");
const puppeteer = require("puppeteer-core");

const secret = process.env.ARIA2_SECRET || "";
const base = process.env.UI_BASE || "http://127.0.0.1:8123";
if (!secret) {
	console.error("ARIA2_SECRET is required to run the wizard e2e");
	process.exit(1);
}

const browser = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: "new" });
const page = await browser.newPage();
await page.setViewport({ width: 900, height: 900, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await page.goto(`${base}/settings.html?lang=en&seed=empty`, { waitUntil: "networkidle0" });

await page.evaluate(() => {
	const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent.includes("Scan local engines"));
	button.click();
});
await page.waitForSelector(".scan-result", { timeout: 15000 });
const found = await page.$eval(".scan-result", (element) => element.textContent.trim());
console.log(`[e2e] discovered: ${found}`);

await page.click(".scan-result");
const password = await page.$('input[type="password"]');
await password.click();
await password.type(secret);

await page.evaluate(() => {
	const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent.trim() === "Test connection");
	button.click();
});
await new Promise((resolve) => setTimeout(resolve, 3000));
console.log("[e2e] alerts:", await page.evaluate(() => Array.from(document.querySelectorAll(".alert")).map((element) => element.textContent.trim()).filter(Boolean)));
console.log("[e2e] secret length:", await page.evaluate(() => document.querySelector('input[type="password"]').value.length));
const status = await page.evaluate(() => Array.from(document.querySelectorAll(".alert")).map((element) => element.textContent.trim()).filter(Boolean));
console.log(`[e2e] status: ${status.join(" | ")}`);

await page.evaluate(() => {
	const button = Array.from(document.querySelectorAll("button")).find((item) => item.textContent.includes("Save and use this profile"));
	button.click();
});
await page.waitForFunction(() => document.querySelector("#nav-title") && document.querySelector("#nav-title").textContent.toLowerCase().includes("helper settings"), { timeout: 10000 });
const sidebar = await page.evaluate(() => Array.from(document.querySelectorAll("#sidebar-profiles .nav-tab")).map((element) => element.textContent.trim()));
console.log(`[e2e] sidebar: ${sidebar.join(", ")}`);
console.log(`[e2e] page errors: ${errors.length ? errors.join(" | ") : "none"}`);

await page.screenshot({ path: "tests/ui/output/settings-e2e-saved.png", fullPage: false });
await browser.close();
