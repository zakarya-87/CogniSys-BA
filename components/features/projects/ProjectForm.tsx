
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderPlus, Plus, X } from 'lucide-react';
import { Button } from '../../ui/Button';

interface ProjectFormProps {
  onCancel: () => void;
  onSubmit: (data: { name: string; description: string }) => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({ onCancel, onSubmit }) => {
  const { t } = useTranslation(['common']);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), description: description.trim() });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl max-w-md w-full animate-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-accent-purple/10 p-2 rounded-xl">
            <FolderPlus className="h-5 w-5 text-accent-purple" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Project</h2>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
            Project Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent-purple outline-none transition-all"
            placeholder="e.g. Q3 Growth Initiative"
            autoFocus
          />
        </div>

        <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                Description
            </label>
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-accent-purple outline-none transition-all resize-none"
                placeholder="Briefly describe the project goals..."
            />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={!name.trim()}>
            Create
          </Button>
        </div>
      </form>
    </div>
  );
};
