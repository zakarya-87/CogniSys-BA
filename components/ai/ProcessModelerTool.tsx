
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generateBpmnFlow } from '../../services/geminiService';
import { TBpmnFlow, TInitiative } from '../../types';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { RenderBpmnFlow } from '../ui/RenderBpmnFlow';
import { useCatalyst } from '../../context/CatalystContext';

interface ProcessModelerToolProps {
    initiative?: TInitiative;
}

export const ProcessModelerTool: React.FC<ProcessModelerToolProps> = ({ initiative }) => {
    const { t, i18n } = useTranslation(['common', 'dashboard']);
    const { saveArtifact } = useCatalyst();
    const [description, setDescription] = useState('User logs in, searches for a product, adds it to the cart, and checks out.');
    const [flow, setFlow] = useState<TBpmnFlow | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load persisted artifact
    useEffect(() => {
        if (initiative && initiative.artifacts?.bpmnFlow) {
            setFlow(initiative.artifacts.bpmnFlow);
        }
    }, [initiative?.id, initiative?.artifacts]);

    const handleGenerate = useCallback(async () => {
        if (!description) return;
        setIsLoading(true);
        setError(null);
        setFlow(null);
        try {
            const result = await generateBpmnFlow(description, initiative.sector, i18n.language);
            setFlow(result);
            if (initiative) {
                saveArtifact(initiative.id, 'bpmnFlow', result);
            }
        } catch (err) {
            setError(t('dashboard:requirements.error_bpmn'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [description, initiative, saveArtifact, i18n.language, t]);

    // Defensive check for rendering
    const safeFlow = flow ? { nodes: Array.isArray(flow?.nodes) ? flow.nodes : [], edges: Array.isArray(flow?.edges) ? flow.edges : [] } : null;

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard:requirements.bpmn_title')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('dashboard:requirements.bpmn_desc')}</p>
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                    <label htmlFor="processDesc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard:requirements.process_desc_label')}</label>
                    <textarea
                    id="processDesc"
                    rows={3}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple/50"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('dashboard:requirements.process_desc_placeholder')}
                    />
                </div>
                <Button onClick={handleGenerate} disabled={isLoading || !description}>
                    {isLoading ? <Spinner /> : t('dashboard:requirements.btn_generate_bpmn')}
                </Button>
                {error && <p className="text-accent-red">{error}</p>}
                {safeFlow && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg mt-4 border border-gray-200 dark:border-gray-700 overflow-x-auto custom-scrollbar">
                        <h3 className="text-lg font-semibold mb-4 text-center">{t('dashboard:requirements.generated_bpmn_title')}</h3>
                        <div className="min-w-max">
                            <RenderBpmnFlow flow={safeFlow} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
