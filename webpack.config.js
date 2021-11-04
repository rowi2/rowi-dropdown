const path = require('path');

module.exports = {
  entry: './rowi-dropdown.js',
  output: {
    filename: 'rowi-dropdown.min.js',
    path: path.resolve(__dirname),
  },
  optimization: { minimize: false }
};