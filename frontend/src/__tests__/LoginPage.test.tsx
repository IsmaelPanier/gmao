import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "@/features/auth/LoginPage";

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
    useLocation: () => ({ state: null }),
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// ─── Tests ───────────────────────────────────────────────────────────────────

function renderLogin() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
}

describe("LoginPage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("affiche les champs email et mot de passe", () => {
    renderLogin();
    expect(screen.getByLabelText(/adresse email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
  });

  it("affiche le bouton Se connecter", () => {
    renderLogin();
    expect(screen.getByRole("button", { name: /se connecter/i })).toBeInTheDocument();
  });

  it("affiche les comptes de démonstration", () => {
    renderLogin();
    expect(screen.getByText("admin@gmao.fr")).toBeInTheDocument();
    expect(screen.getByText("manager@gmao.fr")).toBeInTheDocument();
    expect(screen.getByText("tech1@gmao.fr")).toBeInTheDocument();
  });

  it("affiche le lien vers la page d'inscription", () => {
    renderLogin();
    expect(screen.getByRole("link", { name: /créer un compte/i })).toBeInTheDocument();
  });

  it("pré-remplit email et mot de passe au clic sur un compte de démo", () => {
    renderLogin();
    const adminBtn = screen.getByText("admin@gmao.fr").closest("button")!;
    fireEvent.click(adminBtn);

    const emailInput = screen.getByLabelText(/adresse email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(/mot de passe/i) as HTMLInputElement;

    expect(emailInput.value).toBe("admin@gmao.fr");
    expect(passwordInput.value).toBe("Admin1234!");
  });

  it("appelle login et redirige vers '/' en cas de succès", async () => {
    mockLogin.mockResolvedValueOnce(undefined);
    renderLogin();

    fireEvent.change(screen.getByLabelText(/adresse email/i), {
      target: { value: "admin@gmao.fr" },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: "Admin1234!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("admin@gmao.fr", "Admin1234!");
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });

  it("affiche un toast d'erreur si login échoue", async () => {
    const { toast } = await import("sonner");
    mockLogin.mockRejectedValueOnce(new Error("Identifiants invalides"));
    renderLogin();

    fireEvent.change(screen.getByLabelText(/adresse email/i), {
      target: { value: "bad@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: "WrongPass1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });
});
