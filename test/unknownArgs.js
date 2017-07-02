const assert = require('assert')
const util   = require('./util')


module.exports = () => {

  describe('(unknown args)', function() {
    const ctx = util.setupTestEnvironment(this.fullTitle())

    it('should exit with code 1', done => {
      util.runRaw(ctx.dir, ['--foo'], (err, code, stdout, stderr) => {
        if (err) return done(err)
        assert.strictEqual(code, 1)
        done()
      })
    })

    it('should print usage', done => {
      util.runRaw(ctx.dir, ['--foo'], (err, code, stdout, stderr) => {
        if (err) return done(err)
        assert.ok(/Usage: kaiju-cli/.test(stdout))
        assert.ok(/--help/.test(stdout))
        assert.ok(/--version/.test(stdout))
        assert.ok(/error: unknown option/.test(stderr))
        done()
      })
    })

    it('should print unknown option', done => {
      util.runRaw(ctx.dir, ['--foo'], (err, code, stdout, stderr) => {
        if (err) return done(err)
        assert.ok(/error: unknown option/.test(stderr))
        done()
      })
    })
  })

}