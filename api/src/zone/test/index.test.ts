/*
Command:
- Debug Mode: All Test Case Run
node --trace-deprecation --test-only --require ts-node/register -r tsconfig-paths/register src/zone/test/index.test.ts

- Debug Mode: Single Test Case Run
node --trace-deprecation --test-only --test-name-pattern='test_hello_world1' --require ts-node/register -r tsconfig-paths/register src/zone/test/index.test.ts
*/

import { test } from 'node:test';
import assert from 'node:assert';

test.only(`test_hello_world_1`, () => {
	console.log('Hello World!');
	assert.strictEqual('Hello World!', 'Hello World!');
});

test.only(`test_hello_world_2`, () => {
	console.log('Hello World!');
	assert.strictEqual('Hello World!', 'Hello World!');
});
