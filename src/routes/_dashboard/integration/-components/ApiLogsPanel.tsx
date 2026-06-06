type LogLevel = 'success' | 'warning' | 'error' | 'info'

interface LogEntry {
  id:        string
  level:     LogLevel
  source:    string
  message:   string
  timestamp: string
}

const MOCK_LOGS: LogEntry[] = [
  { id: 'l2', level: 'success', source: 'YouCan',      message: 'استيراد 3 منتجات جديدة من متجر Bijoux DZ',        timestamp: 'منذ 11 دقيقة'  },
  { id: 'l4', level: 'success', source: 'Webhook',     message: 'إرسال بيانات الطلب #4821 إلى Google Sheets',      timestamp: 'منذ 1 ساعة'    },
  { id: 'l6', level: 'success', source: 'Telegram Bot', message: 'إشعار أُرسل للـ Admin: طلب سحب جديد 45,000 DZD', timestamp: 'منذ 3 ساعات'  },
  { id: 'l7', level: 'info',    source: 'Messenger',   message: 'Webhook متصل — 0 أحداث معلقة',                   timestamp: 'منذ 4 ساعات'  },
]

const LEVEL_CONFIG: Record<LogLevel, { dot: string; text: string }> = {
  success: { dot: 'bg-green-500', text: 'text-green-700' },
  warning: { dot: 'bg-yellow-400', text: 'text-yellow-700' },
  error:   { dot: 'bg-red-500',   text: 'text-red-700'   },
  info:    { dot: 'bg-blue-400',  text: 'text-blue-700'  },
}

export function ApiLogsPanel() {
  const errorCount = MOCK_LOGS.filter((l) => l.level === 'error').length
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">سجل أحداث API</h2>
          <p className="text-xs text-gray-400">آخر 24 ساعة — يتجدد تلقائياً</p>
        </div>
        {errorCount > 0 ? (
          <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {errorCount} خطأ نشط
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            لا أخطاء
          </span>
        )}
      </div>
      <div className="divide-y divide-gray-50">
        {MOCK_LOGS.map((log) => {
          const cfg = LEVEL_CONFIG[log.level]
          return (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-gray-700">{log.source}</span>
                  <span className="text-xs text-gray-400">{log.timestamp}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{log.message}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}