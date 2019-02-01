/**
 * Rollup Config.
 */

import { RollupOptions } from 'rollup';
import rollupPluginBabel from 'rollup-plugin-babel';
import rollupPluginCommonjs from 'rollup-plugin-commonjs';
import rollupPluginCopyAssets from 'rollup-plugin-copy-assets';
import rollupPluginNodeResolve from 'rollup-plugin-node-resolve';
import { terser as rollupPluginTerser } from 'rollup-plugin-terser';
import rollupPluginTypescript from 'rollup-plugin-typescript';

import babelConfigScript from './babel.config.script.prod';
import {
  minModule,
  minScript as terserConfigMin
} from './terser.config.prod';

const defaultConfig = {
  input: '.tmp/docs/main.ts',

  external: []
};

export const moduleConfig: RollupOptions = {
  ...defaultConfig,

  output: {
    dir: 'docs',
    entryFileNames: '[name].min.mjs',
    chunkFileNames: 'common/[hash].min.mjs',
    format: 'esm',
    sourcemap: false
  },

  plugins: [
    rollupPluginNodeResolve(),
    rollupPluginCommonjs(),
    rollupPluginTypescript(),
    rollupPluginTerser(minModule)
  ]
};

export const webcomponentsConfig: RollupOptions = {

  input: 'node_modules/@webcomponents/webcomponentsjs/webcomponents-loader.js',

  output: {
    dir: 'docs/vender/webcomponents',
    entryFileNames: '[name].min.js',
    format: 'iife',
    sourcemap: false
  },

  plugins: [
    rollupPluginCopyAssets({
      assets: [
        'node_modules/@webcomponents/webcomponentsjs/bundles',
        'node_modules/@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js',
        'node_modules/@webcomponents/shadycss/scoping-shim.min.js'
      ]
    }),
    rollupPluginBabel({
      babelrc: false,
      ...babelConfigScript
    }),
    rollupPluginTerser(terserConfigMin)
  ]
};

// tslint:disable-next-line: readonly-array
const config = [moduleConfig, webcomponentsConfig];
export default config;
