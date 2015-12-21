/* global evt, SettingsListener, KeyNavigationAdapter, FTEWizard
*/
(function (exports) {
'use strict';

window.addEventListener('load', function() {

  var tvFTU = evt({

    fteWizard: new FTEWizard('tvFTU.fteWizard'),

    init: function () {
      this.APP_USAGE_ENABLE_KEY = 'debug.performance_data.shared';
      this.APP_USAGE_ENABLE_VALUE = true;
      this.APP_USAGE_DISABLE_VALUE = false;

      this._currentPage = null;
      this._currentContentSection = null;
      this._currentContent = null;
      this._currentArrowIcon = null;
      this._currentFocused = null;
      this.keyNavAdapter = new KeyNavigationAdapter();

      this.fteWizard.init({
        container: document.body,
        pageClass: 'page',
        buttonsClass: 'page-button',
        propagateKeyEvent: true,
        ongoNext: this.setupPage.bind(tvFTU),
        ongoPrev: this.setupPage.bind(tvFTU),
        oninit: function (currentPage) {
          this.on('focus', this.onFocus.bind(this));

          this.fteWizard._simpleKeyNavigation.on('focusChanged', (elem) => {
            this.fire('focus', elem);
          });

          this.keyNavAdapter.init();
          this.keyNavAdapter.on('move', this.onKeyMove.bind(this));
          this.keyNavAdapter.on('enter-keyup', this.onEnterKeyUp.bind(this));

          this.setupPage(currentPage);
        }.bind(tvFTU),
        onfinish: function () {
          window.close();
        }
      });
    },

    setupPage: function (currentPage) {
      this._currentPage = currentPage;
      this._currentArrowIcon = this._currentPage.querySelector('.arrow-icon');
      this._currentContent = this._currentPage.querySelector('.page-content');
      this._currentContentSection =
        this._currentPage.querySelector('.content-section');

      if (this.getContentUnscrolledHeight() > 0) {
        this.focusSection('content-section');
      } else {
        this.focusSection('button-section');
      }
    },

    getContentUnscrolledHeight: function () {
      var unscrolledHeight = this._currentContent.clientHeight -
                             this._currentContentSection.scrollTop -
                             this._currentContentSection.clientHeight;
      return unscrolledHeight;
    },

    focusSection: function (section) {
      switch (section) {
        case 'content-section':
          this.fteWizard._simpleKeyNavigation.blur();
          this.fteWizard._simpleKeyNavigation.pause();
          this._currentContentSection.focus();
          this._currentArrowIcon.classList.remove('hidden');
          this.fire('focus', this._currentContentSection);
        break;

        case 'button-section':
          this._currentArrowIcon.classList.add('hidden');
          this.fteWizard._simpleKeyNavigation.resume();
          if (this._currentPage.id === 'app-usage-page') {
            this.fteWizard._simpleKeyNavigation.focusOn(
              this._currentPage.querySelector('#app-usage-page-yes-button'));
          } else {
            this.fteWizard._simpleKeyNavigation.focus();
          }
        break;
      }
    },

    onFocus: function (elem) {
      this._currentFocused = elem;
    },

    onKeyMove: function (key) {
      switch (key) {
        case 'up':
          if (this._currentFocused !== this._currentContentSection &&
              this._currentContentSection.scrollTop > 0
          ) {
            this.focusSection('content-section');
          }
        break;

        case 'down':
          if (this._currentFocused === this._currentContentSection &&
              this.getContentUnscrolledHeight() <= 0
          ) {
            this.focusSection('button-section');
          }
        break;
      }
    },

    onEnterKeyUp: function () {
      if (this._currentFocused.id === 'app-usage-page-no-button' ||
          this._currentFocused.id === 'app-usage-page-yes-button'
      ) {
        var setting = {};
        if (this._currentFocused.id === 'app-usage-page-yes-button') {
          setting[this.APP_USAGE_ENABLE_KEY] = this.APP_USAGE_ENABLE_VALUE;
        } else {
          setting[this.APP_USAGE_ENABLE_KEY] = this.APP_USAGE_DISABLE_VALUE;
        }
        SettingsListener.getSettingsLock().set(setting);
        this.fteWizard.finish();
      }
    }
  });

  tvFTU.init();

  exports.tvFTU = tvFTU;
});

})(window);
