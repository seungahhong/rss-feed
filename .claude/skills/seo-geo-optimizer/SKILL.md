---
name: seo-geo-optimizer
description: 웹사이트의 SEO 및 GEO(생성형 검색 엔진 최적화)를 수행하는 스킬. 키워드 분석, 구조화 데이터(JSON-LD) 생성, 전통적 검색엔진과 AI 검색엔진 모두에 대한 최적화를 지원한다. 사용자가 "검색 최적화", "SEO", "GEO", "검색 순위", "AI 검색 노출", "메타태그", "스키마 마크업", "키워드 분석", "색인", "JSON-LD" 등을 언급할 때 사용. 검색 가시성을 개선하려는 모든 상황에서 반드시 이 스킬을 활용할 것.
---

# 검색 최적화 스킬 (SEO/GEO)

웹사이트를 전통적 검색엔진과 AI 검색엔진 모두에서 최적화하는 종합 가이드.

## 핵심 개념

- **SEO** = 검색엔진 최적화 (전통적 검색엔진 대상)
- **GEO** = 생성형 검색엔진 최적화 (AI 검색엔진 대상)

**핵심 인사이트:** AI 검색엔진은 페이지를 "순위 매기기"하지 않는다 — **출처로 인용**한다. 인용되는 것이 곧 1위에 해당한다.

---

## 워크플로우

### 1단계: 웹사이트 감사

대상 URL을 분석하여 현재 SEO/GEO 상태를 파악한다.

**점검 항목:**
```bash
# 메타태그 확인
curl -sL "https://example.com" | grep -E "<title>|<meta name=\"description\"|application/ld\+json" | head -20

# robots.txt 확인 (AI 봇 접근 허용 여부)
curl -s "https://example.com/robots.txt"

# 사이트맵 확인
curl -s "https://example.com/sitemap.xml" | head -50
```

**AI 봇 접근 확인 — robots.txt에서 다음 봇이 허용되어야 한다:**
- 전통적 검색엔진 봇 (검색엔진별 크롤러)
- AI 검색 봇 (AI 서비스별 크롤러)
- 생성형 AI 봇 (LLM 기반 서비스 크롤러)

### 2단계: 키워드 리서치

**WebSearch** 도구를 활용하여 대상 키워드를 조사한다:

**분석 항목:**
- 검색량과 난이도
- 경쟁사 키워드 전략
- 롱테일 키워드 기회
- 다국어/다의어 키워드 충돌 여부

### 3단계: GEO 최적화 (AI 검색엔진)

프린스턴 대학 연구 기반 **9가지 GEO 방법론**을 적용한다 (상세: [references/geo-methods.md](./references/geo-methods.md)):

| 방법 | 가시성 향상 | 적용 방법 |
|------|-----------|----------|
| **출처 인용** | +40% | 권위 있는 출처와 참고문헌 추가 |
| **통계 추가** | +37% | 구체적 수치와 데이터 포인트 포함 |
| **인용구 추가** | +30% | 전문가 발언을 출처와 함께 추가 |
| **권위적 어조** | +25% | 자신감 있는 전문가 문체 사용 |
| **이해하기 쉽게** | +20% | 복잡한 개념을 쉽게 풀어쓰기 |
| **전문 용어** | +18% | 도메인별 전문 용어 포함 |
| **고유 어휘** | +15% | 어휘 다양성 높이기 |
| **유창성 최적화** | +15-30% | 가독성과 흐름 개선 |
| ~~키워드 남용~~ | **-10%** | **절대 금지 — 가시성 감소** |

**최적 조합:** 유창성 + 통계 = 최대 효과

**FAQPage 스키마 추가** (+40% AI 가시성):
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [{
    "@type": "Question",
    "name": "[주제]란 무엇인가?",
    "acceptedAnswer": {
      "@type": "Answer",
      "text": "[출처]에 따르면, [통계와 함께 답변]."
    }
  }]
}
```

**콘텐츠 구조 최적화:**
- "답변 우선" 형식 (핵심 답변을 상단에 배치)
- 명확한 H1 > H2 > H3 계층 구조
- 불릿 포인트와 번호 목록 활용
- 비교 데이터는 표 형식 사용
- 짧은 단락 (2-3문장 이내)

### 4단계: 전통적 SEO 최적화

**메타태그 템플릿:**
```html
<title>{주요키워드} - {브랜드} | {부가키워드}</title>
<meta name="description" content="{키워드 포함 설명, 150-160자}">

