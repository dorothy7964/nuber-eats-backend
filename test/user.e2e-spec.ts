import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";

describe("UserModule (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      // 기본적으로 전체 모듈인 AppModule을 import 하기
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it.todo("me");
  it.todo("userProfile");
  it.todo("editProfile");
  it.todo("createAccount");
  it.todo("login");
  it.todo("verifyEmail");
});
