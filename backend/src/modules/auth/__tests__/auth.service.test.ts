import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("../../../config/database", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    tokenBlacklist: {
      create: vi.fn(),
    },
    activationToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn((fn: (tx: any) => any) => fn({
      user: { update: vi.fn() },
      activationToken: { update: vi.fn() },
    })),
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn().mockResolvedValue("hashed-password"),
  },
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    sign: vi.fn().mockReturnValue("mock-access-token"),
  },
}));

vi.mock("../../../config/env", () => ({
  env: {
    JWT_SECRET: "test-secret-at-least-32-characters-long!!",
    JWT_ACCESS_EXPIRES_IN: "15m",
    JWT_REFRESH_EXPIRES_IN: "7d",
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { AuthService } from "../auth.service";
import prisma from "../../../config/database";
import * as bcryptModule from "bcryptjs";

const mockPrisma = prisma as any;
const mockBcrypt = (bcryptModule as any).default ?? bcryptModule;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeUser = (overrides = {}) => ({
  id: "user-1",
  email: "test@example.com",
  password: "hashed",
  name: "Test User",
  role: "manager",
  phone: null,
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("AuthService.login", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne user + tokens quand les identifiants sont valides", async () => {
    const user = makeUser();
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockBcrypt.compare.mockResolvedValue(true);
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const result = await AuthService.login({ email: "test@example.com", password: "Password1" });

    expect(result.user.email).toBe("test@example.com");
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it("lève une erreur si l'utilisateur n'existe pas", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      AuthService.login({ email: "notfound@example.com", password: "Password1" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("lève une erreur si l'utilisateur est inactif", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser({ isActive: false }));

    await expect(
      AuthService.login({ email: "test@example.com", password: "Password1" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("lève une erreur si email non vérifié", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser({ emailVerified: false }));

    await expect(
      AuthService.login({ email: "test@example.com", password: "Password1" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });

  it("lève une erreur si le mot de passe est incorrect", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser());
    mockBcrypt.compare.mockResolvedValue(false);

    await expect(
      AuthService.login({ email: "test@example.com", password: "WrongPass1" })
    ).rejects.toMatchObject({ statusCode: 401 });
  });
});

describe("AuthService.register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crée un compte admin et retourne les tokens", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(makeUser({ role: "admin" }));
    mockPrisma.refreshToken.create.mockResolvedValue({});

    const result = await AuthService.register({
      email: "new@example.com",
      password: "Password1",
      name: "New User",
    });

    expect(result.user).toBeDefined();
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(mockPrisma.user.create.mock.calls[0][0].data.role).toBe("admin");
  });

  it("lève une erreur si l'email est déjà utilisé", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(makeUser());

    await expect(
      AuthService.register({ email: "test@example.com", password: "Password1", name: "Test" })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("AuthService.validateActivationToken", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne email et nom si le token est valide", async () => {
    const future = new Date(Date.now() + 3_600_000);
    mockPrisma.activationToken.findUnique.mockResolvedValue({
      id: "tok-1",
      token: "valid-token",
      used: false,
      expiresAt: future,
      user: { email: "test@example.com", name: "Test User" },
    });

    const result = await AuthService.validateActivationToken("valid-token");
    expect(result.email).toBe("test@example.com");
    expect(result.name).toBe("Test User");
  });

  it("lève une erreur si le token est expiré", async () => {
    const past = new Date(Date.now() - 1000);
    mockPrisma.activationToken.findUnique.mockResolvedValue({
      id: "tok-1",
      token: "expired-token",
      used: false,
      expiresAt: past,
      user: { email: "test@example.com", name: "Test User" },
    });

    await expect(
      AuthService.validateActivationToken("expired-token")
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lève une erreur si le token est déjà utilisé", async () => {
    mockPrisma.activationToken.findUnique.mockResolvedValue({
      id: "tok-1",
      token: "used-token",
      used: true,
      expiresAt: new Date(Date.now() + 3_600_000),
      user: { email: "test@example.com", name: "Test User" },
    });

    await expect(
      AuthService.validateActivationToken("used-token")
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lève une erreur si le token n'existe pas", async () => {
    mockPrisma.activationToken.findUnique.mockResolvedValue(null);

    await expect(
      AuthService.validateActivationToken("nonexistent-token")
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

describe("AuthService.logout", () => {
  beforeEach(() => vi.clearAllMocks());

  it("révoque le refresh token si fourni", async () => {
    mockPrisma.refreshToken.updateMany.mockResolvedValue({});

    await AuthService.logout("refresh-token", undefined);

    expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: { token: "refresh-token" },
      data: { isRevoked: true },
    });
  });

  it("ajoute le access token à la blacklist si fourni", async () => {
    mockPrisma.tokenBlacklist.create.mockResolvedValue({});

    await AuthService.logout(undefined, "access-token");

    expect(mockPrisma.tokenBlacklist.create).toHaveBeenCalledWith({
      data: { token: "access-token" },
    });
  });
});
