import { useAuth } from '../context/AuthContext'
import { Card, Alert } from '../components/ui'
import { Shield, Globe, Info, ExternalLink } from 'lucide-react'
import { useLocale } from '../hooks/useLocale'
import { LOCALES, Locale } from '../lib/i18n'
import { useState } from 'react'
import clsx from 'clsx'

export default function SettingsPage() {
  const { user } = useAuth()
  const { locale, changeLocale } = useLocale()
  const [copied, setCopied] = useState('')

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(label)
      setTimeout(() => setCopied(''), 2000)
    })
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Account preferences and platform configuration</p>
      </div>

      {/* Account */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield size={16} className="text-navy-700" /> Account Information
        </h3>
        <dl className="space-y-4">
          {[
            { label: 'Email', value: user?.email || '—' },
            { label: 'User ID', value: user?.id || '—', mono: true, copy: user?.id },
            { label: 'Tenant ID', value: user?.tenantId || localStorage.getItem('tenantId') || '—', mono: true, copy: user?.tenantId || localStorage.getItem('tenantId') || '' },
            { label: 'Permissions', value: `${user?.permissions?.length || 0} granted` },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3">
              <dt className="text-xs text-gray-400 w-24 flex-shrink-0 pt-0.5">{item.label}</dt>
              <dd className="flex-1 flex items-center gap-2">
                <span className={clsx('text-sm text-gray-700', item.mono && 'font-mono text-xs bg-gray-50 px-2 py-1 rounded-lg truncate')}>
                  {item.value}
                </span>
                {item.copy && (
                  <button onClick={() => copyToClipboard(item.copy!, item.label)}
                    className="text-xs text-teal-600 hover:text-teal-700 flex-shrink-0">
                    {copied === item.label ? '✓ Copied' : 'Copy'}
                  </button>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* Language */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Globe size={16} className="text-navy-700" /> Language & Region
        </h3>
        <div className="flex gap-2">
          {LOCALES.map(l => (
            <button key={l.code} onClick={() => changeLocale(l.code as Locale)}
              className={clsx(
                'flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all',
                locale === l.code
                  ? 'border-navy-800 bg-navy-800 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              )}>
              <div className="font-semibold">{l.label}</div>
              <div className="text-xs opacity-60 mt-0.5">
                {l.code === 'en' ? 'English' : l.code === 'fr' ? 'Français' : 'العربية'}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Arabic (العربية) switches the interface to right-to-left layout.
        </p>
      </Card>

      {/* Security */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield size={16} className="text-navy-700" /> Security
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
            <div>
              <p className="text-sm font-medium text-amber-800">Multi-Factor Authentication</p>
              <p className="text-xs text-amber-700 mt-0.5">Protect your account with a TOTP authenticator app</p>
            </div>
            <a href="http://localhost:3000/api/v1/auth/mfa/setup" target="_blank" rel="noopener noreferrer"
              className="btn-secondary text-xs flex items-center gap-1">
              Setup MFA <ExternalLink size={11} />
            </a>
          </div>
          <Alert type="info" message="Password changes and session management can be performed through the API or by your system administrator." />
        </div>
      </Card>

      {/* Platform info */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Info size={16} className="text-navy-700" /> Platform Information
        </h3>
        <dl className="space-y-3">
          {[
            { label: 'Version', value: 'FORSA OS v1.0' },
            { label: 'Frontend', value: 'React 18 + Vite + Tailwind CSS' },
            { label: 'Backend', value: 'NestJS + PostgreSQL + Redis' },
            { label: 'API Base', value: 'http://localhost:3000/api/v1', link: 'http://localhost:3000/api/v1/docs' },
            { label: 'Environment', value: 'Development' },
            { label: 'Swagger UI', value: 'http://localhost:3000/api/v1/docs', link: 'http://localhost:3000/api/v1/docs' },
          ].map(item => (
            <div key={item.label} className="flex gap-3">
              <dt className="text-xs text-gray-400 w-24 flex-shrink-0 pt-0.5">{item.label}</dt>
              <dd>
                {item.link ? (
                  <a href={item.link} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-mono text-teal-600 hover:text-teal-700 flex items-center gap-1">
                    {item.value} <ExternalLink size={10} />
                  </a>
                ) : (
                  <span className="text-xs text-gray-700 font-mono">{item.value}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  )
}
