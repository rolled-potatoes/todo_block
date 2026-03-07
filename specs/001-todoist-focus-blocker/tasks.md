# Tasks: Todoist 집중 차단기

**Input**: `/specs/001-todoist-focus-blocker/` 설계 문서
**Prerequisites**: plan.md (✅), spec.md (✅), research.md (✅), data-model.md (✅), contracts/ (✅)

**Tests**: Constitution 원칙 II (TDD 필수)에 따라 모든 User Story에 테스트 태스크를 포함한다. Red-Green-Refactor 사이클 엄격 적용.

**Organization**: User Story별로 그룹화하여 독립 구현/테스트 가능하도록 조직.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 병렬 실행 가능 (서로 다른 파일, 의존성 없음)
- **[Story]**: 해당 User Story (US1, US2, US3)
- 정확한 파일 경로를 설명에 포함

---

## Phase 1: Setup (프로젝트 초기 설정)

**Purpose**: 프로젝트 초기화 및 기본 구조 생성

- [X] T001 `package.json` 생성 — React 18, TypeScript, Vite, CRXJS, Vitest, React Testing Library 의존성 설정
- [X] T002 `tsconfig.json` 생성 — TypeScript strict 모드, React JSX, path alias 설정
- [X] T003 [P] `vite.config.ts` 생성 — CRXJS 플러그인, React 플러그인 설정
- [X] T004 [P] `vitest.config.ts` 생성 — 테스트 환경(jsdom), setupFiles, globals 설정
- [X] T005 [P] `manifest.json` 생성 — MV3 기본 구조, permissions(`storage`, `declarativeNetRequest`, `activeTab`, `tabs`), host_permissions(`https://api.todoist.com/*`)
- [X] T006 `src/` 디렉토리 구조 생성 — `background/`, `popup/`, `content/`, `pages/blocked/`, `shared/types/` 폴더 및 진입점 파일
- [X] T007 테스트 인프라 설정 — `src/test/setupTests.ts`에 Chrome API 글로벌 모킹(`chrome.runtime`, `chrome.storage`, `chrome.tabs`, `chrome.declarativeNetRequest`)
- [X] T008 [P] `public/icons/` 플레이스홀더 아이콘 생성 (16, 32, 48, 128px)
- [X] T009 npm install 실행 및 빌드 확인 — `npm run build` 성공 검증

**Checkpoint**: 프로젝트가 빌드되고, 빈 크롬 익스텐션으로 로드 가능한 상태

---

## Phase 2: Foundational (기반 인프라)

**Purpose**: 모든 User Story가 의존하는 핵심 인프라. 이 Phase 완료 전까지 US 구현 불가.

**⚠️ CRITICAL**: Phase 2 완료 전 User Story 구현 시작 불가

### 테스트 (TDD — Red 먼저)

- [X] T010 [P] 공유 타입 테스트 — `src/shared/types/todo.test.ts`: TodoItem, TodoStatus 타입 가드/유효성 검증 테스트
- [X] T011 [P] 공유 타입 테스트 — `src/shared/types/blocked-site.test.ts`: BlockedSite 도메인 유효성 검증 테스트
- [X] T012 [P] 공유 타입 테스트 — `src/shared/types/messages.test.ts`: 메시지 타입 구분 및 응답 형식 검증 테스트
- [X] T013 [P] Storage 래퍼 테스트 — `src/shared/storage.test.ts`: get/set/remove 동작, 기본값 처리, 타입 안전성 테스트
- [X] T014 [P] 유틸리티 테스트 — `src/shared/utils.test.ts`: URL에서 도메인 추출 함수 테스트 (프로토콜 제거, 서브도메인 처리, 경로 제거, 엣지케이스)

### 구현 (TDD — Green)

