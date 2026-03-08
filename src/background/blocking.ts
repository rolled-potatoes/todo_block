import type { BlockedSite } from '../shared/types/blocked-site'

// 차단 시 리다이렉트할 페이지 경로 (CRXJS 빌드 시 src/ 하위 경로로 출력됨)
const BLOCKED_PAGE_PATH = '/src/pages/blocked/index.html'

/**
 * BlockedSite 배열을 DNR(declarativeNetRequest) redirect 규칙으로 변환하여 활성화한다
 * 기존 동적 규칙을 모두 교체한다
 */
export function activateBlocking(sites: BlockedSite[]): Promise<void> {
  const addRules: chrome.declarativeNetRequest.Rule[] = sites.map((site) => ({
    id: site.id,
    priority: 1,
    action: {
      type: 'redirect' as chrome.declarativeNetRequest.RuleActionType,
      redirect: {
        extensionPath: BLOCKED_PAGE_PATH,
      },
    },
    condition: {
      requestDomains: [site.domain],
      resourceTypes: [
        'main_frame' as chrome.declarativeNetRequest.ResourceType,
      ],
    },
  }))

  return new Promise((resolve) => {
    chrome.declarativeNetRequest.updateDynamicRules(
      { removeRuleIds: sites.map((s) => s.id), addRules },
      () => resolve()
    )
  })
}

/**
 * 모든 동적 DNR 규칙을 제거하여 차단을 해제한다
 */
export function deactivateBlocking(): Promise<void> {
  return new Promise((resolve) => {
    chrome.declarativeNetRequest.getDynamicRules((existingRules) => {
      const removeRuleIds = existingRules.map((r) => r.id)
      chrome.declarativeNetRequest.updateDynamicRules(
        { removeRuleIds, addRules: [] },
        () => resolve()
      )
    })
  })
}