<!-- Open Graph -->
<meta property="og:title" content="{제목}">
<meta property="og:description" content="{설명}">
<meta property="og:image" content="{이미지 URL 1200x630}">
<meta property="og:url" content="{정규 URL}">
<meta property="og:type" content="website">
```

**JSON-LD 스키마** (상세: [references/schema-templates.md](./references/schema-templates.md)):
- WebPage / Article — 콘텐츠 페이지
- FAQPage — FAQ 섹션
- Product — 상품 페이지
- Organization — 소개 페이지
- SoftwareApplication — 도구/앱 페이지
- HowTo — 튜토리얼/가이드
- BreadcrumbList — 네비게이션 계층
- LocalBusiness — 지역 비즈니스

**SEO 체크리스트:**
- [ ] H1에 주요 키워드 포함
- [ ] 이미지에 설명적 alt 텍스트
- [ ] 관련 콘텐츠로 내부 링크
- [ ] 모바일 친화적
- [ ] 페이지 로딩 3초 이내

### 5단계: 검증 및 모니터링

**스키마 검증:**
- 구조화 데이터 검증 도구로 JSON-LD 유효성 확인
- 리치 결과 테스트로 검색 결과 미리보기 확인

**색인 상태 확인:**
```bash
# 검색엔진에서 사이트 색인 확인
# site:도메인 검색으로 색인된 페이지 수 확인
```

**최적화 보고서 양식:**
```markdown
## SEO/GEO 최적화 보고서

### 현재 상태
- 메타태그: ✅/❌
- 스키마 마크업: ✅/❌
- AI 봇 접근: ✅/❌
- 모바일 친화성: ✅/❌
- 페이지 속도: X초

### 권고사항
1. [우선순위 1 조치]
2. [우선순위 2 조치]
3. [우선순위 3 조치]

### 적용된 GEO 최적화
- [ ] FAQPage 스키마 추가
- [ ] 통계 데이터 포함
- [ ] 출처 인용 추가
- [ ] 답변 우선 구조 적용
```

---

## 플랫폼별 최적화 전략

각 AI 검색 플랫폼은 고유한 랭킹 요소를 가진다 (상세: [references/platform-guide.md](./references/platform-guide.md)):

### AI 대화형 검색 (LLM 기반)
- **브랜드 도메인 권위** 우선 (자사 도메인이 서드파티보다 인용률 높음)
- **콘텐츠 신선도** 중요 (30일 이내 업데이트 시 인용률 3.2배 상승)
- **백링크** 중요 (고품질 참조 도메인 확보)

### AI 검색 엔진 (RAG 기반)
- robots.txt에서 전용 봇 허용 필수
- **FAQ 스키마** 활용 (인용률 상승)
- **PDF 문서** 우대 (인용 우선순위)
- 키워드보다 **의미적 관련성** 중시

### 전통 검색엔진 AI 답변
- **E-E-A-T** 최적화 (경험, 전문성, 권위성, 신뢰성)
- **구조화 데이터** 필수 (스키마 마크업)
- **주제 권위** 구축 (콘텐츠 클러스터 + 내부 링크)
- **권위 있는 인용** 추가 (+132% 가시성)

### 생태계 연동 검색
- 연관 플랫폼 색인 필수
- **생태계 내 시그널** 활용 (관련 플랫폼 언급)
- 페이지 속도 **2초 이내**
- 명확한 **엔티티 정의**

### 독립 AI 어시스턴트
- **대안 검색엔진 색인** 확인 (주류 검색엔진 외 색인 여부)
- 높은 **사실 밀도** (데이터 풍부한 콘텐츠 선호)
- 명확한 **구조적 명료성** (추출하기 쉬운 형태)

---

## 감사 체크리스트 요약

**P0 (필수):**
- robots.txt에 AI 봇 접근 허용
- HTTPS 적용
- 모바일 반응형
- title, meta description 최적화
- H1에 주요 키워드

**P1 (중요):**
- JSON-LD 스키마 마크업 (최소 WebPage + FAQPage)
- 사이트맵 제출
- Core Web Vitals 충족 (LCP < 2.5초, CLS < 0.1)
- 이미지 alt 텍스트
- 내부 링크 전략

**P2 (권장):**
- FAQ 섹션 + FAQPage 스키마
- 통계와 출처 인용 추가
- 콘텐츠 클러스터 구축
- 소셜 미디어 프로필 연결

---

## 레퍼런스

- [references/geo-methods.md](./references/geo-methods.md) — GEO 9가지 방법론 상세
- [references/schema-templates.md](./references/schema-templates.md) — JSON-LD 스키마 템플릿
- [references/platform-guide.md](./references/platform-guide.md) — 플랫폼별 랭킹 요소 상세
