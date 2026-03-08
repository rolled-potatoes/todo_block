# Data Model: 집중 차단 화면 (003-focus-block-screen)

**Branch**: `003-focus-block-screen`  
**Date**: 2026-03-07  
**Phase**: 1 — Design & Contracts

---

## 개요

이 기능은 새로운 엔티티를 추가하지 않는다. 기존 `StorageSchema`의 `activeTaskTitle` 필드를 활용하여 차단 화면에 진행 중인 할일 제목을 표시한다. 데이터 모델 변경은 없으며 읽기 접근 패턴만 추가된다.

---

## 기존 엔티티 (변경 없음)

### StorageSchema (기존, `src/shared/types/storage.ts`)

```
StorageSchema
├── apiToken: string | null          — Todoist API 토큰
├── blockedSites: BlockedSite[]      — 차단 사이트 목록
├── activeTaskId: string | null      — 현재 진행 중인 할일의 ID
├── activeTaskTitle: string | null   — 현재 진행 중인 할일의 제목 ← 이 기능에서 읽기 사용
└── nextRuleId: number               — 다음 차단 규칙 ID
```

**이 기능의 관심 필드**: `activeTaskTitle`

- **타입**: `string | null`
- **관리 주체**: Background 서비스 레이어 (`message-handler.ts`)
  - `in_progress` 전환 시 설정: `setStorage({ activeTaskTitle: taskContent ?? null })`
  - `idle` / `completed` 전환 시 초기화: `setStorage({ activeTaskTitle: null })`
- **읽기 주체 (신규)**: 차단 페이지 (`BlockedPage.tsx`)
- **유효성 규칙**:
  - `null`: 진행 중인 할일 없음 또는 제목 미전달 → 기본 집중 메시지만 표시
  - `string (비어있지 않음)`: 진행 중인 할일 제목 → 화면에 강조 표시

---

## 차단 페이지 UI 상태 모델 (신규)

차단 페이지 컴포넌트는 다음 로컬 상태를 관리한다.

```
BlockedPageState
├── taskTitle: string | null    — storage에서 로드한 할일 제목 (초기값: null)
└── isLoaded: boolean           — storage 로드 완료 여부 (초기값: false)
```

### 상태 전이

```
초기 렌더링
  → isLoaded: false, taskTitle: null
  → 할일 제목 영역 미표시, 기본 집중 메시지 표시

storage 로드 완료 (chrome.storage.local.get 응답)
  → isLoaded: true
  → taskTitle = activeTaskTitle (string | null)
  → taskTitle이 string이면 할일 제목 표시
  → taskTitle이 null이면 기본 메시지만 유지
```

---

## 히스토리 관리 (뒤로가기 동작)

차단 페이지는 상태/엔티티가 아니지만, 브라우저 히스토리 스택 조작은 동작 명세의 일부이다.

```
히스토리 조작 시점: 컴포넌트 마운트 직후 (useEffect, deps: [])
조작 방식: history.replaceState(null, '', location.href)
목적: 차단 페이지를 히스토리 스택에서 현재 위치로 replace하여
      뒤로가기 시 차단된 사이트가 아닌 이전 안전한 페이지로 이동
```

---

## 엔티티 관계도

```
[Background Service Worker]
  └─ handleUpdateTodoStatus()
       ├─ 기록: storage.activeTaskTitle ← taskContent
       └─ 기록: storage.activeTaskId ← taskId

[차단 페이지 (blocked page)]
  └─ BlockedPage.tsx
       └─ 읽기: storage.activeTaskTitle → taskTitle (로컬 상태)
```

---

## 변경 범위 (데이터 레이어)

| 항목 | 변경 여부 | 설명 |
|---|---|---|
| `StorageSchema` 인터페이스 | **없음** | `activeTaskTitle` 이미 존재 |
| `DEFAULT_STORAGE` | **없음** | `activeTaskTitle: null` 이미 존재 |
| `blocking.ts` | **없음** | 차단 규칙 생성 방식 변경 불필요 |
| `message-handler.ts` | **없음** | `activeTaskTitle` 저장 로직 이미 구현됨 |
| `BlockedPage.tsx` | **수정** | storage 읽기 + UI 전면 개선 |
| `BlockedPage.test.tsx` | **수정** | 새 동작 검증 테스트 추가/수정 |
