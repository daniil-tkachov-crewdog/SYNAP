import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { SidebarApp } from './SidebarApp.js'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SidebarApp />
  </StrictMode>
)
