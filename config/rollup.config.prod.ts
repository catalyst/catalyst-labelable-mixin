/**
 * Rollup Config.
 */

import { RollupOptions } from 'rollup';
import rollupPluginBabel from 'rollup-plugin-babel';
import rollupPluginCommonjs from 'rollup-plugin-commonjs';
import rollupPluginNodeResolve from 'rollup-plugin-node-resolve';
import rollupPluginPrettier from 'rollup-plugin-prettier';
import { terser as rollupPluginTerser } from 'rollup-plugin-terser';
import rollupPluginTypescript from 'rollup-plugin-typescript';

import babelConfigModule from './babel.config.module.prod';
import babelConfigScript from './babel.config.script.prod';
import {
  minScript as terserConfigScript,
  prettyModule as terserConfigModule
} from './terser.config.prod';

const defaultConfig = {
  input: './src/catalyst-labelable-mixin.ts',

  output: {
    dir: './dist'
  },

  external: [],

  treeshake: {
    pureExternalModules: true,
    propertyReadSideEffects: false
  }
};

export const esmConfig: RollupOptions = {
  ...defaultConfig,

  output: {
    ...defaultConfig.output,
    entryFileNames: '[name].mjs',
    chunkFileNames: 'common/[hash].mjs',
    format: 'esm',
    sourcemap: false
  },

  plugins: [
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

export const iifeConfig: RollupOptions = {
  ...defaultConfig,

  output: {
    ...defaultConfig.output,
    entryFileNames: '[name].min.js',
    chunkFileNames: 'common/[hash].min.js',
    name: 'moduleExports',
    format: 'iife',
    sourcemap: false,
    banner: 'window.CatalystElements = window.CatalystElements || {};',
    footer: 'window.CatalystElements = Object.assign(window.CatalystElements, moduleExports);'
  },

  plugins: [
    rollupPluginNodeResolve(),
    rollupPluginCommonjs(),
    rollupPluginTypescript(),
    rollupPluginBabel({
      babelrc: false,
      extensions: ['.js', '.mjs', '.ts'],
      ...babelConfigScript
    }),
    rollupPluginTerser(terserConfigScript)
  ]
};

// Module must be listed first in following array, followed by script.
// tslint:disable-next-line: no-unnecessary-type-annotation
const config: [RollupOptions, RollupOptions] = [esmConfig, iifeConfig];
export default config;
