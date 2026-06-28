import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("../interventions.repository", () => ({
  InterventionsRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    getLastNumber: vi.fn().mockResolvedValue("INT-2026-001"),
    accept: vi.fn(),
    refuse: vi.fn(),
    timeLog: vi.fn(),
  },
}));

vi.mock("../../notifications/notifications.service", () => ({
  NotificationsService: {
    sendNotification: vi.fn(),
  },
}));

vi.mock("../../notifications/socket", () => ({
  getIO: vi.fn().mockReturnValue({
    to: vi.fn().mockReturnThis(),
    emit: vi.fn(),
  }),
}));

// ─── Import after mocks ───────────────────────────────────────────────────────

import { InterventionsService } from "../interventions.service";
import { InterventionsRepository } from "../interventions.repository";

const mockRepo = InterventionsRepository as any;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const makeUser = (role = "manager") => ({
  sub: "user-1",
  email: "manager@example.com",
  role,
});

const makeIntervention = (status = "created", overrides = {}) => ({
  id: "int-1",
  number: "INT-2026-001",
  status,
  createdById: "user-1",
  technicians: [],
  media: [],
  ...overrides,
});

// ─── Tests : transitions de statut ───────────────────────────────────────────

describe("InterventionsService - transitions de statut", () => {
  beforeEach(() => vi.clearAllMocks());

  it("autorise la transition created → assigned", async () => {
    const intervention = makeIntervention("created", {
      technicians: [{ userId: "tech-1", status: "PENDING" }],
    });
    mockRepo.findById.mockResolvedValue(intervention);
    mockRepo.update.mockResolvedValue({ ...intervention, status: "assigned" });

    const result = await InterventionsService.update(
      "int-1",
      { status: "assigned", technicianIds: ["tech-1"] },
      makeUser()
    );

    expect(result.status).toBe("assigned");
  });

  it("refuse la transition created → completed (non autorisée)", async () => {
    mockRepo.findById.mockResolvedValue(makeIntervention("created"));

    await expect(
      InterventionsService.update("int-1", { status: "completed" }, makeUser())
    ).rejects.toMatchObject({ statusCode: 422 });
  });

  it("autorise la transition in_progress → completed", async () => {
    const intervention = makeIntervention("in_progress", {
      technicians: [{ userId: "tech-1", status: "ACCEPTED" }],
    });
    mockRepo.findById.mockResolvedValue(intervention);
    mockRepo.update.mockResolvedValue({ ...intervention, status: "completed" });

    const result = await InterventionsService.update(
      "int-1",
      { status: "completed" },
      makeUser()
    );

    expect(result.status).toBe("completed");
  });

  it("refuse un technicien à modifier un champ non-statut", async () => {
    const intervention = makeIntervention("assigned", {
      technicians: [{ userId: "tech-1", status: "ACCEPTED" }],
    });
    mockRepo.findById.mockResolvedValue(intervention);
    mockRepo.update.mockResolvedValue({ ...intervention, status: "in_progress" });

    // Un technicien ne peut mettre que in_progress/waiting/completed
    await expect(
      InterventionsService.update(
        "int-1",
        { status: "cancelled" },
        makeUser("technician")
      )
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("autorise un technicien à passer en in_progress", async () => {
    const intervention = makeIntervention("assigned", {
      technicians: [{ userId: "tech-1", status: "ACCEPTED" }],
    });
    mockRepo.findById.mockResolvedValue(intervention);
    mockRepo.update.mockResolvedValue({ ...intervention, status: "in_progress" });

    const result = await InterventionsService.update(
      "int-1",
      { status: "in_progress" },
      { sub: "tech-1", email: "tech@example.com", role: "technician" }
    );

    expect(result.status).toBe("in_progress");
  });
});

// ─── Tests : création d'intervention ─────────────────────────────────────────

describe("InterventionsService - create", () => {
  beforeEach(() => vi.clearAllMocks());

  it("crée une intervention et notifie les techniciens assignés", async () => {
    const intervention = makeIntervention("assigned", {
      technicians: [{ userId: "tech-1", status: "PENDING" }],
    });
    mockRepo.create.mockResolvedValue(intervention);

    const result = await InterventionsService.create(
      {
        type: "Plomberie",
        description: "Fuite",
        address: "1 rue Test",
        clientId: "client-1",
        technicianIds: ["tech-1"],
      },
      makeUser()
    );

    expect(result).toBeDefined();
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
  });
});

// ─── Tests : suppression d'intervention ──────────────────────────────────────

describe("InterventionsService - delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuse de supprimer une intervention en cours (in_progress)", async () => {
    mockRepo.findById.mockResolvedValue(makeIntervention("in_progress"));

    await expect(InterventionsService.delete("int-1")).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it("refuse de supprimer une intervention assignée", async () => {
    mockRepo.findById.mockResolvedValue(makeIntervention("assigned"));

    await expect(InterventionsService.delete("int-1")).rejects.toMatchObject({
      statusCode: 422,
    });
  });

  it("supprime une intervention annulée", async () => {
    mockRepo.findById.mockResolvedValue(makeIntervention("cancelled"));
    mockRepo.delete.mockResolvedValue({});

    await InterventionsService.delete("int-1");

    expect(mockRepo.delete).toHaveBeenCalledWith("int-1");
  });
});

// ─── Tests : accept/refuse ────────────────────────────────────────────────────

describe("InterventionsService - accept / refuse", () => {
  beforeEach(() => vi.clearAllMocks());

  it("accepte une mission PENDING", async () => {
    const intervention = makeIntervention("assigned", {
      technicians: [{ userId: "tech-1", status: "PENDING" }],
    });
    mockRepo.findById.mockResolvedValue(intervention);
    mockRepo.accept.mockResolvedValue({ status: "ACCEPTED" });

    const result = await InterventionsService.accept("int-1", {
      sub: "tech-1",
      email: "tech@example.com",
      role: "technician",
    });

    expect(result.status).toBe("ACCEPTED");
  });

  it("lève une erreur si le technicien n'est pas assigné", async () => {
    mockRepo.findById.mockResolvedValue(makeIntervention("assigned", { technicians: [] }));

    await expect(
      InterventionsService.accept("int-1", {
        sub: "tech-999",
        email: "tech@example.com",
        role: "technician",
      })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
