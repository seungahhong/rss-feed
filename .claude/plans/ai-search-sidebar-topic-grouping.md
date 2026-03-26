# AI 검색 사이드바 & 주제별 그룹핑 & Snapshot 구현 계획

## 개요
- **목적**: RSS 피드 아티클을 AI가 주제별로 자동 분류하고, 연도별 탭으로 나누어 표시하며, GROQ 기반 AI 검색 사이드바를 통해 현재 필터 범위 내 데이터를 질의할 수 있도록 한다.
- **범위**:
  - 포함: AI 주제 분류, 연도 탭, 필터 칩, AI 검색 사이드바, Snapshot 메커니즘, i18n, 문서 업데이트
  - 제외: 기존 Ollama 요약 기능 변경, OAuth/인증, 외부 DB 마이그레이션

## 구현 단계

### Phase 1: 데이터 모델 확장 (타입 & 스토어)
**작업 내용:**
- `Article` 타입에 `topic: string` 필드 추가
- `Feed` 타입에 `snapshotAt: string | null` 필드 추가
- `TopicStore` 생성 — 시드 카테고리 + AI 생성 카테고리 관리 (`data/topics.json`)
- `ArticleStore`에 `getByTopic()`, `getYears()`, `getPageByTopicAndYear()` 메서드 추가
- `FeedStore`에 `snapshotAt` 업데이트 로직 추가

**수정 파일:**
| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/types/index.ts` | 수정 | Article에 topic, Feed에 snapshotAt 추가, Topic 타입 정의 |
| `src/lib/store/article-store.ts` | 수정 | 토픽/연도 기반 쿼리 메서드 추가 |
| `src/lib/store/feed-store.ts` | 수정 | snapshotAt 업데이트 로직 |
| `src/lib/store/topic-store.ts` | 생성 | TopicStore 클래스 (시드 카테고리 + CRUD) |
| `src/lib/store/index.ts` | 수정 | topicStore 인스턴스 export |
| `data/topics.json` | 생성 | 시드 카테고리 초기 데이터 |

**산출물:** 타입 안전한 데이터 모델, 스토어 메서드 TDD 검증 완료
**의존성:** 없음 (첫 단계)

---

### Phase 2: GROQ 클라이언트 & AI 주제 분류
**작업 내용:**
- GROQ API 클라이언트 모듈 생성 (`groq-sdk` 패키지 사용)
- 주제 분류 프롬프트 설계 — 시드 카테고리 목록 제공, 새 카테고리 허용
- `classifyArticleTopic()` 함수 구현
- 시드 카테고리 정의:
  ```
  AI/ML, Frontend, Backend, DevOps, Security, Database,
  Mobile, Cloud, Programming Languages, Open Source,
  Product/Design, Career/Culture
  ```

**수정 파일:**
| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/lib/ai/groq-client.ts` | 생성 | GROQ API 클라이언트 (chat completion) |
| `src/lib/ai/topic-classifier.ts` | 생성 | 주제 분류 로직 + 프롬프트 |
| `src/lib/ai/prompts.ts` | 수정 | 주제 분류 프롬프트 추가 |
| `.env.local` | 수정 | GROQ_API_KEY 추가 |
| `.env.example` | 생성/수정 | GROQ_API_KEY placeholder |

**산출물:** GROQ 기반 주제 분류 함수, 단위 테스트 통과
**의존성:** Phase 1

---

### Phase 3: Snapshot 메커니즘 & RSS 동기화 수정
**작업 내용:**
- `differ.ts` 수정: snapshotAt 이전 발행 글 필터링 로직 추가
- `refresh/route.ts` 수정:
  - 피드별 최초 동기화 시 `snapshotAt = new Date().toISOString()` 기록
  - 새 아티클 저장 후 GROQ로 주제 분류 → `article.topic` 설정
  - TopicStore에 새 카테고리 자동 등록
- snapshotAt이 null인 피드는 최초 동기화로 간주 (모든 글 가져옴)

