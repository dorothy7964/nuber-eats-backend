import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import { AppModule } from "../src/app.module";
import { User } from "src/user/entities/user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import exp from "constants";

/** 이메일 보내기 구현되면 mock함수 사용하기 
jest.mock("fetch", () => {
  return {
    post: jest.fn(),
  };
});
*/

const GRAPHQL_ENDPOINT = "/graphql";

const testUser = {
  email: "e2e@gmail.com",
  password: "123",
};

describe("UserModule (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken: string;
  let usersRepository: Repository<User>;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);
  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set("X-JWT", jwtToken).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    await app.init();

    dataSource = module.get(DataSource); // AppModule에서 DataSource 인스턴스를 가져오기
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
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.ok).toBe(true);
          expect(createAccount.error).toBe(null);
        });
    });

    it("should fail if account already exists", () => {
      return publicTest(`
          mutation {
            createAccount(input: {
              email:"${testUser.email}",
              password:"${testUser.password}",
              role:Owner
            }) {
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                createAccount: { ok, error },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe("There is a user with that email already");
        });
    });
  });

  describe("login", () => {
    it("should login with correct credentials", () => {
      return publicTest(`
          mutation {
            login(input:{
              email:"${testUser.email}",
              password:"${testUser.password}",
            }) {
              ok
              error
              token
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(true);
          expect(login.error).toBe(null);
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });

    it("should not be able to login with wrong credentials", () => {
      return publicTest(`
          mutation {
            login(input:{
              email:"${testUser.email}",
              password:"xxx",
            }) {
              ok
              error
              token
            }
          }
        `)
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBe(false);
          expect(login.error).toBe("Wrong password");
          expect(login.token).toBe(null);
        });
    });
  });

  describe("userProfile", () => {
    let userId: number;

    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    it("should see a user's profile", () => {
      return privateTest(
        `
          {
            userProfile(userId: ${userId}) {
              ok
              error
              user {
                id
              }
            }
          }
          `,
      )
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(id).toBe(userId);
        });
    });

    it("should not find a profile", () => {
      return privateTest(
        `
          {
            userProfile(userId: 9999) {
              ok
              error
              user {
                id
              }
            }
          }
          `,
      )
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBe(false);
          expect(error).toBe("User Not Found");
          expect(user).toBe(null);
        });
    });
  });

  describe("me", () => {
    it("should find my profile", () => {
      return privateTest(
        `
          {
            me {
              id
              email
            }
          }
          `,
      )
        .expect(200)
        .expect((res) => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(testUser.email);
        });
    });

    it("should not allow logged out user", () => {
      return publicTest(
        `
          {
            me {
              id
              email
            }
          }
          `,
      )
        .expect(200)
        .expect((res) => {
          const {
            body: { errors },
          } = res;
          const [error] = errors;
          expect(error.message).toBe("Forbidden resource");
        });
    });
  });

  it.todo("verifyEmail");
  it.todo("editProfile");
});
