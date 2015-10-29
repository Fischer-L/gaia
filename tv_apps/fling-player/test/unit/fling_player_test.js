/* global FlingPlayer, VideoPlayer, Connector,
          MockVideoElement, MockPresentation, castingMsgTemplate
*/
'use strict';

require('/bower_components/evt/index.js');
require('/shared/js/smart-screen/simple_key_navigation.js');
require('/shared/js/smart-screen/key_navigation_adapter.js');
requireApp('fling-player/test/unit/casting_message_template.js');
requireApp('fling-player/test/unit/mock_video_element.js');
requireApp('fling-player/test/unit/mock_presentation.js');
requireApp('fling-player/js/master_debug.js');
requireApp('fling-player/js/casting_message.js');
requireApp('fling-player/js/video_player.js');
requireApp('fling-player/js/connector.js');
requireApp('fling-player/js/fling_player.js');

suite('fling-player/fling_player', function() {

  var videoPlayer,
      connector,
      flingPlayer,
      mockVideo,
      mockPresentation,
      loadingUI,
      initialMsg,
      controlPanel,
      backwardButton,
      playButton,
      forwardButton,
      bufferedTimeBar,
      elapsedTimeBar,
      elapsedTime,
      durationTime;

  setup(function (done) {
    loadingUI = document.body.appendChild(document.createElement('div'));
    loadingUI.id = 'loading-section';

    initialMsg = document.body.appendChild(document.createElement('div'));
    initialMsg.id = 'initial-message-section';
    initialMsg.classList.add('fade-out');

    controlPanel = document.body.appendChild(document.createElement('div'));
    controlPanel.id = 'video-control-panel';
    controlPanel.classList.add('fade-out');

    backwardButton = document.body.appendChild(
      document.createElement('button')
    );
    backwardButton.id = 'backward-button';

    playButton = document.body.appendChild(document.createElement('button'));
    playButton.id = 'play-button';

    forwardButton = document.body.appendChild(document.createElement('button'));
    forwardButton.id = 'forward-button';

    bufferedTimeBar = document.body.appendChild(document.createElement('div'));
    bufferedTimeBar.id = 'buffered-time-bar';

    elapsedTimeBar = document.body.appendChild(document.createElement('div'));
    elapsedTimeBar.id = 'elapsed-time-bar';

    elapsedTime = document.body.appendChild(document.createElement('div'));
    elapsedTime.id = 'elapsed-time';

    durationTime = document.body.appendChild(document.createElement('div'));
    durationTime.id = 'duration-time';

    mockPresentation = new MockPresentation();
    mockVideo = new MockVideoElement({duration : 600, currentTime : 0});
    connector = new Connector(mockPresentation);
    videoPlayer = new VideoPlayer(mockVideo);
    flingPlayer = new FlingPlayer(videoPlayer, connector);

    mockPresentation.mInit();
    flingPlayer.init();
    connector.on('connected', () => {
      mockVideo.fireEvent(new Event('loadedmetadata'));
      done();
    });
  });

  teardown(function() {
    document.body.innerHTML = '';
  });

  suite('UI handling', function () { //return; // TMP

    test('should reset UI', function (done) {
      playButton.setAttribute('data-icon', 'fling-player-pause');
      elapsedTime.textContent = durationTime.textContent = '12:34';
      elapsedTimeBar.style.width = bufferedTimeBar.style.width = '50%';

      flingPlayer.resetUI();

      requestAnimationFrame(() => {
        assert.equal(playButton.getAttribute('data-icon'), 'fling-player-play');
        assert.equal(elapsedTime.textContent, '00:00', 'elapsedTime');
        assert.equal(durationTime.textContent, '00:00', 'durationTime');
        assert.equal(elapsedTimeBar.style.width, '0%', 'elapsedTimeBar');
        assert.equal(bufferedTimeBar.style.width, '0%', 'bufferedTimeBar');
        done();
      });
    });

    test('should show loading UI', function () {
      loadingUI.hidden = true;
      flingPlayer.showLoading(true);
      assert.isFalse(loadingUI.hidden);
    });

    test('should hide loading UI', function () {
      loadingUI.hidden = false;
      flingPlayer.showLoading(false);
      assert.isTrue(loadingUI.hidden);
    });

    test('should show initial message', function () {
      initialMsg.classList.add('fade-out');
      flingPlayer.showInitialMessage(true);
      assert.isFalse(initialMsg.classList.contains('fade-out'));
    });

    test('should show initial message for the min duration and then hide it',
         function (done) {
           var minDuration = flingPlayer.INITIAL_MSG_MIN_DISPLAY_TIME_MS;
           initialMsg.classList.add('fade-out');
           flingPlayer.showInitialMessage(true);
           flingPlayer.showInitialMessage(false);

           setTimeout(() => {
             assert.isFalse(
               initialMsg.classList.contains('fade-out'),
               'Not show initial message for the min duration'
             );
           }, minDuration / 2);

           setTimeout(() => {
             assert.isTrue(
               initialMsg.classList.contains('fade-out'),
               'Not hide initial message after the min duration'
             );
             done();
           }, minDuration + 1);
         }
    );

    test('should set play button to palying state', function () {
      playButton.setAttribute('data-icon', 'unknown-state');
      flingPlayer.setPlayButtonState('playing');
      assert.equal(playButton.getAttribute('data-icon'), 'fling-player-pause');
    });

    test('should set play button to paused state', function () {
      playButton.setAttribute('data-icon', 'unknown-state');
      flingPlayer.setPlayButtonState('paused');
      assert.equal(playButton.getAttribute('data-icon'), 'fling-player-play');
    });

    test('should show control panel constantly', function (done) {
      controlPanel.classList.add('fade-out');
      flingPlayer.showControlPanel();

      assert.isFalse(
        controlPanel.classList.contains('fade-out'), 'Not show control panel'
      );
      assert.isFalse(
        flingPlayer.isControlPanelHiding(), 'Not report correct state'
      );

      setTimeout(() => {
        assert.isFalse(
          controlPanel.classList.contains('fade-out'),
          'Not show control panel constantly'
        );
        assert.isFalse(
          flingPlayer.isControlPanelHiding(),
          'Not report correct state constantly'
        );
        done();
      }, flingPlayer.CONTROL_PANEL_HIDE_DELAY_MS + 1);
    });

    test('should show control panel and hide it automatically later',
         function (done) {
            controlPanel.classList.add('fade-out');
            flingPlayer.showControlPanel(true);

            assert.isFalse(
              controlPanel.classList.contains('fade-out'),
              'Not show control panel'
            );
            assert.isFalse(
              flingPlayer.isControlPanelHiding(),
              'Not report correct state'
            );

            setTimeout(() => {
              assert.isTrue(
                controlPanel.classList.contains('fade-out'),
                'Not hide control panel automatically later'
              );
              assert.isTrue(
                flingPlayer.isControlPanelHiding(),
                'Not report correct state later'
              );
              done();
            }, flingPlayer.CONTROL_PANEL_HIDE_DELAY_MS + 1);
          }
    );

    test('should hide control panel immediately', function () {
      controlPanel.classList.remove('fade-out');
      flingPlayer.hideControlPanel(true);

      assert.isTrue(
        controlPanel.classList.contains('fade-out'), 'Not hide control panel'
      );
      assert.isTrue(
        flingPlayer.isControlPanelHiding(), 'Not report correct state'
      );
    });

    test('should delay hiding control panel', function (done) {
      controlPanel.classList.remove('fade-out');
      flingPlayer.hideControlPanel();

      assert.isFalse(
        controlPanel.classList.contains('fade-out'),
        'Should not hide control panel immediately'
      );
      assert.isFalse(
        flingPlayer.isControlPanelHiding(),
        'Not report correct state'
      );

      setTimeout(() => {
        assert.isTrue(
          controlPanel.classList.contains('fade-out'),
          'Not hide control panel later'
        );
        assert.isTrue(
          flingPlayer.isControlPanelHiding(),
          'Not report correct state later'
        );
        done();
      }, flingPlayer.CONTROL_PANEL_HIDE_DELAY_MS + 1);
    });

    test('should move time bar', function (done) {
      elapsedTimeBar.style.width = '0%';
      bufferedTimeBar.style.width = '0%';

      flingPlayer.moveTimeBar('elapsed', mockVideo.duration * 0.1);
      flingPlayer.moveTimeBar('buffered', mockVideo.duration * 0.1);

      requestAnimationFrame(() => {
        assert.equal(
          elapsedTimeBar.style.width, '10%', 'Wrong elapsed time bar'
        );
        assert.equal(
          bufferedTimeBar.style.width, '10%', 'Wrong buffered time bar'
        );
        done();
      });
    });

    test('should not move time bar with negative time', function (done) {
      elapsedTimeBar.style.width = '10%';
      bufferedTimeBar.style.width = '10%';

      flingPlayer.moveTimeBar('elapsed', -1);
      flingPlayer.moveTimeBar('buffered', -1);

      requestAnimationFrame(() => {
        assert.equal(
          elapsedTimeBar.style.width, '10%', 'Wrong elapsed time bar'
        );
        assert.equal(
          bufferedTimeBar.style.width, '10%', 'Wrong buffered time bar'
        );
        done();
      });
    });

    test('should not move time bar with NaN time', function (done) {
      elapsedTimeBar.style.width = '10%';
      bufferedTimeBar.style.width = '10%';

      flingPlayer.moveTimeBar('elapsed', NaN);
      flingPlayer.moveTimeBar('buffered', NaN);

      requestAnimationFrame(() => {
        assert.equal(
          elapsedTimeBar.style.width, '10%', 'Wrong elapsed time bar'
        );
        assert.equal(
          bufferedTimeBar.style.width, '10%', 'Wrong buffered time bar'
        );
        done();
      });
    });

    test('should not move time bar with time bigger than duration',
         function (done) {
            elapsedTimeBar.style.width = '10%';
            bufferedTimeBar.style.width = '10%';

            flingPlayer.moveTimeBar('elapsed', mockVideo.duration + 1);
            flingPlayer.moveTimeBar('buffered', mockVideo.duration + 1);

            requestAnimationFrame(() => {
              assert.equal(
                elapsedTimeBar.style.width, '10%', 'Wrong elapsed time bar'
              );
              assert.equal(
                bufferedTimeBar.style.width, '10%', 'Wrong buffered time bar'
              );
              done();
            });
         }
    );

    test('should write elapsed time info with the right format', function () {
      var times = [
        {
          secs : 0,
          format : '00:00'
        },
        {
          secs : 5,
          format : '00:05'
        },
        {
          secs : 59,
          format : '00:59'
        },
        {
          secs : 60 * 1 + 5,
          format : '01:05'
        },
        {
          secs : 60 * 59 + 59,
          format : '59:59'
        },
        {
          secs : 3600 * 1 + 60 * 1 + 5,
          format : '01:01:05'
        },
        {
          secs : 3600 * 10 + 60 * 59 + 59,
          format : '10:59:59'
        },
        {
          secs : 3600 * 99 + 60 * 59 + 59,
          format : '99:59:59'
        },
        {
          secs : flingPlayer.MAX_DISPLAYED_VIDEO_TIME_SEC + 1,
          format : '99:59:59'
        }
      ];

      mockVideo.duration = flingPlayer.MAX_DISPLAYED_VIDEO_TIME_SEC + 10;
      times.forEach((t) => {
        flingPlayer.writeTimeInfo('elapsed', t.secs);
        assert.equal(elapsedTime.textContent, t.format);
      });
    });

    test('should write duration time info with the right format', function () {
      var times = [
        {
          secs : 0,
          format : '00:00'
        },
        {
          secs : 5,
          format : '00:05'
        },
        {
          secs : 59,
          format : '00:59'
        },
        {
          secs : 60 * 1 + 5,
          format : '01:05'
        },
        {
          secs : 60 * 59 + 59,
          format : '59:59'
        },
        {
          secs : 3600 * 1 + 60 * 1 + 5,
          format : '01:01:05'
        },
        {
          secs : 3600 * 10 + 60 * 59 + 59,
          format : '10:59:59'
        },
        {
          secs : 3600 * 99 + 60 * 59 + 59,
          format : '99:59:59'
        },
        {
          secs : flingPlayer.MAX_DISPLAYED_VIDEO_TIME_SEC + 1,
          format : '99:59:59'
        }
      ];

      times.forEach((t) => {
        mockVideo.duration = t.secs;
        flingPlayer.writeTimeInfo('duration', mockVideo.duration);
        assert.equal(durationTime.textContent, t.format);
      });
    });

    test('should not write illegal time', function () {
      var illegals;

      mockVideo.duration = 10;
      flingPlayer.writeTimeInfo('elapsed', mockVideo.duration);
      flingPlayer.writeTimeInfo('duration', mockVideo.duration);

      illegals = [ -1, NaN, mockVideo.duration + 1 ];
      illegals.forEach((t) => {

        flingPlayer.writeTimeInfo('elapsed', t);
        assert.equal(elapsedTime.textContent, '00:10', 'Wrong elapsed time');

        flingPlayer.writeTimeInfo('duration', t);
        assert.equal(durationTime.textContent, '00:10', 'Wrong duration time');
      });
    });
  });

  suite('Video handling', function () { //return; // TMP

    test('should play', function () {
      var spyOnPlay = sinon.spy(videoPlayer, 'play');
      var spyOnBtn = sinon.spy(flingPlayer, 'setPlayButtonState');

      flingPlayer.play();

      assert.isTrue(spyOnPlay.calledOnce, 'Not play');
      assert.isTrue(
        spyOnBtn.withArgs('playing').calledOnce,
        'Not set button to the palying state'
      );
    });

    test('should pause', function () {
      var spyOnPause = sinon.spy(videoPlayer, 'pause');
      var spyOnBtn = sinon.spy(flingPlayer, 'setPlayButtonState');

      flingPlayer.pause();

      assert.isTrue(spyOnPause.calledOnce, 'Not pause');
      assert.isTrue(
        spyOnBtn.withArgs('paused').calledOnce,
        'Not set button to the paused state'
      );
    });

    test('should seek', function () {
      var time = 30;
      var spyOnSeek = sinon.spy(videoPlayer, 'seek');
      var spyOnMoveTimeBar = sinon.spy(flingPlayer, 'moveTimeBar');
      var spyOnWriteTimeInfo = sinon.spy(flingPlayer, 'writeTimeInfo');
      var spyOnShowControlPanel = sinon.spy(flingPlayer, 'showControlPanel');

      flingPlayer.seek(time);

      assert.equal(
        mockVideo.currentTime, time,
        'Not change video currentTime'
      );
      assert.isTrue(
        spyOnSeek.withArgs(time).calledOnce,
        'Not seek'
      );
      assert.isTrue(
        spyOnMoveTimeBar.withArgs('elapsed', time).calledOnce,
        'Not move the elapsed bar'
      );
      assert.isTrue(
        spyOnWriteTimeInfo.withArgs('elapsed', time).calledOnce,
        'Not write the elapsed time info'
      );
      assert.isTrue(
        spyOnShowControlPanel.withArgs(true).calledOnce,
        'Not show control panel'
      );
    });
  });

  suite('Video event handling', function () { //return; // TMP

    var data, spyOnReportStatus;

    setup(function () {
      mockVideo.currentTime = 10;
      data = { 'time': mockVideo.currentTime };
      spyOnReportStatus = sinon.spy(flingPlayer._connector, 'reportStatus');
    });

    test('should handle loadedmetadata event', function () {
      var spyOnWriteTimeInfo = sinon.spy(flingPlayer, 'writeTimeInfo');

      mockVideo.fireEvent(new Event('loadedmetadata'));

      assert.isTrue(
        spyOnWriteTimeInfo.withArgs('elapsed', mockVideo.currentTime)
                          .calledOnce,
        'Not write right elapsed time info'
      );
      assert.isTrue(
        spyOnWriteTimeInfo.withArgs('duration', mockVideo.duration)
                          .calledOnce,
        'Not write right duration time info'
      );
      assert.isTrue(
        spyOnReportStatus.withArgs('loaded', data).calledOnce,
        'Not report correct status'
      );
    });

    test('should handle timeupdate event', function () {
      var bufEnd = mockVideo.buffered.end(0);
      var current = videoPlayer.getRoundedCurrentTime();
      var spyOnWriteTimeBar = sinon.spy(flingPlayer, 'moveTimeBar');
      var spyOnUpdate = sinon.spy(flingPlayer, '_updateControlPanel');
      var spyOnWriteTimeInfo = sinon.spy(flingPlayer, 'writeTimeInfo');

      mockVideo.fireEvent(new Event('timeupdate'));

      assert.isTrue(
        spyOnUpdate.calledOnce,
        'Not update control panel'
      );
      assert.isTrue(
        spyOnWriteTimeBar.withArgs('elapsed', current).calledOnce,
        'Not move the elapsed time bar'
      );
      assert.isTrue(
        spyOnWriteTimeBar.withArgs('buffered', bufEnd).calledOnce,
        'Not move the buffered time bar'
      );
      assert.isTrue(
        spyOnWriteTimeInfo.withArgs('elapsed', current).calledOnce,
        'Not move the elapsed time info'
      );
    });

    test('should handle waiting event', function () {
      var spyOnShowLoading = sinon.spy(flingPlayer, 'showLoading');

      mockVideo.fireEvent(new Event('waiting'));

      assert.isTrue(
        spyOnShowLoading.withArgs(true).calledOnce,
        'Not show loading UI'
      );
      assert.isTrue(
        spyOnReportStatus.withArgs('buffering', data).calledOnce,
        'Not report correct status'
      );
    });

    test('should handle playing event', function () {
      var spyOnShowLoading = sinon.spy(flingPlayer, 'showLoading');
      var spyOnShowInitialMessage =
              sinon.spy(flingPlayer, 'showInitialMessage');

      mockVideo.fireEvent(new Event('playing'));

      assert.isTrue(
        spyOnShowLoading.withArgs(false).calledOnce,
        'Not hide loading UI'
      );
      assert.isTrue(
        spyOnShowInitialMessage.withArgs(false).calledOnce,
        'Not hide initial msg'
      );
      assert.isTrue(
        spyOnReportStatus.withArgs('buffered', data).calledOnce,
        'Not report buffered status'
      );
      assert.isTrue(
        spyOnReportStatus.withArgs('playing', data).calledOnce,
        'Not report playing status'
      );
    });

    test('should handle seeked event', function () {
      var spyOnPlay = sinon.spy(flingPlayer, 'play');

      mockVideo.fireEvent(new Event('seeked'));

      assert.isTrue(
        spyOnPlay.calledOnce,
        'Not play after seeked event'
      );
      assert.isTrue(
        spyOnReportStatus.withArgs('seeked', data).calledOnce,
        'Not report correct status'
      );
    });

    test('should handle ended event', function () {
      var spyOnShowControlPanel = sinon.spy(flingPlayer, 'showControlPanel');
      var spyOnSetPlayButtonState =
              sinon.spy(flingPlayer, 'setPlayButtonState');

      mockVideo.fireEvent(new Event('ended'));

      assert.isTrue(
        spyOnShowControlPanel.withArgs().calledOnce,
        'Not show control panel'
      );
      assert.isTrue(
        spyOnSetPlayButtonState.withArgs('paused').calledOnce,
        'Not set play button to paused state'
      );
      assert.isTrue(
        spyOnReportStatus.withArgs('stopped', data).calledOnce,
        'Not report correct status'
      );
    });

    test('should handle pause event', function () {
      var spyOnShowControlPanel = sinon.spy(flingPlayer, 'showControlPanel');

      mockVideo.fireEvent(new Event('pause'));

      assert.isTrue(
        spyOnShowControlPanel.withArgs(true).calledOnce,
        'Not show control panel'
      );
      assert.isTrue(
        spyOnReportStatus.withArgs('stopped', data).calledOnce,
        'Not report correct status'
      );
    });

    test('should handle error event', function () {
      var spyOnShowLoading = sinon.spy(flingPlayer, 'showLoading');
      var e = {
        type : 'error',
        target : {
          error : { code : 404 }
        }
      };

      mockVideo.fireEvent(e);

      assert.isTrue(
        spyOnShowLoading.withArgs(false).calledOnce,
        'Not hide loading UI'
      );
      data.error = e.target.error.code;
      assert.isTrue(
        spyOnReportStatus.withArgs('error', data).calledOnce,
        'Not report correct status'
      );
    });
  });

  suite('Remote request event handling', function () { //return; // TMP

    var msg;

    setup(function () {
      msg = castingMsgTemplate.get();
    });

    test('should handle load request', function () {
      var spyOnPlay = sinon.spy(flingPlayer, 'play');
      var spyOnResetUI = sinon.spy(flingPlayer, 'resetUI');
      var spyOnPlayerLoad = sinon.spy(videoPlayer, 'load');
      var spyOnShowLoadingSpy = sinon.spy(flingPlayer, 'showLoading');

      mockPresentation.mCastMsgToReceiver(msg.load);

      assert.isTrue(
        spyOnPlayerLoad.withArgs(msg.load.url).calledOnce,
        'Not load'
      );
      assert.isTrue(
        spyOnPlay.calledOnce,
        'Not play'
      );
      assert.isTrue(
        spyOnResetUI.calledOnce,
        'Not reset UI'
      );
      assert.isTrue(
        spyOnShowLoadingSpy.withArgs(true).calledOnce,
        'Not show loading'
      );
    });

    test('should handle play request', function () {
      var spyOnPlay = sinon.spy(flingPlayer, 'play');

      mockPresentation.mCastMsgToReceiver(msg.play);

      assert.isTrue(
        spyOnPlay.calledOnce,
        'Not play'
      );
    });

    test('should handle pause request', function () {
      var spyOnPause = sinon.spy(flingPlayer, 'pause');

      mockPresentation.mCastMsgToReceiver(msg.pause);

      assert.isTrue(
        spyOnPause.calledOnce,
        'Not pause'
      );
    });

    test('should handle seek request', function () {
      var spyOnSeek = sinon.spy(flingPlayer, 'seek');

      mockPresentation.mCastMsgToReceiver(msg.seek);

      assert.isTrue(
        spyOnSeek.withArgs(msg.seek.time).calledOnce,
        'Not seek'
      );
    });
  });

  suite('User control handling', function () {

    var KEY = {};
    KEY.LEFT = {};
    KEY.LEFT.key =
    KEY.LEFT.code =
    KEY.LEFT.keyIdentifier = 'Left';
    KEY.LEFT.which =
    KEY.LEFT.keyCode = 37;

    KEY.RIGHT = {};
    KEY.RIGHT.key =
    KEY.RIGHT.code =
    KEY.RIGHT.keyIdentifier = 'Right';
    KEY.RIGHT.which =
    KEY.RIGHT.keyCode = 39;

    KEY.ENTER = {};
    KEY.ENTER.key =
    KEY.ENTER.code =
    KEY.ENTER.keyIdentifier = 'Enter';
    KEY.ENTER.which =
    KEY.ENTER.keyCode = 13;

    /**
     * @param {string} type 'keydown', 'keypress', 'keyup'
     */
    function dispatchKeyEvent(type, key, callback) {
      var e = new Event(type);
      e.key = key.key;
      e.code = key.code;
      e.keyIdentifier = key.keyIdentifier;
      e.which = key.which;
      e.keyCode = key.keyCode;
      window.addEventListener(type, function handle() {
        window.removeEventListener(type, handle);
        if (typeof callback == 'function') {
          callback();
        }
      });
      window.dispatchEvent(e);
    }

    test('should show control panel on keyup', function (done) {
      var spyOnShowControlPanel = sinon.spy(flingPlayer, 'showControlPanel');
      dispatchKeyEvent('keyup', KEY.ENTER, () => {
        assert.isTrue(
          spyOnShowControlPanel.withArgs(true).calledOnce,
          'Not show control panel'
        );
        done();
      });
    });

    test('should not play/pause/seek before showing control panel',
          function (done) {
            var spyOnPlay = sinon.spy(flingPlayer, 'play');
            var spyOnSeek = sinon.spy(flingPlayer, 'seek');
            var spyOnPause = sinon.spy(flingPlayer, 'pause');

            dispatchKeyEvent('keydown', KEY.ENTER, () => {
              dispatchKeyEvent('keypress', KEY.ENTER, () => {
                dispatchKeyEvent('keyup', KEY.ENTER, () => {
                  assert.equal(spyOnPlay.callCount, 0, 'Should not play');
                  assert.equal(spyOnSeek.callCount, 0, 'Should not play');
                  assert.equal(spyOnPause.callCount, 0, 'Should not play');
                  done();
                });
              });
            });
          }
    );

    test('should seek forward on enter key down from user', function (done) {
      var t = 20;
      var spyOnSeek = sinon.spy(flingPlayer, 'seek');

      mockVideo.currentTime = t;
      flingPlayer.showControlPanel();

      dispatchKeyEvent('keydown', KEY.RIGHT, () => {
        dispatchKeyEvent('keydown', KEY.ENTER, () => {
          assert.isTrue(spyOnSeek.calledOnce, 'Not seek');
          assert.isTrue(spyOnSeek.args[0] > t, 'Not seek forward');
        });
        done();
      });
    });

    test('should seek backward on enter key down from user', function (done) {
      var t = 20;
      var spyOnSeek = sinon.spy(flingPlayer, 'seek');

      mockVideo.currentTime = t;
      flingPlayer.showControlPanel();

      dispatchKeyEvent('keydown', KEY.LEFT, () => {
        dispatchKeyEvent('keydown', KEY.ENTER, () => {
          assert.isTrue(spyOnSeek.calledOnce, 'Not seek');
          assert.isTrue(spyOnSeek.args[0] < t, 'Not seek backward');
        });
        done();
      });
    });

    test('should stop seeking forward on enter key up from user',
         function (done) {
            var spyOnStopSeek = sinon.spy(flingPlayer, '_stopSeekOnKeyPress');

            flingPlayer.showControlPanel();

            dispatchKeyEvent('keydown', KEY.RIGHT, () => {
              dispatchKeyEvent('keyup', KEY.ENTER, () => {
                assert.isTrue(
                  spyOnStopSeek.calledOnce,
                  'Not stop seeking on key press'
                );
                done();
              });
            });
         }
    );

    test('should stop seeking backward on enter key up from user',
         function (done) {
            var spyOnStopSeek = sinon.spy(flingPlayer, '_stopSeekOnKeyPress');

            flingPlayer.showControlPanel();

            dispatchKeyEvent('keydown', KEY.LEFT, () => {
              dispatchKeyEvent('keyup', KEY.ENTER, () => {
                assert.isTrue(
                  spyOnStopSeek.calledOnce,
                  'Not stop seeking on key press'
                );
              });
              done();
            });
         }
    );

    test('should play on enter key up from user', function (done) {
      var spyOnPlay = sinon.spy(flingPlayer, 'play');

      flingPlayer.showControlPanel();

      dispatchKeyEvent('keyup', KEY.ENTER, () => {
        assert.isTrue(spyOnPlay.calledOnce, 'Not play');
        done();
      });
    });

    test('should pause on enter key up from user', function (done) {
      var spyOnPause = sinon.spy(flingPlayer, 'pause');

      flingPlayer.showControlPanel();
      flingPlayer.play();

      dispatchKeyEvent('keyup', KEY.ENTER, () => {
        assert.isTrue(spyOnPause.calledOnce, 'Not pause');
        done();
      });
    });
  });
});
