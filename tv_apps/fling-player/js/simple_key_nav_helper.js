/* global SimpleKeyNavigation */
(function(exports) {
  'use strict';

  /**
   * This a simple wrapper around SimpleKeyNavigation for providing some
   * convinent extra operations on SimpleKeyNavigation
   *
   * @constructor
   * @param {Object} startConfig the config params to start SimpleKeyNavigation
   */
  function SimpleKeyNavHelper(startConfig) {

    this._enabled = true;
    this._focused = null;
    this._startConfig = startConfig;
    this._keyNav = new SimpleKeyNavigation();

    this._keyNav.on('focusChanged', this._onFocusChanged.bind(this));
    this._keyNav.start(
      startConfig.list, startConfig.direction, startConfig.options
    );
  }

  var proto = SimpleKeyNavHelper.prototype;

  proto.getKeyNav = function () {
    return this._keyNav;
  };

  proto.enable = function () {
    if (!this._enabled) {

      this._keyNav.start(
        this._startConfig.list,
        this._startConfig.direction,
        this._startConfig.options
      );

      // Must set true after all the restoration works are done
      // to ensure things go right
      this._enabled = true;
    }
  };

  proto.disable = function () {
    if (this._enabled) {
      this._enabled = false;
      this._keyNav.stop();
    }
  };

  proto.getFocused = function () {
    return this._focused;
  };

  proto._onFocusChanged = function (elem) {
    if (this._enabled) {
      this._focused = elem;
    } else {
      // Since disabled, should not change focus
      if (this._focused !== elem) {
        this._keyNav.focusOn(this._focused);
      }
    }
  };

  exports.SimpleKeyNavHelper = SimpleKeyNavHelper;

})(window);