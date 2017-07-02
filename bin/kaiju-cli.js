#!/usr/bin/env node

const path    = require('path')
const chalk   = require('chalk')
const program = require('commander')
const sortedObject = require('sorted-object')

const _exit = process.exit

// Re-assign process.exit because of commander
process.exit = exit

const _pkg = require('../package.json')
const util = require('../src/util')
const pkg  = require('../src/pkg')


// --- CLI

util.around(program, 'optionMissingArgument', (fn, args) => {
  program.outputHelp()
  fn.apply(this, args)
  return { args: [], unknown: [] }
})

util.before(program, 'outputHelp', () => {
  // track if help was shown for unknown option
  this._helpShown = true
})

util.before(program, 'unknownOption', () => {
  // allow unknown options if help was shown, to prevent trailing error
  this._allowUnknownOption = this._helpShown

  // show help if not yet shown
  if (!this._helpShown) {
    program.outputHelp()
  }
})

program
  .usage('[options] [dir]')
  .version(_pkg.version)
  .description('Kaiju generator')
  .option('-c, --css <engine>', 'add stylesheet <engine> support (less|stylus|scss) (default to plain css)', 'less')
  .option('f, --force', 'force on non-empty directory')
  .parse(process.argv)

if (!exit.exited) {
  main()
}


// --- Init app

