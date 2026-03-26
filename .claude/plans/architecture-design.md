# AI 검색 사이드바 & 주제별 그룹핑 기술 아키텍처 설계서

## 1. 시스템 아키텍처

### 전체 데이터 흐름

```
[RSS Feed Sources]
       │
       ▼
[fetchRssFeed] ──→ [diffArticles + snapshotFilter]
       │                        │
       ▼                        ▼
[ArticleStore.add] ──→ [GROQ: classifyTopic] ──→ [TopicStore.register]
       │                        │
       ▼                        ▼
[Article.topic = "AI/ML"]    [SummaryQueue → Ollama]
       │
       ▼
[GET /api/articles?topic=AI/ML&year=2026]
       │
       ├──→ [TopicFilter + YearTabs UI]
       │
       └──→ [POST /api/ai/search] ──→ [GROQ Chat Completion]
                                            │
                                            ▼
                                   [AI Answer + Related Articles]
```

### 컴포넌트 간 통신

```
[Browser]
    │
    ├── GET  /api/topics          → TopicStore.getAll()
    ├── GET  /api/articles?topic&year&page → ArticleStore.getPageByTopicAndYear()
    └── POST /api/ai/search       → GROQ API (chat/completions)
                                        ↑ context = filtered articles
```

## 2. API 설계

### 기존 API 수정

| Method | Path | 변경 | Request | Response |
|--------|------|------|---------|----------|
| `GET` | `/api/articles` | `topic`, `year` 파라미터 추가 | `?page=1&limit=12&lang=ko&topic=AI/ML&year=2026` | 기존과 동일 |

### 신규 API

| Method | Path | 설명 | Request | Response |
|--------|------|------|---------|----------|
| `GET` | `/api/topics` | 주제 목록 조회 | - | `{ data: { topics: Topic[] } }` |
| `POST` | `/api/ai/search` | AI 검색 | Body: `{ query, topic?, year?, lang }` | `{ data: { answer, relatedArticles } }` |

### AI 검색 API 상세

```typescript
// POST /api/ai/search
// Request
{
  query: string;          // 사용자 질문
  topic?: string;         // 현재 선택된 주제 (없으면 전체)
  year?: number;          // 현재 선택된 연도 (없으면 전체)
  lang: SupportedLocale;  // 응답 언어
}

// Response
{
  data: {
    answer: string;       // GROQ가 생성한 답변 (마크다운)
    relatedArticles: Array<Article & { summary?: Summary }>;  // 관련 아티클 (최대 5개)
  }
}
```

**컨텍스트 구성 전략:**
1. `topic` + `year` 조건으로 아티클 필터링
2. 필터링된 아티클의 `title` + `summary.description` 조합 (최대 20개, 최신순)
3. 토큰 제한: 컨텍스트를 4000자로 제한
4. GROQ에 system prompt + user query + context 전달

**에러 응답:**
- `400`: query 누락
- `503`: GROQ_API_KEY 미설정
- `429`: Rate limit 초과
- `500`: GROQ API 호출 실패

## 3. 데이터 모델

### 엔티티 변경

```typescript
// Article 확장 (기존 필드 + 추가)
interface Article {
  // ... 기존 필드 유지
  topic: string;  // AI가 분류한 주제 (기본값: 'Uncategorized')
}

// Feed 확장 (기존 필드 + 추가)
interface Feed {
  // ... 기존 필드 유지
  snapshotAt: string | null;  // 최초 동기화 시점 (ISO timestamp)
}

// 신규: Topic
interface Topic {
  id: string;
  name: string;       // 카테고리명 (영문, 표시키로 사용)
  label: {            // i18n 라벨
    ko: string;
    en: string;
  };
  isSeed: boolean;    // 시드 카테고리 여부
  createdAt: string;
}

// 신규: TopicsData (JSON 저장 스키마)
interface TopicsData {
  topics: Topic[];
}
```

### 엔티티 관계

```
Feed (1) ──── (N) Article
Article (1) ──── (N) Summary
Article.topic ──── Topic.name (논리적 관계, FK 아님)
```

### 마이그레이션 전략
- 기존 `articles.json`의 Article에 `topic` 필드가 없으면 `'Uncategorized'`로 기본값 처리
- 기존 `feeds.json`의 Feed에 `snapshotAt` 필드가 없으면 `null`로 기본값 처리
- BaseStore의 `read()` 시점에 자동 마이그레이션 (런타임 호환)

## 4. 컴포넌트 설계

### 컴포넌트 트리

```
LocaleLayout (Server)
├── Header (Client)
└── <main> (레이아웃 변경: flex)
    ├── ContentArea (div, flex-1)
    │   └── page.tsx (Server → Client 경계)
    │       ├── YearTabs (Client)
    │       ├── TopicFilter (Client)
    │       └── ArticleList (Client) — 기존 컴포넌트 수정
    │           └── ArticleCard (Client) — 기존
    └── AiSearchSidebar (Client)
        ├── SearchInput (Client)
        ├── AiAnswer (Client)
        └── RelatedArticles (Client)
            └── ArticleCard (Client) — 재사용
```

### Server/Client 경계

- **Server Component**: `layout.tsx`, `page.tsx` (초기 데이터 fetch 가능)
- **Client Component**: `YearTabs`, `TopicFilter`, `ArticleList`, `AiSearchSidebar` 및 하위

### 상태 관리 전략

