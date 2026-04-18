import type { AIProvider } from '@synap/types'
import { AI_URLS, TAB_LOAD_TIMEOUT } from '../shared/constants.js'
import * as SessionStore from './SessionStore.js'

async function isTabAlive(tabId: number): Promise<boolean> {
  try {
    const tab = await chrome.tabs.get(tabId)
    return tab != null && !tab.discarded
  } catch {
    return false
  }
}

function waitForTabReady(tabId: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Tab load timeout')), TAB_LOAD_TIMEOUT)

    function listener(updatedTabId: number, info: chrome.tabs.TabChangeInfo) {
      if (updatedTabId === tabId && info.status === 'complete') {
        clearTimeout(timeout)
        chrome.tabs.onUpdated.removeListener(listener)
        // Extra delay for JS to initialise on the AI site
        setTimeout(resolve, 1500)
      }
    }

    chrome.tabs.onUpdated.addListener(listener)
  })
}

export async function getOrCreateTab(aiProvider: AIProvider): Promise<number> {
  const record = await SessionStore.getTabRecord(aiProvider)

  if (record && (await isTabAlive(record.tabId))) {
    return record.tabId
  }

  // Clean up stale record if it exists
  if (record) await SessionStore.deleteTabRecord(record.tabId)

  const tab = await chrome.tabs.create({
    url: AI_URLS[aiProvider],
    active: false, // open in background
  })

  const tabId = tab.id!
  await SessionStore.setTabRecord({ tabId, aiProvider, status: 'idle' })
  await waitForTabReady(tabId)

  return tabId
}

export async function navigateTab(tabId: number, url: string): Promise<void> {
  await chrome.tabs.update(tabId, { url })
  await waitForTabReady(tabId)
}

// Clean up tab records when tabs are closed externally
chrome.tabs.onRemoved.addListener((tabId) => {
  SessionStore.deleteTabRecord(tabId)
})
