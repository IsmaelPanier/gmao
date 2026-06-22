import React, { createContext, useContext, useEffect, useState } from "react";
import api from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null=loading, false=guest, obj=user
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    api.get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => setUser(false))
      .finally(() => setBootstrapped(true));
  }, []);

const login = async (email, password) => {
    try {
      console.log("Tentative de connexion avec :", email);
      const r = await api.post("/auth/login", { email, password });
      console.log("Réponse du serveur reçue :", r.data);
      setUser(r.data);
      return r.data;
    } catch (error) {
      console.error("Erreur détaillée lors de la connexion :", error.response || error);
      throw error; // Important pour que votre composant Login puisse attraper l'erreur
    }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch (e) {}
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, bootstrapped }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
