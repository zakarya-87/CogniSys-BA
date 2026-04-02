
import React, { useState, useEffect } from 'react';
import { TInitiative, TRbacMatrix, TCrudAction } from '../../types';
import { generateRbacMatrix } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { useCatalyst } from '../../context/CatalystContext';

interface AccessControlMatrixProps {
    initiative: TInitiative;
}

const LockClosedIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>;
const ExclamationTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>;

export const AccessControlMatrix: React.FC<AccessControlMatrixProps> = ({ initiative }) => {
    const { saveArtifact } = useCatalyst();
    const [matrix, setMatrix] = useState<TRbacMatrix | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load persisted artifact
    useEffect(() => {
        if (initiative.artifacts?.accessControlMatrix) {
            setMatrix(initiative.artifacts.accessControlMatrix);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        try {
            const result = await generateRbacMatrix(initiative.title, initiative.description, initiative.sector);
            setMatrix(result);
            saveArtifact(initiative.id, 'accessControlMatrix', result);
        } catch (error) {
            console.error(error);
            setError("Failed to generate RBAC matrix.");
        } finally {
            setIsLoading(false);
        }
    };

    const togglePermission = (roleId: string, resourceId: string, permission: TCrudAction) => {
        if (!matrix) return;
        
        const currentPerms = matrix.permissions[roleId]?.[resourceId] || [];
        let newPerms: TCrudAction[];
        
        if (currentPerms.includes(permission)) {
            newPerms = currentPerms.filter(p => p !== permission);
        } else {
            newPerms = [...currentPerms, permission].sort();
        }

        const newMatrix = {
            ...matrix,
            permissions: {
                ...matrix.permissions,
                [roleId]: {
                    ...matrix.permissions[roleId],
                    [resourceId]: newPerms
                }
            }
        };
        setMatrix(newMatrix);
        saveArtifact(initiative.id, 'accessControlMatrix', newMatrix);
    };

    const getPermButton = (roleId: string, resourceId: string, type: TCrudAction, label: string, color: string) => {
        const isActive = matrix?.permissions[roleId]?.[resourceId]?.includes(type);
        return (
            <button 
                onClick={() => togglePermission(roleId, resourceId, type)}
                className={`w-6 h-6 text-xs font-bold rounded border transition-all ${isActive ? `${color} text-white border-transparent` : 'bg-white dark:bg-gray-700 text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400'}`}
                title={`Toggle ${label}`}
            >
                {type}
            </button>
        );
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
            {error && (
                <div className="p-4 bg-red-50 text-red-800 rounded-lg border border-red-200">
                    <h3 className="font-bold mb-2">Error</h3>
                    <p>{error}</p>
                </div>
            )}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <LockClosedIcon className="h-7 w-7 text-accent-purple" />
                        Access Control & Security Matrix
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Design Roles-Based Access Control (RBAC) and identify Segregation of Duties (SoD) risks.
                    </p>
                </div>
                <Button onClick={handleGenerate} disabled={isLoading}>
                    {isLoading ? <Spinner /> : 'Architect Security Model'}
                </Button>
            </div>

            {!matrix && !isLoading && (
                <div className="flex-grow flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-12">
                    <LockClosedIcon className="h-16 w-16 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Security Model Defined</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 text-center max-w-md">
                        Click "Architect Security Model" to generate roles, resources, and permissions tailored to the {initiative.sector} sector.
                    </p>
                </div>
            )}

            {matrix && (
                <div className="flex flex-col lg:flex-row gap-6 animate-fade-in-down">
                    {/* Main Matrix */}
                    <div className="flex-grow overflow-x-auto custom-scrollbar">
                        <table className="min-w-full border-collapse border border-gray-200 dark:border-gray-700">
                            <thead>
                                <tr>
                                    <th className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-left min-w-[150px]">Resource \ Role</th>
                                    {(matrix.roles || []).map(role => (
                                        <th key={role.id} className="p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center min-w-[120px]">
                                            <div className="text-sm font-bold text-gray-800 dark:text-white">{role.name}</div>
                                            <div className="text-[10px] font-normal text-gray-500">{role.description}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(matrix.resources || []).map(res => (
                                    <tr key={res.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="p-3 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                                            <div className="text-sm font-medium text-gray-800 dark:text-gray-200">{res.name}</div>
                                        </td>
                                        {(matrix.roles || []).map(role => (
                                            <td key={`${role.id}-${res.id}`} className="p-3 border border-gray-200 dark:border-gray-700 text-center bg-white dark:bg-gray-800">
                                                <div className="flex justify-center gap-1">
                                                    {getPermButton(role.id, res.id, 'C', 'Create', 'bg-accent-emerald')}
                                                    {getPermButton(role.id, res.id, 'R', 'Read', 'bg-accent-purple')}
                                                    {getPermButton(role.id, res.id, 'U', 'Update', 'bg-accent-amber')}
                                                    {getPermButton(role.id, res.id, 'D', 'Delete', 'bg-accent-red')}
                                                </div>
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div className="mt-3 flex gap-4 text-xs text-gray-500 dark:text-gray-400 justify-end">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-accent-emerald rounded-full"></span> Create</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-accent-purple rounded-full"></span> Read</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-accent-amber rounded-full"></span> Update</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-accent-red rounded-full"></span> Delete</span>
                        </div>
                    </div>

                    {/* Risk Sidebar */}
                    <div className="w-full lg:w-72 flex-shrink-0">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 rounded-lg p-4">
                            <h3 className="font-bold text-red-800 dark:text-red-300 flex items-center gap-2 mb-3">
                                <ExclamationTriangleIcon className="h-5 w-5" />
                                SoD Risks
                            </h3>
                            {(matrix.sodRisks || []).length === 0 ? (
                                <p className="text-xs text-green-600 dark:text-green-400">No critical conflicts detected.</p>
                            ) : (
                                <ul className="space-y-2">
                                    {(matrix.sodRisks || []).map((risk, i) => (
                                        <li key={i} className="text-xs text-red-700 dark:text-red-200 bg-white dark:bg-red-900/40 p-2 rounded border border-red-100 dark:border-red-800">
                                            {risk}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
