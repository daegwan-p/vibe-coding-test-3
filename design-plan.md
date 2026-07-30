# 할 일 앱 UI 개선 계획

> **상태:** 선택적 레퍼런스(TickTick / Todoist / Linear / Notion) 반영안 — **승인 대기**  
> 승인 전까지 `index.html` / `styles.css` / `app.js`는 수정하지 않습니다.

---

## 이미 반영된 것 (Phase A — 완료)

- 디자인 토큰, 단색 배경, 통계·진행률, Lucide, 필터 좌측 정렬, hover/완료/slide-in 인터랙션
- CRUD + 기존 필터 값(`all` / `active` / `done`) 유지

---

## Phase B 목표

유명 todo 앱의 **특정 요소만** 가져와 밀도를 높입니다.  
전체 카피·우선순위 태그·마감일 기능은 **넣지 않습니다.**

| 레퍼런스 | 가져올 것 | 안 가져올 것 |
|----------|-----------|--------------|
| TickTick | 얇은 좌측 사이드바 + 개수 뱃지 | 캘린더, 습관, 태그 트리 |
| Todoist | 원형 체크 + hover 테두리 + 채움 애니 | 우선순위 색 점, 프로젝트 |
| Linear | 행 hover 배경 + 좌측 4px 액센트 바 | 커맨드 팔레트, 이슈 ID |
| Notion | 완료 접이식 섹션 | 데이터베이스 속성, 페이지 |

---

## 디자인 토큰 (유지)

기존 토큰을 그대로 씁니다. Phase B에서 추가하는 값만 아래와 같습니다.

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--sidebar-width` | `220px` | 데스크톱 사이드바 |
| `--color-hover` | `#00000005` | Linear 행 hover |
| `--accent-bar` | `4px` | 행 좌측 액센트 두께 |
| `--check-size` | `20px` | Todoist 원형 체크 |

핵심 5색·폰트·간격·radius·shadow는 Phase A와 동일합니다.

---

## 1. TickTick — 사이드바 / 모바일 탭바

### 데스크톱 (≥768px)

```
┌──────────┬─────────────────────────────┐
│ 할 일    │  header (날짜)              │
│          │  overview (통계·진행률)     │
│ 전체  12 │  add-form                   │
│ 오늘   3 │  목록 메타 + clear          │
│ 진행중 5 │  활성 리스트                │
│ 완료   7 │  [완료 N개 ▸] 접이식        │
└──────────┴─────────────────────────────┘
```

- 폭 `--sidebar-width`, 배경 `--color-card`, 오른쪽 `1px solid --color-border`
- 상단 툴바의 `#filters` **칩 UI 제거** → 사이드바(및 모바일 탭)로 **동일 노드 이동**  
  → 기존 `filtersEl` 클릭/키보드 리스너·`data-filter` **재사용** (필터 이벤트 로직 교체 없음)
- 각 항목: 라벨 + 우측 **개수 뱃지** (`#badge-all` 등) — `updateStatsUI()`에서 숫자만 갱신

### 네비 항목

| 라벨 | `data-filter` | 개수 의미 |
|------|---------------|-----------|
| 전체 | `all` | 전체 개수 |
| 오늘 | `today` | 오늘 만든 항목 수 |
| 진행중 | `active` | 미완료 개수 |
| 완료 | `done` | 완료 개수 |

**`today`에 대한 명시:**  
CRUD(`push` / `update` / `remove`)는 변경하지 않습니다.  
`getFilteredTodos()`에 **표시용 분기 한 줄**만 추가합니다.

```js
// 표시만 — createdAt이 로컬 오늘인 항목
if (filter === "today") return todos.filter((t) => isToday(t.createdAt));
```

우선순위·마감일 필드 추가는 없습니다.

### 모바일 (&lt;768px)

- 좌측 사이드바 **숨김**
- 화면 **하단 고정 탭바**로 동일 `#filters` 버튼 배치 (아이콘+짧은 라벨 또는 라벨+뱃지)
- `main` 하단에 `padding-bottom`으로 탭바와 겹침 방지
- safe-area (`env(safe-area-inset-bottom)`) 고려

---

## 2. Todoist — 원형 체크박스

기존 `.todo-check` `<input type="checkbox">` **유지** (완료 `change` 리스너 불변).

시각만 변경:

- `border-radius: 50%`, 크기 `--check-size`
- 기본: 투명 배경 + `--color-border` 테두리
- **hover** (미체크): 테두리만 `--color-accent` (채우지 않음)
- **checked**: 배경 `--color-accent`, 테두리 동일, 체크 아이콘 scale-in (~150ms)
- `transform: scale` + `background` 150ms transition

---

## 3. Linear — 행 hover

`.todo-item`:

