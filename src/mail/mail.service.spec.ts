import { Test } from "@nestjs/testing";
import fetch from "node-fetch";
import * as FormData from "form-data";
import { CONFIG_OPTIONS } from "src/common/common.constants";
import { MailService } from "./mail.service";

jest.mock("node-fetch");
jest.mock("form-data");

const TEST_DOMAIN = "test-domain";
const TEST_API_KEY = "test-apiKey";
const TEST_FROM_EMAIL = "test-fromEmail";

describe("MailService", () => {
  let service: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: TEST_API_KEY,
            domain: TEST_DOMAIN,
            fromEmail: TEST_FROM_EMAIL,
          },
        },
      ],
    }).compile();
    service = module.get<MailService>(MailService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("sendVerificationEmail", () => {
    it("should call sendEmail", () => {
      const sendVerificationEmailArgs = {
        email: "email",
        code: "code",
      };

      service.sendVerificationEmail(
        sendVerificationEmailArgs.email,
        sendVerificationEmailArgs.code,
      );

      jest
        .spyOn(service, "sendEmail")
        .mockImplementation(async () => Promise.resolve(true));

      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith(
        "Verify Your Email",
        "verify-email",
        [
          { key: "code", value: sendVerificationEmailArgs.code },
          { key: "username", value: sendVerificationEmailArgs.email },
        ],
      );
    });
  });
});