- [X] T015 [P] 공유 타입 정의 — `src/shared/types/todo.ts`: TodoItem, TodoStatus(`idle`|`in_progress`|`completed`), DueDate 인터페이스 및 타입 가드
- [X] T016 [P] 공유 타입 정의 — `src/shared/types/blocked-site.ts`: BlockedSite 인터페이스 및 도메인 유효성 검증 함수
- [X] T017 [P] 공유 타입 정의 — `src/shared/types/storage.ts`: StorageSchema 인터페이스 (`apiToken`, `blockedSites`, `activeTaskId`, `nextRuleId`)
- [X] T018 [P] 공유 타입 정의 — `src/shared/types/messages.ts`: 7개 메시지 타입(`FETCH_TODOS`, `UPDATE_TODO_STATUS`, `ADD_BLOCKED_SITE`, `REMOVE_BLOCKED_SITE`, `GET_BLOCKED_SITES`, `SAVE_API_TOKEN`, `GET_CURRENT_TAB_DOMAIN`) 및 MessageResponse 정의
- [X] T019 Storage 래퍼 구현 — `src/shared/storage.ts`: 타입 안전한 `chrome.storage.local` 래퍼 (get, set, remove, 기본값 초기화)
- [X] T020 유틸리티 구현 — `src/shared/utils.ts`: `extractDomain(url)` 도메인 추출 함수
- [X] T021 Background 진입점 — `src/background/index.ts`: Service Worker 이벤트 리스너 등록 스캐폴딩 (`chrome.runtime.onMessage`, `chrome.runtime.onInstalled`)
- [X] T022 Popup 진입점 — `src/popup/index.html` + `src/popup/index.tsx`: React 루트 렌더링 스캐폴딩
- [X] T023 차단 안내 페이지 진입점 — `src/pages/blocked/index.html` + `src/pages/blocked/index.tsx`: 기본 차단 안내 UI 스캐폴딩

**Checkpoint**: 기반 인프라 완성 — 모든 공유 타입 정의됨, Storage 래퍼 동작, 진입점 스캐폴딩 완료. `npm test` 통과.

---

## Phase 3: User Story 1 — Todoist 오늘 할일 조회 (Priority: P1) 🎯 MVP

**Goal**: 팝업을 열면 Todoist 오늘 할일 목록이 표시된다. API 토큰 미설정 시 설정 안내를 보여준다.

**Independent Test**: Todoist API 토큰 설정 후 팝업을 열어 오늘 할일이 표시되는지 확인.

### 테스트 (TDD — Red 먼저)

- [X] T024 [P] [US1] Todoist API 클라이언트 테스트 — `src/background/todoist.test.ts`: fetchTodayTasks() 성공/실패(401, 429, 5xx) 응답 처리, API 토큰 헤더 검증
- [X] T025 [P] [US1] FETCH_TODOS 메시지 핸들러 테스트 — `src/background/message-handler.test.ts`: FETCH_TODOS 메시지 수신 시 Todoist API 호출 및 TodoItem[] 변환 검증
- [X] T026 [P] [US1] SAVE_API_TOKEN 메시지 핸들러 테스트 — `src/background/message-handler.test.ts`: SAVE_API_TOKEN 메시지 수신 시 토큰 유효성 검증 및 Storage 저장
- [X] T027 [P] [US1] TodoList 컴포넌트 테스트 — `src/popup/components/TodoList.test.tsx`: 할일 목록 렌더링, 빈 목록 안내("오늘 할일이 없습니다"), 로딩 상태
- [X] T028 [P] [US1] ApiTokenSetup 컴포넌트 테스트 — `src/popup/components/ApiTokenSetup.test.tsx`: 토큰 입력 폼, 저장 시 SAVE_API_TOKEN 메시지 전송, 검증 실패 오류 표시
- [X] T029 [P] [US1] ErrorMessage 컴포넌트 테스트 — `src/popup/components/ErrorMessage.test.tsx`: 오류 타입별 메시지 표시(INVALID_TOKEN, NETWORK_ERROR), 재시도 버튼
- [X] T030 [P] [US1] Popup App 통합 테스트 — `src/popup/App.test.tsx`: 토큰 미설정 시 ApiTokenSetup 표시, 설정 시 TodoList 표시, 오류 시 ErrorMessage 표시

### 구현

