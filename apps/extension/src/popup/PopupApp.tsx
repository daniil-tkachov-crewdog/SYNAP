import { useEffect, useState } from 'react'
import { EXTENSION_VERSION } from '../shared/constants.js'
import type { TabRecord } from '@synap/types'

export function PopupApp() {
  const [tabs, setTabs] = useState<TabRecord[]>([])
  const [pending, setPending] = useState(0)

  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
      if (response?.type === 'STATUS') {
        setTabs(response.tabs)
        setPending(response.pendingRequests)
      }
    })
  }, [])

  function openSynap() {
    chrome.tabs.create({ url: 'https://synap.app/chat' })
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <span style={{ fontSize: '18px', fontWeight: 700 }}>
          Syn<span style={{ color: '#6366f1' }}>ap</span>
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#475569' }}>
          v{EXTENSION_VERSION}
        </span>
      </div>

      {pending > 0 && (
        <div style={{
          background: '#312e81',
          borderRadius: '8px',
          padding: '8px 12px',
          marginBottom: '12px',
          fontSize: '12px',
          color: '#a5b4fc',
        }}>
          ⏳ {pending} message{pending > 1 ? 's' : ''} in progress…
        </div>
      )}

      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Open AI tabs
        </p>
        {tabs.length === 0 ? (
          <p style={{ fontSize: '12px', color: '#475569' }}>No AI tabs open</p>
        ) : (
          tabs.map((tab) => (
            <div key={tab.tabId} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0', fontSize: '13px' }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: tab.status === 'busy' ? '#f59e0b' : '#22c55e',
              }} />
              {tab.aiProvider}
              <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#475569' }}>
                {tab.status}
              </span>
            </div>
          ))
        )}
      </div>

      <button
        onClick={openSynap}
        style={{
          width: '100%',
          padding: '8px',
          background: '#4f46e5',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Open Synap →
      </button>
    </div>
  )
}
