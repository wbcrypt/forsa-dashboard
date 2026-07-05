import { Brain } from 'lucide-react'
import PendingPage from './PendingPage'

export default function AIQueuePage() {
  return (
    <PendingPage
      icon={Brain}
      title="AI Queue"
      description="Advisory AI assessments awaiting human review"
      dependsOn="the rebuilt AI scoring model (T-210/T-211/T-212 — Household Stability weighting, valid model id)"
    />
  )
}
