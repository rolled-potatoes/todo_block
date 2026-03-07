import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import TodoList from './TodoList'
import type { TodoItem } from '../../shared/types/todo'

// chrome.runtime.sendMessage 모킹
const mockSendMessage = vi.fn()

describe('TodoList 컴포넌트', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    chrome.runtime.sendMessage = mockSendMessage
  })

  it('로딩 중 상태를 표시한다', () => {
    // sendMessage가 응답하지 않는 상황
    mockSendMessage.mockImplementation(() => new Promise(() => {}))

    render(<TodoList />)

    expect(screen.getByText(/로딩/i)).toBeInTheDocument()
  })

  it('할일 목록을 렌더링한다', async () => {
    const todos: TodoItem[] = [
      {
        id: '1',
        content: '프로젝트 계획서 작성',
        description: '',
        status: 'idle',
        due: { date: '2026-03-06', datetime: null, timezone: null },
        priority: 1,
        todoistUrl: '',
      },
      {
        id: '2',
        content: '코드 리뷰',
        description: '',
        status: 'in_progress',
        due: null,
        priority: 2,
        todoistUrl: '',
      },
    ]

    mockSendMessage.mockImplementation((_msg: unknown, callback: (r: unknown) => void) => {
      callback({ success: true, data: todos })
    })

    render(<TodoList />)

    await waitFor(() => {
      expect(screen.getByText('프로젝트 계획서 작성')).toBeInTheDocument()
      expect(screen.getByText('코드 리뷰')).toBeInTheDocument()
    })
  })

  it('할일이 없으면 안내 메시지를 표시한다', async () => {
    mockSendMessage.mockImplementation((_msg: unknown, callback: (r: unknown) => void) => {
      callback({ success: true, data: [] })
    })

    render(<TodoList />)

    await waitFor(() => {
      expect(screen.getByText(/오늘 할일이 없습니다/i)).toBeInTheDocument()
    })
  })

  it('API 오류 시 오류 메시지를 표시한다', async () => {
    mockSendMessage.mockImplementation((_msg: unknown, callback: (r: unknown) => void) => {
      callback({ success: false, error: 'NETWORK_ERROR' })
    })

    render(<TodoList />)

    await waitFor(() => {
      expect(screen.getByText(/오류/i)).toBeInTheDocument()
    })
  })
})
