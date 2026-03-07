import { describe, it, expect, beforeEach } from 'vitest'
import { showBadge, clearBadge, setActiveTaskTitle, resetTitle } from './badge'

// badge.ts의 chrome.action 호출을 검증하는 단위 테스트
// setupTests.ts에서 chrome.action이 vi.fn()으로 모킹되어 있다

describe('showBadge()', () => {
  beforeEach(() => {
    // 각 테스트 전 mock 호출 기록 초기화 (setupTests.ts의 beforeEach에서 이미 clearAllMocks 호출됨)
  })

  it('chrome.action.setBadgeText를 { text: "ON" }으로 호출한다', async () => {
    await showBadge()

    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: 'ON' })
  })

  it('chrome.action.setBadgeBackgroundColor를 { color: "#4CAF50" }으로 호출한다', async () => {
    await showBadge()

    expect(chrome.action.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#4CAF50' })
  })
})

describe('clearBadge()', () => {
  it('chrome.action.setBadgeText를 { text: "" }으로 호출한다', async () => {
    await clearBadge()

    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({ text: '' })
  })
})

describe('setActiveTaskTitle()', () => {
  it('chrome.action.setTitle을 전달받은 제목으로 호출한다', async () => {
    await setActiveTaskTitle('보고서 작성')

    expect(chrome.action.setTitle).toHaveBeenCalledWith({ title: '보고서 작성' })
  })
})

describe('resetTitle()', () => {
  it('chrome.action.setTitle을 { title: "" }으로 호출한다 (manifest default_title 자동 복원)', async () => {
    await resetTitle()

    expect(chrome.action.setTitle).toHaveBeenCalledWith({ title: '' })
  })
})

// ─── T032: 멱등성 테스트 ────────────────────────────────────────────────────

describe('멱등성 (idempotency)', () => {
  it('showBadge()를 여러 번 호출해도 오류 없이 동작한다', async () => {
    await expect(showBadge()).resolves.toBeUndefined()
    await expect(showBadge()).resolves.toBeUndefined()
    await expect(showBadge()).resolves.toBeUndefined()
  })

  it('clearBadge()를 여러 번 호출해도 오류 없이 동작한다', async () => {
    await expect(clearBadge()).resolves.toBeUndefined()
    await expect(clearBadge()).resolves.toBeUndefined()
    await expect(clearBadge()).resolves.toBeUndefined()
  })
})
