#!/bin/bash
node --trace-deprecation --test --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/unit/index.test.ts
node --trace-deprecation --test --require ts-node/register -r tsconfig-paths/register ./src/modules/demo/tests/integration/index.test.ts
