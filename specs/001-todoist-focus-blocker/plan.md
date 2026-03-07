# Implementation Plan: Todoist 집중 차단기

**Branch**: `001-todoist-focus-blocker` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-todoist-focus-blocker/spec.md`

## Summary

Todoist의 오늘 할일을 크롬 익스텐션 팝업에서 조회하고, 할일을 "진행" 상태로 전환하면
미리 등록한 사이트의 접속을 차단하여 집중을 돕는 생산성 도구. Chrome Extension Manifest V3
기반으로 `chrome.declarativeNetRequest` API를 사용한 사이트 차단, Todoist REST API v2를
통한 할일 조회/완료 동기화, React + TypeScript 기반 팝업 UI를 핵심 기술 접근으로 한다.

## Technical Context

**Language/Version**: TypeScript 5.x (strict 모드)
**Primary Dependencies**: React 18+, Vite + CRXJS (크롬 익스텐션 번들러), Todoist REST API v2
**Storage**: `chrome.storage.local` (API 토큰, 차단 목록, 진행 상태 영속성)
**Testing**: Vitest + React Testing Library + Chrome API Mock
**Target Platform**: Chrome Extension Manifest V3 (Chrome 116+)
**Project Type**: 크롬 익스텐션 (browser-extension)
**Performance Goals**: 팝업 로딩 3초 이내 (SC-001), 차단 활성화 1초 이내 (SC-002)
**Constraints**: Chrome Web Store 정책 준수, 최소 권한 원칙, 사용자 데이터 외부 전송 불가
**Scale/Scope**: 개인 사용자 대상, 팝업 1개 + 차단 안내 페이지 1개 + 설정 화면 1개

## Constitution Check

*GATE: Phase 0 리서치 전 통과 필수. Phase 1 설계 후 재검증.*

### 원칙 I: 크롬 익스텐션 아키텍처 우선 (SRP 레이어 분리)

| 검증 항목 | 결과 | 근거 |
|-----------|------|------|
| Manifest V3 기반인가? | PASS | Chrome Extension Manifest V3 사용 확정 |
| SRP 레이어 분리가 계획되어 있는가? | PASS | Popup(UI), Background(서비스), Content Script(인터랙션), Storage(데이터) 4개 레이어 분리 |
| 레이어 간 통신이 Message Passing으로 이루어지는가? | PASS | Chrome Message Passing API 사용 예정 |
| React + TypeScript 사용인가? | PASS | React 18+ / TypeScript strict 모드 확정 |
| 한글 주석/문서 정책 준수인가? | PASS | 모든 주석, 문서, 커밋 메시지 한글 작성 |

### 원칙 II: TDD 필수 (비타협)

| 검증 항목 | 결과 | 근거 |
|-----------|------|------|
| 테스트 프레임워크가 선정되었는가? | PASS | Vitest + React Testing Library |
| 각 레이어별 단위 테스트 계획이 있는가? | PASS | 스펙에 레이어별 테스트 명시 |
| 레이어 간 통합 테스트 계획이 있는가? | PASS | Message Passing 통합 테스트 예정 |
| Red-Green-Refactor 사이클 적용 가능한가? | PASS | 구현 전 테스트 작성 워크플로우 적용 |

### 원칙 III: 단순성과 사용자 경험

| 검증 항목 | 결과 | 근거 |
|-----------|------|------|
| YAGNI 원칙 준수인가? | PASS | 1단계 API 토큰 직접 입력, OAuth2는 향후 확장 구조만 확보 |
| 최소 권한 원칙 준수인가? | PASS | `declarativeNetRequest` 사용 확정 — 네트워크 요청 내용을 읽지 않아 최소 권한 충족. 리다이렉트를 위한 host_permissions는 기능 수행에 필수적 (research.md 참조) |
| UI/UX가 직관적인가? | PASS | 2클릭 이내 차단 추가 (SC-004), 2분 이내 온보딩 (SC-005) |

**GATE 결과**: PASS — 모든 원칙 충족 (Phase 1 설계 후 재검증 완료)

## Project Structure

### Documentation (this feature)

```text
specs/001-todoist-focus-blocker/
├── plan.md              # 구현 계획 (이 파일)
├── research.md          # 기술 리서치 (Phase 0)
├── data-model.md        # 데이터 모델 정의 (Phase 1)
├── quickstart.md        # 빠른 시작 가이드 (Phase 1)
├── contracts/           # API 계약 문서 (Phase 1)
│   ├── message-passing.md  # 레이어 간 메시지 계약
│   └── todoist-api.md      # Todoist REST API 계약
└── tasks.md             # 작업 분해 (Phase 2, /speckit.tasks에서 생성)
```

### Source Code (repository root)

```text
src/
├── background/              # Service Worker (차단 로직, Todoist API 호출)
│   ├── index.ts             # 이벤트 리스너 등록 진입점
│   ├── blocking.ts          # declarativeNetRequest 차단 규칙 관리
│   ├── todoist.ts           # Todoist REST API 클라이언트
│   └── message-handler.ts   # 메시지 수신 및 라우팅
├── popup/                   # React Popup UI (할일 목록, 차단 관리)
│   ├── index.html           # 팝업 진입점 HTML
│   ├── index.tsx            # React 렌더링 진입점
│   └── components/          # UI 컴포넌트
│       ├── TodoList.tsx      # 할일 목록 컴포넌트
│       ├── TodoItem.tsx      # 개별 할일 항목 컴포넌트
│       ├── BlockedSites.tsx  # 차단 사이트 목록 컴포넌트
│       ├── ApiTokenSetup.tsx # API 토큰 설정 컴포넌트
│       └── ErrorMessage.tsx  # 오류 메시지 컴포넌트
├── pages/                   # 독립 페이지
│   └── blocked/             # 차단 안내 페이지
│       ├── index.html
│       └── index.tsx
├── shared/                  # 공유 타입, Storage 래퍼, 유틸리티
│   ├── types/               # TypeScript 타입 정의
│   │   ├── todo.ts          # TodoItem, TodoStatus, DueDate
│   │   ├── blocked-site.ts  # BlockedSite
│   │   ├── storage.ts       # StorageSchema
│   │   └── messages.ts      # Message, MessageResponse 타입
│   ├── storage.ts           # 타입 안전한 Chrome Storage 래퍼
│   └── utils.ts             # 도메인 추출 등 유틸리티 함수
└── content/                 # Content Script
    └── index.ts             # 현재 페이지 정보 제공 (필요 시)

public/
├── icons/                   # 익스텐션 아이콘 (16, 32, 48, 128px)
└── blocked.html             # 차단 안내 페이지 (선택적, pages/blocked와 역할 분담)

manifest.json                # Chrome Extension Manifest V3 설정
vite.config.ts               # Vite + CRXJS 빌드 설정
vitest.config.ts             # Vitest 테스트 설정
tsconfig.json                # TypeScript 설정
package.json                 # 의존성 및 스크립트
```

**Structure Decision**: Chrome Extension의 실행 컨텍스트별 분리(background, popup, content, pages)를
최상위 디렉토리로 사용하고, 공유 로직은 `shared/`에 배치한다. 테스트 파일은 Colocation 방식으로
각 소스 파일 옆에 `*.test.ts(x)`로 배치한다. Constitution 원칙 I의 SRP 레이어 분리와 일치하며,
CRXJS가 `manifest.json`을 기반으로 각 진입점을 자동 감지하기에 적합한 구조이다.

## Complexity Tracking

> Constitution Check 위반 항목 없음. 모든 원칙 PASS.
