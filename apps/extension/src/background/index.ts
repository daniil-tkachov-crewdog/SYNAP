// Service worker entry point — imports are enough to register all listeners.
import './MessageRouter.js'
import './TabManager.js' // registers tabs.onRemoved listener

// Open the side panel when the user clicks the toolbar icon.
chrome.action.onClicked.addListener((tab) => {
  if (tab.windowId != null) {
    chrome.sidePanel.open({ windowId: tab.windowId })
  }
})
