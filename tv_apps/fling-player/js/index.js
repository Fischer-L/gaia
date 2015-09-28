/* global mDBG, VideoPlayer, Connector, FlingPlayer
 */
(function() {
  'use strict';

  window.onload = function() {

    if (mDBG.isDBG()) { // TMP

      var script = document.createElement('script');

      script.onload = function () {

        var
        presentation = navigator.presentation || {
          addEventListener : function () {}
        },

        video = new MockVideoElement({
          duration : 600,
          currentTime : 600 * 0.33
        });

        window.fp = new FlingPlayer(
          new VideoPlayer(video),
          new Connector(presentation)
        );

        window.fp.init();

        video.load('');

        if (document.visibilityState === 'hidden') {
          navigator.mozApps.getSelf().onsuccess = function(evt) {
            var app = evt.target.result;
            if (app) {
              app.launch();
            }
          };
        }
      }

      script.src = 'js/mock/mock_video_element.js';

      document.head.appendChild(script);

      return;
    }

    window.fp = new FlingPlayer(
      new VideoPlayer(document.getElementById(appEnv.UI_ID.player)),
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

  };

})();