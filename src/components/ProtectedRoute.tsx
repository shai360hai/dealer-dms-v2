import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../hooks/useAuth";
import type { UserRole } from "../types/database";

const ROLE_RANK: Record<UserRole, number> = { editor: 1, admin: 2, super_admin: 3 };

export function ProtectedRoute({ minRole }: { minRole?: UserRole }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-ink)] text-[var(--color-porcelain)]">
        טוען...
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  if (minRole && (!profile || ROLE_RANK[profile.role] < ROLE_RANK[minRole])) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
