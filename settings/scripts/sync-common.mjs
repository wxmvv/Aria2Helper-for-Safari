import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const settingsDir = path.resolve(here, "..");
const repoRoot = path.resolve(settingsDir, "..");
const source = path.join(repoRoot, "Shared (Extension)/Resources/common");
const target = path.join(settingsDir, "public/common");

fs.rmSync(target, { recursive: true, force: true });
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.cpSync(source, target, { recursive: true });
console.log(`[settings] synced ${path.relative(repoRoot, source)} -> ${path.relative(repoRoot, target)}`);
