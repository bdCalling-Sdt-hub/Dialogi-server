const path = require('path');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'production', // or 'development' if you prefer
  entry: './src/server.js', // entry point of your application
  output: {
    path: path.resolve(__dirname, 'dist'), // output directory
    filename: 'index.js' // output bundle filename
  },
  target: 'node', // for building a Node.js application
  externals: [nodeExternals()], // exclude Node.js core modules
  plugins: [
    new Dotenv(),
    // DefinePlugin will replace process.env with the corresponding environment variables
    new webpack.DefinePlugin({
      'process.env': JSON.stringify(process.env)
    })
  ],
  module: {
    rules: [
      // Babel loader configuration
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
