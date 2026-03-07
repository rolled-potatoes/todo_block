import type { BlockedSite } from './blocked-site'

// Chrome Storage 스키마
export interface StorageSchema {
  apiToken: string | null          // Todoist API 토큰 (null이면 미설정)
  blockedSites: BlockedSite[]      // 차단 사이트 목록
  activeTaskId: string | null      // 현재 "진행" 상태인 할일의 Todoist ID
  nextRuleId: number               // 다음 차단 규칙에 사용할 ID (자동 증가)
}

// Storage 기본값
export const DEFAULT_STORAGE: StorageSchema = {
  apiToken: null,
  blockedSites: [],
  activeTaskId: null,
  nextRuleId: 1,
}
