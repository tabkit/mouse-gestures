"use strict";

//==================== Modulize JS Scripts START ====================//

/* Includes a javascript file with loadSubScript
*
* @param src (String)
* The url of a javascript file to include.
*/
(function(global) {
  global.include = function include(src) {
    const o = {}
    Components.utils.import("resource://gre/modules/Services.jsm", o)
    const uri = o.Services.io.newURI(
      src, null, o.Services.io.newURI(__SCRIPT_URI_SPEC__, null, null))
    o.Services.scriptloader.loadSubScript(uri.spec, global)
  }
})(this);

/* Imports a commonjs style javascript file with loadSubScript
*
* @param src (String)
* The url of a javascript file.
*/
(function(global) {
  const modules = {}
  global.require = function require(src) {
    if (modules[src]) return modules[src]
    const scope = {require: global.require, exports: {}}
    const tools = {}
    Components.utils.import("resource://gre/modules/Services.jsm", tools)
    const baseURI = tools.Services.io.newURI(__SCRIPT_URI_SPEC__, null, null)
    try {
      const uri = tools.Services.io.newURI(
          "packages/" + src + ".js", null, baseURI)
      tools.Services.scriptloader.loadSubScript(uri.spec, scope)
    } catch (e) {
      const uri = tools.Services.io.newURI(src, null, baseURI)
      tools.Services.scriptloader.loadSubScript(uri.spec, scope)
    }
    return modules[src] = scope.exports
  }
})(this)

//==================== Modulize JS Scripts END ====================//

// Constants
const { classes: Cc, Constructor: CC, interfaces: Ci, utils: Cu,
        results: Cr, manager: Cm } = Components


// Import any Firefox modules here
Cu.import("resource://gre/modules/Services.jsm")
Cu.import("resource://gre/modules/AddonManager.jsm")


// Import any custom JS files
// But they are still part of this addon
// Just like code separated into different files
include("includes/prefs.js")
include("includes/init-listeners.js")
include("includes/mouse-history-gesture.js")


// Require any CommonJS style files
const utils = require("utils")
const {unload} = require("unload")
const {log, debug, dump} = require("console")
const prefUtils = require("pref-utils")
const sessionStore = require("session-store")


//==================== Code to run with DOM Window START ====================//
// Origin Code from http://www.oxymoronical.com/blog/2011/01/Playing-with-windows-in-restartless-bootstrapped-extensions
const WindowListener = {
  setupBrowserUI: function(window) {
    const document = window.document

    // Take any steps to add UI or anything to the browser window
    // document.getElementById() etc. will work here



    // Run all the listeners (after a timeout)
    runPostInitListeners(window)
  },

  tearDownBrowserUI: function(window) {
    const document = window.document

    // Take any steps to remove UI or anything from the browser window
    // document.getElementById() etc. will work here
  },

  // nsIWindowMediatorListener functions
  onOpenWindow: function(xulWindow) {
    // A new window has opened
    const domWindow = xulWindow.QueryInterface(Ci.nsIInterfaceRequestor)
                             .getInterface(Ci.nsIDOMWindow)

    // Wait for it to finish loading
    domWindow.addEventListener("load", function listener() {
      domWindow.removeEventListener("load", listener, false)

      // If this is a browser window then setup its UI
      if (domWindow.document.documentElement.getAttribute("windowtype") === "navigator:browser")
        WindowListener.setupBrowserUI(domWindow)
    }, false)
  },

  onCloseWindow: function(xulWindow) {
  },

  onWindowTitleChange: function(xulWindow, newTitle) {
  }
}
//==================== Code to run with DOM Window END ====================//



//==================== Bootstrap addon methods START ====================//
function install(data, reasonCode) {
  //empty
}

function uninstall(data, reasonCode) {
  //empty
}

function startup(data, reasonCode) {
  // Always set the default prefs as they disappear on restart
  prefUtils.setDefaultPrefs()

  // === Register the preference listeners ===
  // Otherwise the preference attribute mapping does not work
  prefUtils.registerPrefObserver(localPrefs)

  // === Register methods that should be run after most extensions ===
  // Since some event listeners can only be added at that time
  // Only add this once since it is run for every new window
  postInitListeners.push(initMouseGestures)


  const wm = Cc["@mozilla.org/appshell/window-mediator;1"].
           getService(Ci.nsIWindowMediator)

  // Get the list of browser windows already open
  const windows = wm.getEnumerator("navigator:browser")
  while (windows.hasMoreElements()) {
    const domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow)

    WindowListener.setupBrowserUI(domWindow)
  }

  // Wait for any new browser windows to open
  wm.addListener(WindowListener)
}

function shutdown(data, reasonCode) {
  // When the application is shutting down we normally don't have to clean
  // up any UI changes made
  if (reasonCode === APP_SHUTDOWN)
    return


  // Run all the unload callbacks on shutdown
  unload()


  const wm = Cc["@mozilla.org/appshell/window-mediator;1"].
           getService(Ci.nsIWindowMediator)

  // Get the list of browser windows already open
  const windows = wm.getEnumerator("navigator:browser")
  while (windows.hasMoreElements()) {
    const domWindow = windows.getNext().QueryInterface(Ci.nsIDOMWindow)

    WindowListener.tearDownBrowserUI(domWindow)
  }

  // Stop listening for any new browser windows to open
  wm.removeListener(WindowListener)
}
//==================== Bootstrap addon methods END ====================//
