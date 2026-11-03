import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const specs = Object.fromEntries(await Promise.all(['zh', 'en'].map(async (language) => [
  language, JSON.parse(await readFile(new URL(`openapi/midjourney-${language}.json`, root), 'utf8')),
])));

// Contract baseline: the supplied export, the peer's public Midjourney reference,
// and the matching upstream API documentation. This intentionally does not make
// paid requests or assert that an account has every documented mode enabled.
const operations = {
  '/mj/submit/imagine': ['post', 'ImagineRequest', ['prompt']],
  '/mj/submit/action': ['post', 'ActionRequest', ['customId', 'taskId']],
  '/mj/submit/modal': ['post', 'ModalRequest', ['taskId']],
  '/mj/submit/blend': ['post', 'BlendRequest', ['base64Array']],
  '/mj/submit/describe': ['post', 'DescribeRequest', ['base64']],
  '/mj/submit/shorten': ['post', 'ShortenRequest', ['prompt']],
  '/mj/task/{id}/fetch': ['get'],
  '/mj/task/{id}/image-seed': ['get'],
  '/mj/task/{id}/cancel': ['post'],
  '/mj/task/list-by-condition': ['post', 'TaskIdsRequest', []],
  '/mj/task/queue': ['get'],
  '/mj/task/list': ['get'],
  '/mj/task/query': ['post', 'TaskQueryRequest', []],
};
const states = ['NOT_START', 'SUBMITTED', 'MODAL', 'IN_PROGRESS', 'FAILURE', 'SUCCESS', 'CANCEL'];
const serverPrefixes = ['', '/mj-turbo', '/mj-relax'];
const tagNames = {
  'Midjourney 任务提交': 'Midjourney submission',
  'Midjourney 任务管理': 'Midjourney tasks',
};

function walk(value, callback, path = '#') {
  callback(value, path);
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) walk(child, callback, `${path}/${key}`);
  }
}

function resolve(spec, reference) {
  assert.ok(reference.startsWith('#/'), `Only local references are supported: ${reference}`);
  const result = reference.slice(2).split('/').reduce((value, part) => (
    value?.[decodeURIComponent(part).replaceAll('~1', '/').replaceAll('~0', '~')]
  ), spec);
  assert.notEqual(result, undefined, `Unresolved reference: ${reference}`);
  return result;
}

// Preserve every constraint and example field. Only human-language annotation
// strings and the two translated tag names may differ between the specs.
function protocol(value, key = '', inTags = false) {
  if (typeof value === 'string') {
    if (['title', 'summary', 'description'].includes(key)) return '<localized text>';
    return inTags ? (tagNames[value] ?? value) : value;
  }
  if (Array.isArray(value)) return value.map((item) => protocol(item, '', inTags || key === 'tags'));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([field, item]) => [
      field, protocol(item, field, inTags || key === 'tags'),
    ]));
  }
  return value;
}

function checkExample(spec, schema, value, path) {
  if (schema.$ref) return checkExample(spec, resolve(spec, schema.$ref), value, path);
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  const matches = (type) => type === undefined || (
    type === 'null' ? value === null
      : type === 'array' ? Array.isArray(value)
        : type === 'integer' ? Number.isInteger(value)
          : type === 'object' ? value !== null && typeof value === 'object' && !Array.isArray(value)
            : typeof value === type
  );
  assert.ok(types.some(matches), `Example type mismatch at ${path}`);
  if (schema.enum) assert.ok(schema.enum.includes(value), `Example enum mismatch at ${path}`);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const required of schema.required ?? []) {
      assert.ok(Object.hasOwn(value, required), `Example missing ${required} at ${path}`);
    }
    for (const [key, item] of Object.entries(value)) {
      if (schema.properties?.[key]) checkExample(spec, schema.properties[key], item, `${path}/${key}`);
    }
  }
  if (Array.isArray(value) && schema.items) {
    value.forEach((item, index) => checkExample(spec, schema.items, item, `${path}/${index}`));
  }
}

