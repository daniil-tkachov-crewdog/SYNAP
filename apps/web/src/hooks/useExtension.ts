'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AIProvider, WebToExtensionMessage, ExtensionToWebResponse } from '@synap/types'

const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID ?? ''

export function useExtension() {
  const [isConnected, setIsConnected] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  const sendToExtension = useCallback(
    (message: WebToExtensionMessage): Promise<ExtensionToWebResponse | null> => {
      return new Promise((resolve) => {
        if (!window.chrome?.runtime || !EXTENSION_ID) {
          resolve(null)
          return
        }
        window.chrome.runtime.sendMessage(EXTENSION_ID, message, (response) => {
          if (window.chrome?.runtime?.lastError) {
            resolve(null)
          } else {
            resolve(response as ExtensionToWebResponse)
          }
        })
      })
    },
    []
  )

  const ping = useCallback(async () => {
    setIsChecking(true)
    const response = await sendToExtension({ type: 'PING' })
    setIsConnected(response?.type === 'PONG' && response.ok === true)
    setIsChecking(false)
  }, [sendToExtension])

  const openAiTab = useCallback(
    async (aiProvider: AIProvider) => {
      await sendToExtension({ type: 'OPEN_AI_TAB', payload: { aiProvider } })
    },
    [sendToExtension]
  )

  useEffect(() => {
    ping()
    // Re-check every 30s in case extension is installed/uninstalled
    const interval = setInterval(ping, 30_000)
    return () => clearInterval(interval)
  }, [ping])

  return { isConnected, isChecking, sendToExtension, openAiTab, ping }
}
