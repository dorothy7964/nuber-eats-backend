import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import { AppModule } from "../src/app.module";
import { User } from "src/user/entities/user.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Verification } from "src/user/entities/verification.entity";
import { createAccountMutation } from "./mutations/createAccountMutation.";
import { loginMutation } from "./mutations/loginMutation";
import { userProfileQuery } from "./queries/userProfileQuery";
import { editProfileMutation } from "./mutations/editProfileMutation";
import { meQuery } from "./queries/meQuery";
import { verifyEmailMutation } from "./mutations/verifyEmailMutation";

/** 이메일 보내기 구현되면 mock함수 사용하기 
jest.mock("fetch", () => {
  return {
    post: jest.fn(),
  };
});
*/

const GRAPHQL_ENDPOINT = "/graphql";

const TEST_USER = {
  email: "e2e@gmail.com",
  password: "123",
};

describe("UserModule (e2e)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtToken: string;
  let usersRepository: Repository<User>;
  let verificationsRepository: Repository<Verification>;

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
    verificationsRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );

    await app.init();

    dataSource = module.get(DataSource); // AppModule에서 DataSource 인스턴스를 가져오기
  });

  afterAll(async () => {
    await dataSource.dropDatabase(); // 데이터베이스 삭제
    await dataSource.destroy(); // 연결 해제
    await app.close();
  });

  describe("createAccount", () => {
    const QUERY = createAccountMutation(TEST_USER.email, TEST_USER.password);

    it("계정을 생성합니다.", () => {
      return publicTest(QUERY)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.createAccount;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it("입력받은 이메일이 이미 존재한다면 계정 생성에 실패합니다.", () => {
      return publicTest(QUERY)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.createAccount;
          expect(ok).toBe(false);
          expect(error).toBe("이미 해당 이메일을 가진 사용자가 있습니다.");
        });
    });
  });

  describe("login", () => {
    const WRONG_PASSWORD = "XXX";

    const QUERY = loginMutation(TEST_USER.email, TEST_USER.password);
    const FAIL_QUERY = loginMutation(TEST_USER.email, WRONG_PASSWORD);

    it("정상적인 방법으로 로그인합니다.", () => {
      return publicTest(QUERY)
        .expect(200)
        .expect((res) => {
          const { ok, error, token } = res.body.data.login;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(token).toEqual(expect.any(String));
          jwtToken = token;
        });
    });

    it("잘못된 방법으로 로그인에 실패합니다.", () => {
      return publicTest(FAIL_QUERY)
        .expect(200)
        .expect((res) => {
          const { ok, error, token } = res.body.data.login;
          expect(ok).toBe(false);
          expect(error).toBe("암호가 잘못되었습니다.");
          expect(token).toBe(null);
        });
    });
  });

  describe("userProfile", () => {
    let userId: number;

    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });

    const query = (userId: number) => userProfileQuery(userId);

    it("유저 프로필을 확인합니다.", () => {
      return privateTest(query(userId))
        .expect(200)
        .expect((res) => {
          const { ok, error, user } = res.body.data.userProfile;
          expect(ok).toBe(true);
          expect(error).toBe(null);
          expect(user.id).toBe(userId);
        });
    });

    it("유저 프로필을 찾을 수 없습니다.", () => {
      const WRONG_USER_ID = 9999;

      return privateTest(query(WRONG_USER_ID))
        .expect(200)
        .expect((res) => {
          const { ok, error, user } = res.body.data.userProfile;
          expect(ok).toBe(false);
          expect(error).toBe("사용자를 찾을 수 없습니다.");
          expect(user).toBe(null);
        });
    });
  });

  describe("me", () => {
    const QUERY = meQuery();

    it("내 프로필 정보를 찾습니다.", () => {
      return privateTest(QUERY)
        .expect(200)
        .expect((res) => {
          const { email } = res.body.data.me;
          expect(email).toBe(TEST_USER.email);
        });
    });

    it("로그인 정보가 없을 경우 프로필 정보를 받아올 수 없습니다.", () => {
      return publicTest(QUERY)
        .expect(200)
        .expect((res) => {
          const { errors } = res.body;
          const [error] = errors;
          expect(error.message).toBe("Forbidden resource");
        });
    });
  });

  describe("editProfile", () => {
    const NEW_EMAIL = "new@mail.com";

    const EDIT_QUERY = editProfileMutation(NEW_EMAIL);
    const CHECK_EDIT_QUERY = meQuery();

    it("이메일을 변경합니다.", () => {
      return privateTest(EDIT_QUERY)
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.editProfile;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it("새 이메일 주소로 변경되었는지 확인합니다.", () => {
      return privateTest(CHECK_EDIT_QUERY)
        .expect(200)
        .expect((res) => {
          const { email } = res.body.data.me;
          expect(email).toBe(NEW_EMAIL);
        });
    });
  });

  describe("verifyEmail", () => {
    let verificationCode: string;

    beforeAll(async () => {
      const [verification] = await verificationsRepository.find();
      verificationCode = verification.code;
    });

    const query = (verificationCode: string) =>
      verifyEmailMutation(verificationCode);

    it("이메일 인증을 진행합니다.", () => {
      return publicTest(query(verificationCode))
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.verifyEmail;
          expect(ok).toBe(true);
          expect(error).toBe(null);
        });
    });

    it("잘못된 인증코드를 입력하여 이메일 인증에 실패합니다.", () => {
      const WRONG_CODE = "xxx";

      return publicTest(query(WRONG_CODE))
        .expect(200)
        .expect((res) => {
          const { ok, error } = res.body.data.verifyEmail;
          expect(ok).toBe(false);
          expect(error).toBe("확인 할 수 없습니다.");
        });
    });
  });
});
