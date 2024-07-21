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
├── restaurant/
│   ├── dtos/
│   │   ├── create-restaurant.dto.ts
│   │   ├── update-restaurant.dto.ts
│   ├── entities/
│   │   ├── category.entity.ts
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

# User Entity

- id
- createAt
- updateAt

<br/><br/>

- email
- password
- role (client | owner | delivery)
  - client : 사용자, 레스토랑 리스트 목록이 보인다.
  - owner : 레스토랑 등록한 사장, 대시보드가 보인다.
  - delivery : 배달원, 현재 갈 수 있는 모든 주문의 실시간 상황이 보인다.
    <br/><br/>

# Role

Owner

- 레스토랑 생성, 수정, 삭제
