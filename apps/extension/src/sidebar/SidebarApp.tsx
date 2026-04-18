import { useState } from 'react'

export function SidebarApp() {
  const [input, setInput] = useState('')

  function openSynap() {
    chrome.tabs.create({ url: 'https://synap.app/chat' })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <span style={{ fontSize: '20px', fontWeight: 700 }}>
          Syn<span style={{ color: '#6366f1' }}>ap</span>
        </span>
        <button
          onClick={openSynap}
          style={{
            marginLeft: 'auto',
            padding: '4px 10px',
            background: '#1e293b',
            color: '#94a3b8',
            border: '1px solid #334155',
            borderRadius: '6px',
            fontSize: '11px',
            cursor: 'pointer',
          }}
        >
          Full view ↗
        </button>
      </div>

      <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
        Quick-access sidebar. Open the full Synap app for conversation history and memory management.
      </p>

      <div style={{ marginTop: 'auto' }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask any AI…"
          rows={3}
          style={{
            width: '100%',
            background: '#1e293b',
            color: '#f8fafc',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '10px',
            fontSize: '13px',
            resize: 'none',
            outline: 'none',
          }}
        />
        <button
          onClick={openSynap}
          style={{
            width: '100%',
            marginTop: '8px',
            padding: '10px',
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Open in Synap →
        </button>
      </div>
    </div>
  )
}
