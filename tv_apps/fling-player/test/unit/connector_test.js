/* global Connector, castingMessage, castingMsgTemplate, MockPresentation */
'use strict';

requireApp('fling-player/js/mock/casting_message_template.js');
requireApp('fling-player/bower_components/evt/index.js');
requireApp('fling-player/js/mock/mock_presentation.js');
requireApp('fling-player/js/casting_message.js');
requireApp('fling-player/js/app_env.js');
requireApp('fling-player/js/master_debug.js');
requireApp('fling-player/js/connector.js');

suite('fling-player/Connector', function() {

  var exp, msg, spy, connector, presentation;

  setup(function (done) {
    var timer;
    presentation = new MockPresentation();
    connector = new Connector(presentation);
    presentation._controller.videoSrc = 'http://www.example.com/dummy.webm';
    presentation._controller.start();
    connector.init();

    this.timeout(200);
    timer = setInterval(() => {
      if (connector._isInit && connector._isInitSession) {
        done();
        clearInterval(timer);
      }
    });
  });

  test('should send message', function () {
    msg = castingMsgTemplate.get().ack;
    spy = sinon.spy(presentation.receiver._session, 'send');
    connector.sendMsg(msg);
    assert.isTrue(spy.withArgs(castingMessage.stringify(msg)).calledOnce);
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

    test('should not reply ack with wrong error type', function () {
      exp = castingMsgTemplate.get().ack;
      exp.seq = msg.seq;
      exp.error = new Error;
      expect(connector.replyACK.bind(connector, msg, exp.error))
          .to.throw(/in casting message of type/);
    });
  });

  suite('report status', function () {

    function assertCalledOnce() {
      assert.isTrue(
        spy.withArgs(msg).calledOnce,
        'Not called once with specified msg arg'
      );
    }

    function assertMsgSeq() {
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
      assertCalledOnce();
      assertMsgSeq();
    });

    test('should report status of loaded', function () {
      msg = castingMsgTemplate.get().statusLoaded;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertCalledOnce();
      assertMsgSeq();
    });

    test('should report status of buffered', function () {
      msg = castingMsgTemplate.get().statusBuffered;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertCalledOnce();
      assertMsgSeq();
    });

    test('should report status of playing', function () {
      msg = castingMsgTemplate.get().statusPlaying;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertCalledOnce();
      assertMsgSeq();
    });

    test('should report status of seeked', function () {
      msg = castingMsgTemplate.get().statusSeeked;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertCalledOnce();
      assertMsgSeq();
    });

    test('should report status of stopped', function () {
      msg = castingMsgTemplate.get().statusStopped;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, { time : msg.time });
      assertCalledOnce();
      assertMsgSeq();
    });

    test('should report status of error', function () {
      msg = castingMsgTemplate.get().statusError;
      msg.seq = connector._msgSeq;
      connector.reportStatus(msg.status, {
        time : msg.time,
        error : msg.error
      });
      assertCalledOnce();
      assertMsgSeq();
    });

    test('should not report status of unknown', function () {
      msg = castingMsgTemplate.get().statusPlaying;
      msg.seq = connector._msgSeq;
      msg.status = 'unknown';
      expect(
        connector.reportStatus.bind(
          connector, msg.status, { time : msg.time }
        )
      ).to.throw(/Ilegal status/);
    });

    test('should not report status without time', function () {
      msg = castingMsgTemplate.get().statusPlaying;
      msg.seq = connector._msgSeq;
      expect(
        connector.reportStatus.bind(
          connector, msg.status, {}
        )
      ).to.throw(/Ilegal time/);
    });

    test('should not report status with wrong error type', function () {
      msg = castingMsgTemplate.get().statusError;
      msg.seq = connector._msgSeq;
      msg.error = 404;
      expect(
        connector.reportStatus.bind(
          connector, msg.status, { time : msg.time, error : msg.error }
        )
      ).to.throw(/Ilegal error/);
    });
  });

  suite('handle remote message', function () {

    var spyOnLoadRequest, spyOnPlayRequest, spyOnPauseRequest, spyOnSeekRequest;

    setup(function () {
      spy = sinon.spy(connector, 'handleRemoteMessage');
    });

    test('should handle load message', function () {

    });

    test('should handle play message', function () {

    });

    test('should handle pause message', function () {

    });

    test('should handle seek message', function () {

    });

    test('should not handle unknown message', function () {

    });

    test('should not handle load message without url', function () {

    });

    test('should not handle load message with wrong url type', function () {

    });

    test('should not handle seek message without time', function () {

    });

    test('should not handle seek message with wrong time type', function () {

    });
  });
});
