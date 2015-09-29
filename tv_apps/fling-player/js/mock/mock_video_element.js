(function(exports) {
  'use strict';

  function MockVideoElement(config = {}) {
    this.src = config.src || '';
    this.ended = config.ended || false;
    this.paused = config.paused || true;
    this.hidden = config.hidden || false;
    this.buffered = [];
    this.duration = config.duration || 0;
    this.currentTime = config.currentTime || 0;

    this._events = {};
  }

  var proto = MockVideoElement.prototype;

  proto.fireEvent = function (type) {

    var listeners = this._events[type];
    if (listeners) {

      var e = { type : type };

      listeners.forEach((listener) => {
        if (typeof listener == 'function') {
          listener.call(this, e);
        } else {
          listener.handleEvent(e);
        }
      });
    }
  };

  proto.addEventListener = function (type, listener) {

    var listeners = this._events[type];
    if (!listeners) {
      this._events[type] = listeners = [];
    }

    listeners.push(listener);
  };

  proto.removeAttribute = function (attr) {
    this[attr] = '';
  };

  proto.load =  function () {
    this.paused = false;
    this.currentTime = 0;
    this.fireEvent('loadedmetadata');
  };

  proto.play = function () {
    this.paused = false;
    this.fireEvent('playing');
  };

  proto.pause = function () {
    this.paused = true;
    this.fireEvent('pause');
  };

  exports.MockVideoElement = MockVideoElement;

})(window);