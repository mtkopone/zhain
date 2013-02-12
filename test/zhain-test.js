var z = require('../zhain'),
    assert = require('chai').assert

describe('zhain-test', function() {
  var calls

  beforeEach(function() { calls = [] })

  describe('chaining', function() {
    it('minimal', function(done) {
      z().run(done)
    })
    it('synchronous', function() {
      z().do(pushN(1)).run()
      z().do(pushN(2)).do(pushN(3)).run()
      z().sync(pushN(4)).run()
      assert.deepEqual(calls, [1,2,3,4])
    })

    it('asynchronous', function(done) {
      z()
      .do(asyncPushN(1))
      .do(asyncPushN(2))
      .run(function() {
        assert.deepEqual(calls, [1,2])
        done()
      })
    })

    it('mixed', function(done) {
      z().do(pushN(1))
        .do(asyncPushN(2))
        .do(pushN(3))
        .do(asyncPushN(4))
        .run(function() {
          assert.deepEqual(calls, [1,2,3,4])
          done()
        })
    })

    it('callbacks are only invoked once', function() {
      var doCount = 0
      var endCount = 0
      z()
        .do(function(done) { done(); done(); done() })
        .do(function() { doCount++ })
        .run(function() { endCount++ })
      assert.equal(doCount, 1)
      assert.equal(endCount, 1)
    })
  })

  describe('reuse', function() {
    it('synchronous', function() {
      var z1 = z().do(pushN('x')).end()
      z1(); z1(); z1();
      assert.deepEqual(calls, ['x','x','x'])
    })

    it('asynchronous', function(done) {
      var z1 = z().do(asyncPushN('x')).end()
      z1(function() {
        z1(function() {
          z1(function() {
            assert.deepEqual(calls, ['x','x','x'])
            done()
          })
        })
      })
    })
  })

  describe('"this" context', function() {
    it('synchronous', function() {
      z().do(function() { this.pow = 'pow' })
         .do(function() { assert.equal(this.pow, 'pow') })
         .run()

      z().sync(function() { this.pow = 'pow' })
         .sync(function() { assert.equal(this.pow, 'pow') })
         .run()
    })

    it('asynchronous', function(done) {
      z().do(function(done) { this.pow = 'pow'; done() })
         .do(function(done) { assert.equal(this.pow, 'pow'); done() })
         .run(done)
    })

    it('for run()', function(done) {
      z().do(function() { this.pow = 'pow' })
        .run(function() {
          assert.equal(this.pow, 'pow');
          done()
        })
    })

    it('for end()', function(done) {
      var z1 = z().do(function() { this.pow = 'pow' }).end()
      z1(function() {
        assert.equal(this.pow, 'pow');
        done()
      })
    })

    it('isolation', function(done) {
      var ii = 0
      var z1 = z()
        .do(function() { this.pow = ii++; return this.pow })
        .do(function(x, done) { setTimeout(function() { done(null, x) }, Math.random() * 20) })
        .sync(function(x) { assert.equal(this.pow, x); return x })
        .end()

      var jj = 0
      var end = function(err, res) {
        if (++jj == 10) done()
      }
      z1(end); z1(end); z1(end); z1(end); z1(end);
      z1(end); z1(end); z1(end); z1(end); z1(end);
    })
  })

  describe('result values', function() {
    it('synchronous', function(done) {
      var z1 = z().do(retN('x')).end()
      z1(function(err, x) {
        assert.equal(x, 'x')
        done()
      })
    })

    it('asynchronous', function(done) {
      var z1 = z().do(asyncRetN(undefined, 'x', 'y')).end()
      z1(function(err, x, y) {
        assert.equal(x, 'x')
        assert.equal(y, 'y')
        done()
      })
    })
  })

  describe('forwarding arguments', function() {
    it('synchronous', function(done) {
      z().do(retN(1))
        .sync(function(x) { return x * 7 })
        .sync(function(x) { return x - 1 })
        .run(function(err, res) {
          assert.equal(res, 1 * 7 - 1)
          done()
        })
    })

    it('asynchronous', function(done) {
      z().do(asyncRetN(undefined, 1))
        .do(function(x, done) { done(undefined, x * 7) })
        .do(function(x, done) { done(undefined, x - 1) })
        .run(function(err, res) {
          assert.equal(res, 1 * 7 - 1)
          done()
        })
    })

    it('mixed mode with multiple args', function(done) {
      z().do(retN('j'))
        .do(function(x, done) { done(undefined, x+'a', x+'i') })
        .do(function(x, y, done) { done(undefined, x+'ck', y+'ll') })
        .sync(function(x, y) { return x + ' & ' + y })
        .run(function(err, res) {
          assert.equal(res, 'jack & jill')
          done()
        })
    })

  })

  describe('errors skip to end', function() {
    it('synchronous', function(done) {
      z().do(function() { throw 'FAIL!' })
        .do(function() { assert.fail("Mustn't get here.") })
        .run(function(err, res) {
          assert.equal(err, 'FAIL!')
          assert.isUndefined(res)
          done()
        })
    })
    it('asynchronous', function(done) {
      z().do(function(done) { done('FAIL!', 'x') })
        .do(function(done) { assert.fail("Mustn't get here."); done() })
        .run(function(err, res) {
          assert.equal(err, 'FAIL!')
          assert.equal(res, 'x')
          done()
        })
    })
  })

  describe('nesting zhains', function() {
    it('explicit', function() {
      z().do(pushN(1)).do(function(done1) {
        z().do(pushN(2)).do(function(done2) {
          z().do(pushN(3)).run(done2)
        }).run(done1)
      }).run(function() {
        assert.deepEqual(calls, [1,2,3])
        done()
      })
    })

    it('implicit', function() {
      z()
        .do(pushN(1))
        .do(z().do(pushN(2)).end())
        .do(z().do(pushN(3)).end())
        .run(function() {
          assert.deepEqual(calls, [1,2,3])
          done()
        })
    })

  })

  describe('utils', function() {
    it('extending', function(done) {
      z().pow().run(function(err, res) {
        assert.equal(res, 'pow')
        done()
      })
    })

    it('sleep()', function(done) {
      var state = 'pre'
      z().do(retN('x')).sleep(1).run(function(err, ret) {
        assert.equal(ret, 'x')
        assert.equal(state, 'post')
        done()
      })
      state = 'post'
    })

    it('map()', function(done) {
      z().do(retN(1)).map(function(x) { return x + 5 }).run(function(err, res) {
        assert.equal(res, 6)
        done()
      })
    })
  })

  z.prototype.pow = function() { return this.do(function() { return 'pow' }) }

  function pushN(n) { return function() { calls.push(n) } }
  function asyncPushN(n) { return function(done) { calls.push(n); setTimeout(done, 1) } }

  function retN(n) { return function() { return n } }
  function asyncRetN() {
    var args = [].slice.call(arguments)
    return function(done) { setTimeout(function() { done.apply(undefined, args) }, 1) }
  }

})