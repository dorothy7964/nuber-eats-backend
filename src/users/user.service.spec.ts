import { Test } from "@nestjs/testing";
import { UserService } from "./user.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "./entities/user.entity";
import { Verification } from "./entities/verification.entity";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { Repository } from "typeorm";

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
});

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
          useValue: mockRepository(),
        },
        {
          // VerificationRepository
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
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

  describe("createAccount", () => {
    const createAccountArgs = {
      email: "test@mail.com",
      password: "123",
      role: 0,
    };
    it("should fail if user exists", async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        email: "test@mail.com",
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: "There is a user with that email already",
      });
    });
    it("should create a new user", async () => {
      userRepository.findOne.mockResolvedValue(undefined);
      userRepository.create.mockReturnValue(createAccountArgs);
      await service.createAccount(createAccountArgs);
      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith(createAccountArgs);
      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(createAccountArgs);
    });
  });

  it.todo("login");
  it.todo("findById");
  it.todo("verifyEmail");
});
