// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";
import { getAppBaseUrl } from "./app-url";

export const authClient = createAuthClient({
  // لا نُرمّز localhost كاحتياطي — في الإنتاج كان ذلك يوجّه طلبات المصادقة إلى
  // localhost:3000 إن غاب VITE_APP_URL. getAppBaseUrl يحسم الأصل بأمان (origin
  // المتصفّح/إعداد البناء/مضيف Vercel).
  baseURL: getAppBaseUrl(),
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;