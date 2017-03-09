module.exports = {
  entry: './src/index.js',
  output: {
    path: './build',
    filename: 'cozy-sun-bear.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: "babel-loader"
    }]
  }
};
