import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const settingsDir = path.resolve(here, "..");
const repoRoot = path.resolve(settingsDir, "..");
const source = path.join(settingsDir, "dist/settings");
const target = path.join(repoRoot, "Shared (Extension)/Resources");

if (!fs.existsSync(source)) {
	console.error("[settings] dist/settings is missing; run vite build first");
	process.exit(1);
}

// Copy over the existing Resources tree. Do not delete files the build does not
// emit (popup*, content*, background*, images, _locales, common/...).
fs.cpSync(source, target, { recursive: true, force: true });
console.log(`[settings] copied ${path.relative(repoRoot, source)} -> ${path.relative(repoRoot, target)}`);
