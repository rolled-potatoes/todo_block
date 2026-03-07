// Background Service Worker 진입점
// 이벤트 리스너는 최상위 레벨에 등록해야 한다 (Service Worker 요구사항)

import { initStorage, getStorage } from '../shared/storage'
import { handleMessage } from './message-handler'
import { activateBlocking } from './blocking'
import type { AnyMessage } from '../shared/types/messages'

/**
 * 브라우저 재시작 또는 서비스 워커 활성화 시 차단 규칙을 복원한다
 * activeTaskId가 있으면 blockedSites로 DNR 규칙을 재등록한다
 */
async function restoreBlockingIfNeeded(): Promise<void> {
  const storage = await getStorage(['activeTaskId', 'blockedSites'])
  if (storage.activeTaskId && storage.blockedSites && storage.blockedSites.length > 0) {
    await activateBlocking(storage.blockedSites)
    console.log('차단 규칙 복원 완료:', storage.blockedSites.length, '개 사이트')
  }
}

// 설치 이벤트: Storage 기본값 초기화
chrome.runtime.onInstalled.addListener(() => {
  initStorage().then(() => {
    console.log('Todoist 집중 차단기 설치/업데이트 완료')
    return restoreBlockingIfNeeded()
  })
})

// 시작 이벤트: 브라우저 재시작 시 차단 규칙 복원
chrome.runtime.onStartup.addListener(() => {
  restoreBlockingIfNeeded().then(() => {
    console.log('브라우저 시작 — 차단 규칙 상태 확인 완료')
  })
})

// 메시지 수신 리스너
// sendResponse를 비동기로 호출하기 위해 true를 반환한다
chrome.runtime.onMessage.addListener((message: AnyMessage, _sender, sendResponse) => {
  handleMessage(message).then(sendResponse)
  return true // 비동기 응답 유지
})
