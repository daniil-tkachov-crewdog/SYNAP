// Chrome extension runtime types for use in the web app
// (window.chrome is injected by the browser when an extension is installed)

interface ChromeRuntime {
  sendMessage(
    extensionId: string,
    message: unknown,
    callback?: (response: unknown) => void
  ): void
  lastError?: { message: string }
}

interface Window {
  chrome?: {
    runtime?: ChromeRuntime
  }
}
