// src/routes/__root.tsx
import {
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools }            from '@tanstack/react-devtools'
import TanStackQueryDevtools           from '../integrations/tanstack-query/devtools'
import appCss                          from '../styles.css?url'
import type { QueryClient }             from '@tanstack/react-query'
import { getSession }                   from '../lib/session'
import type { auth }                    from '../server/auth'

// ── Router Context ─────────────────────────────────────────
// typeof auth.$Infer.Session بدلاً من types يدوية
// — Single Source of Truth: أي تغيير في better-auth ينعكس تلقائياً
interface MyRouterContext {
  queryClient: QueryClient
  session:     typeof auth.$Infer.Session | null
}

// ── Theme Script ───────────────────────────────────────────
const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`

// ── Root Route ─────────────────────────────────────────────
export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        // يمنع التكبير التلقائي عند التركيز على الحقول في iOS مع إتاحة تكبير
        // المستخدم اليدوي (لا نستخدم maximum-scale=1 الذي يضرّ بإمكانية الوصول).
        content: 'width=device-width, initial-scale=1, viewport-fit=cover',
      },
      { title: 'DzAffilio — منصة التسويق بالعمولة' },
      {
        name: 'description',
        content: 'منصة جزائرية للتسويق بالعمولة والدفع عند الاستلام للتجّار والمسوّقين.',
      },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),

 
  beforeLoad: async () => {
    const session = await getSession()
    return { session }
  },

  shellComponent: RootDocument,
})

// ── Shell ──────────────────────────────────────────────────
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body className="font-sans antialiased wrap-break-word selection:bg-[rgba(79,184,178,0.24)]">
        {children}
        {/* أدوات التطوير — لا تُشحن إلى الإنتاج (حجم + واجهة دخيلة على المستخدم). */}
        {import.meta.env.DEV && (
          <TanStackDevtools
            config={{ position: 'bottom-right' }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
              TanStackQueryDevtools,
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}