import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleMessage } from './message-handler'
import type { TodoItem } from '../shared/types/todo'

// blocking 모듈 모킹 (DNR 호출을 격리)
vi.mock('./blocking', () => ({
  activateBlocking: vi.fn().mockResolvedValue(undefined),
  deactivateBlocking: vi.fn().mockResolvedValue(undefined),
}))

// fetch 모킹
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('FETCH_TODOS 메시지 핸들러', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.clearAllMocks()
  })

  it('apiToken이 없으면 INVALID_TOKEN을 반환한다', async () => {
    // Storage에 토큰 없음
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({})
      }
    )

    const response = await handleMessage({ type: 'FETCH_TODOS' })

    expect(response.success).toBe(false)
    expect(response.error).toBe('INVALID_TOKEN')
  })

  it('apiToken이 있으면 Todoist API를 호출하고 TodoItem[]을 반환한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({ apiToken: 'my-token', activeTaskId: null })
      }
    )
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          results: [
            {
              id: '1',
              content: '할일1',
              description: '',
              checked: false,
              due: null,
              priority: 1,
              url: '',
            },
          ],
          next_cursor: null,
        }),
    })

    const response = await handleMessage({ type: 'FETCH_TODOS' })

    expect(response.success).toBe(true)
    const todos = response.data as TodoItem[]
    expect(todos).toHaveLength(1)
    expect(todos[0].content).toBe('할일1')
    expect(todos[0].status).toBe('idle')
  })

  it('activeTaskId가 Storage에 있으면 해당 할일의 status를 in_progress로 복원한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({ apiToken: 'my-token', activeTaskId: 'task-1' })
      }
    )
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          results: [
            { id: 'task-1', content: '진행 중 할일', description: '', checked: false, due: null, priority: 1, url: '' },
            { id: 'task-2', content: '대기 할일', description: '', checked: false, due: null, priority: 1, url: '' },
          ],
          next_cursor: null,
        }),
    })

    const response = await handleMessage({ type: 'FETCH_TODOS' })

    expect(response.success).toBe(true)
    const todos = response.data as TodoItem[]
    expect(todos.find((t) => t.id === 'task-1')?.status).toBe('in_progress')
    expect(todos.find((t) => t.id === 'task-2')?.status).toBe('idle')
  })
})

describe('SAVE_API_TOKEN 메시지 핸들러', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.clearAllMocks()
  })

  it('토큰을 즉시 Storage에 저장하고 성공을 반환한다', async () => {
    chrome.storage.local.set = vi.fn().mockImplementation(
      (_items: unknown, callback?: () => void) => { callback?.() }
    )

    const response = await handleMessage({
      type: 'SAVE_API_TOKEN',
      payload: { token: 'some-token' },
    })

    expect(response.success).toBe(true)
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ apiToken: 'some-token' }),
      expect.any(Function)
    )
    // 네트워크 요청 없이 바로 저장
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe('UPDATE_TODO_STATUS 메시지 핸들러', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    vi.clearAllMocks()
  })

  it('idle → in_progress 전환 시 차단을 활성화하고 activeTaskId를 저장한다', async () => {
    const { activateBlocking } = await import('./blocking')

    // Storage: 토큰 있음, 차단 사이트 있음, 현재 활성 태스크 없음
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({
          apiToken: 'my-token',
          blockedSites: [{ id: 1, domain: 'youtube.com', addedAt: 0 }],
          activeTaskId: null,
        })
      }
    )

    const response = await handleMessage({
      type: 'UPDATE_TODO_STATUS',
      payload: { taskId: 'task-1', newStatus: 'in_progress' },
    })

    expect(response.success).toBe(true)
    expect(activateBlocking).toHaveBeenCalled()
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ activeTaskId: 'task-1' }),
      expect.any(Function)
    )
  })

  it('in_progress → idle 전환 시 차단을 해제하고 activeTaskId를 null로 초기화한다', async () => {
    const { deactivateBlocking } = await import('./blocking')

    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({
          apiToken: 'my-token',
          blockedSites: [{ id: 1, domain: 'youtube.com', addedAt: 0 }],
          activeTaskId: 'task-1',
        })
      }
    )

    const response = await handleMessage({
      type: 'UPDATE_TODO_STATUS',
      payload: { taskId: 'task-1', newStatus: 'idle' },
    })

    expect(response.success).toBe(true)
    expect(deactivateBlocking).toHaveBeenCalled()
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ activeTaskId: null }),
      expect.any(Function)
    )
  })

  it('completed 전환 시 Todoist close API를 호출하고 차단을 해제한다', async () => {
    const { deactivateBlocking } = await import('./blocking')

    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({
          apiToken: 'my-token',
          blockedSites: [],
          activeTaskId: 'task-1',
        })
      }
    )
    // Todoist close API 응답
    mockFetch.mockResolvedValueOnce({ ok: true, status: 204 })

    const response = await handleMessage({
      type: 'UPDATE_TODO_STATUS',
      payload: { taskId: 'task-1', newStatus: 'completed' },
    })

    expect(response.success).toBe(true)
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('task-1/close'),
      expect.any(Object)
    )
    expect(deactivateBlocking).toHaveBeenCalled()
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ activeTaskId: null }),
      expect.any(Function)
    )
  })

  it('이미 다른 할일이 진행 중일 때 in_progress 전환 시 기존 할일은 idle로 자동 전환된다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({
          apiToken: 'my-token',
          blockedSites: [],
          activeTaskId: 'task-already', // 기존 진행 중 할일
        })
      }
    )

    const response = await handleMessage({
      type: 'UPDATE_TODO_STATUS',
      payload: { taskId: 'task-new', newStatus: 'in_progress' },
    })

    expect(response.success).toBe(true)
    const data = response.data as { previousActiveTask: { id: string } | null }
    expect(data.previousActiveTask?.id).toBe('task-already')
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({ activeTaskId: 'task-new' }),
      expect.any(Function)
    )
  })
})

