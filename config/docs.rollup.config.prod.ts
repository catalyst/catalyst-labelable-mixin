/**
 * Rollup Config.
 */

import { RollupOptions } from 'rollup';
import rollupPluginBabel from 'rollup-plugin-babel';
import rollupPluginCommonjs from 'rollup-plugin-commonjs';
import rollupPluginNodeResolve from 'rollup-plugin-node-resolve';
import { terser as rollupPluginTerser } from 'rollup-plugin-terser';
import rollupPluginTypescript from 'rollup-plugin-typescript';

import babelConfigModule from './babel.config.module.prod';
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
    rollupPluginBabel({
      babelrc: false,
      extensions: ['.js', '.mjs', '.ts'],
      ...babelConfigModule
    }),
    rollupPluginTerser(minModule)
  ]
};

export const es5AdapterLoader: RollupOptions = {

  input: '.tmp/docs/es5-adapter-loader.ts',

  output: {
    dir: '.tmp/docs',
    entryFileNames: '[name].js',
    format: 'iife',
    sourcemap: false
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
    rollupPluginTerser(terserConfigMin)
  ]
};

// tslint:disable-next-line: readonly-array
const config = [moduleConfig, es5AdapterLoader];
export default config;
