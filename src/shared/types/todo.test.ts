import { describe, it, expect } from 'vitest'
import {
  isValidTodoStatus,
  isValidTodoItem,
  createTodoItem,
} from './todo'
import type { TodoItem, TodoStatus } from './todo'

describe('TodoStatus 타입 가드', () => {
  it('유효한 상태 값을 올바르게 판별한다', () => {
    expect(isValidTodoStatus('idle')).toBe(true)
    expect(isValidTodoStatus('in_progress')).toBe(true)
    expect(isValidTodoStatus('completed')).toBe(true)
  })

  it('유효하지 않은 상태 값을 거부한다', () => {
    expect(isValidTodoStatus('pending')).toBe(false)
    expect(isValidTodoStatus('')).toBe(false)
    expect(isValidTodoStatus(null)).toBe(false)
    expect(isValidTodoStatus(undefined)).toBe(false)
    expect(isValidTodoStatus(123)).toBe(false)
  })
})

describe('TodoItem 유효성 검증', () => {
  const validItem: TodoItem = {
    id: '123',
    content: '프로젝트 계획서 작성',
    description: '',
    status: 'idle',
    due: { date: '2026-03-06', datetime: null, timezone: null },
    priority: 1,
    todoistUrl: 'https://todoist.com/showTask?id=123',
  }

  it('유효한 TodoItem을 통과시킨다', () => {
    expect(isValidTodoItem(validItem)).toBe(true)
  })

  it('id가 비어있으면 거부한다', () => {
    expect(isValidTodoItem({ ...validItem, id: '' })).toBe(false)
  })

  it('content가 비어있으면 거부한다', () => {
    expect(isValidTodoItem({ ...validItem, content: '' })).toBe(false)
  })

  it('유효하지 않은 status이면 거부한다', () => {
    expect(isValidTodoItem({ ...validItem, status: 'invalid' as TodoStatus })).toBe(false)
  })

  it('due가 null이어도 유효하다', () => {
    expect(isValidTodoItem({ ...validItem, due: null })).toBe(true)
  })
})

describe('createTodoItem 팩토리 함수', () => {
  it('Todoist API 응답 객체에서 TodoItem을 생성한다', () => {
    const apiResponse = {
      id: '2995104339',
      content: '프로젝트 계획서 작성',
      description: '',
      is_completed: false,
      due: {
        date: '2026-03-06',
        datetime: null,
        timezone: null,
        string: '오늘',
      },
      priority: 1,
      url: 'https://todoist.com/showTask?id=2995104339',
    }

    const item = createTodoItem(apiResponse)

    expect(item.id).toBe('2995104339')
    expect(item.content).toBe('프로젝트 계획서 작성')
    expect(item.status).toBe('idle')
    expect(item.due?.date).toBe('2026-03-06')
    expect(item.priority).toBe(1)
  })

  it('due가 없는 경우 null로 설정한다', () => {
    const apiResponse = {
      id: '1',
      content: '할일',
      description: '',
      is_completed: false,
      due: null,
      priority: 1,
      url: '',
    }

    const item = createTodoItem(apiResponse)
    expect(item.due).toBeNull()
  })
})
