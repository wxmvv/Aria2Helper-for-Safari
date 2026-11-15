# Aria2Helper

A Safari web extension that turns downloads over to [aria2](https://aria2.github.io/) — including
[aria2-next](https://github.com/AnInsomniacy/aria2-next) and engines bundled by Rayburst / Motrix.

The extension is a small popup, a background service worker, a content script and a React settings app.
Everything is local: it talks to your own aria2 JSON-RPC endpoint.

## Features (2.0)

- **aria2 and aria2-next.** The same JSON-RPC client works with classic aria2 1.3x and aria2-next 3.x.
  The engine badge shows the product/version; aria2-next extras (`aria2.probe`, torrent inspection,
  ED2K/HLS status fields) are detected from `aria2.getVersion`.
- **Robust by default.** One typed error model, request timeouts, `system.multicall` with a sequential
  fallback, schema migration for settings saved by 1.x, and every message returns either `{ok, data}`
  or `{ok:false, error}` instead of failing silently.
- **Multi-file import.** Pick or drop several `.torrent` / `.metalink` / `.meta4` files at once, or paste
  a list of links. Torrents are inspected locally (bencode) and aria2's `select-file` is used to add only
  the files you keep.
- **Skip file types.** A global skip list stops automatic interception and pre-unchecks those extensions
  inside torrents. Cookies and referer forwarding are separate privacy toggles.
- **Guided setup.** A three-step wizard finds a local engine (`6800`, `29100`, `16800`), explains
  `brew install aria2` and Rayburst's RPC secret location, tests the connection and saves the profile.
- **Liquid Glass.** Translucent, layered surfaces in the popup and settings, with fallbacks for
  Reduce Transparency and Increase Contrast. The macOS/iOS container app uses native
  `NSGlassEffectView` / `UIGlassEffect` on system versions that provide them (26+).
- **Readable task list.** Progress for ordinary downloads, aria2-next media (`totalLength == 0`),
  ED2K, torrents and errors; pause/resume, restart, purge and "show in Finder".

## Requirements

- macOS 12 or later (the extension). The native glass chrome needs macOS 26 / iOS 26.
- Safari 16.4 or later.
- A running aria2-compatible JSON-RPC endpoint. Common setups:
  - aria2: `brew install aria2`, then run with `--enable-rpc --rpc-secret=…`
  - [Rayburst](https://github.com/AnInsomniacy/rayburst): enable RPC in the app (default port `29100`)
  - [aria2-next](https://github.com/AnInsomniacy/aria2-next) directly
- `rpc-allow-origin-all=true` on the engine (Rayburst sets it) so the extension page may call it.

## Installation

The App Store build is the previous 1.x line. For a local build:

```sh
# 1. Build the settings bundle into Shared (Extension)/Resources
npm --prefix settings ci
npm --prefix settings run build

# 2. Build the macOS app
xcodebuild -project Aira2Helper.xcodeproj -scheme "Aira2Helper (macOS)" \
  -configuration Debug -derivedDataPath build \
  CODE_SIGN_IDENTITY=- CODE_SIGN_SIGNING_ALLOWED=YES CODE_SIGNING_REQUIRED=NO CODE_SIGN_STYLE=Manual \
  build
open build/Build/Products/Debug/Aira2Helper.app
```

Then enable the extension in **Safari › Settings › Extensions** and open the app's settings to configure
the RPC endpoint. The toolbar button opens the popup.

### Connecting to Rayburst

1. Open Rayburst › Settings › Engine and copy the **RPC secret**. Confirm RPC is enabled (port `29100`).
2. Open Aria2Helper settings › **Get started** › **Scan local engines**.
3. Pick the detected Rayburst entry, paste the secret, press **Test connection**, then **Save**.
4. If Safari asks for local network access, allow it.

## Development

Start with `npm run setup`, then `npm run dev` for the settings page with hot reload
and a mocked extension API at <http://127.0.0.1:5173/>. For native and Safari
debugging, run `npm run debug:macos`.

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for the development commands,
breakpoints, mock scenarios, signing, and the macOS/iOS debugging workflow.

```sh
npm test                    # unit tests (pure core modules)
ARIA2_RPC=http://127.0.0.1:29100/jsonrpc ARIA2_SECRET=… \
  npm run test:integration  # real engine: add, poll, complete, probe, multicall

node tests/ui/serve.mjs     # static harness with a mocked browser API
node tests/ui/capture.mjs   # screenshots of popup/settings states -> tests/ui/output
ARIA2_SECRET=… node tests/ui/e2e-setup.mjs   # wizard: scan -> secret -> test -> save
```

Settings sources live in `settings/`; `npm --prefix settings run build` bundles them into
`Shared (Extension)/Resources/settings.js|css` and copies assets.

## Layout

```
Shared (Extension)/Resources/
  common/        shared, dependency-free core (storage, RPC, filters, bencode, i18n)
  background.js  service worker: message router, RPC orchestration, menus, badge
  content.js     link interception
  popup.*        task list + multi-file import dialog
  settings.*     built React settings app
  _locales/      en + zh-CN strings
Shared (App)/     macOS/iOS container app (glass chrome on 26+)
tests/            unit, integration and UI harnesses
docs/             architecture notes
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the data flow and message API.

## License

[MIT](LICENSE)
