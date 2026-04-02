import { BaseRepository } from './BaseRepository';
import { TOrganization } from '../../types';

export class OrganizationRepository extends BaseRepository<TOrganization> {
  constructor() {
    super('organizations');
  }
}
