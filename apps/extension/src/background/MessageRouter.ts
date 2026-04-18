import type {
  WebToExtensionMessage,
  ExtensionToWebResponse,
  ContentToBGMessage,
  AIProvider,
  PendingRequest,
} from '@synap/types'
import { EXTENSION_VERSION } from '../shared/constants.js'
import * as SessionStore from './SessionStore.js'
import { ChatGPTController } from './controllers/ChatGPTController.js'
import { ClaudeController } from './controllers/ClaudeController.js'

const controllers = {
  chatgpt: new ChatGPTController(),
  claude: new ClaudeController(),
}

// ─── From Web App (externally_connectable) ────────────────────────────────────

chrome.runtime.onMessageExternal.addListener(
  (
    message: WebToExtensionMessage,
    _sender,
    sendResponse: (r: ExtensionToWebResponse) => void
  ) => {
    handleWebMessage(message, sendResponse)
    return true // keep channel open for async response
  }
)

async function handleWebMessage(
  message: WebToExtensionMessage,
  sendResponse: (r: ExtensionToWebResponse) => void
) {
  switch (message.type) {
    case 'PING':
      sendResponse({ type: 'PONG', ok: true, version: EXTENSION_VERSION })
      break

    case 'GET_STATUS': {
      const tabs = await SessionStore.getAllTabRecords()
      const pending = await chrome.storage.session.get('pending_requests')
      const count = Object.keys(pending['pending_requests'] ?? {}).length
      sendResponse({ type: 'STATUS', tabs, pendingRequests: count })
      break
    }

    case 'SEND_MESSAGE': {
      const { requestId, conversationId, aiProvider, fullMessage, authToken, webhookUrl } =
        message.payload

      const request: PendingRequest = {
        requestId,
        conversationId,
        aiProvider,
        fullMessage,
        authToken,
        webhookUrl,
        status: 'queued',
        createdAt: Date.now(),
      }

      await SessionStore.setPendingRequest(request)
      sendResponse({ type: 'MESSAGE_QUEUED', requestId })

      const controller = controllers[aiProvider as keyof typeof controllers]
      if (!controller) {
        await postError(request, `Unsupported AI provider: ${aiProvider}`)
        return
      }

      try {
        await controller.execute(request)
      } catch (err) {
        await postError(request, err instanceof Error ? err.message : 'Unknown error')
      }
      break
    }

    case 'OPEN_AI_TAB': {
      const { aiProvider } = message.payload
      const controller = controllers[aiProvider as keyof typeof controllers]
      if (controller) {
        try {
          await SessionStore.getTabRecord(aiProvider) // warm up
          await import('./TabManager.js').then((m) => m.getOrCreateTab(aiProvider as AIProvider))
        } catch {}
      }
      sendResponse({ type: 'PONG', ok: true, version: EXTENSION_VERSION })
      break
    }

    default:
      sendResponse({ type: 'ERROR', message: 'Unknown message type' })
  }
}

// ─── From Content Scripts ─────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message: ContentToBGMessage, _sender, sendResponse) => {
  handleContentMessage(message)
  sendResponse({ ok: true })
  return false
})

async function handleContentMessage(message: ContentToBGMessage) {
  switch (message.type) {
    case 'RESPONSE_COMPLETE': {
      const request = await SessionStore.getPendingRequest(message.requestId)
      if (!request) return

      await postWebhook(request, message.fullText, false)
      await SessionStore.deletePendingRequest(message.requestId)
      if (request.tabId != null) {
        await SessionStore.updateTabStatus(request.tabId, 'idle')
      }
      break
    }

    case 'RESPONSE_ERROR': {
      const request = await SessionStore.getPendingRequest(message.requestId)
      if (!request) return

      await postError(request, message.error)
      await SessionStore.deletePendingRequest(message.requestId)
      if (request.tabId != null) {
        await SessionStore.updateTabStatus(request.tabId, 'idle')
      }
      break
    }

    case 'RESPONSE_CHUNK': {
      const request = await SessionStore.getPendingRequest(message.requestId)
      if (!request) return
      await postWebhook(request, message.chunk, true)
      break
    }

    case 'KEEPALIVE':
      // Intentional no-op — just wakes the service worker
      break
  }
}

// ─── Webhook helpers ──────────────────────────────────────────────────────────

async function postWebhook(request: PendingRequest, content: string, isPartial: boolean) {
  try {
    await fetch(request.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.authToken}`,
      },
      body: JSON.stringify({
        requestId: request.requestId,
        conversationId: request.conversationId,
        aiProvider: request.aiProvider,
        content,
        isPartial,
      }),
    })
  } catch (err) {
    console.error('[Synap] Failed to post webhook:', err)
  }
}

async function postError(request: PendingRequest, errorMessage: string) {
  try {
    await fetch(request.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${request.authToken}`,
      },
      body: JSON.stringify({
        requestId: request.requestId,
        conversationId: request.conversationId,
        aiProvider: request.aiProvider,
        content: '',
        isError: true,
        errorMessage,
      }),
    })
  } catch {}
}