- [X] T031 [US1] Todoist API 클라이언트 구현 — `src/background/todoist.ts`: `fetchTodayTasks(token)` 함수 (GET /tasks?filter=today, Todoist 응답 → TodoItem 변환, 에러 핸들링)
- [X] T032 [US1] Background 메시지 핸들러 구현 — `src/background/message-handler.ts`: FETCH_TODOS, SAVE_API_TOKEN 메시지 라우팅 및 처리
- [X] T033 [US1] Background index 연결 — `src/background/index.ts`: message-handler를 onMessage 리스너에 등록, onInstalled에서 Storage 기본값 초기화
- [X] T034 [P] [US1] ErrorMessage 컴포넌트 구현 — `src/popup/components/ErrorMessage.tsx`: 오류 타입별 한글 메시지, 재시도 콜백
- [X] T035 [P] [US1] ApiTokenSetup 컴포넌트 구현 — `src/popup/components/ApiTokenSetup.tsx`: 토큰 입력 폼, SAVE_API_TOKEN 메시지 전송, 검증 결과 표시
- [X] T036 [P] [US1] TodoItem 컴포넌트 구현 — `src/popup/components/TodoItem.tsx`: 할일 제목, 상태 표시 (Phase 3에서는 상태 변경 버튼 미구현, 표시만)
- [X] T037 [US1] TodoList 컴포넌트 구현 — `src/popup/components/TodoList.tsx`: FETCH_TODOS 호출, TodoItem 리스트 렌더링, 빈 목록/로딩/오류 상태 처리
- [X] T038 [US1] Popup App 구현 — `src/popup/App.tsx`: 토큰 유무에 따른 화면 분기 (ApiTokenSetup / TodoList), 전체 상태 관리

**Checkpoint**: 팝업에서 Todoist 오늘 할일 조회 가능. 토큰 미설정 시 설정 안내 표시. `npm test` 통과.

---

## Phase 4: User Story 2 — 할일 상태 관리 및 사이트 차단 (Priority: P2)

**Goal**: 할일을 "진행"으로 전환하면 차단 목록 사이트 접속이 제한되고, "중단"/"완료"로 전환하면 해제된다.

**Independent Test**: 할일을 "진행"으로 전환 후 차단 목록 사이트 접속 시 차단 안내 페이지가 표시되는지 확인.

### 테스트 (TDD — Red 먼저)

- [X] T039 [P] [US2] 차단 규칙 관리 테스트 — `src/background/blocking.test.ts`: DNR 규칙 활성화/비활성화, BlockedSite[] → DNR Rule 변환, 빈 차단 목록 처리
- [X] T040 [P] [US2] UPDATE_TODO_STATUS 메시지 핸들러 테스트 — `src/background/message-handler.test.ts`에 추가: in_progress 전환 시 차단 활성화, idle 전환 시 차단 해제, completed 전환 시 Todoist 완료 API 호출 + 차단 해제, 동시 진행 1개 제한(기존 활성 할일 자동 중단)
- [X] T041 [P] [US2] TodoItem 상태 변경 테스트 — `src/popup/components/TodoItem.test.tsx`: "진행"/"중단"/"완료" 버튼 렌더링 및 클릭 시 UPDATE_TODO_STATUS 메시지 전송 검증
- [X] T042 [P] [US2] 차단 안내 페이지 테스트 — `src/pages/blocked/BlockedPage.test.tsx`: 진행 중 할일 제목 표시, "돌아가기" 안내 표시

### 구현

- [X] T043 [US2] 차단 규칙 관리 구현 — `src/background/blocking.ts`: `activateBlocking(sites)`, `deactivateBlocking()` 함수 (chrome.declarativeNetRequest.updateDynamicRules 사용, BlockedSite → redirect 규칙 변환)
- [X] T044 [US2] UPDATE_TODO_STATUS 핸들러 구현 — `src/background/message-handler.ts`에 추가: 상태 전이 로직 (idle↔in_progress↔completed), activeTaskId Storage 갱신, 차단 활성화/비활성화 연동, Todoist close API 호출 (completed 시)
- [X] T045 [US2] Background 서비스 워커 복원 로직 — `src/background/index.ts`에 추가: onInstalled/onStartup에서 activeTaskId 확인 → 값이 있으면 차단 규칙 복원
- [X] T046 [US2] TodoItem 컴포넌트 확장 — `src/popup/components/TodoItem.tsx`: 상태별 버튼 렌더링 (idle → "진행"/"완료", in_progress → "중단"/"완료", completed → 비활성), UPDATE_TODO_STATUS 메시지 전송
- [X] T047 [US2] TodoList 상태 반영 — `src/popup/components/TodoList.tsx`: UPDATE_TODO_STATUS 응답에서 updatedTask, previousActiveTask 반영하여 목록 갱신
- [X] T048 [US2] 차단 안내 페이지 구현 — `src/pages/blocked/index.tsx`: URL 파라미터에서 진행 중 할일 제목 표시, "돌아가기" 안내, 스타일링

