
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TDecisionMatrix, TInitiative } from '../../types';
import { generateDecisionMatrixAnalysis } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';

export const DecisionMatrixTool: React.FC<{ initiative: TInitiative }> = ({ initiative }) => {
    const { t, i18n } = useTranslation(['common', 'dashboard']);
    const [criteria, setCriteria] = useState<{ name: string; weight: number }[]>([]);
    const [alternatives, setAlternatives] = useState<string[]>([]);
    const [matrix, setMatrix] = useState<TDecisionMatrix | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initialize with translated defaults
    useEffect(() => {
        if (criteria.length === 0) {
            setCriteria([
                { name: t('dashboard:decision.default_criteria_cost'), weight: 4 },
                { name: t('dashboard:decision.default_criteria_ux'), weight: 5 },
                { name: t('dashboard:decision.default_criteria_market'), weight: 3 },
            ]);
        }
        if (alternatives.length === 0) {
            setAlternatives([
                t('dashboard:decision.default_alt_house'),
                t('dashboard:decision.default_alt_buy'),
                t('dashboard:decision.default_alt_partner'),
            ]);
        }
    }, [t]);

    const handleGenerate = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setMatrix(null);
        try {
            let result = await generateDecisionMatrixAnalysis(criteria, alternatives, initiative.sector, i18n.language);
            // Post-process to calculate totals
            result.alternatives = (result.alternatives || []).map(alt => ({
                ...alt,
                total: (alt.scores || []).reduce((acc, score, index) => acc + (score * (result.criteria[index]?.weight || 1)), 0)
            }));
            setMatrix(result);
        } catch (err) {
            setError(t('dashboard:decision.error_generate'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [criteria, alternatives, i18n.language, t]);
    
    // Handlers to manage dynamic inputs
    const handleCriteriaChange = (index: number, field: 'name' | 'weight', value: string | number) => {
        const newCriteria = [...criteria];
        newCriteria[index] = { ...newCriteria[index], [field]: value };
        setCriteria(newCriteria);
    };
    const handleAlternativeChange = (index: number, value: string) => {
        const newAlternatives = [...alternatives];
        newAlternatives[index] = value;
        setAlternatives(newAlternatives);
    };
    const addCriteria = () => setCriteria([...criteria, { name: '', weight: 1 }]);
    const addAlternative = () => setAlternatives([...alternatives, '']);

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-6">
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard:decision.title')}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{t('dashboard:decision.desc')}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Criteria Input */}
                <div className="space-y-2">
                    <h3 className="font-semibold">{t('dashboard:decision.criteria_label')}</h3>
                    {criteria.map((c, i) => (
                        <div key={i} className="flex gap-2">
                            <input type="text" value={c.name} onChange={e => handleCriteriaChange(i, 'name', e.target.value)} placeholder={t('dashboard:decision.criteria_placeholder')} className="w-2/3 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                            <input type="number" value={c.weight} onChange={e => handleCriteriaChange(i, 'weight', parseInt(e.target.value) || 1)} min="1" max="5" className="w-1/3 p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                    ))}
                    <button onClick={addCriteria} className="text-sm text-accent-purple hover:underline">+ {t('dashboard:decision.add_criterion')}</button>
                </div>
                {/* Alternatives Input */}
                <div className="space-y-2">
                    <h3 className="font-semibold">{t('dashboard:decision.alternatives_label')}</h3>
                    {alternatives.map((a, i) => (
                        <input key={i} type="text" value={a} onChange={e => handleAlternativeChange(i, e.target.value)} placeholder={t('dashboard:decision.alternative_placeholder')} className="w-full p-2 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-accent-purple" />
                    ))}
                    <button onClick={addAlternative} className="text-sm text-accent-purple hover:underline">+ {t('dashboard:decision.add_alternative')}</button>
                </div>
            </div>

            <Button onClick={handleGenerate} disabled={isLoading || criteria.length === 0 || alternatives.length === 0}>
                {isLoading ? <Spinner /> : t('dashboard:decision.btn_generate')}
            </Button>

            {error && <p className="text-accent-red">{error}</p>}
            
            {matrix && (
                <div className="space-y-4 pt-4">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100 dark:bg-gray-700">
                                    <th className="p-3 text-left font-semibold border dark:border-gray-600">{t('dashboard:decision.table_alternative')}</th>
                                    {(matrix.criteria || []).map((c, i) => (
                                        <th key={i} className="p-3 text-center font-semibold border dark:border-gray-600">{c.name} (x{c.weight})</th>
                                    ))}
                                     <th className="p-3 text-center font-semibold border dark:border-gray-600 bg-surface-dark">{t('dashboard:decision.table_total')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(matrix.alternatives || []).map((alt, i) => (
                                    <tr key={i} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-800 dark:even:bg-gray-700/50">
                                        <td className="p-3 font-medium border dark:border-gray-600">{alt.name}</td>
                                        {(alt.scores || []).map((score, j) => (
                                            <td key={j} className="p-3 text-center border dark:border-gray-600">{score}</td>
                                        ))}
                                        <td className="p-3 text-center font-bold border dark:border-gray-600 bg-surface-dark text-accent-purple">{alt.total}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-accent-purple/10 border-l-4 border-accent-purple p-4 rounded-r-lg">
                        <h3 className="text-lg font-semibold text-accent-purple">{t('dashboard:decision.ai_recommendation')}</h3>
                        <p className="text-gray-800 dark:text-gray-300">{matrix.recommendation}</p>
                    </div>
                </div>
            )}
        </div>
    );
};
