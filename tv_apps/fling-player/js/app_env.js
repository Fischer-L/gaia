(function(exports) {
  'use strict';

  /**
   * App env holds some app environment variables, configs and helping methods
   */
  var appEnv = {};

  appEnv.DEBUG_MODE = true;

  appEnv.CONTROL_PANEL_HIDE_DELAY_SEC = 3000;
  appEnv.UPDATE_CONTROL_PANEL_INTERVAL_MS = 1000;
  appEnv.SEEK_ON_KEY_PRESS_INTERVAL_MS = 150;
  appEnv.SEEK_ON_LONG_KEY_PRESS_SEC = 5;
  appEnv.SEEK_ON_KEY_PRESS_NORMAL_STEP_SEC = 10;
  appEnv.SEEK_ON_KEY_PRESS_LARGE_STEP_SEC = 30;

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

  exports.appEnv = appEnv;

})(window);