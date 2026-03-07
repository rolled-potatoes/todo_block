# 빠른 시작 가이드: Todoist 집중 차단기

**Feature**: 001-todoist-focus-blocker
**Date**: 2026-03-06

## 사전 요구사항

- Node.js 18+
- npm 또는 pnpm
- Chrome 브라우저 (116+)
- Todoist 계정 및 API 토큰 ([Todoist 설정 > 연동](https://todoist.com/app/settings/integrations/developer)에서 발급)

## 프로젝트 설정

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

Vite + CRXJS가 개발 모드로 빌드하며 HMR을 활성화한다.

### 3. Chrome에 익스텐션 로드

1. Chrome에서 `chrome://extensions` 접속
2. "개발자 모드" 활성화 (우상단 토글)
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. 프로젝트의 `dist/` 폴더 선택
5. 익스텐션 아이콘이 툴바에 표시됨

### 4. API 토큰 설정

1. 툴바의 익스텐션 아이콘 클릭 → 팝업 열기
2. "Todoist 연동 설정" 안내 표시됨
3. [Todoist 설정 > 연동 > 개발자](https://todoist.com/app/settings/integrations/developer)에서 API 토큰 복사
4. 토큰 입력 후 저장
5. 오늘의 할일 목록이 표시됨

## 테스트 실행

```bash
# 전체 테스트 실행
npm run test

# 감시 모드 (TDD 개발 시)
npm run test:watch

# 커버리지 리포트
npm run test:coverage
```

## 프로덕션 빌드

```bash
npm run build
```

`dist/` 폴더에 최종 빌드 결과물이 생성된다.
Chrome Web Store에 업로드하거나 `chrome://extensions`에서 로드할 수 있다.

## 핵심 디렉토리 구조

```text
src/
├── background/          # Service Worker (차단 로직, Todoist API)
├── popup/               # React Popup UI (할일 목록, 차단 관리)
│   └── components/
├── pages/               # 차단 안내 페이지
│   └── blocked/
├── shared/              # 공유 타입, Storage 래퍼, 유틸리티
│   └── types/
└── content/             # Content Script
```

## 주요 npm 스크립트

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 + HMR |
| `npm run build` | 프로덕션 빌드 |
| `npm run test` | 테스트 실행 |
| `npm run test:watch` | TDD 감시 모드 |
| `npm run test:coverage` | 테스트 커버리지 |
| `npm run lint` | 린트 검사 |
