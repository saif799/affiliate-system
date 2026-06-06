// src/routes/_auth.tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
  // إن كان المستخدم مسجّلاً بالفعل، لا تُظهر له صفحة الدخول/التسجيل
  // (يحلّ مشكلة العودة لصفحة الدخول عبر زر "رجوع")
  beforeLoad: ({ context }) => {
    const session = context.session;
    if (!session) return;

    if (session.user.status !== "active") {
      throw redirect({ to: "/pending-approval" });
    }

    const dest =
      session.user.role === "super_admin"
        ? "/dashboard"
        : session.user.role === "merchant"
          ? "/merchant"
          : "/affiliate";

    throw redirect({ to: dest });
  },
  component: AuthLayout,
});

// Layout بسيط — فقط يعرض الصفحة بدون sidebar
function AuthLayout() {
  return <Outlet />;
}
