import axios from 'axios';
import { auth } from '../../firebase';
import { TOrganization, TProject, TInitiative, UserRole } from '../../types';

const api = axios.create({
  baseURL: '/api',
});

// Attach Firebase ID token as Bearer on every request so RBAC middleware can verify the caller.
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const OrganizationAPI = {
  create: (org: Partial<TOrganization>) => api.post('/organizations', org),
  get: (orgId: string) => api.get<TOrganization>(`/organizations/${orgId}`),
};

export const ProjectAPI = {
  create: (orgId: string, project: Partial<TProject>) => api.post(`/organizations/${orgId}/projects`, project),
  list: (orgId: string) => api.get<TProject[]>(`/organizations/${orgId}/projects`),
};

export const InitiativeAPI = {
  create: (orgId: string, projectId: string, initiative: Partial<TInitiative>) => 
    api.post(`/organizations/${orgId}/projects/${projectId}/initiatives`, initiative),
  listByOrg: (orgId: string) => api.get<TInitiative[]>(`/organizations/${orgId}/initiatives`),
  listByProject: (orgId: string, projectId: string) => 
    api.get<TInitiative[]>(`/organizations/${orgId}/projects/${projectId}/initiatives`),
  update: (orgId: string, projectId: string, initiativeId: string, data: Partial<TInitiative>) => 
    api.put(`/organizations/${orgId}/projects/${projectId}/initiatives/${initiativeId}`, { ...data, orgId }),
};

export const AIAPI = {
  triggerWBS: (orgId: string, initiativeId: string) => 
    api.post(`/organizations/${orgId}/initiatives/${initiativeId}/wbs`),
  triggerRisks: (orgId: string, initiativeId: string) => 
    api.post(`/organizations/${orgId}/initiatives/${initiativeId}/risks`),
};
