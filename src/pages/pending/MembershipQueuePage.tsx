import { UserPlus } from 'lucide-react'
import PendingPage from './PendingPage'

export default function MembershipQueuePage() {
  return (
    <PendingPage
      icon={UserPlus}
      title="Membership Queue"
      description="Review and approve Bronze membership requests"
      dependsOn="the public POST /membership-requests endpoint and Bronze issuance flow (T-203/T-204)"
    />
  )
}
