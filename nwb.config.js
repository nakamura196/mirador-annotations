const path = require('path');
const dotenv = require('dotenv');
const webpack = require('webpack');

// .envファイルを読み込む
const env = dotenv.config().parsed;

// 環境変数をオブジェクトに変換
const envKeys = Object.keys(env).reduce((prev, next) => ({
  ...prev,
  [`process.env.${next}`]: JSON.stringify(env[next]),
}), {});

console.log(envKeys);

module.exports = {
  npm: {
    esModules: true,
    umd: {
      externals: {
        react: 'React',
      },
      global: 'MiradorAnnotation',
    },
  },
  type: 'react-component',
  webpack: {
    aliases: {
      '@material-ui/core': path.resolve('./', 'node_modules', '@material-ui/core'),
      '@material-ui/styles': path.resolve('./', 'node_modules', '@material-ui/styles'),
      react: path.resolve('./', 'node_modules', 'react'),
      'react-dom': path.resolve('./', 'node_modules', 'react-dom'),
    },
    extra: {
      plugins: [
        new webpack.DefinePlugin(envKeys),
      ],
    },
  },
};
