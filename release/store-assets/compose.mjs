#!/usr/bin/env node
// Composes actual product screenshots with store copy. Never draws product UI.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const root = fileURLToPath(new URL('../../', import.meta.url));
const manifestArg = process.argv.slice(2).find(a => !a.startsWith('--'));
const draft = process.argv.includes('--draft');
if (!manifestArg) throw new Error('Usage: node release/store-assets/compose.mjs INPUTS.json [--draft]');
const manifest = JSON.parse(fs.readFileSync(path.resolve(root, manifestArg)));
const copy = JSON.parse(fs.readFileSync(new URL('copy.json', import.meta.url)));
const out = path.join(root, 'build/store-assets', draft ? 'previews' : 'rendered');
const platforms = { macos: [2880, 1800], ios: [1206, 2622], ipados: [2064, 2752] };
const scenes = ['tasks', 'import', 'setup'];
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const uri = p => `data:image/${/\.jpe?g$/i.test(p) ? 'jpeg' : 'png'};base64,${fs.readFileSync(p).toString('base64')}`;
const icon = uri(path.join(root, 'Shared (App)/Assets.xcassets/AppIcon.appiconset/512@2x.png'));
const report = { generatedAt: new Date().toISOString(), uploadReady: !draft, sourceVersion: manifest.sourceVersion, build: manifest.build, files: [] };
fs.mkdirSync(out, { recursive: true });
// Select the installed W6 face explicitly; ImageMagick otherwise selects TTC W3.
// This local font derivative stays in ignored build output, never the release source.
const zhFont = path.join(out, 'HiraginoSansGB-W6.otf');
{
  const ttc = fs.readFileSync('/System/Library/Fonts/Hiragino Sans GB.ttc');
  const face = ttc.readUInt32BE(12 + 2 * 4);
  const count = ttc.readUInt16BE(face + 4);
  const header = Buffer.from(ttc.subarray(face, face + 12 + count * 16));
  let offset = header.length;
  const chunks = [header];
  for (let i = 0; i < count; i++) {
    const record = 12 + i * 16;
    const original = header.readUInt32BE(record + 8);
    const length = header.readUInt32BE(record + 12);
    const padding = (4 - offset % 4) % 4;
    chunks.push(Buffer.alloc(padding)); offset += padding;
    header.writeUInt32BE(offset, record + 8);
    chunks.push(ttc.subarray(original, original + length)); offset += length;
  }
  fs.writeFileSync(zhFont, Buffer.concat(chunks));
}

