/**
 * URL 또는 도메인 문자열에서 루트 도메인을 추출하는 유틸리티 함수
 *
 * 익스텐션 내부 URL, chrome://, about: 등의 특수 URL은 null을 반환한다.
 */

// 차단 불가 스킴 목록
const NON_BLOCKABLE_SCHEMES = ['chrome:', 'chrome-extension:', 'about:', 'edge:', 'brave:']

/**
 * URL에서 루트 도메인 추출
 *
 * 예시:
 * - https://www.youtube.com/watch → youtube.com
 * - https://mail.google.com → google.com
 * - http://localhost:3000 → localhost
 * - chrome://extensions → null
 */
export function extractDomain(url: string): string | null {
  if (!url || url.trim() === '') return null

  // 특수 스킴 처리
  for (const scheme of NON_BLOCKABLE_SCHEMES) {
    if (url.startsWith(scheme)) return null
  }

  let hostname: string

  try {
    // URL 파싱 시도
    const parsed = new URL(url.includes('://') ? url : `https://${url}`)
    hostname = parsed.hostname
  } catch {
    // URL 파싱 실패 시 도메인으로 간주
    hostname = url.split('/')[0].split('?')[0]
  }

  if (!hostname) return null

  // localhost 처리
  if (hostname === 'localhost') return 'localhost'

  // www. 및 서브도메인 제거하여 루트 도메인 추출
  // 예: mail.google.com → google.com
  const parts = hostname.split('.')
  if (parts.length <= 2) {
    // 이미 루트 도메인 (예: google.com, youtube.com)
    return hostname
  }

  // 마지막 2개 부분만 사용 (TLD+1)
  // 예: www.youtube.com → youtube.com
  //     mail.google.com → google.com
  return parts.slice(-2).join('.')
}
