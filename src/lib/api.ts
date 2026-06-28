import axios, { AxiosInstance, AxiosError } from 'axios'

const BASE_URL = '/api/v1'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — auto refresh on 401
let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token!)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        isRefreshing = false
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
        const { accessToken, refreshToken: newRefresh } = res.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('refreshToken', newRefresh)
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string, tenantId: string) =>
    api.post('/auth/login', { email, password, tenantId }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

// ─── Students ─────────────────────────────────────────────────────────────────
export const studentsApi = {
  list: (params?: Record<string, unknown>) => api.get('/students', { params }),
  get: (id: string) => api.get(`/students/${id}`),
  create: (data: unknown) => api.post('/students', data),
  update: (id: string, data: unknown) => api.patch(`/students/${id}`, data),
  getScore: (id: string) => api.get(`/scores/students/${id}`),
  getApplications: (id: string) => api.get(`/students/${id}/applications`),
  getPayments: (id: string) => api.get(`/students/${id}/payments`),
  addGuarantor: (id: string, data: unknown) => api.post(`/students/${id}/guarantors`, data),
  openEvent: (id: string, data: unknown) => api.post(`/students/${id}/exceptional-events`, data),
  getEvents: (id: string) => api.get(`/students/${id}/exceptional-events`),
}

// ─── Applications ─────────────────────────────────────────────────────────────
export const applicationsApi = {
  list: (params?: Record<string, unknown>) => api.get('/applications', { params }),
  get: (id: string) => api.get(`/applications/${id}`),
  create: (data: unknown) => api.post('/applications', data),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.patch(`/applications/${id}/status`, data),
  assign: (id: string, userId: string) => api.patch(`/applications/${id}/assign`, { userId }),
  appeal: (id: string, data: unknown) => api.post(`/applications/${id}/appeal`, data),
  getStatusHistory: (id: string) => api.get(`/applications/${id}/status-history`),
  getPipelineHistory: (id: string) => api.get(`/applications/${id}/pipeline-history`),
}

// ─── Pipeline ─────────────────────────────────────────────────────────────────
export const pipelineApi = {
  run: (applicationId: string, reentryFromStage?: number) =>
    api.post(`/pipeline/applications/${applicationId}/run`, { reentryFromStage }),
  getRun: (runId: string) => api.get(`/pipeline/runs/${runId}`),
  submitDecision: (runId: string, data: unknown) =>
    api.post(`/pipeline/runs/${runId}/human-decision`, data),
}

// ─── Universities ─────────────────────────────────────────────────────────────
export const universitiesApi = {
  list: (params?: Record<string, unknown>) => api.get('/universities', { params }),
  get: (id: string) => api.get(`/universities/${id}`),
  create: (data: unknown) => api.post('/universities', data),
  update: (id: string, data: unknown) => api.patch(`/universities/${id}`, data),
  createAgreement: (id: string, data: unknown) => api.post(`/universities/${id}/agreements`, data),
  approveAgreement: (agreementId: string) => api.post(`/universities/agreements/${agreementId}/approve`, {}),
  createProgram: (id: string, data: unknown) => api.post(`/universities/${id}/programs`, data),
  getPrograms: (id: string) => api.get(`/universities/${id}/programs`),
  getPerformance: (id: string) => api.get(`/universities/${id}/performance`),
}

// ─── Partners ─────────────────────────────────────────────────────────────────
export const partnersApi = {
  list: (params?: Record<string, unknown>) => api.get('/partners', { params }),
  get: (id: string) => api.get(`/partners/${id}`),
  create: (data: unknown) => api.post('/partners', data),
  createAgreement: (id: string, data: unknown) => api.post(`/partners/${id}/agreements`, data),
  getCommissions: (params?: Record<string, unknown>) => api.get('/partners/commissions', { params }),
  advanceCommission: (id: string, newStatus: string) =>
    api.post(`/partners/commissions/${id}/advance`, { newStatus }),
}

// ─── Documents ────────────────────────────────────────────────────────────────
export const documentsApi = {
  getUploadUrl: (data: unknown) => api.post('/documents/upload-url', data),
  confirmUpload: (id: string, fileSize: number) =>
    api.post(`/documents/${id}/confirm-upload`, { fileSize }),
  getDownloadUrl: (id: string) => api.get(`/documents/${id}/download-url`),
  review: (id: string, action: string, notes?: string, rejectionReason?: string) =>
    api.patch(`/documents/${id}/review`, { action, notes, rejectionReason }),
  getForEntity: (entityType: string, entityId: string) =>
    api.get(`/documents/entity/${entityType}/${entityId}`),
  getChecklist: (applicationId: string) =>
    api.get(`/documents/checklist/applications/${applicationId}`),
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  listReceipts: (params?: any) => api.get('/payments/receipts', { params }),
  verifyPayment: (id: string, notes?: string) =>
    api.patch(\`/payments/\${id}/verify\`, { status: 'verified', notes }),
  rejectPayment: (id: string, reason: string) =>
    api.patch(\`/payments/\${id}/verify\`, { status: 'rejected', reason }),
  generateSchedule: (data: unknown) => api.post('/payments/schedules', data),
  getSchedule: (applicationId: string) =>
    api.get(`/payments/schedules/applications/${applicationId}`),
  record: (data: unknown) => api.post('/payments/record', data),
  reverse: (id: string, reason: string) => api.post(`/payments/${id}/reverse`, { reason }),
  getInstallmentPayments: (id: string) => api.get(`/payments/installments/${id}/payments`),
}

// ─── Collections ──────────────────────────────────────────────────────────────
export const collectionsApi = {
  getDashboard: () => api.get('/collections/dashboard'),
  getLate: (params?: Record<string, unknown>) => api.get('/collections/late', { params }),
  getWorklist: (mine?: boolean) => api.get('/collections/worklist', { params: { mine } }),
  logContact: (data: unknown) => api.post('/collections/contact-logs', data),
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  ceo: () => api.get('/reports/ceo'),
  finance: () => api.get('/reports/finance'),
  sales: () => api.get('/reports/sales'),
  collections: () => api.get('/reports/collections'),
  partners: () => api.get('/reports/partners'),
  audit: (params?: Record<string, unknown>) => api.get('/reports/audit', { params }),
}

// ─── Policy ───────────────────────────────────────────────────────────────────
export const policyApi = {
  list: () => api.get('/policy/definitions'),
  createVersion: (data: unknown) => api.post('/policy/versions', data),
  approveVersion: (id: string) => api.post(`/policy/versions/${id}/approve`, {}),
  getHistory: (key: string) => api.get(`/policy/definitions/${key}/history`),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get('/users'),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: unknown) => api.post('/users', data),
  update: (id: string, data: unknown) => api.patch(`/users/${id}`, data),
}

// ─── Execution ────────────────────────────────────────────────────────────────
export const executionApi = {
  submit: (actionType: string, payload: unknown) =>
    api.post('/execution', { actionType, payload }),
  getHistory: () => api.get('/execution/history'),
}
