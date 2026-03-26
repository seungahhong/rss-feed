# 모킹 가이드

**시스템 경계에서만** 모킹한다:

- 외부 API (결제, 이메일 등)
- 데이터베이스 (경우에 따라 — 테스트 DB 선호)
- 시간/난수
- 파일 시스템 (경우에 따라)

모킹하지 않는 것:
- 자신의 클래스/모듈
- 내부 협력자
- 자신이 제어하는 모든 것

## 모킹 가능하게 설계하기

### 1. 의존성 주입

외부 의존성을 내부에서 생성하지 말고 매개변수로 받는다:

```typescript
// 모킹 쉬움
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// 모킹 어려움
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

### 2. SDK 스타일 인터페이스

범용 fetch 하나 대신 기능별 함수를 분리한다:

```typescript
// 좋음: 각 함수를 독립적으로 모킹 가능
const api = {
  getUser: (id) => fetch(`/users/${id}`),
  getOrders: (userId) => fetch(`/users/${userId}/orders`),
  createOrder: (data) => fetch('/orders', { method: 'POST', body: data }),
};

// 나쁨: 모킹 시 조건 분기가 필요
const api = {
  fetch: (endpoint, options) => fetch(endpoint, options),
};
```

SDK 방식의 이점:
- 각 모킹이 하나의 특정 형태만 반환
- 테스트 셋업에 조건 로직 불필요
- 어떤 엔드포인트를 테스트하는지 명확히 보임
- 엔드포인트별 타입 안전성
