const webpack = require('webpack')
const ansi = require('ansi_up')
const tasks = require('../../../node_modules/devloop/lib/tasks')


module.exports = def => {

  const daemon = tasks.create(
    'webpack daemon',

    def.cwd || __projectPath,

    function execute(out, success, error) {
      if (!this._watcher) {

        this.compilation = {}

        const compiler = webpack(def.config)

        compiler.plugin('watch-run', (_, next) => {
          this.compilation = {}
          listen.dirty()
          next()
        })

        this._watcher = compiler.watch({}, (err, stats) => {
          if (err) {
            this.compilation.err = err
            this.compilation.ok = false
          }
          else {
            var jsonStats = stats.toJson()

            if (jsonStats.errors.length > 0) {
              this.compilation.err = ansi.ansi_to_html(
                jsonStats.errors.join('\n\n'),
                { use_classes: true }
              )

              this.compilation.ok = false
            }
            else {
              this.compilation.ok = true
            }
          }

          if (this.compilation.cb)
            this.compilation.cb(this.compilation)
        })

        this.onWatchFinished = function(cb) {
          if (this.compilation.ok === undefined)
            this.compilation.cb = cb
          else
            cb(this.compilation)
        }
      }
      success()
    },

    function kill() {
      this._watcher && this._watcher.close()
      this._watcher = undefined
    }
  )


  const listen = tasks.create(
    def.name || 'watch',

    daemon.cwd,

    function execute(out, success, error) {
      // if a developer is really fast, it's possible to refresh the browser and execute this task before
      // .plugin('watch-run') had the chance to re-run.
      setTimeout(() => {
        daemon.onWatchFinished(({ ok, err }) => {
          if (ok)
            success()
          else {
            out(err)
            error()
          }
        })
      }, 500)
    },

    function kill() {
      // Nothing to kill here: This task is passive
      // as we never want to kill the daemon process while devloop runs
    }
  ).dependsOn(daemon)

  // Lift dependencies to the inner watcher task as 'listen' is passive and shouldn't have dependencies
  listen.dependsOn = function() {
    daemon.dependsOn.apply(daemon, arguments)
    return listen
  }

  return listen
}
