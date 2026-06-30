import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";
import { NotificationProvider } from "@/features/notifications/NotificationContext";
import { Toaster } from "sonner";
import ProtectedRoute from "@/components/shared/ProtectedRoute";

function HomeRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

import LandingPage from "@/features/landing/LandingPage";
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";
import SetPasswordPage from "@/features/auth/SetPasswordPage";
import ForgotPasswordPage from "@/features/auth/ForgotPasswordPage";
import ResetPasswordPage from "@/features/auth/ResetPasswordPage";
import DashboardPage from "@/features/dashboard/DashboardPage";
import InterventionsPage from "@/features/interventions/InterventionsPage";
import InterventionDetailPage from "@/features/interventions/InterventionDetailPage";
import ClientsPage from "@/features/clients/ClientsPage";
import ClientDetailPage from "@/features/clients/ClientDetailPage";
import UsersPage from "@/features/users/UsersPage";
import AgendaPage from "@/features/agenda/AgendaPage";
import AuditPage from "@/features/audit/AuditPage";
import NotFoundPage from "@/features/errors/NotFoundPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public */}
              <Route path="/" element={<HomeRoute />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/activate/:token" element={<SetPasswordPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

              {/* Protected */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/interventions" element={<ProtectedRoute><InterventionsPage /></ProtectedRoute>} />
              <Route path="/interventions/:id" element={<ProtectedRoute><InterventionDetailPage /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute roles={["admin", "manager"]}><ClientsPage /></ProtectedRoute>} />
              <Route path="/clients/:id" element={<ProtectedRoute roles={["admin", "manager"]}><ClientDetailPage /></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute roles={["admin", "manager"]}><UsersPage /></ProtectedRoute>} />
              <Route path="/planning" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
              <Route path="/audit" element={<ProtectedRoute roles={["admin"]}><AuditPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <Toaster position="top-right" richColors />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
