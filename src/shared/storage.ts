import type { StorageSchema } from './types/storage'
import { DEFAULT_STORAGE } from './types/storage'

/**
 * 타입 안전한 chrome.storage.local 래퍼
 *
 * Chrome Storage API는 콜백 기반이므로 Promise로 감싸 async/await를 지원한다.
 */

/**
 * 단일 키 조회
 */
export function getStorage<K extends keyof StorageSchema>(
  key: K
): Promise<StorageSchema[K] | undefined>

/**
 * 복수 키 조회
 */
export function getStorage<K extends keyof StorageSchema>(
  keys: K[]
): Promise<Pick<StorageSchema, K>>

export function getStorage<K extends keyof StorageSchema>(
  keyOrKeys: K | K[]
): Promise<StorageSchema[K] | undefined | Pick<StorageSchema, K>> {
  return new Promise((resolve) => {
    chrome.storage.local.get(keyOrKeys as string | string[], (result) => {
      if (Array.isArray(keyOrKeys)) {
        resolve(result as Pick<StorageSchema, K>)
      } else {
        resolve((result as Partial<StorageSchema>)[keyOrKeys])
      }
    })
  })
}

/**
 * 값 저장
 */
export function setStorage(items: Partial<StorageSchema>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set(items as { [key: string]: unknown }, () => {
      resolve()
    })
  })
}

/**
 * 키 삭제
 */
export function removeStorage(key: keyof StorageSchema | (keyof StorageSchema)[]): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove(key as string | string[], () => {
      resolve()
    })
  })
}

/**
 * Storage 기본값 초기화
 * 이미 값이 있는 경우 덮어쓰지 않는다
 */
export async function initStorage(): Promise<void> {
  const existing = await getStorage([
    'apiToken',
    'blockedSites',
    'activeTaskId',
    'nextRuleId',
  ])

  // 모든 키가 이미 존재하면 초기화 불필요
  const hasAllKeys =
    'apiToken' in existing &&
    'blockedSites' in existing &&
    'activeTaskId' in existing &&
    'nextRuleId' in existing

  if (hasAllKeys) return

  // 누락된 키만 기본값으로 채운다
  const toInit: Partial<StorageSchema> = {}
  if (!('apiToken' in existing)) toInit.apiToken = DEFAULT_STORAGE.apiToken
  if (!('blockedSites' in existing)) toInit.blockedSites = DEFAULT_STORAGE.blockedSites
  if (!('activeTaskId' in existing)) toInit.activeTaskId = DEFAULT_STORAGE.activeTaskId
  if (!('nextRuleId' in existing)) toInit.nextRuleId = DEFAULT_STORAGE.nextRuleId

  if (Object.keys(toInit).length > 0) {
    await setStorage(toInit)
  }
}