**수정 파일:**
| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/lib/rss/differ.ts` | 수정 | snapshotAt 기반 필터링 추가 |
| `src/app/api/feeds/refresh/route.ts` | 수정 | snapshot 기록, 주제 분류 통합 |

**산출물:** snapshot 필터링 동작, 주제 자동 분류 통합 테스트 통과
**의존성:** Phase 1, Phase 2

---

### Phase 4: API 라우트 확장
**작업 내용:**
- `GET /api/articles` 확장: `topic`, `year` 쿼리 파라미터 지원
- `GET /api/topics` 신규: 전체 주제 목록 반환
- `POST /api/ai/search` 신규: GROQ 기반 AI 검색 엔드포인트
  - 요청: `{ query, topic?, year?, lang }`
  - 응답: `{ answer, relatedArticles: Article[] }`
  - 현재 필터 범위 내 아티클을 컨텍스트로 GROQ에 전달

**수정 파일:**
| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/app/api/articles/route.ts` | 수정 | topic, year 파라미터 추가 |
| `src/app/api/topics/route.ts` | 생성 | 주제 목록 API |
| `src/app/api/ai/search/route.ts` | 생성 | AI 검색 API (GROQ) |

**산출물:** API 엔드포인트 동작, 통합 테스트 통과
**의존성:** Phase 1, Phase 2, Phase 3

---

### Phase 5: UI - 주제 필터 칩 & 연도 탭
**작업 내용:**
- `TopicFilter` 컴포넌트: 주제별 필터 칩 (전체/카테고리별)
- `YearTabs` 컴포넌트: 연도별 탭 (최신순 정렬)
- `ArticleList` 리팩토링: topic + year 상태 관리, API 호출 수정
- 홈 페이지에 TopicFilter + YearTabs + ArticleList 조합
- URL 쿼리 파라미터로 필터 상태 유지 (`?topic=AI/ML&year=2026`)

**수정 파일:**
| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/components/article/TopicFilter.tsx` | 생성 | 주제 필터 칩 UI |
| `src/components/article/YearTabs.tsx` | 생성 | 연도 탭 UI |
| `src/components/article/ArticleList.tsx` | 수정 | 필터/탭 통합, API 호출 수정 |
| `src/app/[locale]/page.tsx` | 수정 | TopicFilter, YearTabs 배치 |

**산출물:** 필터/탭 UI 동작, 필터링된 데이터 표시 확인
**의존성:** Phase 4

---

### Phase 6: UI - AI 검색 사이드바
**작업 내용:**
- `AiSearchSidebar` 컴포넌트 생성
  - 검색 입력 필드
  - AI 답변 영역 (마크다운 렌더링)
  - 관련 아티클 카드 목록
  - 로딩/에러 상태
- 레이아웃 수정: 데스크톱 lg+ 에서 사이드바 고정 표시
- 모바일: FAB(Floating Action Button) + 슬라이드 오버레이
- 현재 선택된 topic + year를 사이드바에 전달

**수정 파일:**
| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/components/sidebar/AiSearchSidebar.tsx` | 생성 | AI 검색 사이드바 |
| `src/components/sidebar/SearchInput.tsx` | 생성 | 검색 입력 컴포넌트 |
| `src/components/sidebar/AiAnswer.tsx` | 생성 | AI 답변 표시 |
| `src/components/sidebar/RelatedArticles.tsx` | 생성 | 관련 아티클 목록 |
| `src/app/[locale]/layout.tsx` | 수정 | 사이드바 레이아웃 통합 |
| `src/app/[locale]/page.tsx` | 수정 | 사이드바에 필터 상태 전달 |
| `src/globals.css` | 수정 | 사이드바 레이아웃 스타일 |

**산출물:** AI 검색 사이드바 동작, 반응형 레이아웃 확인
**의존성:** Phase 4, Phase 5

---

### Phase 7: i18n & 문서 업데이트
**작업 내용:**
- ko.json, en.json에 새 번역 키 추가 (사이드바, 주제 필터, 연도 탭 관련)
- README.md 업데이트 (새 기능 설명, GROQ 설정 가이드)
- CLAUDE.md 업데이트 (아키텍처, 디렉토리 규칙 반영)

**수정 파일:**
| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `src/i18n/messages/ko.json` | 수정 | 한국어 번역 추가 |
| `src/i18n/messages/en.json` | 수정 | 영어 번역 추가 |
| `README.md` | 수정 | 새 기능 문서화 |
| `CLAUDE.md` | 수정 | 아키텍처/디렉토리 규칙 업데이트 |

**산출물:** 완전한 i18n 지원, 문서 최신화
**의존성:** Phase 5, Phase 6

---

## 전체 수정 대상 파일 요약

