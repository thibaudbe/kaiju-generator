#!/usr/bin/env node

module.exports = (name) => {
  return {
    "name": `${ name }-client`,
    "version": "0.1.0",
    "scripts": {
      "start": "npm run watch",
      "build": "webpack -p --config build/prod.js",
      "watch": "node_modules/webpack/bin/webpack.js --watch --config build/watch.js",
      "devloop": "node node_modules/devloop/bin/main.js",
      "pretest": "npm run build && tsc test/mocha.d.ts test/global.d.ts test/test.ts --outDir ./test --noImplicitAny --strictNullChecks",
      "test": "mocha test/test.js --ui tdd"
    },
    "devDependencies": {
      "abyssa": "8.0.5",
      "css-loader": "0.28.4",
      "extract-text-webpack-plugin": "2.1.2",
      "kaiju": "0.26.0",
      "mocha": "3.4.2",
      "snabbdom": "0.6.7",
      "space-lift": "0.3.0",
      "style-loader": "0.18.2",
      "ts-loader": "2.2.1",
      "tslint": "4.5.1",
      "tslint-loader": "3.5.3",
      "tslint-microsoft-contrib": "5.0.0",
      "typescript": "2.3.4",
      "webpack": "2.6.1"
    }
  }
}