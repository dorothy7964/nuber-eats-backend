<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# 실행

```javascript
 npm run start:dev
```

<br/><br/>

# jest 실행

```javascript
 npm run test:watch
```

<br/><br/>

# E2E 실행

```javascript
 npm run test:e2e
```

<br/><br/>

# Playground

http://localhost:3000/graphql

<br/><br/>

# Subscription

## 구독 설정

- "subscriptions-transport-ws" 오래된 웹소켓 프로토콜이다.

- "graphql-ws" 사용을 권장한다.
  - 현재 파라미터가 전송이 안돼서 사용하고 있지 않음

<br/><br/>

## 구독이 필요한 부분

언제 알림을 publish하고, 누가 subscription을 만들지 알아야 한다.

t: trigger /
s: subscription

- Pending Orders (Owner)

  - 레스토랑 오너는 대시보드에서 새로 들어오는 주문을 보게된다.
  - ( s: newOrder ) ( t: createOrder (newOrder))
  - pending orders resolve가 newOrder 이벤트에 listening 해야 된다는 것

  - createOrder(newOrder)가 trigger 되도록 하기

<br/>

- Order Status (Customer, Owner, Delivery)

  - 유저가 주문을 만들면 화면에서 주문 상태를 볼 수 있다.

  - ( s: orderUpdate ) ( t: editOrder (orderUpdate))

  - order status는 orderUpdate라는 trigger를 listening 하기

  - editOrder라는 resolver로 trigger 되도록 하기

  - editOrder가 order status를 업데이트 할 때마다 orderUpdate를 trigger하기

<br/>

- Pending Pickup Order (Delivery)

  - 주문한 요리가 완료되면 driver에게 픽업할 요리가 있다고 알림을 줘야 한다.

  - ( s: orderUpdate ) ( t: editOrder (orderUpdate))

<br/><br/>

# Role

Owner

- 사용자, 레스토랑 리스트 목록이 보인다.
- 레스토랑 생성, 수정, 삭제
- 주문 내역 변경은 요리 중, 요리 완료만 가능하다.

Client

- 레스토랑 등록한 사장, 대시보드가 보인다.
- 주문 내역을 변경할 수 없다.

Delivery

- 배달원, 현재 갈 수 있는 모든 주문의 실시간
- 주문 내역 변경은 픽업 중, 픽업 완료만 가능하다.

<br/><br/>

# 프로젝트 구조

```javascript
src/
├── auth/
│   ├── auth-user.decorator.ts
│   ├── auth.guard.ts
│   └── auth.module.ts
│   └── role.decorator.ts
├── common/
│   ├── dtos/
│   │   ├── output.dto.ts
│   ├── entities/
│   │   ├── core.entity.ts
│   ├── common.module.ts
├── jwt/
│   ├── jwt.interfaces.ts
│   └── jwt.middleware.ts
│   ├── jwt.module.ts
│   └── jwt.service.ts
├── mail/
│   ├── mail.interfaces.ts
│   ├── mail.module.ts
│   └── mail.service.ts
├── order/
│   ├── dtos/
│   │   ├── create-order.dto.ts
│   │   ├── edit-order.dto.ts
│   │   ├── get-order.dto.ts
│   │   ├── get-orders.dto.ts
│   │   ├── order-updates.dto.ts
│   │   ├── take-order.dto.ts
│   ├── entities/
│   │   ├── order-item.entity.ts
│   │   ├── order.entity.ts
│   ├── order.module.ts
│   ├── order.resolver.ts
│   └── order.service.ts
├── restaurant/
│   ├── dtos/
│   │   ├── all-categories.dto.ts
│   │   ├── category.dto.ts
│   │   ├── create-dish.dto.ts
│   │   ├── create-restaurant.dto.ts
│   │   ├── delete-dish.dto.ts
│   │   ├── delete-restaurant.dto.ts
│   │   ├── edit-dish.dto.ts
│   │   ├── edit-restaurant.dto.ts
│   │   ├── my-restaurant.ts
│   │   ├── my-restaurants.dto.ts
│   │   ├── restaurant.dto.ts
│   │   ├── restaurants.dto.ts
│   │   ├── search-restaurant.dto.ts
│   ├── entities/
│   │   ├── category.entity.ts
│   │   ├── dish.entity.ts
│   │   ├── restaurant.entity.ts
│   ├── restaurant.module.ts
│   ├── restaurant.resolver.ts
│   └── restaurant.service.ts
├── user/
│   ├── dtos/
│   │   ├── create-account.dto.ts
│   │   ├── edit-profile.dto.ts
│   │   ├── login.dto.ts
│   │   ├── user-profile.dto.ts
│   │   ├── verify-email.dto.ts
│   ├── entities/
│   │   ├── user.entity.ts
│   │   ├── verification.entity.ts
│   ├── user.module.ts
│   ├── user.resolver.ts
│   └── user.service.ts
├── app.module.ts
└── main.ts
```

<br/><br/>
