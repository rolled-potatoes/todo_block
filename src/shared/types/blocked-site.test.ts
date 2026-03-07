import { describe, it, expect } from 'vitest'
import { isValidDomain, createBlockedSite } from './blocked-site'
import type { BlockedSite } from './blocked-site'

describe('isValidDomain 도메인 유효성 검증', () => {
  it('유효한 도메인을 통과시킨다', () => {
    expect(isValidDomain('youtube.com')).toBe(true)
    expect(isValidDomain('twitter.com')).toBe(true)
    expect(isValidDomain('mail.google.com')).toBe(true)
    expect(isValidDomain('example.co.kr')).toBe(true)
  })

  it('프로토콜이 포함된 URL을 거부한다', () => {
    expect(isValidDomain('https://youtube.com')).toBe(false)
    expect(isValidDomain('http://youtube.com')).toBe(false)
  })

  it('경로가 포함된 URL을 거부한다', () => {
    expect(isValidDomain('youtube.com/watch')).toBe(false)
  })

  it('빈 문자열을 거부한다', () => {
    expect(isValidDomain('')).toBe(false)
  })

  it('공백이 포함된 도메인을 거부한다', () => {
    expect(isValidDomain('you tube.com')).toBe(false)
  })
})

describe('createBlockedSite 팩토리 함수', () => {
  it('도메인과 ID로 BlockedSite를 생성한다', () => {
    const site: BlockedSite = createBlockedSite('youtube.com', 1)

    expect(site.domain).toBe('youtube.com')
    expect(site.id).toBe(1)
    expect(typeof site.addedAt).toBe('number')
    expect(site.addedAt).toBeGreaterThan(0)
  })

  it('addedAt은 현재 시각 근처여야 한다', () => {
    const before = Date.now()
    const site = createBlockedSite('example.com', 2)
    const after = Date.now()

    expect(site.addedAt).toBeGreaterThanOrEqual(before)
    expect(site.addedAt).toBeLessThanOrEqual(after)
  })
})
