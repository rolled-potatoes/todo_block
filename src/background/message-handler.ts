import { getStorage, setStorage } from '../shared/storage'
import { fetchTodayTasks, closeTask } from './todoist'
import { activateBlocking, deactivateBlocking } from './blocking'
import { isValidDomain, createBlockedSite } from '../shared/types/blocked-site'
import { extractDomain } from '../shared/utils'
import type { AnyMessage, MessageResponse } from '../shared/types/messages'
import type { TodoItem } from '../shared/types/todo'
import type { BlockedSite } from '../shared/types/blocked-site'

/**
 * Background Service Worker 메시지 핸들러
 *
 * Popup에서 오는 모든 메시지를 수신하고 적절한 처리를 수행한다.
 * Constitution 원칙 I: Background는 서비스 레이어로, UI 로직을 포함하지 않는다.
 */
export async function handleMessage(message: AnyMessage): Promise<MessageResponse<unknown>> {
  switch (message.type) {
    case 'FETCH_TODOS':
      return handleFetchTodos()

    case 'SAVE_API_TOKEN':
      return handleSaveApiToken(message.payload!.token)

    case 'UPDATE_TODO_STATUS':
      return handleUpdateTodoStatus(message.payload!.taskId, message.payload!.newStatus)

    case 'ADD_BLOCKED_SITE':
      return handleAddBlockedSite(message.payload!.domain)

    case 'REMOVE_BLOCKED_SITE':
      return handleRemoveBlockedSite(message.payload!.siteId)

    case 'GET_BLOCKED_SITES':
      return handleGetBlockedSites()

    case 'GET_CURRENT_TAB_DOMAIN':
      return handleGetCurrentTabDomain()

    default:
      return { success: false, error: 'UNKNOWN_MESSAGE_TYPE' }
  }
}

/**
 * FETCH_TODOS 처리
 * Storage에서 API 토큰을 가져와 Todoist API를 호출한다.
 * 응답 후 Storage의 activeTaskId를 반영하여 진행 중 상태를 복원한다.
 */
async function handleFetchTodos(): Promise<MessageResponse<unknown>> {
  const storage = await getStorage(['apiToken', 'activeTaskId'])
  const { apiToken, activeTaskId } = storage

  if (!apiToken) {
    return { success: false, error: 'INVALID_TOKEN' }
  }

  const result = await fetchTodayTasks(apiToken)

  if (!result.success || !result.data) {
    return result
  }

  // Storage에 저장된 activeTaskId가 있으면 해당 할일의 status를 in_progress로 복원
  if (activeTaskId) {
    result.data = result.data.map((todo) =>
      todo.id === activeTaskId ? { ...todo, status: 'in_progress' } : todo
    )
  }

  return result
}

/**
 * SAVE_API_TOKEN 처리
 * 토큰을 즉시 Storage에 저장한다.
 * 유효성 검증은 FETCH_TODOS 시점에 수행한다.
 * (팝업 창 닫힘 등 비동기 응답 유실 문제 방지)
 */
async function handleSaveApiToken(token: string): Promise<MessageResponse<unknown>> {
  await setStorage({ apiToken: token })
  return { success: true }
}

/**
 * UPDATE_TODO_STATUS 처리
 * 할일 상태 전환 시 차단 활성화/비활성화를 연동한다
 *
 * - idle → in_progress: 차단 활성화, activeTaskId 저장
 * - in_progress → idle: 차단 비활성화, activeTaskId null로 초기화
 * - any → completed: Todoist close API 호출, 차단 비활성화
 * - 동시 진행 1개 제한: 기존 활성 할일은 자동으로 idle로 전환
 */
