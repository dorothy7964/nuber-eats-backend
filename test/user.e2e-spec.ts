import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { DataSource } from "typeorm";
import { AppModule } from "../src/app.module";

const GRAPHQL_ENDPOINT = "/graphql";

const testUser = {
  email: "e2e@gmail.com",
  password: "123",
};

describe("UserModule (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(DataSource); // AppModule에서 DataSource 인스턴스를 가져오기
  });

  afterAll(async () => {
    await dataSource.dropDatabase(); // 데이터베이스 삭제
    await dataSource.destroy(); // 연결 해제
    await app.close();
  });

  describe("createAccount", () => {
    it("should create account", () => {
      return publicTest(`
            mutation {
            createAccount(input: {
              email:"${testUser.email}",
              password:"${testUser.password}",
              role: Owner
            }) {
              ok
              error
            }
          }
          `)
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createAccount.ok).toBe(true);
          expect(res.body.data.createAccount.error).toBe(null);
        });
    });
  });

  it.todo("userProfile");
  it.todo("login");
  it.todo("me");
  it.todo("verifyEmail");
  it.todo("editProfile");
});
