# 기술 리서치: Todoist 집중 차단기

**Feature**: 001-todoist-focus-blocker
**Date**: 2026-03-06
**Status**: 완료

## 1. 사이트 차단 API 선택

### Decision
**`chrome.declarativeNetRequest` (DNR) API** 사용

### Rationale
- Manifest V3에서 `webRequestBlocking` 권한은 일반 확장 프로그램에서 사용 불가 (엔터프라이즈 전용)
- DNR은 브라우저 코어 레벨에서 규칙을 처리하여 Service Worker를 깨우지 않으므로 성능 우수
- 확장 프로그램이 사용자의 네트워크 요청 내역을 직접 읽을 수 없어 프라이버시 보호 (최소 권한 원칙 부합)
- Constitution 원칙 III "최소 권한 원칙" 충족

### Alternatives Considered
| 대안 | 탈락 이유 |
|------|-----------|
| `chrome.webRequest` (Blocking) | MV3에서 일반 확장 프로그램의 `webRequestBlocking` 사용 불가. 관찰 모드만 가능 |
| Content Script `window.location.replace` | 페이지 로드 후 리다이렉트되어 FOUC 발생. 네트워크 레벨 차단이 아님 |

### 핵심 구현 포인트

**Permissions (manifest.json)**:
- `"declarativeNetRequest"` 권한 필수
- 리다이렉트 사용 시 `"declarativeNetRequestWithHostAccess"` + `host_permissions` 필요
- 단순 차단(block)만이라면 host_permissions 불필요하나, 차단 안내 페이지 리다이렉트를 위해
  `redirect` action 사용 → `host_permissions: ["<all_urls>"]` 또는 개별 도메인 필요

**동적 규칙 관리 (`updateDynamicRules`)**:
- `chrome.declarativeNetRequest.updateDynamicRules({ addRules, removeRuleIds })` 사용
- 규칙 추가/삭제를 한 번의 API 호출로 원자적 수행 가능
- 동적 + 세션 규칙 합산 최대 **30,000개** (사용자 차단 목록에 충분)

**도메인 + 서브도메인 차단 패턴**:
- `urlFilter: "||example.com"` → example.com, www.example.com, m.example.com 모두 매칭
- `resourceTypes: ["main_frame"]` → 최상위 문서 로딩만 차단 (하위 리소스 제외)

**차단 안내 페이지 리다이렉트**:
- `action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } }`
- 확장 프로그램 내부 HTML 페이지로 리다이렉트 가능
- 차단 페이지에서 현재 진행 중인 할일 제목 표시 가능 (query parameter 또는 storage 조회)

**Service Worker 동적 제어 패턴**:
- 팝업 → `chrome.runtime.sendMessage` → Service Worker → `updateDynamicRules`
- 규칙은 브라우저 네이티브 레벨에서 동작하므로 Service Worker 비활성 상태에서도 차단 유지
- Service Worker 종료 후에도 규칙이 영속됨 (브라우저 재시작까지 유지)

---

## 2. Todoist REST API v2

### Decision
**Todoist REST API v2** 사용 (Sync API 대비 단순하고 직관적)

### Rationale
- 할일 조회 + 완료 처리만 필요한 단순 유스케이스에 적합
- Sync API는 복잡한 동기화 로직이 필요하여 YAGNI 위반
- REST API v2는 `filter` 파라미터로 "today" 할일 직접 조회 가능

### API 엔드포인트

**인증**:
- 모든 요청 헤더: `Authorization: Bearer {API_TOKEN}`

**오늘 할일 조회**:
- URL: `GET https://api.todoist.com/rest/v2/tasks?filter=today`
- Response: Task 객체 JSON 배열

**Task 객체 주요 필드**:
| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | String | 작업 고유 ID |
| `content` | String | 작업 제목 |
| `description` | String | 작업 설명 |
| `is_completed` | Boolean | 완료 여부 |
| `due` | Object | 마감일 정보 (`date`, `datetime`, `timezone`, `string`) |
| `priority` | Integer | 우선순위 (1~4) |

**할일 완료 처리**:
- URL: `POST https://api.todoist.com/rest/v2/tasks/{task_id}/close`
- Response: `204 No Content` (성공 시 본문 없음)

**Rate Limit**:
- 15분당 최대 450회 요청
- 응답 헤더: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 초과 시: `429 Too Many Requests`

