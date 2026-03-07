import React, { useEffect, useState } from 'react'
import { getStorage } from '../shared/storage'
import ApiTokenSetup from './components/ApiTokenSetup'
import TodoList from './components/TodoList'
import BlockedSites from './components/BlockedSites'

type AppState = 'loading' | 'no_token' | 'has_token'

/**
 * Popup 루트 컴포넌트
 * API 토큰 유무에 따라 토큰 입력 화면 또는 할일 목록 화면을 표시한다
 */
function App() {
  const [appState, setAppState] = useState<AppState>('loading')

  useEffect(() => {
    getStorage('apiToken').then((token) => {
      setAppState(token ? 'has_token' : 'no_token')
    })
  }, [])

  if (appState === 'loading') {
    return (
      <div style={{ padding: '16px' }}>
        <p>로딩 중...</p>
      </div>
    )
  }

  if (appState === 'no_token') {
    return (
      <div style={{ padding: '16px' }}>
        <h1 style={{ fontSize: '16px', marginBottom: '8px' }}>Todoist 집중 차단기</h1>
        <ApiTokenSetup onSuccess={() => setAppState('has_token')} />
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', minWidth: '320px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#1a1a1a' }}>
        Todoist 집중 차단기
      </h1>
      <TodoList />
      <hr style={{ margin: '14px 0', borderColor: '#e5e5e5' }} />
      <BlockedSites />
    </div>
  )
}

export default App
