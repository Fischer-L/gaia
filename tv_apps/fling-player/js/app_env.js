(function(exports) {
  'use strict';

  /**
   * App env holds some app environment variables, configs and helping methods
   */
  var appEnv = {};

  appEnv.DEBUG_MODE = true;

  appEnv.CONTROL_PANEL_HIDE_DELAY_SEC = 3600;
  appEnv.AUTO_SEEK_INTERVAL_MS = 200;
  appEnv.AUTO_SEEK_LONG_PRESSED_MS = 5000;
  appEnv.AUTO_SEEK_STEP_NORMAL_SEC = 10;
  appEnv.AUTO_SEEK_STEP_LARGE_SEC = 30;
  appEnv.AUTO_UPDATE_CONTROL_PANEL_INTERVAL_MS = 1000;

  appEnv.UI_ID = {
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

  window.appEnv = appEnv;

})(window);