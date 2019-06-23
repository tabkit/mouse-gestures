var {unload} = require("unload")

/**
 * Load various packaged styles for the add-on and undo on unload
 *
 * @usage loadStyles(addon, styles): Load specified styles
 * @param addon [object] : Add-on object from AddonManager
 * @param styles [array of strings] : Style files to load
 */
exports.loadStyles = function (addon, styles) {
  const sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].
            getService(Ci.nsIStyleSheetService)

  styles.forEach(function(fileName) {
    const fileURI = addon.getResourceURI("styles/" + fileName + ".css")

    if (!sss.sheetRegistered(fileURI, sss.AGENT_SHEET)) {
      sss.loadAndRegisterSheet(fileURI, sss.USER_SHEET)

      // Add function to be called when unloading
      unload(function() { sss.unregisterSheet(fileURI, sss.USER_SHEET) })
    }
  })
}
