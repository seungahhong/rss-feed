# JSON-LD 스키마 템플릿

SEO 및 GEO 최적화를 위한 구조화 데이터(JSON-LD) 템플릿 모음.

## 1. FAQPage (AI 가시성 +40%)

FAQ 섹션에 가장 효과적. AI 검색엔진이 답변을 인용하기 쉬운 구조.

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "질문 내용",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "답변 내용. 통계와 출처를 포함하면 인용률 상승."
      }
    }
  ]
}
```

## 2. WebPage (기본 콘텐츠 페이지)

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "페이지 제목",
  "description": "페이지 설명",
  "url": "https://example.com/page",
  "author": { "@type": "Organization", "name": "조직명" },
  "datePublished": "2026-01-01",
  "dateModified": "2026-03-19"
}
```

## 3. Article (블로그/뉴스)

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "기사 제목",
  "description": "기사 요약",
  "author": { "@type": "Person", "name": "저자명" },
  "publisher": {
    "@type": "Organization",
    "name": "발행사",
    "logo": { "@type": "ImageObject", "url": "https://example.com/logo.png" }
  },
  "datePublished": "2026-03-19",
  "image": "https://example.com/image.jpg"
}
```

## 4. SoftwareApplication (도구/앱)

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "앱 이름",
  "description": "앱 설명",
  "applicationCategory": "DeveloperApplication",
  "operatingSystem": "Web",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "150"
  }
}
```

## 5. Organization (소개 페이지)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "조직명",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "description": "조직 설명",
  "sameAs": [
    "https://github.com/org",
    "https://linkedin.com/company/org"
  ]
}
```

## 6. Product (상품 페이지)

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "상품명",
  "description": "상품 설명",
  "image": "https://example.com/product.jpg",
  "offers": {
    "@type": "Offer",
    "price": "29900",
    "priceCurrency": "KRW",
    "availability": "https://schema.org/InStock"
  }
}
```

## 7. HowTo (튜토리얼/가이드)

```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "가이드 제목",
  "description": "가이드 설명",
  "step": [
    { "@type": "HowToStep", "name": "1단계", "text": "설명" },
    { "@type": "HowToStep", "name": "2단계", "text": "설명" }
  ]
}
```

## 8. BreadcrumbList (네비게이션)

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "홈", "item": "https://example.com" },
    { "@type": "ListItem", "position": 2, "name": "블로그", "item": "https://example.com/blog" }
  ]
}
```

## 검증 도구

- **구조화 데이터 검증**: https://validator.schema.org/
- **리치 결과 테스트**: https://search.google.com/test/rich-results
- **검색 콘솔**: 검색엔진별 웹마스터 도구에서 구조화 데이터 오류 확인
