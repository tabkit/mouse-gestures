// Handlers for all windows
const _handlers = []


// Run after each window start
function initMouseGestures (window) {
  const handlerIndex = _handlers.push(new MouseGesturesHandler(window)) - 1
  // Might not be necessary, but whatever
  unload(function() { handler[handlerIndex] = null })
}

const MouseGesturesHandler = function(window) {
  this._window = window


  const onMouseUpGestureBind = this.onMouseUpGesture.bind(this)
  window.gBrowser.addEventListener("mouseup", onMouseUpGestureBind, true)
  unload(function() { window.gBrowser.removeEventListener("mouseup", onMouseUpGestureBind, true) })
  window.gBrowser.tabContainer.addEventListener("mouseup", onMouseUpGestureBind, true)
  unload(function() { window.gBrowser.tabContainer.removeEventListener("mouseup", onMouseUpGestureBind, true) })

  const onMouseDownGestureBind = this.onMouseDownGesture.bind(this)
  window.gBrowser.addEventListener("mousedown", onMouseDownGestureBind, true)
  unload(function() { window.gBrowser.removeEventListener("mousedown", onMouseDownGestureBind, true) })
  window.gBrowser.tabContainer.addEventListener("mousedown", onMouseDownGestureBind, true)
  unload(function() { window.gBrowser.tabContainer.removeEventListener("mousedown", onMouseDownGestureBind, true) })

  const onContextMenuGestureBind = this.onContextMenuGesture.bind(this)
  window.gBrowser.addEventListener("contextmenu", onContextMenuGestureBind, true)
  unload(function() { window.gBrowser.removeEventListener("contextmenu", onContextMenuGestureBind, true) })
  window.gBrowser.tabContainer.addEventListener("contextmenu", onContextMenuGestureBind, true)
  unload(function() { window.gBrowser.tabContainer.removeEventListener("contextmenu", onContextMenuGestureBind, true) })

  const onMouseDragGestureBind = this.onMouseDragGesture.bind(this)
  window.gBrowser.addEventListener("dragstart", onMouseDragGestureBind, true)
  unload(function() { window.gBrowser.removeEventListener("dragstart", onMouseDragGestureBind, true) })
  window.gBrowser.tabContainer.addEventListener("dragstart", onMouseDragGestureBind, true)
  unload(function() { window.gBrowser.tabContainer.removeEventListener("dragstart", onMouseDragGestureBind, true) })

  const onMouseOutGestureBind = this.onMouseOutGesture.bind(this)
  window.gBrowser.addEventListener("mouseout", onMouseOutGestureBind, true)
  unload(function() { window.gBrowser.removeEventListener("mouseout", onMouseOutGestureBind, true) })


  const onTabWheelGestureBind = this.onTabWheelGesture.bind(this)
  window.gBrowser.tabContainer.addEventListener("wheel", onTabWheelGestureBind, true)
  unload(function() { window.gBrowser.tabContainer.removeEventListener("wheel", onTabWheelGestureBind, true) })

  const onLMBWheelGestureBind = this.onLMBWheelGesture.bind(this)
  window.gBrowser.addEventListener("wheel", onLMBWheelGestureBind, true)
  unload(function() { window.gBrowser.removeEventListener("wheel", onLMBWheelGestureBind, true) })

  const onRMBWheelGestureBind = this.onRMBWheelGesture.bind(this)
  window.gBrowser.addEventListener("wheel", onRMBWheelGestureBind, true)
  unload(function() { window.gBrowser.removeEventListener("wheel", onRMBWheelGestureBind, true) })

  const resetMouseScrollWrapCounterBind = this.resetMouseScrollWrapCounter.bind(this)
  window.gBrowser.tabContainer.addEventListener("TabSelect", resetMouseScrollWrapCounterBind, false)
  unload(function() { window.gBrowser.tabContainer.removeEventListener("TabSelect", resetMouseScrollWrapCounterBind, false) })


  const onTabHoverGestureBind = this.onTabHoverGesture.bind(this)
  window.gBrowser.tabContainer.addEventListener("mouseover", onTabHoverGestureBind, false)
  unload(function() { window.gBrowser.tabContainer.removeEventListener("mouseover", onTabHoverGestureBind, false) })

  const cancelTabHoverGestureBind = this.cancelTabHoverGesture.bind(this)
  window.gBrowser.tabContainer.addEventListener("mouseout", cancelTabHoverGestureBind, false)
  unload(function() { window.gBrowser.tabContainer.removeEventListener("mouseout", cancelTabHoverGestureBind, false) })
}

