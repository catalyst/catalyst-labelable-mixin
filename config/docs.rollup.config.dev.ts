/**
 * Rollup Config.
 */

import { RollupOptions } from 'rollup';
import rollupPluginCommonjs from 'rollup-plugin-commonjs';
import rollupPluginNodeResolve from 'rollup-plugin-node-resolve';
import rollupPluginTypescript from 'rollup-plugin-typescript';

const defaultConfig = {
  input: '.tmp/docs/main.ts',

  external: []
};

export const moduleConfig: RollupOptions = {
  ...defaultConfig,

  output: {
    dir: 'docs',
    entryFileNames: '[name].mjs',
    chunkFileNames: 'common/[hash].mjs',
    format: 'esm',
    sourcemap: false
  },

  plugins: [
    rollupPluginNodeResolve(),
    rollupPluginCommonjs(),
    rollupPluginTypescript({
      tsconfig: '.tmp/docs/tsconfig.json'
    })
  ]
};

// tslint:disable-next-line: readonly-array
const config = [moduleConfig];
export default config;
