
import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useCatalyst } from '../context/CatalystContext';
import { TInitiative, TVisionResult, TVisionAnalysisType } from '../types';
import { analyzeImageArtifact } from '../services/geminiService';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { 
    Image as ImageIcon, 
    Upload, 
    Eye, 
    Check, 
    Copy, 
    Save, 
    AlertCircle,
    Sparkles,
    FileJson,
    ChevronRight,
    RefreshCw
} from 'lucide-react';

export const VisionBoard: React.FC = () => {
    const { t } = useTranslation('dashboard');
    const { initiatives, saveArtifact } = useCatalyst();
    const [selectedInitiativeId, setSelectedInitiativeId] = useState<string>('');
    const [analysisType, setAnalysisType] = useState<TVisionAnalysisType>('Whiteboard to Backlog');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageBase64, setImageBase64] = useState<string | null>(null);
    const [result, setResult] = useState<TVisionResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const activeInitiative = initiatives.find(i => i.id === selectedInitiativeId);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                setImagePreview(base64String);
                // Extract clean base64 (remove data:image/png;base64, prefix)
                setImageBase64(base64String.split(',')[1]);
            };
            reader.readAsDataURL(file);
            setResult(null); // Clear previous result
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!imageBase64 || !activeInitiative) return;
        setIsLoading(true);
        setError(null);
        try {
            const analysis = await analyzeImageArtifact(imageBase64, analysisType, activeInitiative.sector);
            setResult(analysis);
        } catch (error) {
            console.error(error);
            setError("Analysis failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveToArtifacts = () => {
        if (!activeInitiative || !result) return;
        
        // Save the structured data to artifacts
        // For backlog items, we might want to append, but for simplicity here we save the raw vision result
        saveArtifact(activeInitiative.id, 'visionAnalysis', result);
        alert("Saved analysis to project artifacts.");
    };

    const handleCopyToClipboard = () => {
        if (result) {
            navigator.clipboard.writeText(JSON.stringify(result.structuredData, null, 2));
            alert("Copied JSON to clipboard.");
        }
    };

    return (
        <div className="h-full flex flex-col bg-surface-light dark:bg-surface-dark overflow-hidden animate-in fade-in duration-700">
            {/* Header */}
            <div className="bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-border-light dark:border-border-dark p-6 flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-accent-teal/10 rounded-2xl">
                        <ImageIcon className="h-8 w-8 text-accent-teal" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-main-light dark:text-text-main-dark tracking-tight flex items-center gap-2">
                            {t('visionBoard.title')}
                            <Sparkles className="h-4 w-4 text-accent-teal animate-pulse" />
                        </h1>
                        <p className="text-text-muted-light dark:text-text-muted-dark text-sm font-medium">{t('visionBoard.subtitle')}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    <select 
                        value={selectedInitiativeId}
                        onChange={(e) => setSelectedInitiativeId(e.target.value)}
                        className="px-4 py-2.5 bg-surface-darker/5 dark:bg-surface-darker/20 border border-border-light dark:border-border-dark rounded-xl text-sm font-bold text-text-main-light dark:text-text-main-dark focus:ring-2 focus:ring-accent-teal/50 transition-all outline-none"
                    >
                        <option value="">{t('visionBoard.selectProject')}</option>
                        {initiatives.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
                    </select>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden p-8 gap-8">
                
                {/* Left: Input Zone */}
                <div className="w-1/2 flex flex-col gap-6">
                    <div className="bg-surface-light dark:bg-surface-darker p-6 rounded-3xl shadow-sm border border-border-light dark:border-border-dark">
                        <label className="block text-[10px] font-black text-text-muted-light dark:text-text-muted-dark uppercase tracking-[0.2em] mb-4">{t('visionBoard.analysisMode')}</label>
                        <div className="flex flex-wrap gap-3">
                            {[
                                { id: 'Whiteboard to Backlog', label: t('visionBoard.analysisTypes.whiteboardToBacklog') },
                                { id: 'Sketch to Wireframe', label: t('visionBoard.analysisTypes.sketchToWireframe') },
                                { id: 'Legacy to Spec', label: t('visionBoard.analysisTypes.legacyToSpec') },
                                { id: 'Diagram to Process', label: t('visionBoard.analysisTypes.diagramToProcess') }
                            ].map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setAnalysisType(type.id as TVisionAnalysisType)}
                                    className={`px-4 py-2 text-xs font-black rounded-full transition-all border uppercase tracking-wider ${
                                        analysisType === type.id 
                                            ? 'bg-accent-teal text-white border-accent-teal shadow-lg shadow-accent-teal/20' 
                                            : 'bg-surface-darker/5 text-text-muted-light dark:text-text-muted-dark border-border-light dark:border-border-dark hover:bg-surface-darker/10 dark:hover:bg-surface-darker/30'
                                    }`}
                                >
                                    {type.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div 
                        className={`flex-grow border-2 border-dashed rounded-3xl flex flex-col items-center justify-center relative overflow-hidden transition-all group cursor-pointer ${
                            imagePreview 
                                ? 'border-accent-teal/50 bg-surface-darker shadow-inner' 
                                : 'border-border-light dark:border-border-dark hover:border-accent-teal/50 hover:bg-surface-darker/5 dark:hover:bg-surface-darker/20'
                        }`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {imagePreview ? (
                            <img src={imagePreview} alt="Preview" className="max-w-full max-h-full object-contain p-4 animate-in zoom-in-95 duration-500" />
                        ) : (
                            <div className="text-center p-12 transition-transform group-hover:scale-105 duration-300">
                                <div className="h-20 w-20 bg-accent-teal/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                    <Upload className="h-10 w-10 text-accent-teal" />
                                </div>
                                <p className="text-text-main-light dark:text-text-main-dark font-black text-lg tracking-tight">{t('visionBoard.uploadImage')}</p>
                                <p className="text-sm text-text-muted-light dark:text-text-muted-dark mt-2 font-medium">{t('visionBoard.uploadSupport')}</p>
                            </div>
                        )}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange}
                        />
                        {imagePreview && (
                             <div className="absolute bottom-6 right-6 flex gap-3">
                                <Button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="bg-surface-light/20 hover:bg-surface-light/40 backdrop-blur-xl border-none text-white font-black uppercase tracking-widest text-[10px] px-6">
                                     <RefreshCw className="h-3 w-3 mr-2" /> {t('visionBoard.replace')}
                                 </Button>
                             </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 bg-accent-red/10 text-accent-red rounded-2xl border border-accent-red/20 text-sm font-bold flex items-center gap-3 animate-in shake duration-500">
                            <AlertCircle className="h-5 w-5" />
                            {error}
                        </div>
                    )}
                    <Button 
                        onClick={handleAnalyze} 
                        disabled={isLoading || !imagePreview || !activeInitiative} 
                        className="w-full py-4 text-lg font-black uppercase tracking-[0.2em] shadow-xl shadow-accent-teal/20 rounded-2xl"
                    >
                        {isLoading ? <Spinner /> : <><Eye className="h-6 w-6 mr-3" /> {t('visionBoard.analyze')}</>}
                    </Button>
                </div>

                {/* Right: Output Zone */}
                <div className="w-1/2 bg-surface-light dark:bg-surface-darker rounded-3xl shadow-sm border border-border-light dark:border-border-dark flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-border-light dark:border-border-dark bg-surface-darker/5 dark:bg-surface-darker/20 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent-blue/10 rounded-lg">
                                <Sparkles className="h-5 w-5 text-accent-blue" />
                            </div>
                            <h3 className="font-black text-text-main-light dark:text-text-main-dark uppercase tracking-wider text-sm">{t('visionBoard.result')}</h3>
                        </div>
                        {result && (
                            <div className="flex gap-4">
                                <button onClick={handleCopyToClipboard} className="text-[10px] font-black uppercase tracking-widest text-text-muted-light dark:text-text-muted-dark hover:text-accent-teal transition-colors flex items-center gap-2">
                                    <Copy className="h-3 w-3" /> {t('visionBoard.copyJson')}
                                </button>
                                <button onClick={handleSaveToArtifacts} className="text-[10px] font-black uppercase tracking-widest text-accent-teal hover:text-accent-teal/80 transition-colors flex items-center gap-2">
                                    <Save className="h-3 w-3" /> {t('visionBoard.saveToProject')}
                                </button>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex-grow p-8 overflow-y-auto custom-scrollbar">
                        {!result ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-muted-light dark:text-text-muted-dark text-sm italic gap-4">
                                {isLoading ? (
                                    <>
                                        <Spinner />
                                        <p className="font-bold animate-pulse">{t('visionBoard.processing')}</p>
                                    </>
                                ) : (
                                    <>
                                        <ImageIcon className="h-12 w-12 opacity-20 mb-2" />
                                        <p className="font-medium">{t('visionBoard.noResult')}</p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark mb-4">{t('visionBoard.summary')}</h4>
                                    <div className="text-text-main-light dark:text-text-main-dark text-sm leading-relaxed bg-surface-darker/5 dark:bg-surface-darker/30 p-6 rounded-2xl border border-border-light dark:border-border-dark shadow-inner">
                                        {result.summary}
                                    </div>
                                </div>

                                {result.structuredData && (
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted-light dark:text-text-muted-dark">{t('visionBoard.structuredExtraction')}</h4>
                                            <FileJson className="h-4 w-4 text-text-muted-light" />
                                        </div>
                                        <pre className="bg-surface-dark text-accent-green p-6 rounded-2xl text-xs font-mono overflow-x-auto shadow-2xl border border-border-dark">
                                            {JSON.stringify(result.structuredData, null, 2)}
                                        </pre>
                                    </div>
                                )}
                                
                                <div className="pt-4">
                                    <button className="w-full py-3 rounded-xl border border-accent-teal/20 text-accent-teal text-[10px] font-black uppercase tracking-[0.2em] hover:bg-accent-teal/5 transition-all flex items-center justify-center gap-2">
                                        {t('visionBoard.refine')} <ChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
