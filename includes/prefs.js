/*
 * Stores the required constants and hardcoded default preferences
 * Also declare global and local preference service
 */

const PREF_BRANCH = "extensions.tabkit.mouse-gestures."
// Default pref values
const PREFS = {
  tabWheelSwitchHover: false,
  tabWheelSwitchRMB: false,
  tabWheelSwitchLMB: false,
  tabWheelSwitchOverEdges: true,

  switchTabsOnHover: false,
  switch_tab_on_hover_delay_length_in_millisecond: 200,

  lmbRmbBackForward: true,
  closeTabWithCtrlLMB: false
}

// Make sure we can use gPrefService from now on (even if this isn't a browser window!)
if (typeof globalPrefs == "undefined" || !globalPrefs) {
  const globalPrefs = Cc["@mozilla.org/preferences-service;1"].
           getService(Ci.nsIPrefBranch)
}

const localPrefs = Cc["@mozilla.org/preferences-service;1"]
                 .getService(Ci.nsIPrefService)
                 .getBranch(PREF_BRANCH)
