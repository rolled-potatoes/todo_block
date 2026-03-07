import { describe, it, expect, vi } from 'vitest'
import { getStorage, setStorage, removeStorage, initStorage } from './storage'
import type { StorageSchema } from './types/storage'

describe('getStorage', () => {
  it('저장된 값을 반환한다', async () => {
    // chrome.storage.local.get 모킹: apiToken 반환
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (result: Partial<StorageSchema>) => void) => {
        callback({ apiToken: 'test-token-123' })
      }
    )

    const result = await getStorage('apiToken')
    expect(result).toBe('test-token-123')
  })

  it('값이 없으면 undefined를 반환한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (result: Partial<StorageSchema>) => void) => {
        callback({})
      }
    )

    const result = await getStorage('apiToken')
    expect(result).toBeUndefined()
  })

  it('복수 키 조회가 동작한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (result: Partial<StorageSchema>) => void) => {
        callback({ apiToken: 'my-token', activeTaskId: '42' })
      }
    )

    const result = await getStorage(['apiToken', 'activeTaskId'])
    expect(result).toEqual({ apiToken: 'my-token', activeTaskId: '42' })
  })
})

describe('setStorage', () => {
  it('값을 저장하고 성공한다', async () => {
    chrome.storage.local.set = vi.fn().mockImplementation(
      (_items: unknown, callback?: () => void) => {
        callback?.()
      }
    )

    await expect(setStorage({ apiToken: 'new-token' })).resolves.toBeUndefined()
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      { apiToken: 'new-token' },
      expect.any(Function)
    )
  })
})

describe('removeStorage', () => {
  it('키를 삭제하고 성공한다', async () => {
    chrome.storage.local.remove = vi.fn().mockImplementation(
      (_keys: unknown, callback?: () => void) => {
        callback?.()
      }
    )

    await expect(removeStorage('apiToken')).resolves.toBeUndefined()
  })
})

describe('initStorage', () => {
  it('기본값으로 Storage를 초기화한다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (result: Partial<StorageSchema>) => void) => {
        // 아무것도 저장되지 않은 상태
        callback({})
      }
    )
    chrome.storage.local.set = vi.fn().mockImplementation(
      (_items: unknown, callback?: () => void) => {
        callback?.()
      }
    )

    await initStorage()

    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        apiToken: null,
        blockedSites: [],
        activeTaskId: null,
        nextRuleId: 1,
      }),
      expect.any(Function)
    )
  })

  it('이미 값이 있으면 덮어쓰지 않는다', async () => {
    chrome.storage.local.get = vi.fn().mockImplementation(
      (_keys: unknown, callback: (result: Partial<StorageSchema>) => void) => {
        // 이미 초기화된 상태
        callback({ apiToken: 'existing-token', blockedSites: [], activeTaskId: null, nextRuleId: 5 })
      }
    )
    const setSpy = vi.fn().mockImplementation(
      (_items: unknown, callback?: () => void) => { callback?.() }
    )
    chrome.storage.local.set = setSpy

    await initStorage()

    // set이 호출되지 않아야 함 (이미 초기화된 상태)
    expect(setSpy).not.toHaveBeenCalled()
  })
})
