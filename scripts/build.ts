const args = process.argv.slice(2);

// Set the environment if it isn't set.
if (process.env.NODE_ENV === undefined) {
  // tslint:disable-next-line:no-object-mutation
  process.env.NODE_ENV = args.includes('--production') || args.includes('-p')
    ? 'production'
    : 'development';
}

const watch = args.includes('--watch') || args.includes('-w');

const debug = args.includes('--debug');

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (error) => {
  // tslint:disable-next-line:no-throw
  throw error;
});

import * as assert from 'assert';
import { copy, outputFile } from 'fs-extra';
import { resolve as resolvePath } from 'path';
import { rollup, RollupOptions, RollupWatchOptions, watch as rollupWatch } from 'rollup';
import sortPackage from 'sort-package-json';

// Start
(async (): Promise<void> => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return buildDevelopment();
    case 'production':
      return buildProduction();
    default:
      return Promise.reject(new Error(`Cannot build: Unknown environment "${process.env.NODE_ENV}".`));
  }

})()
  .catch((error) => {
    // tslint:disable-next-line:no-throw
    throw error;
  });

/**
 * Build for the development environment.
 */
async function buildDevelopment(): Promise<void> {
  const rollupConfig = (await import('../config/rollup.config.dev')).default;
  if (watch) {
    watchElement(rollupConfig);
  } else {
    await buildElement(rollupConfig);
  }
}

/**
 * Build for the production environment.
 */
async function buildProduction(): Promise<void> {
  const rollupConfig = (await import('../config/rollup.config.prod')).default;
  if (watch) {
    watchElement(rollupConfig);
  } else {
    const outputFiles = await buildElement(rollupConfig);

    // tslint:disable: no-magic-numbers
    assert.strictEqual(outputFiles.length, 2, 'There should be two output files.');

    const [moduleFile, scriptFile] = outputFiles;
    assert.strictEqual(moduleFile.substring(moduleFile.length - 4), '.mjs', 'Expected first output file to have extention .mjs');
    assert.strictEqual(scriptFile.substring(scriptFile.length - 3), '.js', 'Expected second output file to have extention .js');
    // tslint:enable: no-magic-numbers

    await Promise.all([
      createPackageJson(scriptFile, moduleFile),
      copyDistFiles()
    ]);
  }
}

/**
 * Build the element.
 *
 * @param rollupConfig The rollup config file to use.
 * @returns the filenames output.
 */
async function buildElement(
  rollupConfig: ReadonlyArray<RollupOptions> | RollupOptions
// tslint:disable-next-line: readonly-array
): Promise<Array<string>> {
  const rollupConfigArray: ReadonlyArray<RollupOptions> = Array.isArray(rollupConfig)
    ? rollupConfig
    : [rollupConfig];

  const rollupBuilds = await Promise.all(
    rollupConfigArray.map(async (config) => {
      return rollup(config);
    })
  );

  const buildOutputs = await Promise.all(
    rollupBuilds.map(async (rollupBuild, index) => {
      const config = rollupConfigArray[index];
      if (config.output === undefined) {
        return Promise.reject(new Error('output not defined'));
      }
      return rollupBuild.write(config.output);
    })
  );

  // Return an array of the filenames output.
  return buildOutputs.reduce((r0, build) => [...r0, ...build.output.reduce((r1, output) => [...r1, output.fileName], [])], []);
}

/**
 * Build the element and watch for changes. Auto rebuilt when a change is detected.
 *
 * @param rollupConfig The rollup config to use
 */
function watchElement(
  rollupConfig: ReadonlyArray<RollupOptions> | RollupOptions
// tslint:disable-next-line: readonly-array
): void {
  // Remove all content but keep the directory so that if you're in it, you don't end up in Trash
  //// await emptyDirectory(paths.getAppBuildPath(process.env.NODE_ENV));

  const rollupConfigArray: ReadonlyArray<RollupOptions> = Array.isArray(rollupConfig)
    ? rollupConfig
    : [rollupConfig];

  // tslint:disable-next-line: readonly-array
  rollupWatch(rollupConfigArray as Array<RollupWatchOptions>);
}

/**
 * Create the package.json file for release.
 */
async function createPackageJson(mainFile: string, moduleFile: string): Promise<void> {
  const pkg = (await import('../package.json')).default;

  // tslint:disable: no-object-mutation no-any
  const distPkg = {
    ...pkg,
    main: mainFile,
    module: moduleFile
  };
  delete (distPkg as any).scripts;
  delete (distPkg as any).devDependencies;
  // tslint:enable: no-object-mutation no-any

  await outputFile(distPathFromRelative('package.json'), JSON.stringify(sortPackage(distPkg), undefined, 2));
}

/**
 * Copy any other files to be released to the dist folder.
 */
async function copyDistFiles(): Promise<void> {
  const files: ReadonlyArray<string> = [
    'LICENSE',
    'README.md'
  ];

  await Promise.all(
    files.map(
      async (file) => copy(resolvePath(process.cwd(), file), distPathFromRelative(file))
    )
  );
}

/**
 * Get the dist path from the given relative path.
 */
function distPathFromRelative(path: string): string {
  return resolvePath(process.cwd(), 'dist', path);
}