let exampleCount = 0;
for (const [language, spec] of Object.entries(specs)) {
  const schemas = spec.components.schemas;
  assert.equal(spec.openapi, '3.1.0');
  assert.deepEqual(Object.keys(spec.paths).sort(), Object.keys(operations).sort());
  assert.deepEqual(spec.security, [{ BearerAuth: [] }]);
  assert.equal(spec.components.securitySchemes.BearerAuth.type, 'http');
  assert.equal(spec.components.securitySchemes.BearerAuth.scheme, 'bearer');
  assert.deepEqual(spec.servers.map(({ url }) => url), serverPrefixes.map((prefix) => `https://api.maxapi.ai${prefix}`));

  const operationIds = new Set();
  for (const [path, [method, requestName, required]] of Object.entries(operations)) {
    assert.deepEqual(Object.keys(spec.paths[path]), [method], `${language}: ${path}`);
    const operation = spec.paths[path][method];
    assert.ok(operation.operationId && !operationIds.has(operation.operationId), `Duplicate or missing operationId: ${path}`);
    operationIds.add(operation.operationId);
    assert.ok(operation.responses['200'].content['application/json'], `${path}: missing JSON response`);

    for (const [index, server] of spec.servers.entries()) {
      // Concatenation matters: new URL(path, server) would silently discard
      // the Turbo/Relax prefix because operation paths begin with a slash.
      const fullUrl = new URL(`${server.url}${path.replace('{id}', 'test-task-id')}`);
      assert.equal(fullUrl.origin, 'https://api.maxapi.ai');
      assert.equal(fullUrl.pathname, `${serverPrefixes[index]}${path.replace('{id}', 'test-task-id')}`);
      assert.ok(!fullUrl.pathname.includes('/v1/'), `Midjourney path must not use /v1: ${fullUrl}`);
      assert.ok(!fullUrl.pathname.includes('/mj/mj/'), `Duplicated /mj prefix: ${fullUrl}`);
    }
    if (requestName) {
      const body = operation.requestBody.content['application/json'];
      assert.equal(body.schema.$ref, `#/components/schemas/${requestName}`);
      assert.deepEqual([...(schemas[requestName].required ?? [])].sort(), [...required].sort());
    } else {
      assert.equal(operation.requestBody, undefined, `${path}: unexpected request body`);
    }
    if (path.includes('{id}')) {
      const id = operation.parameters.find((parameter) => parameter.in === 'path' && parameter.name === 'id');
      assert.ok(id?.required, `${path}: task ID must be required`);
      assert.equal(id.schema.type, 'string', `${path}: task ID must remain a string`);
    }
    walk(operation, (value, location) => {
      if (!value || typeof value !== 'object' || !value.schema) return;
      if (Object.hasOwn(value, 'example')) {
        checkExample(spec, value.schema, value.example, `${language}${path}${location}/example`);
        exampleCount++;
      }
      for (const [name, example] of Object.entries(value.examples ?? {})) {
        if (Object.hasOwn(example, 'value')) {
          checkExample(spec, value.schema, example.value, `${language}${path}${location}/examples/${name}`);
          exampleCount++;
        }
      }
    });
  }

  // MODAL is actionable, CANCEL is terminal. Regressing to the old five-state
  // export would produce endless polling or lose the interaction step.
  assert.deepEqual(schemas.TaskQueryRequest.properties.status.enum, states);
  assert.deepEqual(schemas.TaskQueryRequest.properties.statusSet.items.enum, states);
  assert.equal(schemas.Task.properties.status.type, 'string');
  for (const state of states) assert.ok(schemas.Task.properties.status.description.includes(state));
  assert.equal(schemas.Task.properties.buttons.items.$ref, '#/components/schemas/Button');
  for (const field of ['customId', 'label', 'emoji']) assert.equal(schemas.Button.properties[field].type, 'string');
  for (const field of ['style', 'type']) assert.equal(schemas.Button.properties[field].type, 'integer');
  for (const field of ['finalPrompt', 'finalZhPrompt']) assert.equal(schemas.TaskProperties.properties[field].type, 'string');
  assert.equal(schemas.SeedResponse.properties.result.type, 'string');
  assert.equal(spec.paths['/mj/task/query'].post.responses['200'].content['application/json'].schema.$ref, '#/components/schemas/TaskPage');
  for (const path of ['/mj/task/list', '/mj/task/queue', '/mj/task/list-by-condition']) {
    const method = operations[path][0];
    assert.deepEqual(spec.paths[path][method].responses['200'].content['application/json'].schema, {
      type: 'array', items: { $ref: '#/components/schemas/Task' },
    });
  }

  walk(spec, (value, path) => {
    if (value && typeof value === 'object') {
      if (value.$ref) resolve(spec, value.$ref);
      for (const field of Array.isArray(value.required) ? value.required : []) {
        assert.ok(value.properties?.[field], `${language}${path}: required field ${field} is undefined`);
      }
    }
    if (typeof value === 'string') {
      if (language === 'en') assert.ok(!/[\u3400-\u9fff]/u.test(value), `Untranslated text at ${path}`);
      assert.ok(!/\bsk-[A-Za-z0-9_-]{12,}/.test(value), `Possible API key at ${path}`);
      assert.ok(!/api\.(?:mjdjourney\.cn|avman\.ai)|cdn\.discordapp\.com/.test(value), `Unreplaced peer value at ${path}`);
    }
  });
}
assert.deepEqual(protocol(specs.zh), protocol(specs.en), 'Chinese and English contracts differ');
console.log(`Midjourney checks passed: 13 operations, 3 mode servers, 7 states, all references, required fields, bilingual parity, and ${exampleCount} examples.`);
