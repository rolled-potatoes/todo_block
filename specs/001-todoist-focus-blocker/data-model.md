# 데이터 모델: Todoist 집중 차단기

**Feature**: 001-todoist-focus-blocker
**Date**: 2026-03-06

## 엔티티 정의

### 1. TodoItem (할일 항목)

Todoist에서 가져온 오늘의 할일. 익스텐션 내부 상태 관리용.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | `string` | Y | Todoist 작업 고유 ID |
| `content` | `string` | Y | 할일 제목 |
| `description` | `string` | N | 할일 설명 (빈 문자열 가능) |
| `status` | `TodoStatus` | Y | 익스텐션 내 상태: `idle` \| `in_progress` \| `completed` |
| `due` | `DueDate \| null` | N | 마감일 정보 |
| `priority` | `number` | Y | Todoist 우선순위 (1~4) |
| `todoistUrl` | `string` | N | Todoist 앱 내 작업 링크 |

**상태 전이 다이어그램 (`TodoStatus`)**:

```text
                 ┌──────────────┐
                 │              │
    ┌────────────▼──────────┐   │
    │        idle           │   │ (중단)
    │   (기본 상태/중단)     │   │
    └───────┬───────────────┘   │
            │ "진행" 버튼       │
            ▼                   │
    ┌───────────────────────┐   │
    │     in_progress       ├───┘
    │   (진행 중 - 차단 활성)│
    └───────┬───────────────┘
            │ "완료" 버튼
            ▼
    ┌───────────────────────┐
    │      completed        │
    │  (완료 - Todoist 동기) │
    └───────────────────────┘
```

**상태 전이 규칙**:
- `idle` → `in_progress`: 사용자가 "진행" 버튼 클릭. 다른 `in_progress` 항목이 있으면 해당 항목을 `idle`로 자동 전환
- `in_progress` → `idle`: 사용자가 "중단" 버튼 클릭. 차단 즉시 해제
- `in_progress` → `completed`: 사용자가 "완료" 버튼 클릭. 차단 해제 + Todoist 완료 API 호출
- `idle` → `completed`: 사용자가 진행하지 않고 바로 완료 처리. Todoist 완료 API 호출
- `completed` → (전이 없음): 완료된 할일은 상태 변경 불가 (목록에서 제거되거나 비활성 표시)

**유효성 검증**:
- `id`는 비어있을 수 없음
- `content`는 비어있을 수 없음
- `status`는 `idle` | `in_progress` | `completed` 중 하나
- 동시에 최대 1개의 TodoItem만 `in_progress` 가능 (FR-003)

---

### 2. DueDate (마감일 정보)

Todoist API에서 반환되는 마감일 객체의 서브셋.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `date` | `string` | Y | 마감 날짜 (YYYY-MM-DD) |
| `datetime` | `string \| null` | N | 마감 일시 (RFC 3339, 시간 포함) |
| `timezone` | `string \| null` | N | 타임존 |

---

### 3. BlockedSite (차단 사이트)

사용자가 등록한 차단 대상 웹사이트.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `id` | `number` | Y | 차단 규칙 고유 ID (declarativeNetRequest 규칙 ID로 사용) |
| `domain` | `string` | Y | 차단 대상 도메인 (예: `youtube.com`) |
| `addedAt` | `number` | Y | 추가 시각 (Unix timestamp ms) |

**유효성 검증**:
- `id`는 양의 정수
- `domain`은 유효한 도메인 형식 (프로토콜, 경로 제외)
- `domain`은 중복 등록 불가
- 서브도메인은 자동 포함 (DNR `||domain.com` 패턴)

---

### 4. UserSettings (사용자 설정)

익스텐션의 전체 사용자 설정.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `apiToken` | `string \| null` | N | Todoist API 토큰 (null이면 미설정 상태) |
| `blockedSites` | `BlockedSite[]` | Y | 차단 사이트 목록 |
| `activeTaskId` | `string \| null` | N | 현재 "진행" 상태인 할일의 Todoist ID (null이면 진행 중 없음) |

**유효성 검증**:
- `apiToken`이 null이면 Todoist 연동 불가 → 설정 안내 UI 표시
- `blockedSites`는 빈 배열 허용 (차단 목록 없이 진행 가능, FR 스펙)
- `activeTaskId`는 반드시 0개 또는 1개 (FR-003)

---

## Chrome Storage 스키마

`chrome.storage.local`에 저장되는 키-값 구조:

```typescript
interface StorageSchema {
  // 사용자 설정
  apiToken: string | null;
  
  // 차단 사이트 목록
  blockedSites: BlockedSite[];
  
  // 현재 진행 중인 할일 ID
  activeTaskId: string | null;
  
  // 다음 차단 규칙에 사용할 ID (자동 증가)
  nextRuleId: number;
}
```

**저장소 설계 결정**:
- 할일 목록(`TodoItem[]`)은 Storage에 캐시하지 않음 → 팝업 열 때마다 Todoist API에서 최신 조회 (스펙 가정 준수)
- `activeTaskId`만 Storage에 저장하여 브라우저 재시작 후에도 진행 상태 복원 가능
- `blockedSites`는 브라우저 세션 간 영속성 필요 (FR-009)
- `nextRuleId`로 declarativeNetRequest 규칙 ID 충돌 방지

## 엔티티 관계

```text
UserSettings (1)
  ├── apiToken (Todoist 인증)
  ├── activeTaskId ──── references ──── TodoItem.id (0..1)
  └── blockedSites (0..N)
        └── BlockedSite.id ──── maps to ──── declarativeNetRequest Rule ID

TodoItem (0..N) ← Todoist API에서 조회 (캐시 없음)
  └── status: idle | in_progress | completed
        └── in_progress ──── activates ──── BlockedSite[] 차단 규칙
```
