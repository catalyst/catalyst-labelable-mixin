import { resolve as resolvePath } from 'path';
import WebpackPluginTerser from 'terser-webpack-plugin';
import { Configuration } from 'webpack';

import babelOptions from './babel.config.script.prod';
import { minScript as terserConfig } from './terser.config.prod';

// Relative to root/cwd.
const tempFolder = '.tmp/docs';
const docsDistFolder = 'docs';

const config: Configuration = {
  mode: 'production',
  entry: resolvePath(process.cwd(), tempFolder, 'main.ts'),
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'babel-loader',
            options: babelOptions
          },
          {
            loader: 'ts-loader'
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  output: {
    path: resolvePath(process.cwd(), docsDistFolder),
    filename: 'main.min.js',
    chunkFilename: `common/[hash:8].min.js`
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  target: 'web',
  optimization: {
    minimizer: [
      new WebpackPluginTerser({
        terserOptions: terserConfig
      })
    ]
  }
};

export default config;
