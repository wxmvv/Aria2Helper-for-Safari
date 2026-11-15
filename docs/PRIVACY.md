# Privacy Policy — Aria2 Helper

**English** · [简体中文](PRIVACY_CN.md) · [Back to README](../README.md)

Version 2.0.0 · Effective date: 15 November 2026.

Aria2 Helper is a Safari extension that connects to an aria2-compatible download engine selected by you. The developer does not operate an analytics, advertising, tracking, or download backend for this app and does not collect app usage data through such a service.

## Information stored on your device

RPC host addresses, ports, secrets, connection names, download options, and extension preferences are stored in the extension's local browser storage. Secrets are not stored in a separate encrypted credential vault. The app does not sync these settings through a developer-operated cloud service.

## Information sent to your download engine

To perform the actions you request, the extension sends download URLs, selected torrent or Metalink contents, task options, and authenticated JSON-RPC requests to the engine you configure. Your RPC secret is included in requests for authentication.

When page cookie and referer forwarding are enabled, the relevant page context is also sent to that engine as download options. Both forwarding options are currently on by default and can be turned off in Helper Settings. These values may then be sent by your engine to download servers as request headers. The engine and target websites have their own privacy practices; only configure engines and download sources you trust. Use HTTPS when connecting over an untrusted network.

The extension reads download task information from your engine to show filenames, paths, progress, and errors. It does not send this information to a developer-operated server. You control where the engine stores downloaded files; removing the extension does not remove downloads or records held by that engine.

## Website access and local processing

With the website permissions you grant, the extension can inspect link clicks and page context to decide whether a download should be sent to your engine. It does not maintain a browsing-history database for the developer. Torrent file lists are parsed locally to support file selection. Browser and operating-system permissions remain under your control.

## Third-party services

The app does not include advertising or analytics SDKs. Websites, engines, GitHub support pages, and Apple's platform services operate under their own policies. Information you voluntarily send in a support request is handled through the support channel you choose; do not include RPC secrets, cookies, or private download links in public issues.

## Controls and deletion

You can turn off automatic interception, cookie forwarding, and referer forwarding; remove configured connections; revoke Safari website permissions; or disable the extension. To remove remaining preferences, clear the extension's local data using the browser/platform's available removal controls. Records and downloads on your engine must be deleted there separately.

## Contact and updates

For support, use https://github.com/wxmvv/Aria2Helper-for-Safari/issues . For private privacy questions, contact w05172075@outlook.com.

Material changes to this policy should be published on the privacy-policy page with an updated effective date.
