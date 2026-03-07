import React from 'react'

interface BlockedPageProps {
  taskTitle: string | null
}

/**
 * 차단 안내 페이지 컴포넌트
 * 현재 진행 중인 할일 제목을 표시하고 집중을 유도한다
 */
function BlockedPage({ taskTitle }: BlockedPageProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
        background: '#fafafa',
        color: '#1a1a1a',
        padding: '40px 20px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: '48px',
          marginBottom: '16px',
          lineHeight: 1,
        }}
      >
        🚫
      </div>
      <h1
        style={{
          fontSize: '22px',
          fontWeight: 700,
          marginBottom: '12px',
          color: '#c00',
        }}
      >
        접속이 차단되었습니다
      </h1>
      {taskTitle && (
        <p style={{ fontSize: '15px', marginBottom: '8px', color: '#444' }}>
          현재 진행 중인 할일: <strong style={{ color: '#0070f3' }}>{taskTitle}</strong>
        </p>
      )}
      <p style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
        집중 모드가 활성화되어 있습니다.
      </p>
      <p style={{ fontSize: '13px', color: '#666' }}>
        팝업에서 할일 상태를 변경하면 차단이 해제됩니다. (돌아가기)
      </p>
    </div>
  )
}

export default BlockedPage

