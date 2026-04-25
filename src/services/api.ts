import axios from 'axios';
import { auth } from '../../firebase';
import { TOrganization, TProject, TInitiative, UserRole } from '../../types';

const api = axios.create({
  baseURL: '/api',
});

// Helper to wait for the first auth state emission to avoid 401s on reload
let _authPromise: Promise<void> | null = null;
const waitForAuth = () => {
    if (_authPromise) return _authPromise;
    _authPromise = new Promise((resolve) => {
        // Synchronous check: if state is already resolved, don't wait for emission
        if (auth.currentUser) {
            resolve();
            return;
        }
        const unsubscribe = auth.onAuthStateChanged(() => {
            unsubscribe();
            resolve();
        });
    });
    return _authPromise;
};

// Attach Firebase ID token as Bearer on every request so RBAC middleware can verify the caller.
api.interceptors.request.use(async (config) => {
  // If no user yet, wait for Firebase to initialize (max 2s)
  if (!auth.currentUser) {
      await Promise.race([waitForAuth(), new Promise(r => setTimeout(r, 2000))]);
  }
  
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    // In Axios 1.x, config.headers is an AxiosHeaders instance. 
    // Use .set() for better compatibility if available, or direct assignment if not.
    if (config.headers) {
      if (typeof config.headers.set === 'function') {
        config.headers.set('Authorization', `Bearer ${token}`);
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  }
  return config;
});

export const OrganizationAPI = {
  create: (org: Partial<TOrganization>) => api.post('/organizations', org),
  get: (orgId: string) => api.get<TOrganization>(`/organizations/${orgId}`),
};

export const ProjectAPI = {
  create: (orgId: string, project: Partial<TProject>) => api.post(`/organizations/${orgId}/projects`, project),
  list: (orgId: string, params?: { limit?: number; cursor?: string }) =>
    api.get<{ data: TProject[]; nextCursor: string | null }>(`/organizations/${orgId}/projects`, { params }),
};

export const InitiativeAPI = {
  create: (orgId: string, projectId: string, initiative: Partial<TInitiative>) => 
    api.post(`/organizations/${orgId}/projects/${projectId}/initiatives`, initiative),
  listByOrg: (orgId: string, params?: { limit?: number; cursor?: string }) =>
    api.get<{ data: TInitiative[]; nextCursor: string | null }>(`/organizations/${orgId}/initiatives`, { params }),
  listByProject: (orgId: string, projectId: string, params?: { limit?: number; cursor?: string }) => 
    api.get<{ data: TInitiative[]; nextCursor: string | null }>(`/organizations/${orgId}/projects/${projectId}/initiatives`, { params }),
  update: (orgId: string, projectId: string, initiativeId: string, data: Partial<TInitiative>) => 
    api.put(`/organizations/${orgId}/projects/${projectId}/initiatives/${initiativeId}`, { ...data, orgId }),
};

export const AIAPI = {
  triggerWBS: (orgId: string, initiativeId: string) => 
    api.post(`/organizations/${orgId}/initiatives/${initiativeId}/wbs`),
  triggerRisks: (orgId: string, initiativeId: string) => 
    api.post(`/organizations/${orgId}/initiatives/${initiativeId}/risks`),
};
export const ActivityAPI = {
  create: (orgId: string, activity: any) => api.post(`/organizations/${orgId}/activities`, activity),
  list: (orgId: string, params?: { limit?: number; cursor?: string }) => 
    api.get<{ data: any[]; nextCursor: string | null }>(`/organizations/${orgId}/activities`, { params }),
  addComment: (activityId: string, comment: any) => api.post(`/activities/${activityId}/comments`, { comment }),
};

// ── Phase 6–8 API modules ─────────────────────────────────────────────────

export const InvitationAPI = {
  send: (orgId: string, email: string, role: UserRole) =>
    api.post(`/v1/organizations/${orgId}/invitations`, { email, role }),
  list: (orgId: string, status?: string) =>
    api.get(`/v1/organizations/${orgId}/invitations`, { params: { status } }),
  revoke: (orgId: string, invitationId: string) =>
    api.delete(`/v1/organizations/${orgId}/invitations/${invitationId}`),
  accept: (token: string) =>
    api.post(`/v1/invitations/${token}/accept`),
};

export const MemberAPI = {
  list: (orgId: string) =>
    api.get<{ members: { userId: string; role: UserRole }[] }>(`/v1/organizations/${orgId}/members`),
  remove: (orgId: string, userId: string) =>
    api.delete(`/v1/organizations/${orgId}/members/${userId}`),
  changeRole: (orgId: string, userId: string, role: UserRole) =>
    api.patch(`/v1/organizations/${orgId}/members/${userId}/role`, { role }),
};

export const NotificationAPI = {
  list: (unreadOnly = false, limit = 50) =>
    api.get(`/v1/notifications`, { params: { unreadOnly, limit } }),
  markRead: (notificationId: string) =>
    api.patch(`/v1/notifications/${notificationId}/read`),
  markAllRead: () =>
    api.post(`/v1/notifications/mark-all-read`),
};

export const BillingAPI = {
  get: (orgId: string) =>
    api.get(`/v1/organizations/${orgId}/billing`),
  checkout: (orgId: string, plan: 'pro' | 'enterprise', successUrl: string, cancelUrl: string) =>
    api.post<{ url: string }>(`/v1/organizations/${orgId}/billing/checkout`, { plan, successUrl, cancelUrl }),
  portal: (orgId: string, returnUrl: string) =>
    api.post<{ url: string }>(`/v1/organizations/${orgId}/billing/portal`, { returnUrl }),
};

export const SearchAPI = {
  search: (orgId: string, q: string, type: 'all' | 'initiatives' | 'projects' = 'all', limit = 20) =>
    api.get(`/v1/organizations/${orgId}/search`, { params: { q, type, limit } }),
};

export const AnalyticsAPI = {
  activity: (orgId: string, days = 30) =>
    api.get(`/v1/organizations/${orgId}/analytics/activity`, { params: { days } }),
  initiatives: (orgId: string) =>
    api.get(`/v1/organizations/${orgId}/analytics/initiatives`),
  aiUsage: (orgId: string, months = 6) =>
    api.get(`/v1/organizations/${orgId}/analytics/ai-usage`, { params: { months } }),
};

export const UsageAPI = {
  get: (orgId: string, month?: string) =>
    api.get(`/v1/organizations/${orgId}/usage`, { params: { month } }),
};

export const MissionAPI = {
  save: (orgId: string, mission: any) => 
    api.post(`/organizations/${orgId}/missions`, { mission }),
  getById: (orgId: string, id: string) => 
    api.get(`/organizations/${orgId}/missions/${id}`),
  listByInitiative: (orgId: string, initiativeId: string) => 
    api.get<{ data: any[] }>(`/organizations/${orgId}/initiatives/${initiativeId}/missions`),
  logAudit: (orgId: string, userId: string, agent: string, action: string, metadata: any) =>
    api.post(`/organizations/${orgId}/missions/audit`, { userId, agent, action, metadata }),
};

/** Build an authenticated EventSource URL for SSE. Returns null if no user is logged in. */
export async function createNotificationStream(onMessage: (notification: unknown) => void): Promise<EventSource | null> {
  const user = auth.currentUser;
  if (!user) return null;
  const token = await user.getIdToken();
  if (!token) {
    logger.warn('Cannot create notification stream: ID token is empty');
    return null;
  }
  // EventSource doesn't support custom headers — pass token as query param
  const url = `/api/v1/notifications/stream?token=${encodeURIComponent(token)}`;
  const es = new EventSource(url);
  es.addEventListener('notification', (e) => {
    try { onMessage(JSON.parse(e.data)); } catch { /* ignore parse errors */ }
  });
  return es;
}

