# Research: 집중 차단 화면 (003-focus-block-screen)

**Branch**: `003-focus-block-screen`  
**Date**: 2026-03-07  
**Phase**: 0 — Outline & Research

---

## 1. 진행 중인 할일 제목 전달 방식

### 문제 정의

차단 화면(`/pages/blocked/index.html`)에 현재 진행 중인 할일 제목을 표시하기 위해 두 가지 방식이 가능하다.

현재 `blocking.ts`는 차단 시 `/pages/blocked/index.html`로 단순 리디렉트만 수행하며, `?task=` 파라미터를 전달하지 않는다. `index.tsx`는 이미 URL 파라미터를 읽는 코드가 있으나 실제 값을 받지 못하고 있다.

### 후보 방식

#### 방식 A: URL 쿼리 파라미터 (`?task=<인코딩된 제목>`)

- `blocking.ts`의 `activateBlocking()`이 차단 규칙 생성 시 `extensionPath`를 동적으로 구성하여 `?task=` 파라미터를 포함시킨다.
- 차단 페이지(`index.tsx`)는 `new URLSearchParams(window.location.search).get('task')`로 읽는다 (이미 구현됨).
- **장점**: 동기 방식, 추가 API 없음, 이미 파싱 코드가 존재
- **단점**: DNR redirect rule의 `extensionPath`에 쿼리 파라미터 포함 가능 여부 검증 필요. Chrome MV3 declarativeNetRequest에서 `redirect.extensionPath`는 확장 내 경로만 지원하며 쿼리 파라미터 포함이 가능하다 (Chrome 문서 확인).

#### 방식 B: `chrome.storage.local` 직접 읽기

- 차단 페이지가 마운트 시 `chrome.storage.local.get('activeTaskTitle')`를 호출하여 제목을 읽는다.
- `activeTaskTitle`은 이미 `StorageSchema`에 존재하며 `handleUpdateTodoStatus`에서 저장된다.
- **장점**: `blocking.ts` 변경 불필요, 항상 최신 제목 반영
- **단점**: 비동기 로드 필요 (로딩 상태 처리), Chrome Extension 페이지 컨텍스트에서만 동작 (blocked 페이지는 extension 페이지이므로 가능)

### 결정

**방식 B 채택** — `chrome.storage.local`에서 `activeTaskTitle`을 읽는다.

**근거**:
- `activeTaskTitle`이 이미 `StorageSchema`에 존재하고 올바르게 관리되고 있어 신뢰할 수 있는 단일 진실 공급원(Single Source of Truth)이다.
- `blocking.ts`를 수정하지 않아도 되므로 변경 범위가 최소화된다 (Constitution III: YAGNI, 단순성 원칙).
- 할일 제목 변경 없이 차단 규칙만 갱신되는 엣지 케이스에서도 정확한 제목을 표시한다.
- DNR `extensionPath`의 쿼리 파라미터 지원이 Chrome 버전마다 다를 수 있는 불확실성을 회피한다.

**대안 고려**: 방식 A는 구조가 명확하지만 `blocking.ts` 변경이 필요하고, DNR API 동작에 대한 추가 검증이 필요하다. 방식 B가 기존 인프라를 더 잘 활용한다.

---

## 2. 뒤로가기 동작 구현 (FR-009)

### 문제 정의

차단 화면에서 뒤로가기 시 "이전의 안전한 페이지"로 이동해야 한다. 브라우저 히스토리 스택 관리 방식이 이에 영향을 준다.

### 분석

DNR redirect는 브라우저 히스토리에 원래 URL(차단된 사이트)을 남긴 후, 차단 페이지로 리디렉트한다. 이때:

- 사용자가 뒤로가기를 누르면 히스토리의 이전 항목(차단 사이트)으로 이동 → 다시 차단 페이지로 리디렉트 → 무한 루프 발생 가능

### 해결 방식

차단 페이지 마운트 시 `history.replaceState()`를 호출하여 현재 항목(차단 페이지)을 히스토리에서 제거한다. 이렇게 하면 뒤로가기 시 차단된 사이트를 건너뛰고 그 이전 페이지로 이동한다.

```
히스토리 스택 (replace 전): [안전한 페이지] [차단 사이트(redirect→차단 페이지)]
히스토리 스택 (replace 후): [안전한 페이지] [차단 페이지(replace)]
뒤로가기 후:                [안전한 페이지]  ← 차단 페이지가 아닌 안전한 페이지
```

