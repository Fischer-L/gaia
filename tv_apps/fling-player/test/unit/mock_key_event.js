(function(exports) {
  'use strict';

  var keyEventFactory = {};

  var _KEY_PROP = keyEventFactory._KEY_PROP = {};

  _KEY_PROP.UP = {};
  _KEY_PROP.UP.key =
  _KEY_PROP.UP.code =
  _KEY_PROP.UP.keyIdentifier = 'Up';
  _KEY_PROP.UP.which =
  _KEY_PROP.UP.keyCode = 33;

  _KEY_PROP.DOWN = {};
  _KEY_PROP.DOWN.key =
  _KEY_PROP.DOWN.code =
  _KEY_PROP.DOWN.keyIdentifier = 'Down';
  _KEY_PROP.DOWN.which =
  _KEY_PROP.DOWN.keyCode = 40;

  _KEY_PROP.LEFT = {};
  _KEY_PROP.LEFT.key =
  _KEY_PROP.LEFT.code =
  _KEY_PROP.LEFT.keyIdentifier = 'Left';
  _KEY_PROP.LEFT.which =
  _KEY_PROP.LEFT.keyCode = 37;

  _KEY_PROP.RIGHT = {};
  _KEY_PROP.RIGHT.key =
  _KEY_PROP.RIGHT.code =
  _KEY_PROP.RIGHT.keyIdentifier = 'Right';
  _KEY_PROP.RIGHT.which =
  _KEY_PROP.RIGHT.keyCode = 39;

  keyEventFactory.KEY = {
    UP : 'UP',
    DOWN : 'DOWN',
    LEFT : 'LEFT',
    RIGHT : 'RIGHT'
  };

  keyEventFactory.EVENT = {
    KEY_UP : 'KEY_UP',
    KEY_DOWN : 'KEY_DOWN',
    KEY_PRESS : 'KEY_PRESS',
    _map : {
      KEY_UP : 'keyup', KEY_DOWN : 'keydown', KEY_PRESS : 'keypress'
    }
  };

  /**
   * @param type The event type. See {@link this.EVENT}
   * @param targetKey The key of event. See {@link this.KEY}
   * @return {EVENT} Key event instance
   */
  keyEventFactory.makeEvent = function (type, targetKey) {

    var k = this.KEY[targetKey],
        t = this.EVENT._map[this.EVENT[type]];

    if (t && k) {
      var e = new Event(t);
      e.key = this._KEY_PROP[k].key;
      e.code = this._KEY_PROP[k].code;
      e.keyIdentifier = this._KEY_PROP[k].keyIdentifier;
      e.which = this._KEY_PROP[k].which;
      e.keyCode = this._KEY_PROP[k].keyCode;
      return e;
    }

    throw new Error(
      'Fail to make key event due to unknown ' +
      'type of ' + type + ' or ' +
      'key of ' + targetKey
    );
  };

  keyEventFactory.makeKeyup = function (targetKey) {
    return this.makeEvent(this.EVENT.KEY_UP, targetKey);
  };

  keyEventFactory.makeKeydown = function (targetKey) {
    return this.makeEvent(this.EVENT.KEY_DOWN, targetKey);
  };

  keyEventFactory.makeKeypress = function (targetKey) {
    return this.makeEvent(this.EVENT.KEY_PRESS, targetKey);
  };

  exports.mockKeyEvent = keyEventFactory;

})(window);