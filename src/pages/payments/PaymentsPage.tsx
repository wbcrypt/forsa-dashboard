import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { reportsApi } from '../../lib/api'
import { Card, StatCard, LoadingSpinner, ErrorState, EmptyState } from '../../components/ui'
import { CreditCard, TrendingUp, AlertCircle, CheckCircle, DollarSign, ArrowRight } from 'lucide-react'

export default function PaymentsPage() {
  const { data: finance, isLoading, isError, refetch } = useQuery({
    queryKey: ['reports', 'finance'],
    queryFn: () => reportsApi.finance().then(r => r.data),
  })

  if (isLoading) return <LoadingSpinner className="h-64" />
  if (isError) return (
    <div className="space-y-5">
      <div className="page-header"><h1 className="page-title">Payments</h1></div>
      <ErrorState onRetry={refetch} />
    </div>
  )

  const receivables = finance?.receivables || {}
  const ledger = finance?.ledger || []
  const recent = finance?.recentDisbursements || []

  const totalReceivables = Object.values(receivables).reduce((sum, v) => sum + parseFloat(v as string || '0'), 0)

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Financial overview and receivables</p>
        </div>
        <Link to="/applications" className="btn-secondary text-sm">
          Record Payment via Applications <ArrowRight size={14} />
        </Link>
      </div>

      {/* Receivables breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="On-Time / Current" value={`${parseFloat(receivables.current || '0').toLocaleString()} TND`} icon={CheckCircle} color="green" />
        <StatCard label="Due Soon (7 days)" value={`${parseFloat(receivables.due_soon || '0').toLocaleString()} TND`} icon={CreditCard} color="teal" />
        <StatCard label="Late" value={`${parseFloat(receivables.late || '0').toLocaleString()} TND`} icon={AlertCircle} color="orange" />
        <StatCard label="Default Risk" value={`${parseFloat(receivables.default_risk || '0').toLocaleString()} TND`} icon={TrendingUp} color="red" />
      </div>

      {/* Total receivables */}
      {totalReceivables > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Receivables Portfolio</h3>
            <span className="text-sm font-bold text-gray-900">{totalReceivables.toLocaleString()} TND total</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Current', value: parseFloat(receivables.current || '0'), color: 'bg-green-500' },
              { label: 'Due Soon', value: parseFloat(receivables.due_soon || '0'), color: 'bg-teal-400' },
              { label: 'Late', value: parseFloat(receivables.late || '0'), color: 'bg-orange-400' },
              { label: 'Default Risk', value: parseFloat(receivables.default_risk || '0'), color: 'bg-red-500' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">
                    {item.value.toLocaleString()} TND
                    <span className="text-gray-400 font-normal ml-1">
                      ({totalReceivables > 0 ? ((item.value / totalReceivables) * 100).toFixed(1) : 0}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${item.color} rounded-full transition-all`}
                    style={{ width: `${totalReceivables > 0 ? (item.value / totalReceivables) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Double-entry ledger summary */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">
          Double-Entry Ledger Summary
          <span className="ml-2 text-xs font-normal text-gray-400">(IFRS-aligned)</span>
        </h3>
        {ledger.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase py-2">Account</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">Total Debit (DR)</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">Total Credit (CR)</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase py-2">Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {ledger.map((entry: Record<string, unknown>) => {
                  const dr = parseFloat(entry.total_debit as string || '0')
                  const cr = parseFloat(entry.total_credit as string || '0')
                  return (
                    <tr key={entry.account as string} className="hover:bg-gray-50/50">
                      <td className="py-3 text-gray-700 capitalize font-medium">
                        {(entry.account as string).replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 text-right text-green-700 font-mono">{dr.toLocaleString()}</td>
                      <td className="py-3 text-right text-red-600 font-mono">{cr.toLocaleString()}</td>
                      <td className={`py-3 text-right font-mono font-semibold ${(dr - cr) >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {(dr - cr).toLocaleString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState icon={DollarSign} title="No ledger entries yet"
            description="Record payments on approved applications to see double-entry accounting entries here." />
        )}
      </Card>

      {/* How to record payments */}
      <div className="bg-teal-50 border border-teal-100 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-teal-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <CreditCard size={16} className="text-teal-700" />
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-900 mb-1">How to record payments</p>
            <p className="text-sm text-teal-700">
              Navigate to an approved application → Generate payment schedule → Record payments installment by installment.
              Each payment triggers double-entry ledger entries and updates the student's FORSA Score automatically.
            </p>
            <Link to="/applications?status=approved_level2" className="btn-teal mt-3 text-sm inline-flex">
              View approved applications <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
