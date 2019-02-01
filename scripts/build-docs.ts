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

import { load as cheerioLoad } from 'cheerio';
import del from 'del';
import { copy, ensureSymlink, outputFile, readFile } from 'fs-extra';
import { minify as minifyHTML } from 'html-minifier';
import JSON5 from 'json5';
import { Options as SassOptions, render as renderSassCbf, Result as SassResult } from 'node-sass';
import { resolve as resolvePath } from 'path';
import postcss from 'postcss';
import { rollup, RollupOptions } from 'rollup';
import { promisify } from 'util';
import webpack from 'webpack';
import colorGuard from 'colorguard';
import postcssContainerQueryProlyfill from 'cq-prolyfill/postcss-plugin';
import cssMediaQueryPacker from 'css-mqpacker';
import cssnano from 'cssnano';
import postcssFontMagician from 'postcss-font-magician';
import postcssImport from 'postcss-import';
import postcssPresetEnv from 'postcss-preset-env';
import postcssReporter from 'postcss-reporter';

import packageJson from '../package.json';

const renderSass = promisify<SassOptions, SassResult>(renderSassCbf);

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
      return buildDocsDevelopment();
    case 'production':
      return buildDocsProduction();
    default:
      return Promise.reject(new Error(`Cannot build docs: Unknown environment "${process.env.NODE_ENV}".`));
  }

})()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

/**
 * Build the docs for the development environment.
 */
async function buildDocsDevelopment(): Promise<void> {
  await buildDocs(false);
}

/**
 * Build the docs for the production environment.
 */
async function buildDocsProduction(): Promise<void> {
  await buildDocs(true);
}

/**
 * Build the docs.
 */
async function buildDocs(production: boolean): Promise<void> {
  await del(tempFolder);
  await del(docsDistFolder);
  await prepareNodeModules();
  await prepareDocSrcFiles();
  await prepareDistFiles();
  await compile(production);
}

/**
 * Copy the docs src files to the temp folder for processing.
 */
async function prepareDocSrcFiles(): Promise<void> {
  await copy(
    resolvePath(process.cwd(), docsSrcFolder),
    resolvePath(process.cwd(), tempFolder)
  );

  // Adjust the tsconfig file for its new location.
  const tsconfigFile = resolvePath(process.cwd(), tempFolder, 'tsconfig.json');
  const tsconfigContent = await readFile(tsconfigFile, 'utf8');
  const tsconfig = JSON5.parse(tsconfigContent);
  const updatedTsconfig = {
    ...tsconfig,
    extends: `../${tsconfig.extends}`,
    include: (tsconfig.include as ReadonlyArray<string>).map((filepath) => {
      if (filepath.startsWith('../')) {
        return `../${filepath}`;
      }
      return filepath;
    })
  };
  await outputFile(tsconfigFile, JSON.stringify(updatedTsconfig, undefined, 2));
}

/**
 * Make the node modules accessable from the temp folder.
 */
async function prepareNodeModules(): Promise<void> {
  await ensureSymlink('node_modules', tempFolder + '/node_modules');
}

/**
 * Copy the library's dist files to the temp folder for processing.
 */
async function prepareDistFiles(): Promise<void> {
  await copy(
    resolvePath(process.cwd(), libDistFolder),
    resolvePath(process.cwd(), tempFolder, nodeModules, packageJson.name)
  );
}

/**
 * Proccess the files the make up the docs and get them ready to generate the docs.
 */
async function compile(production: boolean): Promise<void> {
  const rollupConfig =
    production
      ? (await import('../config/docs.rollup.config.prod')).default
      : (await import('../config/docs.rollup.config.dev')).default;

  const rollupConfigArray: ReadonlyArray<RollupOptions> = Array.isArray(rollupConfig)
    ? rollupConfig
    : [rollupConfig];

  const rollupBuilds = await Promise.all(
    rollupConfigArray.map(async (config) => {
      return rollup(config);
    })
  );

  // Compile the JavaScript.
  const buildOutputs = await Promise.all(
    rollupBuilds.map(async (rollupBuild, index) => {
      const config = rollupConfigArray[index];
      if (config.output === undefined) {
        return Promise.reject(new Error('output not defined'));
      }
      return rollupBuild.write(config.output);
    })
  );

  const preloadModuleFiles = buildOutputs[0].output.reduce((r, output) => [...r, output.fileName], []);

  // Rollup can't current generate iife when the source code uses dynamic imports.
  // WebPack is used instead to generate the es5 version of the docs.
  const webpackConfig =
    production
      ? (await import('../config/docs.webpack.config.prod')).default
      : (await import('../config/docs.webpack.config.dev')).default;
  const compiler = webpack(webpackConfig);

  const runCompiler = promisify(compiler.run.bind(compiler) as typeof compiler.run);
  const stats = await runCompiler();

  console.info(
    stats.toString({
      chunks: false,
      colors: true
    })
  );

  await compileCSS();
  await compileHTML(preloadModuleFiles);
}

async function compileHTML(preloadModules: ReadonlyArray<string>): Promise<void> {
  const indexHTML = await readFile(resolvePath(process.cwd(), tempFolder, 'index.html'), 'utf-8');
  const $ = cheerioLoad(indexHTML);

  preloadModules.forEach((file) => {
    $('head')
      .prepend(`<link rel="modulepreload" href="${file}">`);
  });

  // Inline css
  const css = await readFile(resolvePath(process.cwd(), tempFolder, 'style.css'), 'utf-8');
  $('head')
    .append(`<style>${css}</style>`);

  await outputFile(
    resolvePath(process.cwd(), docsDistFolder, 'index.html'),
    minifyHTML($.html(), {
      collapseBooleanAttributes: true,
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true,
      removeOptionalTags: true,
      removeRedundantAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      sortAttributes: true,
      sortClassName: true,
      useShortDoctype: true
    })
  );
}

async function compileCSS(): Promise<void> {
  const css = (await renderSass({
      file: resolvePath(process.cwd(), tempFolder, 'style.scss'),
      outputStyle: 'expanded'
    }))
      .css.toString('utf8');

  // tslint:disable: await-promise no-unsafe-any
  const processedCss = await postcss([
    postcssImport(),
    postcssContainerQueryProlyfill(),
    postcssFontMagician(),
    postcssPresetEnv({
      stage: 2,
      browsers: ['last 5 versions', '>= 1%', 'ie >= 11'],
      features: {
        'custom-properties': false
      }
    }),
    cssMediaQueryPacker(),
    colorGuard(),
    cssnano({
      autoprefixer: false,
      discardComments: {
        removeAll: true
      }
    }),
    postcssReporter()
  ])
    .process(css, {});
  // tslint:enable: await-promise no-unsafe-any

  const finalizedCss = processedCss.css.replace(/\n/g, '');

  await outputFile(
    resolvePath(process.cwd(), tempFolder, 'style.css'),
    finalizedCss
  );
}
