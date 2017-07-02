#!/usr/bin/env node

const fs       = require('fs')
const path     = require('path')
const ejs      = require('ejs')
const mkdirp   = require('mkdirp-promise')
const readline = require('readline')

const templateDir = 'template'

const MODE_0666 = parseInt('0666', 8)
const MODE_0755 = parseInt('0755', 8)


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


// Create an app name from a directory path, fitting npm naming requirements
function createAppName(pathName) {
  return path.basename(pathName).toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '')             // Trim - from end of text
    .replace(/^[-_.]+|-+$/g, '')
}

// Check if the given directory `path` is empty
function checkEmptyDirectory(path, fn) {
  fs.readdir(path, function (err, files) {
    if (err && err.code !== 'ENOENT') throw err
    fn(!files || !files.length)
  })
}

// Attach an around function; AOP.
function around(obj, method, fn) {
  const _this = this
  const old = obj[method]

  obj[method] = function() {
    const args = new Array(arguments.length)
    for (let i = 0; i < args.length; i++) args[i] = arguments[i]
    return fn.call(_this, old, args)
  }
}

// Attach a before function; AOP.
function before(obj, method, fn) {
  const _this = this
  const old = obj[method]

  obj[method] = function() {
    fn.call(_this)
    old.apply(this, arguments)
  }
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

  function render() {
    return ejs.render(contents, locals)
  }

  return { locals, render }
}


module.exports = {
  mkdir, write, copyTemplate, createAppName,
  checkEmptyDirectory, checkEmptyDirectory, around, before,
  confirm, copyTemplate, loadTemplate
}