import type { TodoItem, TodoStatus } from './todo'
import type { BlockedSite } from './blocked-site'

// 유효한 메시지 타입 목록
export const MESSAGE_TYPES = [
  'FETCH_TODOS',
  'UPDATE_TODO_STATUS',
  'ADD_BLOCKED_SITE',
  'REMOVE_BLOCKED_SITE',
  'GET_BLOCKED_SITES',
  'SAVE_API_TOKEN',
  'GET_CURRENT_TAB_DOMAIN',
] as const

export type MessageType = (typeof MESSAGE_TYPES)[number]

// 메시지 기본 인터페이스
export interface Message<T extends MessageType, P = undefined> {
  type: T
  payload?: P
}

// 응답 기본 인터페이스
export interface MessageResponse<D = undefined> {
  success: boolean
  data?: D
  error?: string
}

// 각 메시지 타입 정의
export type FetchTodosMessage = Message<'FETCH_TODOS'>

export type UpdateTodoStatusMessage = Message<
  'UPDATE_TODO_STATUS',
  { taskId: string; newStatus: TodoStatus; taskContent?: string }
>

export type AddBlockedSiteMessage = Message<'ADD_BLOCKED_SITE', { domain: string }>

export type RemoveBlockedSiteMessage = Message<'REMOVE_BLOCKED_SITE', { siteId: number }>

export type GetBlockedSitesMessage = Message<'GET_BLOCKED_SITES'>

export type SaveApiTokenMessage = Message<'SAVE_API_TOKEN', { token: string }>

export type GetCurrentTabDomainMessage = Message<'GET_CURRENT_TAB_DOMAIN'>

// 유니온 타입
export type AnyMessage =
  | FetchTodosMessage
  | UpdateTodoStatusMessage
  | AddBlockedSiteMessage
  | RemoveBlockedSiteMessage
  | GetBlockedSitesMessage
  | SaveApiTokenMessage
  | GetCurrentTabDomainMessage

// 응답 타입
export type FetchTodosResponse = MessageResponse<TodoItem[]>
export type UpdateTodoStatusResponse = MessageResponse<{
  updatedTask: TodoItem
  previousActiveTask: TodoItem | null
  blockingActive: boolean
}>
export type AddBlockedSiteResponse = MessageResponse<{
  site: BlockedSite
  totalBlocked: number
}>
export type RemoveBlockedSiteResponse = MessageResponse<{
  removedDomain: string
  totalBlocked: number
}>
export type GetBlockedSitesResponse = MessageResponse<BlockedSite[]>
export type SaveApiTokenResponse = MessageResponse
export type GetCurrentTabDomainResponse = MessageResponse<{
  domain: string | null
  isAlreadyBlocked: boolean
}>

/**
 * MessageType 타입 가드
 */
export function isMessageType(value: unknown): value is MessageType {
  return MESSAGE_TYPES.includes(value as MessageType)
}

/**
 * 성공 응답 생성 헬퍼
 */
export function createSuccessResponse<D>(data?: D): MessageResponse<D> {
  return {
    success: true,
    ...(data !== undefined ? { data } : {}),
  }
}

/**
 * 오류 응답 생성 헬퍼
 */
export function createErrorResponse(error: string): MessageResponse<never> {
  return {
    success: false,
    error,
  }
}
