// خطّ زمني لأحداث تتبّع ECOTRACK — مشترك بين أدوار المسوّق/التاجر/الأدمن

interface TimelineEvent {
  id: string
  status: string
  statusLabel: string
  description: string | null
  wilaya: string | null
  occurredAt: string
}

function statusColor(status: string): string {
  if (status === 'livre') return 'bg-green-500'
  if (status === 'retourne' || status === 'retourne_paye' || status === 'echec_livraison')
    return 'bg-red-500'
  if (status === 'en_cours_livraison') return 'bg-blue-500'
  if (status === 'annule') return 'bg-gray-400'
  return 'bg-violet-500'
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('ar-DZ', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DeliveryTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-xs text-gray-400">لا توجد أحداث تتبّع من شركة التوصيل بعد</p>
    )
  }

  return (
    <div className="relative">
      {events.map((e, i) => (
        <div key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
          {i < events.length - 1 && (
            <span className="absolute start-[7px] top-4 h-[calc(100%-0.5rem)] w-0.5 bg-gray-200" />
          )}
          <span
            className={`z-10 mt-1 h-3.5 w-3.5 shrink-0 rounded-full ${statusColor(e.status)}`}
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-sm font-medium break-words text-gray-900">
              {e.statusLabel}
            </p>
            {e.description && (
              <p className="text-xs break-words text-gray-500">{e.description}</p>
            )}
            <p className="mt-0.5 text-[11px] break-words text-gray-400">
              {fmt(e.occurredAt)}
              {e.wilaya ? ` · ${e.wilaya}` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
