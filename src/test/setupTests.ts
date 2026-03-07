import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Chrome API 글로벌 모킹
// Chrome Extension API는 브라우저 런타임에서만 사용 가능하므로
// Vitest(jsdom) 환경에서 테스트 실행을 위해 vi.fn()으로 모킹한다

const chromeMock = {
  action: {
    setBadgeText: vi.fn().mockResolvedValue(undefined),
    setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
    setTitle: vi.fn().mockResolvedValue(undefined),
  },
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
    onStartup: {
      addListener: vi.fn(),
    },
    lastError: null as chrome.runtime.LastError | null,
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    get: vi.fn(),
  },
  declarativeNetRequest: {
    updateDynamicRules: vi.fn(),
    getDynamicRules: vi.fn(),
    MAX_NUMBER_OF_DYNAMIC_AND_SESSION_RULES: 30000,
  },
}

// global.chrome에 모킹 객체 주입
Object.defineProperty(global, 'chrome', {
  value: chromeMock,
  writable: true,
})

// 각 테스트 전 모킹 초기화
beforeEach(() => {
  vi.clearAllMocks()

  // chrome.storage.local.get 기본 동작: 빈 객체 반환
  chromeMock.storage.local.get.mockImplementation(
    (_keys: unknown, callback: (result: Record<string, unknown>) => void) => {
      callback({})
    }
  )

  // chrome.storage.local.set 기본 동작: 성공 콜백 호출
  chromeMock.storage.local.set.mockImplementation(
    (_items: unknown, callback?: () => void) => {
      callback?.()
    }
  )

  // chrome.declarativeNetRequest.updateDynamicRules 기본 동작: 성공 콜백 호출
  chromeMock.declarativeNetRequest.updateDynamicRules.mockImplementation(
    (_options: unknown, callback?: () => void) => {
      callback?.()
    }
  )

  // chrome.tabs.query 기본 동작: 빈 탭 배열 반환
  chromeMock.tabs.query.mockImplementation(
    (_queryInfo: unknown, callback: (tabs: chrome.tabs.Tab[]) => void) => {
      callback([])
    }
  )
})
