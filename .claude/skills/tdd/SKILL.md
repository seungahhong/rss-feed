---
name: tdd
description: Red-Green-Refactor 루프 기반 테스트 주도 개발(TDD) 스킬. 사용자가 "TDD", "테스트 주도 개발", "red-green-refactor", "테스트 먼저", "테스트 기반 개발" 등을 언급하거나, 새로운 기능 구현/버그 수정 시 테스트를 먼저 작성하고 싶을 때 사용. 통합 테스트, 단위 테스트, 테스트 우선 개발 방식이 필요한 모든 상황에서 반드시 이 스킬을 활용할 것.
---

# 테스트 주도 개발 (TDD)

## 핵심 원칙

테스트는 공개 인터페이스를 통해 **동작**을 검증한다. "어떻게"가 아닌 "무엇을" 테스트한다. 내부 코드가 완전히 바뀌어도 테스트는 깨지지 않아야 한다.

- **좋은 테스트**: 공개 API로 실행, 명세처럼 읽힘, 리팩토링에 생존
- **나쁜 테스트**: 내부 모킹, 비공개 메서드 테스트, 구현 변경 시 깨짐

상세 예시: [references/tests.md](references/tests.md)

## 안티패턴: 수평 슬라이싱

테스트 전부 → 구현 전부 순서로 작성하지 않는다. **수직 슬라이싱**으로 진행한다:

```
올바른 방식: RED→GREEN: test1→impl1 → RED→GREEN: test2→impl2 → ...
잘못된 방식: RED: test1~5 전부 → GREEN: impl1~5 전부
```

## 워크플로우 (4단계)

### 1. 계획
- 테스트할 동작 목록 작성 (구현 단계가 아닌 동작 단위)
- 핵심 경로와 복잡한 로직에 집중, 모든 엣지 케이스를 다루지 않는다
- 사용자 승인 후 진행

### 2. 트레이서 불릿
```
RED:   첫 번째 동작 테스트 → 실패  |  GREEN: 최소 코드로 통과
```

### 3. 점진적 루프
```
RED:   다음 테스트 → 실패  |  GREEN: 최소 코드로 통과  (반복)
```
규칙: 한 번에 하나, 현재 테스트만큼의 코드만, 미래를 예상하지 않는다.

### 4. 리팩토링
모든 테스트 통과 후 중복 추출, 모듈 심화, SOLID 적용. **RED에서 리팩토링 금지.**

### 사이클별 체크리스트
```
[ ] 동작을 설명하는가 (구현이 아닌)
[ ] 공개 인터페이스만 사용하는가
[ ] 리팩토링에 생존하는가
[ ] 최소한의 코드인가
```

---

## 실전 TDD 패턴

### 저장소 계층
임시 디렉토리에서 실제 I/O 테스트. 모킹 않음.
```
빈 데이터 반환 → 쓰기/읽기 → 수정(update) → 동시성 안전
```
```typescript
beforeEach(() => { tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'test-')); });
afterEach(() => { await fs.rm(tmpDir, { recursive: true, force: true }); });
```

### 파서/변환기
인라인 테스트 데이터 사용. 외부 파일 의존 없음.
```
표준 형식 파싱 → HTML 제거 → 대안 형식 → 해시 생성
```

### AI/외부 서비스
테스트 가능 영역(프롬프트 빌더, 응답 파서, 큐)과 불가 영역(실제 API 호출)을 분리.
```
프롬프트 생성 → 응답 파싱 (JSON, 코드블록, 텍스트 내 추출) → 큐 순차 실행
```

### CRUD 모듈
```
빈 목록 → 추가(+ID생성) → ID조회 → 미존재 null → 삭제 → 수정 → 검색 → 페이지네이션
```

---

## 레퍼런스

| 주제 | 파일 |
|------|------|
| 좋은/나쁜 테스트 예시 | [references/tests.md](references/tests.md) |
| 모킹 가이드 | [references/mocking.md](references/mocking.md) |
| 인터페이스 설계 | [references/interface-design.md](references/interface-design.md) |
| 딥 모듈 | [references/deep-modules.md](references/deep-modules.md) |
| 리팩토링 후보 | [references/refactoring.md](references/refactoring.md) |
