# MaxAPI 文档编辑规则

## 开始前

- 本目录是 Mintlify 内容项目，不是 Next.js 应用。不要移入 Fumadocs、Scalar 或原项目的 React 调试器。
- 先读 `docs.json` 和 `.mintlify/product-brief.md`，再读相关现有页面。优先使用当前 Mintlify 技能及官方参考核对配置和组件。
- 保留已有工作；先确认当前任务授权和文件分工，再修改对应内容。

## 中英文一致性

- `zh/` 是默认中文内容，`en/` 是完整英文对应内容。
- 相同主题使用相同相对路径。新增、删除或移动页面时，同步检查两种语言的页面、导航和链接。
- 代码里的 API 路径、参数名和模型标识不要翻译。说明、提示语及示例中的自然语言可按语言本地化。
- 每页包含明确的 `title`、`description` 和 `keywords`，正文以说明本页用途的自然段开始。

## 事实与范围

- 产品域名：官网 `https://maxapi.ai`，控制台 `https://platform.maxapi.ai`，API `https://api.maxapi.ai`。
- OpenAI 兼容 SDK Base URL 为 `https://api.maxapi.ai/v1`。不要重复拼接 `/v1`。
- 所有路径、参数、响应、默认值、限制与能力必须能追溯到项目资料或核实后的来源。未知内容保留为待确认说明，不推测补全。
- 不编造模型可用范围、价格、额度、保存期限、回调签名或服务承诺。模型可见不代表支持所有功能和参数。
- 扩展目录保留来源的 173 条记录及核对标记，仅用于结构参考。不得将这些记录直接宣传为已开通或已验证的接口。
- 原始导出中的密钥、认证值、第三方媒体地址和固定任务标识不得进入客户文档。示例使用明确占位符。

## API 文档

- 常用接口契约维护在 `openapi/zh.json` 与 `openapi/en.json`，保持方法、路径、字段类型和必填项一致。
- Midjourney 独立规范位于 `openapi/midjourney-{zh,en}.json`，维护 13 个操作、七种状态与三种模式。修改后运行 `node scripts/check-midjourney.mjs`。
- 统一视频与 Suno 规范分别位于 `openapi/video-{zh,en}.json`、`openapi/suno-{zh,en}.json`；修改后运行 `node scripts/check-media.mjs`，不要将各协议的任务 ID 或返回包装层混用。
- MDX frontmatter 使用完整引用，例如 `openapi: "openapi/zh.json POST /v1/chat/completions"`。项目有多个规范文件，不要只写方法和路径。
- 参数和响应结构交给 OpenAPI 自动生成。MDX 补充任务流程、SDK 用法、输出处理与故障排查，避免重复维护同一参数表。
- 保留 JSON、multipart、SSE 与音频响应的准确内容类型，不把所有响应都描述为 JSON。
- Mintlify 原生在线调试行为与旧项目不同，不承诺旧代理的限制、密钥保存方式或自定义播放器行为。

## 格式与组件

- 使用 Mintlify 原生 `Card`、`Columns`、`Steps`、`Tabs`、`Accordion` 与提示组件，无需导入。
- 站内链接使用语言前缀和根相对地址，不带文件扩展名，例如 `/zh/quickstart` 或 `/en/quickstart`。
- 对概览页显式使用 `/zh/index`、`/zh/api-reference/index`、`/zh/media/index`，英文同理。
- 代码块注明语言；保持命令可复制。代码块标题使用不加引号的纯文本（例如在语言标记 python 后直接写 example.py），避免当前 Mintlify 渲染出空白 CodeGroup 标签。环境变量使用占位符，不能在文档里写入真实密钥。
- 图片需要替代文本，SVG 品牌资产保持简洁，兼顾浅色与深色背景。
- 不把维护说明、部署步骤、内部产品资料或脚本加入客户导航；在 `.mintignore` 中排除这些资料。

## 验证与交付

- 从本目录运行 `mint validate` 和 `mint broken-links --check-anchors --check-redirects --check-snippets`，修复本次修改导致的错误。
- 使用 `mint dev --no-open` 预览；端口被占用时使用 `mint dev --port 3001 --no-open`，不要为腾端口擅自终止无关服务。
- 预览检查中文、英文、语言切换、导航、桌面与移动布局、API 鉴权和参数控件。
- 默认采用静态验证或模拟响应。付费生成请求需要明确任务授权与有效测试配置，不为展示效果擅自消耗账户额度。
- 不在日志、截图、提交或聊天中输出密钥。不要宣称未执行的真实请求已经通过。
- 发布目标与权限沿用用户明确授权。发布前完成内容和验证，发布后确认部署与页面实际可用；不要把本地成功描述成线上完成。
