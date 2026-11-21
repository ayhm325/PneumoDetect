import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { Role } from "@pneumodetect/contracts";
import { useAuth } from "@/stores/authStore";
import { LoadingState } from "@/components/ui/StateViews";

interface ProtectedRouteProps {
  allowedRoles?: Role[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const fallback =
      user.role === "admin"
        ? "/admin/dashboard"
        : user.role === "doctor"
          ? "/doctor/dashboard"
          : "/patient/dashboard";
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
