# Data Model: 진행중 아이템 확장프로그램 아이콘 배지

**Feature**: 002-active-item-badge  
**Date**: 2026-03-07

## Storage Schema 변경

### 변경 전 (현재)

```typescript
interface StorageSchema {
  apiToken: string | null          // Todoist API 토큰
  blockedSites: BlockedSite[]      // 차단 사이트 목록
  activeTaskId: string | null      // 현재 진행중인 할일 ID
  nextRuleId: number               // 다음 차단 규칙 ID
}
```

### 변경 후

```typescript
interface StorageSchema {
  apiToken: string | null          // Todoist API 토큰
  blockedSites: BlockedSite[]      // 차단 사이트 목록
  activeTaskId: string | null      // 현재 진행중인 할일 ID
  activeTaskTitle: string | null   // [신규] 현재 진행중인 할일 제목 (툴팁 복원용)
  nextRuleId: number               // 다음 차단 규칙 ID
}
```

### 변경 사항

| 필드 | 타입 | 기본값 | 용도 |
|------|------|--------|------|
| `activeTaskTitle` (신규) | `string \| null` | `null` | 브라우저 재시작 시 확장프로그램 아이콘 툴팁에 진행중 작업명을 복원하기 위한 캐시 |

### 마이그레이션

- `initStorage()`가 기존 키를 보존하고 누락된 키만 기본값으로 채우므로 별도 마이그레이션 불필요
- 기존 사용자가 확장프로그램 업데이트 시 `activeTaskTitle`이 `null`로 초기화됨
- `activeTaskId`가 있지만 `activeTaskTitle`이 `null`인 경우: 배지는 표시하되 툴팁은 기본값 유지 (다음 FETCH_TODOS 시 자동 보정)

## 엔티티 관계

```
StorageSchema
  ├── activeTaskId ──────┐
  │                      ├── 배지 표시 여부 결정 (id !== null → 배지 ON)
  └── activeTaskTitle ───┘── 툴팁 텍스트 결정 (title ?? default_title)
```

## 상태 전이 다이어그램

```
[배지 없음] ──(in_progress 전환)──→ [배지 "ON" + 툴팁 "작업명"]
     ↑                                         │
     │                                         │
     ├──(completed 전환)───────────────────────┘
     ├──(idle 전환)────────────────────────────┘
     │
[브라우저 재시작]
     │
     ├── activeTaskId 있음 → [배지 "ON" + 툴팁 복원]
     └── activeTaskId 없음 → [배지 없음]
```

## 배지 시각 상태

| 상태 | 배지 텍스트 | 배지 배경색 | 툴팁 |
|------|------------|------------|------|
| 진행중 아이템 있음 | `"ON"` | `#4CAF50` (녹색) | 작업 제목 (예: "보고서 작성") |
| 진행중 아이템 없음 | `""` (빈 문자열 → 배지 제거) | N/A | `"Todoist 집중 차단기"` (manifest default_title) |

## 데이터 흐름

### 1. 상태 변경 시 (message-handler.ts)

```
UPDATE_TODO_STATUS (in_progress)
  → activateBlocking(blockedSites)
  → setStorage({ activeTaskId: taskId, activeTaskTitle: taskContent })
  → showBadge()
  → setActiveTaskTitle(taskContent)

UPDATE_TODO_STATUS (idle | completed)
  → deactivateBlocking()
  → setStorage({ activeTaskId: null, activeTaskTitle: null })
  → clearBadge()
  → resetTitle()
```

### 2. 복원 시 (index.ts)

```
onStartup / onInstalled
  → getStorage(['activeTaskId', 'activeTaskTitle', 'blockedSites'])
  → if activeTaskId:
      → activateBlocking(blockedSites)  // 기존
      → showBadge()                     // 신규
      → if activeTaskTitle:
          → setActiveTaskTitle(activeTaskTitle)  // 신규
```

### 유효성 규칙

- `activeTaskTitle`은 항상 `activeTaskId`와 동기화되어야 함
  - `activeTaskId`가 `null`이면 `activeTaskTitle`도 반드시 `null`
  - `activeTaskId`가 값이 있으면 `activeTaskTitle`도 값이 있어야 함 (다만 마이그레이션 기간 중 null 허용)
- `activeTaskTitle`의 최대 길이 제한 없음 (Todoist 작업 제목 그대로 저장)
