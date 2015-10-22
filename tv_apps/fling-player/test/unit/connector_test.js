/* global expect, Connector, castingMsgTemplate, MockPresentation */
'use strict';

requireApp('fling-player/test/unit/casting_message_template.js');
requireApp('fling-player/test/unit/mock_presentation.js');
requireApp('fling-player/bower_components/evt/index.js');
requireApp('fling-player/js/casting_message.js');
requireApp('fling-player/js/master_debug.js');
requireApp('fling-player/js/connector.js');

suite('fling-player/Connector', function() {

  var exp, msg, spy, connector, presentation;

  setup(function (done) {
    var timer;
    presentation = new MockPresentation();
    connector = new Connector(presentation);
    presentation.mInit();
    connector.init();

    this.timeout(200);
    timer = setInterval(() => {
      if (connector._isInit && connector._isInitConnection) {
        clearInterval(timer);
        done();
      }
    });
  });

  test('sendMsg()', function () {
    msg = castingMsgTemplate.get().ack;
    spy = sinon.spy(presentation.receiver._connection, 'send');
    connector.sendMsg(msg);
    assert.isTrue(spy.withArgs(JSON.stringify(msg)).calledOnce);
  });

  suite('replyAck()', function () {

    setup(function () {
      msg = castingMsgTemplate.get().play;
      spy = sinon.spy(connector, 'sendMsg');
    });

    test('should reply ack', function () {
      exp = castingMsgTemplate.get().ack;
      exp.seq = msg.seq;
      connector.replyACK(msg);
      assert.isTrue(spy.withArgs(exp).calledOnce);
    });

    test('should reply ack with error', function () {
      exp = castingMsgTemplate.get().ack;
      exp.seq = msg.seq;
      exp.error = 'error';
      connector.replyACK(msg, exp.error);
      assert.isTrue(spy.withArgs(exp).calledOnce);
    });
  });

  suite('reportStatus()', function () {

    function assertReportStatus(spy, msg) {
      assert.isTrue(
        spy.withArgs(msg).calledOnce,
        'Not called once with specified msg arg'
      );
      assert.isTrue(
        msg.seq + 1 == connector._msgSeq,
        'Msg seq does not increase by 1 after reporting status'
      );
    }

    setup(function () {
      spy = sinon.spy(connector, 'sendMsg');
    });

    test('should report status of buffering', function () {
      msg = castingMsgTemplate.get().statusBuffering;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertReportStatus(spy, msg);
    });

    test('should report status of loaded', function () {
      msg = castingMsgTemplate.get().statusLoaded;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertReportStatus(spy, msg);
    });

    test('should report status of buffered', function () {
      msg = castingMsgTemplate.get().statusBuffered;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertReportStatus(spy, msg);
    });

    test('should report status of playing', function () {
      msg = castingMsgTemplate.get().statusPlaying;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertReportStatus(spy, msg);
    });

    test('should report status of seeked', function () {
      msg = castingMsgTemplate.get().statusSeeked;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertReportStatus(spy, msg);
    });

    test('should report status of stopped', function () {
      msg = castingMsgTemplate.get().statusStopped;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertReportStatus(spy, msg);
    });

    test('should report status of error', function () {
      msg = castingMsgTemplate.get().statusError;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, {
        time : msg.time,
        error : msg.error
      });
      assertReportStatus(spy, msg);
    });

    test('should not report status of unknown', function () {
      msg = castingMsgTemplate.get().statusPlaying;
      msg.seq = connector._msgSeq;
      msg.status = 'unknown';
      expect(() => connector.reportStatus(msg.status, { time : msg.time }))
            .to.throw(/Ilegal status/);
    });

    test('should not report status without time', function () {
      msg = castingMsgTemplate.get().statusPlaying;
      msg.seq = connector._msgSeq;
      expect(() => connector.reportStatus(msg.status, {}))
            .to.throw(/Ilegal time/);
    });
  });

  suite('handleRemoteMessage()', function () {

    var spyOnLoadRequest, spyOnPlayRequest, spyOnSeekRequest, spyOnPauseRequest;

    function assertHandled(spy, msg) {
      assert.isTrue(
        spy.withArgs(msg).calledOnce, 'Not hanlding remote message'
      );
      assert.equal(
        connector._lastSeq, msg.seq, 'Last received msg seq not updated'
      );
    }

    function assertNotHandled(spy, msg) {
      assert.isFalse(
        spy.withArgs(msg).calledOnce, 'Should not handle remote message'
      );
      assert.notEqual(
        connector._lastSeq, msg.seq, 'Should not update last received msg seq'
      );
    }

    function assertRequestCallCount(callCounts = {}) {
      assert.equal(
        spyOnLoadRequest.callCount, callCounts.loadRequestCount,
        'Wrong load request count'
      );
      assert.equal(
        spyOnPlayRequest.callCount, callCounts.playRequestCount,
        'Wrong play request count'
      );
      assert.equal(
        spyOnSeekRequest.callCount, callCounts.seekRequestCount,
        'Wrong seek request count'
      );
      assert.equal(
        spyOnPauseRequest.callCount, callCounts.pauseRequestCount,
        'Wrong pause request count'
      );
    }

    setup(function () {
      spy = sinon.spy(connector, 'handleRemoteMessage');
      spyOnLoadRequest = sinon.spy();
      spyOnPlayRequest = sinon.spy();
      spyOnSeekRequest = sinon.spy();
      spyOnPauseRequest = sinon.spy();
      connector.on('loadRequest', spyOnLoadRequest);
      connector.on('playRequest', spyOnPlayRequest);
      connector.on('seekRequest', spyOnSeekRequest);
      connector.on('pauseRequest', spyOnPauseRequest);
    });

    test('should fire loadRequest on message', function () {
      msg = castingMsgTemplate.get().load;
      msg.seq = connector._lastSeq + 1;
      presentation.mCastMsgToReceiver(msg);
      assertHandled(spy, msg);
      assertRequestCallCount({
        loadRequestCount : 1,
        playRequestCount : 0,
        seekRequestCount : 0,
        pauseRequestCount : 0
      });
      assert.isTrue(spyOnLoadRequest.calledWithExactly({ url : msg.url }));
    });

    test('should fire playRequest on play message', function () {
      msg = castingMsgTemplate.get().play;
      msg.seq = connector._lastSeq + 1;
      presentation.mCastMsgToReceiver(msg);
      assertHandled(spy, msg);
      assertRequestCallCount({
        loadRequestCount : 0,
        playRequestCount : 1,
        seekRequestCount : 0,
        pauseRequestCount : 0
      });
      assert.isTrue(spyOnPlayRequest.calledWithExactly());
    });

    test('should fire seekRequest on seek message', function () {
      msg = castingMsgTemplate.get().seek;
      msg.seq = connector._lastSeq + 1;
      presentation.mCastMsgToReceiver(msg);
      assertHandled(spy, msg);
      assertRequestCallCount({
        loadRequestCount : 0,
        playRequestCount : 0,
        seekRequestCount : 1,
        pauseRequestCount : 0
      });
      assert.isTrue(spyOnSeekRequest.calledWithExactly({ time : msg.time }));
    });

    test('should fire pauseRequest on pause message', function () {
      msg = castingMsgTemplate.get().pause;
      msg.seq = connector._lastSeq + 1;
      presentation.mCastMsgToReceiver(msg);
      assertHandled(spy, msg);
      assertRequestCallCount({
        loadRequestCount : 0,
        playRequestCount : 0,
        seekRequestCount : 0,
        pauseRequestCount : 1
      });
      assert.isTrue(spyOnPauseRequest.calledWithExactly());
    });

    test('should handle but identify outdated msg seq', function () {
      msg = castingMsgTemplate.get().play;
      msg.seq = connector._lastSeq = 1;
      presentation.mCastMsgToReceiver(msg);
      assertHandled(spy, msg);
      assertRequestCallCount({
        loadRequestCount : 0,
        playRequestCount : 0,
        seekRequestCount : 0,
        pauseRequestCount : 0
      });
    });

    test('should not fire unknown request message', function () {
      msg = castingMsgTemplate.get().pause;
      msg.type = 'unknown';
      msg.seq = connector._lastSeq + 1;
      expect(() => presentation.mCastMsgToReceiver(msg))
            .to.throw(/Unknown type of casting message/);
      assertNotHandled(spy, msg);
      assertRequestCallCount({
        loadRequestCount : 0,
        playRequestCount : 0,
        seekRequestCount : 0,
        pauseRequestCount : 0
      });
    });

    test('should not handle load message without url', function () {
      msg = castingMsgTemplate.get().load;
      delete msg.url;
      msg.seq = connector._lastSeq + 1;
      expect(() => presentation.mCastMsgToReceiver(msg))
            .to.throw(/Ilegal url/);
      assertNotHandled(spy, msg);
      assertRequestCallCount({
        loadRequestCount : 0,
        playRequestCount : 0,
        seekRequestCount : 0,
        pauseRequestCount : 0
      });
    });

    test('should not fire seekRequest without seeking time', function () {
      msg = castingMsgTemplate.get().seek;
      delete msg.time;
      msg.seq = connector._lastSeq + 1;
      expect(() => presentation.mCastMsgToReceiver(msg))
            .to.throw(/Ilegal time/);
      assertNotHandled(spy, msg);
      assertRequestCallCount({
        loadRequestCount : 0,
        playRequestCount : 0,
        seekRequestCount : 0,
        pauseRequestCount : 0
      });
    });

    test('should not fire seekRequest with seeking time of NaN', function () {
      msg = castingMsgTemplate.get().seek;
      msg.time = NaN;
      msg.seq = connector._lastSeq + 1;
      expect(() => presentation.mCastMsgToReceiver(msg))
            .to.throw(/Ilegal time/);
      assertNotHandled(spy, msg);
      assertRequestCallCount({
        loadRequestCount : 0,
        playRequestCount : 0,
        seekRequestCount : 0,
        pauseRequestCount : 0
      });
    });

    test('should fire multiple request messages at once', function () {
      var msgs = [
            castingMsgTemplate.get().load,
            castingMsgTemplate.get().pause,
            castingMsgTemplate.get().play
          ],
          lastSeq = connector._lastSeq;
      msgs[0].seq = ++lastSeq;
      msgs[1].seq = ++lastSeq;
      msgs[2].seq = ++lastSeq;
      presentation.mCastMsgToReceiver(msgs);
      assert.equal(spy.callCount, 3);
      assertRequestCallCount({
        loadRequestCount : 1,
        playRequestCount : 1,
        seekRequestCount : 0,
        pauseRequestCount : 1
      });
      assert.isTrue(spyOnLoadRequest.calledWithExactly({ url : msgs[0].url }));
    });
  });
});
