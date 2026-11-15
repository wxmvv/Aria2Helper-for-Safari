/* global __dirname */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import fs from "fs";
import tailwindcss from "@tailwindcss/vite";
import { extensionDev } from "./scripts/extension-dev.mjs";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	base: "./",
	server: {
		host: "127.0.0.1",
		port: 5173,
		strictPort: true,
	},
	build: {
		sourcemap: mode === "development" ? "inline" : false,
		minify: mode === "development" ? false : "esbuild",
		rollupOptions: {
			input: {
				setting: resolve(__dirname, "index.html"),
			},
			output: {
				entryFileNames: "settings.js",
				assetFileNames: (assetInfo) => {
					if (assetInfo.name.endsWith(".css")) {
						return "settings.css";
					}
					return "assets/[name].[ext]";
				},
			},
		},
		outDir: "dist/settings",
		assetsDir: "",
	},

	plugins: [
		extensionDev(),
		react(),
		tailwindcss(),
		{
			name: "rename-html",
			closeBundle() {
				const oldPath = resolve(__dirname, "dist/settings/index.html");
				const newPath = resolve(__dirname, "dist/settings/settings.html");
				if (fs.existsSync(oldPath)) {
					fs.renameSync(oldPath, newPath);
				}
			},
		},
	],
}));
