import React, { useState } from 'react';
import { Button } from './ui/Button';
import { useCatalyst } from '../context/CatalystContext';

interface ProjectFormProps {
  orgId: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ orgId, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { addProject } = useCatalyst();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProject(orgId, {
      id: `proj-${Date.now()}`,
      orgId,
      name,
      description
    });
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-surface-light dark:bg-surface-dark rounded-xl shadow-lg border border-border-light dark:border-border-dark">
      <h2 className="text-xl font-bold text-text-light dark:text-text-dark">Create Project</h2>
      <input 
        type="text" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        placeholder="Project Name"
        className="w-full px-4 py-2 bg-surface-darker/5 dark:bg-surface-darker/30 border border-border-light dark:border-border-dark rounded-lg"
        required
      />
      <textarea 
        value={description} 
        onChange={(e) => setDescription(e.target.value)} 
        placeholder="Description"
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
