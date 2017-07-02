const fs     = require('fs')
const path   = require('path')
const assert = require('assert')
const validateNpmName = require('validate-npm-package-name')
const util   = require('./util')


module.exports = () => {

  describe('(no args)', function() {
    const ctx = util.setupTestEnvironment(this.fullTitle())

    it('should create basic app', done => {
      util.runRaw(ctx.dir, [], (err, code, stdout, stderr) => {
        if (err) return done(err)
        ctx.files  = util.parseCreatedFiles(stdout, ctx.dir)
        ctx.stderr = stderr
        ctx.stdout = stdout
        assert.equal(ctx.files.length, util.NB_FILES)
        done()
      })
    })

    it('should have basic files', () => {
      assert.notEqual(ctx.files.indexOf('client/.gitignore'), -1)
      assert.notEqual(ctx.files.indexOf('client/package.json'), -1)
      assert.notEqual(ctx.files.indexOf('client/tsconfig.json'), -1)
    })

    it('should have "build" files', () => {
      assert.notEqual(ctx.files.indexOf('client/build/tslint.json'), -1)
      assert.notEqual(ctx.files.indexOf('client/build/stylelint.json'), -1)
      assert.notEqual(ctx.files.indexOf('client/build/watch.js'), -1)
      assert.notEqual(ctx.files.indexOf('client/build/prod.js'), -1)
      assert.notEqual(ctx.files.indexOf('client/build/devloop/webpack.js'), -1)
      assert.notEqual(ctx.files.indexOf('client/build/common/modules.js'), -1)
      assert.notEqual(ctx.files.indexOf('client/build/common/plugins.js'), -1)
      assert.notEqual(ctx.files.indexOf('client/build/common/resolves.js'), -1)
    })

    it('should have "test" files', () => {
      assert.notEqual(ctx.files.indexOf('client/test/test.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/test/global.d.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/test/mocha.d.ts'), -1)
    })

    it('should have "typing" files', () => {
      assert.notEqual(ctx.files.indexOf('client/typing/global.d.ts'), -1)
    })

    it('should have "src" files', () => {
      assert.notEqual(ctx.files.indexOf('client/src/main.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/router.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/store/appStore.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/util/router.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/widget/link/index.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/widget/link/link.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/view/index.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/view/app/index.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/view/app/app.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/view/app/routeNotFound.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/view/user/index.ts'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/view/user/user.ts'), -1)
    })

    it('should have "less" templates', () => {
      assert.notEqual(ctx.files.indexOf('client/src/widget/link/link.less'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/util/style/index.less'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/util/style/variable.less'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/view/app/reset.less'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/view/app/app.less'), -1)
      assert.notEqual(ctx.files.indexOf('client/src/view/user/user.less'), -1)
    })
    
    it('should have installable dependencies', done => {
      util.npmInstall(ctx.dir, done)
    })

    describe('when directory contains unvalid characters', function() {
      const ctx = util.setupTestEnvironment('foo bar (BAZ!)')

      it('should create basic app', done => {
        util.run(ctx.dir, [], (err, output) => {
          if (err) return done(err)
          assert.equal(util.parseCreatedFiles(output, ctx.dir).length, util.NB_FILES)
          done()
        })
      })

      it('should have a valid npm package name', () => {
        const file = path.resolve(ctx.dir, 'client', 'package.json')
        const contents = fs.readFileSync(file, 'utf8')
        const name = JSON.parse(contents).name
        assert.ok(validateNpmName(name).validForNewPackages)
        assert.equal(name, 'foo-bar-baz-client')
      })
    })

    describe('when directory is not a valid name', () => {
      const ctx = util.setupTestEnvironment('_')

      it('should create basic app', done => {
        util.run(ctx.dir, [], (err, output) => {
          if (err) return done(err)
          assert.equal(util.parseCreatedFiles(output, ctx.dir).length, util.NB_FILES)
          done()
        })
      })

      it('should default to name "hello-world-client"', () => {
        const file = path.resolve(ctx.dir, 'client', 'package.json')
        const contents = fs.readFileSync(file, 'utf8')
        const name = JSON.parse(contents).name
        assert.ok(validateNpmName(name).validForNewPackages)
        assert.equal(name, 'hello-world-client')
      })
    })
  })

}