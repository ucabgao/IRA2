/**
 * A widget providing selection and sorting capabilities for a list of elements
 *
 * @module Select
 * @class pickList
 */
(function ($) {

  $.widget('rf.pickList', {

    options: {
      /**
       * Disable the pickList widget
       *
       * @property disabled
       * @type Boolean
       * @default false
       */
      disabled: false,
      /**
       * The text to use for the pickList header
       *
       * @property header
       * @type String
       */
      header: null,
      /**
       * The text to use for the source header of the pickList
       *
       * @property sourceHeader
       * @type String
       */
      sourceHeader: null,
      /**
       * The text to use for the target header of the pickList
       *
       * @property targetHeader
       * @type String
       */
      targetHeader: null,
      /**
       * The height of the pickList
       *
       * @property height
       * @type String
       */
      height: null,
      /**
       * The minimum height of the pickList
       *
       * @property heightMin
       * @type String
       */
      heightMin: null,
      /**
       * The maximum height of the pickList
       *
       * @property heightMax
       * @type String
       */
      heightMax: null,
      /**
       * A CSS class to be added to the pickList.
       * Multiple classes should be space separated
       *
       * @property styleClass
       * @type String
       */
      styleClass: null,
      /**
       * A CSS class to be added to each column of the pickList when table layout is used.
       * Multiple classes should be space separated
       *
       * @property columnClasses
       * @type String
       */
      columnClasses: null,
      /**
       * When true, clicking on a pickList element will move it between the source and target lists
       *
       * @property switchByClick
       * @type Boolean
       * @default false
       */
      switchByClick: false,
      /**
       * When true, double-clicking on a pickList element will move it between the source and target lists
       *
       * @property switchByDblClick
       * @type Boolean
       * @default false
       */
      switchByDblClick: false,
      /**
       * When true, elements in the target list can be re-ordered
       *
       * @property orderable
       * @type Boolean
       * @default true
       */
      orderable: true,
      /**
       * Text to be applied to the ordering buttons of the target list.  The text should be arranged as an object in
       * JSON notation.
       *
       * eg. {first: ..., up: ..., down: ..., last: ...}
       *
       * @property orderButtonsText
       * @type JSON
       * @default null
       */
      orderButtonsText: null, // {first: ..., up: ..., down: ..., last: ...}
      /**
       * Text to be applied to the picking buttons of the picklist.  The text should be arranged as an object in
       * JSON notation.
       *
       * eg. {addAll: ..., add: ..., remove: ..., removeAll: ...}
       *
       * @property pickButtonsText
       * @type JSON
       * @default null
       */
      pickButtonsText: null,
      /**
       * The String prefixed to all events triggered within the pickList widget
       *
       * @property widgetEventPrefix
       * @type JSON
       * @default picklist_
       */
      widgetEventPrefix: 'picklist_',

      // callbacks

      /**
       * Fired when the target list of the pickList changes values.
       *
       * @event change
       */
      change: null,
      /**
       * Fired after the dynamically created DOM elements of the pickList have been created
       *
       * @event addDomElements
       */
      addDomElements: null,
      /**
       * Fired after the pickList has been created
       *
       * @event create
       */
      create: null,
      /**
       * Fired after the pickList has been destroyed
       *
       * @event destroy
       */
      destroy: null,
      /**
       * Fired when the pickList receives focus
       *
       * @event focus
       */
      focus: null,
      /**
       * Fired when the pickList loses focus
       *
       * @event blur
       */
      blur: null
    },

    _create: function () {
      this.widgetEventPrefix = this.options.widgetEventPrefix;
      this.sourceList = this.element.find('.source');
      this.targetList = this.element.find('.target');
      this._addDomElements();
      this.sourceList.orderingList({
        showButtons: false,
        mouseOrderable: this.options.orderable,
        contained: false,
        columnClasses: this.options.columnClasses,
        disabled: this.options.disabled,
        header: this.options.sourceHeader,
        widgetEventPrefix: 'sourcelist_'
      });
      this.targetList.orderingList({
        showButtons: this.options.orderable,
        mouseOrderable: this.options.orderable,
        contained: false,
        columnClasses: this.options.columnClasses,
        buttonsText: this.options.orderButtonsText,
        disabled: this.options.disabled,
        header: this.options.targetHeader,
        widgetEventPrefix: 'targetlist_'
      });
      if (this.options.orderable) {
        this.sourceList.orderingList('connectWith', this.targetList);
        this.targetList.orderingList('connectWith', this.sourceList);
      }

      this._registerListeners();

      if (this.options.disabled === true) {
        this._disable();
      }

      if (this.options.height !== null) {
        this._setHeight(this.options.height);
      }
      if (this.options.heightMin !== null) {
        this._setHeightMin(this.options.heightMin);
      }
      if (this.options.heightMax !== null) {
        this._setHeightMax(this.options.heightMax);
      }
    },

    /**
     * Removes the pickList functionality completely. This will return the element back to its pre-init state.
     *
     * @method destroy
     * @chainable
     */
    destroy: function () {
      $.Widget.prototype.destroy.call(this);
      this._unregisterListeners();
      this.sourceList.orderingList('destroy');
      this.targetList.orderingList('destroy');

      this._removeDomElements();

      this.element.removeClass('inner').removeClass('row');
      if (!this.element.attr('class')) {
        this.element.removeAttr('class');
      }
      this._trigger('destroy', undefined, {});
      return this;
    },

    /** Public API methods **/

    /**
     * Move items from the target list of the pickList to the source list.
     *
     * @param items {Object} A list of Elements to remove from the target list of the pickList
     * @param event {Object} The event that triggered the removal of the elements.  This event will be made accessible
     * when the resulting change event is fired.
     * @method removeItems
     * @chainable
     */
    removeItems: function (items, event) {
      if (this.options.disabled) { return; }
      this.targetList.orderingList('remove', items);
      this.sourceList.orderingList('add', items);
      var ui = this._dumpState();
      ui.change = 'remove';
      this._trigger('change', event, ui);
      return this;
    },

    /**
     * Move items from the source list of the pickList to the target list.
     *
     * @param items {Object} A list of Elements to remove from the source list of the pickList
     * @param event {Object} The event that triggered the removal of the elements.  This event will be made accessible
     * when the resulting change event is fired.
     * @method addItems
     * @chainable
     */
    addItems: function (items, event) {
      if (this.options.disabled) { return; }
      this.sourceList.orderingList('remove', items);
      this.targetList.orderingList('add', items);
      var ui = this._dumpState();
      ui.change = 'add';
      this._trigger('change', event, ui);
      return this;
    },


    /** Initialisation methods **/

    _setOption: function (key, value) {
      var widget = this;
      if (this.options.key === value) {
        return;
      }
      switch (key) {
        case 'disabled':
          if (value === true) {
            widget._disable();
          } else {
            widget._enable();
          }
          break;
        case 'header':
          if (!widget.options.header) {
            widget._addHeader(value);
          }
          widget.outer.find('.header-row .header').text(value);
          break;
        case 'height':
          widget._setHeight(value);
          break;
        case 'heightMin':
          widget._setHeightMin(value);
          break;
        case 'heightMax':
          widget._setHeightMax(value);
          break;
        case 'sourceHeader':
          if (!widget.options.sourceHeader) {
            widget._addSubHeader(value, this.options.targetHeader);
          }
          widget.outer.find('.sub-header-row .source').text(value);
          break;
        case 'targetHeader':
          if (!widget.options.targetHeader) {
            widget._addSubHeader(value, this.options.targetHeader);
          }
          widget.outer.find('.sub-header-row .target').text(value);
          break;
        case 'styleClass':
          if (widget.options.styleClass) {
            widget.outer.removeClass(widget.options.styleClass);
          }
          widget.outer.addClass(value);
          break;
        case 'columnClasses':
          widget.sourceList.orderingList('option', 'columnClasses', value);
          widget.targetList.orderingList('option', 'columnClasses', value);
          break;
        case 'orderButtonsText':
          widget.targetList.orderingList('option', 'buttonsText', value);
          break;
        case 'buttonsText':
          this._applyButtonsText(this.outer.find('.middle .btn-group-vertical'), value);
          break;
        case 'switchByClick':
          if (value === true) {
            widget._addClickListeners();
          } else {
            widget._removeClickListeners();
          }
          break;
        case 'switchByDblClick':
          if (value === true) {
            widget._addDoubleClickListeners();
          } else {
            widget._removeDoubleClickListeners();
          }
          break;
      }
      $.Widget.prototype._setOption.apply(widget, arguments);
    },


    _addDomElements: function () {
      this._addParents();
      var buttonColumn = $('<div />').addClass('middle button-column col-sm-1');
      buttonColumn.append(this._buttonStack());
      this.sourceList.parent().after(buttonColumn);
      this._trigger('addDomElements', undefined, {});
    },

    _buttonStack: function () {
      var button = $('<button type="button" class="btn btn-default"/>');
      var buttonStack = $('<div/>')
        .addClass('btn-group-picklist');
      buttonStack
        .append(
          button.clone()
            .addClass('btn-remove-all col-sm-12 col-xs-3')
            .html('<i class="icon icon-left-all" />')
            .on('click.pickList', $.proxy(this._removeAllHandler, this))
        )
        .append(
          button.clone()
            .addClass('btn-remove col-sm-12 col-xs-3')
            .html('<i class="icon icon-left" />')
            .on('click.pickList', $.proxy(this._removeHandler, this))
        )
        .append(
          button.clone()
            .addClass('btn-add col-sm-12 col-xs-3')
            .html('<i class="icon icon-right" />')
            .on('click.pickList', $.proxy(this._addHandler, this))
        )
        .append(
          button
            .clone()
            .addClass('btn-add-all col-sm-12 col-xs-3')
            .html('<i class="icon icon-right-all" />')
            .on('click.pickList', $.proxy(this._addAllHandler, this))
        );
      if (this.options.pickButtonsText) {
        this._applyButtonsText(buttonStack, this.options.pickButtonsText);
      }
      return buttonStack;
    },

    _applyButtonsText: function(buttonStack, buttonsText) {
      this._applyButtonText(buttonStack.find('.btn-add-all'), buttonsText.addAll);
      this._applyButtonText(buttonStack.find('.btn-add'), buttonsText.add);
      this._applyButtonText(buttonStack.find('.btn-remove'), buttonsText.remove);
      this._applyButtonText(buttonStack.find('.btn-remove-all'), buttonsText.removeAll);
    },

    _applyButtonText: function(button, text) {
      if (!text) {
        if (button.hasClass('labeled')) {
          button.removeClass('labeled');
          button.find('span').remove();
        }
        return;
      }
      if (button.hasClass('labeled')) {
        button.find('span').text(text);
      } else {
        button.addClass('labeled').append($('<span />').text(text));
      }
    },

    _addParents: function () {
      this.element.addClass('row inner').wrap(
        $('<div />').addClass('container pick-list outer')
      );
      this.outer = this.element.parents('.outer').first();
      if (this.options.styleClass) {
        this.outer.addClass(this.options.styleClass);
      }
      if (this.options.header) {
        this._addHeader(this.options.header);
      }
      if (this.options.sourceHeader || this.options.targetHeader) {
        this._addSubHeader(this.options.sourceHeader, this.options.targetHeader);
      }
      this.sourceList.wrap(
        $('<div />').addClass('source-wrapper col-sm-5')
      );
      this.targetList.wrap(
        $('<div />').addClass('target-wrapper col-sm-6')
      );
      this.content = this.element;
      this.outer.attr('tabindex', '-1');
    },

    _addSubHeader: function (sourceHeaderText, targetHeaderText) {
      if (sourceHeaderText || targetHeaderText) {
        var subHeaderRow = $('<div />').addClass('row sub-header-row');
        var sourceHeader = $('<div />').addClass('col-sm-5 source header').html(sourceHeaderText);
        var targetHeader = $('<div />').addClass('col-sm-6 col-sm-offset-1 target header').html(targetHeaderText);
        subHeaderRow.append(sourceHeader).append(targetHeader);
        var headerRow = this.outer.find('.header-row');
        if (headerRow.length !== 0) {
          subHeaderRow.insertAfter(headerRow);
        } else {
          this.outer.prepend(subHeaderRow);
        }
      }
    },

    _addHeader: function (headerText) {
      if (headerText) {
        var headerRow = $('<div />').addClass('row header-row');
        var header = $('<div />').addClass('col-xs-12 header').html(headerText);
        headerRow.append(header);
        var subHeaderRow = this.outer.find('.sub-header-row');
        if (subHeaderRow.length !== 0) {
          headerRow.insertBefore(subHeaderRow);
        } else {
          this.outer.prepend(headerRow);
        }
      }
    },

    _setHeight: function(height) {
      this.sourceList.orderingList('option', 'height', height);
      this.targetList.orderingList('option', 'height', height);
    },

    _setHeightMin: function(height) {
      this.sourceList.orderingList('option', 'heightMin', height);
      this.targetList.orderingList('option', 'heightMin', height);
    },

    _setHeightMax: function(height) {
      this.sourceList.orderingList('option', 'heightMax', height);
      this.targetList.orderingList('option', 'heightMax', height);

    },

    _registerListeners: function () {
      var widget = this;
      // the widget factory converts all events to lower case
      this.sourceList.on('sortreceive', function (event, ui) {
        var newUi = widget._dumpState();
        newUi.change = 'remove';
        newUi.originalEvent = event;
        widget._trigger('change', event, newUi);
      });
      this.targetList.on('sortreceive', function (event, ui) {
        var newUi = widget._dumpState();
        newUi.change = 'add';
        newUi.originalEvent = event;
        widget._trigger('change', event, newUi);
      });
      this.targetList.on('targetlist_change', function (event, ui) {
        var newUi = widget._dumpState();
        newUi.change = 'sort';
        newUi.originalEvent = event;
        widget._trigger('change', event, newUi);
      });
      if (this.options.switchByClick) {
        this._addClickListeners();
      }
      if (this.options.switchByDblClick) {
        this._addDoubleClickListeners();
      }
      this.outer.on('focusin.picklist', function (event) {
        widget._trigger('focus', event, widget._dumpState());
      });
      this.outer.on('focusout.picklist', function (event) {
        widget._trigger('blur', event, widget._dumpState());
      });
    },

    _unregisterListeners: function () {
      this.outer.off('focusin.picklist');
      this.outer.off('focusout.picklist');
    },

    _addClickListeners: function () {
      var widget = this;
      this.sourceList.on('click.pickList', '.ui-selectee', function(event) {
        widget.addItems($(this), event);
      });
      this.targetList.on('click.pickList', '.ui-selectee', function(event) {
        widget.removeItems($(this), event);
      });
    },

    _removeClickListeners: function () {
      this.sourceList.off('click.picklist', '.ui-selectee');
      this.targetList.off('click.picklist', '.ui-selectee');
    },

    _addDoubleClickListeners: function () {
      var widget = this;
      this.sourceList.on('dblclick.pickList', '.ui-selectee', function(event) {
        widget.addItems($(this), event);
      });
      this.targetList.on('dblclick.pickList', '.ui-selectee', function(event) {
        widget.removeItems($(this), event);
      });
    },

    _removeDoubleClickListeners: function () {
      this.sourceList.off('dblclick.picklist', '.ui-selectee');
      this.targetList.off('dblclick.picklist', '.ui-selectee');
    },

    _disable: function () {
      this.sourceList.orderingList('option', 'disabled', true);
      this.targetList.orderingList('option', 'disabled', true);
      this.element.addClass('disabled');
      this.outer.find('.button-column button').attr('disabled', true);
    },

    _enable: function () {
      this.sourceList.orderingList('option', 'disabled', false);
      this.targetList.orderingList('option', 'disabled', false);
      this.element.removeClass('disabled');
      this.outer.find('.button-column button').attr('disabled', false);
      this._registerListeners();
    },


    _dumpState: function () {
      var ui = {};
      ui.pickedElements = this.targetList.orderingList('getOrderedElements');
      ui.pickedKeys = this.targetList.orderingList('getOrderedKeys');
      return ui;
    },

    /** Cleanup methods **/

    _removeDomElements: function () {
      this.sourceList.parents('.source-wrapper').first().replaceWith(this.sourceList.detach());
      this.targetList.parents('.target-wrapper').first().replaceWith(this.targetList.detach());
      this.element.find('.middle').remove();
      var list = this.element.detach();
      this.outer.replaceWith(list);
    },

    /** Event Handlers **/

    _removeAllHandler: function (event) {
      var items = $('.ui-selectee', this.targetList);
      this.removeItems(items, event);
      this.sourceList.orderingList('selectItem', items);
    },

    _removeHandler: function (event) {
      this.removeItems($('.ui-selected', this.targetList), event);
    },

    _addHandler: function (event) {
      this.addItems($('.ui-selected', this.sourceList), event);
    },

    _addAllHandler: function (event) {
      var items = $('.ui-selectee', this.sourceList);
      this.addItems(items, event);
      this.targetList.orderingList('selectItem', items);
    }

  });

}(jQuery));
