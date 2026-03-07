# Implementation Plan: 진행중 아이템 확장프로그램 아이콘 배지

**Branch**: `002-active-item-badge` | **Date**: 2026-03-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-active-item-badge/spec.md`

## Summary

사용자가 할 일을 in_progress 상태로 전환할 때 Chrome 확장프로그램 아이콘에 배지를 표시하여, 팝업을 열지 않고도 집중 모드 활성화 여부를 인지할 수 있게 한다. `chrome.action.setBadgeText`, `setBadgeBackgroundColor`, `setTitle` API를 사용하며, 기존 blocking 모듈과 동일한 패턴(상태 변경 시 즉시 반영 + 재시작 시 복원)을 따른다.

## Technical Context

**Language/Version**: TypeScript 5.x (strict 모드)
**Primary Dependencies**: React 18+, Vite + CRXJS, Chrome Extension Manifest V3 APIs (`chrome.action`)
**Storage**: chrome.storage.local (기존 `activeTaskId` 활용, 스키마 변경 불필요)
**Testing**: Vitest + React Testing Library, co-located `.test.ts` 패턴
**Target Platform**: Chrome Extension (Manifest V3)
**Project Type**: Chrome Extension (browser-extension)
**Performance Goals**: 배지 표시/제거 1초 이내 (SC-001, SC-002)
**Constraints**: 추가 permission 불필요 (`chrome.action` API는 MV3 `action` 키만 있으면 사용 가능)
**Scale/Scope**: 단일 배지 상태 (on/off) + 툴팁 텍스트 변경

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 준수 여부 | 근거 |
|------|-----------|------|
| I. 크롬 익스텐션 아키텍처 우선 — 레이어 분리 | PASS | 배지 로직은 Background(서비스 레이어)에만 존재. Popup/Content Script에 직접 의존 없음. chrome.action API 호출은 Background에서만 수행. |
| I. 크롬 익스텐션 아키텍처 우선 — 레이어 간 통신 | PASS | 배지 업데이트는 기존 UPDATE_TODO_STATUS 메시지 처리 흐름 안에서 수행. 새로운 메시지 타입 불필요. |
| I. 크롬 익스텐션 아키텍처 우선 — React + TypeScript | PASS | 기존 기술 스택 유지. UI 변경 없음. |
| I. 한글 정책 | PASS | 주석, 커밋 메시지, 문서 모두 한글. |
| II. TDD 필수 | PASS | badge.ts 모듈에 대한 단위 테스트를 먼저 작성. message-handler 통합 테스트에 배지 호출 검증 추가. |
| III. 단순성 — YAGNI | PASS | 배지 텍스트("ON"/빈 문자열)와 색상만 사용. 복잡한 아이콘 교체나 애니메이션 없음. |
| III. 최소 권한 원칙 | PASS | 새로운 permission 추가 불필요. `chrome.action` API는 기존 manifest의 `action` 키로 사용 가능. |
| 제약 — Chrome Web Store 정책 | PASS | `chrome.action.setBadgeText`는 표준 API, 정책 위반 없음. |
| 제약 — 데이터 로컬 저장 | PASS | 배지 상태는 기존 `activeTaskId`에서 파생. 외부 전송 없음. |

**결과: 모든 게이트 통과. 위반 사항 없음.**

## Project Structure

### Documentation (this feature)

```text
specs/002-active-item-badge/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── background/
│   ├── index.ts              # [수정] restoreBadgeIfNeeded() 추가, onInstalled/onStartup에서 호출
│   ├── message-handler.ts    # [수정] handleUpdateTodoStatus에 배지 set/clear 호출 추가
│   ├── message-handler.test.ts  # [수정] 배지 호출 검증 테스트 추가
│   ├── badge.ts              # [신규] setBadge(), clearBadge(), setActiveTitle(), resetTitle()
│   ├── badge.test.ts         # [신규] badge 모듈 단위 테스트
│   ├── blocking.ts           # [변경 없음]
│   └── todoist.ts            # [변경 없음]
├── shared/
│   ├── types/
│   │   └── storage.ts        # [변경 없음] activeTaskId 재활용
│   └── storage.ts            # [변경 없음]
├── popup/                    # [변경 없음]
├── pages/                    # [변경 없음]
└── test/
    └── setupTests.ts         # [수정] chrome.action 모킹 추가
```

**Structure Decision**: 기존 프로젝트 구조를 유지하며, `src/background/badge.ts`를 `blocking.ts`와 동일한 패턴으로 신규 추가. 레이어 분리 원칙에 따라 Background 레이어 내에서만 변경.
