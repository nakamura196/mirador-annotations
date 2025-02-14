const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

// 必要な環境変数のリスト
const requiredEnvVars = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID'
];

// 環境変数の取得（.envファイルまたはprocess.envから）
let envKeys = {};
try {
  // まず.envファイルを試す
  const env = dotenv.config().parsed || {};
  
  requiredEnvVars.forEach(key => {
    // .envファイルまたはprocess.envから値を取得
    const value = env[key] || process.env[key];
    envKeys[`process.env.${key}`] = JSON.stringify(value);
  });
} catch (error) {
  console.log('.envファイルが見つからない場合は process.env から読み込みます');
  requiredEnvVars.forEach(key => {
    envKeys[`process.env.${key}`] = JSON.stringify(process.env[key]);
  });
}

// デバッグ用：環境変数の確認
console.log('環境変数の確認:');
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
