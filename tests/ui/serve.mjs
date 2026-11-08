import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const resources = path.resolve(here, "../../Shared (Extension)/Resources");
const port = Number(process.env.PORT || 8123);

const types = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".svg": "image/svg+xml",
	".webp": "image/webp",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
};

function messagesScript() {
	const en = JSON.parse(fs.readFileSync(path.join(resources, "_locales/en/messages.json"), "utf8"));
	const zh = JSON.parse(fs.readFileSync(path.join(resources, "_locales/zh-CN/messages.json"), "utf8"));
	const flatten = (source) => Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value.message]));
	return `window.__MESSAGES__ = ${JSON.stringify({ en: flatten(en), "zh-CN": flatten(zh) })};`;
}

const mockJs = fs.readFileSync(path.join(here, "mock.js"), "utf8");

const server = http.createServer((request, response) => {
	const url = new URL(request.url, `http://127.0.0.1:${port}`);
	if (url.pathname === "/__messages.js") {
		response.writeHead(200, { "Content-Type": types[".js"] });
		response.end(messagesScript());
		return;
	}
	if (url.pathname === "/__mock.js") {
		response.writeHead(200, { "Content-Type": types[".js"] });
		response.end(mockJs);
		return;
	}

	const relative = decodeURIComponent(url.pathname).replace(/^\/+/, "");
	const file = path.resolve(resources, relative);
	if (!file.startsWith(resources)) {
		response.writeHead(403);
		response.end("forbidden");
		return;
	}
	if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
		response.writeHead(404);
		response.end(`not found: ${relative}`);
		return;
	}
	const extension = path.extname(file);
	const isHtml = extension === ".html";
	let body = fs.readFileSync(file);
	if (isHtml) {
		body = Buffer.from(
			body
				.toString("utf8")
				.replace("<head>", '<head>\n\t\t<script src="/__messages.js"></script>\n\t\t<script src="/__mock.js"></script>')
		);
	}
	response.writeHead(200, {
		"Content-Type": types[extension] || "application/octet-stream",
		"Cache-Control": "no-store",
		"Access-Control-Allow-Origin": "*",
	});
	response.end(body);
});

server.listen(port, "127.0.0.1", () => {
	console.log(`[ui] serving ${resources}`);
	console.log(`[ui] http://127.0.0.1:${port}/popup.html`);
	console.log(`[ui] http://127.0.0.1:${port}/settings.html?seed=empty`);
});
