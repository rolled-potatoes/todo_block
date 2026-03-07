# Tasks: 진행중 아이템 확장프로그램 아이콘 배지

**Input**: Design documents from `/specs/002-active-item-badge/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Constitution 원칙 II에 따라 TDD 필수 — 모든 구현 태스크 전에 테스트를 먼저 작성해야 한다.

**Organization**: 태스크는 User Story별로 그룹화되어 있으며, 각 스토리는 독립적으로 구현·테스트·배포 가능하다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (다른 파일, 의존성 없음)
- **[Story]**: 태스크가 속하는 User Story (US1, US2, US3)
- 각 태스크에 정확한 파일 경로 포함

---

## Phase 1: Setup (공유 인프라)

**Purpose**: 테스트 모킹 환경 및 Storage 스키마 확장 — 모든 User Story의 전제 조건

- [x] T001 `src/test/setupTests.ts`에 `chrome.action` 모킹 추가 (`setBadgeText`, `setBadgeBackgroundColor`, `setTitle`을 `vi.fn().mockResolvedValue(undefined)`로 mock — R-007 참고)
- [x] T002 `src/shared/types/storage.ts`의 `StorageSchema`에 `activeTaskTitle: string | null` 필드 추가 및 `DEFAULT_STORAGE`에 `activeTaskTitle: null` 기본값 추가

**Checkpoint**: 테스트 환경 및 스키마 준비 완료 — `npm test`가 기존 테스트를 모두 통과해야 한다

---

## Phase 2: Foundational (공통 배지 모듈)

**Purpose**: 모든 User Story가 의존하는 `badge.ts` 핵심 모듈 구현 (TDD)

**⚠️ CRITICAL**: 이 Phase가 완료되기 전까지 어떤 User Story 작업도 시작할 수 없다

### 테스트 먼저 (Red)

- [x] T003 `src/background/badge.test.ts` 신규 생성 — `showBadge()` 호출 시 `chrome.action.setBadgeText({ text: 'ON' })`과 `chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' })`가 호출되는지 검증하는 실패 테스트 작성
- [x] T004 `src/background/badge.test.ts`에 `clearBadge()` 호출 시 `chrome.action.setBadgeText({ text: '' })`가 호출되는지 검증하는 실패 테스트 추가

### 구현 (Green)

- [x] T005 `src/background/badge.ts` 신규 생성 — `showBadge()` 함수 구현 (`chrome.action.setBadgeText({ text: 'ON' })` + `chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' })` 순차 호출, research R-001·R-002 참고)
- [x] T006 `src/background/badge.ts`에 `clearBadge()` 함수 구현 (`chrome.action.setBadgeText({ text: '' })` 호출)

**Checkpoint**: `npm test` 실행 시 `badge.test.ts`의 모든 테스트 통과 확인

---

## Phase 3: User Story 1 — 진행중 아이템 배지 표시 (Priority: P1) 🎯 MVP

**Goal**: 사용자가 할 일을 in_progress로 전환하면 확장프로그램 아이콘에 "ON" 배지가 즉시 표시되고, idle/completed로 전환하면 배지가 즉시 사라진다.

**Independent Test**: 할 일 아이템 하나를 in_progress로 전환한 뒤, `chrome.action.setBadgeText({ text: 'ON' })`이 호출되는지 단위 테스트로 검증한다. idle/completed 전환 후 `chrome.action.setBadgeText({ text: '' })`가 호출되는지도 검증한다.

### 테스트 먼저 (Red)

- [x] T007 [US1] `src/background/message-handler.test.ts`에 `UPDATE_TODO_STATUS` → `in_progress` 처리 시 `showBadge()`가 호출되는지 검증하는 실패 테스트 추가 (badge 모듈을 `vi.mock`으로 모킹)
- [x] T008 [US1] `src/background/message-handler.test.ts`에 `UPDATE_TODO_STATUS` → `completed` 처리 시 `clearBadge()`가 호출되는지 검증하는 실패 테스트 추가
- [x] T009 [US1] `src/background/message-handler.test.ts`에 `UPDATE_TODO_STATUS` → `idle` 처리 시 `clearBadge()`가 호출되는지 검증하는 실패 테스트 추가

