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
The owner confirms the same API system as https://s.apifox.cn/984acdde-d3da-4577-942f-c63aa5ad71fc . Live peer schemas add buttons, MODAL/CANCEL, and optional input fields absent from the older export. Matching primary implementation reference: https://github.com/litter-coder/midjourney-proxy-plus/blob/main/docs/api.md . Action code 21 can mean a pending Modal interaction; interpret it with description/status rather than globally assigning the old export's "already exists" meaning. Describe/Shorten text is properties.finalPrompt, optional finalZhPrompt. accountFilter selects accounts, not account settings. Official Midjourney product documentation establishes Blend's 2–5 inputs and current U-button selection versus resolution upscaling. New bilingual guides cover first image, input preparation, follow-up actions, and task lifecycle; new independent OpenAPI specs cover 13 MJ operations with native testing. No paid MaxAPI requests were made to verify account availability. The user requested preview only; retain the draft branch until publication is explicitly authorized.