function main() {
  const destinationPath = program.args.shift() || '.'
  const appName = util.createAppName(path.resolve(destinationPath)) || 'hello-world'

  if (!program.css) program.css = 'less'
  if (program.css === 'stylus') program.css = 'styl'

  util.checkEmptyDirectory(destinationPath, empty => {
    if (empty || program.force) {
      createApplication(appName, destinationPath)
    } else {
      confirm('destination is not empty, continue ? [y/N] ', ok => {
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
  const packageJson = pkg(name)

  // CSS Engine support
  switch (program.css) {
    case 'less':
      packageJson.devDependencies['less'] = '2.7.2'
      packageJson.devDependencies['less-loader'] = '4.0.4'
      break
    case 'styl':
      packageJson.devDependencies['stylus'] = '0.54.5'
      packageJson.devDependencies['stylus-loader'] = '3.0.1'
      break
    case 'scss':
      packageJson.devDependencies['node-sass'] = '4.5.3'
      packageJson.devDependencies['sass-loader'] = '6.0.6'
      break
  }

  if (program.css !== 'styl') {
    packageJson.devDependencies['stylelint'] = '7.12.0'
    packageJson.devDependencies['stylelint-webpack-plugin'] = '0.8.0'
  }

  // sort dependencies like npm(1)
  packageJson.devDependencies = sortedObject(packageJson.devDependencies)

  // Dynamic templates
  const appTpl      = util.loadTemplate('src/view/app/app.ts')
  const userTpl     = util.loadTemplate('src/view/user/user.ts')
  const linkTpl     = util.loadTemplate('src/widget/link/link.ts')
  const modulesTpl  = util.loadTemplate('build/common/modules.js')
  const pluginsTpl  = util.loadTemplate('build/common/plugins.js')
  const resolvesTpl = util.loadTemplate('build/common/resolves.js')

  // Template modules
  appTpl.locals.cssExtension  = program.css
  userTpl.locals.cssExtension = program.css
  linkTpl.locals.cssExtension = program.css
  
  modulesTpl.locals.cssExtension  = program.css
  pluginsTpl.locals.cssExtension  = program.css
  resolvesTpl.locals.cssExtension = program.css

  // Create app
  util.mkdir(path)
    .then(() => util.mkdir(path + '/client'))
    .then(() => {
      util.copyTemplate('_base/gitignore', path + '/client/.gitignore')
      util.copyTemplate('_base/tsconfig.json', path + '/client/tsconfig.json')
      util.write(path + '/client/package.json', JSON.stringify(packageJson, null, 2) + '\n')
    })
    .then(() => util.mkdir(path + '/client/build'))
    .then(() => {
      util.copyTemplate('build/prod.js', path + '/client/build/prod.js')
      util.copyTemplate('build/watch.js', path + '/client/build/watch.js')
      util.copyTemplate('build/tslint.json', path + '/client/build/tslint.json')
      if (program.css !== 'styl') {
        util.copyTemplate('build/stylelint.json', path + '/client/build/stylelint.json')
      }
    })
    .then(() => util.mkdir(path + '/client/build/devloop'))
    .then(() => {
      util.copyTemplate('build/devloop/webpack.js', path + '/client/build/devloop/webpack.js')
    })
    .then(() => util.mkdir(path + '/client/build/common'))
    .then(() => {
      util.write(path + '/client/build/common/modules.js', modulesTpl.render())
      util.write(path + '/client/build/common/plugins.js', pluginsTpl.render())
      util.write(path + '/client/build/common/resolves.js', resolvesTpl.render())
    })
    .then(() => util.mkdir(path + '/client/src'))
    .then(() => {
      util.copyTemplate('src/main.ts', path + '/client/src/main.ts')
      util.copyTemplate('src/router.ts', path + '/client/src/router.ts')
    })
    .then(() => util.mkdir(path + '/client/src/store'))
    .then(() => {
      util.copyTemplate('src/store/appStore.ts', path + '/client/src/store/appStore.ts')
    })
    .then(() => util.mkdir(path + '/client/src/util'))
    .then(() => {
      util.copyTemplate('src/util/router.ts', path + '/client/src/util/router.ts')
    })
    .then(() => util.mkdir(path + '/client/src/util/style'))
    .then(() => {
      copyCSSTemplate('src/util/style/index', path + '/client/src/util/style/index')
      copyCSSTemplate('src/util/style/variable', path + '/client/src/util/style/variable')
    })
    .then(() => util.mkdir(path + '/client/src/view'))
    .then(() => {
      util.copyTemplate('src/view/index.ts', path + '/client/src/view/index.ts')
    })
    .then(() => util.mkdir(path + '/client/src/view/app'))
    .then(() => {
      copyCSSTemplate('src/view/app/app', path + '/client/src/view/app/app')
      copyCSSTemplate('src/view/app/reset', path + '/client/src/view/app/reset')
      util.copyTemplate('src/view/app/index.ts', path + '/client/src/view/app/index.ts')
      util.copyTemplate('src/view/app/routeNotFound.ts', path + '/client/src/view/app/routeNotFound.ts')
      util.write(path + '/client/src/view/app/app.ts', appTpl.render())
    })
    .then(() => util.mkdir(path + '/client/src/view/user'))
    .then(() => {
      util.copyTemplate('src/view/user/index.ts', path + '/client/src/view/user/index.ts')
      copyCSSTemplate('src/view/user/user', path + '/client/src/view/user/user')
      util.write(path + '/client/src/view/user/user.ts', userTpl.render())
    })
    .then(() => util.mkdir(path + '/client/src/widget'))
    .then(() => util.mkdir(path + '/client/src/widget/link'))
    .then(() => {
      util.copyTemplate('src/widget/link/index.ts', path + '/client/src/widget/link/index.ts')
      copyCSSTemplate('src/widget/link/link', path + '/client/src/widget/link/link')
      util.write(path + '/client/src/widget/link/link.ts', linkTpl.render())
    })
    .then(() => util.mkdir(path + '/client/test'))
    .then(() => {
      util.copyTemplate('test/test.ts', path + '/client/test/test.ts')
      util.copyTemplate('test/mocha.d.ts', path + '/client/test/mocha.d.ts')
      util.copyTemplate('test/global.d.ts', path + '/client/test/global.d.ts')
    })
    .then(() => util.mkdir(path + '/client/typing'))
    .then(() => {
      util.copyTemplate('typing/global.d.ts', path + '/client/typing/global.d.ts')
    })
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


// Copy CSS files with the right extension
function copyCSSTemplate(template, destination) {
  switch (program.css) {
    case 'less':
      util.copyTemplate(`${ template }.less`, `${ destination }.less`)
      break
    case 'styl':
      util.copyTemplate(`${ template }.styl`, `${ destination }.styl`)
      break
    case 'scss':
      util.copyTemplate(`${ template }.scss`, `${ destination }.scss`)
      break
  }
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
    draining += 1
    stream.write('', done)
  })

  done()
}
