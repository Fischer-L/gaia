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
    presentation._controller.start();
    connector.init();

    this.timeout(200);
    timer = setInterval(() => {
      if (connector._isInit && connector._isInitConnection) {
        clearInterval(timer);
        done();
      }
    });
  });

  test('should send message', function () {
    msg = castingMsgTemplate.get().ack;
    spy = sinon.spy(presentation.receiver._connection, 'send');
    connector.sendMsg(msg);
    assert.isTrue(spy.withArgs(JSON.stringify(msg)).calledOnce);
  });

  suite('reply ack', function () {

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

  suite('report status', function () {

    function assertReportStatus() {
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
      assertReportStatus();
    });

    test('should report status of loaded', function () {
      msg = castingMsgTemplate.get().statusLoaded;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertReportStatus();
    });

    test('should report status of buffered', function () {
      msg = castingMsgTemplate.get().statusBuffered;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertReportStatus();
    });

    test('should report status of playing', function () {
      msg = castingMsgTemplate.get().statusPlaying;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertReportStatus();
    });

    test('should report status of seeked', function () {
      msg = castingMsgTemplate.get().statusSeeked;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertReportStatus();
    });

    test('should report status of stopped', function () {
      msg = castingMsgTemplate.get().statusStopped;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertReportStatus();
    });

    test('should report status of error', function () {
      msg = castingMsgTemplate.get().statusError;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, {
        time : msg.time,
        error : msg.error
      });
      assertReportStatus();
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

  suite('handle remote request message', function () {

    var spyOnLoadRequest, spyOnPlayRequest, spyOnSeekRequest, spyOnPauseRequest;

    function assertHandled() {
      assert.isTrue(
        spy.withArgs(msg).calledOnce, 'Not hanlding remote message'
      );
      assert.equal(
        connector._lastSeq, msg.seq, 'Last received msg seq not updated'
      );
    }

    function assertNotHandled() {
      assert.isFalse(
        spy.withArgs(msg).calledOnce, 'Should not handle remote message'
      );
      assert.notEqual(
        connector._lastSeq, msg.seq, 'Should not update last received msg seq'
      );
    }

    function assertRequestCallCount(
      loadRequestCount, playRequestCount, seekRequestCount, pauseRequestCount
    ) {
      assert.equal(
        spyOnLoadRequest.callCount, loadRequestCount,
        'Wrong load request count'
      );
      assert.equal(
        spyOnPlayRequest.callCount, playRequestCount,
        'Wrong play request count'
      );
      assert.equal(
        spyOnSeekRequest.callCount, seekRequestCount,
        'Wrong seek request count'
      );
      assert.equal(
        spyOnPauseRequest.callCount, pauseRequestCount,
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

    test('should handle load message', function () {
      msg = castingMsgTemplate.get().load;
      msg.seq = connector._lastSeq + 1;
      presentation._controller.castMsg(msg);
      assertHandled();
      assertRequestCallCount(1, 0, 0, 0);
      assert.isTrue(spyOnLoadRequest.calledWithExactly({ url : msg.url }));
    });

    test('should handle play message', function () {
      msg = castingMsgTemplate.get().play;
      msg.seq = connector._lastSeq + 1;
      presentation._controller.castMsg(msg);
      assertHandled();
      assertRequestCallCount(0, 1, 0, 0);
      assert.isTrue(spyOnPlayRequest.calledWithExactly());
    });

    test('should handle seek message', function () {
      msg = castingMsgTemplate.get().seek;
      msg.seq = connector._lastSeq + 1;
      presentation._controller.castMsg(msg);
      assertHandled();
      assertRequestCallCount(0, 0, 1, 0);
      assert.isTrue(spyOnSeekRequest.calledWithExactly({ time : msg.time }));
    });

    test('should handle pause message', function () {
      msg = castingMsgTemplate.get().pause;
      msg.seq = connector._lastSeq + 1;
      presentation._controller.castMsg(msg);
      assertHandled();
      assertRequestCallCount(0, 0, 0, 1);
      assert.isTrue(spyOnPauseRequest.calledWithExactly());
    });

    test('should handle but identify outdated msg seq', function () {
      msg = castingMsgTemplate.get().play;
      msg.seq = connector._lastSeq = 1;
      presentation._controller.castMsg(msg);
      assertHandled();
      assertRequestCallCount(0, 0, 0, 0);
    });

    test('should not handle unknown message', function () {
      msg = castingMsgTemplate.get().pause;
      msg.type = 'unknown';
      msg.seq = connector._lastSeq + 1;
      expect(() => presentation._controller.castMsg(msg))
            .to.throw(/Unknown type of casting message/);
      assertNotHandled();
      assertRequestCallCount(0, 0, 0, 0);
    });

    test('should not handle load message without url', function () {
      msg = castingMsgTemplate.get().load;
      delete msg.url;
      msg.seq = connector._lastSeq + 1;
      expect(() => presentation._controller.castMsg(msg))
            .to.throw(/Ilegal url/);
      assertNotHandled();
      assertRequestCallCount(0, 0, 0, 0);
    });

    test('should not handle seek message without time', function () {
      msg = castingMsgTemplate.get().seek;
      delete msg.time;
      msg.seq = connector._lastSeq + 1;
      expect(() => presentation._controller.castMsg(msg))
            .to.throw(/Ilegal time/);
      assertNotHandled();
      assertRequestCallCount(0, 0, 0, 0);
    });

    test('should not handle seek message with NaN', function () {
      msg = castingMsgTemplate.get().seek;
      msg.time = NaN;
      msg.seq = connector._lastSeq + 1;
      expect(() => presentation._controller.castMsg(msg))
            .to.throw(/Ilegal time/);
      assertNotHandled();
      assertRequestCallCount(0, 0, 0, 0);
    });

    test('should handle multiple messages at once', function () {
      var msgs = [
            castingMsgTemplate.get().load,
            castingMsgTemplate.get().pause,
            castingMsgTemplate.get().play
          ],
          lastSeq = connector._lastSeq;
      msgs[0].seq = ++lastSeq;
      msgs[1].seq = ++lastSeq;
      msgs[2].seq = ++lastSeq;
      presentation._controller.castMsg(msgs);
      assert.equal(spy.callCount, 3);
      assertRequestCallCount(1, 1, 0, 1);
      assert.isTrue(spyOnLoadRequest.calledWithExactly({ url : msgs[0].url }));
    });
  });
});