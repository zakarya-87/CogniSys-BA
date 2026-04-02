
import React, { useState, useMemo } from 'react';
import { TInitiative } from '../../types';

interface RaciMatrixToolProps {
    initiative?: TInitiative;
}

// Mock stakeholders until they are properly stored on the initiative
const MOCK_STAKEHOLDERS = [
    'Sara (Founder)',
    'Alex (UI/UX)',
    'Brenda (Backend)',
    'Carlos (iOS Dev)',
    'Diana (Android Dev)'
];

type RaciRole = 'R' | 'A' | 'C' | 'I' | '';

export const RaciMatrixTool: React.FC<RaciMatrixToolProps> = ({ initiative }) => {
    
    const tasks = useMemo(() => {
        if (!initiative?.wbs?.sprints) {
            return ['Define High-Level Requirements', 'Develop UI Mockups', 'Build Backend API', 'User Acceptance Testing'];
        }
        return (initiative.wbs.sprints || []).flatMap(sprint => 
            (sprint.stories || []).flatMap(story => (story.tasks || []).map(task => task.title))
        );
    }, [initiative]);

    const stakeholders = MOCK_STAKEHOLDERS;

    const initialMatrix = useMemo(() => Array(tasks.length).fill(null).map(() => Array(stakeholders.length).fill('')), [tasks, stakeholders]);
    const [matrix, setMatrix] = useState<RaciRole[][]>(initialMatrix);

    const handleRoleChange = (taskIndex: number, stakeholderIndex: number, role: RaciRole) => {
        const newMatrix = matrix.map(row => [...row]);
        newMatrix[taskIndex][stakeholderIndex] = role;
        setMatrix(newMatrix);
    };
    
    const roleConfig: { [key in RaciRole]: { label: string; color: string } } = {
        'R': { label: 'Responsible', color: 'bg-accent-purple text-white' },
        'A': { label: 'Accountable', color: 'bg-accent-emerald text-white' },
        'C': { label: 'Consulted', color: 'bg-accent-amber text-black' },
        'I': { label: 'Informed', color: 'bg-gray-400 text-white' },
        '': { label: 'Select Role', color: 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' }
    };
    
    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Interactive RACI Matrix</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">Assign roles and responsibilities for project tasks. The matrix is pre-populated with stakeholders and tasks from the project plan.</p>
            </div>

            <div className="flex flex-wrap gap-4 my-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                {Object.entries(roleConfig).filter(([key]) => key).map(([key, {label, color}]) => (
                    <div key={key} className="flex items-center gap-2">
                        <span className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded ${color}`}>{key}</span>
                        <span className="text-sm">{label}</span>
                    </div>
                ))}
            </div>

            <div className="overflow-x-auto custom-scrollbar">
                <table className="min-w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="p-3 text-left font-semibold border dark:border-gray-600 w-1/3">Task / Deliverable</th>
                            {stakeholders.map((stakeholder, i) => (
                                <th key={i} className="p-3 text-center font-semibold border dark:border-gray-600 -rotate-45 h-24" style={{ writingMode: 'vertical-rl' }}>{stakeholder}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map((task, taskIndex) => (
                            <tr key={taskIndex} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700/50">
                                <td className="p-3 font-medium border dark:border-gray-600">{task}</td>
                                {stakeholders.map((_, stakeholderIndex) => (
                                    <td key={stakeholderIndex} className="p-1 text-center border dark:border-gray-600">
                                        <select
                                            value={matrix[taskIndex] ? matrix[taskIndex][stakeholderIndex] : ''}
                                            onChange={(e) => handleRoleChange(taskIndex, stakeholderIndex, e.target.value as RaciRole)}
                                            className={`w-full p-2 border-0 rounded-md text-center appearance-none focus:ring-2 focus:ring-accent-purple/50 font-bold ${matrix[taskIndex] ? roleConfig[matrix[taskIndex][stakeholderIndex]].color : ''}`}
                                        >
                                            {Object.keys(roleConfig).map((key) => (
                                                <option key={key} value={key}>{key}</option>
                                            ))}
                                        </select>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
