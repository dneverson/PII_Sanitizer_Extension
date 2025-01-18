const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/popup/index.tsx',
    content: './src/content/content.ts',
    background: './src/background/background.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { 
          from: 'src/popup/index.html', 
          to: 'popup.html'
        },
        { 
          from: 'public/icon16.png',
          to: 'icon16.png'
        },
        { 
          from: 'public/icon48.png',
          to: 'icon48.png'
        },
        { 
          from: 'public/icon128.png',
          to: 'icon128.png'
        },
        {
          from: 'manifest.json',
          to: 'manifest.json'
        }
      ],
    }),
  ],
  mode: 'production',
};