// Phase 2 ("Membership-First") nav scaffolding — see MASTER_TASK_LIST.md T-221
// in the forsa-os continuity workspace. These sections are net-new in the
// 2026-07-05 spec and depend on backend endpoints that don't exist yet
// (T-201-T-206/T-217). This is intentionally a clearly-labeled empty/pending
// state — no mock or fabricated data — so the nav is ready for fast follow-up
// once the backend lands.
import { Card, EmptyState } from '../../components/ui'
import type { LucideIcon } from 'lucide-react'

export default function PendingPage({
  icon: Icon,
  title,
  description,
  dependsOn,
}: {
  icon: LucideIcon
  title: string
  description: string
  dependsOn: string
}) {
  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <Card>
        <EmptyState
          icon={Icon}
          title="Backend integration pending"
          description={`This section is scaffolded for the Phase 2 membership-first rollout but isn't wired up yet — it depends on ${dependsOn}, which don't exist in the backend today. No data is shown here until that lands.`}
        />
      </Card>
    </div>
  )
}
