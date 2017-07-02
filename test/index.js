const fs     = require('fs')
const path   = require('path')
const util   = require('./util')

const testNoArgs      = require('./noArgs')
const testUnknownArgs = require('./unknownArgs')
const testCss         = require('./css')


describe('kaiju', function() {

  before(done => util.cleanup({ cb: done }))
  after(done => util.cleanup({ cb: done }))

  testNoArgs()
  testUnknownArgs()
  testCss()

})