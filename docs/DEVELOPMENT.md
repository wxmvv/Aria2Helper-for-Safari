# Development and debugging

**English** · [简体中文](DEVELOPMENT_CN.md) · [Back to README](../README.md)

## Environment and source layout

- Node.js 22+ and npm. Run `npm run setup` at the repository root to install dependencies from `settings/package-lock.json`.
- Native builds require full Xcode and the corresponding platform SDK. For App Store releases, use Xcode 26 or later and check Apple's current upload requirements.
- `settings/src/` contains the React settings source. Do not edit the generated `settings.js`, `settings.css` or `settings.html` under the extension resources directly.
- `Shared (Extension)/Resources/common/` is the shared core source; `settings/public/common/` is a generated copy.
- `popup.*`, `background.js` and `content.js` are extension entry points. `Shared (App)/` contains the native container; platform directories hold their configuration and entry points.
- Command-line native debug builds use `build/debug/`. Existing ignored `build-*` directories are historical local outputs.

## Commands

Run these from the repository root:

| Command | Purpose |
| --- | --- |
| `npm run setup` | Install settings dependencies from the lockfile |
| `npm run dev` | Settings hot reload at 127.0.0.1:5173 |
| `npm run dev:ui` | Static popup/built settings harness at 127.0.0.1:8123 |
| `npm run build:debug` | Unminified settings bundle with inline source maps, copied into extension resources |
| `npm run debug:macos` | Build debug settings and the Mac app with ad-hoc signing |
| `npm run build:settings` | Minified production settings bundle without source maps |
| `npm test` | Core unit and regression tests without an engine |
| `npm run lint:settings` | Settings ESLint checks |
| `npm run test:integration` | Real-engine tests using ARIA2_RPC / ARIA2_SECRET |

## Settings hot reload and breakpoints

```sh
npm run dev
```

Open <http://127.0.0.1:5173/?lang=en&seed=configured>.
Vite injects the browser mock from `tests/ui/mock.js` and language messages only in the development server.
React changes reload automatically; shared core, language and mock changes trigger a full refresh.
The server fails if its port is occupied, so breakpoints do not silently attach to another server.

- `?seed=empty&lang=en`: first-run setup with no configured engine.
- `?seed=configured&lang=zh-CN`: configured example state in Chinese.
- Both experimental appearance options default to off. Add `&glass=1&bg=1` for glass and background tint, or `&glass=1&bg=0` for glass alone.

Mock storage lives in page memory and resets on reload. Mock messages return example tasks and do not execute real background or native operations.
RPC discovery and connection tests called directly by settings can still contact local engines.
Verify actual interception, background messaging and native bridging in Safari.

Set browser breakpoints directly in `settings/src/` JSX files.
In VS Code, select **Settings: Chrome** and press F5 to start Vite and Chrome debugging.
Stop the development server with **Terminate Task** when finished.

## Popup and built settings preview

```sh
npm run build:debug
npm run dev:ui
```

Open <http://127.0.0.1:8123/popup.html> or
<http://127.0.0.1:8123/settings.html?seed=empty&lang=en>.
This harness also uses a mocked browser API. Refresh after popup edits; rebuild settings before refreshing after React edits.
Use `PORT=8124 npm run dev:ui` to change its port.

## macOS and Safari debugging

```sh
npm run debug:macos
open build/debug/Build/Products/Debug/Aira2Helper.app
```

The command uses ad-hoc signing without a personal development certificate; it is not a distribution build.
If Safari rejects the local extension, enable developer features in Safari settings, allow unsigned extensions from its Develop menu, then enable Aria2 Helper in Settings → Extensions.
The unsigned-extension option may need enabling again after Safari restarts; menu wording varies by Safari version.

- **Settings / popup:** open the extension page and select its Web Inspector from Safari's Develop menu. Keep the popup open while inspecting it.
- **Background:** select Aria2 Helper under Develop → Web Extension Background Content to inspect `background.js`, Console and Network.
- **Content script:** inspect the webpage, then select the extension's `content.js` and execution context in the Inspector.
- **Native container:** open `Aira2Helper.xcodeproj`, select the shared `Aira2Helper (macOS)` scheme and run Debug. Run `npm run build:debug` before Command-R. React changes require rebuilding both the settings bundle and app. Set Swift breakpoints in Xcode.
- **Native extension handler:** use Xcode's Debug → Attach to Process, then trigger message handling in `SafariWebExtensionHandler.swift`.

Debug builds keep Swift symbols and disable optimization. On supported systems, the container's WKWebView enables `isInspectable` for Safari inspection; Release does not.
Debug settings use inline source maps, avoiding separate mapping files that could be omitted from the bundle.
The extension uses the existing bundle ID and may share configuration with an installed version; check existing RPC settings before debugging.

## iOS debugging

Run `npm run build:debug`, open Xcode, select the shared `Aira2Helper (iOS)` scheme and a simulator, then press Command-R.
A physical device requires a valid development team/signing configuration for both App and Extension targets, plus device Developer Mode.
Enable the extension and required website permissions in iOS Safari settings.
For physical-device web inspection, enable Safari Web Inspector, connect and trust the Mac, then select the device and extension page from Mac Safari's Develop menu.
Mock pages do not replace platform testing.

## Before committing or releasing

Debug settings builds overwrite tracked generated files. Do not commit the large Debug bundle.
Run `npm run build:settings` to restore production resources before committing or archiving, inspect `git diff`, then run unit tests and lint.
Xcode Profile / Archive uses Release but does not rebuild React automatically; build production settings first.
The development browser mock is only injected by `vite serve` and is excluded from both settings build modes.

## App Store releases

See the [release guide](../release/README.md) for packaging and review materials.
`release:archive` first builds production settings; `release:export` exports locally without uploading.
Archive and exported-package checks validate signatures, bundled resources, versions, privacy manifests and quarantine attributes.

```sh
npm run release:check
npm run release:archive -- macos
npm run release:verify -- macos
npm run release:export -- macos --allow-provisioning-updates
npm run release:verify-export -- macos
```

For iOS, replace `macos` with `ios`. The automatic-signing option uses the developer account already configured in Xcode.
