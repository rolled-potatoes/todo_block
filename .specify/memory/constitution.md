<!--
Sync Impact Report
==================
Version change: N/A → 1.0.0
Modified principles: N/A (최초 작성)
Added sections:
  - Core Principles (3개): I. 크롬 익스텐션 아키텍처 우선, II. TDD 필수, III. 단순성과 사용자 경험
  - 기술 스택 및 제약 조건
  - 개발 워크플로우
  - Governance
Removed sections: N/A
Templates requiring updates:
  - .specify/templates/plan-template.md      ✅ 수정 불필요 (동적 참조)
  - .specify/templates/spec-template.md      ✅ 수정 불필요
  - .specify/templates/tasks-template.md     ✅ 수정 불필요
  - .specify/templates/checklist-template.md ✅ 수정 불필요
  - .specify/templates/agent-file-template.md ✅ 수정 불필요
  - .opencode/command/*.md                   ✅ 수정 불필요
Follow-up TODOs: 없음
-->

# todo_block Constitution

## Core Principles

### I. 크롬 익스텐션 아키텍처 우선

크롬 익스텐션 개발은 Chrome Extension Manifest V3 규격을 기반으로 하며,
단일 책임 원칙(SRP)에 따라 역할별 레이어를 엄격히 분리해야 한다.

- **Popup (UI 레이어)**: 사용자 인터페이스 렌더링만 담당. React 컴포넌트로 구성.
- **Background (서비스 레이어)**: Service Worker에서 비즈니스 로직과 사이트 차단 로직을 처리.
- **Content Script (인터랙션 레이어)**: 웹 페이지와의 DOM 상호작용만 담당.
- **Storage (데이터 레이어)**: Chrome Storage API를 통한 데이터 영속성 관리만 담당.

각 레이어는 독립적으로 테스트 가능해야 하며, 다른 레이어에 직접 의존해서는 안 된다.
레이어 간 통신은 Chrome Message Passing API를 통해서만 이루어진다.

기술 스택: React + TypeScript를 MUST 사용한다.
언어 정책: 소스 코드의 동작 코드(변수명, 함수명 등)를 제외한 모든 텍스트(주석, 커밋 메시지, 문서)는 한글로 작성한다.

### II. TDD 필수 (비타협)

테스트 주도 개발(TDD)은 선택이 아닌 필수이며, 어떠한 예외도 허용하지 않는다.

- 구현 코드 작성 전 테스트를 반드시 먼저 작성해야 한다.
- Red(실패) → Green(통과) → Refactor(개선) 사이클을 반드시 준수한다.
- 테스트가 실패함을 확인한 후에만 구현을 시작할 수 있다.
- 각 레이어(Popup, Background, Content Script, Storage)별 단위 테스트를 작성한다.
- 레이어 간 통신(Message Passing)에 대한 통합 테스트를 작성한다.
- 테스트 없이 작성된 코드는 PR 승인을 받을 수 없다.

### III. 단순성과 사용자 경험

불필요한 복잡도를 배제하고 사용자 중심의 직관적인 경험을 제공한다.

- YAGNI 원칙: 현재 요구사항에 없는 기능은 구현하지 않는다.
- Chrome 최소 권한 원칙: 기능에 필요한 최소한의 permission만 `manifest.json`에 선언한다.
- UI/UX는 사용자 관점에서 직관적이어야 하며, 학습 비용 없이 사용 가능해야 한다.
- 복잡도 증가가 불가피한 경우 반드시 문서화하고 팀 승인을 받아야 한다.

## 기술 스택 및 제약 조건

### 필수 기술

- **런타임**: Chrome Extension Manifest V3
- **UI 프레임워크**: React 18+
- **언어**: TypeScript (strict 모드)
- **빌드 도구**: Vite + CRXJS (또는 동등한 크롬 익스텐션 번들러)
- **테스트 프레임워크**: Vitest + React Testing Library

### 제약 조건

- Chrome Web Store 정책 및 가이드라인을 준수해야 한다.
- Manifest V2는 사용하지 않는다 (2024년 이후 Chrome 정책 준수).
- 외부 네트워크 요청은 최소화하고, 필요 시 명확한 목적을 문서화한다.
- 사용자 데이터는 `chrome.storage.local`에만 저장하며, 외부 서버로 전송하지 않는다.

## 개발 워크플로우

### 브랜치 전략

- `main`: 배포 가능한 안정 버전만 유지
- `feature/[기능명]`: 기능 개발 브랜치 (예: `feature/todo-list`, `feature/site-blocker`)
- `fix/[버그명]`: 버그 수정 브랜치

### 코드 리뷰 요구사항

- 모든 PR은 반드시 Constitution 준수 여부를 검증해야 한다.
- TDD 사이클 준수 여부 (테스트 먼저 작성 여부) 확인 필수.
- 레이어 분리 원칙 위반 여부 확인 필수.
- 한글 주석/문서 정책 준수 여부 확인.

### 커밋 메시지 규칙

- 한글로 작성한다.
- 형식: `[타입]: [변경 내용 요약]`
- 타입: `기능`, `수정`, `문서`, `테스트`, `리팩토링`, `설정`
- 예시: `기능: 할일 목록 추가 기능 구현`, `테스트: 사이트 차단 로직 단위 테스트 추가`

## Governance

이 Constitution은 `todo_block` 프로젝트의 모든 개발 관행에 우선한다.

- 모든 PR 및 코드 리뷰에서 Constitution 준수 여부를 검증해야 한다.
- Constitution 수정은 다음 절차를 따른다:
  1. 수정 이유와 영향 범위 문서화
  2. 팀 승인
  3. 필요 시 기존 코드 마이그레이션 계획 수립
- Constitution 버전은 Semantic Versioning을 따른다:
  - **MAJOR**: 원칙 삭제 또는 비호환 재정의
  - **MINOR**: 새로운 원칙 또는 섹션 추가
  - **PATCH**: 문구 수정, 오탈자 수정 등 의미 변경 없는 개선

**Version**: 1.0.0 | **Ratified**: 2026-03-06 | **Last Amended**: 2026-03-06
