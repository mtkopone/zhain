describe('zhain-ext-test', notInNode(function() {
  var z = require('../zhain')
  var assert = require('chai').assert
  var $sut

  z.ext.register()

  beforeEach(function() {
    if ($sut) $sut.remove()
    $sut = $('<div>').attr('id', 'sut').appendTo($('body'))
  })

  it('waitForAjax', function(done) {
    var projectName;
    $.get('./package.json', function(json) { projectName = json.name }, 'json')
    z().waitForAjax().run(function() {
      assert.equal(projectName, 'zhain')
      done()
    })
  })

  it('waitForThrottledAjax', function(done) {
    var projectName;
    setTimeout(function() { $.get('./package.json', function(json) { projectName = json.name }, 'json') }, 10)
    z().waitForThrottledAjax().run(function() {
      assert.equal(projectName, 'zhain')
      done()
    })
  })

  it('waitUntilExists', function(done) {
    setTimeout(function() { $sut.html(box()) }, 10)
    z().waitUntilExists($('#sut #box')).run(function() {
      assert.equal($('#sut #box').length, 1)
      done()
    })
  })

  it('waitUntilVisible', function(done) {
    $(box()).hide().appendTo($sut)
    setTimeout(function() { $('#sut #box').show() }, 10)
    z().waitUntilVisible($('#sut #box')).run(function() {
      assert.isTrue($('#sut #box').is(':visible'))
      done()
    })
  })

  it('waitUntilHidden', function(done) {
    $(box()).appendTo($sut)
    setTimeout(function() { $('#sut #box').hide() }, 10)
    z().waitUntilHidden($('#sut #box')).run(function() {
      assert.isFalse($('#sut #box').is(':visible'))
      done()
    })
  })

  it('waitForTransitionEnd', function(done) {
    $sut.html(box())
    $('#box').css(csstransitions())
    setTimeout(function() { $('#box').css('right', '300px') }, 0)
    z().waitForTransitionEnd($('#box')).run(function() {
      assert.equal($('#box').css('right'), '300px')
      done()
    })
  })

  it('waitForAnimations', function(done) {
    $sut.html(box())
    $('#box').animate({ right: 300 }, 100)
    z().waitForAnimations().run(function() {
      assert.equal($('#box').css('right'), '300px')
      done()
    })
  })

  it('waitUntil context', function(done) {
    z().do(function() { this.itsMe = true })
      .waitUntil(function() { assert.isTrue(this.itsMe); return true })
      .run(function() { assert.isTrue(this.itsMe); done() })
  })

  it('waitUntil works when arguments passed', function(done) {
    var calls = []
    z().do(function() { calls.push(1); return 1 })
      .waitUntil(function() { calls.push(2); return true })
      .do(function() { calls.push(3); })
      .run(function(err) {
        assert.isNull(err)
        assert.deepEqual(calls, [1,2,3])
        done()
      })
  })

  it('enterVal', function(done) {
    $sut.html(input())
    z().enterVal($('#sut input'), 'pow').run(function() {
      assert.equal($('#sut input').val(), 'pow')
      done()
    })
  })

  it('ajaxClick', function (done) {
    var projectName
    $sut.append(button(function () { $.get('./package.json', function (json) { projectName = json.name}, 'json') }))
    z().ajaxClick($('button')).run(function () {
      assert.equal(projectName, 'zhain')
      done()
    })
  })

  it('throttledAjaxClick', function (done) {
    var projectName
    $sut.append(button(function () { setTimeout(function () { $.get('./package.json', function (json) { projectName = json.name}, 'json') }, 10) }))
    z().throttledAjaxClick($('button')).run(function () {
      assert.equal(projectName, 'zhain')
      done()
    })
  })

  it('asserts', function(done) {
    $(input()).val('pow').appendTo($sut)
    $('<p>pow</p>').appendTo($sut)
    $('<section/>').appendTo($sut)
    $('<input id="checkbox" type="checkbox"/>').appendTo($sut)
    $('<div id="html"><div>Ehlo</div></div>').appendTo($sut)
    z().assertVal($('#sut input'), 'pow')
      .do(function() { $('#sut input').attr('disabled', 'disabled') }).assertDisabled($('#sut input'))
      .do(function() { $('#sut input').removeAttr('disabled') }).assertEnabled($('#sut input'))
      .assertText($('#sut p'), 'pow')
      .assertHtml($('#sut #html'), '<div>Ehlo</div>')
      .do(function() { $('#sut p').hide() }).assertHidden($('#sut p')).assertNotVisible($('#sut p'))
      .do(function() { $('#sut p').show() }).assertVisible($('#sut p'))
      .assertDoesNotExist($('#sut span'))
      .assertCount($('#sut p, #sut input'), 3)
      .do(function() { $('#sut section').text('pow') }).assertNotEmpty($('#sut section'))
      .do(function() { $('#sut section').empty() }).assertEmpty($('#sut section'))
      .do(function() { $('#sut p').addClass('pow') }).assertHasClass($('#sut p'), 'pow')
      .do(function() { $('#sut p').removeClass('pow') }).assertNoClass($('#sut p'), 'pow')
      .click($('#sut #checkbox')).assertChecked($('#sut #checkbox'))
      .click($('#sut #checkbox')).assertNotChecked($('#sut #checkbox'))
      .run(done)
  })

  function box() { return '<div id="box" style="width:10px; height:10px; background-color:red; position: absolute; top: 60px; right: 10px;"></div>' }
  function input() { return '<input type="text">' }
  function button(handler) { return $('<button>').click(handler) }
  function csstransitions() { return { '-webkit-transition': 'all .1s ease', '-moz-transition': 'all .1s ease;', '-o-transition': 'all .1s ease', '-ms-transition': 'all .1s ease', transition: 'all .1s ease' } }
}))

function notInNode(fn) {
  return (typeof module !== 'undefined') ? function() { console.log('>> Not running: zhain-ext-test. Only makes sense in browsers') } : fn
}
