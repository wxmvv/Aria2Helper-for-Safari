// Creates a screenshot-only mock fixture; never changes product/test source.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const out = path.join(root, 'build/store-assets');
fs.mkdirSync(out, { recursive: true });
const server = fs.readFileSync(path.join(root, 'tests/ui/serve.mjs'), 'utf8').replace('path.resolve(here, "../../Shared (Extension)/Resources")', 'path.resolve(process.cwd(), "Shared (Extension)/Resources")');
let mock = fs.readFileSync(path.join(root, 'tests/ui/mock.js'), 'utf8');
for (const [before, after] of Object.entries({ 'Show.S01E01.1080p.mkv': 'Family-video.mp4', 'Xcode_26.2.xip': 'Project-archive.zip', 'https://developer.apple.com/xcode.xip': 'https://example.com/project-archive.zip', 'keynote-live.mp4': 'Garden-camera.mp4', 'MotrixNext-1.0.dmg': 'Photo-backup.zip', 'ubuntu-26.04.iso': 'Linux-installer.iso' })) mock = mock.replaceAll(before, after);
fs.writeFileSync(path.join(out, 'serve.mjs'), server);
fs.writeFileSync(path.join(out, 'mock.js'), mock);
console.log('Run from repository root: node build/store-assets/serve.mjs');
