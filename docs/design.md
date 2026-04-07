# Frontend Philosophy — Underpace

이 문서는 Underpace 프로젝트에서 굳어진 프론트엔드 설계 철학을 정리한 레퍼런스다.
다른 Agent나 후속 작업이 바로 재사용할 수 있게 작성되어 있다.

---

## 핵심 철학

- 한 화면에는 한 가지 핵심 행동만 둔다.
- 사용자는 지금 할 수 있는 행동을 바로 이해해야 한다.
- 예쁜 화면보다 상태가 명확한 화면이 우선이다.
- 첫 렌더에서 틀린 상태를 잠깐 보여주는 것보다, 짧은 로딩이 낫다.
- 읽기 화면과 편집 화면은 분리한다.
- 서버 비용이 있는 환경에서는 요청 하나의 가치를 높인다.

---

## 디자인 시스템

### 색상 역할

| 색상 | 역할 |
|------|------|
| 메인 블루 (`brand-primary`) | 선택 상태, 주요 액션에만 |
| 연한 블루 (`brand-surface`) | 보조 배경, 요약 카드, 선택 가능 상태 |
| 초록 (`emerald-*`) | 확정, 완료, 성공 상태에만 |
| 회색 (`brand-dimmed`) | 비활성, 읽기 전용, 준비중 상태에만 |

색은 적게 쓰고 역할 중심으로 쓴다. 화면 전체 일관성보다 패널 단위 일관성을 우선한다.

### 토큰 시스템

CSS 변수 기반 Tailwind 토큰을 사용한다. `src/app/globals.css`와 `tailwind.config.ts` 참고.

```
bg-brand-primary          — 주요 배경 (네이비)
bg-brand-surface          — 보조 배경 (연한 블루)
bg-brand-page             — 페이지 배경 (흰색)
border-brand-primary-border — 카드 테두리
text-brand-text           — 기본 텍스트
text-brand-text-muted     — 보조 텍스트
text-brand-text-subtle    — 희미한 텍스트
bg-brand-dimmed           — 비활성 배경
text-brand-dimmed-text    — 비활성 텍스트
```

### CSS 컴포넌트 클래스

Tailwind 임의값(`bg-[#001d6e]`) 대신 아래 클래스를 쓴다:

```
.brand-button-primary     — 주요 버튼 (hover/disabled 내장)
.brand-button-secondary   — 보조 버튼
.brand-input              — 입력 필드 (focus ring 내장)
.brand-input-dimmed       — 읽기전용 입력
.brand-card               — 기본 카드
.brand-panel              — 패널
.brand-panel-strong       — 강조 패널
.brand-chip-soft          — 연한 칩 (대기, 보조 상태)
.brand-chip-dark          — 짙은 칩 (확정 상태)
.brand-chip-companion     — 보완 칩
```

**Tailwind opacity modifier 주의**: `bg-brand-surface/65` 등 CSS 변수 기반 색상에는 `/opacity` 수정자가 동작하지 않는다. 대신 `rgba()` 직접 사용:
- `text-[rgba(196,221,255,0.65)]` — 헤더 서브텍스트
- `hover:bg-[rgba(0,29,110,0.04)]` — 셀 hover
- `bg-[rgba(0,29,110,0.6)]` — 모달 오버레이

---

## 레이아웃 원칙

- 모바일 우선으로 설계한다 (`max-w-xl mx-auto`).
- 상단에는 현재 컨텍스트만 둔다.
- 본문에는 핵심 객체 하나를 강조한다.
- 하단에는 다음 행동 하나를 강하게 둔다.
- 정보가 많아지면 요약 후 확장 구조를 쓴다.
- 리스트와 편집기를 동시에 크게 두지 않는다.
- 같은 이름, 상태, 총액을 여러 카드에 반복하지 않는다.

---

## 상태 표현 원칙

- 설명 문구보다 상태 표현이 중요하다.
- 사용자가 이미 알고 있는 설명은 반복하지 않는다.
- 버튼 라벨은 행동 그대로 쓴다.
- 상태 이름은 짧고 단단하게 유지한다.
- 운영자 화면은 구분, 총액, 우선순위가 먼저 보이게 한다.

### 참가자 상태 배지 컨벤션

| 상태 | 색상 | 클래스 |
|------|------|--------|
| APPROVED | 초록 | `bg-emerald-100 text-emerald-700` |
| PENDING | 앰버 | `bg-amber-100 text-amber-700` |
| WAITLISTED | 연한 블루 | `.brand-chip-soft` |
| REJECTED / 마감 | 회색 | `bg-brand-dimmed text-brand-dimmed-text` |

---

## 컴포넌트 설계 원칙

- 컨테이너는 데이터와 상태를 가진다.
- 패널과 섹션은 렌더링 책임만 가진다.
- JSX 안에서 복잡한 분기 계산을 직접 하지 않는다.
- 먼저 파생 상태를 만들고, 그 상태를 렌더한다.
- 서버가 줄 수 있는 초기 데이터는 서버에서 준다.
- 클라이언트는 mutation과 국소 갱신에 집중한다.

---

## 성능 원칙

- 첫 화면 이후 같은 데이터를 다시 fetch하지 않는다.
- polling은 제한적으로 쓴다. 탭이 열려 있을 때만 갱신하거나, 액션 직후에만 갱신한다.
- 전체 refresh보다 부분 갱신을 우선한다.
- 서버 컴포넌트와 클라이언트 컴포넌트의 역할을 분리한다.

### Cloud Run / request-based 환경

- SSR과 후속 fetch를 동시에 과하게 쓰지 않는다.
- 공용 데이터와 사용자별 동적 데이터를 분리한다.
- 관리자 페이지는 첫 진입용 데이터는 서버에서 준비하고, 상호작용만 클라이언트 fetch로 남긴다.
- 런타임 의존 페이지는 `export const dynamic = "force-dynamic"` 명시.

---

## 안티패턴

- 초기 렌더에서 틀린 상태를 보여주고 나중에 수정하는 것
- fetch, mutation, 파생 상태, JSX를 한 컴포넌트에 몰아넣는 것
- 같은 이름, 금액, 상태를 여러 카드에 반복하는 것
- 페이지 진입마다 bootstrap API를 반복 호출하는 것
- 운영자 모니터링과 편집을 하나의 거대한 화면에 섞는 것
- `bg-[#001d6e]` 등 하드코딩 hex 값을 Tailwind 임의값으로 직접 쓰는 것
- CSS 변수 기반 색상에 Tailwind opacity modifier(`/65`) 쓰는 것

---

## Agent용 요약 (빠른 참고)

```
모바일 우선
상태 명확성 우선
서버 초기화 우선
중복 정보 제거
읽기와 편집 분리
하드코딩 hex 금지 — brand 토큰 사용
CSS 변수 색상에 /opacity modifier 금지 — rgba() 사용
request-based 환경에서는 요청 수와 중복 연산을 항상 의식
```
