import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Users, FileText, Building2, Briefcase,
  CreditCard, AlertTriangle, BarChart3, ScrollText, Settings,
  Shield, Bell, ChevronLeft, ChevronRight, LogOut, Search,
  GraduationCap, X, Trophy, ClipboardCheck, BadgeCheck
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../hooks/useLocale'
import { LOCALES, Locale } from '../../lib/i18n'
import clsx from 'clsx'

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/', permission: null },
  { key: 'students', icon: GraduationCap, path: '/students', permission: 'student.view' },
  { key: 'applications', icon: FileText, path: '/applications', permission: 'application.view' },
  { key: 'universities', icon: Building2, path: '/universities', permission: 'university.view' },
  { key: 'partners', icon: Briefcase, path: '/partners', permission: 'partner.view' },
  { key: 'payments', icon: CreditCard, path: '/payments', permission: 'payment.view' },
  { key: 'collections', icon: AlertTriangle, path: '/collections', permission: 'collections.view' },
  { key: 'reports', icon: BarChart3, path: '/reports', permission: 'report.ceo' },
  { key: 'audit', icon: ScrollText, path: '/audit', permission: 'report.audit' },
  { key: 'ranking', icon: Trophy, path: '/ranking', permission: 'application.view' },
  { key: 'paymentVerify', icon: BadgeCheck, path: '/payments/verify', permission: 'payment.view' },
  { key: 'users', icon: Shield, path: '/users', permission: 'user.view' },
  { key: 'settings', icon: Settings, path: '/settings', permission: null },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, logout, hasPermission } = useAuth()
  const { locale, changeLocale, t } = useLocale()
  const location = useLocation()
  const navigate = useNavigate()

  const visibleItems = navItems.filter(item =>
    !item.permission || hasPermission(item.permission)
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/students?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSearchOpen(false)
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir={LOCALES.find(l => l.code === locale)?.dir || 'ltr'}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        'flex flex-col bg-navy-900 transition-all duration-300 ease-in-out relative flex-shrink-0',
        'fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto',
        collapsed ? 'w-16' : 'w-56',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className={clsx(
          'flex items-center h-16 px-4 border-b border-white/5',
          collapsed ? 'justify-center' : 'gap-3'
        )}>
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          {!collapsed && (
            <div>
              <p className="text-white font-semibold text-sm leading-none">FORSA OS</p>
              <p className="text-navy-400 text-xs mt-0.5">Admin Dashboard</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)
            const label = t(item.key)

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? label : undefined}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
                  isActive
                    ? 'bg-teal-500/15 text-teal-400'
                    : 'text-navy-300 hover:bg-white/5 hover:text-white',
                  collapsed && 'justify-center px-2'
                )}
              >
                <Icon size={17} className="flex-shrink-0" />
                {!collapsed && <span className="font-medium truncate">{label}</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Locale switcher */}
        {!collapsed && (
          <div className="px-3 pb-2 flex gap-1">
            {LOCALES.map(l => (
              <button
                key={l.code}
                onClick={() => changeLocale(l.code as Locale)}
                className={clsx(
                  'flex-1 py-1 text-xs rounded-lg transition-colors',
                  locale === l.code
                    ? 'bg-teal-500/20 text-teal-400 font-medium'
                    : 'text-navy-400 hover:text-white hover:bg-white/5'
                )}
              >
                {l.label}
              </button>
            ))}
          </div>
        )}

        {/* User + logout */}
        <div className={clsx('border-t border-white/5 p-3', collapsed && 'flex flex-col items-center gap-2')}>
          {!collapsed && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="w-7 h-7 bg-teal-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-teal-400 text-xs font-semibold">
                  {user?.email?.[0]?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user?.email}</p>
                <p className="text-navy-400 text-xs">Super Admin</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            title={collapsed ? t('signOut') : undefined}
            className={clsx(
              'flex items-center gap-2 text-navy-400 hover:text-red-400 transition-colors text-xs w-full px-1 py-1 rounded',
              collapsed ? 'justify-center' : ''
            )}
          >
            <LogOut size={14} />
            {!collapsed && t('signOut')}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={clsx(
            'absolute top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-10',
            locale === 'ar' ? '-left-3' : '-right-3'
          )}
        >
          {collapsed
            ? <ChevronRight size={12} className="text-gray-500" />
            : <ChevronLeft size={12} className="text-gray-500" />
          }
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 lg:ml-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4 flex-shrink-0">
          {/* Hamburger for mobile */}
          <button onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg lg:hidden">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="2" y1="5" x2="16" y2="5" /><line x1="2" y1="9" x2="16" y2="9" /><line x1="2" y1="13" x2="16" y2="13" />
            </svg>
          </button>
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-md">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t('search')}
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-800/10 focus:border-navy-300 transition-colors"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            {/* Locale buttons in header for collapsed sidebar */}
            {collapsed && (
              <div className="flex gap-1 border border-gray-100 rounded-lg p-0.5">
                {LOCALES.map(l => (
                  <button key={l.code} onClick={() => changeLocale(l.code as Locale)}
                    className={clsx('px-2 py-1 text-xs rounded-md transition-colors',
                      locale === l.code ? 'bg-navy-800 text-white' : 'text-gray-500 hover:bg-gray-100')}>
                    {l.code.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <Bell size={18} />
            </button>
            <div className="w-8 h-8 bg-navy-800 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {user?.email?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
