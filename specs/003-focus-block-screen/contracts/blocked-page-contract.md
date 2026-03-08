# 인터페이스 계약: 집중 차단 화면 (003-focus-block-screen)

**Branch**: `003-focus-block-screen`  
**Date**: 2026-03-07  
**Phase**: 1 — Design & Contracts

---

## 개요

이 기능은 새로운 외부 API나 메시지 타입을 추가하지 않는다. 기존 계약을 활용하는 읽기 전용 접근 패턴이 추가된다.

---

## 1. Storage 읽기 계약 (차단 페이지 → Chrome Storage)

차단 페이지(`BlockedPage.tsx`)가 `chrome.storage.local`에서 읽는 데이터 계약이다.

### 읽기 요청

```typescript
chrome.storage.local.get('activeTaskTitle', (result) => {
  const title: string | null = result.activeTaskTitle ?? null
})
```

### 응답 계약

| 필드 | 타입 | 의미 |
|---|---|---|
| `activeTaskTitle` | `string \| null` | 진행 중인 할일의 제목. null이면 제목 없음 |

### 불변 조건

- 차단 페이지는 `activeTaskTitle`을 **읽기만** 한다. 쓰기 금지.
- 읽기는 컴포넌트 마운트 시 **1회만** 수행한다 (실시간 구독 불필요).
- 읽기 실패(예: storage 접근 불가) 시 `null`로 처리하고 기본 메시지를 표시한다.

---

## 2. 히스토리 조작 계약 (차단 페이지 → Browser History API)

### 호출 시점

컴포넌트 마운트 직후 (`useEffect`, 빈 deps 배열).

### 호출 형태

```typescript
history.replaceState(null, '', location.href)
```

### 사후 조건

- 뒤로가기 버튼 클릭 시 차단된 사이트 URL을 건너뛰고 직전 안전한 페이지로 이동한다.
- 히스토리 스택에 차단 페이지 항목이 남지 않는다.

---

## 3. BlockedPage 컴포넌트 Props 계약

### 현재 (변경 전)

```typescript
interface BlockedPageProps {
  taskTitle: string | null  // URL 파라미터에서 전달 (현재 항상 null)
}
```

### 변경 후

`BlockedPage`가 직접 storage에서 제목을 읽으므로 props가 제거된다.

```typescript
// props 없음 — 컴포넌트 내부에서 chrome.storage.local에서 직접 읽음
function BlockedPage(): JSX.Element
```

### 호출자 (`index.tsx`) 변경

```typescript
// 변경 전
<BlockedPage taskTitle={taskTitle} />

// 변경 후
<BlockedPage />
```

---

## 4. 렌더링 계약 (UI 출력 명세)

차단 화면이 렌더링해야 하는 요소와 조건이다.

| 요소 | 항상 표시 | 조건부 표시 | 비고 |
|---|---|---|---|
| 집중 아이콘 (시각적 강조) | ✅ | — | 화면 상단 배치 |
| 집중 경고 제목 | ✅ | — | 고정 문구 |
| 집중 유도 부제목 | ✅ | — | 고정 문구 |
| 진행 중인 할일 제목 | — | `taskTitle !== null` | 강조 스타일 |
| 차단 해제 안내 문구 | ✅ | — | 팝업 안내 포함 |

---

## 5. 기존 계약 (변경 없음)

다음 계약은 이 기능으로 인해 변경되지 않는다.

| 계약 | 상태 | 설명 |
|---|---|---|
| `blocking.ts` → DNR redirect | **유지** | `/pages/blocked/index.html`로 단순 리디렉트 (파라미터 없음) |
| `message-handler.ts` → storage 쓰기 | **유지** | `activeTaskTitle` 저장/초기화 로직 변경 없음 |
| Message types (`messages.ts`) | **유지** | 새 메시지 타입 추가 없음 |
| `StorageSchema` 인터페이스 | **유지** | 필드 추가/수정 없음 |
