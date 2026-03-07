# Research: 진행중 아이템 확장프로그램 아이콘 배지

**Feature**: 002-active-item-badge  
**Date**: 2026-03-07

## R-001: chrome.action Badge API (MV3)

**Decision**: `chrome.action.setBadgeText` + `setBadgeBackgroundColor` 사용

**Rationale**:
- Manifest V3에서 표준으로 제공되는 API로, 추가 permission 불필요 (`action` 키만 있으면 사용 가능)
- 서비스 워커 컨텍스트에서 완전히 동작
- 배지 상태는 Chrome 브라우저 프로세스에 저장되므로 서비스 워커 idle/종료 시에도 배지 유지
- Promise 기반 API로 async/await 패턴 사용 가능

**Alternatives considered**:
- `chrome.action.setIcon()` (아이콘 자체 변경): 별도 아이콘 에셋 필요, 과도한 복잡도. 배지로 충분.
- `chrome.sidePanel` 사용: 완전히 다른 접근. 배지는 더 간결하고 즉각적.

**핵심 API 시그니처**:
```typescript
chrome.action.setBadgeText({ text: string, tabId?: number }): Promise<void>
chrome.action.setBadgeBackgroundColor({ color: string | [r,g,b,a], tabId?: number }): Promise<void>
chrome.action.setTitle({ title: string, tabId?: number }): Promise<void>
```

## R-002: 배지 텍스트 형식

**Decision**: 활성 시 `"ON"` 텍스트 + 녹색(`#4CAF50`) 배경, 비활성 시 빈 문자열(배지 완전 제거)

**Rationale**:
- Chrome 배지는 약 4자까지만 표시 가능 — `"ON"`은 2자로 가독성 최적
- 녹색 배경은 "활성/진행중" 상태를 직관적으로 전달
- 비활성 시 배지를 완전히 제거(`text: ''`)하면 on/off 구분이 가장 명확
- Unicode 특수문자(예: "●")는 OS별 렌더링이 다를 수 있어 안전한 영문 텍스트 선택

**Alternatives considered**:
- `"●"` (도트): OS별 렌더링 차이 우려
- `"집중"` (한글): 4자 제한에 2자이지만 영문 대비 가독성 열위 (좁은 공간)
- 숫자 카운터 (예: `"1"`): 동시 진행 아이템이 항상 1개이므로 의미 없음

## R-003: 배지 상태 영속성

**Decision**: `onStartup` + `onInstalled`에서 배지를 명시적으로 복원

**Rationale**:
- 배지 상태는 **서비스 워커 idle/종료 시에는 유지**되지만, **브라우저 재시작 시에는 초기화**됨
- 따라서 브라우저 시작 시(`onStartup`)와 확장프로그램 설치/업데이트 시(`onInstalled`) 복원 필수
- 기존 `restoreBlockingIfNeeded()` 패턴과 동일한 접근 — `activeTaskId`가 있으면 배지 복원
- `chrome.storage.session` 대신 기존 `chrome.storage.local`의 `activeTaskId`를 재활용하여 추가 저장소 불필요

**Alternatives considered**:
- `chrome.storage.session` 사용: 브라우저 재시작 시 사라지므로 부적합
- 서비스 워커 전역 변수: idle 시 소실되므로 부적합
- 별도 `badgeActive: boolean` 저장: 불필요한 중복 — `activeTaskId !== null` 조건으로 충분

## R-004: 툴팁(Title) 관리

**Decision**: `chrome.action.setTitle()`로 진행중 작업명 표시, 비활성 시 빈 문자열로 기본값 복원

**Rationale**:
- `setTitle({ title: '' })`을 호출하면 manifest의 `default_title` 값으로 자동 복원됨
- 현재 manifest의 `default_title`은 `"Todoist 집중 차단기"`
- 진행중 할 일이 있으면 해당 할 일의 content(제목)를 title로 설정
- 추가 저장소가 필요할 수 있음: 기존 `activeTaskId`만으로는 작업 제목을 알 수 없으므로, `onStartup` 복원 시 title까지 복원하려면 작업 제목도 저장해야 함

**Design Decision**: 
- 복원 시 title은 `activeTaskId` 존재 여부로 배지만 복원하고, title은 다음 FETCH_TODOS 시점에 복원
- 또는 StorageSchema에 `activeTaskTitle: string | null` 필드 추가
- **선택: `activeTaskTitle` 추가** — 추가 복잡도가 최소이고 사용자 경험 향상이 크므로

## R-005: badge 모듈 설계 패턴

**Decision**: `src/background/badge.ts`를 `blocking.ts`와 동일한 패턴으로 설계

**Rationale**:
- `blocking.ts`는 Chrome API 호출을 캡슐화한 순수 모듈로, 단위 테스트가 용이
- 동일한 패턴으로 `badge.ts`를 설계하면 코드베이스 일관성 유지
- 함수 수준 export로 message-handler에서 import하여 사용

**모듈 인터페이스 설계**:
```typescript
// src/background/badge.ts
export async function showBadge(): Promise<void>
  // setBadgeText({ text: 'ON' }) + setBadgeBackgroundColor({ color: '#4CAF50' })

export async function clearBadge(): Promise<void>
  // setBadgeText({ text: '' })

export async function setActiveTaskTitle(taskTitle: string): Promise<void>
  // setTitle({ title: taskTitle })

export async function resetTitle(): Promise<void>
  // setTitle({ title: '' })  → manifest default_title로 복원
```

**Alternatives considered**:
- 클래스 기반 (`BadgeManager`): 상태를 가질 필요 없으므로 과도한 추상화
- message-handler에 직접 Chrome API 호출: 테스트 어려움, 관심사 분리 위반

## R-006: Storage Schema 변경

**Decision**: `StorageSchema`에 `activeTaskTitle: string | null` 필드 추가

**Rationale**:
- 기존 `activeTaskId`만으로는 브라우저 재시작 시 작업 제목을 복원할 수 없음
- `activeTaskTitle`을 함께 저장하면 재시작 시 배지 + 툴팁을 모두 즉시 복원 가능
- DEFAULT_STORAGE에 `activeTaskTitle: null` 추가
- `initStorage()`가 기존 키를 보존하므로 기존 사용자 데이터에 영향 없음

**Alternatives considered**:
- 재시작 시 Todoist API로 작업 제목 조회: 네트워크 의존, 지연 발생
- 제목 없이 배지만 복원: 가능하지만 P3 스토리의 사용자 경험 저하

## R-007: setupTests.ts 모킹 확장

**Decision**: `chrome.action` 객체를 기존 chromeMock에 추가

**Rationale**:
- 기존 패턴(`chrome.declarativeNetRequest`, `chrome.tabs` 등)과 동일하게 `vi.fn()`으로 모킹
- `setBadgeText`, `setBadgeBackgroundColor`, `setTitle`을 모킹
- 기본 동작: Promise.resolve() 반환 (단, Chrome API가 callback 패턴일 수 있으므로 확인 필요)
- MV3의 `chrome.action` API는 Promise를 반환하므로 `mockResolvedValue(undefined)` 패턴 사용

**모킹 구조**:
```typescript
action: {
  setBadgeText: vi.fn().mockResolvedValue(undefined),
  setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
  setTitle: vi.fn().mockResolvedValue(undefined),
}
```
