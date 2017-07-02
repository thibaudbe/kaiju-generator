const rimraf = require('rimraf')
const path   = require('path')
const mkdirp = require('mkdirp')
const assert = require('assert')
const exec   = require('child_process').exec
const spawn  = require('child_process').spawn

const PKG_PATH = path.resolve(__dirname, '..', 'package.json')
const TEMP_DIR = path.resolve(__dirname, '..', 'tmp', String(process.pid + Math.random()))
const BIN_PATH = path.resolve(path.dirname(PKG_PATH), require(PKG_PATH).bin.kaiju)
const NB_FILES = 49


function parseCreatedFiles(output, dir) {
  const files = []
  const lines = output.split(/[\r\n]+/)
  let match

  for (let i = 0; i < lines.length; i++) {
    if ((match = /create.*?: (.*)$/.exec(lines[i]))) {
      let file = match[1]

      if (dir) {
        file = path.resolve(dir, file)
        file = path.relative(dir, file)
      }

      file = file.replace(/\\/g, '/')
      files.push(file)
    }
  }

  return files
}

function cleanup({ dir, cb }) {
  rimraf(dir || TEMP_DIR, cb)
}

function childEnvironment() {
  const env = {}

  // copy the environment except for npm veriables
  for (let key in process.env) {
    if (key.substr(0, 4) !== 'npm_') {
      env[key] = process.env[key]
    }
  }

  return env
}

function npmInstall(dir, cb) {
  const env = childEnvironment()

  exec('npm install', { cwd: dir + '/client', env }, (err, stderr) => {
    if (err) {
      err.message += stderr
      cb(err)
      return
    }
    cb()
  })
}

function npmBuild(dir, cb) {
  const env = childEnvironment()

  exec('npm run-script build', { cwd: dir + '/client', env }, (err, stderr) => {
    if (err) {
      err.message += stderr
      cb(err)
      return
    }
    cb()
  })
}

function listCompiledFiles(dir, cb) {
  const env = childEnvironment()

  exec('ls', { cwd: dir + '/server/public/', env }, (err, stderr) => {
    if (err) {
      err.message += stderr
      cb(err)
      return
    }
    cb()
  })
}

function run(dir, args, cb) {
  runRaw(dir, args, (err, code, stdout, stderr) => {
    if (err) return cb(err)

    process.stderr.write(stripWarnings(stderr))

    try {
      assert.equal(stripWarnings(stderr), '')
      assert.strictEqual(code, 0)
    } catch (e) {
      return cb(e)
    }

    cb(null, stripColors(stdout))
  })
}

function runRaw(dir, args, cb) {
  const argv = [BIN_PATH].concat(args)
  const exec = process.argv[0]
  let stderr = ''
  let stdout = ''

  const child = spawn(exec, argv, { cwd: dir })

  child.stdout.setEncoding('utf8')
  child.stdout.on('data', str => stdout += str)
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', str => stderr += str)

  child.on('close', onclose)
  child.on('error', cb)

  function onclose(code) {
    cb(null, code, stdout, stderr)
  }
}

function setupTestEnvironment(name) {
  const ctx = {}

  before('create environment', done => {
    ctx.dir = path.join(TEMP_DIR, name.replace(/[<>]/g, ''))
    mkdirp(ctx.dir, done)
  })

  after('cleanup environment', done => {
    cleanup({ dir: ctx.dir, cb: done })
  })

  return ctx
}

function stripColors(str) {
  return str.replace(/\x1b\[(\d+)m/g, '_color_$1_')
}

function stripWarnings(str) {
  return str.replace(/\n(?:\x20{2}warning: [^\n]+\n)+\n/g, '')
}


module.exports = {
  runRaw, parseCreatedFiles, cleanup, npmInstall, npmBuild,
  run, setupTestEnvironment, NB_FILES
}