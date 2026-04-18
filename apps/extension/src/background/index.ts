// Service worker entry point — imports are enough to register all listeners.
import './MessageRouter.js'
import './TabManager.js' // registers tabs.onRemoved listener
