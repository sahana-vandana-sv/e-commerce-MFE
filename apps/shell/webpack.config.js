const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const deps = require('./package.json').dependencies;

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
      },
    }),
    new HtmlWebpackPlugin({ template: './public/index.html' }),
  ],
};
