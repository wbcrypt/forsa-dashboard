import { ShieldAlert } from 'lucide-react'
import PendingPage from './PendingPage'

export default function FraudRecordsPage() {
  return (
    <PendingPage
      icon={ShieldAlert}
      title="Fraud Records"
      description="Permanent blacklist and fraud record management"
      dependsOn="the fraud/blacklist data model and matching-key design (T-217)"
    />
  )
}