| 파일 | 변경 유형 | Phase |
|------|----------|-------|
| `src/types/index.ts` | 수정 | 1 |
| `src/lib/store/article-store.ts` | 수정 | 1 |
| `src/lib/store/feed-store.ts` | 수정 | 1 |
| `src/lib/store/topic-store.ts` | 생성 | 1 |
| `src/lib/store/index.ts` | 수정 | 1 |
| `data/topics.json` | 생성 | 1 |
| `src/lib/ai/groq-client.ts` | 생성 | 2 |
| `src/lib/ai/topic-classifier.ts` | 생성 | 2 |
| `src/lib/ai/prompts.ts` | 수정 | 2 |
| `.env.local` | 수정 | 2 |
| `.env.example` | 생성/수정 | 2 |
| `src/lib/rss/differ.ts` | 수정 | 3 |
| `src/app/api/feeds/refresh/route.ts` | 수정 | 3 |
| `src/app/api/articles/route.ts` | 수정 | 4 |
| `src/app/api/topics/route.ts` | 생성 | 4 |
| `src/app/api/ai/search/route.ts` | 생성 | 4 |
| `src/components/article/TopicFilter.tsx` | 생성 | 5 |
| `src/components/article/YearTabs.tsx` | 생성 | 5 |
| `src/components/article/ArticleList.tsx` | 수정 | 5 |
| `src/app/[locale]/page.tsx` | 수정 | 5, 6 |
| `src/components/sidebar/AiSearchSidebar.tsx` | 생성 | 6 |
| `src/components/sidebar/SearchInput.tsx` | 생성 | 6 |
| `src/components/sidebar/AiAnswer.tsx` | 생성 | 6 |
| `src/components/sidebar/RelatedArticles.tsx` | 생성 | 6 |
| `src/app/[locale]/layout.tsx` | 수정 | 6 |
| `src/globals.css` | 수정 | 6 |
| `src/i18n/messages/ko.json` | 수정 | 7 |
| `src/i18n/messages/en.json` | 수정 | 7 |
| `README.md` | 수정 | 7 |
| `CLAUDE.md` | 수정 | 7 |

## 인수 조건 (Acceptance Criteria)

- [ ] 아티클 저장 시 GROQ API로 주제가 자동 분류된다
- [ ] 시드 카테고리 외 새 카테고리가 자동 등록된다
- [ ] 홈 페이지에 주제 필터 칩이 표시되고, 클릭 시 해당 주제만 필터링된다
- [ ] 연도 탭이 최신순으로 표시되고, 탭 전환 시 해당 연도 아티클만 표시된다
- [ ] AI 검색 사이드바에서 질문하면 현재 필터 범위 내 답변 + 관련 아티클이 표시된다
- [ ] 데스크톱(lg+)에서 사이드바가 항상 표시된다
- [ ] 모바일에서 토글 버튼으로 사이드바를 열고 닫을 수 있다
- [ ] RSS 최초 동기화 시 snapshotAt이 기록된다
- [ ] 재동기화 시 snapshotAt 이전 발행 글은 추가되지 않는다
- [ ] 한국어/영어 번역이 완전하다
- [ ] 모든 새 기능에 대한 테스트가 통과한다
- [ ] GROQ_API_KEY가 없을 때 graceful degradation (주제 미분류, 검색 비활성화)

## 의존성 그래프

```
Phase 1 (데이터 모델) ─┬─→ Phase 2 (GROQ + 분류) ─→ Phase 3 (Snapshot + 통합)
                       │                                      │
                       └──────────────────────────────────────→ Phase 4 (API 확장)
                                                               │
                                                        ┌──────┴──────┐
                                                        ▼             ▼
                                                  Phase 5 (UI필터)  Phase 6 (사이드바)
                                                        │             │
                                                        └──────┬──────┘
                                                               ▼
                                                        Phase 7 (i18n + 문서)
```

## 기술 결정 사항

1. **GROQ SDK**: `groq-sdk` npm 패키지 사용 (공식 SDK)
2. **주제 분류 모델**: GROQ에서 제공하는 llama3 또는 mixtral 사용
3. **AI 검색 컨텍스트**: 현재 필터 범위 아티클의 제목+요약을 프롬프트에 포함
4. **사이드바 상태 관리**: URL 쿼리 파라미터 + React state (Server Component에서 초기값 전달)
5. **Graceful degradation**: GROQ_API_KEY 미설정 시 주제="Uncategorized", 검색 비활성화
