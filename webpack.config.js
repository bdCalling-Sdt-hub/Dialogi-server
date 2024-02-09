const path = require('path');

module.exports = {
  mode: 'production', // or 'development' if you prefer
  entry: './src/server.js', // entry point of your application
  output: {
    path: path.resolve(__dirname, 'dist'), // output directory
    filename: 'index.js' // output bundle filename
  },
  target: 'node', // for building a Node.js application
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