### 구현 (Green)

- [x] T010 [US1] `src/background/message-handler.ts` 상단에 `import { showBadge, clearBadge } from './badge'` 추가
- [x] T011 [US1] `src/background/message-handler.ts`의 `handleUpdateTodoStatus` 함수 내 `in_progress` 분기에 `await showBadge()` 호출 추가 (기존 `activateBlocking()` + `setStorage()` 호출 이후)
- [x] T012 [US1] `src/background/message-handler.ts`의 `handleUpdateTodoStatus` 함수 내 `completed` 분기에 `await clearBadge()` 호출 추가 (기존 `deactivateBlocking()` + `setStorage()` 호출 이후)
- [x] T013 [US1] `src/background/message-handler.ts`의 `handleUpdateTodoStatus` 함수 내 `idle` 분기에 `await clearBadge()` 호출 추가 (기존 `deactivateBlocking()` + `setStorage()` 호출 이후)

**Checkpoint**: `npm test` 통과. 확장프로그램을 빌드하여 실제로 할 일을 in_progress로 전환했을 때 아이콘에 "ON" 배지가 나타나는지, idle/completed 전환 시 배지가 사라지는지 수동 확인

---

## Phase 4: User Story 2 — 브라우저 재시작 시 배지 복원 (Priority: P2)

**Goal**: 브라우저를 재시작했을 때, 이전에 진행중이던 할 일이 있으면 확장프로그램 아이콘에 배지가 자동으로 복원된다.

**Independent Test**: `onStartup` 및 `onInstalled` 이벤트 발생 시, `activeTaskId`가 저장된 경우 `showBadge()`가 호출되고, 없는 경우 호출되지 않는지 단위 테스트로 검증한다.

### 테스트 먼저 (Red)

- [x] T014 [US2] `src/background/index.ts`에 대한 테스트 파일 `src/background/index.test.ts` 신규 생성 — `activeTaskId`가 존재할 때 `onStartup` 이벤트 트리거 시 `showBadge()`가 호출되는지 검증하는 실패 테스트 작성 (badge 모듈과 blocking 모듈을 `vi.mock`으로 모킹)
- [x] T015 [US2] `src/background/index.test.ts`에 `activeTaskId`가 `null`일 때 `onStartup` 이벤트 트리거 시 `showBadge()`가 호출되지 않는지 검증하는 실패 테스트 추가
- [x] T016 [US2] `src/background/index.test.ts`에 `activeTaskId`가 존재할 때 `onInstalled` 이벤트 트리거 시 `showBadge()`가 호출되는지 검증하는 실패 테스트 추가

### 구현 (Green)

- [x] T017 [US2] `src/background/index.ts`에 `import { showBadge } from './badge'` 추가
- [x] T018 [US2] `src/background/index.ts`의 `restoreBlockingIfNeeded()` 함수를 확장하여 `activeTaskId`가 있을 때 `await showBadge()` 호출 추가 (기존 `activateBlocking()` 호출 이후에 위치)

**Checkpoint**: `npm test` 통과. 확장프로그램을 빌드하여 할 일 in_progress 전환 후 브라우저를 재시작했을 때 배지가 복원되는지 수동 확인

---

## Phase 5: User Story 3 — 배지로 진행중인 작업명 확인 (Priority: P3)

**Goal**: 진행중인 할 일이 있을 때 확장프로그램 아이콘에 마우스를 올리면 해당 작업의 제목이 툴팁으로 표시된다. 진행중인 할 일이 없으면 기본 확장프로그램 이름이 표시된다.

**Independent Test**: 할 일을 in_progress로 전환 시 `chrome.action.setTitle`이 해당 작업 제목으로 호출되는지, idle/completed 전환 시 `chrome.action.setTitle({ title: '' })`로 호출되는지 단위 테스트로 검증한다.

### 테스트 먼저 (Red)

