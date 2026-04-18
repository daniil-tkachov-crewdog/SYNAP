import type { BGToContentMessage, AISelectors } from '@synap/types'
import { KEEPALIVE_INTERVAL, RESPONSE_TIMEOUT } from '../../shared/constants.js'

// Keep the background service worker alive while we wait for responses
setInterval(() => {
  chrome.runtime.sendMessage({ type: 'KEEPALIVE' })
}, KEEPALIVE_INTERVAL)

chrome.runtime.onMessage.addListener(
  (message: BGToContentMessage, _sender, sendResponse) => {
    if (message.type === 'EXECUTE_MESSAGE') {
      executeMessage(message.payload.requestId, message.payload.fullMessage, message.payload.selectors)
        .then(() => sendResponse({ ok: true }))
        .catch((err) => {
          chrome.runtime.sendMessage({
            type: 'RESPONSE_ERROR',
            requestId: message.payload.requestId,
            error: err instanceof Error ? err.message : String(err),
          })
          sendResponse({ ok: false })
        })
      return true // async
    }
  }
)

async function executeMessage(requestId: string, fullMessage: string, selectors: AISelectors) {
  const input = await waitForElement(selectors.inputSelector, 15_000)

  // React-controlled textarea — use native setter to trigger React's synthetic event
  const nativeSetter = Object.getOwnPropertyDescriptor(
    HTMLTextAreaElement.prototype,
    'value'
  )?.set
  if (nativeSetter && input instanceof HTMLTextAreaElement) {
    nativeSetter.call(input, fullMessage)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  } else {
    // Fallback: execCommand (works for some React versions)
    input.focus()
    document.execCommand('insertText', false, fullMessage)
  }

  // Small delay to let React process the input
  await sleep(300)

  const submitBtn = await waitForElement(selectors.submitButtonSelector, 5_000)
  ;(submitBtn as HTMLButtonElement).click()

  await observeResponse(requestId, selectors)
}

async function observeResponse(requestId: string, selectors: AISelectors) {
  const deadline = Date.now() + RESPONSE_TIMEOUT

  // Wait for streaming to start (stop button appears)
  await waitForElement(selectors.streamingIndicatorSelector, 15_000)

  // Wait for streaming to finish (stop button disappears)
  await new Promise<void>((resolve, reject) => {
    const check = () => {
      if (Date.now() > deadline) {
        reject(new Error('Response timeout'))
        return
      }
      const stillStreaming = document.querySelector(selectors.streamingIndicatorSelector)
      if (!stillStreaming) {
        resolve()
      } else {
        setTimeout(check, 500)
      }
    }
    setTimeout(check, 500)
  })

  // Extract the last assistant message
  const containers = document.querySelectorAll(selectors.responseContainerSelector)
  const lastContainer = containers[containers.length - 1]
  const fullText = lastContainer?.textContent?.trim() ?? ''

  chrome.runtime.sendMessage({ type: 'RESPONSE_COMPLETE', requestId, fullText })
}

function waitForElement(selector: string, timeout = 10_000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector)
    if (el) { resolve(el); return }

    const deadline = Date.now() + timeout
    const observer = new MutationObserver(() => {
      const found = document.querySelector(selector)
      if (found) {
        observer.disconnect()
        resolve(found)
      } else if (Date.now() > deadline) {
        observer.disconnect()
        reject(new Error(`Element not found: ${selector}`))
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    // Also set a hard timeout
    setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Timeout waiting for: ${selector}`))
    }, timeout)
  })
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
