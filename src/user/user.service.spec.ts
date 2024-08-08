import { Test } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtService } from "src/jwt/jwt.service";
import { MailService } from "src/mail/mail.service";
import { Repository } from "typeorm";
import { User, UserRole } from "./entities/user.entity";
import { Verification } from "./entities/verification.entity";
import { UserService } from "./user.service";

const mockRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  findOne: jest.fn(),
  findOneOrFail: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => "signed-token"),
  verify: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

type MockRepository<T = any> = Partial<
  Record<keyof Repository<User>, jest.Mock>
>;

describe("UserService", () => {
  let service: UserService;
  let userRepository: MockRepository<User>;
  let verificationRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          // UserRepository
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
          useValue: mockJwtService(),
        },
        {
          // mailService
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();
    service = module.get<UserService>(UserService);
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
    userRepository = module.get(getRepositoryToken(User));
    verificationRepository = module.get(getRepositoryToken(Verification));
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createAccount", () => {
    const createAccountArgs = {
      email: "test@mail.com",
      password: "123",
      role: UserRole.Client,
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
      userRepository.save.mockReturnValue(createAccountArgs);
      verificationRepository.create.mockReturnValue({
        user: createAccountArgs,
      });
      verificationRepository.save.mockResolvedValue({
        code: "code",
      });

      const result = await service.createAccount(createAccountArgs);

      expect(userRepository.create).toHaveBeenCalledTimes(1);
      expect(userRepository.create).toHaveBeenCalledWith(createAccountArgs);

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith(createAccountArgs);

      expect(verificationRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(verificationRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationRepository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );
      expect(result).toEqual({ ok: true });
    });

    it("should fail on exception", async () => {
      userRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({ ok: false, error: "Couldn`t create account" });
    });
  });

  describe("login", () => {
    const loginArgs = {
      email: "loginTest@email.com",
      password: "password",
    };

    it("should fail if user does not exist", async () => {
      // findOne의 리턴 값을 false로 mock 하기
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.login(loginArgs);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        ok: false,
        error: "User not found",
      });
    });

    it("should fail if the password is wrong", async () => {
      const mockedUser = {
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      userRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: "Wrong password" });
    });

    it("should return token if password correct", async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      userRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
      expect(result).toEqual({ ok: true, token: "signed-token" });
    });

    it("should fail on exception", async () => {
      userRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: "Can't log user in." });
    });
  });

  describe("findById", () => {
    const findByIdArgs = {
      id: 1,
    };
    it("should find an existing user", async () => {
      userRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(findByIdArgs.id);
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });

    it("should fail if no user is found", async () => {
      userRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(findByIdArgs.id);
      expect(result).toEqual({ ok: false, error: "User Not Found" });
    });
  });

  describe("editProfile", () => {
    it("should not change email if it is already in use", async () => {
      const userId = 1;
      const newEmail = "wow@new.com";

      const user = {
        id: userId,
        email: "wow@old.com",
        verified: true,
      };

      const existingUser = {
        id: 2,
        email: newEmail,
      };

      userRepository.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(existingUser); // 첫 호출: 기존 사용자, 두 번째 호출: 중복 이메일 검사

      const result = await service.editProfile(userId, { email: newEmail });

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: newEmail },
      });

      expect(result).toEqual({
        ok: false,
        error: "Email is already in use.",
      });
    });

    it("should change email", async () => {
      const userId = 1;
      const newEmail = "wow@new.com";

      const user = {
        id: userId,
        email: "wow@old.com",
        verified: true,
      };

      const newUser = {
        ...user,
        email: newEmail,
        verified: false,
      };

      const newVerification = {
        user: newUser,
        code: "verification-code",
      };

      userRepository.findOne
        .mockResolvedValueOnce(user) // 첫 호출: 기존 사용자
        .mockResolvedValueOnce(null); // 두 번째 호출: 중복 이메일 검사

      verificationRepository.delete.mockResolvedValue({ affected: 1 });
      verificationRepository.create.mockReturnValue(newVerification);
      verificationRepository.save.mockResolvedValue(newVerification);

      await service.editProfile(userId, { email: newEmail });

      expect(userRepository.findOne).toHaveBeenCalledTimes(2);
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { email: newEmail },
      });

      expect(verificationRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationRepository.delete).toHaveBeenCalledWith({
        user: { id: userId },
      });

      expect(verificationRepository.create).toHaveBeenCalledWith({
        user: newUser,
      });
      expect(verificationRepository.save).toHaveBeenCalledWith(newVerification);

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        newUser.email,
        newVerification.code,
      );
    });

    it("should change password", async () => {
      const userId = 1;
      const prevPassword = "wow@prev.com";
      const newPassword = "wow@new.com";

      userRepository.findOne.mockResolvedValue({
        password: prevPassword,
      });
      const result = await service.editProfile(userId, {
        password: newPassword,
      });

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith({
        password: newPassword,
      });
      expect(result).toEqual({ ok: true });
    });

    it("should fail on exception", async () => {
      const userId = 1;
      userRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.editProfile(userId, { email: "fail" });
      expect(result).toEqual({ ok: false, error: "Could not update profile." });
    });
  });

  describe("verifyEmail", () => {
    it("should verify email", async () => {
      const mockedVerification = {
        user: {
          verified: false,
        },
        code: "teset-code",
        id: 1,
      };
      verificationRepository.findOne.mockResolvedValue(mockedVerification);

      const result = await service.verifyEmail(mockedVerification.code);

      expect(verificationRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
      );

      expect(userRepository.save).toHaveBeenCalledTimes(1);
      expect(userRepository.save).toHaveBeenCalledWith({ verified: true });

      expect(verificationRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationRepository.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );

      expect(result).toEqual({ ok: true });
    });

    it("should fail on verification not found", async () => {
      verificationRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail("wrong-code");
      expect(result).toEqual({
        ok: false,
        error: "Verification not found.",
      });
    });

    it("should fail on exception", async () => {
      verificationRepository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail("wrong-code");
      expect(result).toEqual({ ok: false, error: "Could not verify email." });
    });
  });
});
