import { describe, it, expect } from 'vitest'
import { extractDomain } from './utils'

describe('extractDomain URL에서 도메인 추출', () => {
  it('https URL에서 도메인을 추출한다', () => {
    expect(extractDomain('https://www.youtube.com/watch?v=123')).toBe('youtube.com')
  })

  it('http URL에서 도메인을 추출한다', () => {
    expect(extractDomain('http://twitter.com/user')).toBe('twitter.com')
  })

  it('서브도메인을 포함한 URL에서 루트 도메인을 추출한다', () => {
    expect(extractDomain('https://mail.google.com/mail')).toBe('google.com')
    expect(extractDomain('https://www.naver.com')).toBe('naver.com')
    expect(extractDomain('https://m.youtube.com')).toBe('youtube.com')
  })

  it('이미 도메인 형식인 경우 그대로 반환한다', () => {
    expect(extractDomain('youtube.com')).toBe('youtube.com')
  })

  it('localhost를 처리한다', () => {
    expect(extractDomain('http://localhost:3000')).toBe('localhost')
  })

  it('빈 문자열이면 null을 반환한다', () => {
    expect(extractDomain('')).toBeNull()
  })

  it('chrome:// URL이면 null을 반환한다', () => {
    expect(extractDomain('chrome://extensions')).toBeNull()
  })

  it('chrome-extension:// URL이면 null을 반환한다', () => {
    expect(extractDomain('chrome-extension://abcdef/popup.html')).toBeNull()
  })

  it('about: URL이면 null을 반환한다', () => {
    expect(extractDomain('about:blank')).toBeNull()
  })

  it('서브도메인 2단계만 있는 경우를 처리한다', () => {
    // example.co.kr 같은 경우 — 기본 TLD+1 추출
    expect(extractDomain('https://blog.example.com')).toBe('example.com')
  })
})
