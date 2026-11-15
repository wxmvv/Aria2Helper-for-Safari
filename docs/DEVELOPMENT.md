# 开发与调试

## 环境与项目结构

- Node.js 22+、npm；首次拉取后在项目根目录运行 `npm run setup`（使用 settings/package-lock.json 安装依赖）。
- 原生构建需要完整 Xcode 和对应平台 SDK。当前 Swift 代码使用系统 26 的玻璃 API，安装 Xcode 26 或更新版本；旧系统走运行时兼容分支。
- `settings/src/` 是 React 设置页源码；不要直接修改扩展目录中的 `settings.js`、`settings.css`、`settings.html`，它们是构建产物。
- `Shared (Extension)/Resources/common/` 是共享核心代码的唯一来源；`settings/public/common/` 是构建时同步的副本。
- `Shared (Extension)/Resources/popup.*`、`background.js`、`content.js` 是扩展入口；`Shared (App)/` 是原生容器，平台目录保存各平台配置与入口。
- 新的命令行原生构建统一放在 `build/debug/`。已有 `build-*` 目录是本地历史产物，已被 Git 忽略，可在不需要时自行删除。

## 常用命令

在仓库根目录运行：

| 命令 | 用途 |
| --- | --- |
| `npm run setup` | 按 lockfile 安装设置页依赖 |
| `npm run dev` | 设置页 Vite 热更新，固定监听 127.0.0.1:5173 |
| `npm run dev:ui` | 扩展 popup / 已构建 settings 静态模拟环境，127.0.0.1:8123 |
| `npm run build:debug` | 设置页非压缩构建，内嵌源码映射，同步至扩展资源 |
| `npm run debug:macos` | 先构建 Debug 设置页，再构建本地临时签名的 macOS Debug App |
| `npm run build:settings` | 正式设置页构建，压缩且不包含源码映射 |
| `npm test` | 无需 aria2 的核心单元测试 |
| `npm run lint:settings` | 设置页 ESLint 检查 |
| `npm run test:integration` | 真实 aria2 联调，使用 ARIA2_RPC / ARIA2_SECRET 环境变量 |

## 设置页热更新与断点

```sh
npm run dev
```

打开 <http://127.0.0.1:5173/?lang=zh-CN&seed=configured>。
Vite 仅在开发服务器中注入 `tests/ui/mock.js` 和语言包，普通浏览器即可使用设置页。
React 修改会热更新；共享 core、语言包、mock 修改会刷新页面，不必手工复制文件。
开发服务端口占用时会报错，避免断点连接到错误端口。

- `?seed=empty&lang=zh-CN`：未配置状态 / 首次引导。
- `?seed=configured&lang=en`：已配置状态 / 英文。
- `&glass=0&bg=0`：关闭玻璃与背景的模拟场景。

模拟 storage 只保存在当前页面内存中，刷新即重置。模拟消息展示固定任务数据；
mock 不执行真实后台或原生操作。设置页中直接使用 RPC 的扫描/连接测试仍可能访问本机引擎。
实际下载拦截、后台消息及原生桥接需在 Safari 中验证。

浏览器开发者工具可以直接在 `settings/src/` 下设置 JSX 断点。
使用 VS Code 时选择 **Settings: Chrome** 并按 F5，会启动 Vite 和 Chrome 调试器；
结束调试后可通过“终止任务”关闭开发服务器。

## Popup 与构建产物预览

```sh
npm run build:debug
npm run dev:ui
```

打开 <http://127.0.0.1:8123/popup.html> 或
<http://127.0.0.1:8123/settings.html?seed=empty&lang=zh-CN>。
该环境同样使用模拟浏览器 API；popup 修改后手动刷新，设置页修改后重新构建并刷新。
`PORT=8124 npm run dev:ui` 可以更换静态预览端口。

## macOS / Safari 调试

```sh
npm run debug:macos
open build/debug/Build/Products/Debug/Aira2Helper.app
```

命令行使用 ad-hoc 临时签名，无需个人开发证书；这不是分发签名。
Safari 若拒绝本地扩展，先在 Safari 设置中开启开发者功能，
再在“开发”菜单启用允许未签名扩展，并在“设置 → 扩展”启用 Aria2Helper。
该开关可能需要每次 Safari 重启后重新启用。菜单措辞随 Safari 版本变化。

- **设置页 / popup**：打开对应扩展页面，再从 Safari“开发”菜单选择该页面的 Web Inspector。popup 需保持打开。
- **后台**：从“开发 → Web 扩展后台内容”选择 Aria2Helper，检查 `background.js` 的断点、Console 和 Network。
- **内容脚本**：检查被拦截网页，在 Inspector 的资源/脚本中选择扩展的 `content.js` 和对应执行上下文。
- **原生容器**：`open Aira2Helper.xcodeproj`，选择共享的 `Aira2Helper (macOS)` scheme，Run 使用 Debug。先执行 `npm run build:debug`，再 ⌘R；修改 React 后也需要重新打包设置页并重建 App。Swift 断点在 Xcode 中设置。
- **原生扩展处理器**：在 Xcode 使用“Debug → Attach to Process”附加扩展进程，再触发 `SafariWebExtensionHandler.swift` 中的消息处理。

Debug 构建保留 Swift 符号并禁用优化；容器的 WKWebView 在受支持系统上开启 `isInspectable`，
可从 Safari 开发菜单检查容器页面。Release 不开启该选项。
设置页 Debug 包使用内嵌 source map，避免额外映射文件遗漏出包。
真实扩展使用现有 bundle ID，可能与已安装版本共享配置；调试前留意现有 RPC 配置。

## iOS 调试

先运行 `npm run build:debug`，打开 Xcode，选择共享的 `Aira2Helper (iOS)` scheme 和模拟器，⌘R。
真机需在 App 和 Extension 两个 target 配置可用的开发团队/签名，启用设备开发者模式。
在 iOS Safari 设置中启用扩展与所需网站权限。真机 Web 调试还需开启 Safari 的 Web Inspector，
连接并信任 Mac 后，从 Mac Safari 的开发菜单选择设备及扩展页面。
模拟浏览器无法替代这些平台验证。

## 提交与发布前

Debug 设置页构建会覆盖仓库中现有的生成文件；不要提交大型 Debug bundle。
提交或归档前运行 `npm run build:settings` 恢复正式产物，再检查 `git diff`，运行单元测试和 lint。
Xcode 的 Profile / Archive 使用 Release，但不会自动重新打包 React，必须先执行正式设置页构建。
开发服务器的模拟代码只用于 `vite serve`，两种打包模式都不包含它。
