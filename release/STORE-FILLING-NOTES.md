# App Store Connect 填写说明 — 2.0.0 (31)

本文件是填写记录与待办，不作为商店公开文案。两个平台使用版本 2.0.0、构建号 31。App Store 名称沿用 **Aria2 Helper**，App ID 为 6742623503。文案源文件为 `metadata/en-US.json` 与 `metadata/zh-Hans.json`。

## 字段对应

| 本地 JSON 字段 | App Store Connect 字段 | 填写位置 |
| --- | --- | --- |
| name | Name / 名称 | App Information 的对应语言 |
| subtitle | Subtitle / 副标题 | App Information 的对应语言 |
| promotionalText | Promotional Text / 宣传文本 | 各平台 2.0.0 版本页面的对应语言 |
| description | Description / 描述 | 各平台 2.0.0 版本页面的对应语言 |
| keywords | Keywords / 关键词 | 各平台 2.0.0 版本页面的对应语言 |
| whatsNew | What's New in This Version / 此版本的新增内容 | 各平台 2.0.0 版本页面的对应语言 |
| supportURL | Support URL / 技术支持网址 | 各平台对应语言 |
| marketingURL | Marketing URL / 营销网址 | 各平台对应语言，可选 |
| privacyPolicyURL | Privacy Policy URL / 隐私政策网址 | App Privacy 对应语言 |

审核备注使用 `REVIEW-NOTES.md` 中对应平台的英文区块。App 本身没有账号，因此不应填写虚构的 App 登录账号；RPC 地址和密钥是外部引擎配置，与 App 登录不同。

## 文案原则

- 使用前需要另行运行 aria2 兼容引擎；应用不内置引擎，也不提供下载服务或资源。
- iPhone/iPad 连接另一台电脑或服务器上的引擎；下载保存在引擎所在设备，127.0.0.1 不是另一台电脑的地址。
- 自动拦截默认关闭。Cookie 与 Referer 转发可单独控制，不宣称它们默认关闭。
- 两个实验外观选项默认关闭，不影响核心功能；不将其作为所有设备都支持的系统效果承诺。
- Finder 定位仅用于 Mac 上的本机引擎。
- 不宣称所有链接都能被自动拦截，不承诺绕过网站鉴权、付费或访问限制。

## 提交前仍需真实信息或实测结果

1. **审核联系人**：保留 Connect 中有效的真实姓名、电话和邮箱；缺失时由开发者提供，不从仓库身份信息推断。
2. **审核引擎方案已确认**：用户选择不提供公网引擎，采用审核员自行配置流程。`REVIEW-NOTES.md` 分别提供 Mac loopback 和 iOS/iPadOS 可信隔离局域网步骤，附 `review-guide/Aria2Helper-2.0-Review-Guide.zip`。旧版公网 RPC 不再引用。该方案依赖审核环境，审核员仍可能要求可用演示环境或进一步材料。
3. **最终分发包实测**：Safari 实际启用、网站权限、连接引擎、真实下载、任务操作、文件导入，以及 iPhone/iPad 真机流程需记录实际结果。构建通过与模拟器截图不能替代这些结果。
4. **隐私与网址**：确认公开隐私政策与当前版本一致且能访问。应用没有开发者运营的遥测或下载后端，但配置的引擎会接收下载地址、任务文件，以及用户允许转发的 Cookie/Referer；不能据此写成“所有数据仅在设备本地处理”。App Privacy 的答案需按实际数据接收方和 Apple 的字段定义核对。
5. **其他已有声明**：在 Connect 核对内容权利、年龄分级、加密合规、价格与上架地区等真实情况，保留正确的现有信息；不要仅从文案推断。
6. **截图**：使用当前 2.0 界面和可重复的示例任务；不得把绘制的页面冒充真实产品截图，不展示真实 RPC 密钥或个人 Cookie。按 Connect 当前要求上传对应设备尺寸。
7. **最终提交**：填写与上传完成后汇总页面、截图、构建和待解决项供用户检查，再执行最终提交审核。

## 长度检查

执行 `npm run release:check` 验证元数据。名称与副标题各不超过 30 字符，宣传文本不超过 170 字符，描述和更新说明各不超过 4000 字符；关键词按 UTF-8 不超过 100 字节作保守检查。具体计数见准备任务的验证输出。

## 审核附件

`review-guide/Aria2Helper-2.0-Review-Guide.zip` 包含英文 HTML 指南、官方 aria2 README 的小型 Metalink 样例，以及仅供本地多文件选择验证的 torrent（无 tracker/seed，查看后取消）。公开小文件链接已返回 HTTP 200（22,434 字节）；未连接旧版测试服务器，未下载大文件，附件不包含私有凭据或审核联系人。指南无外部脚本或字体依赖。
