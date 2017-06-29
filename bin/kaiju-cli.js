#!/usr/bin/env node

const ejs = require('ejs')
const fs = require('fs')
const path = require('path')
const program = require('commander')
const mkdirp = require('mkdirp-promise')
const readline = require('readline')
const chalk = require('chalk')
const sortedObject = require('sorted-object')

const _exit = process.exit
const _pkg = require('../package.json')
const templateDir = 'template'

const MODE_0666 = parseInt('0666', 8)
const MODE_0755 = parseInt('0755', 8)

// Re-assign process.exit because of commander
process.exit = exit


// --- Settings

program
  .usage('[options] [dir]')
  .arguments('<projectName>')
  .version(_pkg.version)
  .option('-c, --css <engine>', 'add stylesheet <engine> support (less|stylus|scss) (defaults to plain css)')
  .option('f, --force', 'force on non-empty directory')
  .parse(process.argv)

if (!exit.exited) {
  main()
}


// --- Init app

function main() {
  const destinationPath = program.args.shift() || '.'
  const appName = createAppName(path.resolve(destinationPath)) || 'hello-world'

  if (!program.css) program.css = 'less'
  if (program.css === 'stylus') program.css = 'styl'

  checkEmptyDirectory(destinationPath, empty => {
    if (empty || program.force) {
      createApplication(appName, destinationPath)
    } else {
      confirm('destination is not empty, continue ? [y/N] ', function (ok) {
        if (ok) {
          process.stdin.destroy()
          createApplication(appName, destinationPath)
        } else {
          console.log(chalk.bgRed.white('   Aborting   '))
          exit(1)
        }
      })
    }
  })
}


// --- Create App

