/* global mDBG, VideoPlayer, Connector, FlingPlayer
 */
(function() {
  'use strict';

  window.onload = function() {

    if (mDBG.isDBG()) { // TMP

      var initForTest = function () {

        var fp, testVideo, testPresentation;

        testVideo = new MockVideoElement({
          duration : 600,
          currentTime : 0
        });
        // testVideo = document.getElementById(appEnv.UI_ID.player)

        testPresentation = new MockPresentation();
        testPresentation._controller.videoSrc =
            'http://media.w3.org/2010/05/sintel/trailer.webm';

        fp = new FlingPlayer(
          new VideoPlayer(testVideo),
          new Connector(testPresentation)
        );
        fp.init();

        window.fp = fp;
        window.testVideo = testVideo;
        window.testPresentation = testPresentation;

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
        'test/mock/mock_key_event.js',
        'test/mock/mock_presentation.js',
        'test/mock/mock_video_element.js',
      ];

      scripts.waited = scripts.length;

      scripts.forEach((s) => {

        var script = document.createElement('script');

        script.onload = function () {
          --scripts.waited;
          if (!scripts.waited) {
            initForTest();
          }
        };

        script.src = s;

        document.head.appendChild(script);
      });

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