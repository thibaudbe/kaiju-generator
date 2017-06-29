const path    = require('path')
const context = path.resolve(__dirname, '..')
const output  = path.resolve(__dirname, '../../server/public')

const resolves = require('./common/resolves')
const modules  = require('./common/modules')
const plugins  = require('./common/plugins')

module.exports = {
  context: context,

  entry: ['./src/main.ts'],

  output: {
    path: output,
    filename: 'app.js'
  },

  resolve: resolves,
  
  module: modules({}),

  plugins: plugins({ filename: 'app.css' }),

  devtool: 'source-map'
}