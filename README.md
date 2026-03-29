# RSS Feed AI Summary

AI 기반 RSS 피드 요약 블로그. Ollama(llama3)를 활용하여 RSS 피드의 새 글을 자동으로 수집하고 요약합니다. GROQ API로 주제 자동 분류 및 AI 검색 기능을 제공합니다.

## 기능

- **RSS 피드 관리**: URL 추가/삭제, 활성/비활성 토글
- **AI 요약**: Ollama(llama3)로 제목(1-2줄) + 설명(10줄 이하) 자동 생성
- **주제별 분류**: GROQ API를 활용한 아티클 자동 주제 분류 (시드 카테고리 + AI 확장)
- **연도별 탭**: 아티클을 연도별로 분리하여 최신순으로 조회
- **AI 검색 사이드바**: 현재 필터 범위 내 아티클을 GROQ 기반 AI로 질의 (답변 + 관련 아티클)
- **Snapshot 메커니즘**: 최초 동기화 시점 기록, 이후 동기화에서 이전 발행 글 중복 추가 방지
- **검색**: 요약된 콘텐츠 검색 (제목, 설명 기반)
- **자동 폴링**: 설정 가능한 주기로 RSS 피드 자동 확인 + 수동 새로고침
- **다국어**: 한국어/영어 UI 지원, AI 요약도 UI 언어에 맞춰 번역
- **다크모드**: 라이트/다크/시스템 테마 지원
- **업데이트 감지**: contentHash 기반으로 게시/업데이트된 글만 요약

## 기술 스택

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS 4
- **i18n**: next-intl
- **Theme**: next-themes
- **AI 요약**: Ollama (llama3 8B)
- **AI 분류/검색**: GROQ API (llama-3.3-70b-versatile)
- **저장소**: Vercel Postgres (@vercel/postgres)
- **테스트**: Jest, ts-jest
- **린트**: ESLint, Prettier, Stylelint

## 시작하기

### 사전 요구사항

- Node.js 20+
- pnpm 10+
- Vercel Postgres 데이터베이스 (Vercel 대시보드에서 생성)
- Ollama (로컬 실행 시)
- GROQ API Key (주제 분류/AI 검색 사용 시, 선택사항)

### 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 편집하여 필요한 값을 설정합니다:

```env
# Vercel Postgres (필수)
POSTGRES_URL=postgres://...

# GROQ API Key (선택사항 - 없으면 주제 분류/AI 검색 비활성화)
GROQ_API_KEY=gsk_your_api_key_here

# Ollama Base URL (기본값: http://localhost:11434)
OLLAMA_BASE_URL=http://localhost:11434
```

> - Vercel Postgres는 Vercel 대시보드 > Storage에서 생성 후 환경변수가 자동 연결됩니다.
> - GROQ API 키는 https://console.groq.com/keys 에서 무료로 발급받을 수 있습니다.

### DB 초기화

최초 배포 후 또는 로컬 실행 전에 DB 스키마를 초기화해야 합니다:

```bash
# 서버 실행 후
curl -X POST http://localhost:3000/api/db/init
```

또는 Vercel 배포 후 `https://your-app.vercel.app/api/db/init` 에 POST 요청을 보내세요.

### 로컬 실행

```bash
# 의존성 설치
pnpm install

# Ollama 시작 (별도 터미널)
ollama serve
ollama pull llama3

# 개발 서버 실행
pnpm dev
```

http://localhost:3000 에서 접속

### Docker 실행

```bash
cd docker
docker compose up -d
```

http://localhost:3000 에서 접속

### 하드웨어 요구사항

| 항목 | 최소 | 권장 |
|------|------|------|
| RAM | 8GB | 16GB |
| 디스크 | 10GB (모델 포함) | 20GB |
| GPU | 불필요 (CPU 가능) | NVIDIA GPU (추론 가속) |

> llama3 8B는 CPU에서 요약 1건당 30초~2분 소요됩니다. GPU가 있으면 수 초로 단축됩니다.

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/           # 다국어 라우팅 (ko, en)
│   │   ├── page.tsx        # 메인 (주제 필터 + 연도 탭 + 아티클 목록 + AI 사이드바)
│   │   ├── feeds/          # 피드 관리
│   │   ├── search/         # 검색
│   │   └── settings/       # 설정
│   └── api/                # REST API
│       ├── feeds/          # 피드 CRUD + 새로고침
│       ├── articles/       # 아티클 조회/검색 (topic, year 필터 지원)
│       ├── topics/         # 주제 목록 조회
│       ├── ai/search/      # AI 검색 (GROQ)
│       ├── settings/       # 설정 관리
│       └── ollama/         # Ollama 상태 확인
├── components/             # React 컴포넌트
│   ├── article/            # ArticleList, ArticleCard, TopicFilter, YearTabs
│   ├── sidebar/            # AiSearchSidebar, SearchInput, AiAnswer, RelatedArticles
│   ├── layout/             # Header
│   ├── feed/               # FeedList, FeedForm
│   ├── search/             # SearchPage
│   ├── settings/           # SettingsForm
│   └── ui/                 # ThemeToggle, LocaleSwitcher, RefreshButton
├── lib/
│   ├── db/                 # DB 스키마 정의 (Vercel Postgres)
│   ├── store/              # 데이터 접근 계층 (Vercel Postgres 기반)
│   │   ├── article-store   # 아티클 CRUD + 주제/연도 필터링
│   │   ├── topic-store     # 주제 카테고리 관리 (시드 + AI 생성)
│   │   ├── feed-store      # 피드 CRUD + snapshot 관리
│   │   └── summary-store   # 요약 CRUD
│   ├── rss/                # RSS 파싱, 신규 감지, snapshot 필터링
│   ├── ai/                 # Ollama 요약, GROQ 클라이언트, 주제 분류
│   └── polling/            # 자동 폴링 스케줄러
├── i18n/                   # 다국어 설정 및 메시지
└── types/                  # TypeScript 타입 정의
```

## 스크립트

```bash
pnpm dev              # 개발 서버
pnpm build            # 프로덕션 빌드
pnpm test             # 테스트 실행
pnpm test:coverage    # 커버리지 포함 테스트
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm stylelint        # Stylelint
```

## 라이선스

MIT
