import { UserRole } from '../types';

export const canPerformAction = (userRole: UserRole | undefined, action: 'create' | 'edit' | 'delete' | 'view'): boolean => {
  if (!userRole) return false;
  
  const permissions: Record<UserRole, string[]> = {
    admin: ['create', 'edit', 'delete', 'view'],
    member: ['create', 'edit', 'view'],
    viewer: ['view']
  };
  
  return permissions[userRole].includes(action);
};
