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

import del from 'del';
import { render as renderEjs } from 'ejs';
import { copy, ensureSymlink, outputFile, readFile } from 'fs-extra';
import { minify as minifyHTML } from 'html-minifier';
import JSON5 from 'json5';
import { Options as SassOptions, render as renderSassCbf, Result as SassResult } from 'node-sass';
import { resolve as resolvePath } from 'path';
import postcss from 'postcss';
import { rollup, RollupOptions } from 'rollup';
import { minify as minifyJS } from 'terser';
import { promisify } from 'util';
import webpack from 'webpack';

import { minScript as terserConfigScript } from '../config/terser.config.prod';
import packageJson from '../package.json';

const renderSass = promisify<SassOptions, SassResult>(renderSassCbf);

// Relative to root/cwd.
const nodeModules = 'node_modules';
const tempFolder = '.tmp/docs';
const docsSrcFolder = 'docs-src';
const docsDistFolder = 'docs';
const libSrcFolder = 'src';
const libDistFolder = 'dist';

const analysisFile = 'analysis.json';

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
  const moduleFiles = buildOutputs[0].output.reduce((r, output) => [...r, output.fileName], []);
  const mainModule = moduleFiles[0];

  // Rollup can't current generate iife when the source code uses dynamic imports.
  // WebPack is used instead to generate the es5 version of the docs.
  const webpackConfig =
    production
      ? (await import('../config/docs.webpack.config.prod')).default
      : (await import('../config/docs.webpack.config.dev')).default;
  const compiler = webpack(webpackConfig);

  const runCompiler = promisify(compiler.run.bind(compiler) as typeof compiler.run);
  const stats = await runCompiler();

  const statsData = stats.toJson('normal');
  const mainScript = statsData.assetsByChunkName.main as string;

  console.info(
    stats.toString({
      chunks: false,
      colors: true
    })
  );

  const analysis = await readFile(resolvePath(process.cwd(), tempFolder, analysisFile), 'utf-8');
  await outputFile(
    resolvePath(process.cwd(), docsDistFolder, analysisFile),
    production
      ? JSON.stringify(JSON5.parse(analysis))
      : JSON.stringify(JSON5.parse(analysis), undefined, 2)
  );

  const polyfills: ReadonlyArray<string> = [
    '@webcomponents/webcomponentsjs/webcomponents-loader.js',
    '@webcomponents/shadycss/scoping-shim.min.js',
    '@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js'
  ];
  const polyfillAssets: ReadonlyArray<string> = [
    '@webcomponents/webcomponentsjs/bundles'
  ];

  const polyfillDist = polyfills.map((file) => ({
    path: `vender/${file}`,
    // Don't load the following files in the index page. They will be loaded when needed else where.
    includeInIndex: !([
      '@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js'
    ].includes(file))
  }));

  const copyPolyfillSrcFileAssets = polyfillAssets.map(async (file) => copy(
    resolvePath(process.cwd(), tempFolder, nodeModules, file),
    resolvePath(process.cwd(), docsDistFolder, 'vender/', file)
  ));

  if (production) {
    await Promise.all([
      ...polyfills.map(async (file, i) => {
        const js = await readFile(resolvePath(process.cwd(), tempFolder, nodeModules, file), 'utf-8');

        const minifiedJS = minifyJS(js, terserConfigScript).code;

        await outputFile(
          resolvePath(process.cwd(), docsDistFolder, polyfillDist[i].path),
          minifiedJS
        );
      }),

      ...copyPolyfillSrcFileAssets
    ]);
  } else {
    await Promise.all([
      ...polyfills.map(async (file, i) => copy(
        resolvePath(process.cwd(), tempFolder, nodeModules, file),
        resolvePath(process.cwd(), docsDistFolder, polyfillDist[i].path)
      )),

      ...copyPolyfillSrcFileAssets
    ]);
  }

  const loadPolyfills = polyfillDist.reduce<ReadonlyArray<string>>(
    (r, b) => {
      if (!b.includeInIndex) {
        return r;
      }

      return [
        ...r,
        b.path
      ];
    },
    []
  );

  const essentialAssets: ReadonlyArray<string> = [
    analysisFile
  ];

  const css = await compileCSS(production);
  await compileHTML(
    production,
    mainModule,
    mainScript,
    loadPolyfills,
    css,
    {
       modules: moduleFiles,
       scripts: loadPolyfills,
       json: essentialAssets
    }
  );
}

async function compileHTML(
  production: boolean,
  mainModule: string,
  mainScript: string,
  polyfillFiles: ReadonlyArray<string>,
  inlineCss: string,
  preloadFiles: {
    readonly modules: ReadonlyArray<string>;
    readonly scripts: ReadonlyArray<string>;
    readonly json: ReadonlyArray<string>;
  }
): Promise<void> {

  const preloadTags: ReadonlyArray<string> = [
    ...preloadFiles.modules.map((file) => {
      return `<link rel="modulepreload" href="${file}">`;
    }),
    ...preloadFiles.scripts.map((file) => {
      return `<link rel="preload" href="${file}" as="script">`;
    }),
    ...preloadFiles.json.map((file) => {
      return `<link rel="preload" href="${file}" as="fetch" type="application/json" crossorigin="anonymous">`;
    })
  ];

  const description = 'Documentation for the the catalyst-labelable-mixin.';
  const title = 'catalyst-labelable-mixin Docs';

  const es5AdapterLoaderScript =
    production
      ? (await readFile(resolvePath(process.cwd(), tempFolder, 'es5-adapter-loader.js'), 'utf-8')).trim()
      : '';

  const indexHtmlEjs = await readFile(resolvePath(process.cwd(), tempFolder, 'index.html.ejs'), 'utf-8');

  const indexHTML = renderEjs(indexHtmlEjs, {
    production,
    title,
    description,
    mainModuleSrc: mainModule,
    mainScriptSrc: mainScript,
    preloadTags,
    es5AdapterLoaderScript,
    polyfillScriptsSrc: polyfillFiles,
    style: inlineCss
  }, {});

  const output =
    production
      ? minifyHTML(indexHTML, {
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
      : indexHTML;

  await outputFile(
    resolvePath(process.cwd(), docsDistFolder, 'index.html'),
    output
  );
}

async function compileCSS(production: boolean): Promise<string> {
  const css = (await renderSass({
      file: resolvePath(process.cwd(), tempFolder, 'style.scss'),
      outputStyle: 'expanded'
    }))
      .css.toString('utf8');

  const postcssConfig =
    production
      ? (await import('../config/postcss.config.prod')).default
      : (await import('../config/postcss.config.dev')).default;

  const processedCss = (await (
    postcss(postcssConfig.plugins)
      .process(css, postcssConfig.options) as PromiseLike<postcss.Result>
  )).css;

  return processedCss.replace(/\n/g, '');
}
