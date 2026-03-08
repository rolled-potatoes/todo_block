# Quickstart: 집중 차단 화면 개발 가이드 (003-focus-block-screen)

**Branch**: `003-focus-block-screen`  
**Date**: 2026-03-07

---

## 개요

이 문서는 `003-focus-block-screen` 기능을 개발하는 데 필요한 빠른 시작 가이드다. 변경 범위는 최소이며 주요 변경 파일은 `src/pages/blocked/BlockedPage.tsx`다.

---

## 전제 조건

```bash
# 브랜치 확인
git branch  # 003-focus-block-screen 이어야 함

# 의존성 설치 (이미 되어 있으면 생략)
npm install

# 테스트 실행하여 현재 상태 확인
npm test
```

---

## 변경 파일 목록

| 파일 | 작업 |
|---|---|
| `src/pages/blocked/BlockedPage.tsx` | 전면 개선 (UI + storage 읽기 + history.replaceState) |
| `src/pages/blocked/BlockedPage.test.tsx` | TDD: 테스트 먼저 작성 후 구현 |
| `src/pages/blocked/index.tsx` | 소폭 수정 (props 제거) |

---

## TDD 개발 순서 (Constitution II 준수)

### Step 1: 실패하는 테스트 먼저 작성 (Red)

`BlockedPage.test.tsx`에 다음 테스트 케이스들을 먼저 작성한다 (구현 전):

1. **집중 경고 메시지 항상 표시**: 어떤 상태에서도 고정 집중 경고 문구가 렌더링됨
2. **할일 제목 표시**: `activeTaskTitle`이 storage에 있으면 제목을 화면에 표시함
3. **할일 제목 없을 때 폴백**: `activeTaskTitle`이 null이면 제목 영역 미표시, 기본 메시지만 표시
4. **차단 해제 안내 표시**: 팝업 안내 문구가 항상 렌더링됨
5. **history.replaceState 호출**: 마운트 시 `history.replaceState`가 호출됨

```bash
# 테스트 실패 확인 (Red 단계)
npm test -- --watch src/pages/blocked/BlockedPage.test.tsx
```

### Step 2: 구현 (Green)

테스트가 통과할 최소한의 구현을 작성한다.

**`BlockedPage.tsx` 핵심 변경사항**:

```typescript
// 1. chrome.storage.local에서 activeTaskTitle 읽기
useEffect(() => {
  chrome.storage.local.get('activeTaskTitle', (result) => {
    setTaskTitle(result.activeTaskTitle ?? null)
    setIsLoaded(true)
  })
}, [])

// 2. history.replaceState로 뒤로가기 처리
useEffect(() => {
  history.replaceState(null, '', location.href)
}, [])
```

### Step 3: 리팩토링 (Refactor)

중복 제거, 스타일 정리, 주석 추가.

---

## Chrome Storage Mock 설정

테스트에서 `chrome.storage.local`을 모킹해야 한다. `test/setupTests.ts`를 확인하고, mock이 없으면 테스트 파일에 추가한다:

```typescript
// BlockedPage.test.tsx 상단에 추가
const mockStorage: Record<string, unknown> = {}
vi.stubGlobal('chrome', {
  storage: {
    local: {
      get: vi.fn((key: string, callback: (result: Record<string, unknown>) => void) => {
        callback({ [key]: mockStorage[key] ?? null })
      }),
    },
  },
})
```

---

## 빌드 및 검증

```bash
# 전체 테스트 실행
npm test

# 린트 확인
npm run lint

# 빌드 확인
npm run build
```

---

## 주요 참고 파일

| 파일 | 목적 |
|---|---|
| `src/shared/types/storage.ts` | `StorageSchema` — `activeTaskTitle` 타입 확인 |
| `src/background/message-handler.ts` | `activeTaskTitle` 저장 로직 참고 |
| `src/pages/blocked/BlockedPage.tsx` | 현재 구현 (개선 대상) |
| `specs/003-focus-block-screen/research.md` | 기술 결정 근거 |
| `specs/003-focus-block-screen/contracts/blocked-page-contract.md` | 인터페이스 계약 |
