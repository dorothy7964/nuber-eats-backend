import { Test } from "@nestjs/testing";
import * as jwt from "jsonwebtoken";
import { CONFIG_OPTIONS } from "src/common/common.constants";
import { JwtService } from "./jwt.service";

const TEST_KEY = "testKey";
const USER_ID = 1;

jest.mock("jsonwebtoken", () => {
  return {
    sign: jest.fn(() => "TOKEN"),
    verify: jest.fn(() => ({ id: USER_ID })),
  };
});

describe("JwtService", () => {
  let service: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: CONFIG_OPTIONS,
          useValue: { privateKey: TEST_KEY },
        },
      ],
    }).compile();

    service = module.get<JwtService>(JwtService);
  });

  it("JwtService를 정의합니다.", () => {
    expect(service).toBeDefined();
  });

  describe("sign", () => {
    it("서명된 토큰을 반환합니다.", () => {
      const token = service.sign(USER_ID);
      expect(typeof token).toBe("string");
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: USER_ID }, TEST_KEY);
    });
  });

  describe("verify", () => {
    it("토큰 안의 내용을 반환합니다.", () => {
      const TOKEN = "TOKEN";
      const decodedToken = service.verify(TOKEN);
      expect(decodedToken).toEqual({ id: USER_ID });
      expect(jwt.verify).toHaveBeenCalledTimes(1);
      expect(jwt.verify).toHaveBeenCalledWith(TOKEN, TEST_KEY);
    });
  });
});
