const args = process.argv.slice(2);

// Set the environment if it isn't set.
if (process.env.NODE_ENV === undefined) {
  // tslint:disable-next-line:no-object-mutation
  process.env.NODE_ENV = args.includes('--production') || args.includes('-p')
    ? 'production'
    : 'development';
}

const debug = args.includes('--debug');

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (error) => {
  // tslint:disable-next-line:no-throw
  throw error;
});

import { outputFile } from 'fs-extra';
import { resolve as resolvePath } from 'path';
import {
  Analyzer,
  FsUrlLoader,
  generateAnalysis as processAnalysis,
  PackageUrlResolver
} from 'polymer-analyzer';

import { glob } from './util';

// Relative to root/cwd.
const nodeModules = 'node_modules';
const tempFolder = '.tmp/docs';
const docsSrcFolder = 'docs-src';
const docsDistFolder = 'docs';
const libSrcFolder = 'src';
const libDistFolder = 'dist';

// Start
(async (): Promise<void> => {
  switch (process.env.NODE_ENV) {
    case 'development':
      return generateAutoAnalysis();
    case 'production':
      return Promise.reject(new Error(`This script should only be used in the development environment.`));
    default:
      return Promise.reject(new Error(`Cannot build docs: Unknown environment "${process.env.NODE_ENV}".`));
  }

})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

async function generateAutoAnalysis(): Promise<void> {
  const analyzer = new Analyzer({
    urlLoader: new FsUrlLoader('./'),
    urlResolver: new PackageUrlResolver({
      packageDir: './'
    })
  });

  const files = await glob(`./${libDistFolder}/**/*.mjs`);
  const analysis = await analyzer.analyze(files);
  const formattedAnalysis = processAnalysis(analysis, analyzer.urlResolver);
  const analysisFileContents = JSON.stringify(formattedAnalysis, undefined, 2);

  await outputFile(
    resolvePath(process.cwd(), docsSrcFolder, 'auto-analysis.json'),
    analysisFileContents
  );
}
