import { resolve as resolvePath } from 'path';
import { Configuration } from 'webpack';

// Relative to root/cwd.
const tempFolder = '.tmp/docs';
const docsDistFolder = 'docs';

const config: Configuration = {
  mode: 'development',
  entry: resolvePath(process.cwd(), tempFolder, 'main.ts'),
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
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
    filename: 'main.js',
    chunkFilename: `common/[hash:8].js`
  },
  resolve: {
    extensions: ['.js', '.ts']
  },
  target: 'web'
};

export default config;
