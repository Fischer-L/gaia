/* global evt, SettingsListener, KeyNavigationAdapter, SimpleKeyNavigation,
          FTEWizard
*/
(function (exports) {
'use strict';

window.addEventListener('load', function() {

  var tvFTU = evt({

    init: function () {
      this.APP_USAGE_ENABLE_KEY = 'debug.performance_data.shared';
      this.APP_USAGE_ENABLE_VALUE = true;
      this.APP_USAGE_DISABLE_VALUE = false;

      this._currentPage = null;
      this._currentContentSection = null;
      this._currentContent = null;
      this._currentArrowIcon = null;
      this._currentFocused = null;
      this._currentNavigationTarget = null;
      this.keyNavAdapter = new KeyNavigationAdapter();
      this.linkNavigation = new SimpleKeyNavigation();

      // Special treatment for translation with links
      Promise.all([
        navigator.mozL10n.formatValue('cares-privacy'),
        navigator.mozL10n.formatValue('privacy-notice'),
        navigator.mozL10n.formatValue('privacy-policy')
      ])
      .then(values => {
        var a;
        var txtNode;
        var txt = values[0];
        var privacyNotice = values[1];
        var privacyPolicy = values[2];
        var frag = document.createDocumentFragment();
        var p = document.querySelector(
          '#app-usage-page .page-content > .page-description');

        txt = txt.split('{{ LINK_FIREFOX_OS_PRIVACY_NOTICE }}');
        txt = [txt[0]].concat(
          txt[1].split('{{ LINK_MOZILLA_PRIVACY_POLICY }}'));

        txtNode = document.createTextNode(txt[0]);
        frag.appendChild(txtNode);

        a = document.createElement('a');
        a.textContent = privacyNotice;
        a.setAttribute('tabindex', -1);
        a.setAttribute('id', 'fxos-privacy-notice-link');
        frag.appendChild(a);

        txtNode = txtNode.cloneNode(false);
        txtNode.textContent = txt[1];
        frag.appendChild(txtNode);

        a = a.cloneNode(false);
        a.textContent = privacyPolicy;
        a.setAttribute('id', 'moz-privacy-policy-link');
        frag.appendChild(a);

        txtNode = txtNode.cloneNode(false);
        txtNode.textContent = txt[2];
        frag.appendChild(txtNode);

        p.appendChild(frag);
      });

      this.fteWizard = new FTEWizard('tvFTU.fteWizard');
      this.fteWizard.init({
        container: document.body,
        pageClass: 'page',
        buttonsClass: 'page-button',
        propagateKeyEvent: true,
        ongoNext: this.setupPage.bind(tvFTU),
        ongoPrev: this.setupPage.bind(tvFTU),
        oninit: function (currentPage) {

          this.keyNavAdapter.init();
          this.keyNavAdapter.on('move', this.onKeyMove.bind(this));
          this.keyNavAdapter.on('back-keyup', this.onBackKeyUp.bind(this));
          this.keyNavAdapter.on('enter-keyup', this.onEnterKeyUp.bind(this));
          this.on('focus', this.onFocus.bind(this));

          this.linkNavigation.start(
            [], SimpleKeyNavigation.DIRECTION.HORIZONTAL);
          this.linkNavigation.on('focusChanged', (elem) => {
            this.fire('focus', elem);
          });

          this.fteWizard._simpleKeyNavigation.on('focusChanged', (elem) => {
            this.fire('focus', elem);
          });

          this.setupPage(currentPage);

        }.bind(this),
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

      this._currentNavigationTarget = null;
      if (this.getContentUnscrolledHeight() > 0) {
        this.changeNavigationTarget('unscrolled_content');
      } else {
        this.changeNavigationTarget('buttons');
      }
    },

    getContentUnscrolledHeight: function () {
      var unscrolledHeight = this._currentContent.clientHeight -
                             this._currentContentSection.scrollTop -
                             this._currentContentSection.clientHeight;
      return unscrolledHeight;
    },

    changeNavigationTarget: function (target) {
      if (this._currentNavigationTarget !== target) {

        this._currentNavigationTarget = target;

        this.linkNavigation.blur();
        this.linkNavigation.pause();
        this.fteWizard._simpleKeyNavigation.blur();
        this.fteWizard._simpleKeyNavigation.pause();
        this._currentArrowIcon.classList.add('hidden');

        switch (target) {
          case 'unscrolled_content':
            this._currentContentSection.focus();
            this._currentArrowIcon.classList.remove('hidden');
            this.fire('focus', this._currentContentSection);
          break;

          case 'links':
            var links = Array.prototype.slice.call(
              this._currentPage.querySelectorAll('a'));
            this.linkNavigation.resume();
            this.linkNavigation.updateList(links);
          break;

          case 'buttons':
            this.fteWizard._simpleKeyNavigation.resume();
            var defaultBtn =
              this._currentPage.querySelector('.page-default-button');
            if (defaultBtn) {
              this.fteWizard._simpleKeyNavigation.focusOn(defaultBtn);
            } else {
              this.fteWizard._simpleKeyNavigation.focus();
            }
          break;
        }
      }
    },

    onFocus: function (elem) {
      this._currentFocused = elem;
    },

    onKeyMove: function (key) {

      switch (this._currentNavigationTarget) {
        case 'unscrolled_content':
          if (key === 'down' && this.getContentUnscrolledHeight() <= 0) {
            this.changeNavigationTarget('buttons');
          }
        break;

        case 'links':
          if ((key === 'down' || key === 'right') &&
            'moz-privacy-policy-link' === this._currentFocused.id) {
            // If focus on the last link, moz-privacy-policy-link,
            // then change navigation target to buttons
            this.changeNavigationTarget('buttons');
          } else if (key === 'up') {
            this.linkNavigation.movePrevious();
          } else if (key === 'down') {
            this.linkNavigation.moveNext();
          }
        break;

        case 'buttons':
          if (key === 'up') {
            if (this._currentContentSection.scrollTop > 0) {
              this.changeNavigationTarget('unscrolled_content');
            } else if (this._currentPage.querySelectorAll('a').length > 0) {
              this.changeNavigationTarget('links');
            }
          }
        break;
      }
    },

    onEnterKeyUp: function () {
      switch (this._currentFocused.id) {
        case 'app-usage-page-no-button':
        case 'app-usage-page-yes-button':
          var setting = {};
          if (this._currentFocused.id === 'app-usage-page-yes-button') {
            setting[this.APP_USAGE_ENABLE_KEY] = this.APP_USAGE_ENABLE_VALUE;
          } else {
            setting[this.APP_USAGE_ENABLE_KEY] = this.APP_USAGE_DISABLE_VALUE;
          }
          SettingsListener.getSettingsLock().set(setting);
          this.fteWizard.finish();
        break;

        case 'moz-privacy-policy-link':
        case 'fxos-privacy-notice-link':
          var privacySection
            = document.querySelector('#privacy-policy-page > .content-section');
          var mozPrivacy =
            document.querySelector('#moz-privacy-policy-content');
          var fxosPrivacy =
            document.querySelector('#fxos-privacy-notice-content');

          if (this._currentFocused.id === 'moz-privacy-policy-link') {
            mozPrivacy.style.display = 'block';
            fxosPrivacy.style.display = 'none';
          } else {
            mozPrivacy.style.display = 'none';
            fxosPrivacy.style.display = 'block';
          }
          privacySection.scrollTo(0, 0);
          this.fteWizard.goNext(); // Go to the next page about privacy
        break;
      }
    },

    onBackKeyUp: function () {
      this.fteWizard.goPrev();
    }
  });

  tvFTU.init();

  exports.tvFTU = tvFTU;
});

})(window);
