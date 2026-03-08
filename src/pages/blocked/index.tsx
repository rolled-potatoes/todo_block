import React from 'react'
import { createRoot } from 'react-dom/client'
import BlockedPage from './BlockedPage'

// 차단 안내 페이지 진입점
// BlockedPage가 내부에서 chrome.storage.local을 직접 읽어 할일 제목을 가져온다
const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('루트 엘리먼트를 찾을 수 없습니다')

createRoot(rootElement).render(
  <React.StrictMode>
    <BlockedPage />
  </React.StrictMode>
)
