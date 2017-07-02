const fs     = require('fs')
const assert = require('assert')
const util   = require('./util')


module.exports = () => {

  describe('--css <engine>', () => {

    describe('(no engine)', function() {
      const ctx = util.setupTestEnvironment(this.fullTitle())

      it('should exit with code 1', done => {
        util.runRaw(ctx.dir, ['--css'], (err, code, stdout, stderr) => {
          if (err) return done(err)
          assert.strictEqual(code, 1)
          done()
        })
      })

      it('should print usage', done => {
        util.runRaw(ctx.dir, ['--css'], (err, code, stdout) => {
          if (err) return done(err)
          assert.ok(/Usage: kaiju-cli/.test(stdout))
          assert.ok(/--help/.test(stdout))
          assert.ok(/--version/.test(stdout))
          done()
        })
      })

      it('should print argument missing', done => {
        util.runRaw(ctx.dir, ['--css'], (err, code, stdout, stderr) => {
          if (err) return done(err)
          assert.ok(/error: option .* argument missing/.test(stderr))
          done()
        })
      })
    })

    describeCSSEngine('less', 'less', util.NB_FILES)
    describeCSSEngine('scss', 'scss', util.NB_FILES)
    describeCSSEngine('stylus', 'styl', util.NB_FILES - 1)


    function describeCSSEngine(name, extension, fileLen) {
      describe(name, function() {
        const ctx = util.setupTestEnvironment(this.fullTitle())

        it(`should create basic app with ${name} files`, done => {
          util.run(ctx.dir, ['--css', name], (err, stdout) => {
            if (err) return done(err)
            ctx.files = util.parseCreatedFiles(stdout, ctx.dir)
            assert.equal(ctx.files.length, fileLen, `should have ${fileLen} files`)
            done()
          })
        })

        it(`should have "${name}" templates`, () => {
          assert.notEqual(ctx.files.indexOf(`client/src/widget/link/link.${extension}`), -1)
          assert.notEqual(ctx.files.indexOf(`client/src/util/style/index.${extension}`), -1)
          assert.notEqual(ctx.files.indexOf(`client/src/util/style/variable.${extension}`), -1)
          assert.notEqual(ctx.files.indexOf(`client/src/view/app/reset.${extension}`), -1)
          assert.notEqual(ctx.files.indexOf(`client/src/view/app/app.${extension}`), -1)
          assert.notEqual(ctx.files.indexOf(`client/src/view/user/user.${extension}`), -1)
        })

        it('should have installable dependencies', done => {
          util.npmInstall(ctx.dir, done)
        })

        it('should compile assets', done => {
          util.npmBuild(ctx.dir, done)
        })

        it('should have compiled files', () => {
          assert.ok(fs.existsSync(ctx.dir + '/server/public/app.js'))
          assert.ok(fs.existsSync(ctx.dir + '/server/public/app.css'))
        })
      })
    }

  })

}