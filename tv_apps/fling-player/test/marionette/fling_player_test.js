'use strict';

marionette('Fling Player', function () {

  function hasClass(elem, className) {
    if (elem) {
      return elem.getAttribute('class').indexOf(className) > -1;
    }
    return false;
  }

  var assert = require('chai').assert;

  var APP_URL = 'app://fling-player.gaiamobile.org';

  var Keys = {
    'up' : '\ue013',
    'right' : '\ue014',
    'down' : '\ue015',
    'left' : '\ue012',
    'enter' : '\ue006',
    'esc' : '\ue00c'
  };

  var ui = {
    body : null,
    loadingUI : null,
    playButton : null,
    forwardButton : null,
    backwardButton : null,
    controlPanel : null
  };

  var opts = {

    test : {
      devices : ['tv']
    },

    timeout : {
      timeout : 200
    }
  };

  var client = marionette.client({
    profile : {
      hostOptions : {
        screen : {
          width: 1920, height: 1080
        }
      }
    },
    // XXX: Set this to true once Accessibility is implemented in TV
    desiredCapabilities : { raisesAccessibilityExceptions: false }
  });

  setup(function () {
    // Launch test app
    client.apps.launch(APP_URL);
    client.apps.switchToApp(APP_URL);

    ui.body = client.findElement('body');
    ui.playButton = client.findElement('#play-button');
    ui.forwardButton = client.findElement('#forward-button');
    ui.backwardButton = client.findElement('#backward-button');
    ui.loadingUI = client.findElement('#loading-section');
    ui.controlPanel = client.findElement('#video-control-panel');
  });

  suite('Control panel', function () {

    test('Should show and then hide the control panel after 3 secs',
         opts.test,
         function () {
           var hiddingDelaySec = 3100; // Extra 100ms is for async test buffer
           ui.body.sendKeys(Keys.left);
           client.waitFor(function () {
             return !hasClass(ui.controlPanel, 'fade-out');
           }, opts.timeout, function (err) {
             assert.isNull(
               err, 'The control panel does not show'
             );
           });
           client.waitFor(function () {
             return hasClass(ui.controlPanel, 'fade-out');
           }, { timeout : hiddingDelaySec }, function (err) {
             assert.isNull(
               err, 'The control panel does not hide after 3 secs'
             );
           });
         }
    );

    suite('Initial state', function () {

      test('Should show the control panel', opts.test, function () {
        client.waitFor(function () {
          return hasClass(ui.controlPanel, 'fade-out');
        }, opts.timeout);
      });

      test('Should focus on the play button', opts.test, function () {
        client.waitFor(function () {
          return hasClass(ui.playButton, 'focused');
        }, opts.timeout);
      });

      test('The play button icon should be play icon', opts.test,
           function () {
             assert.equal(
               ui.playButton.getAttribute('data-icon'), 'fling-player-play'
             );
           }
      );
    });

    suite('> Behaviors in the hidden state', function () {

      test('Should not change focus when the control panel resumes from hidden',
           opts.test,
           function () {
             ui.body.sendKeys(Keys.left);
             client.waitFor(function () {
               return hasClass(ui.playButton, 'focused');
             }, opts.timeout);
           }
      );

      test('Should not act when the control panel is hidden',
           opts.test,
           function () {
            ui.body.sendKeys(Keys.enter);
            client.waitFor(function () {
              return ui.playButton.getAttribute('data-icon') ==
                       'fling-player-play';
            }, opts.timeout, function (err) {
              assert.isNull(
                err, 'The play button icon should switch to the play icon'
              );
            });
           }
      );
    });

    suite('Behaviors in the showing state', function () {

      setup(function () {
        ui.body.sendKeys(Keys.left); // Make the control panel show fisrt
      });

      test('Should switch the play button icon', opts.test, function () {
        ui.body.sendKeys(Keys.enter);
        client.waitFor(function () {
          return ui.playButton.getAttribute('data-icon') ==
                   'fling-player-pause';
        }, opts.timeout, function (err) {
          assert.isNull(
            err, 'The play button icon should switch to the pause icon'
          );
        });

        ui.body.sendKeys(Keys.enter);
        client.waitFor(function () {
          return ui.playButton.getAttribute('data-icon') == 'fling-player-play';
        }, opts.timeout, function (err) {
          assert.isNull(
            err, 'The play button icon should switch to the play icon'
          );
        });
      });

      test('Should navigata through buttons by keys', opts.test, function () {
        ui.body.sendKeys(Keys.right);
        client.waitFor(function () {
          return hasClass(ui.forwardButton, 'focused');
        }, opts.timeout, function (err) {
          assert.isNull(
            err, 'Not navigating to the forward button'
          );
        });

        ui.body.sendKeys(Keys.left);
        client.waitFor(function () {
          return hasClass(ui.playButton, 'focused');
        }, opts.timeout, function (err) {
          assert.isNull(
            err, 'Not navigating to the play button'
          );
        });

        ui.body.sendKeys(Keys.left);
        client.waitFor(function () {
          return hasClass(ui.backwardButton, 'focused');
        }, opts.timeout, function (err) {
          assert.isNull(
            err, 'Not navigating to the backward button'
          );
        });
      });
    });
  });
});
