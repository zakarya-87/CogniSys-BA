
import React from 'react';
import { motion } from 'motion/react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useCatalyst } from '../../context/CatalystContext';

/**
 * FocusModeButton — fixed FAB (bottom-right)
 * Toggles between focusMode OFF (Maximize2) and ON (Minimize2 + teal glow).
 * Accessible: aria-pressed, aria-label, Escape key handled globally in App.tsx.
 */
export const FocusModeButton: React.FC = () => {
    const { isFocusModeActive, toggleFocusMode } = useCatalyst();

    return (
        <motion.button
            id="focus-mode-fab"
            onClick={toggleFocusMode}
            aria-label={isFocusModeActive ? 'Exit Focus Mode' : 'Enter Focus Mode'}
            aria-pressed={isFocusModeActive}
            title={isFocusModeActive ? 'Exit Focus Mode (Esc)' : 'Focus Mode (Ctrl+Shift+F)'}
            className={[
                'fixed bottom-6 right-6 z-50',
                'flex items-center gap-2 px-4 py-3 rounded-2xl',
                'glass-card metallic-sheen',
                'text-sm font-bold transition-all duration-300',
                'border',
                isFocusModeActive
                    ? 'text-accent-teal border-accent-teal/40 shadow-[0_0_24px_rgba(0,212,170,0.25)]'
                    : 'text-white/50 border-white/10 hover:text-accent-teal hover:border-accent-teal/30 hover:shadow-[0_0_16px_rgba(0,212,170,0.15)]',
            ].join(' ')}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.96 }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        >
            {isFocusModeActive ? (
                <Minimize2 className="h-4 w-4" />
            ) : (
                <Maximize2 className="h-4 w-4" />
            )}
            <span className="hidden sm:inline text-xs uppercase tracking-widest">
                {isFocusModeActive ? 'Exit Focus' : 'Focus'}
            </span>
        </motion.button>
    );
};
