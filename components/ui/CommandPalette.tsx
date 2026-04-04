
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TInitiative } from '../../types';
import { MODULE_GROUPS } from '../../constants';
import { SearchAPI } from '../../src/services/api';
import { useCatalyst } from '../../context/CatalystContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: any) => void; // Using any to handle both View string and Initiative module selection
  onAction: (action: string) => void;
  selectedInitiative: TInitiative | null;
}

const SearchIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const CommandIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18.75V5.25A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21z" /></svg>;
const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" /></svg>;

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate, onAction, selectedInitiative }) => {
  const { organizations } = useCatalyst();
  const currentOrg = organizations[0];
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<{ id: string; type: string; name: string; description?: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback((q: string) => {
    if (!currentOrg?.id || q.trim().length < 2) { setSearchResults([]); return; }
    SearchAPI.search(currentOrg.id, q)
      .then((res) => setSearchResults((res.data as any).results ?? []))
      .catch(() => setSearchResults([]));
  }, [currentOrg?.id]);

  // Define commands based on context
  const getCommands = () => {
    const commands = [
      { id: 'home', label: 'Go to Dashboard', group: 'Navigation', action: () => onNavigate('dashboard') },
      { id: 'initiatives', label: 'Go to Initiatives List', group: 'Navigation', action: () => onNavigate('initiatives') },
      { id: 'projectHub', label: 'Go to Project Hub', group: 'Navigation', action: () => onNavigate('projectHub') },
      { id: 'intelligence', label: 'Go to Intelligence Center', group: 'Navigation', action: () => onNavigate('intelligenceCenter') },
      { id: 'reports', label: 'Go to Reports', group: 'Navigation', action: () => onNavigate('reports') },
      { id: 'settings', label: 'Go to Settings', group: 'Navigation', action: () => onNavigate('settings') },
      { id: 'help', label: 'Go to Help & Docs', group: 'Navigation', action: () => onNavigate('help') },
      { id: 'new-init', label: 'Create New Initiative', group: 'Actions', action: () => onAction('createInitiative') },
    ];

    if (selectedInitiative) {
        // Add module navigation if inside an initiative
        Object.entries(MODULE_GROUPS).forEach(([group, modules]) => {
            modules.forEach(mod => {
                commands.push({
                    id: `mod-${mod}`,
                    label: `Open ${mod}`,
                    group: `Initiative: ${selectedInitiative.title}`,
                    action: () => onAction(`nav_module:${mod}`)
                });
            });
        });
        
        commands.push({ id: 'add-story', label: 'Add User Story', group: 'Context Actions', action: () => onAction('addStory') });
        commands.push({ id: 'log-risk', label: 'Log New Risk', group: 'Context Actions', action: () => onAction('logRisk') });
    }

    return commands;
  };

  const allCommands = getCommands();
  
  const filteredCommands = allCommands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) || 
    cmd.group.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
        setTimeout(() => inputRef.current?.focus(), 50);
        setQuery('');
        setSelectedIndex(0);
        setSearchResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredCommands[selectedIndex]) {
                filteredCommands[selectedIndex].action();
                onClose();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4" onClick={onClose}>
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" />
      
      <div 
        className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 relative animate-fade-in-down"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <SearchIcon className="h-5 w-5 text-gray-400 mr-3" />
            <input 
                ref={inputRef}
                type="text" 
                className="flex-grow bg-transparent border-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 text-lg"
                placeholder="Type a command or search..."
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            />
            <div className="text-xs text-gray-400 border border-gray-300 dark:border-gray-600 rounded px-1.5 py-0.5">ESC</div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-2">
            {/* Firestore search results */}
            {searchResults.length > 0 && (
              <div>
                <div className="px-4 py-1 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Search Results</div>
                {searchResults.map((r) => (
                  <div
                    key={`sr-${r.id}`}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => {
                      if (r.type === 'initiative') onNavigate('initiatives');
                      else if (r.type === 'project') onNavigate('projectHub');
                      else onNavigate('dashboard');
                      onClose();
                    }}
                  >
                    <span className="text-xs font-bold bg-indigo-500/20 text-indigo-400 rounded px-1.5 py-0.5 uppercase flex-shrink-0">{r.type}</span>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.name}</div>
                      {r.description && <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.description}</div>}
                    </div>
                  </div>
                ))}
                <div className="mx-4 my-1 border-t border-gray-200 dark:border-gray-700" />
              </div>
            )}
            {/* Commands */}
            {filteredCommands.length === 0 && searchResults.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No commands found.
                </div>
            ) : (
                filteredCommands.map((cmd, index) => (
                    <div 
                        key={cmd.id}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                            index === selectedIndex 
                                ? 'bg-indigo-600 text-white' 
                                : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                        onClick={() => { cmd.action(); onClose(); }}
                        onMouseEnter={() => setSelectedIndex(index)}
                    >
                        <div className="flex items-center gap-3">
                            <CommandIcon className={`h-5 w-5 ${index === selectedIndex ? 'text-white' : 'text-gray-400'}`} />
                            <div>
                                <div className="font-medium">{cmd.label}</div>
                                <div className={`text-xs ${index === selectedIndex ? 'text-indigo-200' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {cmd.group}
                                </div>
                            </div>
                        </div>
                        {index === selectedIndex && <ArrowRightIcon className="h-4 w-4" />}
                    </div>
                ))
            )}
        </div>
        
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex justify-between">
            <span><strong>↑↓</strong> to navigate</span>
            <span><strong>↵</strong> to select</span>
        </div>
      </div>
    </div>
  );
};
