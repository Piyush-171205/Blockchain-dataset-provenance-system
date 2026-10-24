import React, { useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import DatasetsPage from "./pages/DatasetsPage";
import UploadDatasetPage from "./pages/UploadDatasetPage";
import DatasetDetailsPage from "./pages/DatasetDetailsPage";
import AddVersionPage from "./pages/AddVersionPage";
import VerifyPage from "./pages/VerifyPage";
import BlockchainPage from "./pages/BlockchainPage";

import "./styles/auth.css";
import "./styles/layout.css";
import "./styles/components.css";

function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Topbar onMenuToggle={() => setSidebarOpen((s) => !s)} />
        <main className="content" key={location.pathname}>
          {children}
        </main>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, booting } = useAuth();
  if (booting) {
    return (
      <div className="loader">
        <div className="spinner" />
        Restoring session…
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function PublicRoute({ children }) {
  const { isAuthenticated, booting } = useAuth();
  if (booting) {
    return (
      <div className="loader">
        <div className="spinner" />
        Loading…
      </div>
    );
  }
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/datasets"
        element={
          <ProtectedRoute>
            <DatasetsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/datasets/new"
        element={
          <ProtectedRoute>
            <UploadDatasetPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/datasets/:datasetId"
        element={
          <ProtectedRoute>
            <DatasetDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/datasets/:datasetId/versions/new"
        element={
          <ProtectedRoute>
            <AddVersionPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/datasets/:datasetId/blockchain"
        element={
          <ProtectedRoute>
            <BlockchainPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/verify"
        element={
          <ProtectedRoute>
            <VerifyPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}