# 내부 메시지 계약: Chrome Message Passing

**Feature**: 001-todoist-focus-blocker
**Date**: 2026-03-06

이 문서는 크롬 익스텐션 레이어 간 통신(Message Passing)의 계약을 정의한다.
모든 레이어 간 통신은 `chrome.runtime.sendMessage` / `chrome.runtime.onMessage`를 통해 이루어진다.

## 메시지 형식

모든 메시지는 다음 기본 구조를 따른다:

```typescript
interface Message<T extends string, P = undefined> {
  type: T;
  payload: P;
}

interface MessageResponse<D = undefined> {
  success: boolean;
  data?: D;
  error?: string;
}
```

---

## Popup → Background 메시지

### 1. `FETCH_TODOS` - 오늘 할일 조회

```typescript
// 요청
{ type: "FETCH_TODOS" }

// 응답 (성공)
{
  success: true,
  data: TodoItem[]  // data-model.md 참조
}

// 응답 (실패)
{
  success: false,
  error: "INVALID_TOKEN" | "NETWORK_ERROR" | "RATE_LIMIT" | "SERVER_ERROR"
}
```

**트리거**: 팝업 열릴 때 자동 호출
**처리**: Background에서 Todoist REST API v2 `GET /tasks?filter=today` 호출

### 2. `UPDATE_TODO_STATUS` - 할일 상태 변경

```typescript
// 요청
{
  type: "UPDATE_TODO_STATUS",
  payload: {
    taskId: string;       // Todoist 작업 ID
    newStatus: TodoStatus; // "idle" | "in_progress" | "completed"
  }
}

// 응답 (성공)
{
  success: true,
  data: {
    updatedTask: TodoItem;
    previousActiveTask: TodoItem | null;  // in_progress → idle로 전환된 이전 활성 할일
    blockingActive: boolean;              // 차단이 활성화되었는지 여부
  }
}

// 응답 (실패)
{
  success: false,
  error: "INVALID_TOKEN" | "NETWORK_ERROR" | "TASK_NOT_FOUND" | "TODOIST_SYNC_FAILED"
}
```

**트리거**: 사용자가 할일의 상태 버튼 클릭
**처리**:
1. `in_progress`로 변경 시: 기존 활성 할일을 `idle`로 전환 → `activeTaskId` 갱신 → 차단 규칙 활성화
2. `idle`로 변경 시: `activeTaskId` = null → 차단 규칙 비활성화
3. `completed`로 변경 시: `activeTaskId` = null → 차단 규칙 비활성화 → Todoist `POST /tasks/{id}/close` 호출

### 3. `ADD_BLOCKED_SITE` - 차단 사이트 추가

```typescript
// 요청
{
  type: "ADD_BLOCKED_SITE",
  payload: {
    domain: string;  // 예: "youtube.com"
  }
}

// 응답 (성공)
{
  success: true,
  data: {
    site: BlockedSite;        // 추가된 차단 사이트
    totalBlocked: number;     // 전체 차단 사이트 수
  }
}

// 응답 (실패)
{
  success: false,
  error: "DUPLICATE_DOMAIN" | "INVALID_DOMAIN"
}
```

**트리거**: 사용자가 "현재 페이지 차단 추가" 버튼 클릭
**처리**: Storage에 BlockedSite 추가 → 현재 `activeTaskId`가 있으면 DNR 규칙도 즉시 추가

### 4. `REMOVE_BLOCKED_SITE` - 차단 사이트 제거

```typescript
// 요청
{
  type: "REMOVE_BLOCKED_SITE",
  payload: {
    siteId: number;  // BlockedSite.id
  }
}

// 응답 (성공)
{
  success: true,
  data: {
    removedDomain: string;
    totalBlocked: number;
  }
}

// 응답 (실패)
{
  success: false,
  error: "SITE_NOT_FOUND"
}
```

**트리거**: 사용자가 차단 목록에서 제거 버튼 클릭
**처리**: Storage에서 BlockedSite 제거 → DNR 규칙도 즉시 제거

### 5. `GET_BLOCKED_SITES` - 차단 사이트 목록 조회

```typescript
// 요청
{ type: "GET_BLOCKED_SITES" }

// 응답
{
  success: true,
  data: BlockedSite[]
}
```

**트리거**: 팝업 열릴 때 차단 목록 표시용

### 6. `SAVE_API_TOKEN` - API 토큰 저장

```typescript
// 요청
{
  type: "SAVE_API_TOKEN",
  payload: {
    token: string;
  }
}

// 응답 (성공 - 토큰 유효성 검증 포함)
{
  success: true
}

// 응답 (실패)
{
  success: false,
  error: "INVALID_TOKEN" | "NETWORK_ERROR"
}
```

**트리거**: 사용자가 설정 화면에서 API 토큰 입력 후 저장
**처리**: Todoist API 호출하여 토큰 유효성 검증 → 유효하면 Storage에 저장

### 7. `GET_CURRENT_TAB_DOMAIN` - 현재 탭 도메인 조회

```typescript
// 요청
{ type: "GET_CURRENT_TAB_DOMAIN" }

// 응답
{
  success: true,
  data: {
    domain: string | null;       // 현재 탭의 도메인 (null이면 추출 불가)
    isAlreadyBlocked: boolean;   // 이미 차단 목록에 있는지 여부
  }
}
```

**트리거**: 팝업 열릴 때 "현재 페이지 차단 추가/해제" 버튼 상태 결정용
**처리**: `chrome.tabs.query({ active: true, currentWindow: true })` → URL에서 도메인 추출

---

## Background → Popup 이벤트 (선택적)

현재 설계에서는 Popup이 요청-응답(Request-Response) 패턴만 사용하므로
Background → Popup 단방향 이벤트는 불필요하다. 팝업은 열릴 때마다 최신 상태를 조회한다.

향후 실시간 상태 동기화가 필요해지면 `chrome.runtime.sendMessage`를 Background에서
Popup으로 보내는 패턴을 추가할 수 있다.

---

## declarativeNetRequest 규칙 계약

차단 규칙이 활성화될 때 Background에서 생성하는 DNR 규칙 형식:

```typescript
// 각 BlockedSite에 대응하는 DNR 규칙
{
  id: BlockedSite.id,        // BlockedSite.id를 규칙 ID로 사용
  priority: 1,
  action: {
    type: "redirect",
    redirect: {
      extensionPath: "/src/pages/blocked/index.html"
    }
  },
  condition: {
    urlFilter: `||${BlockedSite.domain}`,
    resourceTypes: ["main_frame"]
  }
}
```

**활성화 시점**: `activeTaskId`가 non-null이 될 때 모든 BlockedSite에 대한 규칙 일괄 추가
**비활성화 시점**: `activeTaskId`가 null이 될 때 모든 규칙 일괄 제거