**오류 처리**:
| 상태 코드 | 의미 | 대응 |
|-----------|------|------|
| 400 | 잘못된 요청 파라미터 | 요청 파라미터 검증 |
| 401 | 토큰 누락/만료 | 토큰 재입력 안내 UI 표시 |
| 403 | 권한 없음 | 오류 메시지 표시 |
| 404 | 리소스 없음 | 할일 목록 새로고침 |
| 429 | Rate Limit 초과 | Exponential Backoff 재시도 |
| 5xx | 서버 오류 | 잠시 후 재시도 안내 |

### 크롬 익스텐션 CORS/권한 주의사항
- Service Worker에서 Todoist API 호출 시 `manifest.json`에 호스트 권한 필요
- `"host_permissions": ["https://api.todoist.com/*"]`
- Service Worker 유휴 종료 주의: 긴 폴링 대신 `chrome.alarms` 사용
- 오프라인 시 `fetch` TypeError 처리 필요

---

## 3. CRXJS + Vite + React 개발 패턴

### Decision
**CRXJS Vite Plugin** 기반 프로젝트 구조 채택

### Rationale
- `manifest.json`을 단일 진입점(Single Source of Truth)으로 사용하여 번들링 자동화
- React Popup에 HMR(Hot Module Replacement) 지원으로 빠른 개발 가능
- Vite 설정을 Vitest와 공유 가능하여 테스트 환경 구성 간소화
- Constitution 원칙 I "SRP 레이어 분리"에 부합하는 디렉토리 구조 자연스럽게 적용

### 추천 프로젝트 구조
```text
src/
├── background/          # Service Worker (차단 로직, Todoist API 호출)
│   └── index.ts
├── popup/               # React Popup UI (할일 목록, 차단 관리)
│   ├── index.html
│   ├── index.tsx
│   └── components/
├── pages/               # 차단 안내 페이지 등 독립 페이지
│   └── blocked/
│       ├── index.html
│       └── index.tsx
├── shared/              # 공유 타입, 유틸리티, Storage 래퍼
│   ├── types/
│   ├── hooks/
│   └── storage.ts
└── content/             # Content Script (현재 페이지 도메인 추출 등)
    └── index.ts
```

### 테스트 전략
- **테스트 러너**: Vitest (Vite 설정 공유, 빠른 실행 속도)
- **UI 테스트**: React Testing Library (사용자 관점 테스트)
- **Chrome API 모킹**: `setupTests.ts`에서 `global.chrome` 모킹
  - `chrome.storage.local.get/set` → `vi.fn()`
  - `chrome.runtime.sendMessage` → `vi.fn()`
  - `chrome.declarativeNetRequest.updateDynamicRules` → `vi.fn()`
- **테스트 파일 배치**: Colocation (구현 파일 옆에 `*.test.ts(x)` 배치)
- **단위 테스트**: 순수 비즈니스 로직은 chrome API 의존 없이 독립 테스트
- **통합 테스트**: Message Passing 콜백에 Mock Request 주입하여 테스트

### 핵심 설정 요약
- `vite.config.ts`: `@vitejs/plugin-react` + `@crxjs/vite-plugin` 사용
- `manifest.json`: CRXJS가 파싱하여 엔트리포인트 자동 감지
- Background Service Worker: 이벤트 리스너 최상위 등록 (지연 등록 불가)
- Storage 래퍼: TypeScript 제네릭으로 타입 안전한 `useStorage` 훅 구현

---

## 해소된 NEEDS CLARIFICATION 항목

| 항목 | 해소 결과 |
|------|-----------|
| 사이트 차단 API 선택 | `chrome.declarativeNetRequest` 확정 |
| 최소 권한 원칙 (Constitution 원칙 III) | DNR은 네트워크 요청 내용을 읽지 않으므로 최소 권한 원칙 충족. 리다이렉트를 위한 host_permissions는 불가피하나 기능 수행에 필수적 |
| Todoist API 호출 방식 | REST API v2 `filter=today` 사용, Service Worker에서 `fetch` 직접 호출 |
| 크롬 익스텐션 CORS | `host_permissions`에 Todoist API 도메인 추가로 해결 |
| 테스트 환경 (Chrome API 모킹) | `setupTests.ts`에서 `vi.fn()` 기반 글로벌 모킹 |