- 기본: 좌측 바 `transparent` (또는 `::before` width 0/transparent)
- **hover**: `background: #00000005` (`--color-hover`)
- **hover**: 좌측 `4px` solid `--color-accent` (`::before` absolute)
- 완료 접힌 섹션 안 행에도 동일 적용
- 기존 삭제 버튼 fade-in 유지

---

## 4. Notion — 완료 접이식

### 동작 (표시만)

| 사이드바 필터 | 메인 리스트 | 하단 접이식 |
|---------------|-------------|-------------|
| `all` / `today` | 미완료만 | `완료 N개 ▸` (기본 **접힘**). 펼치면 완료 항목 |
| `active` | 미완료만 | 접이식 **숨김** |
| `done` | 완료만 (펼친 목록) | 접이식 **숨김** (사이드바가 이미 완료 뷰) |

- 토글 버튼: `aria-expanded`, 기본 `false`
- 화살표 `▸` / 펼침 시 `▾` (CSS rotate 또는 문자 교체)
- 접이식 안 항목도 수정/삭제/체크 동일 (`data-action`, `.todo-check`)
- “완료된 일 지우기”는 접이식 헤더 옆 또는 목록 메타에 유지

### 렌더 구조 (개념)

```
ul#todo-list          ← 활성(또는 done 필터 시 완료) 항목
details/div#done-section
  button#done-toggle  ← "완료 N개"
  ul#done-list        ← 접혔을 때 hidden
```

`render()`는 **어느 리스트에 그릴지**만 나눕니다. Firebase 호출 경로는 그대로입니다.

접힘 상태 `doneCollapsed`는 UI 상태(기본 `true`). 필터 전환 시에도 기본 접힘 유지.

---

## 레이아웃 구조 (승인 후)

```
body.shell
  aside.sidebar
    brand (작은 로고/제목)
    nav#filters          ← 이동 (data-filter 유지)
  main.app
    header
    overview
    form#add-form
    section.list-section
      meta + clear
      #todo-list
      #done-section
      empty / status / error
  (모바일에서 #filters가 하단 .tabbar 위치로 보이도록 CSS만 전환
   또는 마크업상 filters를 tabbar 래퍼로 감싸 desktop/mobile 배치)
```

**배치 전략 (확정):**  
`#filters`는 **한 번만** DOM에 두고, CSS Grid/Flex로

- ≥768px: 왼쪽 사이드바 영역
- &lt;768px: `position: fixed; bottom: 0` 탭바

중복 버튼·이중 리스너 없음.

---

## 파일별 변경 범위

| 파일 | 변경 | 금지 |
|------|------|------|
| `index.html` | 셸(사이드바/메인), `#filters` 이동, `#done-section` 마크업 | 폼·리스트 id 제거 |
| `styles.css` | 사이드바·탭바·원형체크·hover바·접이식 | 토큰 체계 붕괴 |
| `app.js` | (1) `today` 표시 필터 1분기 (2) 뱃지 숫자 (3) 목록/완료 섹션 분리 렌더 (4) 접이식 토글 UI | `push`/`update`/`remove`/완료 토글 API 호출 방식 변경 |

### 로직 비침해 원칙 (재확인)

- 추가·수정·삭제·완료 체크의 Firebase 연동 **그대로**
- 필터 클릭은 기존처럼 `data-filter` → `filter` 변수 → `render()`
- 새로 허용하는 표시 전용 코드: `today` 분기, 뱃지 DOM, 완료 섹션 접기/펼치기, 아이콘 refresh

---

## 구현 체크리스트 (승인 후)

1. 레이아웃 셸 + `#filters` 사이드바/탭바 CSS 전환  
2. 뱃지 숫자 연동 (`updateStatsUI`)  
3. Todoist 원형 체크 CSS  
4. Linear 행 hover + 4px 바  
5. Notion 완료 접이식 (기본 접힘) + `today` 표시 필터  
6. 768px 전후에서 사이드바↔탭바, 목록 터치 영역 확인  

---

## 승인 요청

위 Phase B(사이드바·원형 체크·hover 바·완료 접이식·`today` 표시 필터)에 동의하시면 알려 주세요.  
**승인 후에만** 코드를 수정합니다.

---

## Phase C — 추가 레퍼런스 (Things / Reminders / Todoist FAB / Linear 밀도)

Phase B 위에 **시각만** 추가. CRUD·필터 API 불변.

| 레퍼런스 | 적용 |
|----------|------|
| Things 3 | 시간대 인사(`좋은 아침/오후/저녁`) + 헤더 위계 강화 |
| Apple Reminders | 사이드바 필터 아이콘을 둥근 색 칩 안 아이콘으로 |
| Todoist 모바일 | `&lt;768px` FAB(`+`) → `#todo-input` focus/scroll |
| Linear | 목록 행 카드감 축소 → hairline + 타이트 패딩 (hover 바 유지) |
| 마이크로 | 체크 완료 시 scale bounce (CSS) |

스킵: 우선순위, 마감일, 캘린더, 습관, 게임화.
