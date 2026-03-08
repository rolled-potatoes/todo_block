# Implementation Plan: 집중 차단 화면 (Focus Block Screen)

**Branch**: `003-focus-block-screen` | **Date**: 2026-03-07 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/003-focus-block-screen/spec.md`

## Summary

차단된 사이트 접속 시 표시되는 기존 단순 안내 페이지를 시각적으로 임팩트 있는 집중 경고 화면으로 개선한다. `chrome.storage.local`에서 `activeTaskTitle`을 읽어 진행 중인 할일 제목을 표시하고, `history.replaceState`로 뒤로가기 동작을 안전하게 처리한다. 변경 범위는 `src/pages/blocked/` 디렉터리의 두 파일(`BlockedPage.tsx`, `BlockedPage.test.tsx`)로 최소화된다.

## Technical Context

**Language/Version**: TypeScript 5.x (strict 모드)  
**Primary Dependencies**: React 18+, Vitest, React Testing Library, Chrome Extension Manifest V3  
**Storage**: chrome.storage.local (기존 `activeTaskTitle` 필드 읽기 전용 활용)  
**Testing**: Vitest + React Testing Library (TDD 필수 — Constitution II)  
**Target Platform**: Chrome Extension (MV3), 데스크톱 브라우저  
**Project Type**: Chrome Extension (browser extension)  
**Performance Goals**: 차단 페이지 렌더링 1초 이내, storage 읽기 수십 ms 이내  
**Constraints**: Chrome 최소 권한 원칙 준수, 외부 라이브러리 추가 금지, 기존 레이어 계약 유지  
**Scale/Scope**: 단일 페이지 컴포넌트 개선, 2개 파일 변경

## Constitution Check

*GATE: Phase 0 리서치 전 통과 필요. Phase 1 디자인 후 재검토.*

| 원칙 | 상태 | 근거 |
|---|---|---|
| I. 크롬 익스텐션 아키텍처 우선 (레이어 분리) | ✅ PASS | 차단 페이지(Pages 레이어)에서 storage를 직접 읽는 것은 Extension Pages의 올바른 패턴. Background에 메시지를 보낼 필요 없음. |
| I. React + TypeScript MUST | ✅ PASS | 기존 스택 유지 |
| I. 한글 주석/문서 정책 | ✅ PASS | 모든 주석 한글로 작성 예정 |
| II. TDD 필수 (비타협) | ✅ PASS | 테스트 먼저 작성 후 구현 예정 (Red→Green→Refactor) |
| III. YAGNI | ✅ PASS | `blocking.ts` 변경 없음. 최소 변경 범위. |
| III. Chrome 최소 권한 원칙 | ✅ PASS | 새 permission 추가 없음. `storage` 권한은 이미 선언됨. |
| III. 복잡도 문서화 | ✅ PASS | 복잡도 증가 없음 |

**Phase 1 후 재검토 결과**: 모든 원칙 통과. 위반 없음.

## Project Structure

### Documentation (this feature)

```text
specs/003-focus-block-screen/
├── plan.md              ← 이 파일
├── spec.md              ← 기능 명세
├── research.md          ← Phase 0 리서치 결과
├── data-model.md        ← Phase 1 데이터 모델
├── contracts/
│   └── blocked-page-contract.md  ← Phase 1 인터페이스 계약
├── checklists/
│   └── requirements.md  ← 명세 품질 체크리스트
└── tasks.md             ← Phase 2 출력 (/speckit.tasks 명령으로 생성)
```

### Source Code (변경 대상)

```text
src/
└── pages/
    └── blocked/
        ├── BlockedPage.tsx        ← 수정: UI 전면 개선 + storage 읽기 + history.replaceState
        ├── BlockedPage.test.tsx   ← 수정: TDD — 테스트 먼저 작성
        └── index.tsx              ← 소폭 수정: BlockedPage props 제거 (taskTitle 제거)
```

**변경 없는 파일**:
```text
src/background/blocking.ts         ← 변경 없음
src/background/message-handler.ts  ← 변경 없음
src/shared/types/storage.ts        ← 변경 없음
src/shared/storage.ts              ← 변경 없음
manifest.json                      ← 변경 없음 (권한 추가 불필요)
```

**Structure Decision**: 단일 프로젝트 구조 유지. 기존 `src/pages/blocked/` 디렉터리 내 파일만 수정.

## Complexity Tracking

> Constitution Check에 위반 없음. 이 섹션은 해당 없음.
