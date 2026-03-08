import React, { useState, useEffect } from 'react'

/**
 * 집중 차단 화면 컴포넌트
 * chrome.storage.local에서 activeTaskTitle을 읽어 진행 중인 할일 제목을 표시하고,
 * history.replaceState로 뒤로가기 동작을 안전하게 처리한다
 */
function BlockedPage(): JSX.Element {
  // 진행 중인 할일 제목 (storage 로드 전: null)
  const [taskTitle, setTaskTitle] = useState<string | null>(null)
  // storage 로드 완료 여부
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // 차단 페이지를 히스토리 스택에서 현재 위치로 replace하여
    // 뒤로가기 시 차단된 사이트를 건너뛰고 안전한 이전 페이지로 이동한다
    history.replaceState(null, '', location.href)
  }, [])

  useEffect(() => {
    // chrome.storage.local에서 진행 중인 할일 제목을 1회 읽는다
    chrome.storage.local.get('activeTaskTitle', (result) => {
      setTaskTitle(result['activeTaskTitle'] ?? null)
      setIsLoaded(true)
    })
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        background: '#1a1a2e',
        color: '#e0e0e0',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      {/* 집중을 상징하는 시각적 아이콘 */}
      <div
        role="img"
        aria-label="집중"
        style={{
          fontSize: '64px',
          marginBottom: '24px',
          lineHeight: 1,
        }}
      >
        🎯
      </div>

      {/* 집중 경고 제목 — 고정 문구 */}
      <h1
        style={{
          fontSize: '28px',
          fontWeight: 700,
          marginBottom: '12px',
          color: '#ff6b6b',
          margin: '0 0 12px 0',
        }}
      >
        지금은 업무에 집중할 시간입니다
      </h1>

      {/* 집중 유도 부제목 — 고정 문구 */}
      <p
        style={{
          fontSize: '16px',
          color: '#aaa',
          marginBottom: '24px',
          margin: '0 0 24px 0',
        }}
      >
        이 사이트는 집중 모드 중에 차단되었습니다.
      </p>

      {/* 진행 중인 할일 제목 — activeTaskTitle이 있을 때만 표시 */}
      {isLoaded && taskTitle && (
        <p
          style={{
            fontSize: '15px',
            color: '#ccc',
            marginBottom: '32px',
            margin: '0 0 32px 0',
          }}
        >
          현재 진행 중인 할일:{' '}
          <strong
            style={{
              color: '#ffd93d',
              wordBreak: 'break-word',
              maxWidth: '600px',
              display: 'inline-block',
            }}
          >
            {taskTitle}
          </strong>
        </p>
      )}

      {/* 차단 해제 안내 — 항상 표시 */}
      <p
        style={{
          fontSize: '13px',
          color: '#888',
          marginTop: isLoaded && taskTitle ? '0' : '32px',
        }}
      >
        팝업에서 할일 상태를 변경하면 차단이 해제됩니다.
      </p>
    </div>
  )
}

export default BlockedPage
