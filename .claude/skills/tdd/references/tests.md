# 좋은 테스트와 나쁜 테스트

## 좋은 테스트

**통합 스타일**: 모킹이 아닌 실제 인터페이스를 통해 테스트한다.

```typescript
// 좋음: 관찰 가능한 동작을 테스트
test('사용자가 유효한 장바구니로 결제할 수 있다', async () => {
  const cart = createCart();
  cart.add(product);
  const result = await checkout(cart, paymentMethod);
  expect(result.status).toBe('confirmed');
});
```

특징:
- 사용자/호출자가 신경 쓰는 동작을 테스트
- 공개 API만 사용
- 내부 리팩토링에도 살아남음
- "무엇(WHAT)"을 설명, "어떻게(HOW)"가 아님
- 테스트당 하나의 논리적 단언

## 나쁜 테스트

**구현 세부사항 테스트**: 내부 구조에 결합되어 있다.

```typescript
// 나쁨: 구현 세부사항을 테스트
test('checkout이 paymentService.process를 호출한다', async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

경고 신호:
- 내부 협력자를 모킹
- 비공개 메서드 테스트
- 호출 횟수/순서에 대한 단언
- 동작 변경 없이 리팩토링하면 테스트가 깨짐
- 테스트 이름이 "어떻게(HOW)"를 설명

```typescript
// 나쁨: 인터페이스를 우회하여 검증
test('createUser가 DB에 저장한다', async () => {
  await createUser({ name: 'Alice' });
  const row = await db.query('SELECT * FROM users WHERE name = ?', ['Alice']);
  expect(row).toBeDefined();
});

// 좋음: 인터페이스를 통해 검증
test('createUser로 만든 사용자를 조회할 수 있다', async () => {
  const user = await createUser({ name: 'Alice' });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe('Alice');
});
```
