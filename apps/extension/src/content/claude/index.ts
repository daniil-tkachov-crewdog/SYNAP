import type { BGToContentMessage, AISelectors } from '@synap/types'
import { KEEPALIVE_INTERVAL, RESPONSE_TIMEOUT } from '../../shared/constants.js'

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
      return true
    }
  }
)

async function executeMessage(requestId: string, fullMessage: string, selectors: AISelectors) {
  // Claude uses ProseMirror (contenteditable div), not a textarea
  const input = await waitForElement(selectors.inputSelector, 15_000)

  input.focus()
  // execCommand works reliably for ProseMirror contenteditable fields
  document.execCommand('selectAll', false)
  document.execCommand('insertText', false, fullMessage)

  await sleep(300)

  const submitBtn = await waitForElement(selectors.submitButtonSelector, 5_000)
  ;(submitBtn as HTMLButtonElement).click()

  await observeResponse(requestId, selectors)
}

async function observeResponse(requestId: string, selectors: AISelectors) {
  const deadline = Date.now() + RESPONSE_TIMEOUT

  // Wait for a streaming message to appear
  await waitForElement(selectors.streamingIndicatorSelector, 15_000)

  // Wait for streaming to end (data-is-streaming attribute removed / set to false)
  await new Promise<void>((resolve, reject) => {
    const check = () => {
      if (Date.now() > deadline) { reject(new Error('Response timeout')); return }
      const streaming = document.querySelector(selectors.streamingIndicatorSelector)
      if (!streaming) {
        resolve()
      } else {
        setTimeout(check, 500)
      }
    }
    setTimeout(check, 500)
  })

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
    setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Timeout waiting for: ${selector}`))
    }, timeout)
  })
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}