async function handleUpdateTodoStatus(
  taskId: string,
  newStatus: string
): Promise<MessageResponse<unknown>> {
  const storage = await getStorage(['apiToken', 'blockedSites', 'activeTaskId'])
  const { apiToken, blockedSites = [], activeTaskId } = storage

  const previousActiveTask: Pick<TodoItem, 'id'> | null =
    activeTaskId && activeTaskId !== taskId ? { id: activeTaskId } : null

  if (newStatus === 'in_progress') {
    // 차단 활성화 후 activeTaskId 갱신
    await activateBlocking(blockedSites)
    await setStorage({ activeTaskId: taskId })

    return {
      success: true,
      data: {
        updatedTask: { id: taskId, status: 'in_progress' },
        previousActiveTask,
        blockingActive: blockedSites.length > 0,
      },
    }
  }

  if (newStatus === 'completed') {
    // Todoist close API 호출
    if (apiToken) {
      await closeTask(apiToken, taskId)
    }
    await deactivateBlocking()
    await setStorage({ activeTaskId: null })

    return {
      success: true,
      data: {
        updatedTask: { id: taskId, status: 'completed' },
        previousActiveTask: null,
        blockingActive: false,
      },
    }
  }

  // idle (중단)
  await deactivateBlocking()
  await setStorage({ activeTaskId: null })

  return {
    success: true,
    data: {
      updatedTask: { id: taskId, status: 'idle' },
      previousActiveTask: null,
      blockingActive: false,
    },
  }
}

/**
 * ADD_BLOCKED_SITE 처리
 * 도메인 유효성 검사 후 Storage에 추가한다.
 * 진행 중인 할일이 있으면 DNR 규칙을 즉시 갱신한다.
 */
async function handleAddBlockedSite(domain: string): Promise<MessageResponse<unknown>> {
  if (!isValidDomain(domain)) {
    return { success: false, error: 'INVALID_DOMAIN' }
  }

  const storage = await getStorage(['blockedSites', 'nextRuleId', 'activeTaskId'])
  const blockedSites: BlockedSite[] = storage.blockedSites ?? []
  const nextRuleId: number = storage.nextRuleId ?? 1
  const activeTaskId: string | null = storage.activeTaskId ?? null

  // 중복 도메인 검사
  if (blockedSites.some((s) => s.domain === domain)) {
    return { success: false, error: 'DUPLICATE_DOMAIN' }
  }

  const newSite = createBlockedSite(domain, nextRuleId)
  const updatedSites = [...blockedSites, newSite]

  await setStorage({ blockedSites: updatedSites, nextRuleId: nextRuleId + 1 })

  // 진행 중인 할일이 있으면 DNR 규칙 즉시 갱신
  if (activeTaskId) {
    await activateBlocking(updatedSites)
  }

  return {
    success: true,
    data: { site: newSite, totalBlocked: updatedSites.length },
  }
}

/**
 * REMOVE_BLOCKED_SITE 처리
 * siteId로 사이트를 찾아 Storage에서 제거한다.
 * 진행 중인 할일이 있으면 DNR 규칙을 즉시 갱신한다.
 */
async function handleRemoveBlockedSite(siteId: number): Promise<MessageResponse<unknown>> {
  const storage = await getStorage(['blockedSites', 'activeTaskId'])
  const blockedSites: BlockedSite[] = storage.blockedSites ?? []
  const activeTaskId: string | null = storage.activeTaskId ?? null

  const target = blockedSites.find((s) => s.id === siteId)
  if (!target) {
    return { success: false, error: 'SITE_NOT_FOUND' }
  }

  const updatedSites = blockedSites.filter((s) => s.id !== siteId)
  await setStorage({ blockedSites: updatedSites })

  // 진행 중인 할일이 있으면 DNR 규칙 즉시 갱신
  if (activeTaskId) {
    await activateBlocking(updatedSites)
  }

  return {
    success: true,
    data: { removedDomain: target.domain, totalBlocked: updatedSites.length },
  }
}

/**
 * GET_BLOCKED_SITES 처리
 * Storage의 차단 사이트 목록을 반환한다.
 */
async function handleGetBlockedSites(): Promise<MessageResponse<unknown>> {
  const blockedSites = await getStorage('blockedSites')
  return { success: true, data: blockedSites ?? [] }
}

/**
 * GET_CURRENT_TAB_DOMAIN 처리
 * 현재 활성 탭의 URL에서 도메인을 추출하고, 이미 차단된 도메인인지 확인한다.
 */
async function handleGetCurrentTabDomain(): Promise<MessageResponse<unknown>> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0]
      const domain = tab?.url ? extractDomain(tab.url) : null

      const blockedSites: BlockedSite[] = (await getStorage('blockedSites')) ?? []
      const isAlreadyBlocked = domain ? blockedSites.some((s) => s.domain === domain) : false

      resolve({ success: true, data: { domain, isAlreadyBlocked } })
    })
  })
}
