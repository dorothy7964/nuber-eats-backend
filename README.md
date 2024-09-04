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

#  Task Scheduling 

```javascript
npm install --save @nestjs/schedule
```

- 원하는 time interval, 또는 정해진 시간과 날짜에 fuction을 실행할 수 있다.

<br/><br/>

### cron pattern

```javascript
* * * * * *
| | | | | |
| | | | | day of week
| | | | months
| | | day of month
| | hours
| minutes
seconds (optional)
```

- Asterisk (e.g. `*`)

  - 별표시는 “매” 즉 “모든” 것을 포함한 의미 이다.

- Ranges (e.g. `1-3,5`)
  - Range는 1-3 또는 1과 5를 의미
- Steps (e.g. `*/2`)
  - 2씩 간격을 의

<br/><br/>

# Playground

http://localhost:4000/graphql

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

# Payment

## Paddle, 소프트웨어와 디지털 내용물만 거래 가능

- 거의 모든 나라에 지원이 된다.
- 은행 송금이나 여러 방법을 통해 결제를 받을 수 있다.
- 회사가 없어도 개인으로 돈을 받을 수 있다.
- 가장 큰 장벽은 실제 물건을 팔 수 없고 디지털 내용물만 결제할 수 있다.
  - 만약 티셔츠 회사를 운영한다면 paddle를 사용할 수 없다.
- 패들은 많은 백엔드가 필요하지 않는다. (프론트에 이미 많음)
  - 신용카드를 handle할 필요 없음 (신용카드의 verification, 번호, 보안)

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
