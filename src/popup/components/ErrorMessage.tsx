import React from 'react'

// 오류 타입별 한글 메시지 매핑
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_TOKEN: '유효하지 않은 토큰입니다. Todoist API 토큰을 확인해 주세요.',
  NETWORK_ERROR: '네트워크 연결 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.',
  RATE_LIMIT: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
  TASK_NOT_FOUND: '할일을 찾을 수 없습니다.',
  DUPLICATE_DOMAIN: '이미 등록된 도메인입니다.',
  INVALID_DOMAIN: '유효하지 않은 도메인입니다. (프로토콜/경로 없이 입력해 주세요)',
  SITE_NOT_FOUND: '등록되지 않은 사이트입니다.',
}

interface ErrorMessageProps {
  error: string
  onRetry: () => void
}

/**
 * 오류 메시지 컴포넌트
 * 오류 타입에 따른 한글 안내 메시지와 재시도 버튼을 표시한다
 */
export default function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const message = ERROR_MESSAGES[error] ?? `오류가 발생했습니다. (${error})`

  return (
    <div role="alert" style={{ padding: '8px', color: '#c00' }}>
      <p>{message}</p>
      <button onClick={onRetry}>재시도</button>
    </div>
  )
}
