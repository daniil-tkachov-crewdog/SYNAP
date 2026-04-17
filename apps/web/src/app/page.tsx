import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-synap-900 to-slate-900 px-4 text-white">
      <div className="max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70">
          <span className="h-2 w-2 rounded-full bg-synap-500" />
          Now in beta
        </div>

        <h1 className="mb-6 text-5xl font-bold tracking-tight sm:text-6xl">
          All your AIs,{' '}
          <span className="bg-gradient-to-r from-synap-400 to-purple-400 bg-clip-text text-transparent">
            one place.
          </span>
        </h1>

        <p className="mb-10 text-lg text-white/60 sm:text-xl">
          Chat with ChatGPT, Claude, Grok, and DeepSeek through one unified interface — with a
          shared memory that follows you across every AI.
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="rounded-xl bg-synap-600 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-synap-700 focus:outline-none focus:ring-2 focus:ring-synap-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Get started free
          </Link>
          <Link
            href="https://github.com/daniil-tkachov-crewdog/synap"
            target="_blank"
            className="rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold text-white/80 transition hover:bg-white/10"
          >
            View on GitHub
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-6 text-center text-sm text-white/50">
          <div>
            <div className="mb-1 text-2xl font-bold text-white">4+</div>
            AI platforms
          </div>
          <div>
            <div className="mb-1 text-2xl font-bold text-white">1</div>
            Unified memory
          </div>
          <div>
            <div className="mb-1 text-2xl font-bold text-white">0</div>
            API keys needed
          </div>
        </div>
      </div>
    </main>
  )
}
