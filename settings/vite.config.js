import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";
import fs from "fs";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
	build: {
		rollupOptions: {
			input: {
				setting: resolve(__dirname, "index.html"),
			},
			output: {
				entryFileNames: "setting.js",
				assetFileNames: (assetInfo) => {
					if (assetInfo.name.endsWith(".css")) {
						return "setting.css";
					}
					return "assets/[name].[ext]";
				},
			},
		},
		outDir: "dist/settings",
		assetsDir: "",
	},

	plugins: [
		react(),
		tailwindcss(),
		{
			name: "rename-html",
			closeBundle() {
				const oldPath = resolve(__dirname, "dist/settings/index.html");
				const newPath = resolve(__dirname, "dist/settings/setting.html");
				if (fs.existsSync(oldPath)) {
					fs.renameSync(oldPath, newPath);
				}
			},
		},
	],
});
