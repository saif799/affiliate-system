import { createRouter as createTanStackRouter, Link } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'
import { getContext } from './integrations/tanstack-query/root-provider'

// صفحة 404 موحّدة بدل <p>Not Found</p> العامّة من الراوتر
function NotFound() {
  return (
    <div
      dir="rtl"
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center"
    >
      <p className="text-6xl font-extrabold text-violet-600">404</p>
      <h1 className="text-xl font-bold text-gray-900">الصفحة غير موجودة</h1>
      <p className="max-w-sm text-sm text-gray-500">
        الرابط الذي تبحث عنه غير صحيح أو تم نقله أو حُذف.
      </p>
      <Link
        to="/"
        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gray-700"
      >
        العودة إلى الرئيسية
      </Link>
    </div>
  )
}

export function getRouter() {
  const context = getContext()

  const router = createTanStackRouter({
    routeTree,
    // session تُملأ في __root.beforeLoad؛ نضع null كقيمة ابتدائية للنوع
    context: { ...context, session: null },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
  })

  setupRouterSsrQueryIntegration({ router, queryClient: context.queryClient })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
