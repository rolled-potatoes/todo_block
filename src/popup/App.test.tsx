import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

// chrome.runtime.sendMessage 모킹
beforeEach(() => {
  vi.clearAllMocks()
})

describe('Popup App 통합 테스트', () => {
  it('API 토큰이 없으면 ApiTokenSetup을 표시한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({}) // 토큰 없음
      }
    )

    render(<App />)

    await waitFor(() => {
      // 토큰 설정 UI 요소 확인
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  it('API 토큰이 있으면 할일 목록을 로드한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({ apiToken: 'my-token' })
      }
    )

    chrome.runtime.sendMessage = vi.fn().mockImplementation(
      (_msg: unknown, callback: (r: unknown) => void) => {
        callback({ success: true, data: [] })
      }
    )

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/오늘 할일이 없습니다/i)).toBeInTheDocument()
    })
  })

  it('API 오류 시 ErrorMessage를 표시한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({ apiToken: 'my-token' })
      }
    )

    chrome.runtime.sendMessage = vi.fn().mockImplementation(
      (_msg: unknown, callback: (r: unknown) => void) => {
        callback({ success: false, error: 'NETWORK_ERROR' })
      }
    )

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/네트워크/i)).toBeInTheDocument()
    })
  })
})
