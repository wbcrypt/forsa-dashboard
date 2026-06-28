export type Locale = 'en' | 'fr' | 'ar'

export const LOCALES: { code: Locale; label: string; dir: 'ltr' | 'rtl' }[] = [
  { code: 'en', label: 'EN', dir: 'ltr' },
  { code: 'fr', label: 'FR', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
]

const translations: Record<Locale, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard', students: 'Students', applications: 'Applications',
    universities: 'Universities', partners: 'Partners', payments: 'Payments',
    collections: 'Collections', reports: 'Reports', audit: 'Audit Log', ranking: 'AI Ranking', paymentVerify: 'Payment Verify',
    bronzePathway: 'Bronze Pathway', assignBronze: 'Assign to Bronze', bronzeMember: 'Bronze Member', ecosystemNote: 'Every applicant joins FORSA. Gold & Silver receive financing. Bronze receives ecosystem access and priority.',
    users: 'Users & Roles', settings: 'Settings', signOut: 'Sign out',
    newStudent: 'New Student', newApplication: 'New Application',
    search: 'Search students, applications...', loading: 'Loading...',
    save: 'Save', cancel: 'Cancel', create: 'Create', edit: 'Edit',
    delete: 'Delete', confirm: 'Confirm', retry: 'Try again', noData: 'No data yet',
    welcomeBack: 'Welcome back',
    totalStudents: 'Total Students', totalApplications: 'Applications',
    approvedL1L2: 'Approved (L1 + L2)', totalDisbursed: 'Total Disbursed',
    overdue: 'Overdue', runPipeline: 'Run Pipeline',
    generateSchedule: 'Generate Schedule', recordPayment: 'Record Payment',
    firstName: 'First Name', lastName: 'Last Name', email: 'Email',
    phone: 'Phone', city: 'City', nationality: 'Nationality',
    dateOfBirth: 'Date of Birth', gender: 'Gender',
    required: 'This field is required', invalidEmail: 'Invalid email address',
  },
  fr: {
    dashboard: 'Tableau de bord', students: 'Étudiants', applications: 'Dossiers',
    universities: 'Universités', partners: 'Partenaires', payments: 'Paiements',
    collections: 'Recouvrement', reports: 'Rapports', audit: "Journal d'audit",
    users: 'Utilisateurs', settings: 'Paramètres', signOut: 'Déconnexion',
    newStudent: 'Nouvel étudiant', newApplication: 'Nouveau dossier',
    search: 'Rechercher...', loading: 'Chargement...', save: 'Enregistrer',
    cancel: 'Annuler', create: 'Créer', edit: 'Modifier', delete: 'Supprimer',
    confirm: 'Confirmer', retry: 'Réessayer', noData: 'Aucune donnée',
    welcomeBack: 'Bon retour',
    totalStudents: 'Étudiants', totalApplications: 'Dossiers',
    approvedL1L2: 'Approuvés (N1 + N2)', totalDisbursed: 'Total décaissé',
    overdue: 'En retard', runPipeline: 'Lancer le pipeline',
    generateSchedule: "Générer l'échéancier", recordPayment: 'Enregistrer un paiement',
    firstName: 'Prénom', lastName: 'Nom', email: 'E-mail',
    phone: 'Téléphone', city: 'Ville', nationality: 'Nationalité',
    dateOfBirth: 'Date de naissance', gender: 'Genre',
    required: 'Ce champ est obligatoire', invalidEmail: 'E-mail invalide',
  },
  ar: {
    dashboard: 'لوحة التحكم', students: 'الطلاب', applications: 'الملفات',
    universities: 'الجامعات', partners: 'الشركاء', payments: 'المدفوعات',
    collections: 'التحصيل', reports: 'التقارير', audit: 'سجل المراجعة',
    users: 'المستخدمون', settings: 'الإعدادات', signOut: 'تسجيل الخروج',
    newStudent: 'طالب جديد', newApplication: 'ملف جديد',
    search: 'بحث...', loading: 'جاري التحميل...', save: 'حفظ',
    cancel: 'إلغاء', create: 'إنشاء', edit: 'تعديل', delete: 'حذف',
    confirm: 'تأكيد', retry: 'إعادة المحاولة', noData: 'لا توجد بيانات',
    welcomeBack: 'مرحباً بعودتك',
    totalStudents: 'إجمالي الطلاب', totalApplications: 'الملفات',
    approvedL1L2: 'معتمد (م1 + م2)', totalDisbursed: 'إجمالي الصرف',
    overdue: 'متأخر', runPipeline: 'تشغيل خط المعالجة',
    generateSchedule: 'إنشاء جدول الدفع', recordPayment: 'تسجيل دفعة',
    firstName: 'الاسم الأول', lastName: 'اسم العائلة', email: 'البريد الإلكتروني',
    phone: 'الهاتف', city: 'المدينة', nationality: 'الجنسية',
    dateOfBirth: 'تاريخ الميلاد', gender: 'الجنس',
    required: 'هذا الحقل مطلوب', invalidEmail: 'بريد إلكتروني غير صالح',
  },
}

function getSavedLocale(): Locale {
  try { return (localStorage.getItem('forsa_locale') as Locale) || 'en' }
  catch { return 'en' }
}

let currentLocale: Locale = getSavedLocale()

export function getLocale(): Locale { return currentLocale }

export function setLocale(locale: Locale) {
  currentLocale = locale
  try { localStorage.setItem('forsa_locale', locale) } catch { /* ignore */ }
  const dir = LOCALES.find(l => l.code === locale)?.dir || 'ltr'
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', locale)
  window.dispatchEvent(new Event('localechange'))
}

export function t(key: string): string {
  return translations[currentLocale]?.[key] || translations['en']?.[key] || key
}

// Initialize direction on module load
try {
  const saved = getSavedLocale()
  const dir = LOCALES.find(l => l.code === saved)?.dir || 'ltr'
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', saved)
} catch { /* ignore SSR */ }
