// Todoist 할일 상태 타입
// idle: 기본 상태(중단), in_progress: 진행 중, completed: 완료
export type TodoStatus = 'idle' | 'in_progress' | 'completed'

// Todoist 마감일 정보
export interface DueDate {
  date: string           // YYYY-MM-DD
  datetime: string | null // RFC 3339 형식, 시간 포함 시
  timezone: string | null
}

// 익스텐션 내부에서 관리하는 할일 항목
export interface TodoItem {
  id: string              // Todoist 작업 고유 ID
  content: string         // 할일 제목
  description: string     // 할일 설명 (빈 문자열 가능)
  status: TodoStatus      // 익스텐션 내부 상태
  due: DueDate | null     // 마감일 정보
  priority: number        // Todoist 우선순위 (1~4)
  todoistUrl: string      // Todoist 앱 내 작업 링크
}

// Todoist API v1 응답 형식 (오늘 할일 조회용)
export interface TodoistApiTask {
  id: string
  content: string
  description: string
  checked: boolean        // v1: is_completed → checked
  due: {
    date: string
    datetime: string | null
    timezone: string | null
    string: string
  } | null
  priority: number
  url: string             // Todoist 앱 내 작업 링크 (v1에서도 동일)
}

/**
 * TodoStatus 타입 가드
 * 주어진 값이 유효한 TodoStatus인지 확인한다
 */
export function isValidTodoStatus(value: unknown): value is TodoStatus {
  return value === 'idle' || value === 'in_progress' || value === 'completed'
}

/**
 * TodoItem 유효성 검증
 * 필수 필드(id, content, status)가 유효한지 확인한다
 */
export function isValidTodoItem(item: unknown): item is TodoItem {
  if (!item || typeof item !== 'object') return false
  const t = item as Partial<TodoItem>
  return (
    typeof t.id === 'string' &&
    t.id.length > 0 &&
    typeof t.content === 'string' &&
    t.content.length > 0 &&
    isValidTodoStatus(t.status)
  )
}

/**
 * Todoist API 응답 객체를 TodoItem으로 변환하는 팩토리 함수
 */
export function createTodoItem(apiTask: TodoistApiTask): TodoItem {
  return {
    id: apiTask.id,
    content: apiTask.content,
    description: apiTask.description ?? '',
    status: 'idle',
    due: apiTask.due
      ? {
          date: apiTask.due.date,
          datetime: apiTask.due.datetime,
          timezone: apiTask.due.timezone,
        }
      : null,
    priority: apiTask.priority,
    todoistUrl: apiTask.url ?? '',
  }
}
