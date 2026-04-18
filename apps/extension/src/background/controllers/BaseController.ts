import type { AIProvider, AISelectors, PendingRequest } from '@synap/types'
import * as TabManager from '../TabManager.js'
import * as SessionStore from '../SessionStore.js'

export abstract class BaseController {
  abstract readonly aiProvider: AIProvider
  abstract getSelectors(): AISelectors

  async execute(request: PendingRequest): Promise<void> {
    const selectors = this.getSelectors()

    const tabId = await TabManager.getOrCreateTab(this.aiProvider)
    await SessionStore.updatePendingRequest(request.requestId, { tabId, status: 'typing' })
    await SessionStore.updateTabStatus(tabId, 'busy')

    // Navigate to a fresh chat
    await TabManager.navigateTab(tabId, selectors.newChatUrl)

    // Send EXECUTE_MESSAGE to the content script running in that tab
    await chrome.tabs.sendMessage(tabId, {
      type: 'EXECUTE_MESSAGE',
      payload: {
        requestId: request.requestId,
        fullMessage: request.fullMessage,
        selectors,
      },
    })
  }
}
