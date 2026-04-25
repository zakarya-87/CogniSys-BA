
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
            const result = await generateBpmnFlow(description, initiative?.sector || 'General', i18n.language);
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
        <div className="space-y-8 slide-up">
            <div className="relative group p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:bg-white/[0.05] transition-all duration-500">
                <div className="absolute top-0 right-10 transform -translate-y-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-60 flex items-center gap-2">
                    <Layers className="h-3 w-3 text-accent-purple" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Process Workflow Architect</span>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <textarea
                            className="flex-grow bg-black/40 border-none rounded-2xl p-6 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all resize-none font-medium custom-scrollbar"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe the business process flow..."
                        />
                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading || !description.trim()}
                            className="lg:w-48 flex items-center justify-center gap-3 bg-accent-purple text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-accent-purple/80 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all disabled:opacity-20"
                        >
                            {isLoading ? <Spinner className="h-5 w-5" /> : <><Sparkles className="h-4 w-4" /> Map Logic</>}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-2xl border border-accent-red/20 text-[10px] font-black uppercase tracking-widest">
                    {error}
                </div>
            )}

            {safeFlow && (
                <div className="relative group overflow-hidden bg-white/[0.02] border border-white/5 rounded-[3rem] slide-up">
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
                    
                    <div className="p-10 relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-accent-purple/20 rounded-xl border border-accent-purple/30">
                                    <Layers className="h-5 w-5 text-accent-purple" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tighter uppercase italic text-white">BPMN Logic Blueprint</h3>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic font-mono">Process Flow Synthesis v4.0</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-accent-purple animate-pulse" />
                                <span className="text-[8px] font-black text-accent-purple uppercase tracking-[0.3em]">Operational Live</span>
                            </div>
                        </div>

                        <div className="relative h-[650px] w-full bg-black/40 rounded-[2rem] border border-white/5 overflow-hidden group/canvas">
                            <div className="absolute bottom-6 left-6 z-20 flex gap-2">
                                <div className="flex bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-1 gap-1">
                                    <div className="p-2 text-white/40"><MousePointer2 className="h-4 w-4" /></div>
                                    <div className="px-3 flex items-center">
                                        <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Navigation Enabled</span>
                                    </div>
                                </div>
                            </div>

                            <TransformWrapper initialScale={0.7} minScale={0.1} maxScale={3} centerOnInit>
                                {({ zoomIn, zoomOut, resetTransform }) => (
                                    <>
                                        <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
                                            <button onClick={() => zoomIn()} className="p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white hover:border-accent-purple transition-all"><Maximize2 className="h-4 w-4" /></button>
                                            <button onClick={() => zoomOut()} className="p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white hover:border-accent-purple transition-all"><Maximize2 className="h-4 w-4 rotate-180" /></button>
                                            <button onClick={() => resetTransform()} className="p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white hover:border-accent-purple transition-all"><RotateCcw className="h-4 w-4" /></button>
                                        </div>
                                        <TransformComponent wrapperClassName="!w-full !h-full" contentClassName="!w-full !h-full flex items-center justify-center p-20">
                                            <div className="cursor-grab active:cursor-grabbing">
                                                <RenderBpmnFlow flow={safeFlow} />
                                            </div>
                                        </TransformComponent>
                                    </>
                                )}
                            </TransformWrapper>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

