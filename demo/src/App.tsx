import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAppStore } from "./store/app-store";
import Login from "./pages/Login";
import MainLayout from "./components/layout/MainLayout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthed = useAppStore((s) => s.isAuthed);
  if (!isAuthed) return <Navigate to="/auth/sign-in" replace />;
  return <>{children}</>;
}

export default function App() {
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
