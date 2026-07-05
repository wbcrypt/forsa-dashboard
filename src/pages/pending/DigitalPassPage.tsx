import { QrCode } from 'lucide-react'
import PendingPage from './PendingPage'

export default function DigitalPassPage() {
  return (
    <PendingPage
      icon={QrCode}
      title="Digital Pass"
      description="Digital Student Pass administration and QR verification"
      dependsOn="Digital Student Pass generation and the public QR verification endpoint (T-205/T-206)"
    />
  )
}