// ─── US3: 차단 사이트 목록 관리 ─────────────────────────────────────────────

describe('ADD_BLOCKED_SITE 메시지 핸들러', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('유효한 도메인을 Storage에 추가하고 성공을 반환한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({ blockedSites: [], nextRuleId: 1, activeTaskId: null })
      }
    )

    const response = await handleMessage({
      type: 'ADD_BLOCKED_SITE',
      payload: { domain: 'youtube.com' },
    })

    expect(response.success).toBe(true)
    const data = response.data as { site: { domain: string }; totalBlocked: number }
    expect(data.site.domain).toBe('youtube.com')
    expect(data.totalBlocked).toBe(1)
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        blockedSites: expect.arrayContaining([
          expect.objectContaining({ domain: 'youtube.com', id: 1 }),
        ]),
        nextRuleId: 2,
      }),
      expect.any(Function)
    )
  })

  it('이미 등록된 도메인이면 DUPLICATE_DOMAIN 오류를 반환한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({
          blockedSites: [{ id: 1, domain: 'youtube.com', addedAt: 0 }],
          nextRuleId: 2,
          activeTaskId: null,
        })
      }
    )

    const response = await handleMessage({
      type: 'ADD_BLOCKED_SITE',
      payload: { domain: 'youtube.com' },
    })

    expect(response.success).toBe(false)
    expect(response.error).toBe('DUPLICATE_DOMAIN')
  })

  it('유효하지 않은 도메인이면 INVALID_DOMAIN 오류를 반환한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({ blockedSites: [], nextRuleId: 1, activeTaskId: null })
      }
    )

    const response = await handleMessage({
      type: 'ADD_BLOCKED_SITE',
      payload: { domain: 'https://youtube.com/watch' },
    })

    expect(response.success).toBe(false)
    expect(response.error).toBe('INVALID_DOMAIN')
  })

  it('진행 중인 할일이 있을 때 추가 시 DNR 규칙을 즉시 갱신한다', async () => {
    const { activateBlocking } = await import('./blocking')

    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({
          blockedSites: [{ id: 1, domain: 'twitter.com', addedAt: 0 }],
          nextRuleId: 2,
          activeTaskId: 'task-1', // 진행 중 할일 있음
        })
      }
    )

    const response = await handleMessage({
      type: 'ADD_BLOCKED_SITE',
      payload: { domain: 'youtube.com' },
    })

    expect(response.success).toBe(true)
    expect(activateBlocking).toHaveBeenCalled()
  })
})

