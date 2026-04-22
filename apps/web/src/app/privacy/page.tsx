export const metadata = {
  title: 'Privacy Policy — Synap',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-slate-300">
      <h1 className="mb-2 text-3xl font-bold text-white">Privacy Policy</h1>
      <p className="mb-10 text-sm text-slate-500">Last updated: April 2026</p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">What Synap is</h2>
        <p>
          Synap is a web application and Chrome extension that gives you a unified interface to chat
          with AI services (currently ChatGPT and Claude) using your own existing browser sessions.
          Synap never calls any external AI API on your behalf and never requires you to share API
          keys.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Data we collect</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">Account information</strong> — your email address,
            collected when you sign in via Google OAuth or magic link.
          </li>
          <li>
            <strong className="text-white">Conversation history</strong> — the messages you send
            and the AI responses captured by the extension, stored so you can review them later.
          </li>
          <li>
            <strong className="text-white">Memory facts</strong> — short text facts you explicitly
            add in the Memory section, used to personalise your AI prompts.
          </li>
          <li>
            <strong className="text-white">Authentication tokens</strong> — a Supabase session
            token stored in the extension&apos;s local storage so the sidebar can work without the
            web app tab open. This token is never sent to any third party.
          </li>
        </ul>
        <p className="mt-3">
          We do <strong className="text-white">not</strong> collect browsing history, contents of
          pages you visit, keystrokes outside the Synap UI, or any personal data beyond what is
          listed above.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">How data is stored</h2>
        <p>
          All data is stored in a Supabase Postgres database located in the{' '}
          <strong className="text-white">EU-West-1 (Ireland)</strong> region. Data at rest is
          encrypted by Supabase. Row-level security policies ensure each user can only access their
          own data.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Chrome extension permissions</h2>
        <p className="mb-3">
          The Synap extension requests the following permissions. Each is required for the core
          feature and nothing else:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-white">tabs, scripting, host permissions</strong> for
            chatgpt.com and claude.ai — required to automate your own existing browser sessions:
            Synap types your message into the AI&apos;s input box and reads back the response. No
            data from these pages is sent to Synap servers other than the AI&apos;s text reply.
          </li>
          <li>
            <strong className="text-white">storage</strong> — stores your Supabase session token
            locally so the extension sidebar works without the Synap web app tab open.
          </li>
          <li>
            <strong className="text-white">sidePanel</strong> — opens the Synap quick-access panel
            when you click the toolbar icon.
          </li>
          <li>
            <strong className="text-white">activeTab</strong> — required by Chrome Manifest V3 for
            scripting the currently active tab.
          </li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Data sharing</h2>
        <p>
          We do not sell, rent, or share your personal data with any third party. The only external
          service your data touches is Supabase (our database and auth provider).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Cookies</h2>
        <p>
          Synap uses a single HTTP-only session cookie set by Supabase Auth to keep you logged in.
          No tracking or advertising cookies are used.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Data deletion</h2>
        <p>
          Deleting your account removes all your conversations, messages, and memory facts from our
          database. To request account deletion, email us at{' '}
          <a href="mailto:denny.t.mail@gmail.com" className="text-indigo-400 hover:underline">
            denny.t.mail@gmail.com
          </a>
          .
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-white">Contact</h2>
        <p>
          Questions about this policy?{' '}
          <a href="mailto:denny.t.mail@gmail.com" className="text-indigo-400 hover:underline">
            denny.t.mail@gmail.com
          </a>
        </p>
      </section>
    </main>
  )
}
