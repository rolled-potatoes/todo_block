import { describe, it, expect } from 'vitest'
import { isMessageType, createSuccessResponse, createErrorResponse } from './messages'

describe('isMessageType 메시지 타입 구분', () => {
  it('유효한 메시지 타입을 인식한다', () => {
    const validTypes = [
      'FETCH_TODOS',
      'UPDATE_TODO_STATUS',
      'ADD_BLOCKED_SITE',
      'REMOVE_BLOCKED_SITE',
      'GET_BLOCKED_SITES',
      'SAVE_API_TOKEN',
      'GET_CURRENT_TAB_DOMAIN',
    ]

    validTypes.forEach((type) => {
      expect(isMessageType(type)).toBe(true)
    })
  })

  it('유효하지 않은 메시지 타입을 거부한다', () => {
    expect(isMessageType('UNKNOWN_TYPE')).toBe(false)
    expect(isMessageType('')).toBe(false)
    expect(isMessageType(null)).toBe(false)
    expect(isMessageType(undefined)).toBe(false)
  })
})

describe('createSuccessResponse 응답 생성', () => {
  it('데이터가 있는 성공 응답을 생성한다', () => {
    const response = createSuccessResponse({ count: 3 })
    expect(response.success).toBe(true)
    expect(response.data).toEqual({ count: 3 })
    expect(response.error).toBeUndefined()
  })

  it('데이터 없는 성공 응답을 생성한다', () => {
    const response = createSuccessResponse()
    expect(response.success).toBe(true)
    expect(response.data).toBeUndefined()
  })
})

describe('createErrorResponse 오류 응답 생성', () => {
  it('오류 메시지가 포함된 실패 응답을 생성한다', () => {
    const response = createErrorResponse('INVALID_TOKEN')
    expect(response.success).toBe(false)
    expect(response.error).toBe('INVALID_TOKEN')
    expect(response.data).toBeUndefined()
  })
})
