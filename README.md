<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

# 실행

```javascript
 npm run start:dev
```

<br/><br/>

# Playground

http://localhost:3000/graphql

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
