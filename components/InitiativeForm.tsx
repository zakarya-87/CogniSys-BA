import React, { useState } from 'react';
import { TInitiative, Sector, InitiativeStatus } from '../types';
import { Button } from './ui/Button';

interface InitiativeFormProps {
  initiative?: TInitiative;
  projectId: string; // Added projectId
  onSubmit: (initiative: TInitiative) => void;
  onCancel: () => void;
}

export const InitiativeForm: React.FC<InitiativeFormProps> = ({ initiative, projectId, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(initiative?.title || '');
  const [description, setDescription] = useState(initiative?.description || '');
  const [sector, setSector] = useState<Sector>(initiative?.sector || Sector.GENERAL);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and Description are required.');
      return;
    }
    setError(null);
    onSubmit({
      ...initiative,
      id: initiative?.id || `init-${Date.now()}`,
      projectId, // Use projectId
      title,
      description,
      sector,
      status: initiative?.status || InitiativeStatus.PLANNING,
      owner: initiative?.owner || { name: 'User', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=User' },
    } as TInitiative);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-8 bg-surface-light dark:bg-surface-dark rounded-2xl shadow-2xl border border-border-light dark:border-border-dark w-full max-w-lg animate-in fade-in zoom-in duration-300">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-text-light dark:text-text-dark tracking-tight">
            {initiative ? 'Edit Initiative' : 'Create Initiative'}
        </h2>
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">
            Define the core parameters of your strategic initiative.
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark ml-1">Title</label>
            <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="w-full px-4 py-3 bg-surface-darker/5 dark:bg-surface-darker/30 border border-border-light dark:border-border-dark rounded-xl focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple outline-none transition-all text-text-light dark:text-text-dark placeholder:text-text-muted-light/50" 
                required 
                placeholder="e.g. Project Phoenix"
            />
        </div>
        
        <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark ml-1">Description</label>
            <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                className="w-full px-4 py-3 bg-surface-darker/5 dark:bg-surface-darker/30 border border-border-light dark:border-border-dark rounded-xl focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple outline-none transition-all text-text-light dark:text-text-dark placeholder:text-text-muted-light/50 min-h-[120px] resize-none" 
                required 
                placeholder="Briefly describe the initiative's goals..."
            />
        </div>
        
        <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark ml-1">Sector</label>
            <select 
                value={sector} 
                onChange={(e) => setSector(e.target.value as Sector)} 
                className="w-full px-4 py-3 bg-surface-darker/5 dark:bg-surface-darker/30 border border-border-light dark:border-border-dark rounded-xl focus:ring-2 focus:ring-accent-purple/50 focus:border-accent-purple outline-none transition-all text-text-light dark:text-text-dark appearance-none cursor-pointer"
            >
            {Object.values(Sector).map(s => <option key={s} value={s} className="bg-surface-light dark:bg-surface-dark">{s}</option>)}
            </select>
        </div>
      </div>
      
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex justify-end gap-3 pt-6 border-t border-border-light dark:border-border-dark">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" className="shadow-lg shadow-accent-purple/20 px-8">
            {initiative ? 'Save Changes' : 'Create Initiative'}
        </Button>
      </div>
    </form>
  );
};