- [x] T019 [P] [US3] `src/background/badge.test.ts`에 `setActiveTaskTitle('보고서 작성')` 호출 시 `chrome.action.setTitle({ title: '보고서 작성' })`이 호출되는지 검증하는 실패 테스트 추가
- [x] T020 [P] [US3] `src/background/badge.test.ts`에 `resetTitle()` 호출 시 `chrome.action.setTitle({ title: '' })`이 호출되는지 검증하는 실패 테스트 추가
- [x] T021 [US3] `src/background/message-handler.test.ts`에 `UPDATE_TODO_STATUS` → `in_progress` 처리 시 `setActiveTaskTitle(taskContent)`가 작업 제목으로 호출되는지 검증하는 실패 테스트 추가
- [x] T022 [US3] `src/background/message-handler.test.ts`에 `UPDATE_TODO_STATUS` → `idle`/`completed` 처리 시 `resetTitle()`이 호출되는지 검증하는 실패 테스트 추가
- [x] T023 [US3] `src/background/index.test.ts`에 `activeTaskTitle`이 존재할 때 `onStartup` 트리거 시 `setActiveTaskTitle(title)`이 호출되는지 검증하는 실패 테스트 추가

### 구현 (Green)

- [x] T024 [P] [US3] `src/background/badge.ts`에 `setActiveTaskTitle(taskTitle: string)` 함수 구현 (`chrome.action.setTitle({ title: taskTitle })` 호출)
- [x] T025 [P] [US3] `src/background/badge.ts`에 `resetTitle()` 함수 구현 (`chrome.action.setTitle({ title: '' })` 호출 — manifest `default_title`로 자동 복원)
- [x] T026 [US3] `src/shared/types/storage.ts`의 `StorageSchema`에 이미 추가된 `activeTaskTitle` 필드를 `handleUpdateTodoStatus`에서 활용하도록 `src/background/message-handler.ts` 수정 — `in_progress` 분기에서 `setStorage({ activeTaskId: taskId, activeTaskTitle: taskContent })` 및 `await setActiveTaskTitle(taskContent)` 추가 (taskContent는 message payload에서 수신)
- [x] T027 [US3] `src/background/message-handler.ts`의 `completed`/`idle` 분기에서 `setStorage({ activeTaskId: null, activeTaskTitle: null })` 및 `await resetTitle()` 추가
- [x] T028 [US3] `src/background/index.ts`의 `restoreBlockingIfNeeded()` 함수 내에서 `activeTaskTitle`도 읽어와 `await setActiveTaskTitle(activeTaskTitle)` 추가 (T018 구현 이후, `activeTaskTitle`이 null이 아닌 경우에만 호출)
- [x] T029 [US3] `src/shared/types/messages.ts`의 `UPDATE_TODO_STATUS` 메시지 payload에 `taskContent: string` 필드 추가 (message-handler가 작업 제목을 수신할 수 있도록)
- [x] T030 [US3] `src/popup/components/TodoItem.tsx`에서 `UPDATE_TODO_STATUS` 메시지 발송 시 `taskContent` 필드(할 일 제목)를 payload에 포함하도록 수정

**Checkpoint**: `npm test` 통과. 확장프로그램을 빌드하여 할 일 in_progress 전환 후 아이콘 hover 시 작업명이 툴팁으로 표시되는지 수동 확인

---

## Phase 6: Polish & 최종 검증

**Purpose**: 엣지 케이스 처리 및 전체 통합 검증

- [x] T031 [P] `src/background/message-handler.test.ts`에 기존 `activeTaskId`는 있지만 `activeTaskTitle`이 null인 마이그레이션 엣지 케이스 테스트 추가 — 배지는 표시되되 `setActiveTaskTitle`이 호출되지 않아야 함
- [x] T032 [P] `src/background/badge.test.ts`에 `showBadge()`와 `clearBadge()`가 각각 독립적으로 호출될 수 있음을 검증하는 idempotency(멱등성) 테스트 추가 — 동일 함수를 여러 번 호출해도 오류 없이 동작해야 함
- [x] T033 `npm test && npm run lint` 실행하여 모든 테스트 통과 및 린트 오류 없음 확인

