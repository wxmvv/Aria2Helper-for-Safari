# App Store 截图制作

使用当前 2.0 UI 的实际截图作为输入，程序只负责品牌底色、标题、说明与排版，不重新绘制产品界面。

```sh
# 1. 填写并审核 inputs.json（可从 inputs.example.json 复制）
# 2. 生成 18 张 SVG 与 JPEG；需要本机 ImageMagick
node release/store-assets/compose.mjs release/store-assets/inputs.json
```

默认输出位于 `build/store-assets/rendered/{macos,ios,ipados}/{en-US,zh-Hans}/`。
`preview.html` 可浏览全部成片。每张图同时保存 SVG 方便后续调整排版；上传使用 JPEG。

设计说明见 DESIGN.md。INPUTS/输出报告保留原始图 SHA-256 与来源记录，便于确定截图对应的产品版本。

## 本次实拍来源与限制

2026-11-15 使用 CUA 控制独立 Safari，打开 `tests/ui/serve.mjs` 提供的当前 2.0.0 产品 HTML；浏览器 API 使用项目已有 mock，无真实 RPC 或下载。任务速度、文件及导入链接均为示例，成片底部明确标注。`inputs.json` 保存裁切坐标，生成报告保存输入 SHA-256。

macOS 第三张为实际配置引导；iPhone/iPad 第三张使用同一产品的真实 RPC 配置表单局部，避免出现 macOS 窗钮、Homebrew 命令及扫描本机引擎。移动尺寸截图展示扩展内容，未伪造设备外壳或系统状态栏。上传前仍需人工查看整组图片。

发现的后续产品问题：`settings/src/tabs/WelcomeTab.jsx` 的 Homebrew、启动命令及本机扫描说明未按 iOS/macOS 区分；`settings/src/App.jsx` 的 TrafficLight 按屏幕宽度而非平台显示。本轮资产未修改已构建产品代码。

## 输出清单

每个平台与语言各三张：`01-tasks.jpg`、`02-import.jpg`、`03-setup.jpg`。共 18 张 JPEG（RGB、无 alpha）：macOS 2880×1800、iPhone 1206×2622、iPad 2064×2752。`build/store-assets/rendered/preview.html` 为审阅页；SVG 是可编辑排版，不用于 App Store 上传。

## 重新取图

先执行 `node release/store-assets/prepare-capture.mjs`，再从仓库根目录执行 `node build/store-assets/serve.mjs`。它只在 build 目录生成截图专用 mock，任务名称为中性的个人文件示例。生产代码与既有测试 fixture 不变。浏览器内通过真实 RPC 表单将 Alias、RPC Host、Port 改为 `Home aria2`、`192.168.1.100`、`6800`，不要点测试连接。中文标题使用系统 Hiragino Sans GB W6 粗体；本机无 PingFang 字体文件。生成器临时提取的字体仅在忽略的 build 输出中使用，不随素材源码分发。
