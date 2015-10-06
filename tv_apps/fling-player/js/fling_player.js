/* global VideoPlayer, Connector, mDBG, KeyNavigationAdapter,
          SimpleKeyNavigation, SimpleKeyNavHelper, appEnv
 */
(function(exports) {
  'use strict';

  // <Helping variables, methods>

  var uiID = appEnv.UI_ID;

  function noop() {}

  function $(id) {
    return document.getElementById(id);
  }

  // </Helping variables, methods>

  function FlingPlayer(videoPlayer, connector, elem) {
    this._player = videoPlayer;
    this._connector = connector;
  }

  var proto = FlingPlayer.prototype;

  proto.CONTROL_PANEL_HIDE_DELAY_SEC = appEnv.CONTROL_PANEL_HIDE_DELAY_SEC;
  proto.AUTO_SEEK_INTERVAL_MS = appEnv.AUTO_UPDATE_CONTROL_PANEL_INTERVAL_MS;
  proto.AUTO_SEEK_LONG_PRESSED_MS = appEnv.AUTO_SEEK_LONG_PRESSED_MS;
  proto.AUTO_SEEK_STEP_NORMAL_SEC = appEnv.AUTO_SEEK_STEP_NORMAL_SEC;
  proto.AUTO_SEEK_STEP_LARGE_SEC = appEnv.AUTO_SEEK_STEP_LARGE_SEC;
  proto.AUTO_UPDATE_CONTROL_PANEL_INTERVAL_MS =
      appEnv.AUTO_UPDATE_CONTROL_PANEL_INTERVAL_MS;

  proto.init = function () {

    if (this.init === noop) return;

    mDBG.log('FlingPlayer#init');
    this.init = noop;

    this._autoUpdateTimer = null; // a handle to auto update setTimeout
    this._autoSeekDirection = null; // 'backward' or 'forward'
    this._autoSeekStartTime = null; // in ms
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

    this._initSession();
    this._initPlayer();

    this._keyNavHelp = new SimpleKeyNavHelper({
      list : [this._backwardButton, this._playButton, this._forwardButton],
      direction : SimpleKeyNavigation.DIRECTION.HORIZONTAL
    });
    // ISSUE:
    // At this point, the focus event of smart-button web component dosen't
    // get fired even SimpleKeyNavHelper call its focus method.
    // So the button's style isn't in the focused state at the 1st displaying
    this._keyNavHelp.getKeyNav().focusOn(this._playButton);

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
  };

  proto._initSession = function () {
    if (this._initSession === noop) return;

    mDBG.log('FlingPlayer#_initSession');
    this._initSession = noop;

    this._connector.init();
    this._connector.on('loadRequest', this.onLoadRequest.bind(this));
    this._connector.on('playRequest', this.onPlayRequest.bind(this));
    this._connector.on('pauseRequest', this.onPauseRequest.bind(this));
    this._connector.on('seekRequest', this.onSeekRequest.bind(this));
  };

  proto._initPlayer = function () {
    if (this._initPlayer === noop) return;

    mDBG.log('FlingPlayer#_initPlayer');
    this._initPlayer = noop;

    this._player.init();
    this._player.addEventListener('loadedmetadata', this);
    this._player.addEventListener('seeked', this);
    this._player.addEventListener('waiting', this);
    this._player.addEventListener('playing', this);
    this._player.addEventListener('pause', this);
    this._player.addEventListener('ended', this);
    this._player.addEventListener('error', this);
  };

  // <UI handling>

  proto.resetUI = function () {
    this.moveTimeBar('elapsed', 0);
    this.moveTimeBar('buffered', 0);
    this.writeTimeInfo('elapsed', 0);
    this.writeTimeInfo('duration', 0);
    this.setPlayButtonState('pause');
  };

  proto.setLoading = function (loading) {
    mDBG.log('FlingPlayer#setLoading = ', loading);
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

    this._keyNavHelp.enable();
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
        this._keyNavHelp.disable();
        this._controlPanel.classList.add('fade-out');
      }

    } else {

      this._hideControlsTimer = setTimeout(() => {
          this.hideControlPanel(true);
        }, this.CONTROL_PANEL_HIDE_DELAY_SEC
      );
    }
  };

  /**
   * @param {string} type 'buffered' or 'elapsed'
   * @param {number} sec the sec in video you want to move to
   */
  proto.moveTimeBar = function (type, sec) {

    // mDBG.log('FlingPlayer#moveTimeBar');
    // mDBG.log('Move type', type);
    // mDBG.log('Move to', sec);

    var timeBar = this[`_${type}TimeBar`];
    var duration = this._player.getRoundedDuration();
    sec = Math.round(sec);

    if (!timeBar ||
        (sec >= 0) === false ||
        (sec <= duration) === false
    ) {
      mDBG.warn('Not moving due to corrupt type/sec', type, sec);
      return;
    }

    requestAnimationFrame(() => {
      mDBG.log('Move to sec / duration = %d / %d', sec, duration);
      timeBar.style.width = (100 * sec / duration) + '%';
    });
  };

  /**
   * @param {string} type 'elapsed' or 'duration'
   * @param {number} sec
   */
  proto.writeTimeInfo = function (type, sec) {

    var timeInfo = this[`_${type}Time`];
    var duration = this._player.getRoundedDuration();
    sec = Math.round(sec);

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

  // </UI handling>

  // <Video handling>

  proto.play = function () {
    this._player.play();
    this.setPlayButtonState('playing');
  };

  proto.pause = function () {
    this._player.pause();
    this.setPlayButtonState('paused');
  };

  proto._startAutoUpdateControlPanel = function () {

    if (this._autoUpdateTimer == null) { // Do not double start

      // To stop this is important.
      // We don't want they get messed with each other
      this._stopAutoSeek();

      this._autoUpdateTimer = setTimeout(
        this._autoUpdateControlPanel.bind(this)
      );
    }
  };

  proto._stopAutoUpdateControlPanel = function () {
    clearTimeout(this._autoUpdateTimer);
    this._autoUpdateTimer = null;
  };

  /**
   * This is to keep auto updating the info and status on the control panel.
   */
  proto._autoUpdateControlPanel = function () {
    mDBG.log('FlingPlayer#_autoUpdateControlPanel');

    if (this._autoUpdateTimer != null) {
      mDBG.log('Auto updating');

      var buf = this._player.getVideo().buffered;
      var current = this._player.getRoundedCurrentTime();

      this.writeTimeInfo('elapsed', current);

      this.moveTimeBar('elapsed', current);

      if (buf.length) {
        this.moveTimeBar('buffered', buf.end(buf.length - 1));
      }

      this._autoUpdateTimer = setTimeout(
        this._autoUpdateControlPanel.bind(this),
        this.AUTO_UPDATE_CONTROL_PANEL_INTERVAL_MS
      );
    }
  };

  proto._startAutoSeek = function (dir) {

    if (this._autoSeekStartTime == null) { // Do not double start

      // To stop this is important.
      // We don't want they get messed with each other
      this._stopAutoUpdateControlPanel();

      this._autoSeekStartTime = (new Date()).getTime();
      this._autoSeekDirection = dir;
      this._autoSeek();
    }
  };

  proto._stopAutoSeek = function (dir) {
    this._autoSeekStartTime = null;
    this._autoSeekDirection = null;
  };

  /**
   * This is to handle this case that user seeks on video by long pressing key.
   * The seeking policy would go based on duration of pressing
   */
  proto._autoSeek = function () {
    mDBG.log('FlingPlayer#_autoSeek');

    if (this._autoSeekStartTime != null) {

      var time = this._player.getRoundedCurrentTime();
      var factor = (this._autoSeekDirection == 'backward') ? -1 : 1;
      var duration = this._player.getRoundedDuration();
      var seekDuration = (new Date()).getTime() - this._autoSeekStartTime;
      var seekStep = (seekDuration > this.AUTO_SEEK_LONG_PRESSED_MS) ?
              this.AUTO_SEEK_STEP_LARGE_SEC : this.AUTO_SEEK_STEP_NORMAL_SEC;

      time += factor * seekStep;
      time = Math.min(Math.max(time, 0), duration);

      mDBG.log('time = ', time);
      mDBG.log('factor = ', factor);
      mDBG.log('duration = ', duration);
      mDBG.log('seekStep = ', seekStep);
      mDBG.log('seekDuration = ', seekDuration);

      this.seek(time);

      setTimeout(this._autoSeek.bind(this), this.AUTO_SEEK_INTERVAL_MS);
    }
  };

  proto.seek = function (sec) {
    this._player.seek(sec);
    this.moveTimeBar('elapsed', sec);
    this.writeTimeInfo('elapsed', sec);
    this.showControlPanel(true);
  };

  // </Video handling>

  // <Event handling>

  proto.handleEvent = function handleVideoEvent(e) {

    mDBG.log('FlingPlayer#handleEvent: e.type = ' + e.type);

    var data = { 'time': this._player.getRoundedCurrentTime() };

    switch (e.type) {

      case 'loadedmetadata':
        this.writeTimeInfo('elapsed', this._player.getRoundedCurrentTime());
        this.writeTimeInfo('duration', this._player.getRoundedDuration());
        this._connector.reportStatus('loaded', data);
      break;

      case 'waiting':
        this.setLoading(true);
        this._connector.reportStatus('buffering', data);
      break;

      case 'playing':
        this.setLoading(false);
        // TODO: Hide 'Starting video cast from ...'
        this._connector.reportStatus('buffered', data);

        this._startAutoUpdateControlPanel();
        this.showControlPanel(true);
        this._connector.reportStatus('playing', data);
      break;

      case 'seeked':
        this._connector.reportStatus('seeked', data);
      break;

      case 'ended':
      case 'pause':
        this._stopAutoUpdateControlPanel();
        this._connector.reportStatus('stopped', data);
        if (e.type == 'ended') {
          this.showControlPanel();
        } else {
          this.showControlPanel(true);
        }
      break;

      case 'error':
        this.setLoading(false);
        data.error = evt.target.error.code;
        this._connector.reportStatus('error', data);
      break;
    }
  };

  proto.onLoadRequest = function (e) {
    this.resetUI();
    this.setLoading(true);
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
      // mDBG.log('The control panel is hiding so no action is taken.');
      return;
    }

    if (this._keyNavHelp.getFocused()) {

      // mDBG.log('control focused = ', this._keyNavHelp.getFocused());

      switch (this._keyNavHelp.getFocused().id) {

        case uiID.backwardButton:
        case uiID.forwardButton:
          if (this._keyNavHelp.getFocused() === this._backwardButton) {
            this._startAutoSeek('backward');
          } else {
            this._startAutoSeek('forward');
          }
        break;
      }
    }
  };

  proto.onKeyEnterUp = function () {

    mDBG.log('FlingPlayer#onKeyEnterUp');

    if (this.isControlPanelHiding()) {
      // mDBG.log('The control panel is hiding so no action is taken.');
      return;
    }

    if (this._keyNavHelp.getFocused()) {

      mDBG.log('control focused = ', this._keyNavHelp.getFocused());

      switch (this._keyNavHelp.getFocused().id) {

        case uiID.playButton:
          if (this._player.isPlaying()) {
            this.pause();
          } else {
            this.play();
          }
        break;

        case uiID.backwardButton:
        case uiID.forwardButton:
          this._stopAutoSeek();
        break;
      }
    }
  };

  proto.onDemandingControlPanel = function () {

    // mDBG.log('FlingPlayer#onDemandingControlPanel');

    if (this.isControlPanelHiding()) {
      mDBG.log('The control panel is hiding so let it show first.');
      this.showControlPanel(true);
    }
  };

  // </Event handling>

  exports.FlingPlayer = FlingPlayer;

})(window);