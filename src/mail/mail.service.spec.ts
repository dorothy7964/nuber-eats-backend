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

  // ! 에러 확인
  // describe("sendVerificationEmail", () => {
  //   it("should call sendEmail", () => {
  //     const sendVerificationEmailArgs = {
  //       email: "email",
  //       code: "code",
  //     };

  //     service.sendVerificationEmail(
  //       sendVerificationEmailArgs.email,
  //       sendVerificationEmailArgs.code,
  //     );

  //     jest
  //       .spyOn(service, "sendEmail")
  //       .mockImplementation(async () => Promise.resolve(true));

  //     expect(service.sendEmail).toHaveBeenCalledTimes(1);
  //     expect(service.sendEmail).toHaveBeenCalledWith(
  //       "Verify Your Email",
  //       "verify-email",
  //       [
  //         { key: "code", value: sendVerificationEmailArgs.code },
  //         { key: "username", value: sendVerificationEmailArgs.email },
  //       ],
  //     );
  //   });
  // });

  describe("sendEmail", () => {
    it("sends email", async () => {
      const formSpy = jest.spyOn(FormData.prototype, "append");
      const fetchSpy = jest.spyOn(fetch, "default").mockResolvedValue({
        ok: true,
        json: async () => ({ id: "test-id" }),
      } as any);

      const ok = await service.sendEmail("test@test.com", "Test Subject", []);

      expect(formSpy).toHaveBeenCalled();
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          `https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`,
        ),
        expect.any(Object),
      );
      expect(ok).toEqual(true);
    });

    it("fails on error", async () => {
      jest.spyOn(FormData.prototype, "append");
      jest
        .spyOn(fetch, "default")
        .mockRejectedValue(new Error("Failed to send email"));

      const ok = await service.sendEmail("test@test.com", "Test Subject", []);
      expect(ok).toEqual(false);
    });
  });
});
