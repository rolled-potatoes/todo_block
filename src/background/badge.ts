// 배지 관련 Chrome Extension API 래퍼 모듈
// Constitution 원칙: Background 서비스 레이어에만 배지 로직을 둔다

/**
 * 확장프로그램 아이콘에 "ON" 배지를 표시한다
 * - 배지 텍스트: "ON"
 * - 배지 배경색: #4CAF50 (녹색)
 */
export async function showBadge(): Promise<void> {
  await chrome.action.setBadgeText({ text: 'ON' })
  await chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' })
}

/**
 * 확장프로그램 아이콘의 배지를 제거한다
 */
export async function clearBadge(): Promise<void> {
  await chrome.action.setBadgeText({ text: '' })
}

/**
 * 확장프로그램 아이콘 툴팁(title)을 진행 중인 작업 제목으로 설정한다
 * @param taskTitle - 진행 중인 할일의 제목
 */
export async function setActiveTaskTitle(taskTitle: string): Promise<void> {
  await chrome.action.setTitle({ title: taskTitle })
}

/**
 * 확장프로그램 아이콘 툴팁(title)을 기본값으로 복원한다
 * title을 빈 문자열로 설정하면 manifest의 default_title이 자동으로 복원된다
 */
export async function resetTitle(): Promise<void> {
  await chrome.action.setTitle({ title: '' })
}
