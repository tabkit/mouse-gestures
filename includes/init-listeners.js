const postInitListeners = []

// Some listeners need the window to get gBrowser, tabContainer
function runPostInitListeners(window) {
  window.setTimeout(function () {
    try {
      // Run module specific late initialisation code (after all init* listeners, and after most extensions):
      postInitListeners.forEach((listener) => {
        listener(window)
      })
    }
    catch (ex) {
      // Run again if something is not ready yet
      runPostInitListeners(window)
    }
  }, 100)
}
