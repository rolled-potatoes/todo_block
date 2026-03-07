import { createTodoItem } from '../shared/types/todo'
import type { TodoItem, TodoistApiTask } from '../shared/types/todo'
import type { MessageResponse } from '../shared/types/messages'

const TODOIST_API_BASE = 'https://api.todoist.com/api/v1'

/**
 * Todoist API v1 페이지네이션 응답 래퍼
 */
interface PaginatedResponse<T> {
  results: T[]
  next_cursor: string | null
}

/**
 * Todoist API 오늘 할일 조회
 * GET /api/v1/tasks/filter?query=today
 * v1에서는 /tasks?filter= 대신 /tasks/filter?query= 엔드포인트를 사용한다
 * 응답은 { results: [...], next_cursor: ... } 형태의 페이지네이션 래퍼이다
 */
export async function fetchTodayTasks(
  token: string
): Promise<MessageResponse<TodoItem[]>> {
  try {
    const allTasks: TodoistApiTask[] = []
    let cursor: string | null = null

    // 페이지네이션: next_cursor가 없을 때까지 반복 조회
    do {
      const url = new URL(`${TODOIST_API_BASE}/tasks/filter`)
      url.searchParams.set('query', 'today')
      if (cursor) url.searchParams.set('cursor', cursor)

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        return { success: false, error: mapHttpError(response.status) }
      }

      const body: PaginatedResponse<TodoistApiTask> = await response.json()
      allTasks.push(...body.results)
      cursor = body.next_cursor ?? null
    } while (cursor)

    const todos: TodoItem[] = allTasks.map(createTodoItem)
    return { success: true, data: todos }
  } catch (err) {
    // TypeError는 네트워크 연결 오류
    if (err instanceof TypeError) {
      return { success: false, error: 'NETWORK_ERROR' }
    }
    return { success: false, error: 'SERVER_ERROR' }
  }
}

/**
 * Todoist API 할일 완료 처리
 * POST /api/v1/tasks/{task_id}/close
 */
export async function closeTask(
  token: string,
  taskId: string
): Promise<MessageResponse> {
  try {
    const response = await fetch(`${TODOIST_API_BASE}/tasks/${taskId}/close`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      return { success: false, error: mapHttpError(response.status) }
    }

    return { success: true }
  } catch (err) {
    if (err instanceof TypeError) {
      return { success: false, error: 'NETWORK_ERROR' }
    }
    return { success: false, error: 'SERVER_ERROR' }
  }
}

/**
 * API 토큰 유효성 검증
 * 오늘 할일 목록 API를 호출하여 토큰이 유효한지 확인한다
 */
export async function validateApiToken(
  token: string
): Promise<MessageResponse> {
  const result = await fetchTodayTasks(token)
  if (!result.success) {
    return { success: false, error: result.error }
  }
  return { success: true }
}

/**
 * HTTP 상태 코드를 오류 타입으로 변환
 */
function mapHttpError(status: number): string {
  if (status === 401 || status === 403) return 'INVALID_TOKEN'
  if (status === 404) return 'TASK_NOT_FOUND'
  if (status === 429) return 'RATE_LIMIT'
  return 'SERVER_ERROR'
}