MouseGesturesHandler.prototype = {
  _window: null,
  _mousedown: [false, undefined, false],

  _shouldPreventContext: false,
  _mouseScrollWrapCounter: 0,

  _hoverTab: null,
  _hoverTimer: null,


  onMouseUpGesture: function (event) {
    if (!event.isTrusted)
      return

    // Ignore if splitter is being dragged
    const splitter = this._window.document.getElementById("tabkit-splitter")
    if (splitter && splitter.getAttribute("state") === "dragging")
      return

    const btn = event.button
    if (this._mousedown[btn])
      this._mousedown[btn] = false
    else if (btn !== 1)
      event.preventDefault() // We've probably just done a rocker gesture
  },

  onMouseDownGesture: function (event) {
    if (!event.isTrusted)
      return

    // Ignore if splitter is being dragged
    const splitter = this._window.document.getElementById("tabkit-splitter")
    if (splitter && splitter.getAttribute("state") === "dragging")
      return

    //0 = LMB, 2 = RMB
    const btn = event.button
    let opp  //opposite button
    if (btn === 0) {
      opp = 2
    }
    else if (btn === 2) {
      opp = 0
    }

    if (this._mousedown[opp] && prefUtils.getPref("lmbRmbBackForward")) {
      if (btn === 0)
        this._window.BrowserBack()
      else
        this._window.BrowserForward()

      this._shouldPreventContext = true
      // Since the Firefox loses mouseup events during the page load (http://forums.mozillazine.org/viewtopic.php?p=33605#33605)
      this._mousedown[opp] = false

      event.preventDefault()
      event.stopPropagation()
    }
    else {
      this._mousedown[btn] = true
    }

    const tab = event.target
    // Cmd key represented by #metaKey
    // http://www.w3.org/TR/DOM-Level-3-Events/
    if (btn === 0 && (event.ctrlKey || event.metaKey)) {
      if (tab && tab.localName === "tab" && prefUtils.getPref("closeTabWithCtrlLMB")) {
        this._window.gBrowser.removeTab(tab)
      }
    }
  },


  // Prevent context menu to be displayed if
  // _shouldPreventContext is true
  onContextMenuGesture: function (event) {
    if (!event.isTrusted || !this._shouldPreventContext)
      return

    event.preventDefault()
    event.stopPropagation()

    this._shouldPreventContext = false
  },

  onMouseDragGesture: function (event) {
    if (!event.isTrusted)
      return

    this._mousedown[0] = this._mousedown[2] = false
  },

  onMouseOutGesture: function (event) {
    if (!event.isTrusted || event.target !== event.currentTarget) // n.b. this refers to gBrowser, not tabkit!
      return

    //comment it for fixing Issue 23(RMBWheelGesture not work after one scroll)
    // this._mousedown[2] = false
    this._mousedown[0] = false
  },


  onTabWheelGesture: function (event) {
    if (!event.isTrusted) {
      return
    }

    const name = event.originalTarget.localName

    if (name === "scrollbar" || name === "scrollbarbutton" || name === "slider" || name === "thumb") {
      return
    }

    if (prefUtils.getPref("tabWheelSwitchHover")) {
      this.scrollwheelTabSwitch(event)
    }
  },

  onLMBWheelGesture: function(event) {
    if (!event.isTrusted || !this._mousedown[0] || !prefUtils.getPref("tabWheelSwitchLMB"))
      return

    this.scrollwheelTabSwitch(event)
    if (event.change !== 0) {
      this._shouldPreventContext = true
    }
  },

  onRMBWheelGesture: function(event) {
    if (!event.isTrusted || !this._mousedown[2] || !prefUtils.getPref("tabWheelSwitchRMB"))
      return

    this.scrollwheelTabSwitch(event)
    if (event.change !== 0) {
      this._shouldPreventContext = true
    }
  },

  // To be called by onTabWheelGesture & onRMBWheelGesture
  // Not to be binded with any event
  scrollwheelTabSwitch: function (event) {
    const change = event.deltaY

    // Scrolling up
    if (change > 0) {
      let lastTab = this._window.gBrowser.tabs[this._window.gBrowser.tabs.length - 1]

      // Skip hidden tabs
      while (lastTab.hidden && lastTab.previousSibling) {
        lastTab = lastTab.previousSibling
      }

      // Switch to next tab, but requiring 3 wheelscrolls to wrap around
      if (this._window.gBrowser.tabContainer.selectedIndex < lastTab._tPos || this._mouseScrollWrapCounter >= 2) {
        this._window.gBrowser.tabContainer.advanceSelectedTab(1, true)
        // Note: _mouseScrollWrapCounter is reset whenever a tab is selected
      }
      // Only increment the counter when preference checked
      else if (prefUtils.getPref("tabWheelSwitchOverEdges")) {
        this._mouseScrollWrapCounter++
      }
    }
    // Scrolling down
    else if (change < 0) {
      let firstTab = this._window.gBrowser.tabs[0]

      // Skip hidden tabs
      while (firstTab.hidden && firstTab.nextSibling) {
        firstTab = firstTab.nextSibling
      }

      // Switch to previous tab, but requiring 3 wheelscrolls to wrap around
      if (this._window.gBrowser.tabContainer.selectedIndex > firstTab._tPos || this._mouseScrollWrapCounter >= 2) {
        this._window.gBrowser.tabContainer.advanceSelectedTab(-1, true)
        // Note: _mouseScrollWrapCounter is reset whenever a tab is selected
      }
      // Only increment the counter when preference checked
      else if (prefUtils.getPref("tabWheelSwitchOverEdges")) {
        this._mouseScrollWrapCounter++
      }
    }

    event.preventDefault()
    event.stopPropagation()
  },

  resetMouseScrollWrapCounter: function (event) {
    this._mouseScrollWrapCounter = 0
  },


  onTabHoverGesture: function (event) {
    if (!event.isTrusted || event.target.localName !== "tab" || !prefUtils.getPref("switchTabsOnHover")) {
      return
    }

    this._hoverTab = event.target

    // Minimum delay, might make it a config later
    const DEFAULT_VALUE = 200
    let value_from_pref = prefUtils.getPref("switch_tab_on_hover_delay_length_in_millisecond")
    let waitTime = (
      typeof value_from_pref !== "number" ||
      isNaN(value_from_pref) ||
      value_from_pref < 0
    ) ? DEFAULT_VALUE : value_from_pref
    // See whether the tab hovering on is just next to the current tab
    const isNeighbourTab = (Math.abs(this._hoverTab._tPos - this._window.gBrowser.selectedTab._tPos) === 1)
    // if hovering neighbour tab, use a longer delay in case it is an accident hover (especially in vertical mode)
    if (isNeighbourTab) {
      waitTime = waitTime * 2
    }

    this._window.clearTimeout(this._hoverTimer)

    this._hoverTimer = this._window.setTimeout(function () {
      this._window.gBrowser.selectedTab = this._hoverTab
    }.bind(this), waitTime)
  },

  cancelTabHoverGesture: function (event) {
    if (!event.isTrusted || event.target !== this._hoverTab)
      return

    this._window.clearTimeout(this._hoverTimer)
  }
}
