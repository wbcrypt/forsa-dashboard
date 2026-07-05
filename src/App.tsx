import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import DashboardPage from './pages/DashboardPage'
import StudentsPage from './pages/students/StudentsPage'
import StudentDetailPage from './pages/students/StudentDetailPage'
import NewStudentPage from './pages/students/NewStudentPage'
import ApplicationsPage from './pages/applications/ApplicationsPage'
import ApplicationDetailPage from './pages/applications/ApplicationDetailPage'
import NewApplicationPage from './pages/applications/NewApplicationPage'
import UniversitiesPage from './pages/universities/UniversitiesPage'
import UniversityDetailPage from './pages/universities/UniversityDetailPage'
import PartnersPage from './pages/partners/PartnersPage'
import PaymentsPage from './pages/payments/PaymentsPage'
import CollectionsPage from './pages/collections/CollectionsPage'
import ReportsPage from './pages/reports/ReportsPage'
import AuditPage from './pages/AuditPage'
import UsersPage from './pages/UsersPage'
import SettingsPage from './pages/SettingsPage'
import RankingPage from './pages/ranking/RankingPage'
import ApplicationWorkflowPage from './pages/applications/ApplicationWorkflowPage'
import PaymentVerificationPage from './pages/payments/PaymentVerificationPage'
import MembershipQueuePage from './pages/pending/MembershipQueuePage'
import FinancingQueuePage from './pages/pending/FinancingQueuePage'
import AIQueuePage from './pages/pending/AIQueuePage'
import WaitingListPage from './pages/pending/WaitingListPage'
import DigitalPassPage from './pages/pending/DigitalPassPage'
import FraudRecordsPage from './pages/pending/FraudRecordsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/new" element={<NewStudentPage />} />
        <Route path="students/:id" element={<StudentDetailPage />} />
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/new" element={<NewApplicationPage />} />
        <Route path="applications/:id" element={<ApplicationDetailPage />} />
        <Route path="applications/:id/workflow" element={<ApplicationWorkflowPage />} />
        <Route path="universities" element={<UniversitiesPage />} />
        <Route path="universities/:id" element={<UniversityDetailPage />} />
        <Route path="partners" element={<PartnersPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="payments/verify" element={<PaymentVerificationPage />} />
        <Route path="collections" element={<CollectionsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="settings" element={<SettingsPage />} />
        {/* Phase 2 membership-first nav scaffolding — see MASTER_TASK_LIST.md T-221 */}
        <Route path="membership-queue" element={<MembershipQueuePage />} />
        <Route path="financing-queue" element={<FinancingQueuePage />} />
        <Route path="ai-queue" element={<AIQueuePage />} />
        <Route path="waiting-list" element={<WaitingListPage />} />
        <Route path="digital-pass" element={<DigitalPassPage />} />
        <Route path="fraud-records" element={<FraudRecordsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
