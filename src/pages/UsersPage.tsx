import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, rolesApi } from '../lib/api'
import { Card, Badge, Table, Modal, FormField, Alert, EmptyState, ErrorState, LoadingSpinner as Spinner } from '../components/ui'
import { Plus, Shield, Loader2, X, UserCog, Trash2 } from 'lucide-react'
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
  const [rolesUser, setRolesUser] = useState<{ id: string; full_name: string } | null>(null)

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
          <Table headers={['User', 'Status', 'MFA', 'Last Login', 'Joined', 'Roles']} loading={isLoading}>
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
                <td className="table-td text-xs text-gray-400">
                  {u.created_at ? format(new Date(u.created_at as string), 'dd MMM yyyy') : '—'}
                </td>
                <td className="table-td pr-5">
                  {hasPermission('user.role.assign') ? (
                    <button
                      onClick={() => setRolesUser({ id: u.id as string, full_name: u.full_name as string })}
                      className="p-1.5 text-gray-400 hover:text-navy-700 hover:bg-navy-50 rounded-lg transition-colors"
                      title="Manage roles">
                      <UserCog size={14} />
                    </button>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
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

      {rolesUser && (
        <RoleManagementModal
          userId={rolesUser.id}
          userName={rolesUser.full_name}
          onClose={() => setRolesUser(null)}
        />
      )}

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

// ─── Role Management (T-309) ───────────────────────────────────────────────────
// Backend contract confirmed in forsa-os/src/users/users.controller.ts:
//   GET    /users/:id/roles  -> { roles: [{id,name,description}], permissions: [...] }
//   POST   /users/:id/roles  body: { roleId }               -> assign
//   DELETE /users/:id/roles  body: { roleId, reason (>=5) } -> revoke
// `GET /roles` (list of a tenant's assignable roles) is NOT wired to any
// controller in forsa-os today — RolesService.findAllRoles exists but has no
// route. We call it anyway (documented/expected contract) and fall back to
// manual Role ID entry if it 404s, rather than blocking this feature on it.
function RoleManagementModal({ userId, userName, onClose }: {
  userId: string; userName: string; onClose: () => void
}) {
  const qc = useQueryClient()
  const { toast } = useToastContext()
  const [manualRoleId, setManualRoleId] = useState('')
  const [selectedRoleId, setSelectedRoleId] = useState('')
  const [revokeTarget, setRevokeTarget] = useState<{ id: string; name: string } | null>(null)
  const [revokeReason, setRevokeReason] = useState('')

  const { data: userRoles, isLoading: loadingUserRoles, refetch: refetchUserRoles } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => usersApi.getRoles(userId).then(r => r.data),
  })

  const { data: allRoles, isError: rolesListUnavailable } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => rolesApi.list().then(r => r.data),
    retry: false,
  })

  const assignedRoles: { id: string; name: string; description?: string }[] = userRoles?.roles || []
  const availableRoles: { id: string; name: string }[] = (allRoles?.data || allRoles || [])
  const assignableRoles = availableRoles.filter(r => !assignedRoles.some(ar => ar.id === r.id))

  const assignMutation = useMutation({
    mutationFn: (roleId: string) => usersApi.assignRole(userId, roleId),
    onSuccess: () => {
      toast('Role assigned', 'success')
      qc.invalidateQueries({ queryKey: ['user-roles', userId] })
      qc.invalidateQueries({ queryKey: ['users'] })
      setSelectedRoleId(''); setManualRoleId('')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast(e?.response?.data?.message || 'Failed to assign role', 'error')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: ({ roleId, reason }: { roleId: string; reason: string }) =>
      usersApi.revokeRole(userId, roleId, reason),
    onSuccess: () => {
      toast('Role revoked', 'success')
      qc.invalidateQueries({ queryKey: ['user-roles', userId] })
      qc.invalidateQueries({ queryKey: ['users'] })
      setRevokeTarget(null); setRevokeReason('')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      toast(e?.response?.data?.message || 'Failed to revoke role', 'error')
    },
  })

  return (
    <Modal open={true} onClose={onClose} title={`Manage Roles — ${userName}`}>
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Roles</p>
          {loadingUserRoles ? <Spinner className="h-16" /> : assignedRoles.length === 0 ? (
            <p className="text-sm text-gray-400">No roles assigned yet.</p>
          ) : (
            <div className="space-y-2">
              {assignedRoles.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.name}</p>
                    {r.description && <p className="text-xs text-gray-400">{r.description}</p>}
                  </div>
                  <button onClick={() => { setRevokeTarget({ id: r.id, name: r.name }); setRevokeReason('') }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Revoke role">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {revokeTarget && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl space-y-2">
            <p className="text-sm text-red-800">Revoke <strong>{revokeTarget.name}</strong> — reason required (min 5 characters):</p>
            <input className="input text-sm" value={revokeReason} onChange={e => setRevokeReason(e.target.value)}
              placeholder="e.g. Role change, offboarding, incorrect grant…" />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRevokeTarget(null)} className="btn-secondary text-xs">Cancel</button>
              <button
                onClick={() => revokeMutation.mutate({ roleId: revokeTarget.id, reason: revokeReason })}
                disabled={revokeReason.trim().length < 5 || revokeMutation.isPending}
                className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors">
                {revokeMutation.isPending ? 'Revoking…' : 'Confirm Revoke'}
              </button>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Assign a Role</p>
          {rolesListUnavailable ? (
            <div className="space-y-2">
              <Alert type="warning" message="The list of assignable roles isn't available yet (backend has no GET /roles endpoint — see T-309 dependency note). Paste a role ID directly to assign it." />
              <div className="flex gap-2">
                <input className="input text-sm flex-1" value={manualRoleId} onChange={e => setManualRoleId(e.target.value)}
                  placeholder="Role UUID" />
                <button onClick={() => assignMutation.mutate(manualRoleId)}
                  disabled={!manualRoleId.trim() || assignMutation.isPending}
                  className="btn-primary text-sm disabled:opacity-50">
                  {assignMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Assign'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <select className="input text-sm flex-1" value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)}>
                <option value="">Select a role…</option>
                {assignableRoles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <button onClick={() => assignMutation.mutate(selectedRoleId)}
                disabled={!selectedRoleId || assignMutation.isPending}
                className="btn-primary text-sm disabled:opacity-50">
                {assignMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Assign'}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={() => refetchUserRoles()} className="text-xs text-gray-400 hover:text-gray-600">Refresh</button>
        </div>
      </div>
    </Modal>
  )
}
