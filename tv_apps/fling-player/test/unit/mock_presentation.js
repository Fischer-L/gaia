(function(exports) {
  'use strict';

  var proto,
      noop = function () {},
      connectionState = {
        connected : 'connected',
        closed : 'closed',
        terminated : 'terminated'
      };

  /**
   * This class represents a remote controller, like Fennec, requesting TV
   * video-casting service via Presentation API
   */
  function MockCastingController (mockPresentation) {
    this.presentation = mockPresentation;
  }

  proto = MockCastingController.prototype;

  proto.start = function () {
    console.log('MockCastingController#start');
    this.start = noop;
    this.presentation._start();
  };

  /**
   * Cast messages to Fling player
   * @param {Object|Array.<Object>} msgs
   */
  proto.castMsg = function (msgs) {
    var txt = '';

    if (!(msgs instanceof Array)) {
      msgs = [msgs];
    }

    msgs.forEach((m) => {
      txt += JSON.stringify(m);
    });
    this.presentation._toReceiver(txt);
  };


  function MockPresentationConnection() {
    this.id = 0;
    this.state = connectionState.closed;
    this.onmessage = null;
    this.onstatechange = null;
  }

  proto = MockPresentationConnection.prototype;

  proto._open = function () {
    console.log('MockPresentationConnection#_open');
    this.state = connectionState.connected;
    if (typeof this.onstatechange == 'function') {
      this.onstatechange(new Event('statechange'));
    }
  };

  proto._receive = function (txt) {
    if (this.state != connectionState.connected) {
      return;
    }

    if (typeof this.onmessage == 'function') {
      var e = new Event('message', { bubbles : false, cancelable : false });
      e.data = txt;
      this.onmessage(e);
    }
  };

  proto.close = function () {
    if (this.state != connectionState.connected) {
      return;
    }

    this.state = connectionState.closed;
    if (typeof this.onstatechange == 'function') {
      this.onstatechange(new Event('statechange'));
    }
  };

  proto.terminate = function () {
    if (this.state != connectionState.connected) {
      return;
    }

    this.state = connectionState.terminated;
    if (typeof this.onstatechange == 'function') {
      this.onstatechange(new Event('statechange'));
    }
  };

  proto.send = noop;


  function MockPresentationReceiver() {
    this.onconnectionavailable;
    this._connection; // MockPresentationConnection
    this._reject;
    this._resolve;
    this._connPromise = new Promise((resolve, reject) => {
      this._reject = reject;
      this._resolve = resolve;
    });
  }

  proto = MockPresentationReceiver.prototype;

  proto._start = function (connection) {
    console.log('MockPresentationReceiver#_start');
    this._start = noop;
    this._connection = connection;
    if (typeof this.onconnectionavailable == 'function') {
      this.onconnectionavailable(new Event('connectionavailable'));
    }
    this._resolve(this._connection);
  };

  proto.getConnection = function () {
    return this._connPromise;
  };


  function MockPresentation() {
    this.receiver = new MockPresentationReceiver();
    this._controller = new MockCastingController(this);
  }

  proto = MockPresentation.prototype;

  proto._start = function () {
    console.log('MockPresentation#_start');
    var connection;
    this._start = noop;
    connection = new MockPresentationConnection();
    this.receiver._start(connection);
    connection._open();
  };

  proto._toReceiver = function (txt) {
    if (this.receiver._connection) {
      this.receiver._connection._receive(txt);
    }
  };

  exports.MockPresentation = MockPresentation;

})(window);