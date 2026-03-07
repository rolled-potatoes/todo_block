import React from 'react'
import type { TodoItem as TodoItemType, TodoStatus } from '../../shared/types/todo'
import type { UpdateTodoStatusMessage, UpdateTodoStatusResponse } from '../../shared/types/messages'

interface TodoItemProps {
  todo: TodoItemType
  onStatusChange: (updatedTask: Partial<TodoItemType>, previousActiveTask: Partial<TodoItemType> | null) => void
}

// 상태별 한글 표시
const STATUS_LABELS: Record<string, string> = {
  idle: '대기',
  in_progress: '진행 중',
  completed: '완료',
}

// 상태별 배지 색상
const STATUS_COLORS: Record<string, string> = {
  idle: '#666',
  in_progress: '#0070f3',
  completed: '#16a34a',
}

/**
 * 할일 단일 항목 컴포넌트
 * 할일 제목과 현재 상태를 표시하고, 상태 전환 버튼을 제공한다
 */
export default function TodoItem({ todo, onStatusChange }: TodoItemProps) {
  function sendStatusChange(newStatus: TodoStatus) {
    const message: UpdateTodoStatusMessage = {
      type: 'UPDATE_TODO_STATUS',
      payload: { taskId: todo.id, newStatus },
    }

    chrome.runtime.sendMessage(message, (response: UpdateTodoStatusResponse) => {
      if (response?.success && response.data) {
        onStatusChange(response.data.updatedTask, response.data.previousActiveTask)
      }
    })
  }

  const statusColor = STATUS_COLORS[todo.status] ?? '#666'

  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 0',
        borderBottom: '1px solid #f0f0f0',
        fontSize: '13px',
      }}
    >
      <span style={{ flex: 1, color: '#1a1a1a' }}>{todo.content}</span>
      <span
        aria-label="상태"
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: statusColor,
          whiteSpace: 'nowrap',
        }}
      >
        {STATUS_LABELS[todo.status] ?? todo.status}
      </span>
      {todo.status === 'idle' && (
        <>
          <button
            onClick={() => sendStatusChange('in_progress')}
            style={btnStyle('#0070f3')}
          >
            진행
          </button>
          <button
            onClick={() => sendStatusChange('completed')}
            style={btnStyle('#16a34a')}
          >
            완료
          </button>
        </>
      )}
      {todo.status === 'in_progress' && (
        <>
          <button
            onClick={() => sendStatusChange('idle')}
            style={btnStyle('#888')}
          >
            중단
          </button>
          <button
            onClick={() => sendStatusChange('completed')}
            style={btnStyle('#16a34a')}
          >
            완료
          </button>
        </>
      )}
    </li>
  )
}

function btnStyle(color: string): React.CSSProperties {
  return {
    fontSize: '11px',
    padding: '2px 7px',
    border: `1px solid ${color}`,
    borderRadius: '4px',
    background: 'transparent',
    color: color,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  }
}
