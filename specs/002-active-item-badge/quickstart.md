# Quickstart: 진행중 아이템 확장프로그램 아이콘 배지

**Feature**: 002-active-item-badge  
**Date**: 2026-03-07

## 개요

사용자가 할 일을 "진행중" 상태로 전환하면 Chrome 확장프로그램 아이콘에 녹색 "ON" 배지를 표시하고, 진행중인 작업이 없으면 배지를 제거한다. 아이콘 hover 시 진행중인 작업명을 툴팁으로 표시한다.

## 구현 범위

### 신규 파일

| 파일 | 설명 |
|------|------|
| `src/background/badge.ts` | Chrome badge/title API 래퍼 모듈 |
| `src/background/badge.test.ts` | badge 모듈 단위 테스트 |

### 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/shared/types/storage.ts` | `activeTaskTitle: string \| null` 필드 추가 |
| `src/background/message-handler.ts` | `handleUpdateTodoStatus`에 배지/툴팁 set/clear 호출 추가 |
| `src/background/message-handler.test.ts` | 배지 호출 검증 테스트 추가 |
| `src/background/index.ts` | `restoreBadgeIfNeeded()` 함수 추가, onInstalled/onStartup에서 호출 |
| `src/test/setupTests.ts` | `chrome.action` 모킹 추가 |

## 구현 순서 (TDD)

### Phase 1: badge 모듈 (P1 핵심)

1. `badge.test.ts` 작성 — `showBadge()`, `clearBadge()` 테스트
2. `badge.ts` 구현 — Chrome API 래핑
3. Red → Green 확인

### Phase 2: Storage 스키마 + message-handler 통합 (P1 핵심)

1. `storage.ts` 스키마에 `activeTaskTitle` 추가
2. `message-handler.test.ts`에 배지 호출 검증 테스트 추가
3. `message-handler.ts`에 배지 호출 코드 추가
4. Red → Green 확인

### Phase 3: 복원 로직 (P2)

1. `index.ts`에 `restoreBadgeIfNeeded()` 추가
2. `onInstalled`, `onStartup` 리스너에 호출 추가

### Phase 4: 툴팁 (P3)

1. `badge.test.ts`에 `setActiveTaskTitle()`, `resetTitle()` 테스트 추가
2. `badge.ts`에 해당 함수 구현
3. `message-handler`에 툴팁 호출 추가

## 테스트 실행

```bash
npm test
```

## 핵심 API

```typescript
// badge.ts 공개 인터페이스
export async function showBadge(): Promise<void>
export async function clearBadge(): Promise<void>
export async function setActiveTaskTitle(title: string): Promise<void>
export async function resetTitle(): Promise<void>
```

## 주의사항

- Chrome badge 상태는 서비스 워커 idle 시에도 유지되지만, 브라우저 재시작 시 초기화됨 → 반드시 `onStartup`에서 복원
- `chrome.action.setTitle({ title: '' })`은 manifest의 `default_title`로 자동 복원됨
- 배지 텍스트는 약 4자까지 표시 가능 — `"ON"` 사용
- 추가 permission 불필요
