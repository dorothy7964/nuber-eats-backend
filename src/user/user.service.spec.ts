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

  it("UserService를 정의합니다.", () => {
    expect(service).toBeDefined();
  });

  describe("createAccount", () => {
    const createAccountArgs = {
      email: "test@mail.com",
      password: "123",
      role: UserRole.Client,
    };

    it("사용자가 있는 경우 새 유저 생성에 실패합니다.", async () => {
      userRepository.findOne.mockResolvedValue({
        id: 1,
        email: "test@mail.com",
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: "이미 해당 이메일을 가진 사용자가 있습니다.",
      });
    });

    it("새 유저를 만듭니다.", async () => {
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

    it("예외가 발생했다면 새 유저 생성에 실패합니다.", async () => {
      userRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({
        ok: false,
        error: "계정을 생성할 수 없습니다.",
      });
    });
  });

  describe("login", () => {
    const loginArgs = {
      email: "loginTest@email.com",
      password: "password",
    };

    it("유저가 존재하지 않을 경우에 로그인에 실패합니다.", async () => {
      // findOne의 리턴 값을 false로 mock 하기
      userRepository.findOne.mockResolvedValue(null);

      const result = await service.login(loginArgs);

      expect(userRepository.findOne).toHaveBeenCalledTimes(1);
      expect(userRepository.findOne).toHaveBeenCalledWith(expect.any(Object));
      expect(result).toEqual({
        ok: false,
        error: "사용자를 찾을 수 없습니다.",
      });
    });

    it("비밀번호가 일치하지 않을 경우에 로그인에 실패합니다.", async () => {
      const mockedUser = {
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      userRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(result).toEqual({ ok: false, error: "암호가 잘못되었습니다." });
    });

    it("비밀번호가 일치할 경우에 TOKEN을 반환합니다.", async () => {
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

    it("예외가 발생했다면 로그인에 실패합니다.", async () => {
      userRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: "사용자를 로그인 할 수 없습니다.",
      });
    });
  });

  describe("findById", () => {
    const findByIdArgs = {
      id: 1,
    };
    it("존재하는 유저를 찾습니다.", async () => {
      userRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(findByIdArgs.id);
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });

    it("유저를 찾는데 실패합니다.", async () => {
      userRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(findByIdArgs.id);
      expect(result).toEqual({
        ok: false,
        error: "사용자를 찾을 수 없습니다.",
      });
    });
  });

  describe("editProfile", () => {
    it("중복된 이메일이 있어 이메일 변경에 실패합니다.", async () => {
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
        error: "이메일은 이미 사용 중입니다.",
      });
    });

    it("이메일을 변경합니다.", async () => {
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

    it("비밀번호를 변경합니다.", async () => {
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

    it("예외가 발생했다면 프로필 업데이트에 실패합니다.", async () => {
      const userId = 1;
      userRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.editProfile(userId, { email: "fail" });
      expect(result).toEqual({
        ok: false,
        error: "프로필을 업데이트할 수 없습니다.",
      });
    });
  });

  describe("verifyEmail", () => {
    it("이메일 인증에 성공합니다.", async () => {
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

    it("인증 코드가 유효하지 않다면 인증에 실패합니다.", async () => {
      verificationRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail("wrong-code");
      expect(result).toEqual({
        ok: false,
        error: "확인 할 수 없습니다.",
      });
    });

    it("예외가 발생했다면 인증에 실패합니다.", async () => {
      verificationRepository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail("wrong-code");
      expect(result).toEqual({
        ok: false,
        error: "이메일을 확인할 수 없습니다.",
      });
    });
  });
});
