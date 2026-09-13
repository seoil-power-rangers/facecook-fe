# facecook-fe — 에이전트 작업 지침

이 문서는 AI 에이전트(Claude 등)가 이 레포에서 작업할 때 참고하는 진입점이다.

## 1. 이 레포가 뭔지

`face 콕`(제52회 용마대동제 소개팅 부스) 서비스의 **프론트엔드 전용** 레포다.
Next.js(App Router)로 만들어졌다. 백엔드는 `facecook-be`(Java Spring Boot)
레포에 있다.

**작업 전에 [CONTRIBUTING.md](./CONTRIBUTING.md)와 [README.md](./README.md)를
먼저 읽는다.**

## 2. 경계

- 백엔드 로직(인증, DB 접근, 세션 검증 등)을 이 레포에 만들지 않는다.
  `function/`, `db/`, `src/app/api/` 같은 자체 API 라우트/서버 로직은 두지
  않는다 — 전부 `facecook-be`의 책임이다
- 데이터는 `facecook-be`의 REST API를 fetch로 호출해서 받는다. 화면이
  당장 붙일 API가 없으면 해당 화면 폴더 안의 `*.mock.ts`로 대체한다
- `docs/API명세.md`, `docs/ERD.md`는 이 레포에서도 참고하지만 **원본은
  `facecook-be`**다. 여기서 임의로 고치지 않는다 — API 계약이 안 맞으면
  `facecook-be` 쪽에 갱신을 요청하고, 반영되면 이 레포의 사본도 같이
  갱신한다
- `docs/`에는 API명세·ERD 외에도 기능명세·인프라설계·보안체크리스트·
  테스트_장애대응·CICD·온보딩 문서가 있다. 화면 관련 결정이 바뀌면 해당
  문서도 같이 갱신한다

## 3. 구조

- `src/app/**` — 라우팅. 대부분 `page.tsx`는 route param을 받아서 `ui/`의
  화면 컴포넌트에 그대로 넘기는 **얇은 래퍼**다. 여기에 데이터 로직을 넣지
  않는다
- `ui/` — 실제 화면 컴포넌트. 공통 UI는 `ui/공통/`에 있다. 화면이 쓰는
  API 호출은 같은 폴더의 `*Api.ts`에 모아둔다
- 경로 별칭: `@/*` → `src/*`, `@ui/*` → `ui/*`

## 4. 실행

```bash
npm install
npm run dev
```

빌드 확인: `npm run build`.

## 5. Git 커밋 규칙

- 브랜치·커밋 타입·PR 규칙은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 따른다
- **커밋 메시지에 `Co-Authored-By: Claude` 트레일러를 붙이지 않는다.** 이
  레포 팀 컨벤션이다
