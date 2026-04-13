import type { FunnelStep } from '../analytics.types'

interface Props {
  steps: FunnelStep[]
}

export function ConversionFunnel({ steps }: Props) {
  const max = steps[0]?.count ?? 1

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-800">قمع التحويل</h2>
        <p className="text-xs text-gray-400">من نقر الرابط إلى دفع العمولة</p>
      </div>

      <div className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <div key={step.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-700">{step.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{step.count.toLocaleString('fr-DZ')}</span>
                {i > 0 && (
                  <span className={`text-xs font-medium ${step.rate < 50 ? 'text-red-500' : step.rate < 75 ? 'text-yellow-500' : 'text-green-500'}`}>
                    {step.rate.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
            <div className="h-6 w-full rounded bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded transition-all"
                style={{
                  width: `${(step.count / max) * 100}%`,
                  background: i === 0 ? '#6366f1' : `hsl(${240 - i * 30}, 70%, ${50 + i * 4}%)`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* أكبر تسرب */}
      {(() => {
        const biggest = steps.slice(1).reduce((worst, s) => s.rate < worst.rate ? s : worst, steps[1])
        return biggest ? (
          <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            أكبر تسرب: <span className="font-medium">{biggest.label}</span> — {biggest.rate.toFixed(1)}% فقط يكملون هذه الخطوة
          </div>
        ) : null
      })()}
    </div>
  )
}