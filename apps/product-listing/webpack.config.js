const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('@module-federation/enhanced/webpack');
const deps = require('./package.json').dependencies;
// package.json says "workspace:*", which MF would read as "any version".
// Use the ui package's real version instead.
const uiVersion = require('@mfe/ui/package.json').version;

module.exports = {
  entry: './src/index.js',
  output: {
    // 'auto' resolves chunk URLs from wherever remoteEntry.js was loaded from,
    // so when the shell (on :4000) pulls in this remote, lazy chunks are still
    // fetched from :4001 instead of the shell's origin.
    publicPath: 'auto',
  },
  resolve: { extensions: ['.js', '.jsx'] },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: { presets: [['@babel/preset-react', { runtime: 'automatic' }]] },
      },
    ],
  },
  devServer: {
    port: 4001,
    // HMR fetches *.hot-update.json with fetch(); when this remote is running
    // inside the shell page (:4000) that request is cross-origin.
    headers: { 'Access-Control-Allow-Origin': '*' },
  },
  plugins: [
    new ModuleFederationPlugin({
      // Global name of the container. Must be a valid JS identifier (no
      // hyphens), because the shell looks it up as window.productListing.
      name: 'productListing',
      filename: 'remoteEntry.js',
      exposes: {
        './ProductList': './src/ProductList',
      },
      shared: {
        react: { singleton: true, requiredVersion: deps.react },
        'react-dom': { singleton: true, requiredVersion: deps['react-dom'] },
        // Stateless UI kit: share it to avoid duplicate downloads, but not as a
        // singleton. An app that needs an incompatible major gets its own copy.
        '@mfe/ui': { requiredVersion: `^${uiVersion}` },
      },
      // MF 2.0 generates TypeScript types for remotes by default; this repo is JS.
      dts: false,
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
};
