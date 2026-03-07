import React from 'react'
import { createRoot } from 'react-dom/client'
import BlockedPage from './BlockedPage'

// 차단 안내 페이지 진입점
// URL 파라미터에서 진행 중인 할일 제목을 읽는다
// 예: /pages/blocked/index.html?task=프로젝트+계획서+작성
const params = new URLSearchParams(window.location.search)
const taskTitle = params.get('task')

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('루트 엘리먼트를 찾을 수 없습니다')

createRoot(rootElement).render(
  <React.StrictMode>
    <BlockedPage taskTitle={taskTitle} />
  </React.StrictMode>
)
