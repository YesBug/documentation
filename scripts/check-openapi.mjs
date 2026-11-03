import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const readSpec = async (path) => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const zh = await readSpec('openapi/zh.json');
const en = await readSpec('openapi/en.json');
const expectedOperations = {
  '/v1/chat/completions': ['post', 'createChatCompletion'],
  '/v1/completions': ['post', 'createCompletion'],
  '/v1/embeddings': ['post', 'createEmbeddings'],
  '/v1/images/generations': ['post', 'generateImages'],
  '/v1/images/edits': ['post', 'editImage'],
  '/v1/audio/speech': ['post', 'createSpeech'],
  '/v1/audio/transcriptions': ['post', 'createTranscription'],
  '/v1/audio/translations': ['post', 'createTranslation'],
  '/v1/models': ['get', 'listModels'],
};
const tagNames = { 文本: 'Text', 图像: 'Images', 音频: 'Audio', 模型: 'Models' };

// Strip localized annotations while retaining schema constraints and example shape.
function protocolStructure(value, key = '', example = false, inTags = false) {
  if (typeof value === 'string') {
    if (['title', 'summary', 'description'].includes(key) || example) return '<text>';
    return inTags ? (tagNames[value] ?? value) : value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => protocolStructure(item, '', example, inTags || key === 'tags'));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([field]) => field !== 'contentMediaType')
      .map(([field, item]) => [field, protocolStructure(
        item, field, example || field === 'example' || field === 'examples', inTags || key === 'tags',
      )]));
  }
  return value;
}

function visit(value, callback, path = '#') {
  callback(value, path);
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) visit(item, callback, `${path}/${key}`);
  }
}

for (const [language, spec] of [['zh', zh], ['en', en]]) {
  assert.equal(spec.openapi, '3.1.0', `${language}: OpenAPI version`);
  assert.deepEqual(Object.keys(spec.paths).sort(), Object.keys(expectedOperations).sort());
  assert.equal(spec.servers[0].url, 'https://api.maxapi.ai');
  assert.deepEqual(spec.security, [{ BearerAuth: [] }]);
  assert.equal(spec.components.securitySchemes.BearerAuth.type, 'http');
  assert.equal(spec.components.securitySchemes.BearerAuth.scheme, 'bearer');
  for (const [path, [method, operationId]] of Object.entries(expectedOperations)) {
    assert.deepEqual(Object.keys(spec.paths[path]), [method], `${language}: ${path}`);
    assert.equal(spec.paths[path][method].operationId, operationId);
  }
  visit(spec, (value, path) => {
    if (value && typeof value === 'object' && '$ref' in value) {
      assert.ok(value.$ref.startsWith('#/'), `${language}: external reference at ${path}`);
      const resolved = value.$ref.slice(2).split('/').reduce((item, token) => (
        item?.[token.replaceAll('~1', '/').replaceAll('~0', '~')]
      ), spec);
      assert.notEqual(resolved, undefined, `${language}: unresolved ${value.$ref}`);
    }
    if (typeof value === 'string') {
      assert.ok(!value.includes('/docs/'), `${language}: old documentation link at ${path}`);
      assert.ok(!/\bScalar\b/i.test(value), `${language}: obsolete product text at ${path}`);
      if (language === 'en') assert.ok(!/[\u3400-\u9fff]/u.test(value), `Untranslated text at ${path}`);
      for (const match of value.matchAll(/\]\((\/[^)]+)\)/g)) {
        assert.ok(match[1].startsWith(`/${language}/`), `${language}: wrong locale in ${match[1]}`);
      }
    }
  });
  for (const path of ['/v1/chat/completions', '/v1/completions']) {
    const stream = spec.paths[path].post.responses['200'].content['text/event-stream'];
    assert.ok(stream, `${language}: missing SSE response for ${path}`);
    assert.ok(stream.examples.stream.value.endsWith('data: [DONE]\n\n'));
  }
  for (const [schema, fields] of [
    ['ImageEditRequest', ['image', 'mask']],
    ['TranscriptionRequest', ['file']],
    ['TranslationRequest', ['file']],
  ]) {
    for (const field of fields) {
      const upload = spec.components.schemas[schema].properties[field];
      assert.equal(upload.type, 'string');
      assert.equal(upload.format, 'binary');
      assert.equal(upload.contentMediaType, field === 'mask' ? 'image/png' : 'application/octet-stream');
    }
  }
}

assert.deepEqual(protocolStructure(zh), protocolStructure(en), 'Locale schemas must expose the same API contract');

// When the migration source is available, also protect its reviewed API contract.
try {
  const source = await readSpec('../maxapi-docs/public/openapi.json');
  assert.deepEqual(protocolStructure(zh), protocolStructure(source), 'The reviewed source API contract changed');
  console.log('Reviewed source preserved.');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

console.log('Validated zh/en specifications: 9 matching operations, resolved references, localized text, SSE, and file uploads.');
