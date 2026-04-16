
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Dashboard } from '../../Dashboard';
import { InitiativeStatus, Sector, TInitiative } from '../../../types';

// Mock context to prevent hook errors
const mockSetHiveCommand = vi.fn();
const mockSetCurrentView = vi.fn();

vi.mock('../../../context/CatalystContext', () => ({
    useCatalyst: () => ({
        setHiveCommand: mockSetHiveCommand,
        setCurrentView: mockSetCurrentView
    })
}));

const mockInitiatives: TInitiative[] = [
    {
        id: '1',
        orgId: 'org-0',
        projectId: 'proj-0',
        title: 'Project Alpha',
        description: 'Test Description for Alpha',
        status: InitiativeStatus.PLANNING,
        sector: Sector.FINTECH,
        owner: { name: 'Alice', avatarUrl: 'http://test.com/a.jpg' },
        artifacts: {}
    },
    {
        id: '2',
        orgId: 'org-0',
        projectId: 'proj-0',
        title: 'Project Beta',
        description: 'Test Description for Beta',
        status: InitiativeStatus.LIVE,
        sector: Sector.GREEN_ENERGY,
        owner: { name: 'Bob', avatarUrl: 'http://test.com/b.jpg' },
        artifacts: {}
    }
];

describe('Dashboard Component', () => {
    it('renders empty state when no initiatives provided', () => {
        const handleSelect = vi.fn();
        const handleCreate = vi.fn();

        render(
            <Dashboard 
                initiatives={[]} 
                onSelectInitiative={handleSelect} 
                onCreateInitiative={handleCreate} 
            />
        );

        expect(screen.getByText('No Initiatives Found')).toBeDefined();
        expect(screen.getByText('Create First Initiative')).toBeDefined();
    });

    it('renders initiatives grouped by sector', () => {
        const handleSelect = vi.fn();
        const handleCreate = vi.fn();

        render(
            <Dashboard 
                initiatives={mockInitiatives} 
                onSelectInitiative={handleSelect} 
                onCreateInitiative={handleCreate} 
            />
        );

        // Check Sectors
        expect(screen.getAllByText(Sector.FINTECH).length).toBeGreaterThan(0);
        expect(screen.getAllByText(Sector.GREEN_ENERGY).length).toBeGreaterThan(0);

        // Check Initiatives
        expect(screen.getByText('Project Alpha')).toBeDefined();
        expect(screen.getByText('Project Beta')).toBeDefined();
        
        // Check Owner
        expect(screen.getByText('Alice')).toBeDefined();
    });

    it('calls onCreateInitiative when New Initiative button is clicked', () => {
        const handleSelect = vi.fn();
        const handleCreate = vi.fn();

        render(
            <Dashboard 
                initiatives={mockInitiatives} 
                onSelectInitiative={handleSelect} 
                onCreateInitiative={handleCreate} 
            />
        );

        // The create button may be labeled 'Create' or 'New Initiative' — match by accessible role
        const createButtons = screen.getAllByRole('button', { name: /new initiative/i });
        fireEvent.click(createButtons[0]);
        
        expect(handleCreate).toHaveBeenCalled();
    });

    it('calls onSelectInitiative when a card is clicked', () => {
        const handleSelect = vi.fn();
        const handleCreate = vi.fn();

        render(
            <Dashboard 
                initiatives={mockInitiatives} 
                onSelectInitiative={handleSelect} 
                onCreateInitiative={handleCreate} 
            />
        );

        fireEvent.click(screen.getByText('Project Alpha'));
        expect(handleSelect).toHaveBeenCalledWith(mockInitiatives[0]);
    });
});
