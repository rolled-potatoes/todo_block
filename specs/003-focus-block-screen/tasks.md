# Tasks: 집중 차단 화면 (003-focus-block-screen)

**Branch**: `003-focus-block-screen` | **Date**: 2026-03-07  
**Plan**: [plan.md](./plan.md) | **Spec**: [spec.md](./spec.md)

---

## 구현 순서 개요

TDD 원칙(Constitution II)에 따라 반드시 테스트를 먼저 작성한다.

```
Task 1 → Task 2 (Red) → Task 3 (Green) → Task 4 → Task 5 (verify)
```

---

## Task 1: `index.tsx` — URL 파라미터 코드 및 props 제거

**파일**: `src/pages/blocked/index.tsx`  
**작업 유형**: 소폭 수정  
**목적**: `BlockedPage`가 직접 storage에서 제목을 읽으므로, URL 파라미터 파싱 코드와 `taskTitle` props 전달 제거

### 변경 사항

```typescript
// 변경 전
const params = new URLSearchParams(window.location.search)
const taskTitle = params.get('task')
<BlockedPage taskTitle={taskTitle} />

// 변경 후
<BlockedPage />
```

### 완료 조건

- `taskTitle` 변수와 URL 파라미터 파싱 코드 제거됨
- `<BlockedPage />` props 없이 렌더링됨
- TypeScript 컴파일 오류 없음

---

## Task 2: `BlockedPage.test.tsx` — 실패 테스트 작성 (Red)

**파일**: `src/pages/blocked/BlockedPage.test.tsx`  
**작업 유형**: TDD Red 단계 — 기존 테스트 교체 + 신규 테스트 추가  
**목적**: 새 동작 명세를 검증하는 테스트를 구현 전에 작성하여 실패 확인

### 테스트 케이스

| # | 테스트명 | 검증 내용 | 관련 FR |
|---|---|---|---|
| T-01 | 집중 경고 메시지 항상 표시 | 고정 집중 유도 문구가 항상 렌더링됨 | FR-001 |
| T-02 | 차단 해제 안내 항상 표시 | 팝업 안내 문구가 항상 렌더링됨 | FR-004 |
| T-03 | storage에서 할일 제목 로드 후 표시 | `activeTaskTitle`이 string이면 화면에 표시 | FR-002, FR-006 |
| T-04 | 할일 제목 없을 때 제목 영역 미표시 | `activeTaskTitle`이 null이면 제목 미표시 | FR-002 |
| T-05 | `history.replaceState` 마운트 시 호출 | 컴포넌트 마운트 시 `history.replaceState` 호출됨 | FR-009 |
| T-06 | 긴 할일 제목도 정상 렌더링 | 50자 이상 제목 렌더링 시 오류 없음 | FR-007 |
| T-07 | 집중 아이콘 표시 | 시각적 아이콘 요소가 렌더링됨 | FR-003 |

### Chrome Storage Mock 설정

```typescript
// 각 테스트에서 storage 값을 주입할 수 있도록 setupChromeMock 헬퍼 작성
function setupChromeMock(activeTaskTitle: string | null) {
  vi.stubGlobal('chrome', {
    storage: {
      local: {
        get: vi.fn((_key: string, callback: (result: Record<string, unknown>) => void) => {
          callback({ activeTaskTitle })
        }),
      },
    },
  })
}
```

### 완료 조건

- 모든 테스트가 **실패** 상태임 (구현 전이므로)
- `npm test` 실행 시 T-01~T-07 테스트가 오류 없이 실행되지만 실패함
- TypeScript 타입 오류 없음

---

## Task 3: `BlockedPage.tsx` — UI 전면 개선 및 동작 구현 (Green)

**파일**: `src/pages/blocked/BlockedPage.tsx`  
**작업 유형**: 전면 개선 (기존 파일 교체 수준)  
**목적**: Task 2의 테스트를 모두 통과하는 최소 구현 작성

### 구현 명세

#### Props 제거

```typescript
// 변경 전
function BlockedPage({ taskTitle }: BlockedPageProps)

// 변경 후
function BlockedPage(): JSX.Element
```

#### 로컬 상태

```typescript
const [taskTitle, setTaskTitle] = useState<string | null>(null)
const [isLoaded, setIsLoaded] = useState(false)
```

#### useEffect — storage 읽기 (1회)

```typescript
useEffect(() => {
  // chrome.storage.local에서 진행 중인 할일 제목을 1회 읽는다
  chrome.storage.local.get('activeTaskTitle', (result) => {
    setTaskTitle(result['activeTaskTitle'] ?? null)
    setIsLoaded(true)
  })
}, [])
```

#### useEffect — 뒤로가기 처리 (1회)

```typescript
useEffect(() => {
  // 차단 페이지를 히스토리에서 현재 위치로 replace하여
  // 뒤로가기 시 차단된 사이트를 건너뛰고 안전한 페이지로 이동한다
  history.replaceState(null, '', location.href)
}, [])

```

#### 렌더링 구조

```
<div> (전체 화면 컨테이너, minHeight: 100vh, 중앙 정렬)
  <div> (집중 아이콘, role="img" aria-label="집중")
  <h1> (고정 집중 경고 제목, 예: "지금은 업무에 집중할 시간입니다")
  <p>  (고정 집중 유도 부제목)
  {taskTitle && <p> (진행 중인 할일 제목 강조 표시)}
  <p>  (차단 해제 안내 — 팝업 안내 포함)
```

#### 스타일 방향

- 배경: 어두운 계열 (예: `#1a1a2e` 또는 진한 남색)
- 경고색 강조: 빨간색 또는 주황색 계열 제목
- 할일 제목: 파란색 또는 노란색 강조, 최대 너비 제한 + `word-break: break-word`
- 전체 레이아웃: `flexbox` 중앙 정렬, `padding` 40px
- 폰트: `system-ui, sans-serif`

### 완료 조건

- Task 2에서 작성한 T-01~T-07 테스트가 모두 **통과** 상태임
- TypeScript strict 모드 오류 없음
- `interface BlockedPageProps` 제거됨

---

## Task 4: 빌드 및 린트 검증

**목적**: 전체 테스트 통과 + 린트 + 빌드 성공 확인

### 실행 명령

```bash
npm test && npm run lint
```

### 완료 조건

- 전체 테스트 통과 (기존 테스트 포함)
- 린트 오류 없음
- (선택) `npm run build` 성공

---

## 완료 체크리스트

- [x] Task 1: `index.tsx` URL 파라미터 코드 및 props 제거
- [x] Task 2: `BlockedPage.test.tsx` 실패 테스트 작성 (Red)
- [x] Task 3: `BlockedPage.tsx` 구현 (Green)
- [x] Task 4: 테스트 + 린트 전체 통과
