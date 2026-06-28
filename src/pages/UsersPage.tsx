import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '../lib/api'
import { Card, Badge, Table, Modal, FormField, Alert, EmptyState, ErrorState } from '../components/ui'
import { Plus, Shield, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { useToastContext } from '../context/ToastContext'

interface UserForm {
  email: string; fullName: string; password: string; confirmPassword: string; mustChangePassword: boolean
}

const initialForm: UserForm = { email: '', fullName: '', password: '', confirmPassword: '', mustChangePassword: true }

function validate(form: UserForm): Record<string, string> {
  const errors: Record<string, string> = {}
  if (!form.fullName.trim()) errors.fullName = 'Full name is required'
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Valid email is required'
  if (!form.password || form.password.length < 12) errors.password = 'Password must be at least 12 characters'
  if (!/[A-Z]/.test(form.password)) errors.password = 'Must include an uppercase letter'
  if (!/[0-9]/.test(form.password)) errors.password = 'Must include a number'
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match'
  return errors
}

export default function UsersPage() {
  const qc = useQueryClient()
  const { toast } = useToastContext()
  const { hasPermission, user: currentUser } = useAuth()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<UserForm>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverError, setServerError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list().then(r => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: unknown) => usersApi.create(data),
    onSuccess: () => {
      toast('User created successfully', 'success')
      qc.invalidateQueries({ queryKey: ['users'] })
      setShowModal(false)
      setForm(initialForm)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setServerError(e?.response?.data?.message || 'Failed to create user')
    },
  })

  const set = (field: keyof UserForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(f => ({ ...f, [field]: value }))
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const handleSubmit = () => {
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return }
    setServerError('')
    createMutation.mutate({ email: form.email, fullName: form.fullName, password: form.password, mustChangePassword: form.mustChangePassword })
  }

  const users = (data as { data?: unknown[] })?.data || (Array.isArray(data) ? data : [])

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users & Roles</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} team members</p>
        </div>
        {hasPermission('user.create') && (
          <button onClick={() => { setShowModal(true); setErrors({}); setServerError('') }} className="btn-primary">
            <Plus size={15} /> Add User
          </button>
        )}
      </div>

      {isError && <ErrorState onRetry={refetch} />}

      <Card padding={false}>
        {!isError && (
          <Table headers={['User', 'Status', 'MFA', 'Last Login', 'Joined']} loading={isLoading}>
            {users.map((u: Record<string, unknown>) => (
              <tr key={u.id as string} className={`table-row ${u.id === currentUser?.id ? 'bg-navy-50/20' : ''}`}>
                <td className="table-td pl-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-navy-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-semibold">
                        {((u.email as string)?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {u.full_name as string}
                        {u.id === currentUser?.id && (
                          <span className="text-xs bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded-full">You</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{u.email as string}</p>
                    </div>
                  </div>
                </td>
                <td className="table-td"><Badge status={u.status as string} /></td>
                <td className="table-td">
                  <span className={`text-xs font-medium flex items-center gap-1 ${u.mfa_enabled ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${u.mfa_enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {u.mfa_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </td>
                <td className="table-td text-xs text-gray-500">
                  {u.last_login_at ? format(new Date(u.last_login_at as string), 'dd MMM yyyy · HH:mm') : 'Never logged in'}
                </td>
                <td className="table-td pr-5 text-xs text-gray-400">
                  {u.created_at ? format(new Date(u.created_at as string), 'dd MMM yyyy') : '—'}
                </td>
              </tr>
            ))}
          </Table>
        )}

        {!isLoading && !isError && users.length === 0 && (
          <EmptyState icon={Shield} title="No users yet"
            description="Add team members to give them access to FORSA OS."
            action={hasPermission('user.create')
              ? <button onClick={() => setShowModal(true)} className="btn-primary text-sm">Add first user</button>
              : undefined} />
        )}
      </Card>

      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-sm font-medium text-amber-800 mb-1">Role Assignment</p>
        <p className="text-sm text-amber-700">To assign roles to users after creation, use the API endpoint <code className="font-mono text-xs bg-amber-100 px-1 rounded">POST /api/v1/users/:id/roles</code>. Role management UI is coming in V2.</p>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Team Member">
        {serverError && <Alert type="error" message={serverError} />}
        <div className="space-y-4">
          <FormField label="Full Name" required error={errors.fullName}>
            <input className="input" value={form.fullName} onChange={set('fullName')} placeholder="Ahmed Ben Amor" autoFocus />
          </FormField>
          <FormField label="Email Address" required error={errors.email}>
            <input type="email" className="input" value={form.email} onChange={set('email')} placeholder="ahmed@forsa.tn" />
          </FormField>
          <FormField label="Temporary Password" required error={errors.password}
            hint="Min 12 chars, 1 uppercase, 1 number">
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} className="input pr-10"
                value={form.password} onChange={set('password')} placeholder="••••••••••••" />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </FormField>
          <FormField label="Confirm Password" required error={errors.confirmPassword}>
            <input type={showPassword ? 'text' : 'password'} className="input"
              value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••••••" />
          </FormField>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
            <input type="checkbox" id="mcp" checked={form.mustChangePassword}
              onChange={e => setForm(f => ({ ...f, mustChangePassword: e.target.checked }))} className="rounded" />
            <label htmlFor="mcp" className="text-sm text-gray-700">
              Require password change on first login
            </label>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : 'Create User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
