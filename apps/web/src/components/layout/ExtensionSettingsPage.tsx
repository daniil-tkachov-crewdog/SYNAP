'use client'

import Link from 'next/link'
import { useExtension } from '@/hooks/useExtension'
import { CheckCircleIcon, AlertCircleIcon, ExternalLinkIcon } from 'lucide-react'

export function ExtensionSettingsPage() {
  const { isConnected, isChecking, openAiTab } = useExtension()

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-1 text-2xl font-bold text-white">Browser Extension</h1>
        <p className="mb-8 text-sm text-slate-400">
          Synap uses a Chrome extension to connect to AI platforms using your existing accounts —
          no API keys required.
        </p>

        {/* Status card */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center gap-3">
            {isChecking ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-synap-500 border-t-transparent" />
            ) : isConnected ? (
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircleIcon className="h-5 w-5 text-amber-500" />
            )}
            <div>
              <p className="font-medium text-white">
                {isChecking ? 'Checking...' : isConnected ? 'Extension connected' : 'Extension not detected'}
              </p>
              <p className="text-xs text-slate-400">
                {isConnected
                  ? 'Synap can communicate with your AI tabs.'
                  : 'Install the extension to use Synap with your AI accounts.'}
              </p>
            </div>
          </div>
        </div>

        {!isConnected && (
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 font-semibold text-white">Installation</h2>
            <ol className="space-y-3 text-sm text-slate-300">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-synap-600 text-xs font-bold text-white">1</span>
                Download the extension from the Chrome Web Store
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-synap-600 text-xs font-bold text-white">2</span>
                Click &quot;Add to Chrome&quot; and confirm the permissions
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-synap-600 text-xs font-bold text-white">3</span>
                Make sure you&apos;re logged into ChatGPT and Claude in the same browser
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-synap-600 text-xs font-bold text-white">4</span>
                Reload this page — the status dot in the sidebar will turn green
              </li>
            </ol>
            <Link
              href="#"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-synap-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-synap-700"
            >
              <ExternalLinkIcon className="h-4 w-4" />
              Install from Chrome Web Store
            </Link>
          </div>
        )}

        {isConnected && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="mb-4 font-semibold text-white">Open AI tabs</h2>
            <p className="mb-4 text-sm text-slate-400">
              Pre-open AI tabs so Synap responds faster on your first message.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => openAiTab('chatgpt')}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Open ChatGPT tab
              </button>
              <button
                onClick={() => openAiTab('claude')}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Open Claude tab
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
