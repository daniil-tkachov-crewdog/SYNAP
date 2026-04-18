// Opens the Synap side panel when the user clicks the extension action button.
// This script is intentionally minimal — the sidebar UI lives in src/sidebar/.

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'OPEN_SIDEBAR') {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDEBAR_REQUEST' })
  }
})
