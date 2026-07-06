import { Landmark } from 'lucide-react'
import PendingPage from './PendingPage'

export default function FinancingQueuePage() {
  return (
    <PendingPage
      icon={Landmark}
      title="Tuition Facilitation Queue"
      description="Tuition facilitation plan requests gated behind an active membership"
      dependsOn="the membership-gated financing flow (T-207) and the unified status model (D-004/T-202)"
    />
  )
}
