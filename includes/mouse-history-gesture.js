// Handlers for all windows
var _handlers = [];


// Run after each window start
function initMouseGestures (window) {
  var handlerIndex = _handlers.push(new MouseGesturesHandler(window)) - 1;
  // Might not be necessary, but whatever
  unload(function() { handler[handlerIndex] = null; });
};

var MouseGesturesHandler = function(window) {
  this._window = window;


  var onMouseUpGestureBind = this.onMouseUpGesture.bind(this);
  window.gBrowser.addEventListener("mouseup", onMouseUpGestureBind, true);
  unload(function() window.gBrowser.removeEventListener("mouseup", onMouseUpGestureBind, true));

  var onMouseDownGestureBind = this.onMouseDownGesture.bind(this);
  window.gBrowser.addEventListener("mousedown", onMouseDownGestureBind, true);
  unload(function() window.gBrowser.removeEventListener("mousedown", onMouseDownGestureBind, true));

  var onContextMenuGestureBind = this.onContextMenuGesture.bind(this);
  window.gBrowser.addEventListener("contextmenu", onContextMenuGestureBind, true);
  unload(function() window.gBrowser.removeEventListener("contextmenu", onContextMenuGestureBind, true));

  var onMouseDragGestureBind = this.onMouseDragGesture.bind(this);
  window.gBrowser.addEventListener("draggesture", onMouseDragGestureBind, true);
  unload(function() window.gBrowser.removeEventListener("draggesture", onMouseDragGestureBind, true));

  var onMouseOutGestureBind = this.onMouseOutGesture.bind(this);
  window.gBrowser.addEventListener("mouseout", onMouseOutGestureBind, true);
  unload(function() window.gBrowser.removeEventListener("mouseout", onMouseOutGestureBind, true));


  var onTabWheelGestureBind = this.onTabWheelGesture.bind(this);
  window.gBrowser.tabContainer.addEventListener("DOMMouseScroll", onTabWheelGestureBind, true);
  unload(function() window.gBrowser.tabContainer.removeEventListener("DOMMouseScroll", onTabWheelGestureBind, true));

  var onRMBWheelGestureBind = this.onRMBWheelGesture.bind(this);
  window.gBrowser.addEventListener("DOMMouseScroll", onRMBWheelGestureBind, true);
  unload(function() window.gBrowser.removeEventListener("DOMMouseScroll", onRMBWheelGestureBind, true));

  var resetMouseScrollWrapCounterBind = this.resetMouseScrollWrapCounter.bind(this);
  window.gBrowser.tabContainer.addEventListener("TabSelect", resetMouseScrollWrapCounterBind, false);
  unload(function() window.gBrowser.tabContainer.removeEventListener("TabSelect", resetMouseScrollWrapCounterBind, false));


  var onTabHoverGestureBind = this.onTabHoverGesture.bind(this);
  window.gBrowser.tabContainer.addEventListener("mouseover", onTabHoverGestureBind, false);
  unload(function() window.gBrowser.tabContainer.removeEventListener("mouseover", onTabHoverGestureBind, false));

  var cancelTabHoverGestureBind = this.cancelTabHoverGesture.bind(this);
  window.gBrowser.tabContainer.addEventListener("mouseout", cancelTabHoverGestureBind, false);
  unload(function() window.gBrowser.tabContainer.removeEventListener("mouseout", cancelTabHoverGestureBind, false));
};

