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

  var msg, mock, connector, presentation;

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
    mock = sinon.mock(presentation.receiver._session);
    mock.expects('send').once().withExactArgs(castingMessage.stringify(msg));
    connector.sendMsg(msg);
    mock.verify();
  });

  // suite('reply ack', function () {

  //   test('should reply ack', function () {

  //   });

  //   test('should reply ack with error', function () {

  //   });

  //   test('should not reply ack with wrong message sequence type', function () {

  //   });

  //   test('should not reply ack with wrong error type', function () {

  //   });
  // });

  // suite('report status', function () {

  //   test('should report status of buffering', function () {

  //   });

  //   test('should report status of loaded', function () {

  //   });

  //   test('should report status of buffered', function () {

  //   });

  //   test('should report status of playing', function () {

  //   });

  //   test('should report status of seeked', function () {

  //   });

  //   test('should report status of stopped', function () {

  //   });

  //   test('should report status of error', function () {

  //   });

  //   test('should not report status of unknown', function () {

  //   });

  //   test('should not report status without time', function () {

  //   });

  //   test('should not report status with wrong error type', function () {

  //   });
  // });

  // suite('handle remote message', function () {

  //   test('should handle load message', function () {

  //   });

  //   test('should handle play message', function () {

  //   });

  //   test('should handle pause message', function () {

  //   });

  //   test('should handle seek message', function () {

  //   });

  //   test('should not handle unknown message', function () {

  //   });

  //   test('should not handle load message without url', function () {

  //   });

  //   test('should not handle load message with wrong url type', function () {

  //   });

  //   test('should not handle seek message without time', function () {

  //   });

  //   test('should not handle seek message with wrong time type', function () {

  //   });
  // });

  // suite('handle events', function () {

  //   test('should handle on seesion message', function () {

  //   });

  //   test('should handle on seesion state change', function () {

  //   });
  // });
});
