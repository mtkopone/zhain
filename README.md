# Zhain

For - you know - zhaining things... Runs in the browser and in node.js.

[![Build Status](https://secure.travis-ci.org/mtkopone/zhain.png?branch=master)](https://travis-ci.org/mtkopone/zhain)

# Example

```javascript
zhain()
  .do(function() { console.log('Hello') })
  .do(function() { console.log('world') })
  .run()
```

(Yeah, that's a really complicated way to say 'Hello world'.)

## Usage

`.do` takes a function. 

If that function takes parameters, the function is assumed to be asynchronous and the last parameter is expected to be the callback. 

Functions without parameters are assumed to be synchronous.

`.sync` is an alias for `.do` which can take a function with parameters and is still synchronous.

Like so:

```javascript
zhain()
  .do(function() { console.log('Pow!') })              // sync
  .do(function(done) { $.get('/pow').then(done) })     // async
  .run()
```

## Passing state

Return values from synchronous functions are passed on to the next method in the chain:

```javascript
zhain()
  .do(function() { return 'Pow!' })
  .sync(function(pow) { console.log('Got: ' + pow) })
  .run()
```

The callback provided to asynchronous functions can be invoked with arguments. The first argument is reserved for errors (you know, node.js style), the next arguments are passed on to the next method in the chain:

```javascript
zhain()
  .do(function(done) { done(null, 'Pow!', 'Wop!') })
  .do(function(pow, wop, done) { assert.equal(pow, 'Pow!'); done() })
  .run()
```

## `.run` and `.end` and errors

`.run` runs the chain. It can optionally be passed a function which is invoked once the chain is complete. 

`.end` returns a function that when invoked will run the chain. It's useful for creating re-runnable chains and using zhain in e.g. mocha tests:

```javascript
var sayPow = zhain().do(function() { console.log('Pow'); }).end()
sayPow(); sayPow()

it('tests things', zhain()
  .do(function() { assert.equal(1,1) })
  .end())
```

If no errors occur, the ending function will receive the output of the last method in the chain.

```javascript
zhain()
  .do(function() { return 1 })
  .run(function(err, result) { console.log('Haz result: '+result) })

```

If a method in the chain throws an exception or invokes the callback with an error (1st argument, node.js style), the rest of the chain is bypassed and the ending function is invoked with the received error:

Synchronously:

```javascript
zhain()
  .do(function() { throw 'Fail...' })
  .do(function() { console.log('I should never be called.') })
  .run(function(err) {
    console.log("D'oh: " + err)
  })
```

Asynchronously:

```javascript
zhain()
  .do(function(done) { done('Fail...') })
  .do(function() { console.log('I should never be called.') })
  .run(function(err) {
    console.log("D'oh: " + err)
  })
```

## `this` and that

Inside `.do`, `this` is a per-run zhain instance. Passing state between functions can therefore also be done like this:

```javascript
zhain()
  .do(function() { this.pow = 'pow' })
  .do(function() { assert.equal(this.pow, 'pow') })
  .run()
```

When the function returned by `.end` is invoked with a `this`, it's bound to `this.context` within functions of the chain.

Example - output the test title and set a [test specific timeout](http://visionmedia.github.com/mocha/#test-specific-timeouts) in mocha:

```javascript
it('does things', zhain()
  .do(function() { console.log('Running: ' + this.context.test.title) })
  .do(function() { this.context.timeout('2s') })
    // moar test
  .end())
```

## Extending the Zhain

To make real use of zhain, extend it with something more domain-relevant, like so:

```javascript
Zhain.prototype.waitForAjax = function() {
  return this.do(function(done) {
    if (!$.active) return done()
    $('body').one('ajaxStop', function() {
      done()
    })
  })
}
``` 

In node.js, the prototype is at `require('zhain').prototype`

## Real'ish World Example

Recipe for writing concise and readable client-side mocha tests:

1. Extend the zhain prototype with domain-specific helper methods
2. Write your test, e.g.:

```javascript
it('updates person name', zhain()
  .setupUI().waitForAjax()
  .openTab('Person')
  .assertText($('#person span.first-name'), 'Joe')
  .click($('#person button.edit'))
  .assertVal($('#person input.first-name'), 'Joe')  
  .enterVal($('#person input.first-name'), 'Jack')
  .click($('#person button.save'))
  .waitForAjax()  
  .assertText($('#person span.first-name'), 'Jack')
  .end())
```

<div style="margin-top:100px;">Enjoy,</div>








