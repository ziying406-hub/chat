import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./store/app-store";
import Login from "./pages/Login";
import AccountSwitch from "./pages/AccountSwitch";
import InitialSetup from "./pages/InitialSetup";
import Home from "./pages/Home";
import MainLayout from "./components/layout/MainLayout";
import { registerWebMCP } from "./webmcp";
import Agreement from "./pages/Agreement";
import Privacy from "./pages/Privacy";
import { registerFCM } from "./services/openim";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthed = useAppStore((s) => s.isAuthed);
  if (!isAuthed) return <Navigate to="/auth/sign-in" replace />;
  return <>{children}</>;
}

export default function App() {
  const isAuthed = useAppStore((s) => s.isAuthed);
  const darkMode = useAppStore((s) => s.darkMode);

  // Register WebMCP tools and FCM after login
  useEffect(() => {
    if (isAuthed) {
      registerWebMCP();
      registerFCM();
    }
  }, [isAuthed]);

  // Toggle dark mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/auth/sign-in" element={<Login />} />
        <Route path="/auth/switch" element={<AccountSwitch />} />
        <Route path="/auth/setup" element={<InitialSetup />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/auth/sign-in" replace />} />
      </Routes>
    </HashRouter>
  );
}