MouseGesturesHandler.prototype = {
  _window: null,
  _mousedown: [false, undefined, false],

  _shouldPreventContext: false,
  _mouseScrollWrapCounter: 0,

  _hoverTab: null,
  _hoverTimer: null,
  _lastHoverTime: 0,


  onMouseUpGesture: function (event) {
    if (!event.isTrusted)
      return;

    // Ignore if splitter is being dragged
    var splitter = this._window.document.getElementById("tabkit-splitter");
    if (splitter && splitter.getAttribute("state") == "dragging")
      return;

    var btn = event.button;
    if (this._mousedown[btn])
      this._mousedown[btn] = false;
    else if (btn != 1)
      event.preventDefault(); // We've probably just done a rocker gesture
  },

  onMouseDownGesture: function (event) {
    if (!event.isTrusted)
      return;

    // Ignore if splitter is being dragged
    var splitter = this._window.document.getElementById("tabkit-splitter");
    if (splitter && splitter.getAttribute("state") == "dragging")
      return;

    //0 = LMB, 2 = RMB
    var btn = event.button;
    var opp;  //opposite button
    if (btn == 0)
      opp = 2;
    else if (btn == 2)
      opp = 0;
    else
      return;

    if (this._mousedown[opp] && prefUtils.getPref("lmbRmbBackForward")) {
      if (btn == 0)
        this._window.BrowserBack();
      else
        this._window.BrowserForward();

      this._shouldPreventContext = true;
      // Since the Firefox loses mouseup events during the page load (http://forums.mozillazine.org/viewtopic.php?p=33605#33605)
      this._mousedown[opp] = false;

      event.preventDefault();
      event.stopPropagation();
    }
    else {
      this._mousedown[btn] = true;
    }
  },


  // Prevent context menu to be displayed if
  // _shouldPreventContext is true
  onContextMenuGesture: function (event) {
    if (!event.isTrusted || !this._shouldPreventContext)
      return;

    event.preventDefault();
    event.stopPropagation();

    this._shouldPreventContext = false;
  },

  onMouseDragGesture: function (event) {
    if (!event.isTrusted)
      return;

    this._mousedown[0] = this._mousedown[2] = false;
  },

  onMouseOutGesture: function (event) {
    if (!event.isTrusted || event.target != event.currentTarget) // n.b. this refers to gBrowser, not tabkit!
      return;

    //comment it for fixing Issue 23(RMBWheelGesture not work after one scroll)
    // this._mousedown[2] = false;
    this._mousedown[0] = false;
  },


  onTabWheelGesture: function (event) {
    if (!event.isTrusted) {
      return;
    }

    var name = event.originalTarget.localName;

    if (name == "scrollbar" || name == "scrollbarbutton" || name == "slider" || name == "thumb") {
      return;
    }

    if (prefUtils.getPref("tabWheelSwitchHover")) {
      this.scrollwheelTabSwitch(event);
    }
  },

  onRMBWheelGesture: function(event) {
    if (!event.isTrusted || !this._mousedown[2] || !prefUtils.getPref("tabWheelSwitchRMB"))
      return;

    this.scrollwheelTabSwitch(event);
    if (event.change != 0)
      _shouldPreventContext = true;
  },

  // To be called by onTabWheelGesture & onRMBWheelGesture
  // Not to be binded with any event
  scrollwheelTabSwitch: function (event) {
    var change = event.detail;

    // Scrolling up
    if (change > 0) {
      var lastTab = this._window.gBrowser.tabs[this._window.gBrowser.tabs.length - 1];

      // Skip hidden tabs
      while (lastTab.hidden && lastTab.previousSibling) {
        lastTab = lastTab.previousSibling;
      }

      // Switch to next tab, but requiring 3 wheelscrolls to wrap around
      if (this._window.gBrowser.tabContainer.selectedIndex < lastTab._tPos || this._mouseScrollWrapCounter >= 2) {
        this._window.gBrowser.tabContainer.advanceSelectedTab(1, true);
        // Note: _mouseScrollWrapCounter is reset whenever a tab is selected
      }
      else {
        this._mouseScrollWrapCounter++;
      }
    }
    // Scrolling down
    else if (change < 0) {
      var firstTab = this._window.gBrowser.tabs[0];

      // Skip hidden tabs
      while (firstTab.hidden && firstTab.nextSibling) {
        firstTab = firstTab.nextSibling;
      }

      // Switch to previous tab, but requiring 3 wheelscrolls to wrap around
      if (this._window.gBrowser.tabContainer.selectedIndex > firstTab._tPos || this._mouseScrollWrapCounter >= 2) {
        this._window.gBrowser.tabContainer.advanceSelectedTab(-1, true);
        // Note: _mouseScrollWrapCounter is reset whenever a tab is selected
      }
      else {
        this._mouseScrollWrapCounter++;
      }
    }

    event.preventDefault();
    event.stopPropagation();
  },

  resetMouseScrollWrapCounter: function (event) {
    this._mouseScrollWrapCounter = 0;
  },


  onTabHoverGesture: function (event) {
    if (!event.isTrusted || event.target.localName != "tab" || !prefUtils.getPref("switchTabsOnHover")) {
      return;
    }

    this._hoverTab = event.target;
    // Switch instantly if less than 200ms since last switch, or to tabs next to current tab if less than 1s
    var instantSwitchTime = Math.abs(this._hoverTab._tPos - this._window.gBrowser.selectedTab._tPos) == 1 ? 1000 : 200;
    if ((Date.now() - this._lastHoverTime) < (instantSwitchTime)) {
      var wait = 0;
    }
    else {
      var wait = 200;
    }

    this._window.clearTimeout(this._hoverTimer);

    this._hoverTimer = this._window.setTimeout(function () {
      this._window.gBrowser.selectedTab = this._hoverTab;
      this._lastHoverTime = Date.now();
    }.bind(this), wait);
  },

  cancelTabHoverGesture: function (event) {
    if (!event.isTrusted || event.target != this._hoverTab)
      return;

    this._window.clearTimeout(_hoverTimer);
  }
};
