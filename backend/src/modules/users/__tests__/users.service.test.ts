import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("../users.repository", () => ({
  UsersRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../../../config/database", () => ({
  default: {
    activationToken: {
      updateMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("../../../config/email", () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
  buildActivationEmail: vi.fn().mockReturnValue("<html>...</html>"),
}));

vi.mock("../../../config/env", () => ({
  env: {
    FRONTEND_URL: "http://localhost:5173",
    NODE_ENV: "development",
  },
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { UsersService } from "../users.service";
import { UsersRepository } from "../users.repository";
import prisma from "../../../config/database";
import { sendMail } from "../../../config/email";

const mockRepo = UsersRepository as any;
const mockPrisma = prisma as any;
const mockSendMail = sendMail as any;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeUser = (overrides = {}) => ({
  id: "user-1",
  email: "user@example.com",
  name: "Test User",
  role: "technician",
  phone: null,
  isActive: false,
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("UsersService.create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crée un utilisateur et envoie un email d'invitation", async () => {
    mockRepo.findByEmail.mockResolvedValue(null);
    const user = makeUser();
    mockRepo.create.mockResolvedValue(user);
    mockPrisma.activationToken.updateMany.mockResolvedValue({});
    mockPrisma.activationToken.create.mockResolvedValue({ token: "activation-tok" });

    const result = await UsersService.create({
      email: "user@example.com",
      name: "Test User",
      role: "technician",
    });

    expect(result.email).toBe("user@example.com");
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    expect(result.activationUrl).toContain("/activate/");
  });

  it("lève une erreur si l'email est déjà utilisé", async () => {
    mockRepo.findByEmail.mockResolvedValue(makeUser());

    await expect(
      UsersService.create({ email: "user@example.com", name: "Test", role: "technician" })
    ).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("UsersService.findById", () => {
  beforeEach(() => vi.clearAllMocks());

  it("retourne l'utilisateur s'il existe", async () => {
    const user = makeUser();
    mockRepo.findById.mockResolvedValue(user);

    const result = await UsersService.findById("user-1");
    expect(result.id).toBe("user-1");
  });

  it("lève 404 si l'utilisateur n'existe pas", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(UsersService.findById("unknown")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

describe("UsersService.update", () => {
  beforeEach(() => vi.clearAllMocks());

  it("met à jour un utilisateur existant", async () => {
    mockRepo.findById.mockResolvedValue(makeUser());
    const updated = makeUser({ name: "Updated Name" });
    mockRepo.update.mockResolvedValue(updated);

    const result = await UsersService.update("user-1", { name: "Updated Name" });
    expect(result.name).toBe("Updated Name");
  });
});

describe("UsersService.resendInvitation", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renvoie l'invitation si le compte n'est pas activé", async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ emailVerified: false }));
    mockPrisma.activationToken.updateMany.mockResolvedValue({});
    mockPrisma.activationToken.create.mockResolvedValue({ token: "new-token" });

    const result = await UsersService.resendInvitation("user-1");

    expect(result.message).toBe("Invitation renvoyée");
    expect(mockSendMail).toHaveBeenCalledTimes(1);
  });

  it("lève une erreur si le compte est déjà activé", async () => {
    mockRepo.findById.mockResolvedValue(makeUser({ emailVerified: true }));

    await expect(UsersService.resendInvitation("user-1")).rejects.toMatchObject({
      statusCode: 422,
    });
  });
});

describe("UsersService.delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("supprime un utilisateur existant", async () => {
    mockRepo.findById.mockResolvedValue(makeUser());
    mockRepo.delete.mockResolvedValue({});

    await UsersService.delete("user-1");
    expect(mockRepo.delete).toHaveBeenCalledWith("user-1");
  });

  it("lève 404 si l'utilisateur n'existe pas", async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(UsersService.delete("unknown")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
