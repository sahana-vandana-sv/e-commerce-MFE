const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('@module-federation/enhanced/webpack');
const deps = require('./package.json').dependencies;
// package.json says "workspace:*", which MF would read as "any version".
// Use the ui package's real version instead.
const uiVersion = require('@mfe/ui/package.json').version;

module.exports = {
  entry: './src/index.js',
  output: { publicPath: 'auto' },
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
  devServer: { port: 4000 },
  plugins: [
    new ModuleFederationPlugin({
      name: 'shell',
      remotes: {
        // alias used in imports : <container global name>@<url of its remoteEntry.js>
        productListing: 'productListing@http://localhost:4001/remoteEntry.js',
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
