// src/routes/_auth.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  component: AuthLayout,
});

// Layout بسيط — فقط يعرض الصفحة بدون sidebar
function AuthLayout() {
  return <Outlet />;
}