실제로는 DNR redirect 후 차단 페이지가 `location.replace()` 또는 `history.replaceState()`를 호출하여 히스토리 항목을 덮어쓰는 방식이 일반적이다.

### 결정

**`history.replaceState(null, '', location.href)`를 차단 페이지 초기화 시점에 호출**한다.

**근거**: 이 패턴은 Chrome Extension 차단 페이지에서 표준적으로 사용되는 방식이다 (uBlock Origin, Chrome 내장 피싱 차단 페이지 등). 추가 라이브러리나 메시지 패싱이 불필요하다.

---

## 3. 차단 화면 UI 디자인 방향

### 문제 정의

기존 차단 페이지(`BlockedPage.tsx`)는 매우 단순한 텍스트 레이아웃이다. "시각적으로 임팩트 있는" 집중 경고 화면으로 개선해야 한다.

### 분석

- 외부 UI 라이브러리 추가는 YAGNI 원칙 위반. 순수 CSS/인라인 스타일로 구현.
- 기존 팝업 UI와 일관된 색상 팔레트 사용 (`#0070f3` 파란색 계열이 이미 사용 중).
- 집중 유도에 효과적인 디자인 패턴: 어두운 배경 + 강조색 텍스트, 중앙 집중 레이아웃, 큰 타이포그래피.

### 결정

**어두운 배경(다크 계열) + 강조 오렌지/붉은 계열 경고색 + 중앙 정렬 레이아웃** 채택.

**근거**:
- 어두운 배경은 집중 유도에 심리적으로 효과적이며 "경계" 상태를 명확히 전달한다.
- 라이트 배경(기존)은 일반 웹페이지와 유사하여 시각적 충격이 약하다.
- 외부 라이브러리 없이 CSS만으로 구현 가능하다.

**대안 고려**: 라이트 배경 유지 + 강조색 조합도 고려했으나, 기존 화면과 차별화가 부족하다.

---

## 4. 비동기 상태 로딩 처리 (storage 읽기)

### 문제 정의

차단 페이지가 `chrome.storage.local`에서 `activeTaskTitle`을 비동기로 읽어야 한다. 로딩 중 UI 처리가 필요하다.

### 결정

**로딩 중에는 할일 제목 영역을 렌더링하지 않고, 로드 완료 후 표시**한다. React `useState` + `useEffect`로 처리.

**근거**: `chrome.storage.local.get`은 일반적으로 수 밀리초 이내에 응답하므로 로딩 스피너는 과도하다. 제목 없이 기본 경고 메시지만 먼저 렌더링한 후, 제목이 로드되면 추가 표시하는 방식이 자연스럽다.

---

## 5. 테스트 전략 (TDD — Constitution II)

### 결정

TDD 사이클: Red → Green → Refactor 필수 준수.

**테스트 대상 및 방식**:

| 컴포넌트/모듈 | 테스트 유형 | 주요 검증 항목 |
|---|---|---|
| `BlockedPage.tsx` (리디자인) | 단위 (React Testing Library) | 할일 제목 표시, 미전달 시 폴백, 집중 메시지 렌더링, 차단 해제 안내 표시 |
| `index.tsx` (storage 읽기 로직) | 단위 (Vitest + chrome mock) | storage에서 `activeTaskTitle` 정상 읽기, null 처리 |
| 히스토리 replace 로직 | 단위 | `history.replaceState` 호출 여부 확인 |

**Mock 전략**: 기존 `test/setupTests.ts`에 `chrome.storage.local` mock이 있는지 확인 후 활용. 없으면 Vitest `vi.mock` 사용.

---

## 6. 변경 범위 요약

| 파일 | 변경 유형 | 설명 |
|---|---|---|
| `src/pages/blocked/BlockedPage.tsx` | 수정 | UI 전면 개선, storage 읽기 추가, history.replaceState 추가 |
| `src/pages/blocked/BlockedPage.test.tsx` | 수정 | 새 동작에 맞게 테스트 업데이트 |
| `src/pages/blocked/index.tsx` | 수정 없음 또는 소폭 수정 | storage 읽기를 BlockedPage 내부로 이동 시 불필요 |
| `src/background/blocking.ts` | **변경 없음** | 방식 B 채택으로 수정 불필요 |