**Checkpoint**: 할일 상태 전환(idle/in_progress/completed) 동작, 진행 시 사이트 차단 활성화/해제 동작. `npm test` 통과.

---

## Phase 5: User Story 3 — 차단 사이트 목록 관리 (Priority: P3)

**Goal**: 현재 접속 중인 사이트를 차단 목록에 추가/제거할 수 있으며, 목록은 브라우저 재시작 후에도 유지된다.

**Independent Test**: 사이트 접속 후 차단 추가 버튼으로 등록, 제거 버튼으로 삭제 확인.

### 테스트 (TDD — Red 먼저)

- [X] T049 [P] [US3] ADD_BLOCKED_SITE 핸들러 테스트 — `src/background/message-handler.test.ts`에 추가: 도메인 추가 성공, 중복 도메인 거부(DUPLICATE_DOMAIN), 잘못된 도메인 거부(INVALID_DOMAIN), 진행 중 할일 있을 때 즉시 DNR 규칙 추가
- [X] T050 [P] [US3] REMOVE_BLOCKED_SITE 핸들러 테스트 — `src/background/message-handler.test.ts`에 추가: 사이트 제거 성공, 존재하지 않는 사이트 제거 시 SITE_NOT_FOUND
- [X] T051 [P] [US3] GET_BLOCKED_SITES 핸들러 테스트 — `src/background/message-handler.test.ts`에 추가: 차단 목록 반환
- [X] T052 [P] [US3] GET_CURRENT_TAB_DOMAIN 핸들러 테스트 — `src/background/message-handler.test.ts`에 추가: 현재 탭 도메인 추출, 이미 차단된 도메인 여부 판별
- [X] T053 [P] [US3] BlockedSites 컴포넌트 테스트 — `src/popup/components/BlockedSites.test.tsx`: 차단 목록 렌더링, 추가 버튼(현재 페이지 도메인), 제거 버튼, 이미 차단된 페이지일 때 "차단 해제" 버튼 표시

### 구현

- [X] T054 [US3] ADD_BLOCKED_SITE 핸들러 구현 — `src/background/message-handler.ts`에 추가: 도메인 유효성 검증, Storage에 BlockedSite 추가, nextRuleId 증가, activeTaskId 존재 시 DNR 규칙 즉시 추가
- [X] T055 [US3] REMOVE_BLOCKED_SITE 핸들러 구현 — `src/background/message-handler.ts`에 추가: Storage에서 BlockedSite 제거, activeTaskId 존재 시 DNR 규칙 즉시 제거
- [X] T056 [US3] GET_BLOCKED_SITES / GET_CURRENT_TAB_DOMAIN 핸들러 구현 — `src/background/message-handler.ts`에 추가: 차단 목록 조회, chrome.tabs.query로 현재 탭 도메인 추출 및 차단 여부 판별
- [X] T057 [US3] BlockedSites 컴포넌트 구현 — `src/popup/components/BlockedSites.tsx`: GET_BLOCKED_SITES로 목록 표시, GET_CURRENT_TAB_DOMAIN으로 현재 탭 도메인 자동 입력, ADD/REMOVE 메시지 전송
- [X] T058 [US3] Popup App에 BlockedSites 통합 — `src/popup/App.tsx`에 BlockedSites 섹션 추가

**Checkpoint**: 차단 사이트 추가/제거 동작, 브라우저 재시작 후 목록 유지, 현재 페이지 차단 여부 표시. `npm test` 통과.

---

## Phase 6: Polish & 교차 관심사

**Purpose**: 전체 품질 향상 및 마무리

