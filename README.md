# face 콕 — Frontend

제52회 용마대동제 소개팅 부스 웹서비스의 **프론트엔드 전용** 레포입니다.
백엔드는 [`facecook-be`](https://github.com/seoil-power-rangers/facecook-be)
(Java Spring Boot)로 분리되어 있습니다.

---

## 실행

```bash
npm install
npm run dev
```

http://localhost:3000

시작 화면은 QR 진입입니다.

---

## 화면 목록

| 주소 | 화면 |
| --- | --- |
| `/` | QR 진입 |
| `/login` | 로그인 (관리자 로그인 포함) |
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
| `/match` | 매칭 목록 |
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
  각 화면 폴더 안에 그 화면이 쓰는 mock 데이터(*.mock.ts)가 같이 있다

public/    정적 파일
```

경로 별칭: `@/*` → `src/*`, `@ui/*` → `ui/*`

---

## 범위

이 레포는 화면(`ui/`, `src/app`)만 다룹니다. 백엔드 로직(인증, DB 접근,
API 서버)은 `facecook-be`의 책임이고 이 레포에 두지 않습니다.

작업 방식은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 따릅니다.
