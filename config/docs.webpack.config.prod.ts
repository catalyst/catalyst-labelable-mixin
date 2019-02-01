import { resolve as resolvePath } from 'path';
import { Configuration } from 'webpack';

import babelOptions from './babel.config.script.prod';

// Relative to root/cwd.
const tempFolder = '.tmp/docs';
const docsDistFolder = 'docs';

const config: Configuration = {
  mode: 'production',
  entry: resolvePath(process.cwd(), tempFolder, 'main.ts'),
  module: {
    rules: [
      {
        test: /\.tsx?$/,
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
  target: 'web'
};

export default config;
