import React, { ReactNode } from 'react';
import { UIProvider } from './UIContext';
import { AuthProvider } from './AuthContext';
import { OrgProvider } from './OrgContext';
import { InitiativeProvider } from './InitiativeContext';

// Re-export focused hooks so components can subscribe to a single domain
export { useUI, useTheme } from './UIContext';
export { useAuth } from './AuthContext';
export { useOrg } from './OrgContext';
export { useInitiative } from './InitiativeContext';

/**
 * CatalystProvider is now a thin composition layer that wraps the application
 * in domain-specific providers, avoiding massive re-renders when isolated
 * state changes (e.g. typing in a search bar updates UI context, but 
 * doesn't force a re-render of all Org data).
 */
export const CatalystProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <UIProvider>
            <AuthProvider>
                <OrgProvider>
                    <InitiativeProvider>
                        {children}
                    </InitiativeProvider>
                </OrgProvider>
            </AuthProvider>
        </UIProvider>
    );
};

// --- LEGACY FALLBACK FOR INCREMENTAL MIGRATION ---
// Note: We strongly encourage consuming components to use useAuth(), useUI(), useOrg(), useInitiative()
// depending on specifically what they need. This legacy useCatalyst hook bridges the gap.
import { useAuth as useContextAuth } from './AuthContext';
import { useUI as useContextUI } from './UIContext';
import { useOrg as useContextOrg } from './OrgContext';
import { useInitiative as useContextInit } from './InitiativeContext';

export const useCatalyst = () => {
    const auth = useContextAuth();
    const ui = useContextUI();
    const org = useContextOrg();
    const init = useContextInit();

    return {
        ...auth,
        ...ui,
        ...org,
        ...init,
        loading: auth.loading || org.loading || init.loading,
        apiError: org.apiError || (init as any).apiError // initiativeContext doesn't have it yet, but best to be safe
    };
};
