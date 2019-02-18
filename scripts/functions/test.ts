import * as assert from 'assert';
import { test as runTests } from 'web-component-tester';

import { buildElement } from './build';

/**
 * Run tests.
 */
export async function test(debug: boolean): Promise<void> {
  await buildTestFiles(debug);
  await wctTests();
}

async function buildTestFiles(debug: boolean): Promise<void> {
  const rollupConfig = (await import('../../config/rollup.config.test')).default;
  const outputFiles = await buildElement(rollupConfig, debug);

  // tslint:disable: no-magic-numbers
  assert.strictEqual(outputFiles.length, 2, 'There should be two output files.');

  const [testFile] = outputFiles;
  assert.strictEqual(testFile.substring(testFile.length - 3), '.js', 'Expected test file to have extention .js');
  // tslint:enable: no-magic-numbers
}

/**
 * Run the web componet tester tests.
 */
async function wctTests(): Promise<void> {
  const config = (await import('../../config/wct.conf.json')).default;
  await runTests(config);
}
