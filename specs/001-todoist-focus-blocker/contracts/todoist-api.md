# 외부 API 계약: Todoist REST API v2

**Feature**: 001-todoist-focus-blocker
**Date**: 2026-03-06

이 문서는 익스텐션이 사용하는 Todoist REST API v2 엔드포인트의 계약을 정의한다.

## 공통 사항

**Base URL**: `https://api.todoist.com/rest/v2`
**인증**: 모든 요청 헤더에 `Authorization: Bearer {API_TOKEN}` 포함
**Rate Limit**: 15분당 450회 (초과 시 429 응답)

---

## 사용 엔드포인트

### 1. 오늘 할일 조회

```
GET /tasks?filter=today
```

**요청**:
- Headers: `Authorization: Bearer {token}`
- Query: `filter=today`

**응답 (200 OK)**:
```json
[
  {
    "id": "2995104339",
    "content": "프로젝트 계획서 작성",
    "description": "",
    "is_completed": false,
    "due": {
      "date": "2026-03-06",
      "datetime": null,
      "timezone": null,
      "string": "오늘"
    },
    "priority": 1,
    "url": "https://todoist.com/showTask?id=2995104339"
  }
]
```

**사용 필드**:
| 필드 | 용도 |
|------|------|
| `id` | TodoItem.id로 매핑 |
| `content` | 할일 제목 표시 |
| `description` | 할일 설명 표시 (선택) |
| `is_completed` | 완료 여부 확인 (보통 false, 완료된 건 필터에서 제외됨) |
| `due` | 마감일 정보 |
| `priority` | 우선순위 표시 (선택) |

**오류 응답**:
| 상태 코드 | 의미 | 익스텐션 대응 |
|-----------|------|--------------|
| 401 | 토큰 무효 | `INVALID_TOKEN` 오류 → 토큰 재설정 안내 |
| 429 | Rate Limit | `RATE_LIMIT` 오류 → 잠시 후 재시도 안내 |
| 5xx | 서버 오류 | `SERVER_ERROR` 오류 → 재시도 옵션 표시 |

---

### 2. 할일 완료 처리

```
POST /tasks/{task_id}/close
```

**요청**:
- Headers: `Authorization: Bearer {token}`
- Body: 없음

**응답 (204 No Content)**:
- 본문 없음

**오류 응답**:
| 상태 코드 | 의미 | 익스텐션 대응 |
|-----------|------|--------------|
| 401 | 토큰 무효 | `INVALID_TOKEN` 오류 |
| 404 | 작업 없음 | `TASK_NOT_FOUND` 오류 → 할일 목록 새로고침 |
| 429 | Rate Limit | `RATE_LIMIT` 오류 |
| 5xx | 서버 오류 | `TODOIST_SYNC_FAILED` 오류 → 로컬에서는 완료 처리, Todoist 동기화 실패 알림 |

---

## 호스트 권한 요구사항

`manifest.json`에 다음 호스트 권한이 필요:

```json
{
  "host_permissions": [
    "https://api.todoist.com/*"
  ]
}
```

이 권한은 Service Worker에서 Todoist API에 대한 `fetch` 호출을 CORS 제한 없이 수행하기 위해 필요하다.
