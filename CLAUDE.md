# CLAUDE.md

## 프로젝트 개요

RSS Feed AI Summary - Ollama(llama3) 기반 RSS 피드 자동 요약 + GROQ 기반 주제 분류/AI 검색 블로그

## 기술 스택 & 컨벤션

- **Framework**: Next.js 15 App Router, TypeScript strict mode
- **Styling**: Tailwind CSS 4, CSS 변수 기반 테마
- **패키지 매니저**: pnpm
- **테스트**: Jest + ts-jest, TDD (Red-Green-Refactor)
- **린트**: ESLint (next/core-web-vitals + prettier), Prettier, Stylelint

## 아키텍처

- **데이터 저장소**: JSON 파일 기반 (`data/` 디렉토리), BaseStore 패턴
  - atomic write (`write-file-atomic`)로 데이터 안전성 보장
  - `async-mutex`로 동시성 제어
- **AI 요약**: Ollama REST API → 2단계 요약 (영어 요약 → UI 언어 번역)
- **AI 분류/검색**: GROQ API (`groq-sdk`)
  - 주제 분류: 아티클 저장 시 배치(10개씩) 자동 분류
  - AI 검색: 필터 범위 내 아티클 컨텍스트 기반 GROQ chat completion
  - `GROQ_API_KEY` 환경변수 필요 (없으면 graceful degradation)
- **Snapshot**: Feed별 최초 동기화 시점 기록, 이후 동기화에서 이전 발행 글 무시
- **폴링**: `instrumentation.ts`에서 setInterval 기반 스케줄러
- **i18n**: next-intl, `[locale]` 기반 라우팅
- **다크모드**: next-themes, Tailwind `class` 전략

## 주요 명령어

```bash
pnpm dev          # 개발 서버 (Turbopack)
pnpm build        # 프로덕션 빌드
pnpm test         # 전체 테스트
pnpm lint         # ESLint
pnpm format       # Prettier
```

## 디렉토리 규칙

- `src/lib/store/` - 데이터 접근 계층 (Repository 패턴)
  - `topic-store.ts` - 주제 카테고리 관리 (시드 + AI 생성)
  - `article-store.ts` - 아티클 CRUD + 주제/연도 기반 필터링
  - `feed-store.ts` - 피드 CRUD + snapshotAt 관리
- `src/lib/rss/` - RSS 파싱, 피드 패칭, 변경 감지, snapshot 필터링
- `src/lib/ai/` - Ollama 요약, GROQ 클라이언트, 주제 분류
  - `groq-client.ts` - GROQ API 클라이언트 (서버 사이드 전용)
  - `topic-classifier.ts` - 배치 주제 분류 (프롬프트 + 파싱)
- `src/components/` - UI 컴포넌트 (Server Component 기본, 필요시 'use client')
  - `src/components/article/` - ArticleList, ArticleCard, TopicFilter, YearTabs, HomeContent
  - `src/components/sidebar/` - AiSearchSidebar, SearchInput, AiAnswer, RelatedArticles
- `src/i18n/messages/` - 번역 파일 (ko.json, en.json)
- `src/__tests__/` - 테스트 파일 (소스 구조 미러링)

## 코드 작성 가이드

- Server Component 우선, Client Component 최소화
- API Route는 `src/app/api/` 하위
- 타입은 `src/types/index.ts`에 중앙 관리
- 새 언어 추가: `src/i18n/messages/`에 JSON 파일 추가 + `routing.ts` locales 배열 추가
- GROQ_API_KEY 미설정 시: topic='Uncategorized', AI 검색 비활성화 (503 응답)
