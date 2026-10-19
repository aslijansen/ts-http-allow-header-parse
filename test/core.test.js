import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAllowHeader, ALLOWED_METHODS, isAllowedMethod } from '../src/core.js';

test('parseAllowHeader parses a simple comma-separated list', () => {
  const result = parseAllowHeader('GET, POST, DELETE');
  assert.deepEqual([...result].sort(), ['DELETE', 'GET', 'POST']);
});

test('parseAllowHeader normalises methods to upper case', () => {
  const result = parseAllowHeader('get, post');
  assert.deepEqual([...result].sort(), ['GET', 'POST']);
});

test('parseAllowHeader returns a Set', () => {
  const result = parseAllowHeader('GET');
  assert.ok(result instanceof Set);
});

test('parseAllowHeader de-duplicates repeated methods', () => {
  const result = parseAllowHeader('GET, GET, POST');
  assert.equal(result.size, 2);
  assert.ok(result.has('GET'));
  assert.ok(result.has('POST'));
});

test('parseAllowHeader tolerates optional whitespace', () => {
  const result = parseAllowHeader('  GET  ,  POST  ');
  assert.deepEqual([...result].sort(), ['GET', 'POST']);
});

test('parseAllowHeader skips empty elements', () => {
  const result = parseAllowHeader('GET,,POST,');
  assert.deepEqual([...result].sort(), ['GET', 'POST']);
});

test('parseAllowHeader strips q-parameters it does not interpret', () => {
  const result = parseAllowHeader('GET;q=0.5, POST');
  assert.deepEqual([...result].sort(), ['GET', 'POST']);
});

test('parseAllowHeader drops unknown methods instead of throwing', () => {
  const result = parseAllowHeader('GET, FROBNICATE, POST');
  assert.deepEqual([...result].sort(), ['GET', 'POST']);
});

test('parseAllowHeader returns empty set for unknown-only input', () => {
  const result = parseAllowHeader('FROBNICATE');
  assert.equal(result.size, 0);
});

test('parseAllowHeader returns empty set for non-string input', () => {
  assert.equal(parseAllowHeader(null).size, 0);
  assert.equal(parseAllowHeader(undefined).size, 0);
  assert.equal(parseAllowHeader(123).size, 0);
});

test('parseAllowHeader returns empty set for empty string', () => {
  assert.equal(parseAllowHeader('').size, 0);
});

test('ALLOWED_METHODS contains the nine standard registry methods', () => {
  const expected = [
    'GET', 'HEAD', 'POST', 'PUT', 'DELETE',
    'CONNECT', 'OPTIONS', 'TRACE', 'PATCH'
  ];
  assert.deepEqual([...ALLOWED_METHODS].sort(), expected.sort());
});

test('ALLOWED_METHODS is frozen', () => {
  assert.ok(Object.isFrozen(ALLOWED_METHODS));
});

test('isAllowedMethod is case-insensitive and rejects unknowns', () => {
  assert.equal(isAllowedMethod('get'), true);
  assert.equal(isAllowedMethod('PATCH'), true);
  assert.equal(isAllowedMethod('FROBNICATE'), false);
  assert.equal(isAllowedMethod(''), false);
  assert.equal(isAllowedMethod(null), false);
});

test('parseAllowHeader handles a single method with no comma', () => {
  const result = parseAllowHeader('OPTIONS');
  assert.deepEqual([...result], ['OPTIONS']);
});

test('parseAllowHeader handles the full standard set in one header', () => {
  const all = [...ALLOWED_METHODS].join(', ');
  const result = parseAllowHeader(all);
  assert.equal(result.size, ALLOWED_METHODS.size);
  for (const m of ALLOWED_METHODS) {
    assert.ok(result.has(m));
  }
});

test('parseAllowHeader does not mutate the shared registry set', () => {
  const before = ALLOWED_METHODS.size;
  parseAllowHeader('GET, BOGUS');
  assert.equal(ALLOWED_METHODS.size, before);
  assert.ok(!ALLOWED_METHODS.has('BOGUS'));
});
