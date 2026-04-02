import React, { useState } from 'react';
import { Button } from './ui/Button';
import { useCatalyst } from '../context/CatalystContext';

interface OrganizationFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export const OrganizationForm: React.FC<OrganizationFormProps> = ({ onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const { addOrganization, user } = useCatalyst();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    addOrganization({
      id: `org-${Date.now()}`,
      name,
      ownerId: user.id,
      members: [{ userId: user.id, role: 'admin' }]
    });
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark">
      <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Create Organization</h2>
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Organization Name"
        className="w-full px-4 py-2 bg-surface-darker/5 dark:bg-surface-darker/30 border border-border-light dark:border-border-dark rounded-lg"
        required
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Create</Button>
      </div>
    </form>
  );
};
