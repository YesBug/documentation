# MaxAPI product brief

## Description
MaxAPI provides a unified API for integrating text, image, audio, and model-specific asynchronous generation workflows. Product addresses supplied by the owner: maxapi.ai, platform.maxapi.ai, and api.maxapi.ai.

## Primary audience
Application developers integrating AI models. Chinese is the default language, with a complete English counterpart requested by the owner.

## Jobs to be done
1. Create a console API key and identify an available model.
2. Make a first request, inspect the response, and integrate with a compatible SDK.
3. Understand model-specific capabilities, streaming, file uploads, asynchronous tasks, and errors.

## Motivation
The owner wants a professional API documentation product with native online testing and bilingual navigation, replacing the current Scalar/Fumadocs experience with Mintlify.

## Sources and boundaries
Port the existing MaxAPI documentation and curated 9-operation OpenAPI specification. Preserve the 173-operation sanitized peer export as a structural reference only. Model availability, prices, quotas, and account permissions are not promises; do not invent them. Assumption: published developer content should remain public; account and publication choices are handled separately from authoring.

## Verified product entry points (2026-11-03)
Read-only inspection of the public MaxAPI console homepage confirmed the “获取密钥” entry, model overview at https://platform.maxapi.ai/modelmak, pricing detail link at https://platform.maxapi.ai/account/pricing, and service monitoring at https://platform.maxapi.ai/status. Keep prices and group multipliers in the live console rather than copying volatile figures into docs. Public model listings are not evidence of per-key permission.

## Documentation depth revision
Expand quickstart into complete Python, Node.js and cURL paths; include response interpretation and first-call diagnosis. Keep parallel Chinese and English coverage for runnable workflows, text conversations, tool loops, media polling/downloads, migration, concurrency and recovery. Use peer docs for topic coverage only; endpoint contracts come from the project, and official SDK docs only establish client behavior.

## Midjourney workflow revision (2026-11-03)
The owner confirms the same API system as https://s.apifox.cn/984acdde-d3da-4577-942f-c63aa5ad71fc . Live peer schemas add buttons, MODAL/CANCEL, and optional input fields absent from the older export. Matching primary implementation reference: https://github.com/litter-coder/midjourney-proxy-plus/blob/main/docs/api.md . Action code 21 can mean a pending Modal interaction; interpret it with description/status rather than globally assigning the old export's "already exists" meaning. Describe/Shorten text is properties.finalPrompt, optional finalZhPrompt. accountFilter selects accounts, not account settings. Official Midjourney product documentation establishes Blend's 2–5 inputs and current U-button selection versus resolution upscaling. New bilingual guides cover first image, input preparation, follow-up actions, and task lifecycle; new independent OpenAPI specs cover 13 MJ operations with native testing. No paid MaxAPI requests were made to verify account availability. The owner subsequently authorized publishing this revision; PR #2 was merged as 00da0e93b284e67441afee380d16d91d79e55619 and verified live. Further editing requests use a new branch; that authorization covered the published revision.

## Multimedia reference and integration gaps
The next revision adds native references for the two verified unified-video operations and four core Suno v2/NewAPI operations. Resolve source conflicts explicitly rather than turning incomplete catalog entries into purported contracts. Keep video task IDs, Suno clip IDs, and NewAPI task IDs distinct, including NewAPI submission data as either a task object or a string. Complete environment-file loading instructions and request-specific diagnostics, and update the playground guide for asynchronous protocols and image encoding. Do not create undocumented cancel, lyrics, upload, or provider-specific routes.


### Source evidence for the multimedia revision (2026-11-03)
- Unified-video flow and task wrapper: https://s.apifox.cn/apidoc/docs-site/3868318/doc-7324259 and https://s.apifox.cn/apidoc/docs-site/3868318/api-343590061 . Model-specific fields and numeric-string duration variants: https://gpt-best.apifox.cn/api-343632235 , https://gpt-best.apifox.cn/api-343593236 , https://s.apifox.cn/apidoc/docs-site/3868318/api-342240878 , https://gpt-best.apifox.cn/api-358024500 . The old export's image-required example is one model branch, not the generic text-to-video contract.
- Suno NewAPI protocol and request shape: https://github.com/QuantumNous/new-api-docs/blob/main/docs/api/suno-music.md , https://github.com/QuantumNous/new-api/blob/main/dto/suno.go , https://github.com/QuantumNous/new-api/blob/main/plugins/tasks/sunoapi/plugin.js . Preserve the export's compatible object response in addition to the standard string data task ID. Suno v2 paths and shapes also come from the supplied OpenAPI export.
- Environment loading behavior: https://bbc2.github.io/python-dotenv/ and https://nodejs.org/api/cli.html#--env-filefile . Environment files are loaded explicitly and existing process variables retain priority.
