# 콕찔러보기 — Frontend

제52회 용마대동제 소개팅 부스 웹서비스의 **프론트엔드 전용** 레포입니다.
백엔드는 [`facecook-be`](https://github.com/seoil-power-rangers/facecook-be)
(Java Spring Boot)로 분리되어 있습니다.

---

## 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

http://localhost:3000

로컬 프론트엔드는 `.env.local`의 `NEXT_PUBLIC_API_BASE_URL`을 사용해
`http://localhost:8080/api/...`의 백엔드 API를 호출합니다.

시작 화면은 로그인입니다. `/`로 들어오면 `/login`으로 넘어갑니다.

---

## 화면 목록

| 주소 | 화면 |
| --- | --- |
| `/` | `/login`으로 리다이렉트 (PWA start_url) |
| `/login` | 로그인 · 가입 진입 (관리자 로그인 포함) |
| `/onboarding/email` | 이메일 인증 |
| `/onboarding/basic` | 필수 프로필 |
| `/onboarding/mbti` | MBTI |
| `/onboarding/hobby` | 취미 |
| `/onboarding/optional` | 선택 프로필 |
| `/onboarding/done` | 온보딩 완료 |
| `/main` | 참가자 목록 |
| `/kok` | 받은 콕 |
| `/profile/[userId]` | 프로필 상세 + 콕 보내기 |
| `/profile/[userId]/report` | 신고 |
| `/match` | 채팅방 목록 |
| `/match/[roomId]` | 채팅 |
| `/match/[roomId]/matched` | 매칭 성사 |
| `/match/[roomId]/mission` | 미션 |
| `/mypage` | 마이페이지 |
| `/admin/dashboard` | 관리자 통계 |
| `/admin/mission` | 미션 완료 처리 |
| `/admin/report` | 신고 검토 |
| `/admin/chat/[reportId]` | 채팅 열람 |

---

## 폴더 구조

```text
src/app/   라우팅 (Next.js App Router)
           대부분 page.tsx는 route param만 받아서 ui/의 화면 컴포넌트에
           그대로 넘기는 얇은 래퍼다. 여기에 데이터 로직을 넣지 않는다.

ui/        실제 화면 컴포넌트
  공통/    버튼, 입력창 등 공용 컴포넌트
  각 화면 폴더 안에 그 화면이 쓰는 API 호출(*Api.ts)이 같이 있다

public/    정적 파일
```

경로 별칭: `@/*` → `src/*`, `@ui/*` → `ui/*`

---

## PWA (홈 화면에 추가)

참가자가 브라우저 대신 홈 화면 앱으로 쓸 수 있습니다. 아이폰은 이렇게
설치돼 있어야 웹 푸시가 오기 때문에([기능명세](./docs/기능명세.md) 8절)
선택이 아니라 사실상 필수입니다.

| 파일 | 역할 |
| --- | --- |
| `src/app/manifest.ts` | 앱 이름·아이콘·시작 주소. `/manifest.webmanifest`로 서빙된다 |
| `public/push-sw.js` | 서비스워커. 푸시 수신 + 설치 조건용 fetch 핸들러 |
| `public/offline.html` | 네트워크가 끊긴 채로 화면을 이동할 때만 보이는 대체 화면 |
| `ui/공통/PwaBootstrap.tsx` | 앱 진입 시 서비스워커 등록 + 설치 프롬프트 수신 |
| `ui/공통/pwaInstall.ts` | 설치 상태 저장소 (`usePwaInstall`) |
| `public/icon-*.png` | 홈 화면 아이콘 (192 / 512 / maskable 512) |

설치 버튼은 **마이페이지**의 푸시 알림 바로 위에 있습니다. 안드로이드·PC는
버튼을 누르면 브라우저 설치창이 뜨고, 아이폰은 사파리에 설치 API가 없어서
「공유 → 홈 화면에 추가」 안내 시트를 대신 띄웁니다.

설치가 가능하려면 **HTTPS**여야 합니다. 배포(Vercel)는 기본으로 만족하고,
로컬은 `http://localhost`가 예외로 허용됩니다.

---

## 범위

이 레포는 화면(`ui/`, `src/app`)만 다룹니다. 백엔드 로직(인증, DB 접근,
API 서버)은 `facecook-be`의 책임이고 이 레포에 두지 않습니다.

작업 방식은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 따릅니다.
