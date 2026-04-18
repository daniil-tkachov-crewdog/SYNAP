export function ContextSwitchBanner() {
  return (
    <div className="flex items-center justify-center gap-2 border-b border-synap-500/20 bg-synap-500/10 px-4 py-2 text-xs text-synap-400">
      <span className="h-3 w-3 animate-spin rounded-full border border-synap-400 border-t-transparent" />
      Summarizing conversation and switching AI…
    </div>
  )
}
