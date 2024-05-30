import { Injectable } from "@nestjs/common";

@Injectable()
export class JwtService {
  testJwt() {
    console.log("JWT 테스트");
  }
}
