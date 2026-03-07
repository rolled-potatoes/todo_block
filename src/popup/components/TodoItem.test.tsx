import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TodoItem from './TodoItem'
import type { TodoItem as TodoItemType } from '../../shared/types/todo'

const baseTodo: TodoItemType = {
  id: 'task-1',
  content: '프로젝트 계획서 작성',
  description: '',
  status: 'idle',
  due: null,
  priority: 1,
  todoistUrl: '',
}

describe('TodoItem 컴포넌트 — 상태별 버튼', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('idle 상태일 때 "진행" 버튼과 "완료" 버튼을 표시한다', () => {
    render(<TodoItem todo={{ ...baseTodo, status: 'idle' }} onStatusChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /진행/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /완료/i })).toBeInTheDocument()
  })

  it('in_progress 상태일 때 "중단" 버튼과 "완료" 버튼을 표시한다', () => {
    render(<TodoItem todo={{ ...baseTodo, status: 'in_progress' }} onStatusChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /중단/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /완료/i })).toBeInTheDocument()
  })

  it('completed 상태일 때 버튼을 표시하지 않는다', () => {
    render(<TodoItem todo={{ ...baseTodo, status: 'completed' }} onStatusChange={vi.fn()} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('"진행" 버튼 클릭 시 UPDATE_TODO_STATUS 메시지를 전송한다', async () => {
    const mockSendMessage = vi.fn().mockImplementation(
      (_msg: unknown, callback: (r: unknown) => void) => {
        callback({ success: true, data: { updatedTask: { ...baseTodo, status: 'in_progress' }, previousActiveTask: null, blockingActive: true } })
      }
    )
    chrome.runtime.sendMessage = mockSendMessage
    const onStatusChange = vi.fn()

    render(<TodoItem todo={{ ...baseTodo, status: 'idle' }} onStatusChange={onStatusChange} />)
    fireEvent.click(screen.getByRole('button', { name: /진행/i }))

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UPDATE_TODO_STATUS',
          payload: { taskId: 'task-1', newStatus: 'in_progress' },
        }),
        expect.any(Function)
      )
      expect(onStatusChange).toHaveBeenCalled()
    })
  })

  it('"중단" 버튼 클릭 시 idle로 전환하는 메시지를 전송한다', async () => {
    const mockSendMessage = vi.fn().mockImplementation(
      (_msg: unknown, callback: (r: unknown) => void) => {
        callback({ success: true, data: { updatedTask: { ...baseTodo, status: 'idle' }, previousActiveTask: null, blockingActive: false } })
      }
    )
    chrome.runtime.sendMessage = mockSendMessage
    const onStatusChange = vi.fn()

    render(<TodoItem todo={{ ...baseTodo, status: 'in_progress' }} onStatusChange={onStatusChange} />)
    fireEvent.click(screen.getByRole('button', { name: /중단/i }))

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UPDATE_TODO_STATUS',
          payload: { taskId: 'task-1', newStatus: 'idle' },
        }),
        expect.any(Function)
      )
    })
  })

  it('"완료" 버튼 클릭 시 completed로 전환하는 메시지를 전송한다', async () => {
    const mockSendMessage = vi.fn().mockImplementation(
      (_msg: unknown, callback: (r: unknown) => void) => {
        callback({ success: true, data: { updatedTask: { ...baseTodo, status: 'completed' }, previousActiveTask: null, blockingActive: false } })
      }
    )
    chrome.runtime.sendMessage = mockSendMessage

    render(<TodoItem todo={{ ...baseTodo, status: 'idle' }} onStatusChange={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /완료/i }))

    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'UPDATE_TODO_STATUS',
          payload: { taskId: 'task-1', newStatus: 'completed' },
        }),
        expect.any(Function)
      )
    })
  })

  it('할일 제목을 표시한다', () => {
    render(<TodoItem todo={baseTodo} onStatusChange={vi.fn()} />)
    expect(screen.getByText('프로젝트 계획서 작성')).toBeInTheDocument()
  })
})
