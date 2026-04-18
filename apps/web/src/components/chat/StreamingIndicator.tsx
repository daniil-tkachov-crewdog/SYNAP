export function StreamingIndicator({ aiName }: { aiName: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white/80">
        {aiName[0]}
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-white/10 bg-white/8 px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50" />
      </div>
    </div>
  )
}
