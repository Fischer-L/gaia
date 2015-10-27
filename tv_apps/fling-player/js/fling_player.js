/* global VideoPlayer, Connector, mDBG, KeyNavigationAdapter,
          SimpleKeyNavigation
 */
 /* global MockVideoElement, MockPresentation, castingMsgTemplate
 */
(function(exports) {
  'use strict';

  // Helping variables, methods

  var uiID = {
    player : 'player',
    loadingUI : 'loading-section',
    controlPanel : 'video-control-panel',
    backwardButton : 'backward-button',
    playButton : 'play-button',
    forwardButton : 'forward-button',
    bufferedTimeBar : 'buffered-time-bar',
    elapsedTimeBar : 'elapsed-time-bar',
    elapsedTime : 'elapsed-time',
    durationTime : 'duration-time'
  };

  function $(id) {
    return document.getElementById(id);
  }

  // Helping variables, methods end
  /**
   * FlingPlayer could be controlled by 2 sources.
   * The 1st source is remote control device, like Fennec,
   * which sends command through the Presentation API.
   * The 2nd source is TV remote controller which sends command through
   * UI navigation by pressing TV remote controller's key
   */
  function FlingPlayer(videoPlayer, connector) {
    this._player = videoPlayer;
    this._connector = connector;
  }

  var proto = FlingPlayer.prototype;

  proto.MAX_DISPLAYED_VIDEO_TIME_SEC = 3600 * 99 + 60 * 59 + 59;
  proto.CONTROL_PANEL_HIDE_DELAY_MS = 3000;
  proto.SEEK_ON_KEY_PRESS_INTERVAL_MS = 150;
  proto.SEEK_ON_LONG_KEY_PRESS_MS = 5000;
  proto.SEEK_ON_KEY_PRESS_NORMAL_STEP_SEC = 10;
  proto.SEEK_ON_KEY_PRESS_LARGE_STEP_SEC = 30;

  proto.init = function () {

    this._seekOnKeyPressTimer = null;
    this._seekOnKeyPressDirection = null; // 'backward' or 'forward'
    this._seekOnKeyPressStartTime = null; // in ms
    this._hideControlsTimer = null;

    this._loadingUI = $(uiID.loadingUI);
    this._controlPanel = $(uiID.controlPanel);
    this._backwardButton = $(uiID.backwardButton);
    this._playButton = $(uiID.playButton);
    this._forwardButton = $(uiID.forwardButton);
    this._bufferedTimeBar = $(uiID.bufferedTimeBar);
    this._elapsedTimeBar = $(uiID.elapsedTimeBar);
    this._elapsedTime = $(uiID.elapsedTime);
    this._durationTime = $(uiID.durationTime);

    this._keyNav = new SimpleKeyNavigation();
    this._keyNav.start(
      [this._backwardButton, this._playButton, this._forwardButton],
      SimpleKeyNavigation.DIRECTION.HORIZONTAL
    );
    this._keyNav.focusOn(this._playButton);
    this._keyNav.pause();

    this._keyNavAdapter = new KeyNavigationAdapter();
    this._keyNavAdapter.init();
    this._keyNavAdapter.on('enter', this.onKeyEnterDown.bind(this));
    this._keyNavAdapter.on('enter-keyup', this.onKeyEnterUp.bind(this));
    this._keyNavAdapter.on('esc-keyup',
      this.onDemandingControlPanel.bind(this)
    );
    this._keyNavAdapter.on('move-keyup',
      this.onDemandingControlPanel.bind(this)
    );
    this._keyNavAdapter.on('enter-keyup',
      this.onDemandingControlPanel.bind(this)
    );

    document.addEventListener('visibilitychange', () => {
      // We don't need to restore the video while visibilityState goes back
      // because system app will kill the original one and relaunch a new one.
      if (document.visibilityState === 'hidden') {
        this._player.release();
      }
    });

    this._initPlayer();
    this._initSession();
  };

  proto._initSession = function () {
    this._connector.init();
    this._connector.on('loadRequest', this.onLoadRequest.bind(this));
    this._connector.on('playRequest', this.onPlayRequest.bind(this));
    this._connector.on('seekRequest', this.onSeekRequest.bind(this));
    this._connector.on('pauseRequest', this.onPauseRequest.bind(this));
  };

  proto._initPlayer = function () {
    this._player.init();
    this._player.addEventListener('loadedmetadata', this);
    this._player.addEventListener('timeupdate', this);
    this._player.addEventListener('waiting', this);
    this._player.addEventListener('playing', this);
    this._player.addEventListener('seeked', this);
    this._player.addEventListener('pause', this);
    this._player.addEventListener('ended', this);
    this._player.addEventListener('error', this);
  };

  // UI handling

  proto.resetUI = function () {
    this.moveTimeBar('elapsed', 0);
    this.moveTimeBar('buffered', 0);
    this.writeTimeInfo('elapsed', 0);
    this.writeTimeInfo('duration', 0);
    this.setPlayButtonState('paused');
  };

  proto.showLoading = function (loading) {
    this._loadingUI.hidden = !loading;
  };

  /**
   * @param {String} state 'playing' or 'paused'
   */
  proto.setPlayButtonState = function (state) {
    switch (state) {
      case 'playing':
        this._playButton.setAttribute('data-icon', 'fling-player-pause');
      break;

      case 'paused':
        this._playButton.setAttribute('data-icon', 'fling-player-play');
      break;
    }
  };

  proto.isControlPanelHiding = function () {
    return this._controlPanel.classList.contains('fade-out');
  };

  /**
   * @param {Boolean} autoHide? Auto hide the controls later. Default to false
   */
  proto.showControlPanel = function (autoHide) {

    if (this._hideControlsTimer) {
      clearTimeout(this._hideControlsTimer);
      this._hideControlsTimer = null;
    }

    this._keyNav.resume();
    this._controlPanel.classList.remove('fade-out');

    if (autoHide === true) {
      this.hideControlPanel();
    }
  };

  /**
   * @param {Boolean} immediate? Hide immediately or later. Default to false.
   */
  proto.hideControlPanel = function (immediate) {

    if (this._hideControlsTimer) {
      clearTimeout(this._hideControlsTimer);
      this._hideControlsTimer = null;
    }

    if (immediate === true) {

      if (!this.isControlPanelHiding()) {
        this._keyNav.pause();
        this._controlPanel.classList.add('fade-out');
      }

    } else {

      this._hideControlsTimer = setTimeout(() => {
        this.hideControlPanel(true);
      }, this.CONTROL_PANEL_HIDE_DELAY_MS);
    }
  };

  /**
   * @param {string} type 'buffered' or 'elapsed'
   * @param {number} sec the sec in video you want to move to
   */
  proto.moveTimeBar = function (type, sec) {

    // mDBG.log('FlingPlayer#moveTimeBar');
    // mDBG.log('Move type ', type);
    // mDBG.log('Move to ', sec);

    var timeBar = this[`_${type}TimeBar`];
    var duration = this._player.getRoundedDuration();
    sec = Math.round(sec);

    if (!timeBar ||
        typeof sec != 'number' ||
        isNaN(sec) ||
        sec < 0 ||
        sec > duration
    ) {
      mDBG.warn('Not moving due to corrupt type/sec', type, sec);
      return;
    }

    requestAnimationFrame(() => {
      // mDBG.log('Move to sec / duration = %d / %d', sec, duration);
      timeBar.style.width = (100 * sec / duration) + '%';
    });
  };

  /**
   * @param {string} type 'elapsed' or 'duration'
   * @param {number} sec
   */
  proto.writeTimeInfo = function (type, sec) {

    var timeInfo = this[`_${type}Time`];
    var duration = Math.min(this._player.getRoundedDuration(),
                            this.MAX_DISPLAYED_VIDEO_TIME_SEC);
    sec = Math.min(Math.round(sec), this.MAX_DISPLAYED_VIDEO_TIME_SEC);

    if (!timeInfo ||
        (sec >= 0) === false ||
        (sec <= duration) === false
    ) {
      return;
    }

    var t = this._player.parseTime(sec);
    t.hh = (t.hh <= 0) ? '' :
           (t.hh < 10) ? '0' + t.hh + ':' : t.hh + ':';
    t.mm = (t.mm < 10) ? '0' + t.mm + ':' : t.mm + ':';
    t.ss = (t.ss < 10) ? '0' + t.ss : t.ss;
    timeInfo.textContent = t.hh + t.mm + t.ss;
  };

  // UI handling end

  // Video handling

  proto.play = function () {
    this._player.play();
    this.setPlayButtonState('playing');
  };

  proto.pause = function () {
    this._player.pause();
    this.setPlayButtonState('paused');
  };

  proto._updateControlPanel = function () {
    var buf = this._player.getVideo().buffered;
    var current = this._player.getRoundedCurrentTime();

    this.writeTimeInfo('elapsed', current);
    this.moveTimeBar('elapsed', current);

    for (var bufEnd, bufStart, i = 0; i < buf.length; ++i ) {
      bufEnd = buf.end(i);
      bufStart = buf.start(i);
      if (bufStart <= current && current <= bufEnd) {
        this.moveTimeBar('buffered', bufEnd);
      }
    }
  };

  proto._startSeekOnKeyPress = function (dir) {
    if (this._seekOnKeyPressStartTime == null) { // Do not double start
      this._seekOnKeyPressStartTime = (new Date()).getTime();
      this._seekOnKeyPressDirection = dir;
      this._seekOnKeyPress();
    }
  };

  proto._stopSeekOnKeyPress = function () {
    clearTimeout(this._seekOnKeyPressTimer);
    this._seekOnKeyPressDirection = null;
    this._seekOnKeyPressStartTime = null;
    this._seekOnKeyPressTimer = null;
  };

  /**
   * This is to handle this case that user seeks on video by long pressing key.
   * The seeking policy would go based on duration of pressing
   */
  proto._seekOnKeyPress = function () {

    if (this._seekOnKeyPressStartTime != null) {

      var time = this._player.getRoundedCurrentTime();
      var factor = (this._seekOnKeyPressDirection == 'backward') ? -1 : 1;
      var seekDuration = (new Date()).getTime() - this._seekOnKeyPressStartTime;
      var seekStep = (seekDuration > this.SEEK_ON_LONG_KEY_PRESS_MS) ?
                      this.SEEK_ON_KEY_PRESS_LARGE_STEP_SEC :
                      this.SEEK_ON_KEY_PRESS_NORMAL_STEP_SEC;

      time += factor * seekStep;
      time = Math.min(Math.max(0, time), this._player.getRoundedDuration());

      this.seek(time);

      this._seekOnKeyPressTimer = setTimeout(
        this._seekOnKeyPress.bind(this),
        this.SEEK_ON_KEY_PRESS_INTERVAL_MS
      );
    }
  };

  proto.seek = function (sec) {
    this._player.seek(sec);
    this.moveTimeBar('elapsed', sec);
    this.writeTimeInfo('elapsed', sec);
    this.showControlPanel(true);
  };

  // Video handling end

  // Event handling

  proto.handleEvent = function handleVideoEvent(e) {

    mDBG.log('FlingPlayer#handleEvent: e.type = ' + e.type);

    var data = { 'time': this._player.getRoundedCurrentTime() };

    switch (e.type) {

      case 'loadedmetadata':
        this.writeTimeInfo('elapsed', this._player.getRoundedCurrentTime());
        this.writeTimeInfo('duration', this._player.getRoundedDuration());
        this._connector.reportStatus('loaded', data);
      break;

      case 'timeupdate':
        this._updateControlPanel();
      break;

      case 'waiting':
        this.showLoading(true);
        this._connector.reportStatus('buffering', data);
      break;

      case 'playing':
        this.showLoading(false);
        // TODO: Hide 'Starting video cast from ...'
        this._connector.reportStatus('buffered', data);
        this._connector.reportStatus('playing', data);
      break;

      case 'seeked':
        this.play();
        this._connector.reportStatus('seeked', data);
      break;

      case 'pause':
        this.showControlPanel(true);
        this._connector.reportStatus('stopped', data);
      break;

      case 'ended':
        this.showControlPanel();
        this.setPlayButtonState('paused'); // Make sure state changed at ending
        this._connector.reportStatus('stopped', data);
      break;

      case 'error':
        this.showLoading(false);
        data.error = e.target.error.code;
        this._connector.reportStatus('error', data);
      break;
    }
  };

  proto.onLoadRequest = function (e) {
    this.resetUI();
    this.showLoading(true);
    // TODO: Diplay 'Starting video cast from ...'
    this._player.load(e.url);
    this.play();
  };

  proto.onPlayRequest = function () {
    this.play();
  };

  proto.onPauseRequest = function () {
    this.pause();
  };

  proto.onSeekRequest = function (e) {
    this.seek(e.time);
  };

  proto.onKeyEnterDown = function () {

    // mDBG.log('FlingPlayer#onKeyEnterDown');

    if (this.isControlPanelHiding()) {
      mDBG.log('The control panel is hiding so no action is taken.');
      return;
    }

    var focused = this._keyNav.getFocusedElement();
    if (focused) {

      // mDBG.log('control focused = ', focused);

      switch (focused.id) {

        case uiID.backwardButton:
        case uiID.forwardButton:
          if (focused === this._backwardButton) {
            this._startSeekOnKeyPress('backward');
          } else {
            this._startSeekOnKeyPress('forward');
          }
        break;
      }
    }
  };

  proto.onKeyEnterUp = function () {
    // mDBG.log('FlingPlayer#onKeyEnterUp');

    if (this.isControlPanelHiding()) {
      mDBG.log('The control panel is hiding so no action is taken.');
      return;
    }

    var focused = this._keyNav.getFocusedElement();
    if (focused) {

      // mDBG.log('control focused = ', focused);

      switch (focused.id) {

        case uiID.playButton:
          if (this._player.isPlaying()) {
            this.pause();
          } else {
            this.play();
          }
        break;

        case uiID.backwardButton:
        case uiID.forwardButton:
          this._stopSeekOnKeyPress();
        break;
      }
    }
  };

  proto.onDemandingControlPanel = function () {
    // mDBG.log('FlingPlayer#onDemandingControlPanel');
    this.showControlPanel(true);
  };

  // Event handling end

  window.addEventListener('load', function() {

    // TMP DEL
    if (mDBG.isDBG() && 1) {

      var env_testOnB2G = false;

      var initForTest = function () {

        var fp, mockVideo, mockPresentation;

        mockVideo = new MockVideoElement({
          duration : 600,
          currentTime : 0
        });
        mockVideo = document.getElementById(uiID.player);
        mockVideo.handleEvent = function (e) {
          console.log('------ Video event : ' + e.type);
          switch (e.type) {
            case 'timeupdate':
              console.log('---------- Current Time : ' + mockVideo.currentTime);
            break;
          }
        }.bind(mockVideo);
        for (var p in mockVideo) {
          if (p.indexOf('on') === 0) {
            p = p.substr(2);
            switch (p) {
              case 'click':
              case 'blur':
              case 'focus':
              case 'keyup':
              case 'keydown':
              case 'keypress':
              case 'mouseup':
              case 'mousedown':
              case 'mouseenter':
              case 'mouseover':
              case 'mousemove':
              case 'mouseout':
              case 'mouseleave':
              case 'progress':
              case 'timeupdate':
                break;
              default:
                mockVideo.addEventListener(p, mockVideo);
            }
          }
        }

        mockPresentation = new MockPresentation();
        mockPresentation.mLoad = function () {
          var videos = [
            'http://media.w3.org/2010/05/sintel/trailer.webm',
            'http://video.webmfiles.org/elephants-dream.webm',
            'http://download.wavetlan.com/SVV/Media/HTTP/H264/Other_Media/' +
               'H264_test5_voice_mp4_480x360.mp4'
          ];
          var m = castingMsgTemplate.get().load;
          m.url = videos[0];
          mockPresentation.mCastMsgToReceiver(m);
        }.bind(mockPresentation);

        fp = new FlingPlayer(
          new VideoPlayer(mockVideo),
          new Connector(mockPresentation)
        );
        fp.init();

        window.fp = fp;
        window.mockVideo = mockVideo;
        window.mockPresentation = mockPresentation;

        if (document.visibilityState === 'hidden') {
          navigator.mozApps.getSelf().onsuccess = function(evt) {
            var app = evt.target.result;
            if (app) {
              app.launch();
            }
          };
        }
      };

      var scripts = [
        'test/unit/mock_presentation.js',
        'test/unit/mock_video_element.js',
        'test/unit/casting_message_template.js'
      ];

      scripts.waited = scripts.length;
      scripts.forEach((s) => {
        var script = document.createElement('script');
        script.onload = function () {
          --scripts.waited;
          if (!scripts.waited) {
            console.log('scripts.waited = ' + scripts.waited);
            initForTest();
          }
        };
        script.src = env_testOnB2G ? 'js/' + s : s;
        document.head.appendChild(script);
      });

      return;
    }
    // TMP DEL end

    window.fp = new FlingPlayer(
      new VideoPlayer($(uiID.player)),
      new Connector(navigator.presentation)
    );

    window.fp.init();

    if (document.visibilityState === 'hidden') {
      navigator.mozApps.getSelf().onsuccess = function(evt) {
        var app = evt.target.result;
        if (app) {
          app.launch();
        }
      };
    }
  });

  exports.FlingPlayer = FlingPlayer;

})(window);
