import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./store/app-store";
import Login from "./pages/Login";
import MainLayout from "./components/layout/MainLayout";
import { registerWebMCP } from "./webmcp";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthed = useAppStore((s) => s.isAuthed);
  if (!isAuthed) return <Navigate to="/auth/sign-in" replace />;
  return <>{children}</>;
}

export default function App() {
  const isAuthed = useAppStore((s) => s.isAuthed);
  const darkMode = useAppStore((s) => s.darkMode);

  // Register WebMCP tools after login
  useEffect(() => {
    if (isAuthed) {
      registerWebMCP();
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
