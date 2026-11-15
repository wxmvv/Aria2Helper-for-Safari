import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../", import.meta.url));
const resources = path.join(root, "Shared (Extension)/Resources");
const mock = path.join(root, "tests/ui/mock.js");

// Development only: serve the original shared core and reuse the UI harness's
// browser mock. No mock code or endpoints are included in extension builds.
export function extensionDev() {
	return {
		name: "extension-dev",
		apply: "serve",
		transformIndexHtml: {
			order: "pre",
			handler() {
				return [
					{ tag: "script", attrs: { src: "/__dev/messages.js" }, injectTo: "head-prepend" },
					{ tag: "script", attrs: { src: "/__dev/mock.js" }, injectTo: "head-prepend" },
				];
			},
		},
		configureServer(server) {
			const watched = [path.join(resources, "common"), path.join(resources, "_locales"), mock];
			server.watcher.add(watched);
			const reload = (file) => {
				if (watched.some((entry) => file === entry || file.startsWith(entry + path.sep))) {
					server.ws.send({ type: "full-reload" });
				}
			};
			server.watcher.on("all", (_event, file) => reload(file));
			server.middlewares.use((request, response, next) => {
				const url = new URL(request.url, "http://localhost");
				let body;
				if (url.pathname === "/__dev/messages.js") {
					const messages = Object.fromEntries(["en", "zh-CN"].map((locale) => {
						const source = JSON.parse(fs.readFileSync(path.join(resources, "_locales", locale, "messages.json"), "utf8"));
						return [locale, Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value.message]))];
					}));
					body = `window.__MESSAGES__ = ${JSON.stringify(messages)};`;
				} else if (url.pathname === "/__dev/mock.js") {
					body = fs.readFileSync(mock);
				} else if (/^\/common\/[a-z]+\.js$/.test(url.pathname)) {
					const file = path.join(resources, url.pathname.slice(1));
					if (!fs.existsSync(file)) return next();
					body = fs.readFileSync(file);
				} else {
					return next();
				}
				response.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
				response.end(body);
			});
		},
	};
}
