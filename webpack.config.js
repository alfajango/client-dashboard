var webpack = require('webpack');

// returns a Compiler instance
var compiler = webpack({
  debug: true,
  noInfo: false,
  entry: 'app/containers/App',
  output: {
    path: 'public/javascripts',
    publicPath: '',
    filename: 'components.js'
  },
  module: {
    loaders: [{test: /\.js$/, include: './src', loaders: ['babel', 'eslint']}]
  }
});
