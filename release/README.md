# App Store 提交准备：2.0.0（31）

目标：macOS、iOS / iPadOS。沿用现有 App 记录和 bundle ID；两平台2.0.0（31）已上传；线上填写与处理结果见 [CONNECT-STATUS.md](CONNECT-STATUS.md)。用户检查确认后已提交审核，两个平台均正在等待审核。

## 本地发布命令

```sh
npm run setup
npm test
npm run lint:settings
npm run build:settings
npm run release:check

npm run release:archive -- ios
npm run release:verify -- ios
npm run release:archive -- macos
npm run release:verify -- macos

# 使用已安装的 App Store 分发证书和描述文件导出，不上传
npm run release:export -- ios
npm run release:export -- macos
npm run release:verify-export -- ios
npm run release:verify-export -- macos

# 如需 Xcode 使用已登录账号解析/更新自动签名配置
npm run release:export -- ios --allow-provisioning-updates
npm run release:export -- macos --allow-provisioning-updates
```

两个 archive 命令会分别重建并同步正式设置页资源，请依次运行。发布资源使用相对路径，不包含 Vite 开发脚本、模拟浏览器 API或 source map。更改源码后重新归档并导出，再运行 verify，避免上传旧产物。

`release:check` 检查 JS/原生版本号、四个 target 的 build 号和隐私清单、出口加密标记、正式 HTML 引用、调试资源残留及商店文案长度。`release:verify` 进一步检查实际 archive 内 App/Extension 的版本、隐私清单、架构、签名完整性，并与当前扩展源码逐文件比对。`release:verify-export` 检查实际 IPA/PKG 的版本、内嵌资源、签名和调试权限，并生成 SHA-256 记录。上述检查不等同于 Apple 服务端上传验证。

## 产物

归档和导出位于 `build/appstore/2.0.0-31/`，由 Git 忽略：

- `Aira2Helper-macOS.xcarchive`：macOS Release 归档，arm64 + x86_64。
- `Aira2Helper-iOS.xcarchive`：iOS 真机 Release 归档，arm64。
- `export-macos/Aira2Helper.pkg`：App Store 分发导出的 macOS 安装包。
- `export-ios/Aira2Helper.ipa`：App Store 分发导出的 iOS 包。
- `validation-macos.json`、`validation-ios.json`：本地归档核对记录，包含源提交和是否有未提交改动。
- `smoke-iphone-final.png`：模拟器真实启动页检查记录；正式商店截图仍需展示 Safari 内的主要功能。

归档可保留开发签名，导出阶段由 Xcode 重签为 App Store 分发签名。`ExportOptions.plist` 固定 `destination=export`，没有自动上传或提交审核的步骤，也不让 Xcode 自动变更 build 号。

## 版本与配置

- App Store 名称：沿用 **Aria2 Helper**；内部产品名 **Aira2Helper** 和 bundle ID 不改名。
- App bundle ID：`cc.wxmvv.Aira2Helper`。
- Extension bundle ID：`cc.wxmvv.Aira2Helper.Extension`。
- Developer Team：`DSHX4V92NH`。
- 原生版本、扩展 manifest、两个 package 均为 `2.0.0`；原生 build 为 `31`。
- 最低系统：macOS 12、iOS/iPadOS 15；发布使用当前完整 Xcode SDK。
- 两个实验性外观选项首次默认关闭；自动下载拦截首次默认关闭。
- `ITSAppUsesNonExemptEncryption=NO`：基于当前代码只使用系统 HTTP/HTTPS，不实现或捆绑自定义加密。后续加入加密 SDK 时须重新评估。
- 四个 target 各自包含 `PrivacyInfo.xcprivacy`。当前不含广告/统计 SDK，不跟踪、不向开发者后台收集数据；代码检查未发现直接使用需要申报理由的原生 API。`browser.storage.local` 和网页 localStorage 属于当前 WebKit/浏览器存储路径，不能据此虚构原生 UserDefaults API 用途。

## 商店资料

