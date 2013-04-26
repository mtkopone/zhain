zhain.ext = {
  assert: chai.assert,
  wait: {
    forAjax: function(callback) {
      $.active === 0 ? callback() : $(document).one('ajaxStop', function() { callback() })
    },
    forThrottledAjax: function(callback) {
      $(document).one('ajaxSend', function() {
        $(document).one('ajaxStop', function() { callback() })
      })
    },
    forTransitionEnd: function($locator, callback) {
      $($locator.selector).one('transitionEnd webkitTransitionEnd oTransitionEnd msTransitionEnd', function() { callback() })
    },
    forAnimations: function(callback) {
      zhain.ext.wait.until(function() { return $(":animated").length === 0 }, callback)
    },
    untilVisible: function($locator, callback) {
      zhain.ext.wait.until(function() { return $($locator.selector).is(':visible') }, callback)
    },
    untilExists: function($locator, callback) {
      zhain.ext.wait.until(function() { return $($locator.selector).length > 0 }, callback)
    },
    until: function(conditionFn, callback) {
      var that = this
      if (conditionFn.call(that)) {
        callback()
      } else {
        setTimeout(function() {
          zhain.ext.wait.until.call(that, conditionFn, callback)
        }, 10)
      }
    }
  },
  sync: {
    breakpoint: function() {
      debugger
    },
    enterVal: function($input, val) {
      $($input.selector).val(val)
    },
    enterValAndKeyupBlur: function($input, val) {
      $($input.selector).val(val).trigger('keyup').trigger('blur')
    },
    enterValAndKeyupChange: function($input, val) {
      $($input.selector).val(val).trigger('keyup').trigger('change')
    },
    click: function($selector) {
      $($selector.selector).click()
    },
    assertVal: function($locator, val) {
      zhain.ext.assert.equal($($locator.selector).val(), val)
    },
    assertDisabled: function($locator) {
      zhain.ext.assert.isTrue($($locator.selector).is(':disabled'), '$("'+$locator.selector + '") is not disabled')
    },
    assertEnabled: function($locator) {
      zhain.ext.assert.isFalse($($locator.selector).is(':disabled'), '$("'+$locator.selector + '") is disabled')
    },
    assertText: function($locator, txt) {
      zhain.ext.assert.equal($($locator.selector).text(), txt)
    },
    assertVisible: function($locator) {
      zhain.ext.assert.isTrue($($locator.selector).is(':visible'), '$("'+$locator.selector + '") is not visible')
    },
    assertNotVisible: function($locator) {
      zhain.ext.assert.isFalse($($locator.selector).is(':visible'), '$("'+$locator.selector + '") is visible')
    },
    assertHidden: function($locator) {
      zhain.ext.assert.isTrue($($locator.selector).is(':hidden'), '$("'+$locator.selector + '") is not hidden')
    },
    assertDoesNotExist: function($locator) {
      zhain.ext.assert.equal($($locator.selector).length, 0, '$("'+$locator.selector + '") exists')
    },
    assertCount: function($locator, count) {
      zhain.ext.assert.equal($($locator.selector).length, count, '$("'+$locator.selector + '").length')
    },
    assertEmpty: function($locator) {
      zhain.ext.assert.isTrue($($locator.selector).is(':empty'), '$("'+$locator.selector + '") is not empty')
    },
    assertNotEmpty: function($locator) {
      zhain.ext.assert.isFalse($($locator.selector).is(':empty'), '$("'+$locator.selector + '") is empty')
    },
    assertHasClass: function($locator, clazz) {
      zhain.ext.assert.isTrue($($locator.selector).hasClass(clazz), '$("'+$locator.selector + '") doesn\'t have class "'+clazz+'"')
    },
    assertNoClass: function($locator, clazz) {
      zhain.ext.assert.isFalse($($locator.selector).hasClass(clazz), '$("'+$locator.selector + '") shouldn\'t have class "'+clazz+'"')
    },
    assertChecked: function($locator) {
      zhain.ext.assert.isTrue($($locator.selector).is(':checked'), '$("'+$locator.selector + '") is not checked')
    },
    assertNotChecked: function($locator) {
      zhain.ext.assert.isFalse($($locator.selector).is(':checked'), '$("'+$locator.selector + '") is checked')
    },
    logAjax: function() {
      $(document).ajaxSend(log).ajaxComplete(log)

      function log(e, jqXHR, opts) {
        var header = (e.type == 'ajaxComplete') ? 'DONE ' : ''
        console.log(header+opts.type+' '+opts.url)
      }
    }    
  },
  async: {
    enterThrottledVal: function($input, val, done) {
      zhain.ext.sync.enterValAndKeyupBlur($input, val, done)
      zhain.ext.wait.forThrottledAjax(done)
    },
    ajaxClick: function($selector, done) {
      $($selector.selector).click()
      zhain.ext.wait.forAjax(done)
    },
    ajaxTrigger: function($selector, event, done) {
      $($selector.selector).trigger(event)
      zhain.ext.wait.forAjax(done)
    }  
  },
  register: function() {
    Object.keys(zhain.ext.wait).forEach(function(fnName) {
      Zhain.prototype['wait' + toTitleCase(fnName)] = function() {
        var args = Array.prototype.slice.call(arguments)
        return this.do(function(done) { zhain.ext.wait[fnName].apply(this, args.concat([done])) })
      }
    })
    Object.keys(zhain.ext.sync).forEach(function(fnName) {
      Zhain.prototype[fnName] = function() {
        var args = Array.prototype.slice.call(arguments)
        return this.do(function() { zhain.ext.sync[fnName].apply(this, args) })
      }
    })
    Object.keys(zhain.ext.async).forEach(function(fnName) {
      Zhain.prototype[fnName] = function() {
        var args = Array.prototype.slice.call(arguments)
        return this.do(function(done) { zhain.ext.async[fnName].apply(this, args.concat([done])) })
      }
    })
    
    function toTitleCase(s) {
      return s.replace(/(?:^|\s|-)\S/g, function(c){ return c.toUpperCase() })
    }
  }
}
