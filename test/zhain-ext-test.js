var z = require('../zhain'),
  assert = require('chai').assert

if (typeof module !== 'undefined' && module.exports) {
  console.log('>> zhain-ext-test only makes sense in browsers')
  return
}

z.ext.register()

describe('zhain-ext-test', function() {
  var $sut

  beforeEach(function() {
    if ($sut) $sut.remove()
    $sut = $('<div>').attr('id', 'sut').appendTo($('body'))
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
  it('waitFor$Animations', function(done) {
    $sut.html(box())
    $('#box').animate({ right: 300 }, 'fast')
    z().waitForAnimations().run(function() {
      assert.equal($('#box').css('right'), '300px')
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

  function box() { return '<div id="box" style="width:10px; height:10px; background-color:red; position: absolute; top: 60px; right: 10px;"></div>' }
  function input() { return '<input type="text">' }
  function csstransitions() { return { '-webkit-transition': 'all .3s ease', '-moz-transition': 'all .3s ease;', '-o-transition': 'all .3s ease', '-ms-transition': 'all .3s ease', transition: 'all .3s ease' } }
})