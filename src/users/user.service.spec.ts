import { Test } from "@nestjs/testing";
import { UserService } from "./user.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Verification } from "./entities/verification.entity";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { Repository } from "typeorm";

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const mockMailService = {
  sendEmailDemo: jest.fn(),
};

type MockRepository<T = any> = Partial<
  Record<keyof Repository<User>, jest.Mock>
>;

describe("UserService", () => {
  let service: UserService;
  let userRepository: MockRepository<User>;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          // USerRepository
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          // VerificationRepository
          provide: getRepositoryToken(Verification),
          useValue: mockRepository,
        },
        {
          // JwtService
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          // mailService
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
    userRepository = module.get(getRepositoryToken(User));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should fail if user exists", () => {
    expect(service).toBeDefined();
  });

  it.todo("createAccount");
  it.todo("login");
  it.todo("findById");
  it.todo("verifyEmail");
});
