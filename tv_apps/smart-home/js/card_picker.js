/* global evt, KeyNavigationAdapter, SpatialNavigator, Folder, SharedUtils,
          CardUtil, FOLDER_CAPACITY, Utils */

(function(exports) {
  'use strict';

  function CardPicker() {}

  CardPicker.prototype = evt({
    container: document.getElementById('card-picker'),
    gridView: document.getElementById('card-picker-grid-view'),

    hideCardPickerButton: document.getElementById('hide-cardpicker-button'),
    removeFolderButton: document.getElementById('remove-folder-button'),

    init: function(options) {
      this.appButtons = [];

      this._cardManager = options.cardManager;
      this._folder = null;

      this.navigableElements = [
        this.hideCardPickerButton,
        this.removeFolderButton
      ];

      this.container.addEventListener('click', this.focus.bind(this));

      this._spatialNavigator = new SpatialNavigator(this.navigableElements);
      this._spatialNavigator.on('focus', this.onFocus.bind(this));
      this._spatialNavigator.focus();

      this.hideCardPickerButton.addEventListener('click', this.hide.bind(this));
      this.removeFolderButton.addEventListener('click', this.hide.bind(this));

      this._keyNavigationAdapter = new KeyNavigationAdapter();
      this._keyNavigationAdapter.init(this.container);
      this._keyNavigationAdapter.on('move', direction => {
        this._spatialNavigator.move(direction);
      });
      this._keyNavigationAdapter.on('enter-keyup', this.onEnter.bind(this));
      this.container.addEventListener('keyup', this.onKeyUp.bind(this), true);

      this._selectedElements = this.gridView.getElementsByClassName('selected');
    },

    onFocus: function(elem) {
      elem.focus();
      if (elem.classList.contains('app-button')) {
        this._scrollTo(elem);
      }
    },

    onEnter: function() {
      var elem = this._spatialNavigator.getFocusedElement();
      if (elem.classList.contains('app-button')) {
        if (this.selected.length >= FOLDER_CAPACITY &&
            !elem.classList.contains('selected')) {
          Utils.showCapacityWarning();
          return;
        }

        elem.classList.toggle('selected');
        if (this.mode == 'update') {
          this._showButton(this.selected.length ? 'done' : 'remove');
        }
      }
    },

    onKeyUp: function(evt) {
      if (SharedUtils.isBackKey(evt) && this.mode == 'add' && this.isShown) {
        document.l10n.formatValue('cancel-add-folder').then(message => {
          if (confirm(message)) {
            this._mode = null;
            this.hide();
          }
        });
      }
    },

    show: function(folderElem) {
      this._mode = folderElem ? 'update' : 'add';
      this._folder = null;
      this._showButton('done');
      this.refresh(folderElem);
      this.container.classList.remove('hidden');
      this.focus();
      this.fire('show');
    },

    hide: function() {
      this.container.classList.add('hidden');
      this.fire('hide');
    },

    refresh: function(folderElem) {
      var folderList = null;
      if (folderElem) {
        this._folder = this._cardManager.findCardFromCardList({
          cardId: folderElem.dataset.cardId
        });
        folderList = this._folder.getCardList();
      }

      this._cardManager.getCardList()
        .then(cardList => {
          this._refreshCardButtons(folderList, cardList);
          this._spatialNavigator.setCollection(
                            this.appButtons.concat(this.navigableElements));
          this._spatialNavigator.focus(this.appButtons[0]);
        });
    },

    focus: function() {
      this._spatialNavigator.focus();
    },

    _scrollTo: function(elem) {
      var scrollY = (elem.offsetTop - this.gridView.offsetTop) -
              (this.gridView.offsetHeight - elem.offsetHeight) / 2;
      this.gridView.scrollTo(0, scrollY);
    },

    _refreshCardButtons: function(folderList, cardList, options) {
      var candidates = [];

      this.appButtons = [];
      this.gridView.innerHTML = '';

      var that = this;
      function appendToGridView(appButton) {
        that.gridView.appendChild(appButton);
        that.appButtons.push(appButton);
      }
      function createButtonHelper(card, parentType) {
        if(card instanceof Folder) {
          return;
        }
        var appButton = CardUtil.createCardButton(card, true);
        return appButton;
      }

      folderList && folderList.forEach(card => {
        var appButton = createButtonHelper(card);
        if (appButton) {
          appButton.dataset.parentType = 'folder';
          appButton.classList.add('selected');
          appendToGridView(appButton);
        }
      });

      cardList && cardList.forEach((card, index) => {
        var appButton = createButtonHelper(card);
        if (appButton) {
          appButton.dataset.parentType = 'empty';
          candidates.push({
            index: index,
            key: CardUtil.getSortKey(card),
            button: appButton
          });
        }
      });

      if (candidates.length) {
        candidates.sort((a, b) => {
          var compare = a.key.localeCompare(b.key);
          if (!compare) {
            return a.index - b.index;
          }
          return compare;
        });
        candidates.forEach(candidate => appendToGridView(candidate.button));
      }
    },

    _showButton: function(id) {
      switch (id) {
        case 'done':
          this.hideCardPickerButton.classList.remove('hidden');
          this.removeFolderButton.classList.add('hidden');
          break;
        case 'remove':
          this.hideCardPickerButton.classList.add('hidden');
          this.removeFolderButton.classList.remove('hidden');
          break;
      }
    },

    /**
     * Functions for adding and updating to databases
     */

    saveToNewFolder: function(position) {
      if (this.selected.length <= 0) {
        return;
      }

      this._folder = this._cardManager.insertNewFolder(
          {id: 'new-folder'}, position);

      this._saveToFolderHelper();
      return this._folder;
    },

    updateFolder: function() {
      if (!this._folder) {
        return;
      }
      // Moves cards previously inside the folder back to cardList
      this.appButtons.every(elem => {
        // Buttons previously inside the folder are in the start of the array
        // and we want to process them only.
        if (elem.dataset.parentType !== 'folder') {
          return false;
        }
        if (!elem.classList.contains('selected')) {
          var card = this._folder.findCard({
            cardId: elem.dataset.cardId
          });
          this._folder.removeCard(card);
          this._cardManager.insertCard({
            card: card,
            position: 'end',
            silent: true
          });
        }
        return true;
      });

      // Then save newly added ones
      this._saveToFolderHelper();
    },

    _saveToFolderHelper: function() {
      if (!this._folder) {
        return;
      }

      for (var i = 0; i < this.selected.length; i++) {
        var button = this.selected[i];
        if (button.dataset.parentType === 'folder') {
          continue;
        }

        var card = this._cardManager.findCardFromCardList({
          cardId: button.dataset.cardId
        });
        this._cardManager.removeCard(card);
        this._folder.addCard(card, {silent: true});
      }

      if (this._folder.isEmpty()) {
        this._cardManager.removeCard(this._folder);
      }
    },

    /**
     * Properties
     */
    get isShown() {
      return !this.container.classList.contains('hidden');
    },

    get selected() {
      return this._selectedElements;
    },

    get mode() {
      return this._mode;
    }
  });
  exports.CardPicker = CardPicker;
}(window));
