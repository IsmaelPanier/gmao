import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import RegisterPage from "@/features/auth/RegisterPage";

// ─── Mocks ───────────────────────────────────────────────────────────────────

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@/features/auth/AuthContext", () => ({
  useAuth: () => ({ login: mockLogin }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/services/auth.service", () => ({
  default: {
    register: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

function renderRegister() {
  return render(
    <MemoryRouter>
      <RegisterPage />
    </MemoryRouter>
  );
}

describe("RegisterPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("affiche tous les champs du formulaire", () => {
    renderRegister();
    expect(screen.getByLabelText(/nom complet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^mot de passe$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmer/i)).toBeInTheDocument();
  });

  it("affiche le bouton Créer mon compte", () => {
    renderRegister();
    expect(screen.getByRole("button", { name: /créer mon compte/i })).toBeInTheDocument();
  });

  it("affiche le lien vers la page de connexion", () => {
    renderRegister();
    expect(screen.getByRole("link", { name: /se connecter/i })).toBeInTheDocument();
  });

  it("affiche une erreur si les mots de passe ne correspondent pas", async () => {
    const { toast } = await import("sonner");
    renderRegister();

    fireEvent.change(screen.getByLabelText(/nom complet/i), { target: { value: "Jean Test" } });
    fireEvent.change(screen.getByLabelText(/adresse email/i), { target: { value: "jean@test.fr" } });
    fireEvent.change(screen.getByLabelText(/^mot de passe$/i), { target: { value: "Password1" } });
    fireEvent.change(screen.getByLabelText(/confirmer/i), { target: { value: "Mismatch1" } });
    fireEvent.click(screen.getByRole("button", { name: /créer mon compte/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Les mots de passe ne correspondent pas");
    });
  });

  it("crée le compte et redirige vers '/' en cas de succès", async () => {
    const AuthService = await import("@/services/auth.service");
    const mockRegister = AuthService.default.register as ReturnType<typeof vi.fn>;
    mockRegister.mockResolvedValueOnce({
      user: { id: "1", email: "jean@test.fr", name: "Jean Test", role: "admin" },
      accessToken: "access-tok",
      refreshToken: "refresh-tok",
    });
    mockLogin.mockResolvedValueOnce(undefined);

    renderRegister();

    fireEvent.change(screen.getByLabelText(/nom complet/i), { target: { value: "Jean Test" } });
    fireEvent.change(screen.getByLabelText(/adresse email/i), { target: { value: "jean@test.fr" } });
    fireEvent.change(screen.getByLabelText(/^mot de passe$/i), { target: { value: "Password1" } });
    fireEvent.change(screen.getByLabelText(/confirmer/i), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: /créer mon compte/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        name: "Jean Test",
        email: "jean@test.fr",
        password: "Password1",
      });
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("affiche une erreur si l'API retourne une erreur", async () => {
    const AuthService = await import("@/services/auth.service");
    const mockRegister = AuthService.default.register as ReturnType<typeof vi.fn>;
    const { toast } = await import("sonner");
    mockRegister.mockRejectedValueOnce(new Error("Email déjà utilisé"));

    renderRegister();

    fireEvent.change(screen.getByLabelText(/nom complet/i), { target: { value: "Jean Test" } });
    fireEvent.change(screen.getByLabelText(/adresse email/i), { target: { value: "jean@test.fr" } });
    fireEvent.change(screen.getByLabelText(/^mot de passe$/i), { target: { value: "Password1" } });
    fireEvent.change(screen.getByLabelText(/confirmer/i), { target: { value: "Password1" } });
    fireEvent.click(screen.getByRole("button", { name: /créer mon compte/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
