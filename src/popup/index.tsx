import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// Popup 진입점 — React 루트 마운트
const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('루트 엘리먼트를 찾을 수 없습니다')

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
