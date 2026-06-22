import React from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Interventions from "./pages/Interventions";
import InterventionDetail from "./pages/InterventionDetail";
import Planning from "./pages/Planning";
import MyInterventions from "./pages/MyInterventions";
import Users from "./pages/Users";
import "./App.css";

function Protected({ children, roles }) {
  const { user, bootstrapped } = useAuth();
  const loc = useLocation();
  
  if (!bootstrapped) {
    return <div className="min-h-screen flex items-center justify-center text-zinc-500">Chargement…</div>;
  }
  
  // Remplacez 'state={{ from: loc }}' par 'state={{ from: loc.pathname }}'
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  
  return <Layout>{children}</Layout>;
}

function HomeRedirect() {
  const { user } = useAuth();

  // Si user n'est pas défini, on ne fait rien (ou on affiche un loader)
  // Cela empêche le crash pendant le chargement
  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;
  }

  if (user.role === "technicien") {
    return <MyInterventions />;
  }
  
  return <Dashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Protected><HomeRedirect /></Protected>} />
          <Route path="/clients" element={<Protected roles={["admin", "responsable"]}><Clients /></Protected>} />
          <Route path="/interventions" element={<Protected roles={["admin", "responsable"]}><Interventions /></Protected>} />
          <Route path="/interventions/:id" element={<Protected><InterventionDetail /></Protected>} />
          <Route path="/mes-interventions" element={<Protected roles={["technicien"]}><MyInterventions /></Protected>} />
          <Route path="/planning" element={<Protected roles={["admin", "responsable", "technicien"]}><Planning /></Protected>} />
          <Route path="/utilisateurs" element={<Protected roles={["admin"]}><Users /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </BrowserRouter>
  );
}
