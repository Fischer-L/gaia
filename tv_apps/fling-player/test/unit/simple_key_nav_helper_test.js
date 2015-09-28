/* global SimpleKeyNavHelper, SimpleKeyNavigation, mockKeyEvent */
'use strict';

require('/bower_components/evt/index.js');
require('/shared/js/smart-screen/simple_key_navigation.js');
require('/shared/test/unit/mocks/smart-screen/mock_key_navigation_adapter.js');
requireApp('/fling-player/js/mock/mock_key_event.js');
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

    navHelp.getKeyNav().focusOn(elems[1]);
    assert.equal(navHelp.getFocused(), elems[1]);

    navHelp.getKeyNav().focusOn(elems[0]);
    assert.equal(navHelp.getFocused(), elems[0]);
  });

  test('should disable navigation by key', function () {

    var e;

    navHelp.getKeyNav().focusOn(elems[0]);

    navHelp.disable();

    e = mockKeyEvent.makeKeydown(mockKeyEvent.KEY.RIGHT);
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

    navHelp.getKeyNav().focusOn(elems[0]);

    navHelp.disable();
    navHelp.enable();

    e = mockKeyEvent.makeKeydown(mockKeyEvent.KEY.RIGHT);
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