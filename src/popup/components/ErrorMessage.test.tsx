import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ErrorMessage from './ErrorMessage'

describe('ErrorMessage 컴포넌트', () => {
  it('INVALID_TOKEN 오류 메시지를 표시한다', () => {
    render(<ErrorMessage error="INVALID_TOKEN" onRetry={vi.fn()} />)

    expect(screen.getByText(/토큰/i)).toBeInTheDocument()
  })

  it('NETWORK_ERROR 오류 메시지를 표시한다', () => {
    render(<ErrorMessage error="NETWORK_ERROR" onRetry={vi.fn()} />)

    expect(screen.getByText(/네트워크/i)).toBeInTheDocument()
  })

  it('재시도 버튼 클릭 시 onRetry를 호출한다', () => {
    const onRetry = vi.fn()
    render(<ErrorMessage error="NETWORK_ERROR" onRetry={onRetry} />)

    fireEvent.click(screen.getByRole('button', { name: /재시도/i }))

    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('RATE_LIMIT 오류 메시지를 표시한다', () => {
    render(<ErrorMessage error="RATE_LIMIT" onRetry={vi.fn()} />)

    expect(screen.getByText(/요청 한도/i)).toBeInTheDocument()
  })
})
