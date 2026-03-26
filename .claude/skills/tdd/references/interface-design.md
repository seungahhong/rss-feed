# 테스트 가능한 인터페이스 설계

좋은 인터페이스는 테스트를 자연스럽게 만든다:

## 1. 의존성을 받아라, 생성하지 마라

```typescript
// 테스트 가능
function processOrder(order, paymentGateway) {}

// 테스트 어려움
function processOrder(order) {
  const gateway = new StripeGateway();
}
```

## 2. 결과를 반환하라, 사이드 이펙트를 만들지 마라

```typescript
// 테스트 가능
function calculateDiscount(cart): Discount {}

// 테스트 어려움
function applyDiscount(cart): void {
  cart.total -= discount;
}
```

## 3. 작은 표면적

- 메서드가 적을수록 = 필요한 테스트가 줄어듦
- 파라미터가 적을수록 = 테스트 셋업이 단순해짐
