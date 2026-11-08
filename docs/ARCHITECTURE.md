# Architecture

Aria2Helper 2.0 separates *policy* (what to download, how to store it) from *transport* (JSON-RPC) and
from *surfaces* (background, content script, popup, settings). The same core files run in every surface,
so a bug fixed in the extension is fixed in the settings app and in tests.

```
                     ┌──────────────────────────────┐
                     │ Shared (Extension)/Resources │
                     │  common/constants.js         │  catalogue, defaults, engine presets
                     │  common/util.js              │  bytes/time/progress formatting
                     │  common/files.js             │  names, extensions, URI lists
                     │  common/filters.js           │  interception + torrent selection
                     │  common/bencode.js           │  .torrent inspection
                     │  common/storage.js           │  schema, normalisation, migration
                     │  common/rpc.js               │  JSON-RPC client, errors, discovery
                     │  common/messaging.js         │  runtime/native message wrappers
                     │  common/i18n.js              │  i18n wrapper
                     └──────────────┬───────────────┘
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
  background.js                content.js                 popup.js / settings
  router + orchestration       link policy                views only
```

## Loading order

- **Content script** — `manifest.json` lists `common/constants.js` … `common/i18n.js` before `content.js`.
  Classic scripts share the isolated world, so `window.Aria2Helper` exists on first paint.
- **Background** — `importScripts(...)` at the top of `background.js`.
- **Popup** — classic `defer` scripts in `popup.html`, then `popup.js`.
- **Settings** — `settings/index.html` loads `/common/*.js`; React accesses the same objects through
  `settings/src/lib/core.js`. Vite copies the shared folder to `settings/public/common` before dev/build.

## Storage schema (version 2)

```
schemaVersion: 2
profiles: {
  <id>: { id, alias, rpcHost, rpcPort, rpcIshttps, rpcPath, rpcSecret, dir, header[], isDefault }
}
currentProfileId, defaultProfileId
settings: {
  showBadge, showNotification, listenDownloads,
  sendCookies, sendReferer,
  skipExtensions[],
  skipFilesInTorrent, confirmTorrentSelection,
  appearance: { liquidGlass },
  filterLists: { blacklist: {name, extensions[]}, whitelist: {name, extensions[]} }
}
device, themeColor
```

`storage.normalizeState()` is idempotent and runs on every read. A 1.x snapshot is upgraded in place:
ports become strings, `header` becomes an array, `rpcPath` is added, `schemaVersion` is written, and the
default/current profile ids are repaired. Nothing is deleted.

## Message API

Every message is `{ api, ... }`. The background replies with an envelope:

```json
{ "ok": true, "data": … }
{ "ok": false, "error": { "code": "ERPC", "message": "Unauthorized", "rpcCode": 1 } }
```

| API | Purpose |
| --- | --- |
| `state.get`, `settings.update`, `profile.save`, `profile.setDefault`, `listen.toggle` | local state |
| `engine.getVersion`, `engine.test`, `engine.discover` | engine capabilities and local probing |
| `downloads.list` | `tellActive` + `tellWaiting` + `tellStopped` + `getGlobalStat` via multicall |
| `downloads.pause/unpause/remove/removeResult/purgeResults` | task control |
| `downloads.addUri`, `downloads.addTorrent`, `downloads.addMetalink`, `downloads.addBatch` | adds |
| `torrent.inspect` | local bencode inspection (works without aria2) |
| `downloads.resolveFilename` | `aria2.probe` on aria2-next, URL basename otherwise |
| `native.selectFile`, `native.notify`, `native.themeColor` | Safari container bridge |

The listener always returns `true` (Safari may answer asynchronously) and converts every throw into an
error envelope. `common/messaging.js` accepts both the callback and promise shapes of
`browser.runtime.sendMessage`, so Safari and Chromium behave the same.

## RPC client

- Endpoint: `<http|https>://host:port/rpcPath` with IPv6 brackets, empty host/port rejected.
- Token: prepended once, never doubled; `system.multicall` passes the token **inside each entry** and
  not as an outer parameter.
- Timeout: `AbortController`, mapped to `ETIMEOUT`; network failures to `ENETWORK`; HTTP and malformed
  payloads to `EHTTP` / `EBADRESPONSE`; JSON-RPC errors keep aria2's numeric code in `rpcCode`.
- `multicall` falls back to sequential calls when the engine answers `-32601` / "Method not found".
- Engine detection reads `product`, `enabledFeatures`, `mediaFeatures` and `downloadFeatures`.
  `aria2-next` is recognised by `product`; `supportsProbe` requires the `filename-hints` download feature.

## Link interception

`filters.decideInterception(url, settings)` order:

1. `skipExtensions` → never intercept.
2. `whitelist` (if the extension is listed) → intercept.
3. `blacklist` → do not intercept.
4. built-in catalogue (video/audio/picture/document/application/archive/others) → intercept.
5. otherwise → let Safari handle the click.

The content script only calls `preventDefault()` for a positive decision, sends the referer/cookie with
an 8 s timeout, and replays the original link behaviour when aria2 cannot be reached. Modified clicks
(⌘/⌃/⌥/⇧), `javascript:`/`mailto:`/`data:` links, buttons inside links and `data-aria2helper-ignore`
anchors are left alone.

## Torrent file selection

`bencode.parseTorrent()` returns files with **1-based** indexes. `filters.selectTorrentFiles()` removes
skipped extensions and `filters.compactIndexList()` produces aria2's `select-file` syntax (`1-3,7`).
The popup renders the list, lets the user toggle files, and only sends `select-file` when a subset is
chosen. Magnet links have no file list until metadata arrives, so they are added unselected.

## aria2-next specifics

- `totalLength` is `"0"` for HLS/DASH tasks; progress comes from `media.progress` and the size from
  `media.downloadedLength`. `util.progressPercent()` handles this, and the popup shows a LIVE marker.
- `aria2.probe` returns status/finalUrl/contentType/totalLength/resumable; a filename may be absent, so
  `downloads.resolveFilename` falls back to the final URL's basename.
- `aria2.inspectTorrent` exists, but local bencode parsing is used so classic aria2 gets the same UI.
- Optional ED2K fields (`ed2k.length`, `ed2k.completedLength`) feed the same progress helpers.

## Liquid Glass

- **Web surfaces** use layered translucency, specular borders and `backdrop-filter`, gated by a setting.
  `prefers-reduced-transparency: reduce` and `prefers-contrast: more` replace the glass with opaque
  surfaces; `@supports not (backdrop-filter: …)` is a flat fallback.
- **Container app** wraps the WebView in `NSGlassEffectView` (macOS 26+) or
  `UIGlassEffect`/`UIVisualEffectView` (iOS 26+), with `effectIsInteractive` on macOS 27. Older systems
  keep the plain WebView. The macOS window becomes non-opaque so the material has something to blur.

## Testing

- `tests/unit` loads the classic core files into a `vm` context and covers formatting, extensions,
  filters, bencode, storage migration and RPC (mock fetch: success, RPC error, timeout, multicall,
  fallback, discovery).
- `tests/integration` talks to a real engine selected by `ARIA2_RPC`/`ARIA2_SECRET`: version, a full
  download, multicall list and aria2-next probe.
- `tests/ui` serves the real popup/settings HTML with a mocked `browser` API, takes a state matrix of
  screenshots, and runs the onboarding wizard against a live engine.

## Adding a new file-type

Add it to `common/constants.js` (`CATALOG`). The settings screen imports the same catalogue from the
shared core, so the list and the interception policy cannot drift apart.