describe('REMOVE_BLOCKED_SITE 메시지 핸들러', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('존재하는 사이트를 제거하고 성공을 반환한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({
          blockedSites: [
            { id: 1, domain: 'youtube.com', addedAt: 0 },
            { id: 2, domain: 'twitter.com', addedAt: 0 },
          ],
          activeTaskId: null,
        })
      }
    )

    const response = await handleMessage({
      type: 'REMOVE_BLOCKED_SITE',
      payload: { siteId: 1 },
    })

    expect(response.success).toBe(true)
    const data = response.data as { removedDomain: string; totalBlocked: number }
    expect(data.removedDomain).toBe('youtube.com')
    expect(data.totalBlocked).toBe(1)
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        blockedSites: [{ id: 2, domain: 'twitter.com', addedAt: 0 }],
      }),
      expect.any(Function)
    )
  })

  it('존재하지 않는 siteId이면 SITE_NOT_FOUND 오류를 반환한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({ blockedSites: [], activeTaskId: null })
      }
    )

    const response = await handleMessage({
      type: 'REMOVE_BLOCKED_SITE',
      payload: { siteId: 99 },
    })

    expect(response.success).toBe(false)
    expect(response.error).toBe('SITE_NOT_FOUND')
  })

  it('진행 중인 할일이 있을 때 제거 시 DNR 규칙을 즉시 갱신한다', async () => {
    const { activateBlocking } = await import('./blocking')

    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({
          blockedSites: [
            { id: 1, domain: 'youtube.com', addedAt: 0 },
            { id: 2, domain: 'twitter.com', addedAt: 0 },
          ],
          activeTaskId: 'task-1',
        })
      }
    )

    await handleMessage({ type: 'REMOVE_BLOCKED_SITE', payload: { siteId: 1 } })

    // 남은 사이트로 재활성화
    expect(activateBlocking).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ domain: 'twitter.com' })])
    )
  })
})

describe('GET_BLOCKED_SITES 메시지 핸들러', () => {
  it('Storage의 차단 사이트 목록을 반환한다', async () => {
    const sites = [
      { id: 1, domain: 'youtube.com', addedAt: 0 },
      { id: 2, domain: 'twitter.com', addedAt: 0 },
    ]
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({ blockedSites: sites })
      }
    )

    const response = await handleMessage({ type: 'GET_BLOCKED_SITES' })

    expect(response.success).toBe(true)
    expect(response.data).toEqual(sites)
  })

  it('차단 사이트가 없으면 빈 배열을 반환한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({ blockedSites: [] })
      }
    )

    const response = await handleMessage({ type: 'GET_BLOCKED_SITES' })

    expect(response.success).toBe(true)
    expect(response.data).toEqual([])
  })
})

describe('GET_CURRENT_TAB_DOMAIN 메시지 핸들러', () => {
  it('현재 활성 탭의 도메인을 반환한다', async () => {
    chrome.tabs.query = vi.fn().mockImplementation(
      (_queryInfo: unknown, callback: (tabs: chrome.tabs.Tab[]) => void) => {
        callback([{ id: 1, url: 'https://youtube.com/watch?v=test' } as chrome.tabs.Tab])
      }
    )
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({ blockedSites: [] })
      }
    )

    const response = await handleMessage({ type: 'GET_CURRENT_TAB_DOMAIN' })

    expect(response.success).toBe(true)
    const data = response.data as { domain: string | null; isAlreadyBlocked: boolean }
    expect(data.domain).toBe('youtube.com')
    expect(data.isAlreadyBlocked).toBe(false)
  })

  it('이미 차단된 도메인이면 isAlreadyBlocked가 true이다', async () => {
    chrome.tabs.query = vi.fn().mockImplementation(
      (_queryInfo: unknown, callback: (tabs: chrome.tabs.Tab[]) => void) => {
        callback([{ id: 1, url: 'https://youtube.com/watch?v=test' } as chrome.tabs.Tab])
      }
    )
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({ blockedSites: [{ id: 1, domain: 'youtube.com', addedAt: 0 }] })
      }
    )

    const response = await handleMessage({ type: 'GET_CURRENT_TAB_DOMAIN' })

    expect(response.success).toBe(true)
    const data = response.data as { domain: string | null; isAlreadyBlocked: boolean }
    expect(data.isAlreadyBlocked).toBe(true)
  })

  it('활성 탭이 없으면 domain이 null이다', async () => {
    chrome.tabs.query = vi.fn().mockImplementation(
      (_queryInfo: unknown, callback: (tabs: chrome.tabs.Tab[]) => void) => {
        callback([])
      }
    )
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
        callback({ blockedSites: [] })
      }
    )

    const response = await handleMessage({ type: 'GET_CURRENT_TAB_DOMAIN' })

    expect(response.success).toBe(true)
    const data = response.data as { domain: string | null; isAlreadyBlocked: boolean }
    expect(data.domain).toBeNull()
  })
})