```
URL SearchParams (source of truth)
  ├── topic: string (선택된 주제)
  ├── year: number (선택된 연도)
  └── page: number (현재 페이지)

page.tsx (Server → searchParams 읽기)
  └── HomeContent (Client, 'use client')
      ├── state: { topic, year, page } — URL에서 초기화
      ├── TopicFilter: onTopicChange → URL 업데이트
      ├── YearTabs: onYearChange → URL 업데이트
      ├── ArticleList: topic + year + page로 API 호출
      └── AiSearchSidebar: topic + year를 props로 받음
```

**URL 기반 상태 관리 이유:**
- 새로고침/공유 시 필터 상태 유지
- Server Component에서 초기값 접근 가능
- 브라우저 뒤로가기 지원

### 반응형 레이아웃

```
Desktop (lg+):
┌──────────────────────────────────────────┐
│  Header                                  │
├────────────────────────┬─────────────────┤
│  ContentArea           │  AiSearchSidebar│
│  (flex-1, max-w-4xl)   │  (w-80, fixed)  │
│                        │                 │
│  [YearTabs]            │  [SearchInput]  │
│  [TopicFilter chips]   │  [AI Answer]    │
│  [ArticleList grid]    │  [Related Arts] │
└────────────────────────┴─────────────────┘

Mobile (<lg):
┌──────────────────────┐
│  Header              │
├──────────────────────┤
│  ContentArea         │
│  [YearTabs]          │
│  [TopicFilter chips] │
│  [ArticleList grid]  │
│                      │  ┌─ FAB Button (fixed bottom-right)
└──────────────────────┘  │
                          └──→ Slide-over Sidebar (overlay)
```

## 5. 기술 선택 근거

### GROQ SDK vs REST API 직접 호출

| 기준 | groq-sdk | fetch 직접 호출 |
|------|----------|-----------------|
| 타입 안전성 | TypeScript 지원 내장 | 수동 타입 정의 필요 |
| 에러 핸들링 | 구조화된 에러 클래스 | 수동 파싱 |
| Rate limiting | 자동 재시도 지원 | 수동 구현 |
| 번들 사이즈 | ~50KB | 0 |
| 유지보수 | SDK 업데이트 추적 | API 변경 직접 대응 |

**선택: `groq-sdk`** — 타입 안전성과 에러 핸들링이 개발 생산성에 큰 이점. 서버 사이드 전용이므로 번들 사이즈 영향 없음.

### AI 검색 모델 선택

| 기준 | llama-3.3-70b-versatile | mixtral-8x7b-32768 |
|------|------------------------|---------------------|
| 한국어 품질 | 우수 | 보통 |
| 응답 속도 | ~1-2초 | ~0.5-1초 |
| 컨텍스트 윈도우 | 128K | 32K |
| 분류 정확도 | 높음 | 보통 |

**선택: `llama-3.3-70b-versatile`** — 한국어 지원과 분류 정확도 우선. 주제 분류는 비동기이므로 속도는 부차적.

### 사이드바 상태 관리: URL vs Context vs Zustand

| 기준 | URL SearchParams | React Context | Zustand |
|------|-----------------|---------------|---------|
| SSR 호환 | 완전 호환 | Provider 필요 | Provider 필요 |
| 공유/북마크 | 가능 | 불가 | 불가 |
| 복잡도 | 낮음 | 중간 | 중간 |
| 추가 의존성 | 없음 | 없음 | 패키지 추가 |

**선택: URL SearchParams** — 공유 가능성, SSR 호환, 추가 의존성 없음. 필터 상태가 단순(topic + year + page)하므로 충분.

## 6. 동시성/안전성 전략

### GROQ API 호출 제어
- **주제 분류**: 기존 `SummaryQueue`와 별도 큐 사용 (`TopicClassificationQueue`)
  - Mutex 기반 순차 처리 (GROQ rate limit 보호)
  - 실패 시 `topic = 'Uncategorized'` 폴백
- **AI 검색**: 요청별 독립 호출 (사용자 인터랙션, 동시성 낮음)
  - 프론트엔드에서 AbortController로 이전 요청 취소
  - 서버에서 30초 타임아웃

### Snapshot 동시성
- `snapshotAt` 업데이트는 `feedStore.updateFeed()` 내 기존 Mutex로 보호
- diffArticles 호출 전에 snapshotAt 필터링 적용 (순서 보장)

### Graceful Degradation
- `GROQ_API_KEY` 미설정 시:
  - 주제 분류: `topic = 'Uncategorized'` (TopicFilter에 "Uncategorized"만 표시)
  - AI 검색: 사이드바에 "API 키 미설정" 안내 메시지, 입력 비활성화
  - 기존 Ollama 요약 기능은 영향 없음

### 에러 복구
- GROQ 호출 실패 시 3회 재시도 (groq-sdk 내장)
- 네트워크 에러 → 사용자에게 재시도 버튼 표시
- JSON 파싱 실패 → 기본값 폴백

## 7. 핵심 파일 목록

| 파일 | 역할 | 중요도 |
|------|------|--------|
| `src/lib/ai/groq-client.ts` | GROQ API 통합의 핵심, 주제분류 + AI검색 모두 사용 | 최상 |
| `src/app/api/feeds/refresh/route.ts` | Snapshot + 주제분류 파이프라인 통합 지점 | 최상 |
| `src/app/api/ai/search/route.ts` | AI 검색 엔드포인트, 컨텍스트 구성 로직 | 상 |
| `src/components/sidebar/AiSearchSidebar.tsx` | 사이드바 UI 진입점, 반응형 레이아웃 핵심 | 상 |
| `src/app/[locale]/page.tsx` | 필터/탭/사이드바 통합, 상태 관리 허브 | 상 |
