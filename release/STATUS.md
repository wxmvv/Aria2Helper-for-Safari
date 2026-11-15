# 本地准备结果 — 2026-11-15

版本：**2.0.0（31）**。平台：**macOS、iOS / iPadOS**。

## 已完成

- 53 项单元/回归测试全部通过；设置页 ESLint 和正式构建通过。
- 四个原生 target 添加隐私清单及 `ITSAppUsesNonExemptEncryption=NO`，实际归档中已核对。
- 两个平台的 Release archive 成功，签名完整性、版本、内嵌资源与源码一致性检查通过。
- macOS 同时包含 arm64 / x86_64；iOS 真机为 arm64。
- Xcode 使用已有开发者账号完成 App Store 自动签名配置，并成功本地导出 IPA / PKG。
- 最终导出包的签名、App/Extension 权限、隐私清单、版本和内嵌扩展资源检查通过；没有启用调试附加权限。
- iOS 27.2 iPhone 17 模拟器验证最终启动页浅色、深色显示正常；移除了强制玻璃面板，使用系统背景和安全区域布局。
- 已准备中英文商店文案、更新说明、审核步骤、隐私政策更新稿和发布命令。

## 导出包与指纹

路径均相对仓库根目录：

| 平台 | 导出包 | SHA-256 |
| --- | --- | --- |
| iOS | `build/appstore/2.0.0-31/export-ios/Aira2Helper.ipa` | `7b67d45f9e010455ad60e5ed5685f5d6be582d593e5711143c7fca27b852d989` |
| macOS | `build/appstore/2.0.0-31/export-macos/Aira2Helper.pkg` | `dba0ac2fa4d31de72453c3d8ef0e6233de908e298761042655de10046205de67` |

机器可读记录保存在同目录的 `validation-*.json`、`export-validation-*.json`。重新导出后需重新运行 `release:verify-export` 并更新本表。

## Connect 准备完成

- macOS、iOS 2.0.0（31）均通过 Apple 处理，已关联到各自版本并保存。
- 两个平台均通过 Connect 必填资料检查；用户确认后，于2026-11-15香港时间13:16最终提交，当前均为「正在等待审核」。
- 中英文商店文案、18张Mac/iPhone/iPad截图、审核备注及新版指南ZIP均已填写/上传；新版年龄分级问卷完成，计算结果4+。
- 中英文隐私政策已发布并关联；现有审核联系人、工具分类、标准EULA及价格/地区设置沿用。
- 用户选择审核员自行配置引擎流程，不提供公网审核服务器。具体页面记录见 CONNECT-STATUS.md。

## 最后检查与限制

1. 用户已审阅确认并授权最终提交；现有发布方式为审核通过后自动发布。
2. 最终商店签名包尚无物理iPhone/iPad完整Safari下载联调记录；模拟器启动页与本地真实HTML截图不替代真机联调。
3. 审核员需要配置外部aria2引擎，Apple仍可能要求额外演示材料。

发布准备的代码和资料已提交为 `8a339a0`；README与预览图库在后续文档提交中更新。App Store Connect 填写进度由本次准备任务记录；以下为构建上传反馈。

## App Store Connect 构建上传 — 2026-11-15

- iOS：2.0.0（31）于香港时间 12:43:52 上传成功，Xcode 返回 `Upload succeeded`、`EXPORT SUCCEEDED`，服务器开始处理；处理完成，已在 Connect 选择并保存。
- macOS：2.0.0（31）于香港时间 12:45:37 上传成功，Xcode 返回 `Upload succeeded`、`EXPORT SUCCEEDED`，服务器开始处理；本次上传未因构建号被拒，后续处理结果与可选状态仍需在 Connect 核对。
- 使用 `xcodebuild -exportArchive`、`destination=upload` 和 Xcode 已登录账号；`manageAppVersionAndBuildNumber=false`。未读取账号凭据，未提交审核，未接受新法律协议。

## 隐私政策发布 — 2026-11-15

- 英文 2.0 隐私政策已发布至 [GitHub Wiki](https://github.com/wxmvv/Aria2Helper-for-Safari/wiki/Privacy-Policy)，主任务已验证页面；生效日期为 2026 年 11 月 15 日。
- 本地英文副本为 `release/PRIVACY-POLICY-DRAFT.md`（沿用文件名，正文已移除草稿占位）；中文对应文案为 `release/PRIVACY-POLICY-zh-Hans.md`，已发布至对应中文 Wiki 页面。
- 隐私联系邮箱保留既有公开地址 `w05172075@outlook.com`。

## macOS 处理错误 91109 修复 — 2026-11-15

- 首次 macOS 上传进入处理后被 Connect 拒绝：错误 91109，包内 `Contents/Resources/Icon.png` 带 `com.apple.quarantine` 扩展属性。此前上传成功仅表示传输成功，不表示处理通过。
- 已从 macOS 归档产物移除该属性并重新自动签名导出；未改源资源、系统安全设置或 iOS 成功构建。修复包版本仍为 2.0.0（31），上方 Mac SHA-256 已更新。
- 发布脚本现在在归档后及导出前仅清理产物的 quarantine 属性；归档验证与导出包展开验证均检查无隔离属性，导出自动运行签名、权限和资源一致性校验。
- 本地回归实验验证：能拒绝带属性的产物、清除文件及目录的隔离属性、保留其他属性与文件内容、重复清理可安全执行。归档和新导出包完整验证、release:check、脚本语法检查通过。
- 修复包 2.0.0（31）于香港时间 13:08:52 重传成功，Xcode 返回 `Upload succeeded` / `EXPORT SUCCEEDED`；服务器开始处理，未要求提升构建号。主任务已在 Connect 确认修复包处理完成并可选，关联保存后通过必填检查，进入可供审核草稿；未最终提交审核。

## 最终提交结果

2026-11-15香港时间13:16，iOS与macOS 2.0.0（31）均正式提交至App Review，页面确认已提交，侧栏状态均为“正在等待审核”。提交详情链接见 CONNECT-STATUS.md。
