/* global SimpleKeyNavHelper, SimpleKeyNavigation, mockKeyEvent */
'use strict';

require('/shared/js/smart-screen/simple_key_navigation.js');
requireApp('/fling-player/test/js/unit/mock_key_event.js');
requireApp('/fling-player/js/simple_key_nav_helper.js');

suite('fling-player/SimpleKeyNavHelper', function() {

  var navHelp, elems;

  setup(function () {

    elems = [
      document.createElement('P'),
      document.createElement('DIV'),
      document.createElement('SPAN')
    ];

    navHelp = new SimpleKeyNavHelper({
      list : elems,
      direction : SimpleKeyNavigation.DIRECTION.HORIZONTAL
    });
  });

  test('should return instance of SimpleKeyNavigation', function () {
    assert.isTrue(navHelp.getKeyNav() instanceof SimpleKeyNavigation);
  });

  test('should return focused element', function () {

    navHelp.getKeyNav().focuseOn(elems[1]);
    assert.equal(navHelp.getFocused(), elems[1]);

    navHelp.getKeyNav().focuseOn(elems[0]);
    assert.equal(navHelp.getFocused(), elems[0]);
  });

  test('should disable navigation by key', function () {

    var e;

    navHelp.getKeyNav().focuseOn(elems[0]);

    navHelp.disable();

    e = mockKeyEvent.makeKeyDown(mockKeyEvent.KEY.RIGHT);
    window.dispatchEvent(e);
    assert.equal(navHelp.getFocused(), elems[0]);

    e = mockKeyEvent.makeKeyup(mockKeyEvent.KEY.RIGHT);
    window.dispatchEvent(e);
    assert.equal(navHelp.getFocused(), elems[0]);

    e = mockKeyEvent.makeKeypress(mockKeyEvent.KEY.RIGHT);
    window.dispatchEvent(e);
    assert.equal(navHelp.getFocused(), elems[0]);
  });

  test('should enable navigation by key', function () {

    var e;

    navHelp.getKeyNav().focuseOn(elems[0]);

    navHelp.disable();
    navHelp.enable();

    e = mockKeyEvent.makeKeyDown(mockKeyEvent.KEY.RIGHT);
    window.dispatchEvent(e);
    assert.equal(navHelp.getFocused(), elems[1]);

    e = mockKeyEvent.makeKeyup(mockKeyEvent.KEY.RIGHT);
    window.dispatchEvent(e);
    assert.equal(navHelp.getFocused(), elems[1]);

    e = mockKeyEvent.makeKeypress(mockKeyEvent.KEY.RIGHT);
    window.dispatchEvent(e);
    assert.equal(navHelp.getFocused(), elems[1]);
  });
});