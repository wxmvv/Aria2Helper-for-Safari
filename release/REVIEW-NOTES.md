# App Review notes — 2.0.0 (31)

用户已确认不提供公网引擎，采用审核员自行配置流程。下方英文区块可分别复制到对应平台的审核备注。保留 Connect 现有有效审核联系人，不填写虚构 App 登录账号。两个平台均附 `review-guide/Aria2Helper-2.0-Review-Guide.zip`。配置外部引擎依赖审核环境，审核员仍可能要求补充演示材料。

## macOS — copyable notes

Aria2 Helper is a Safari web extension for managing a user-configured aria2 JSON-RPC engine. Task management and connection settings are inside Safari; the containing app helps enable the extension. There is no app account, subscription, bundled engine, hosted download service or content catalogue. No app sign-in is required.

The developer does not provide a public review engine. Please run aria2 on the review Mac. If Homebrew is already installed: brew install aria2. See https://aria2.github.io/ for other trusted installation options.

For an isolated local test, run these Terminal commands and keep aria2 running:
REVIEW_RPC_SECRET="$(openssl rand -hex 24)"
printf 'RPC secret: %s\n' "$REVIEW_RPC_SECRET"
aria2c --no-conf=true --enable-rpc=true --rpc-listen-all=false --rpc-listen-port=6800 --rpc-allow-origin-all=true --rpc-secret="$REVIEW_RPC_SECRET" --max-download-limit=1K --dir="$(mktemp -d /tmp/aria2helper-review.XXXXXX)"

This listens only on the review Mac. The secret is generated locally; it is not an existing developer account credential. Stop the engine with Control-C after testing.

1. Open Aria2 Helper, open Safari Settings > Extensions and enable the extension. Grant access to the test website.
2. Open the extension from Safari’s toolbar and open settings. In Get started, choose aria2, enter host 127.0.0.1, port 6800 and the printed secret (HTTPS off for this loopback test). Test the connection and save it.
3. Test URL (official aria2 README, approximately 22 KB):
https://raw.githubusercontent.com/aria2/aria2/9e7273583f83e881e3ec067b523ba88724088d2f/README.rst

Add the URL in the extension popup. Observe progress; pause/resume or remove while active, or inspect the completed task. The suggested 1 KiB/s engine limit leaves time for task actions. The attached Aria2Helper-2.0-Review-Guide.zip includes a complete offline-readable HTML guide, a Metalink sample for this file and a two-file torrent fixture for local file-list selection only. Inspect the torrent then cancel; it has no tracker or seed and is not a download-completion test.

Automatic webpage link interception is off by default. Enable “Intercept download links” in Helper Settings to test supported direct links. Cookie and referer forwarding can be disabled independently. Liquid Glass surfaces and popup background tint are experimental, off by default and unnecessary for normal use. The developer operates no analytics, tracking or download backend for this app.

Downloads are saved on the engine Mac in the temporary directory created above. Reveal in Finder is available when the engine is local to the Mac.

## iOS / iPadOS — copyable notes

Aria2 Helper is a Safari web extension for managing a user-configured aria2 JSON-RPC engine. Task management and connection settings are inside Safari; the containing app helps enable the extension. There is no app account, subscription, bundled engine, hosted download service or content catalogue. No app sign-in is required.

The developer does not provide a public review engine. Please run aria2 on a review Mac/computer reachable from the iPhone or iPad over a trusted, isolated LAN. Both devices must be allowed to communicate. Downloads are saved on that computer, not directly in the iOS Files app.

If Homebrew is already installed on the Mac: brew install aria2. Then run:
REVIEW_RPC_SECRET="$(openssl rand -hex 24)"
printf 'RPC secret: %s\n' "$REVIEW_RPC_SECRET"
aria2c --no-conf=true --enable-rpc=true --rpc-listen-all=true --rpc-listen-port=6800 --rpc-allow-origin-all=true --rpc-secret="$REVIEW_RPC_SECRET" --max-download-limit=1K --dir="$(mktemp -d /tmp/aria2helper-review.XXXXXX)"

The secret is generated locally. Use this only on the isolated review LAN with narrowly permitted firewall access; do not expose it to the public Internet or set router port forwarding. Stop the engine with Control-C after testing. See https://aria2.github.io/ for trusted installation options.

1. In Settings > Apps > Safari > Extensions, enable Aria2 Helper and grant access to the test website. On older OS versions, Safari may appear directly in Settings.
2. In Safari, open Aria2 Helper from the extensions/page menu, then its settings. In Get started, choose aria2 and enter the engine computer’s LAN address, port 6800 and the printed secret (HTTPS off only for this isolated trusted-LAN test). Test and save. Use the same profile as the default connection.
3. 127.0.0.1 on the phone/tablet refers to that device, not the engine Mac. The built-in installation command is for the engine Mac; iOS does not run it. Existing profiles can be edited under Aria2 Settings.
4. Test URL (official aria2 README, approximately 22 KB):
https://raw.githubusercontent.com/aria2/aria2/9e7273583f83e881e3ec067b523ba88724088d2f/README.rst

Add the URL in the extension popup. Observe progress; pause/resume or remove while active, or inspect the completed task. The suggested 1 KiB/s engine limit leaves time for task actions. The attached Aria2Helper-2.0-Review-Guide.zip includes a complete offline-readable HTML guide, a Metalink sample for this file and a two-file torrent fixture for local file-list selection only. Inspect the torrent then cancel; it has no tracker or seed and is not a download-completion test.

Automatic webpage link interception is off by default. Enable “Intercept download links” in Helper Settings to test supported direct links. Cookie and referer forwarding can be disabled independently. Liquid Glass surfaces and popup background tint are experimental, off by default and unnecessary for normal use. The developer operates no analytics, tracking or download backend for this app.

Reveal in Finder is a macOS-only feature. Use HTTPS for engine connections across an untrusted network.
