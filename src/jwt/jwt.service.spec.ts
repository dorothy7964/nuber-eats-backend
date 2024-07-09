import { Test } from "@nestjs/testing";
import * as jwt from "jsonwebtoken";
import { CONFIG_OPTIONS } from "src/common/common.constants";
import { JwtService } from "./jwt.service";
import { Token } from "graphql";

const TEST_KEY = "testKey";
const USER_ID = 1;

// 인자로는 npm module의 이름이 들어간다.
jest.mock("jsonwebtoken", () => {
  return {
    sign: jest.fn(() => "TOKEN"),
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

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sign", () => {
    it("should return a signed token", () => {
      const token = service.sign(USER_ID);
      expect(typeof token).toBe("string");
      expect(jwt.sign).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledWith({ id: USER_ID }, TEST_KEY);
    });
  });
});