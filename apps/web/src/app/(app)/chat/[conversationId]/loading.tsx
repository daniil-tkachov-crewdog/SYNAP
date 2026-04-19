export default function ChatLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto py-4">
        {/* AI bubble */}
        <div className="flex gap-3 px-4 py-3">
          <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-white/10" />
          <div className="h-16 w-56 animate-pulse rounded-2xl rounded-tl-sm bg-white/8" />
        </div>
        {/* User bubble */}
        <div className="flex flex-row-reverse gap-3 px-4 py-3">
          <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-synap-600/30" />
          <div className="h-10 w-44 animate-pulse rounded-2xl rounded-tr-sm bg-synap-600/20" />
        </div>
        {/* AI bubble (longer) */}
        <div className="flex gap-3 px-4 py-3">
          <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-white/10" />
          <div className="h-24 w-72 animate-pulse rounded-2xl rounded-tl-sm bg-white/8" />
        </div>
        {/* User bubble */}
        <div className="flex flex-row-reverse gap-3 px-4 py-3">
          <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-synap-600/30" />
          <div className="h-10 w-52 animate-pulse rounded-2xl rounded-tr-sm bg-synap-600/20" />
        </div>
      </div>

      {/* Input bar skeleton */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-end gap-3">
          <div className="h-9 w-24 animate-pulse rounded-xl bg-white/5" />
          <div className="h-12 flex-1 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    </div>
  )
}
