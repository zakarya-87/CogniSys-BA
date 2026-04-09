import { OrganizationService } from './server/services/OrganizationService';
import { TOrganization } from './types';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function diag() {
  const orgService = new OrganizationService();
  const mockOrg: TOrganization = {
    id: 'diag-org-' + Date.now(),
    name: 'Diag Org',
    ownerId: 'diag-user',
    members: []
  };
  
  console.log('Testing createOrganization...');
  try {
    // Note: This will likely fail on AuthService.provisionOrgClaims because 'diag-user' doesn't exist
    // but it should tell us IF it fails or if there's a deeper issue with repositories.
    await orgService.createOrganization(mockOrg, 'diag-user');
    console.log('Success (unexpected, maybe user exists?)');
  } catch (error: any) {
    console.error('Caught error:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

diag();
