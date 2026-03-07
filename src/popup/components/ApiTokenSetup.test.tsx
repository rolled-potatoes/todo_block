import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ApiTokenSetup from './ApiTokenSetup'

describe('ApiTokenSetup 컴포넌트', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('토큰 입력 폼을 렌더링한다', () => {
    render(<ApiTokenSetup onSuccess={vi.fn()} />)

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /저장/i })).toBeInTheDocument()
  })

  it('저장 클릭 시 SAVE_API_TOKEN 메시지를 전송한다', async () => {
    const mockSendMessage = vi.fn().mockImplementation(
      (_msg: unknown, callback: (r: unknown) => void) => {
        callback({ success: true })
      }
    )
    chrome.runtime.sendMessage = mockSendMessage
    const onSuccess = vi.fn()

    render(<ApiTokenSetup onSuccess={onSuccess} />)

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'my-api-token-123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /저장/i }))

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'SAVE_API_TOKEN',
          payload: { token: 'my-api-token-123' },
        }),
        expect.any(Function)
      )
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('검증 실패 시 오류 메시지를 표시한다', async () => {
    chrome.runtime.sendMessage = vi.fn().mockImplementation(
      (_msg: unknown, callback: (r: unknown) => void) => {
        callback({ success: false, error: 'INVALID_TOKEN' })
      }
    )

    render(<ApiTokenSetup onSuccess={vi.fn()} />)

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'bad-token' },
    })
    fireEvent.click(screen.getByRole('button', { name: /저장/i }))

    await waitFor(() => {
      expect(screen.getByText(/유효하지 않은 토큰/i)).toBeInTheDocument()
    })
  })

  it('빈 토큰 입력 시 저장 버튼이 비활성화된다', () => {
    render(<ApiTokenSetup onSuccess={vi.fn()} />)

    const button = screen.getByRole('button', { name: /저장/i })
    expect(button).toBeDisabled()
  })
})
