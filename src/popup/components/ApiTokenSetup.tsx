import React, { useState } from 'react'
import type { SaveApiTokenMessage } from '../../shared/types/messages'

interface ApiTokenSetupProps {
  onSuccess: () => void
}

/**
 * API 토큰 입력 컴포넌트
 * Todoist API 토큰을 입력받아 Background로 SAVE_API_TOKEN 메시지를 전송한다
 */
export default function ApiTokenSetup({ onSuccess }: ApiTokenSetupProps) {
  const [token, setToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleSubmit() {
    if (!token.trim()) return

    setLoading(true)
    setError(null)

    const message: SaveApiTokenMessage = {
      type: 'SAVE_API_TOKEN',
      payload: { token: token.trim() },
    }

    chrome.runtime.sendMessage(message, (response) => {
      // chrome.runtime.lastError를 명시적으로 읽어야 Chrome 내부 에러가 억제된다
      const lastError = chrome.runtime.lastError
      setLoading(false)
      if (lastError) {
        setError('SERVER_ERROR')
        return
      }
      if (response?.success) {
        onSuccess()
      } else {
        setError(response?.error ?? 'SERVER_ERROR')
      }
    })
  }

  return (
    <div>
      <p>Todoist API 토큰을 입력하세요.</p>
      <input
        type="text"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="API 토큰"
      />
      <button onClick={handleSubmit} disabled={!token.trim() || loading}>
        저장
      </button>
      {error === 'INVALID_TOKEN' && (
        <p style={{ color: '#c00' }}>유효하지 않은 토큰입니다.</p>
      )}
    </div>
  )
}
