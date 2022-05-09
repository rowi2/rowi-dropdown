const path = require('path');

module.exports = {
  entry: './dist/rowi-dropdown.js',
  output: {
    filename: 'rowi-dropdown.min.js',
    path: path.resolve(__dirname, 'dist'),
  },
  // optimization: { minimize: false }
};