function textLines(lines, x, y, size, weight = 400, color = '#182B48', spacing = 1.2) {
  return lines.map((line, i) => `<text x="${x}" y="${y + i * size * spacing}" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(line)}</text>`).join('\n');
}
for (const [platform, [w, h]] of Object.entries(platforms)) {
  for (const [locale, words] of Object.entries(copy)) {
    for (const [index, scene] of scenes.entries()) {
      const common = manifest.captures?.[locale]?.[scene];
      const capture = { ...common, ...common?.platforms?.[platform] };
      if (!capture.path) throw new Error(`Missing capture: ${locale}/${scene}/${platform}`);
      if (!draft && capture.verifiedCurrentUI !== true) throw new Error(`Unverified UI: ${locale}/${scene}; use --draft for internal previews only`);
      const source = path.resolve(root, capture.path);
      const [iw, ih] = execFileSync('magick', ['identify', '-format', '%w %h', source], { encoding: 'utf8' }).trim().split(' ').map(Number);
      const crop = capture.crop ?? { x: 0, y: 0, width: iw, height: ih };
      const cropped = path.join(out, `crop-${locale}-${scene}-${platform}.png`);
      execFileSync('magick', [source, '-crop', `${crop.width}x${crop.height}+${crop.x}+${crop.y}`, '+repage', cropped]);
      const c = words.scenes[scene];
      const desktop = platform === 'macos';
      const phone = platform === 'ios';
      const margin = desktop ? 150 : phone ? 84 : 130;
      const titleSize = desktop ? 135 : phone ? 104 : 148;
      const brandSize = desktop ? 42 : phone ? 38 : 48;
      const iconSize = desktop ? 82 : phone ? 72 : 96;
      const brandY = desktop ? 120 : phone ? 110 : 140;
      const titleY = desktop ? 430 : phone ? 370 : 465;
      const descY = desktop ? 815 : phone ? 690 : 905;
      const descSize = desktop ? 43 : phone ? 39 : 51;
      const box = desktop ? { x: 1490, y: 310, w: 1230, h: 1240 } : phone ? { x: 84, y: 960, w: 1038, h: 1400 } : { x: 130, y: 1200, w: 1804, h: 1240 };
      const scale = Math.min(box.w / crop.width, box.h / crop.height);
      const sw = crop.width * scale, sh = crop.height * scale;
      const sx = box.x + (box.w - sw) / 2, sy = box.y + (box.h - sh) / 2;
      const footerX = desktop ? margin : w / 2;
      const footerY = desktop ? 1530 : phone ? 2460 : 2590;
      const footerSize = desktop ? 31 : phone ? 28 : 35;
      const footer = textLines(c.footer, footerX, footerY, footerSize, 400, '#526782', 1.6);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#F2F7FE"/><stop offset="1" stop-color="#E5E8FA"/></linearGradient><clipPath id="clip"><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="26"/></clipPath></defs>
<rect width="${w}" height="${h}" fill="#EDF2FB"/>

<g>
<image x="${margin}" y="${brandY}" width="${iconSize}" height="${iconSize}" xlink:href="${icon}"/>
${textLines([words.brand], margin + iconSize + 24, brandY + iconSize * .69, brandSize, 600)}
${textLines(c.title, margin, titleY, titleSize, 600, '#182B48', 1.19)}
${textLines(c.description, margin, descY, descSize, 400, '#526782', 1.55)}
<rect x="${sx}" y="${sy + 15}" width="${sw}" height="${sh}" rx="26" fill="#273F70" opacity=".10"/>
<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="26" fill="white"/>
<image x="${sx}" y="${sy}" width="${sw}" height="${sh}" xlink:href="${uri(cropped)}"/>
<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="26" fill="none" stroke="#B7C8E1" stroke-width="2"/>
<g${desktop ? '' : ' text-anchor="middle"'}>${footer}</g>
${draft ? textLines(['DRAFT · NOT FOR UPLOAD'], w / 2, h - 30, 24, 600, '#A14F4F') : ''}
</g></svg>`;
      const dir = path.join(out, platform, locale);
      fs.mkdirSync(dir, { recursive: true });
      const stem = `${String(index + 1).padStart(2, '0')}-${scene}`;
      const svgPath = path.join(dir, `${stem}.svg`), jpgPath = path.join(dir, `${stem}.jpg`);
      fs.writeFileSync(svgPath, svg);
      execFileSync('magick', ['-font', locale === 'zh-Hans' ? zhFont : '/System/Library/Fonts/Avenir Next.ttc', '-background', 'white', svgPath, '-alpha', 'remove', '-alpha', 'off', '-colorspace', 'sRGB', '-quality', '95', jpgPath]);
      report.files.push({ platform, locale, scene, file: path.relative(root, jpgPath), dimensions: [w, h], input: path.relative(root, source), inputSha256: crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'), verifiedCurrentUI: capture.verifiedCurrentUI === true, crop, sampleData: capture.sampleData, provenance: capture.provenance });
    }
  }
}
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(path.join(out, 'preview.html'), `<!doctype html><meta charset="utf-8"><title>Aria2 Helper 2.0 store screenshots</title><style>body{margin:40px;background:#eaf0f8;font:16px system-ui;color:#182b48}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:24px}figure{margin:0}img{width:100%;display:block;border:1px solid #b7c8e1}figcaption{padding:12px 0}</style><h1>${draft ? 'Draft — not for upload' : 'App Store screenshots'}</h1><main>${report.files.map(f=>`<figure><a href="${f.platform}/${f.locale}/${path.basename(f.file)}"><img src="${f.platform}/${f.locale}/${path.basename(f.file)}"></a><figcaption>${f.platform} · ${f.locale} · ${f.scene}</figcaption></figure>`).join('')}</main>`);
fs.unlinkSync(zhFont);
console.log(`${report.files.length} screenshots composed in ${path.relative(root, out)} (${draft ? 'draft only' : 'upload ready'})`);
