import { describe, it, expect, vi } from 'vitest'
import { activateBlocking, deactivateBlocking } from './blocking'
import type { BlockedSite } from '../shared/types/blocked-site'

describe('activateBlocking', () => {
  it('차단 사이트 목록으로 DNR 규칙을 활성화한다', async () => {
    const sites: BlockedSite[] = [
      { id: 1, domain: 'youtube.com', addedAt: 0 },
      { id: 2, domain: 'twitter.com', addedAt: 0 },
    ]

    await activateBlocking(sites)

    expect(chrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledOnce()

    const callArg = (chrome.declarativeNetRequest.updateDynamicRules as ReturnType<typeof vi.fn>)
      .mock.calls[0][0]

    // 기존 규칙 제거: 전달된 사이트 ID 목록
    expect(callArg.removeRuleIds).toEqual([1, 2])

    // 새 규칙 추가: 각 사이트당 1개 규칙
    expect(callArg.addRules).toHaveLength(2)

    const rule1 = callArg.addRules[0]
    expect(rule1.id).toBe(1)
    expect(rule1.action.type).toBe('redirect')
    expect(rule1.condition.requestDomains).toContain('youtube.com')
  })

  it('차단 사이트가 없으면 빈 규칙으로 호출한다', async () => {
    await activateBlocking([])

    expect(chrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith(
      { removeRuleIds: [], addRules: [] },
      expect.any(Function)
    )
  })

  it('redirect URL은 blocked 페이지를 가리킨다', async () => {
    const sites: BlockedSite[] = [{ id: 1, domain: 'youtube.com', addedAt: 0 }]

    await activateBlocking(sites)

    const callArg = (chrome.declarativeNetRequest.updateDynamicRules as ReturnType<typeof vi.fn>)
      .mock.calls[0][0]

    const redirectUrl: string = callArg.addRules[0].action.redirect.extensionPath
    expect(redirectUrl).toContain('blocked')
  })
})

describe('deactivateBlocking', () => {
  it('모든 동적 DNR 규칙을 제거한다', async () => {
    const existingRules = [
      { id: 1 } as chrome.declarativeNetRequest.Rule,
      { id: 2 } as chrome.declarativeNetRequest.Rule,
    ]

    const getDynamicRulesMock = chrome.declarativeNetRequest.getDynamicRules as ReturnType<typeof vi.fn>
    getDynamicRulesMock.mockImplementation(
      (callback: (rules: chrome.declarativeNetRequest.Rule[]) => void) => {
        callback(existingRules)
      }
    )

    await deactivateBlocking()

    const callArg = (chrome.declarativeNetRequest.updateDynamicRules as ReturnType<typeof vi.fn>)
      .mock.calls[0][0]

    expect(callArg.removeRuleIds).toEqual([1, 2])
    expect(callArg.addRules).toEqual([])
  })

  it('규칙이 없으면 빈 배열로 제거를 호출한다', async () => {
    const getDynamicRulesMock = chrome.declarativeNetRequest.getDynamicRules as ReturnType<typeof vi.fn>
    getDynamicRulesMock.mockImplementation(
      (callback: (rules: chrome.declarativeNetRequest.Rule[]) => void) => {
        callback([])
      }
    )

    await deactivateBlocking()

    const callArg = (chrome.declarativeNetRequest.updateDynamicRules as ReturnType<typeof vi.fn>)
      .mock.calls[0][0]

    expect(callArg.removeRuleIds).toEqual([])
  })
})
