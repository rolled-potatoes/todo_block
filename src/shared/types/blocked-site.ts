// 사용자가 등록한 차단 대상 웹사이트
export interface BlockedSite {
  id: number         // 차단 규칙 고유 ID (declarativeNetRequest 규칙 ID로 사용)
  domain: string     // 차단 대상 도메인 (예: youtube.com)
  addedAt: number    // 추가 시각 (Unix timestamp ms)
}

/**
 * 도메인 유효성 검증
 * - 프로토콜(https://) 불포함
 * - 경로(/) 불포함
 * - 공백 불포함
 * - 비어있지 않아야 함
 */
export function isValidDomain(domain: unknown): domain is string {
  if (typeof domain !== 'string' || domain.length === 0) return false
  // 프로토콜 포함 여부 검사
  if (domain.includes('://')) return false
  // 경로 포함 여부 검사
  if (domain.includes('/')) return false
  // 공백 포함 여부 검사
  if (domain.includes(' ')) return false
  // 최소 도메인 형식 검사 (점 포함 또는 localhost)
  return domain === 'localhost' || /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/.test(domain)
}

/**
 * BlockedSite 팩토리 함수
 */
export function createBlockedSite(domain: string, id: number): BlockedSite {
  return {
    id,
    domain,
    addedAt: Date.now(),
  }
}