function createApplication(name, path) {
  console.log()
  console.log()
  console.log(`   ##    ##     ###     ####        ##  ##     ##   `)
  console.log(`   ##   ##     ## ##     ##         ##  ##     ##   `)
  console.log(`   ##  ##     ##   ##    ##         ##  ##     ##   `)
  console.log(`   #####     ##     ##   ##         ##  ##     ##   `)
  console.log(`   ##  ##    #########   ##   ##    ##  ##     ##   `)
  console.log(`   ##   ##   ##     ##   ##   ##    ##  ##     ##   `)
  console.log(`   ##    ##  ##     ##  ####   ######    #######    `)
  console.log()
  console.log()


  // package.json
  const pkg = {
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


  // CSS Engine support
  switch (program.css) {
    case 'less':
      pkg.devDependencies['less'] = '2.7.2'
      pkg.devDependencies['less-loader'] = '4.0.4'
      break
    case 'styl':
      pkg.devDependencies['stylus'] = '0.54.5'
      pkg.devDependencies['stylus-loader'] = '3.0.1'
      break
    case 'scss':
      pkg.devDependencies['node-sass'] = '4.5.3'
      pkg.devDependencies['sass-loader'] = '6.0.6'
      break
  }

  if (program.css !== 'styl') {
    pkg.devDependencies['stylelint'] = '7.12.0'
    pkg.devDependencies['stylelint-webpack-plugin'] = '0.8.0'
  }

  // sort dependencies like npm(1)
  pkg.devDependencies = sortedObject(pkg.devDependencies)


  // Dynamic templates
  const appTpl      = loadTemplate('src/view/app/app.ts')
  const userTpl     = loadTemplate('src/view/user/user.ts')
  const linkTpl     = loadTemplate('src/widget/link/link.ts')
  const modulesTpl  = loadTemplate('build/common/modules.js')
  const pluginsTpl  = loadTemplate('build/common/plugins.js')
  const resolvesTpl = loadTemplate('build/common/resolves.js')

  // Template modules
  appTpl.locals.cssExtension  = program.css
  userTpl.locals.cssExtension = program.css
  linkTpl.locals.cssExtension = program.css
  
  modulesTpl.locals.cssExtension  = program.css
  pluginsTpl.locals.cssExtension  = program.css
  resolvesTpl.locals.cssExtension = program.css


  // Make Directories
  mkdir(path)
    .then(() => mkdir(path + '/client'))
    .then(() => {
      copyTemplate('_base/.gitignore', path + '/client/.gitignore')
      copyTemplate('_base/tsconfig.json', path + '/client/tsconfig.json')
      write(path + '/client/package.json', JSON.stringify(pkg, null, 2) + '\n')
    })
    .then(() => mkdir(path + '/client/build'))
    .then(() => {
      copyTemplate('build/prod.js', path + '/client/build/prod.js')
      copyTemplate('build/watch.js', path + '/client/build/watch.js')
      copyTemplate('build/tslint.json', path + '/client/build/tslint.json')
      if (program.css !== 'styl') {
        copyTemplate('build/stylelint.json', path + '/client/build/stylelint.json')
      }
    })
    .then(() => mkdir(path + '/client/build/devloop'))
    .then(() => {
      copyTemplate('build/devloop/webpack.js', path + '/client/build/devloop/webpack.js')
    })
    .then(() => mkdir(path + '/client/build/common'))
    .then(() => {
      write(path + '/client/build/common/modules.js', modulesTpl.render())
      write(path + '/client/build/common/plugins.js', pluginsTpl.render())
      write(path + '/client/build/common/resolves.js', resolvesTpl.render())
    })
    .then(() => mkdir(path + '/client/src'))
    .then(() => {
      copyTemplate('src/main.ts', path + '/client/src/main.ts')
      copyTemplate('src/router.ts', path + '/client/src/router.ts')
    })
    .then(() => mkdir(path + '/client/src/store'))
    .then(() => {
      copyTemplate('src/store/appStore.ts', path + '/client/src/store/appStore.ts')
    })
    .then(() => mkdir(path + '/client/src/util'))
    .then(() => {
      copyTemplate('src/util/router.ts', path + '/client/src/util/router.ts')
    })
    .then(() => mkdir(path + '/client/src/util/style'))
    .then(() => {
      copyCSSTemplate('src/util/style/index', path + '/client/src/util/style/index')
      copyCSSTemplate('src/util/style/variable', path + '/client/src/util/style/variable')
    })
    .then(() => mkdir(path + '/client/src/view'))
    .then(() => {
      copyTemplate('src/view/index.ts', path + '/client/src/view/index.ts')
    })
    .then(() => mkdir(path + '/client/src/view/app'))
    .then(() => {
      copyCSSTemplate('src/view/app/app', path + '/client/src/view/app/app')
      copyCSSTemplate('src/view/app/reset', path + '/client/src/view/app/reset')
      copyTemplate('src/view/app/index.ts', path + '/client/src/view/app/index.ts')
      copyTemplate('src/view/app/routeNotFound.ts', path + '/client/src/view/app/routeNotFound.ts')
      write(path + '/client/src/view/app/app.ts', appTpl.render())
    })
    .then(() => mkdir(path + '/client/src/view/user'))
    .then(() => {
      copyTemplate('src/view/user/index.ts', path + '/client/src/view/user/index.ts')
      copyCSSTemplate('src/view/user/user', path + '/client/src/view/user/user')
      write(path + '/client/src/view/user/user.ts', userTpl.render())
    })
    .then(() => mkdir(path + '/client/src/widget'))
    .then(() => mkdir(path + '/client/src/widget/link'))
    .then(() => {
      copyTemplate('src/widget/link/index.ts', path + '/client/src/widget/link/index.ts')
      copyCSSTemplate('src/widget/link/link', path + '/client/src/widget/link/link')
      write(path + '/client/src/widget/link/link.ts', linkTpl.render())
    })
    .then(() => mkdir(path + '/client/test'))
    .then(() => {
      copyTemplate('test/test.ts', path + '/client/test/test.ts')
      copyTemplate('test/mocha.d.ts', path + '/client/test/mocha.d.ts')
      copyTemplate('test/global.d.ts', path + '/client/test/global.d.ts')
    })
    .then(() => mkdir(path + '/client/typing'))
    .then(() => {
      copyTemplate('typing/global.d.ts', path + '/client/typing/global.d.ts')
    })
    // .then(() => console.log( chalk.bgRed.white('   after typing/global.d.ts   ') ))
    .then(() => {
      console.log()
      console.log('   install dependencies:')
      console.log('     cd %s && npm install', path)
      console.log()
      console.log('   run the app:')
      console.log('     yarn start')
      console.log()
    })
}


// --- Utils

// mkdir -p
function mkdir(path) {
  return mkdirp(path)
    .then(() => console.log('   \x1b[36mcreate\x1b[0m : ' + path))
    .catch(console.error)
}

// echo str > path
function write(path, str, mode) {
  fs.writeFileSync(path, str, { mode: mode || MODE_0666 })
  console.log('   \x1b[36mcreate\x1b[0m : ' + path)
}

// Copy file from template directory
function copyTemplate(from, to) {
  from = path.join(__dirname, '..', 'template', from)
  write(to, fs.readFileSync(from, 'utf-8'))
}

// Copy CSS files with the right extension
function copyCSSTemplate(template, destination) {
  switch (program.css) {
    case 'less':
      copyTemplate(`${ template }.less`, `${ destination }.less`)
      break
    case 'styl':
      copyTemplate(`${ template }.styl`, `${ destination }.styl`)
      break
    case 'scss':
      copyTemplate(`${ template }.scss`, `${ destination }.scss`)
      break
  }
}

// Create an app name from a directory path, fitting npm naming requirements
function createAppName(pathName) {
  return path.basename(pathName)
    .replace(/[^A-Za-z0-9.()!~*'-]+/g, '-')
    .replace(/^[-_.]+|-+$/g, '')
    .toLowerCase()
}

// Check if the given directory `path` is empty
function checkEmptyDirectory(path, fn) {
  fs.readdir(path, function (err, files) {
    if (err && err.code !== 'ENOENT') throw err
    fn(!files || !files.length)
  })
}

// Prompt for confirmation on STDOUT/STDIN
function confirm(msg, callback) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  rl.question(msg, input => {
    rl.close()
    callback(/^y|yes|ok|true$/i.test(input))
  })
}

// Copy file from template directory
function copyTemplate(from, to) {
  from = path.join(__dirname, '..', templateDir, from)
  write(to, fs.readFileSync(from, 'utf-8'))
}

// Load template file
function loadTemplate(name) {
  const contents = fs.readFileSync(path.join(__dirname, '..', templateDir, (name + '.ejs')), 'utf-8')
  const locals = Object.create(null)

  function render () {
    return ejs.render(contents, locals)
  }

  return { locals, render }
}

// Graceful exit for async STDIO
function exit(code) {
  const done = () => {
    if (!(draining--)) _exit(code)
  }

  let draining = 0
  const streams = [ process.stdout, process.stderr ]

  exit.exited = true

  streams.forEach(stream => {
    // submit empty write request and wait for completion
    draining += 1
    stream.write('', done)
  })

  done()
}