- `metadata/en-US.json`、`metadata/zh-Hans.json`：名称、副标题、关键词、推广文本、描述和更新说明，已填入 Connect。
- `REVIEW-NOTES.md`：两个平台的审核步骤、aria2 环境说明与审核员自行配置引擎流程；保留 Connect 已有审核联系人。
- `PRIVACY-POLICY-DRAFT.md`、`PRIVACY-POLICY-zh-Hans.md`：已发布中英文隐私政策副本。
- `store-assets/`：18张新截图的生成器、标题文案与来源清单；成片在 `build/store-assets/rendered/`。
- `review-guide/Aria2Helper-2.0-Review-Guide.zip`：已附到两个平台审核资料的新指南与小型测试样例。

现有商店记录：<https://apps.apple.com/us/app/aria2-helper/id6742623503>。
现有公开隐私政策 URL：<https://github.com/wxmvv/Aria2Helper-for-Safari/wiki/Privacy-Policy>（已确认可访问）。

公开政策已更新，明确说明 RPC 请求会发送到用户配置的引擎；开启转发时 Cookie、Referer 会作为下载选项发送到引擎，并可能由引擎发送到目标站点。当前这两个转发选项默认开启。Connect 保留开发者“未收集数据”的声明。

## 截图计划与手工验收

正式素材从 Safari 中使用实际扩展的画面获取。至少包括：任务列表、批量导入/种子文件选择、RPC 配置与连接测试；保证没有真实密钥、Cookie、个人路径或私有下载链接出现在截图中。

| 平台 | 建议规格 | 内容 |
| --- | --- | --- |
| Mac | 1280×800 或 Apple 当前列表内其他 16:10 尺寸 | Safari 中的任务 popup、设置页、文件导入 |
| iPhone | Dynamic Island 中等显示屏；当前 iPhone 17 模拟器为 1206×2622 | Safari 扩展菜单/任务页、RPC 设置 |
| iPad | 13 英寸；例如 2064×2752 或 Apple 当前列表内的受支持尺寸 | Safari 中的任务页及设置页 |

正式图片使用不带透明通道的 PNG/JPEG。每种必需尺寸至少 1 张；新素材上传时按 Apple 当前规范核对尺寸。

提交前在实际 Safari 中验证：首次启用和网站权限、配置经典 aria2、真实下载、暂停/继续/移除、种子/Metalink 导入、同名文件失败重试、引擎离线回退，以及关闭 Cookie/Referer 转发。iOS 使用设备可访问的远程/LAN 引擎，不能把 Mac 的 127.0.0.1 直接用在手机上。模拟器启动检查不替代真机 Safari 联调。

## App Store Connect 提交流程（实际进度见 CONNECT-STATUS.md）

1. 在既有 App 的 macOS、iOS 平台创建/选择 2.0.0 版本，确认版本号和 build 31 未被使用。
2. 更新公开隐私政策，核对 App Privacy、年龄分级和加密回答；核对付费协议、税务及适用地区的商家/备案信息。
3. 审阅并填入中英文商店文案、技术支持 URL、审核联系人和截图。
4. 在 Review Notes 明确需单独运行 aria2；决定让审核人员按说明自建引擎，（用户已选择此流程）。不要在公开资料填写真实 RPC 密钥。
5. 用 Xcode Organizer 或 Transporter 上传正式 `.pkg` / `.ipa`；等待 Apple 处理、服务器校验通过并选择构建。
6. 选择发布方式（建议先手动发布，便于两平台一致检查），最后提交审核。

## Apple 官方参考（2026-11-15 核对）

- SDK 上传要求：<https://developer.apple.com/news/upcoming-requirements/>
- 截图尺寸与透明通道要求：<https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications>
- 隐私清单：<https://developer.apple.com/documentation/bundleresources/adding-a-privacy-manifest-to-your-app-or-third-party-sdk>
- 加密标记：<https://developer.apple.com/documentation/bundleresources/information-property-list/itsappusesnonexemptencryption>
- App Review Guidelines：<https://developer.apple.com/app-store/review/guidelines/>
