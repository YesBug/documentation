# MaxAPI Mintlify 文档

MaxAPI 中英文开发者文档。中文与英文分别位于 `zh/` 和 `en/`，由 Mintlify 原生语言导航切换。API 页面使用 OpenAPI 生成参数、请求示例和在线调试面板。

本目录是独立的 Mintlify 内容项目。相邻的 `maxapi-docs/` 为迁移前的 Next.js / Fumadocs / Scalar 项目，不参与此目录的预览构建。

## 本地预览

需要 Node.js 20.17.0 或更新版本，并安装当前 Mintlify CLI：

```bash
node --version
npm install -g mint
mint --version
```

在包含 `docs.json` 的本目录运行：

```bash
mint dev --no-open
```

默认预览地址为 `http://localhost:3000`。如果旧项目占用了该端口，选择另一个端口：

```bash
mint dev --port 3001 --no-open
```

打开 `/zh/index` 查看中文首页，打开 `/en/index` 查看英文首页。检查语言切换、侧栏、深色模式、API 参数与文件选择控件。

## 内容结构

| 位置 | 用途 |
| --- | --- |
| `docs.json` | 主题、导航、语言、品牌与调试配置 |
| `zh/` | 中文指南与 API 页面 |
| `en/` | 与中文对应的英文内容 |
| `openapi/zh.json` | 中文 OpenAPI 说明 |
| `openapi/en.json` | 英文 OpenAPI 说明 |
| `images/` | SVG Logo 与站点图标 |
| `.mintlify/product-brief.md` | 编辑时核对的产品定位与内容边界 |
| `AGENTS.md` | 自动化编辑与验证规则 |

常用 API 参考覆盖 9 个操作。扩展接口目录保留来源中的 173 条结构记录，用于核对协议；目录数量不代表全部路由已开通或经过实调。

## 编辑与验证

1. 先阅读产品说明与 `AGENTS.md`，查找已有页面和对应 OpenAPI 定义。
2. 内容修改同时维护中文与英文，同主题使用相同相对路径。
3. 新页面加入两种语言的 `docs.json` 导航。
4. API 字段在 OpenAPI 中维护，MDX 只保留使用说明和必要的集成示例。
5. 运行下列检查，并通过本地预览核对实际渲染。

```bash
mint validate
mint broken-links --check-anchors --check-redirects --check-snippets
```

每个 API 页的 `openapi` frontmatter 必须显式指定语言对应的文件，例如 `openapi/zh.json POST /v1/chat/completions`。不要省略文件路径，以免中英文规范解析到错误版本。

接口地址为 `https://api.maxapi.ai`；兼容 SDK 的 Base URL 为 `https://api.maxapi.ai/v1`。在线调试会发送真实请求，生成操作可能产生用量。自动化验证默认使用静态检查或模拟请求，不运行付费生成任务，不记录密钥。

## 发布

本地预览成功不等于已经发布。发布需使用用户已连接的 Mintlify 项目及其源仓库或编辑分支，确认目标和既有授权后再执行。检查部署状态与实际页面后，才能报告上线成功。

README、AGENTS、脚本与产品说明是维护资料，应通过 `.mintignore` 排除，不放入客户导航。

## English maintenance note

This is the standalone bilingual Mintlify documentation project for MaxAPI. Keep `zh/` and `en/` aligned, maintain request contracts in their language-specific OpenAPI files, and use Mintlify native components. Run `mint validate` and `mint broken-links` before delivery. The extended catalog is a structural reference, not a promise of account availability or verified endpoint behavior.
