import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const endpoints = {
  video: {
    '/v2/videos/generations': ['post', 'videos/create'],
    '/v2/videos/generations/{task_id}': ['get', 'videos/retrieve'],
  },
  suno: {
    '/suno/v2/generate': ['post', 'suno/v2-generate'],
    '/suno/v2/feed': ['get', 'suno/v2-feed'],
    '/suno/submit/music': ['post', 'suno/submit'],
    '/suno/fetch/{task_id}': ['get', 'suno/fetch'],
  },
};

function walk(value, visit) {
  visit(value);
  if (value && typeof value === 'object') Object.values(value).forEach((child) => walk(child, visit));
}

function resolve(spec, schema) {
  if (!schema.$ref) return schema;
  assert.ok(schema.$ref.startsWith('#/'), `External reference: ${schema.$ref}`);
  const found = schema.$ref.slice(2).split('/').reduce((value, key) => (
    value?.[key.replaceAll('~1', '/').replaceAll('~0', '~')]
  ), spec);
  assert.ok(found, `Missing reference: ${schema.$ref}`);
  return resolve(spec, found);
}

// Check the schema features used by these examples. Mintlify's validator also
// validates the complete OpenAPI documents before a preview or deployment.
function matches(spec, schema, value) {
  schema = resolve(spec, schema);
  if (schema.oneOf && schema.oneOf.filter((item) => matches(spec, item, value)).length !== 1) return false;
  if (schema.anyOf && !schema.anyOf.some((item) => matches(spec, item, value))) return false;
  if (schema.allOf && !schema.allOf.every((item) => matches(spec, item, value))) return false;
  if (schema.enum && !schema.enum.includes(value)) return false;
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!allowed.some((item) => item === type || (item === 'integer' && Number.isInteger(value)))) return false;
  }
  if (type === 'object') {
    if ((schema.required ?? []).some((field) => !Object.hasOwn(value, field))) return false;
    for (const [field, child] of Object.entries(value)) {
      if (schema.properties?.[field] && !matches(spec, schema.properties[field], child)) return false;
    }
  }
  if (type === 'array' && schema.items && !value.every((item) => matches(spec, schema.items, item))) return false;
  return true;
}

function structure(value, key = '', inExample = false, inTags = false) {
  if (typeof value === 'string') {
    return inExample || inTags || ['title', 'summary', 'description'].includes(key) ? '<localized>' : value;
  }
  if (Array.isArray(value)) return value.map((item) => structure(item, '', inExample, inTags || key === 'tags'));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([field, child]) => [
    field, structure(child, field, inExample || ['example', 'examples'].includes(field), inTags || key === 'tags'),
  ]));
  return value;
}

let examples = 0;
for (const [family, expected] of Object.entries(endpoints)) {
  const pair = {};
  for (const locale of ['zh', 'en']) {
    const spec = JSON.parse(await read(`openapi/${family}-${locale}.json`));
    pair[locale] = spec;
    assert.deepEqual(Object.keys(spec.paths).sort(), Object.keys(expected).sort());
    assert.equal(spec.servers[0].url, 'https://api.maxapi.ai');
    assert.equal(spec.components.securitySchemes.BearerAuth.scheme, 'bearer');
    assert.deepEqual(spec.security, [{ BearerAuth: [] }]);
    const ids = new Set();
    for (const [path, [method, page]] of Object.entries(expected)) {
      assert.deepEqual(Object.keys(spec.paths[path]), [method]);
      const operation = spec.paths[path][method];
      assert.ok(operation.operationId && !ids.has(operation.operationId));
      ids.add(operation.operationId);
      assert.ok(operation.responses['200'].content['application/json']);
      if (method === 'get') assert.equal(operation.requestBody, undefined, `${path}: GET must not send a body`);
      if (path.includes('{task_id}')) {
        const id = operation.parameters.find((parameter) => parameter.in === 'path' && parameter.name === 'task_id');
        assert.ok(id.required);
        assert.equal(id.schema.type, 'string');
      }
      const mdx = await read(`${locale}/api-reference/${page}.mdx`);
      assert.ok(mdx.includes(`openapi/${family}-${locale}.json ${method.toUpperCase()} ${path}`));
      walk(operation, (node) => {
        if (!node || typeof node !== 'object' || !node.schema) return;
        const samples = Object.values(node.examples ?? {}).filter((sample) => Object.hasOwn(sample, 'value')).map((sample) => sample.value);
        if (Object.hasOwn(node, 'example')) samples.push(node.example);
        for (const sample of samples) {
          assert.ok(matches(spec, node.schema, sample), `Invalid example: ${locale} ${path}`);
          examples++;
        }
      });
    }
    walk(spec, (node) => {
      if (node && typeof node === 'object' && node.$ref) resolve(spec, node);
      if (typeof node === 'string') {
        assert.ok(!/\bsk-[A-Za-z0-9_-]{12,}/.test(node), 'Possible API key in specification');
        if (locale === 'en') assert.ok(!/[\u3400-\u9fff]/u.test(node), 'Untranslated English specification');
      }
    });

    if (family === 'video') {
      const request = resolve(spec, spec.paths['/v2/videos/generations'].post.requestBody.content['application/json'].schema);
      assert.deepEqual([...request.required].sort(), ['model', 'prompt']);
      assert.ok(matches(spec, request, { model: 'TEST_VIDEO_MODEL', prompt: 'A quiet pond.' }), 'Text-only video must not require images');
      assert.ok(!matches(spec, request, { model: 'TEST_VIDEO_MODEL' }), 'Video requires a prompt');
      const task = resolve(spec, spec.paths['/v2/videos/generations/{task_id}'].get.responses['200'].content['application/json'].schema);
      assert.deepEqual(task.properties.status.enum, ['NOT_START', 'SUBMITTED', 'QUEUED', 'IN_PROGRESS', 'SUCCESS', 'FAILURE']);
      assert.ok(matches(spec, task, { task_id: 'TEST_TASK', status: 'QUEUED', data: null }));
    } else {
      const generate = resolve(spec, spec.paths['/suno/v2/generate'].post.requestBody.content['application/json'].schema);
      assert.deepEqual([...generate.required].sort(), ['mv', 'prompt']);
      assert.ok(!generate.properties.model, 'Suno v2 uses mv, not model');
      const feed = spec.paths['/suno/v2/feed'].get.parameters.find((parameter) => parameter.name === 'ids');
      assert.equal(feed.in, 'query');
      assert.equal(feed.schema.type, 'string');
      const submit = spec.paths['/suno/submit/music'].post.responses['200'].content['application/json'].schema;
      assert.ok(matches(spec, submit, { code: 'success', data: 'TEST_TASK' }), 'Support standard NewAPI string task IDs');
      assert.ok(matches(spec, submit, { code: 'success', data: { task_id: 'TEST_TASK' } }), 'Support compatible task-object responses');
      assert.ok(!matches(spec, submit, { data: 12345 }), 'Task ID extraction must not accept a numeric data value');
    }
  }
  assert.deepEqual(structure(pair.zh), structure(pair.en), `${family}: language contracts differ`);
}
console.log(`Media checks passed: 6 operations, 12 endpoint pages, bilingual contracts, protocol identifiers, references, and ${examples} examples.`);