- [X] T059 [P] 팝업 UI 스타일링 — `src/popup/` 내 CSS/스타일: 일관된 디자인, 로딩 인디케이터, 버튼 상태 피드백
- [X] T060 [P] 차단 안내 페이지 스타일링 — `src/pages/blocked/`: 시각적으로 명확한 차단 안내, 진행 중 할일 제목 강조
- [X] T061 [P] Content Script 최소 구현 — `src/content/index.ts`: 현재 필요한 최소 기능만 구현 (향후 확장 가능 구조)
- [X] T062 오류 처리 강화 — 전체 레이어에 걸친 네트워크 오류, API 토큰 만료, 예외 상황 처리 일관성 검증
- [X] T063 전체 통합 테스트 — 모든 User Story 시나리오 E2E 수준 검증 (팝업 열기 → 할일 조회 → 상태 전환 → 차단 확인 → 차단 목록 관리)
- [X] T064 quickstart.md 검증 — `specs/001-todoist-focus-blocker/quickstart.md` 절차대로 프로젝트 설정 → 빌드 → 테스트 → 크롬 로드 수행
- [X] T065 `npm test && npm run lint` 전체 통과 확인

---

## Dependencies & Execution Order

### Phase 의존성

- **Phase 1 (Setup)**: 의존성 없음 — 즉시 시작 가능
- **Phase 2 (Foundational)**: Phase 1 완료 필요 — 모든 User Story를 블로킹
- **Phase 3 (US1)**: Phase 2 완료 필요 — 다른 User Story에 대한 의존성 없음
- **Phase 4 (US2)**: Phase 2 완료 필요 — US1과 독립적이나, TodoItem 컴포넌트 확장 시 Phase 3 결과물 활용
- **Phase 5 (US3)**: Phase 2 완료 필요 — US2의 차단 로직(blocking.ts)에 의존
- **Phase 6 (Polish)**: 모든 User Story 완료 후 진행

### User Story 의존성

- **US1 (P1)**: Phase 2 이후 독립 구현 가능 — MVP 핵심
- **US2 (P2)**: Phase 2 이후 시작 가능, Phase 3의 TodoItem 컴포넌트를 확장하므로 실질적으로 Phase 3 이후 권장
- **US3 (P3)**: Phase 2 이후 시작 가능, US2의 `blocking.ts`를 재사용하므로 실질적으로 Phase 4 이후 권장

### 각 User Story 내부 실행 순서

1. 테스트 작성 (Red) — 반드시 실패 확인
2. 구현 (Green) — 테스트 통과까지만
3. 리팩토링 (Refactor) — 코드 품질 개선
4. 모델/타입 → 서비스/핸들러 → UI 컴포넌트 순서

### 병렬 실행 기회

- Phase 1: T003, T004, T005, T008 동시 실행 가능
- Phase 2: T010~T014 (테스트) 동시 실행, T015~T018 (타입) 동시 실행
- Phase 3: T024~T030 (테스트) 동시 실행, T034~T036 (독립 컴포넌트) 동시 실행
- Phase 4: T039~T042 (테스트) 동시 실행
- Phase 5: T049~T053 (테스트) 동시 실행
- Phase 6: T059~T061 동시 실행

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 완료 → 프로젝트 빌드 가능
2. Phase 2 완료 → 기반 인프라 준비
3. Phase 3 완료 → **Todoist 할일 조회 MVP 동작**
4. **STOP and VALIDATE**: 팝업에서 할일 목록 표시 확인
5. 필요 시 배포/데모

### Incremental Delivery

1. Setup + Foundational → 기반 준비
2. US1 추가 → 독립 테스트 → 데모 (할일 조회 MVP!)
3. US2 추가 → 독립 테스트 → 데모 (집중 모드 + 차단!)
4. US3 추가 → 독립 테스트 → 데모 (차단 목록 관리!)
5. Polish → 최종 품질 검증

---

## Notes

- [P] 태스크 = 서로 다른 파일, 의존성 없음 → 병렬 실행 가능
- [Story] 라벨은 특정 User Story에 대한 추적성 제공
- 각 User Story는 독립적으로 완성 및 테스트 가능해야 함
- **TDD 필수**: 테스트가 실패(Red)함을 확인한 후에만 구현(Green) 시작
- 커밋은 각 태스크 또는 논리적 그룹 완료 후 수행
- 커밋 메시지는 한글로 작성 (예: `기능: 할일 목록 조회 API 클라이언트 구현`)
- 체크포인트에서 멈추고 해당 스토리를 독립적으로 검증할 것
- 테스트 파일은 Colocation 방식: 구현 파일 옆에 `*.test.ts(x)` 배치
