/* global castingMessage */
(function(exports) {
  'use strict';

  var proto,
      noop = function () {},
      sessionState = {
        connected : "connected",
        closed : "closed",
        terminated : "terminated"
      };

  /**
   * This class represents a remote controller, like Fennec, requesting TV
   * video-casting service via Presentation API
   */
  function MockCastingController (mockPresentation) {
    this._seq = 0;
    this.videoSrc = '';
    this.presentation = mockPresentation;
  }

  proto = MockCastingController.prototype;

  proto.start = function () {
    if (!this.videoSrc) {
      throw new Error('You forget to set video src so fail to start');
    }
    this.start = noop;
    this.presentation._start();
  };

  /**
   * @param {Object|Array.<Object>} msgs
   */
  proto.request = function (msg) {
    if (!this.videoSrc) {
      throw new Error('You forget to set video src so fail to cast video');
    }

    var txt = '';

    if (!(msg instanceof Array)) msg = [msg];

    msg.forEach((m) => {
      txt += castingMessage.stringify(m);
    });
    this.presentation._toReceiver(txt);
  };

  proto.load = function () {
    var msg = {};
    msg.seq = ++this._seq;
    msg.type = 'load';
    msg.url = this.videoSrc;
    this.request(msg);
  };

  proto.play = function () {
    var msg = {};
    msg.seq = ++this._seq;
    msg.type = 'play';
    this.request(msg);
  };

  proto.pause = function () {
    var msg = {};
    msg.seq = ++this._seq;
    msg.type = 'pause';
    this.request(msg);
  };

  proto.seek = function (time) {
    var msg = {};
    msg.seq = ++this._seq;
    msg.type = 'seek';
    msg.time = time;
    this.request(msg);
  };


  function MockPresentationSession() {
    this.id = 0;
    this.state = sessionState.closed;
    this.onmessage = null;
    this.onstatechange = null;
  }

  proto = MockPresentationSession.prototype;

  proto._open = function () {
    this.state = sessionState.connected;
    if (typeof this.onstatechange == 'function') {
      var e = new Event('statechange');
      this.onstatechange(e);
    }
  };

  proto._receive = function (txt) {
    if (this.state != sessionState.connected) return;

    if (typeof this.onmessage == 'function') {
      var e = new Event('message', { bubbles : false, cancelable : false });
      e.data = txt;
      this.onmessage(e);
    }
  };

  proto.close = function () {
    if (this.state != sessionState.connected) return;

    this.state = sessionState.closed;
    if (typeof this.onstatechange == 'function') {
      var e = new Event('statechange');
      this.onstatechange(e);
    }
  };

  proto.terminate = function () {
    if (this.state != sessionState.connected) return;

    this.state = sessionState.terminated;
    if (typeof this.onstatechange == 'function') {
      var e = new Event('statechange');
      this.onstatechange(e);
    }
  };

  proto.send = noop;


  function MockPresentationReceiver() {

    this.onsessionavailable;
    this._session; // MockPresentationSession
    this._reject;
    this._resolve;

    this._sessionPromise = new Promise((resolve, reject) => {
      this._reject = reject;
      this._resolve = resolve;
    });
  }

  proto = MockPresentationReceiver.prototype;

  proto._start = function (session) {
    this._start = noop;
    this._session = session;
    if (typeof this.onsessionavailable == 'function'){
      var e = new Event('sessionavailable');
      this.onsessionavailable(e);
    }
    this._resolve(this._session);
  };

  proto.getSession = function () {
    return this._sessionPromise;
  };


  function MockPresentation() {
    this.receiver = new MockPresentationReceiver();
    this._controller = new MockCastingController(this);
  }

  proto = MockPresentation.prototype;

  proto._start = function () {
    var session;
    this._start = noop;
    session = new MockPresentationSession();
    this.receiver._start(session);
    session._open();
  };

  proto._toReceiver = function (txt) {
    if (this.receiver._session) {
      this.receiver._session._receive(txt);
    }
  };

  exports.MockPresentation = MockPresentation;

})(window);