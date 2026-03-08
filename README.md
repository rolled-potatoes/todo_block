# Todoist 집중 차단기

Todoist의 오늘 할일을 기반으로 집중을 방해하는 사이트를 차단하는 Chrome 확장 프로그램입니다.
할일을 "진행 중"으로 설정하면 지정한 차단 사이트에 접근할 수 없게 되고, 완료 또는 중단 시 차단이 해제됩니다.

## 주요 기능

- **Todoist 오늘 할일 표시** — 오늘 마감인 할일 목록을 팝업에서 바로 확인
- **집중 모드 활성화** — 할일을 "진행 중"으로 설정하면 차단 사이트에 접근 불가
- **차단 화면** — 차단된 사이트 방문 시 집중 메시지와 현재 진행 중인 할일이 표시되는 전체 화면 표시
- **차단 사이트 관리** — 도메인 단위로 차단 사이트 추가/삭제, 현재 탭 도메인 자동 입력
- **확장 아이콘 배지** — 집중 모드 활성 시 아이콘에 "ON" 배지 표시
- **Todoist 자동 동기화** — 할일 완료 시 Todoist에 자동으로 완료 처리

## 기술 스택

- TypeScript 5 (strict 모드) + React 18
- Vite + CRXJS (Chrome Extension 번들러)
- Chrome Extension Manifest V3 (`declarativeNetRequest`, `chrome.storage.local`)
- Todoist REST API v2

---

## 확장 프로그램 설치법

### 사전 요구사항

- Node.js 18 이상
- Chrome 116 이상
- Todoist 계정 및 API 토큰

### 설치 순서

**1. 저장소 클론 및 의존성 설치**

```bash
git clone <저장소 URL>
cd todo_block
npm install
```

**2. 프로덕션 빌드**

```bash
npm run build
```

`dist/` 디렉토리에 빌드 결과물이 생성됩니다.

**3. Chrome에 확장 프로그램 로드**

1. Chrome 주소창에 `chrome://extensions` 입력
2. 오른쪽 상단 **개발자 모드** 토글 활성화
3. **압축 해제된 확장 프로그램 로드** 클릭
4. 프로젝트 내 `dist/` 폴더 선택
5. 확장 프로그램 아이콘이 툴바에 나타납니다

---

## 사용법

### 최초 설정 — Todoist API 토큰 입력

1. 툴바의 확장 프로그램 아이콘 클릭
2. 팝업에 API 토큰 입력 화면이 나타납니다
3. [Todoist 설정 > 통합 > 개발자](https://todoist.com/app/settings/integrations/developer) 페이지에서 API 토큰 복사
4. 입력란에 붙여넣고 **저장** 클릭
5. 오늘의 할일 목록이 자동으로 불러와집니다

### 할일 관리

| 버튼 | 동작 |
|------|------|
| **진행** | 해당 할일을 진행 중으로 설정, 차단 사이트 접근 차단 시작, 아이콘에 "ON" 배지 표시 |
| **중단** | 진행 중 상태 해제, 차단 사이트 접근 차단 해제 |
| **완료** | 차단 해제 + Todoist에 해당 할일 완료 처리 |

> 동시에 하나의 할일만 진행 중 상태로 설정할 수 있습니다. 새 할일을 진행으로 바꾸면 기존 할일은 자동으로 중단됩니다.

### 차단 사이트 관리

1. 팝업 하단 **차단 사이트 관리** 섹션으로 이동
2. 입력란에 현재 탭의 도메인이 자동으로 입력됩니다
3. **추가** 버튼 클릭으로 차단 목록에 등록
4. 목록의 **삭제** 버튼으로 제거 가능

---

## 로컬 개발 방법

### 개발 서버 실행

```bash
npm run dev
```

Vite + CRXJS가 실행되어 `dist/` 폴더에 빌드 결과물을 생성하고 변경 사항을 자동으로 반영합니다.

> **팝업/페이지 변경** — HMR(Hot Module Replacement)이 적용되어 자동으로 반영됩니다.
>
> **백그라운드 서비스 워커 변경** — `chrome://extensions` 페이지에서 해당 확장 프로그램의 **새로고침** 버튼을 클릭해야 합니다.

### 테스트

```bash
npm test                   # 전체 테스트 단회 실행
npm run test:watch         # TDD 워치 모드
npm run test:coverage      # 커버리지 리포트 포함 실행
```

### 린트 및 타입 체크

```bash
npm run lint               # ESLint 검사
npm run lint:fix           # 자동 수정 가능한 lint 오류 수정
npm run type-check         # TypeScript 타입 체크 (emit 없음)
```

### 프로젝트 구조

```
src/
├── background/        # 서비스 워커 (비즈니스 로직, API 호출, 차단 규칙 관리)
├── popup/             # React 팝업 UI
│   └── components/    # 할일 목록, 차단 사이트 관리 등 컴포넌트
├── pages/
│   └── blocked/       # 차단 화면 페이지 (전체 화면)
├── content/           # 콘텐츠 스크립트
└── shared/            # 공통 타입, 스토리지 래퍼, 유틸리티
```
