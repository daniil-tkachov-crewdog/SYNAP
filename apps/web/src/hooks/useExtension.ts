'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AIProvider, WebToExtensionMessage, ExtensionToWebResponse } from '@synap/types'
import { createClient } from '@/lib/supabase/client'

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

  const syncAuth = useCallback(async () => {
    if (!window.chrome?.runtime || !EXTENSION_ID) return
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    sendToExtension({
      type: 'SYNC_AUTH',
      payload: {
        accessToken: session.access_token,
        refreshToken: session.refresh_token,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://synap.app',
      },
    })
  }, [sendToExtension])

  const ping = useCallback(async () => {
    setIsChecking(true)
    const response = await sendToExtension({ type: 'PING' })
    const connected = response?.type === 'PONG' && response.ok === true
    setIsConnected(connected)
    setIsChecking(false)
    if (connected) syncAuth()
  }, [sendToExtension, syncAuth])

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
