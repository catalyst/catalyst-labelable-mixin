/**
 * Rollup Config.
 */

import { RollupOptions } from 'rollup';
import rollupPluginBabel from 'rollup-plugin-babel';
import rollupPluginCommonjs from 'rollup-plugin-commonjs';
import rollupPluginMultiEntry from 'rollup-plugin-multi-entry';
import rollupPluginNodeResolve from 'rollup-plugin-node-resolve';
import rollupPluginPrettier from 'rollup-plugin-prettier';
import { terser as rollupPluginTerser } from 'rollup-plugin-terser';
import rollupPluginTypescript from 'rollup-plugin-typescript';

import babelConfigModule from './babel.config.module.prod';
import {
  prettyModule as terserConfigModule
} from './terser.config.prod';

const defaultConfig = {
  output: {
    dir: './test'
  },

  external: [],

  treeshake: {
    pureExternalModules: true,
    propertyReadSideEffects: false
  }
};

export const componentConfig: RollupOptions = {
  ...defaultConfig,

  input: './src/catalyst-labelable-mixin.ts',

  output: {
    ...defaultConfig.output,
    entryFileNames: 'test-component.js',
    chunkFileNames: 'test-component-[hash].js',
    name: 'moduleExports',
    format: 'iife',
    sourcemap: false,
    banner: 'window.CatalystElements = window.CatalystElements || {};',
    footer: 'window.CatalystElements = Object.assign(window.CatalystElements, moduleExports);'
  },

  plugins: [
    rollupPluginNodeResolve(),
    rollupPluginCommonjs(),
    rollupPluginTypescript({
      tsconfig: 'tsconfig.json'
    }),
    rollupPluginBabel({
      babelrc: false,
      extensions: ['.js', '.mjs', '.ts'],
      ...babelConfigModule
    }),
    rollupPluginTerser(terserConfigModule),
    rollupPluginPrettier({
      parser: 'babel'
    })
  ]
};

export const testFilesConfig: RollupOptions = {
  ...defaultConfig,

  input: './test/**/*[!.d].ts',

  output: {
    ...defaultConfig.output,
    entryFileNames: 'tests.js',
    chunkFileNames: 'tests-[hash].js',
    name: 'moduleExports',
    format: 'iife',
    sourcemap: false
  },

  plugins: [
    rollupPluginMultiEntry(),
    rollupPluginNodeResolve(),
    rollupPluginCommonjs(),
    rollupPluginTypescript(),
    rollupPluginBabel({
      babelrc: false,
      extensions: ['.js', '.mjs', '.ts'],
      ...babelConfigModule
    }),
    rollupPluginTerser(terserConfigModule),
    rollupPluginPrettier({
      parser: 'babel'
    })
  ]
};

// tslint:disable-next-line: no-unnecessary-type-annotation
const config: [RollupOptions, RollupOptions] = [
  componentConfig,
  testFilesConfig
];
export default config;
