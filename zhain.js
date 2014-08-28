function zhain() {
  var empty = Object.create(Zhain.prototype)
  empty.invoke = function(ctx, done) { done() }
  return empty
}

function Zhain(parent, fn) {
  this.parent = parent
  this.fn = fn
}

;(function() {
  Zhain.prototype.do = function(fn) {
    return new Zhain(this, fn)
  }

  Zhain.prototype.sync = function(fn) {
    return this.do(wrapSyncFn(fn))
  }

  Zhain.prototype.end = function() {
    var me = this
    return function(callback) {
      var ctx = Object.create(Zhain.prototype)
      ctx.context = this
      return me.invoke.apply(me, [ctx, callback])
    }
  }

  Zhain.prototype.run = function(callback) {
    var ctx = Object.create(Zhain.prototype)
    this.invoke(ctx, callback)
  }

  Zhain.prototype.invoke = function(ctx, callback) {
    var done = allowOnce(callback || function() {}, ctx)
    var fn = this.fn.length > 0 ? this.fn : wrapSyncFn(this.fn)
    this.parent.invoke(ctx, function() {
      var args = [].slice.call(arguments)
      if (args[0]) {
        done.apply(ctx, args)
      } else {
        fn.apply(ctx, args.slice(1).concat([done]))
      }
    })
  }

  Zhain.prototype.log = function(string) {
    return this.sync(function() { console.log(string || arguments) })
  }

  Zhain.prototype.sleep = function(ms) {
    return this.do(function(done) {
      var args = splitArgs(arguments)
      setTimeout(function() { args.done.apply(this, [null].concat(args.args)) }, ms)
    })
  }

  Zhain.prototype.map = function(fn) {
    return this.do(wrapSyncFn(fn))
  }

  zhain.prototype = Zhain.prototype

  function wrapSyncFn(fn) {
    return function(done) {
      var args = splitArgs(arguments)
      try {
        var result = fn.apply(this, args.args)
        result !== undefined ? args.done(null, result) : args.done(null)
      } catch (e) {
        args.done(e)
      }
    }
  }

  function allowOnce(fn, ctx) {
    var invoked = false
    return function() {
      if (invoked) return
      invoked = true
      fn.apply(ctx, arguments)
    }
  }

  function splitArgs(args) {
    var all = [].slice.call(args)
    return { args: all.slice(0, -1), done: all[all.length - 1] }
  }

})()

if (typeof module !== 'undefined' && module.exports) {
  module.exports = zhain
}

if(typeof define === 'function' && define.amd) {
  define(function() {
    return zhain
  })
}