---

## Dependencies & Execution Order

### Phase 의존 관계

```
Phase 1 (Setup)
  └─→ Phase 2 (Foundational badge.ts)
        ├─→ Phase 3 (US1: 배지 표시/제거)
        ├─→ Phase 4 (US2: 재시작 복원)       ← US1 완료 권장 (동일 showBadge 의존)
        └─→ Phase 5 (US3: 툴팁)              ← US1 완료 필수 (badge.ts 확장, message payload 변경)
              └─→ Phase 6 (Polish)
```

### User Story 의존 관계

| Story | 의존 | 독립 테스트 가능 여부 |
|-------|------|----------------------|
| US1 (P1) | Phase 1, Phase 2 완료 | ✅ 독립 테스트 가능 |
| US2 (P2) | Phase 1, Phase 2 완료 | ✅ 독립 테스트 가능 (US1과 병렬 가능) |
| US3 (P3) | Phase 1, Phase 2, US1 완료 필수 | ✅ 독립 테스트 가능 (message payload 변경이 US1에 의존) |

### 태스크 내 순서 (TDD)

```
테스트 작성 (Red) → 실행하여 실패 확인 → 구현 (Green) → 테스트 통과 확인 → 다음 태스크
```

### 병렬 실행 기회

- **T003, T004**: `badge.test.ts` 내에서 두 테스트 케이스 병렬 작성 가능
- **T007, T008, T009**: message-handler 테스트 케이스들은 같은 파일이지만 독립적인 케이스
- **T019, T020**: `badge.test.ts` 툴팁 테스트 병렬 작성 가능
- **T024, T025**: `badge.ts` 툴팁 함수 병렬 구현 가능 (다른 함수)
- **T031, T032**: Polish 테스트 케이스 병렬 작성 가능

---

## Parallel Example: Phase 2 (Foundational)

```bash
# badge.ts 테스트 케이스 병렬 작성:
Task: "showBadge() 테스트 작성 in src/background/badge.test.ts"   # T003
Task: "clearBadge() 테스트 작성 in src/background/badge.test.ts"  # T004
```

## Parallel Example: User Story 3

```bash
# badge.ts 함수 병렬 구현:
Task: "setActiveTaskTitle() 구현 in src/background/badge.ts"  # T024
Task: "resetTitle() 구현 in src/background/badge.ts"          # T025
```

---

## Implementation Strategy

### MVP First (User Story 1만)

1. Phase 1 완료: T001, T002
2. Phase 2 완료: T003 → T004 → T005 → T006 (TDD: Red → Green)
3. Phase 3 완료: T007 → T008 → T009 → T010 → T011 → T012 → T013
4. **STOP and VALIDATE**: `npm test` 통과 + 실제 확장프로그램에서 배지 동작 수동 확인
5. 충분히 가치 있는 상태로 배포/데모 가능

### Incremental Delivery

1. Phase 1 + 2 완료 → badge 모듈 기반 준비
2. Phase 3 (US1) 완료 → 배지 표시/제거 동작 (**MVP!**)
3. Phase 4 (US2) 완료 → 브라우저 재시작 후에도 배지 유지
4. Phase 5 (US3) 완료 → 아이콘 hover 시 작업명 툴팁 표시
5. Phase 6 완료 → 엣지 케이스 처리 및 최종 검증

---

## Notes

- `[P]` 태스크 = 다른 파일 또는 독립적인 함수, 병렬 진행 가능
- `[Story]` 레이블은 각 태스크를 특정 User Story와 연결하여 추적 가능하게 함
- **TDD 필수**: 각 구현 태스크 전에 반드시 테스트가 Red(실패) 상태여야 한다
- `npm test`가 각 Checkpoint에서 통과해야만 다음 Phase로 진행 가능
- 커밋 메시지는 한글로 작성 (constitution 원칙 I): 예) `테스트: badge 모듈 단위 테스트 추가`
- `activeTaskTitle` payload 전달을 위해 T029, T030이 필요함을 주의 (US3의 핵심 선결 조건)
