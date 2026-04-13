import type { TopCampaign } from '../campaigns.types'

interface Props {
  campaigns: TopCampaign[]
}

export function TopCampaigns({ campaigns }: Props) {
  const max = campaigns[0]?.conversions ?? 1

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-gray-800">أفضل الحملات</h2>

      <div className="flex flex-col gap-3">
        {campaigns.map((c, i) => (
          <div key={c.id} className="flex items-center gap-3">
            {/* rank */}
            <span className="w-5 text-center text-xs font-semibold text-gray-400">
              {i + 1}
            </span>

            {/* avatar */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-xs font-bold text-indigo-600">
              {c.productName.charAt(0)}
            </div>

            {/* info + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="truncate text-xs font-medium text-gray-800">
                  {c.productName}
                </span>
                <span className="ml-2 text-xs text-gray-400">
                  {c.conversions}
                </span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-gray-100">
                <div
                  className="h-1.5 rounded-full bg-indigo-500"
                  style={{ width: `${(c.conversions / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}