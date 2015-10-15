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

  var flingPlayer,
      mockVideo,
      mockPresentation,
      loadingUI,
      controlPanel,
      backwardButton,
      playButton,
      forwardButton,
      bufferedTimeBar,
      elapsedTimeBar,
      elapsedTime,
      durationTime;

  setup(function (done) {

    loadingUI = document.createElement('div');
    loadingUI.id = 'loading-section';
    document.body.appendChild(loadingUI);

    controlPanel = document.createElement('div');
    controlPanel.id = 'video-control-panel';
    controlPanel.classList.add('fade-out');
    document.body.appendChild(controlPanel);

    backwardButton = document.createElement('button');
    backwardButton.id = 'backward-button';
    document.body.appendChild(backwardButton);

    playButton = document.createElement('button');
    playButton.id = 'play-button';
    document.body.appendChild(playButton);

    forwardButton = document.createElement('button');
    forwardButton.id = 'forward-button';
    document.body.appendChild(forwardButton);

    bufferedTimeBar = document.createElement('div');
    bufferedTimeBar.id = 'buffered-time-bar';
    document.body.appendChild(bufferedTimeBar);

    elapsedTimeBar = document.createElement('div');
    elapsedTimeBar.id = 'elapsed-time-bar';
    document.body.appendChild(elapsedTimeBar);

    elapsedTime = document.createElement('div');
    elapsedTime.id = 'elapsed-time';
    document.body.appendChild(elapsedTime);

    durationTime = document.createElement('div');
    durationTime.id = 'duration-time';
    document.body.appendChild(durationTime);

    mockPresentation = new MockPresentation();

    mockVideo = new MockVideoElement({
      duration : 600,
      currentTime : 0
    });

    flingPlayer = new FlingPlayer(
      new VideoPlayer(mockVideo),
      new Connector(mockPresentation)
    );

    mockPresentation._controller.start();
    setTimeout(() => { // Presentation start is async so let's wait a little bit
      flingPlayer.init();
      done();
    }, 200);
  });

  teardown(function() {
    document.body.removeChild(loadingUI);
    document.body.removeChild(controlPanel);
    document.body.removeChild(backwardButton);
    document.body.removeChild(playButton);
    document.body.removeChild(forwardButton);
    document.body.removeChild(bufferedTimeBar);
    document.body.removeChild(elapsedTimeBar);
    document.body.removeChild(elapsedTime);
    document.body.removeChild(durationTime);
  });

  suite('UI handling', function () {

    test('should reset UI', function (done) {
      playButton.setAttribute('data-icon', 'fling-player-pause');
      elapsedTime.textContent = durationTime.textContent = '12:34';
      elapsedTimeBar.style.width = bufferedTimeBar.style.width = '50%';

      flingPlayer.resetUI();

      setTimeout(() => {
        assert.equal(playButton.getAttribute('data-icon'), 'fling-player-play');
        assert.equal(elapsedTime.textContent, '00:00', 'elapsedTime');
        assert.equal(durationTime.textContent, '00:00', 'durationTime');
        assert.equal(elapsedTimeBar.style.width, '0%', 'elapsedTimeBar');
        assert.equal(bufferedTimeBar.style.width, '0%', 'bufferedTimeBar');
        done();
      }, 1000);
    });

    test('should show loading UI', function () {
      loadingUI.hidden = true;
      flingPlayer.showLoading(true);
      assert.equal(loadingUI.hidden, false);
    });

    test('should hide loading UI', function () {
      loadingUI.hidden = false;
      flingPlayer.showLoading(false);
      assert.equal(loadingUI.hidden, true);
    });

    test('should set play button to palying state', function () {
      playButton.setAttribute('data-icon', 'fling-player-playing');
      flingPlayer.setPlayButtonState('playing');
      assert.equal(playButton.getAttribute('data-icon'), 'fling-player-pause');
    });

    test('should set play button to paused state', function () {
      playButton.setAttribute('data-icon', 'fling-player-pause');
      flingPlayer.setPlayButtonState('paused');
      assert.equal(playButton.getAttribute('data-icon'), 'fling-player-play');
    });

    test('should show control panel', function (done) {
      controlPanel.classList.add('fade-out');
      flingPlayer.showControlPanel();

      assert.isFalse(
        controlPanel.classList.contains('fade-out'), 'Class not updated'
      );
      assert.isFalse(
        flingPlayer.isControlPanelHiding(), 'Wrong isControlPanelHiding'
      );

      setTimeout(() => {
        assert.isFalse(
          controlPanel.classList.contains('fade-out'),
          'Class should not be updated afterwards'
        );
        assert.isFalse(
          flingPlayer.isControlPanelHiding(),
          'Wrong isControlPanelHiding afterwards'
        );
        done();
      }, flingPlayer.CONTROL_PANEL_HIDE_DELAY_MS + 200);
    });

    test('should show control panel and hide automatically later',
         function (done) {
            controlPanel.classList.add('fade-out');
            flingPlayer.showControlPanel(true);

            assert.isFalse(
              controlPanel.classList.contains('fade-out'), 'Class not updated'
            );
            assert.isFalse(
              flingPlayer.isControlPanelHiding(), 'Wrong isControlPanelHiding'
            );

            setTimeout(() => {
              assert.isTrue(
                controlPanel.classList.contains('fade-out'),
                'Class should be updated afterwards'
              );
              assert.isTrue(
                flingPlayer.isControlPanelHiding(),
                'Wrong isControlPanelHiding afterwards'
              );
              done();
            }, flingPlayer.CONTROL_PANEL_HIDE_DELAY_MS + 200);
          }
    );

    test('should hide control panel immediately', function () {
      controlPanel.classList.remove('fade-out');
      flingPlayer.hideControlPanel(true);

      assert.isTrue(
        controlPanel.classList.contains('fade-out'), 'Class not updated'
      );
      assert.isTrue(
        flingPlayer.isControlPanelHiding(), 'Wrong isControlPanelHiding'
      );
    });

    test('should delay hiding control panel', function (done) {
      controlPanel.classList.remove('fade-out');
      flingPlayer.hideControlPanel();

      assert.isFalse(
        controlPanel.classList.contains('fade-out'),
        'Class should be not updated'
      );
      assert.isFalse(
        flingPlayer.isControlPanelHiding(),
        'Wrong isControlPanelHiding'
      );

      setTimeout(() => {
        assert.isTrue(
          controlPanel.classList.contains('fade-out'),
          'Class should be updated afterwards'
        );
        assert.isTrue(
          flingPlayer.isControlPanelHiding(),
          'Wrong isControlPanelHiding afterwards'
        );
        done();
      }, flingPlayer.CONTROL_PANEL_HIDE_DELAY_MS + 200);
    });

    test('should move time bar', function (done) {
      elapsedTimeBar.style.width = '0%';
      bufferedTimeBar.style.width = '0%';

      flingPlayer.moveTimeBar('elapsed', mockVideo.duration * 0.1);
      flingPlayer.moveTimeBar('buffered', mockVideo.duration * 0.1);

      setTimeout(() => {
        assert.equal(
          elapsedTimeBar.style.width, '10%', 'Wrong elapsed time bar'
        );
        assert.equal(
          bufferedTimeBar.style.width, '10%', 'Wrong buffered time bar'
        );
        done();
      }, 1000);
    });

    test('should not move time bar with negative time', function (done) {
      elapsedTimeBar.style.width = '10%';
      bufferedTimeBar.style.width = '10%';

      flingPlayer.moveTimeBar('elapsed', -1);
      flingPlayer.moveTimeBar('buffered', -1);

      setTimeout(() => {
        assert.equal(
          elapsedTimeBar.style.width, '10%', 'Wrong elapsed time bar'
        );
        assert.equal(
          bufferedTimeBar.style.width, '10%', 'Wrong buffered time bar'
        );
        done();
      }, 1000);
    });

    test('should not move time bar with NaN time', function (done) {
      elapsedTimeBar.style.width = '10%';
      bufferedTimeBar.style.width = '10%';

      flingPlayer.moveTimeBar('elapsed', NaN);
      flingPlayer.moveTimeBar('buffered', NaN);

      setTimeout(() => {
        assert.equal(
          elapsedTimeBar.style.width, '10%', 'Wrong elapsed time bar'
        );
        assert.equal(
          bufferedTimeBar.style.width, '10%', 'Wrong buffered time bar'
        );
        done();
      }, 1000);
    });

    test('should not move time bar with time bigger than duration',
         function (done) {
            elapsedTimeBar.style.width = '10%';
            bufferedTimeBar.style.width = '10%';

            flingPlayer.moveTimeBar('elapsed', mockVideo.duration + 1);
            flingPlayer.moveTimeBar('buffered', mockVideo.duration + 1);

            setTimeout(() => {
              assert.equal(
                elapsedTimeBar.style.width, '10%', 'Wrong elapsed time bar'
              );
              assert.equal(
                bufferedTimeBar.style.width, '10%', 'Wrong buffered time bar'
              );
              done();
            }, 1000);
         }
    );

    test('should write time info with the right format', function () { // TODO
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

    test('should write elapsed time info', function () {
      var time = 60 * 25 + 5;
      var info = '25:05';
      mockVideo.duration = time + 1;
      flingPlayer.writeTimeInfo('elapsed', time);
      assert.equal(elapsedTime.textContent, info);
    });

    test('should write duration time info', function () {
      var info = '25:05';
      mockVideo.duration = 60 * 25 + 5;
      flingPlayer.writeTimeInfo('duration', mockVideo.duration);
      assert.equal(durationTime.textContent, info);
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

  suite('Video handling', function () {

    test('should play', function () {
      var spyOnPlay = sinon.spy(flingPlayer._player, 'play');
      var spyOnBtn = sinon.spy(flingPlayer, 'setPlayButtonState');

      flingPlayer.play();

      assert.isTrue(spyOnPlay.calledOnce, 'Not play');
      assert.isTrue(
        spyOnBtn.withArgs('playing').calledOnce,
        'Not set button to the palying state'
      );
    });

    test('should pause', function () {
      var spyOnPause = sinon.spy(flingPlayer._player, 'pause');
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
      var spyOnSeek = sinon.spy(flingPlayer._player, 'seek');
      var spyOnMoveTimeBar = sinon.spy(flingPlayer, 'moveTimeBar');
      var spyOnWriteTimeInfo = sinon.spy(flingPlayer, 'writeTimeInfo');
      var spyOnShowControlPanel = sinon.spy(flingPlayer, 'showControlPanel');

      flingPlayer.seek(time);

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

  suite('Video event handling', function () {

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
      var spyOnUpdate = sinon.spy(flingPlayer,
                                  '_startUpdateControlPanelContinuously');

      mockVideo.fireEvent(new Event('playing'));

      assert.isTrue(
        spyOnShowLoading.withArgs(false).calledOnce,
        'Not hide loading UI'
      );
      assert.isTrue(
        spyOnUpdate.calledOnce,
        'Not start updating control panel'
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
      mockVideo.fireEvent(new Event('seeked'));

      assert.isTrue(
        spyOnReportStatus.withArgs('seeked', data).calledOnce,
        'Not report correct status'
      );
    });

    test('should handle ended event', function () {
      var spyOnShowControlPanel = sinon.spy(flingPlayer, 'showControlPanel');
      var spyOnStop = sinon.spy(flingPlayer,
                                '_stopUpdateControlPanelContinuously');

      mockVideo.fireEvent(new Event('ended'));

      assert.isTrue(
        spyOnShowControlPanel.withArgs().calledOnce,
        'Not show control panel'
      );
      assert.isTrue(
        spyOnStop.calledOnce,
        'Not stop updating control panel'
      );
      assert.isTrue(
        spyOnReportStatus.withArgs('stopped', data).calledOnce,
        'Not report correct status'
      );
    });

    test('should handle pause event', function () {
      var spyOnShowControlPanel = sinon.spy(flingPlayer, 'showControlPanel');
      var spyOnStop = sinon.spy(flingPlayer,
                                '_stopUpdateControlPanelContinuously');

      mockVideo.fireEvent(new Event('pause'));

      assert.isTrue(
        spyOnShowControlPanel.withArgs(true).calledOnce,
        'Not show control panel'
      );
      assert.isTrue(
        spyOnStop.calledOnce,
        'Not stop updating control panel'
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

  suite('Remote request event handling', function () {

    var msg;

    setup(function () {
      msg = castingMsgTemplate.get();
    });

    test('should handle load request', function () {
      var spyOnPlayerLoad = sinon.spy(flingPlayer._player, 'load');
      var spyOnPlay = sinon.spy(flingPlayer, 'play');
      var spyOnResetUI = sinon.spy(flingPlayer, 'resetUI');
      var spyOnShowLoadingSpy = sinon.spy(flingPlayer, 'showLoading');

      mockPresentation._controller.castMsg(msg.load);

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

      mockPresentation._controller.castMsg(msg.play);

      assert.isTrue(
        spyOnPlay.calledOnce,
        'Not play'
      );
    });

    test('should handle pause request', function () {
      var spyOnPause = sinon.spy(flingPlayer, 'pause');

      mockPresentation._controller.castMsg(msg.pause);

      assert.isTrue(
        spyOnPause.calledOnce,
        'Not pause'
      );
    });

    test('should handle seek request', function () {
      var spyOnSeek = sinon.spy(flingPlayer, 'seek');

      mockPresentation._controller.castMsg(msg.seek);

      assert.isTrue(
        spyOnSeek.withArgs(msg.seek.time).calledOnce,
        'Not seek'
      );
    });
  });

  suite('User control handling', function () {

    test('should show control panel on demand from user', function () {
      var spyOnShowControlPanel = sinon.spy(flingPlayer, 'showControlPanel');
      flingPlayer.onDemandingControlPanel();
      assert.isTrue(
        spyOnShowControlPanel.withArgs(true).calledOnce,
        'NOt show control panel'
      );
    });

    test('should not react to user control before showing control panel',
         function () {
            var spyOnPlay = sinon.spy(flingPlayer, 'play');
            var spyOnSeek = sinon.spy(flingPlayer, 'seek');
            var spyOnPause = sinon.spy(flingPlayer, 'pause');
            var spyOnStopSeek = sinon.spy(flingPlayer, '_stopSeekOnKeyPress');
            var spyOnStartSeek = sinon.spy(flingPlayer, '_startSeekOnKeyPress');

            flingPlayer.onKeyEnterDown();
            flingPlayer.onKeyEnterUp();

            assert.isFalse(
              spyOnPlay.calledOnce,
              'Should not play'
            );
            assert.isFalse(
              spyOnSeek.calledOnce,
              'Should not seek'
            );
            assert.isFalse(
              spyOnPause.calledOnce,
              'Should not pause'
            );
            assert.isFalse(
              spyOnStopSeek.calledOnce,
              'Should not call _stopSeekOnKeyPress'
            );
            assert.isFalse(
              spyOnStartSeek.calledOnce,
              'Should not call _startSeekOnKeyPress'
            );
         }
    );

    test('should seek forward on enter key down from user', function () {
      var spyOnSeek = sinon.spy(flingPlayer, 'seek');
      var spyOnStartSeek = sinon.spy(flingPlayer, '_startSeekOnKeyPress');

      flingPlayer.showControlPanel();
      flingPlayer._keyNav.focusOn(forwardButton);
      flingPlayer.onKeyEnterDown();

      assert.isTrue(
        spyOnStartSeek.withArgs('forward').calledOnce,
        'Not start forward seeking on key press'
      );
      assert.isTrue(
        spyOnSeek.calledOnce,
        'Not seek'
      );
    });

    test('should seek backward on enter key down from user', function () {
      var spyOnSeek = sinon.spy(flingPlayer, 'seek');
      var spyOnStartSeek = sinon.spy(flingPlayer, '_startSeekOnKeyPress');

      flingPlayer.showControlPanel();
      flingPlayer._keyNav.focusOn(backwardButton);
      flingPlayer.onKeyEnterDown();

      assert.isTrue(
        spyOnStartSeek.withArgs('backward').calledOnce,
        'Not start backward seeking on key press'
      );
      assert.isTrue(
        spyOnSeek.calledOnce,
        'Not seek'
      );
    });

    test('should stop seeking forward on enter key up from user',
         function () {
            var spyOnStopSeek = sinon.spy(flingPlayer, '_stopSeekOnKeyPress');

            flingPlayer.showControlPanel();
            flingPlayer._keyNav.focusOn(forwardButton);
            flingPlayer.onKeyEnterUp();

            assert.isTrue(
              spyOnStopSeek.calledOnce,
              'Not stop seeking on key press'
            );
         }
    );

    test('should stop seeking backward on enter key up from user',
         function () {
            var spyOnStopSeek = sinon.spy(flingPlayer, '_stopSeekOnKeyPress');

            flingPlayer.showControlPanel();
            flingPlayer._keyNav.focusOn(backwardButton);
            flingPlayer.onKeyEnterUp();

            assert.isTrue(
              spyOnStopSeek.calledOnce,
              'Not stop seeking on key press'
            );
         }
    );

    test('should play on enter key up from user', function () {
      var spyOnPlay = sinon.spy(flingPlayer, 'play');

      flingPlayer.showControlPanel();
      flingPlayer._keyNav.focusOn(playButton);
      flingPlayer.onKeyEnterUp();

      assert.isTrue(spyOnPlay.calledOnce, 'Not play');
    });

    test('should pause on enter key up from user', function () {
      var spyOnPause = sinon.spy(flingPlayer, 'pause');

      flingPlayer.play();
      flingPlayer.showControlPanel();
      flingPlayer._keyNav.focusOn(playButton);
      flingPlayer.onKeyEnterUp();

      assert.isTrue(spyOnPause.calledOnce, 'Not pause');
    });
  });
});
