import { describe, it, expect, vi, beforeEach } from 'vitest'

// blocking 모듈 모킹
vi.mock('./blocking', () => ({
  activateBlocking: vi.fn().mockResolvedValue(undefined),
  deactivateBlocking: vi.fn().mockResolvedValue(undefined),
}))

// badge 모듈 모킹
vi.mock('./badge', () => ({
  showBadge: vi.fn().mockResolvedValue(undefined),
  clearBadge: vi.fn().mockResolvedValue(undefined),
  setActiveTaskTitle: vi.fn().mockResolvedValue(undefined),
  resetTitle: vi.fn().mockResolvedValue(undefined),
}))

// index.ts는 최상위 레벨에서 이벤트 리스너를 등록하므로
// 리스너 콜백을 직접 호출하는 방식으로 테스트한다
describe('Background Service Worker 초기화', () => {
  let onStartupCallback: (() => void) | null = null
  let onInstalledCallback: (() => void) | null = null

  beforeEach(async () => {
    vi.clearAllMocks()
    onStartupCallback = null
    onInstalledCallback = null

    // addListener를 가로채서 콜백을 저장
    chrome.runtime.onStartup.addListener = vi.fn().mockImplementation((cb: () => void) => {
      onStartupCallback = cb
    })
    chrome.runtime.onInstalled.addListener = vi.fn().mockImplementation((cb: () => void) => {
      onInstalledCallback = cb
    })
    chrome.storage.local.set = vi.fn().mockImplementation(
      (_items: unknown, callback?: () => void) => { callback?.() }
    )

    // index.ts를 동적으로 import하여 리스너 등록 트리거
    vi.resetModules()
    await import('./index')
  })

  describe('[US2] onStartup 시 배지 복원', () => {
    it('activeTaskId가 있으면 showBadge()를 호출한다', async () => {
      const { showBadge } = await import('./badge')

      chrome.storage.local.get = vi.fn().mockImplementation(
        (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
          callback({ activeTaskId: 'task-1', blockedSites: [], activeTaskTitle: null })
        }
      )

      await onStartupCallback?.()
      // Promise가 완료될 때까지 대기
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(showBadge).toHaveBeenCalled()
    })

    it('activeTaskId가 null이면 showBadge()를 호출하지 않는다', async () => {
      const { showBadge } = await import('./badge')

      chrome.storage.local.get = vi.fn().mockImplementation(
        (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
          callback({ activeTaskId: null, blockedSites: [], activeTaskTitle: null })
        }
      )

      await onStartupCallback?.()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(showBadge).not.toHaveBeenCalled()
    })

    it('[US3] activeTaskTitle이 있으면 setActiveTaskTitle()을 호출한다', async () => {
      const { setActiveTaskTitle } = await import('./badge')

      chrome.storage.local.get = vi.fn().mockImplementation(
        (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
          callback({ activeTaskId: 'task-1', blockedSites: [], activeTaskTitle: '보고서 작성' })
        }
      )

      await onStartupCallback?.()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(setActiveTaskTitle).toHaveBeenCalledWith('보고서 작성')
    })
  })

  describe('[US2] onInstalled 시 배지 복원', () => {
    it('activeTaskId가 있으면 showBadge()를 호출한다', async () => {
      const { showBadge } = await import('./badge')

      chrome.storage.local.get = vi.fn().mockImplementation(
        (_keys: unknown, callback: (r: Record<string, unknown>) => void) => {
          callback({ activeTaskId: 'task-1', blockedSites: [], activeTaskTitle: null })
        }
      )

      await onInstalledCallback?.()
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(showBadge).toHaveBeenCalled()
    })
  })
})
