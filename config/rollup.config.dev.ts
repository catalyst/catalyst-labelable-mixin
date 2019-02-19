/**
 * Rollup Config.
 */

import { RollupOptions } from 'rollup';
import rollupPluginCommonjs from 'rollup-plugin-commonjs';
import rollupPluginNodeResolve from 'rollup-plugin-node-resolve';
import rollupPluginTypescript from 'rollup-plugin-typescript';

export const esmConfig: RollupOptions = {
  input: './src/catalyst-labelable-mixin.ts',

  output: {
    dir: './build',
    entryFileNames: '[name].mjs',
    chunkFileNames: 'common/[hash].mjs',
    format: 'esm',
    sourcemap: false
  },

  external: [],

  treeshake: {
    pureExternalModules: true,
    propertyReadSideEffects: false
  },

  plugins: [
    rollupPluginNodeResolve(),
    rollupPluginCommonjs(),
    rollupPluginTypescript({
      tsconfig: 'tsconfig.json'
    })
  ]
};

// tslint:disable-next-line: readonly-array
const config = [esmConfig];
export default config;
