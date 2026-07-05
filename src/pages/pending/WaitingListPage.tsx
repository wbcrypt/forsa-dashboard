import { Hourglass } from 'lucide-react'
import PendingPage from './PendingPage'

export default function WaitingListPage() {
  return (
    <PendingPage
      icon={Hourglass}
      title="Waiting List"
      description="Applicants held for capital availability, not rejected"
      dependsOn="the Waiting List outcome and its reconciliation with the existing capital_queue mechanism (T-213)"
    />
  )
}
