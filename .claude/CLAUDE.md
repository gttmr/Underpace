# Underpace — Claude Code 가이드

러닝 클럽 Underpace의 모임 신청·관리 웹앱.
Next.js 16 App Router + Prisma + PostgreSQL + Tailwind CSS.

---

## 프로젝트 구조

```
src/
├── app/
│   ├── page.tsx                  — 홈 (캘린더 + 리스트 탭)
│   ├── meeting/[id]/page.tsx     — 모임 상세 + 신청 폼
│   ├── signup/confirm/page.tsx   — 신청 완료
│   ├── marathon/[id]/page.tsx    — 대회 상세
│   ├── profile/page.tsx          — 내 프로필
│   ├── coach/page.tsx            — 코치 소개
│   ├── schedule/                 — 일정 관련
│   ├── admin/                    — 관리자 (로그인, 대시보드, 모임/멤버/공지/일정 관리)
│   ├── api/                      — Route Handlers
│   └── globals.css               — 디자인 토큰 + CSS 컴포넌트 클래스
├── components/
│   ├── ui/                       — StatusBadge, CapacityBar 등 공용 UI
│   ├── meeting/                  — MeetingCard, SignupForm
│   ├── schedule/                 — CalendarView, ScheduleView, SchedulePageContent
│   ├── admin/                    — AdminLayout
│   └── notifications/            — NotificationBell
└── lib/
    ├── db.ts                     — Prisma 클라이언트
    ├── types.ts                  — 공용 타입
    ├── auth.ts                   — 관리자 인증
    └── meetingSignup.ts          — 신청 가능 여부 판단 유틸

prisma/schema.prisma              — DB 스키마
docs/design.md                   — 프론트엔드 철학 레퍼런스
```

---

## 기술 스택

- **프레임워크**: Next.js 16 App Router (TypeScript)
- **스타일**: Tailwind CSS + CSS 변수 기반 디자인 토큰
- **DB**: PostgreSQL + Prisma ORM
- **배포**: Vercel (main 브랜치 자동 배포)
- **폰트**: Pretendard (한국어)

---

## 디자인 토큰 규칙

**하드코딩 hex 절대 금지.** `bg-[#001d6e]` 같은 Tailwind 임의값 대신 토큰을 쓴다.

### 핵심 토큰

| 용도 | 클래스 |
|------|--------|
| 주요 배경/버튼 | `bg-brand-primary` |
| 보조 배경/카드 헤더 | `bg-brand-surface` |
| 페이지 배경 | `bg-brand-page` |
| 카드 테두리 | `border-brand-primary-border` |
| 기본 텍스트 | `text-brand-text` |
| 보조 텍스트 | `text-brand-text-muted` |
| 희미한 텍스트 | `text-brand-text-subtle` |
| 비활성 배경 | `bg-brand-dimmed text-brand-dimmed-text` |

### CSS 컴포넌트 클래스 (globals.css 정의)

```
.brand-button-primary     — 주요 버튼 (hover/disabled 내장)
.brand-button-secondary   — 보조 버튼
.brand-input              — 입력 필드 (focus ring 내장)
.brand-input-dimmed       — 읽기전용 입력
.brand-chip-soft          — 연한 칩 (대기, 보조 상태)
.brand-chip-dark          — 짙은 칩 (확정 상태)
.brand-panel-strong       — 강조 패널
```

### Opacity modifier 주의

CSS 변수 기반 색상에 Tailwind `/opacity` 수정자 동작 안 함.
`bg-brand-surface/65` (X) → `bg-[rgba(196,221,255,0.65)]` (O)

자주 쓰는 rgba:
- 헤더 서브텍스트: `text-[rgba(196,221,255,0.65)]`
- 알림 버튼 hover: `hover:text-[#c4ddff]`
- 셀 hover: `hover:bg-[rgba(0,29,110,0.04)]`

---

## 참가자 상태 배지 컨벤션

| 상태 | 배지 |
|------|------|
| APPROVED | `bg-emerald-100 text-emerald-700` |
| PENDING | `bg-amber-100 text-amber-700` |
| WAITLISTED | `.brand-chip-soft` |
| REJECTED / 마감 | `bg-brand-dimmed text-brand-dimmed-text` |

---

## 개발 규칙

- 색상 역할: 블루=선택/액션, 초록=확정/완료, 회색=비활성/준비중
- 서버 컴포넌트에서 초기 데이터 fetch, 클라이언트는 mutation에 집중
- 런타임 의존 페이지는 `export const dynamic = "force-dynamic"` 명시
- 관리자 인증: `/api/admin/login` 쿠키 세션 방식
- 알림 읽음 상태: localStorage (`underpace_read_notifications`)

---

## 브랜치 전략

- `main` — Vercel 자동 배포 대상. 직접 push 금지.
- `ux/design-token-restyle` — 현재 작업 브랜치
- 기능 브랜치 → PR → main 병합

---

## 프론트엔드 철학

`docs/design.md` 참고. 핵심 요약:

1. 상태 명확성 > 시각적 완성도
2. 읽기 화면과 편집 화면 분리
3. 서버 초기화 우선 (SSR)
4. 중복 정보 제거
5. 모바일 우선 (`max-w-xl mx-auto`)
6. request-based 환경에서 요청 수 최소화
