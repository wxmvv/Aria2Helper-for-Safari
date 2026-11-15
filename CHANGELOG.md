# Changelog

## 2.0.0 — 2026-11-08

### Added

- Shared core (`common/`) used by the background, content script, popup and settings app.
- aria2-next 3.x detection and support: `aria2.probe` filename resolution, media/ED2K progress fields,
  structured engine capabilities. Classic aria2 1.3x keeps working through the same client.
- Multi-file import: choose or drop several torrents/metalinks, paste many links at once, per-file
  results and a queue that adds up to three tasks concurrently.
- Local torrent inspection and `select-file` based file skipping.
- "Never send these file types" skip list, plus skip-inside-torrents and a review-before-adding option.
- Three-step connection wizard with local engine discovery, RPC URL paste, test connection, and
  Homebrew/Rayburst instructions.
- Experimental Liquid Glass-inspired popup and settings surfaces, with Reduce Transparency /
  Increase Contrast fallbacks. Both new appearance options are off by default.
- Privacy toggles for forwarding page cookies and referer.
- Unit, integration and UI tests; screenshot harness; documentation.

### Changed

- Storage schema is versioned and migrated in place from 1.x (no profile or settings loss).
- Every background message now returns `{ok, data}` / `{ok:false, error}`; the popup no longer crashes on
  a missing profile or an offline engine.
- Popup polling backs off when the engine is offline and pauses when the popup is hidden.
- Settings version is read from the manifest instead of being hardcoded.
- The settings build now copies assets with a Node script instead of `mv` (which failed when
  `Resources/assets` already existed).

### Fixed

- `aria2.pauseAll` was wired to `aria2.forcePauseAll`; `forcePauseAll` is now its own action.
- The generic method handler used an undeclared `method` variable.
- A page cookie replaced all configured `header` entries instead of being merged.
- `aria2.unpauseAll` received a malformed token/cookie parameter.
- Torrent import only accepted one file and silently ignored extra selections.
- `system.multicall` was sent with an extra outer token; aria2 rejected it on some engines.
- Popup crashed when `totalLength` was `0` (aria2-next media tasks) or when response shapes differed.

### Release preparation (2026-11-15)

- Added explicit privacy manifests and encryption export metadata for all four native targets.
- Added App Store archive, export and artifact verification commands and bilingual metadata drafts.
- Made bundled settings resources relative to the extension page.
- Replaced forced iOS launcher glass with a standard system background and safe-area layout,
  matching the macOS launcher fix.
