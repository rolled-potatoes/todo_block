import React, { useEffect, useState } from 'react'
import type { TodoItem as TodoItemType } from '../../shared/types/todo'
import type { FetchTodosMessage } from '../../shared/types/messages'
import TodoItem from './TodoItem'
import ErrorMessage from './ErrorMessage'

type LoadState = 'loading' | 'success' | 'error'

/**
 * 할일 목록 컴포넌트
 * 마운트 시 FETCH_TODOS 메시지를 Background로 전송하여 오늘 할일을 불러온다
 * UPDATE_TODO_STATUS 응답을 받으면 목록을 갱신한다
 */
export default function TodoList() {
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [todos, setTodos] = useState<TodoItemType[]>([])
  const [error, setError] = useState<string>('')

  function fetchTodos() {
    setLoadState('loading')
    const message: FetchTodosMessage = { type: 'FETCH_TODOS' }

    chrome.runtime.sendMessage(message, (response) => {
      const lastError = chrome.runtime.lastError
      if (lastError) {
        setError('SERVER_ERROR')
        setLoadState('error')
        return
      }
      if (response?.success) {
        setTodos(response.data ?? [])
        setLoadState('success')
      } else {
        setError(response?.error ?? 'SERVER_ERROR')
        setLoadState('error')
      }
    })
  }

  /**
   * UPDATE_TODO_STATUS 응답에서 updatedTask, previousActiveTask를 반영하여 목록을 갱신한다
   */
  function handleStatusChange(
    updatedTask: Partial<TodoItemType>,
    previousActiveTask: Partial<TodoItemType> | null
  ) {
    setTodos((prev) =>
      prev.map((todo) => {
        if (todo.id === updatedTask.id) {
          return { ...todo, status: updatedTask.status ?? todo.status }
        }
        // 기존 활성 할일은 idle로 되돌린다
        if (previousActiveTask && todo.id === previousActiveTask.id) {
          return { ...todo, status: 'idle' }
        }
        return todo
      })
    )
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  if (loadState === 'loading') {
    return <p>로딩 중...</p>
  }

  if (loadState === 'error') {
    return <ErrorMessage error={error} onRetry={fetchTodos} />
  }

  if (todos.length === 0) {
    return <p>오늘 할일이 없습니다.</p>
  }

  return (
    <ul>
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onStatusChange={handleStatusChange} />
      ))}
    </ul>
  )
}
