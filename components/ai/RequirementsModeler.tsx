
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Layout, 
    Layers, 
    Cpu, 
    Database, 
    ShieldCheck, 
    Zap, 
    Target, 
    Plus, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    Activity,
    ListTodo,
    Clipboard,
    MousePointer2,
    Maximize2,
    RotateCcw
} from 'lucide-react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { generateAcceptanceCriteria, generateWireframe, validateRequirement, generateDataModel } from '../../services/geminiService';
import { TWireframeElement, TValidationResult, TInitiative, TDataModel, Sector } from '../../types';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { ProcessModelerTool } from './ProcessModelerTool';
import { useCatalyst } from '../../context/CatalystContext';
import { useUI } from '../../context/UIContext';

type Tool = 'criteria' | 'wireframe' | 'bpmn' | 'validator' | 'data';

// Recursive component to render the wireframe with Blueprint Aesthetic
const RenderWireframeElement: React.FC<{ element: TWireframeElement }> = ({ element }) => {
  const { t } = useTranslation(['common', 'dashboard']);
  const { type, props = {}, children = [] } = element;

  const baseClasses = "border border-accent-cyan/30 bg-accent-cyan/5 relative";
  const labelClasses = "absolute -top-2 -left-2 px-1 text-[8px] font-black uppercase tracking-tighter bg-accent-cyan text-white";
  
  const elementClasses: { [key: string]: string } = {
    div: `${baseClasses} p-6 space-y-4 flex flex-col items-start w-full min-h-[100px] bg-[radial-gradient(#22d3ee22_1px,transparent_1px)] [background-size:16px_16px]`,
    h1: `text-xl font-black tracking-tight p-2 text-white border-b border-white/10 w-full`,
    p: `p-2 text-gray-400 text-sm leading-relaxed`,
    button: `bg-accent-cyan/20 border border-accent-cyan/40 text-accent-cyan font-bold py-3 px-4 rounded-xl w-full text-center text-xs tracking-widest uppercase hover:bg-accent-cyan hover:text-white transition-all`,
    input: `border border-white/10 bg-black/40 p-3 rounded-lg w-full text-sm text-white placeholder:text-gray-600 outline-none`,
    img: `${baseClasses} w-full h-40 bg-black/20 flex flex-col items-center justify-center text-gray-500 border-dashed`,
  };

  const Component = type;

  switch (type) {
    case 'input':
      return (
        <div className="relative w-full">
            <span className={labelClasses}>Field Input</span>
            <input placeholder={props.placeholder || t('dashboard:requirements.input_field')} className={elementClasses.input} readOnly />
        </div>
      );
    case 'img':
        return (
            <div className={elementClasses.img}>
                <span className={labelClasses}>Media Asset</span>
                <Layout className="h-8 w-8 opacity-20" />
                <span className="text-[10px] mt-2 font-bold uppercase tracking-widest opacity-30">{t('dashboard:requirements.image_placeholder')}</span>
            </div>
        );
    case 'button':
        return (
            <div className="relative w-full">
                <span className={labelClasses}>Interaction</span>
                <button className={elementClasses.button}>{props.text || type}</button>
            </div>
        );
    case 'h1':
    case 'p':
        return (
            <div className="relative w-full">
                <span className={labelClasses}>{type === 'h1' ? 'Header' : 'Body Copy'}</span>
                <div className={elementClasses[type]}>{props.text || type}</div>
            </div>
        );
    case 'div':
    default:
      return (
        <div className={elementClasses.div}>
          <span className={labelClasses}>Container</span>
          {(children || []).map((child, index) => (
            <RenderWireframeElement key={index} element={child} />
          ))}
        </div>
      );
  }
};

const AcceptanceCriteriaGenerator: React.FC<{ initiative: TInitiative, language: string }> = ({ initiative, language }) => {
    const { t } = useTranslation(['common', 'dashboard']);
    const [userStory, setUserStory] = useState('As a logged-in user, I want to be able to update my profile information so that my details are always current.');
    const [criteria, setCriteria] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const elicitationReport = initiative.artifacts?.elicitation_report;

    const handleGenerate = useCallback(async () => {
        if (!userStory) return;
        setIsLoading(true);
        setError(null);
        setCriteria('');
        try {
            const result = await generateAcceptanceCriteria(userStory, initiative.sector, language);
            setCriteria(result);
        } catch (err) {
            setError(t('dashboard:requirements.error_criteria'));
        } finally {
            setIsLoading(false);
        }
    }, [userStory, initiative.sector, language, t]);

    const handleCopy = () => {
        navigator.clipboard.writeText(criteria);
        // Toast handled by parent if needed, but we keep it simple here
    };

    const formattedCriteria = (criteria && typeof criteria === 'string') 
        ? criteria.split('\n').filter(line => line.trim() !== '').map((line, index) => {
            const cleanLine = line.trim();
            if (cleanLine.toLowerCase().startsWith('given')) {
                return (
                    <div key={index} className="flex gap-4 group/line py-1">
                        <span className="w-16 shrink-0 text-[10px] font-black tracking-widest text-accent-cyan uppercase pt-1 opacity-50">Given</span>
                        <span className="text-gray-300 font-medium">{cleanLine.substring(5).trim()}</span>
                    </div>
                );
            }
            if (cleanLine.toLowerCase().startsWith('when')) {
                return (
                    <div key={index} className="flex gap-4 group/line py-1">
                        <span className="w-16 shrink-0 text-[10px] font-black tracking-widest text-accent-purple uppercase pt-1 opacity-50">When</span>
                        <span className="text-gray-200">{cleanLine.substring(4).trim()}</span>
                    </div>
                );
            }
            if (cleanLine.toLowerCase().startsWith('then')) {
                return (
                    <div key={index} className="flex gap-4 group/line py-1">
                        <span className="w-16 shrink-0 text-[10px] font-black tracking-widest text-accent-teal uppercase pt-1 opacity-50">Then</span>
                        <span className="text-white font-bold">{cleanLine.substring(4).trim()}</span>
                    </div>
                );
            }
            if (cleanLine.toLowerCase().startsWith('and')) {
                return (
                    <div key={index} className="flex gap-4 group/line py-1">
                        <span className="w-16 shrink-0 text-[10px] font-black tracking-widest text-gray-600 uppercase pt-1 opacity-50">And</span>
                        <span className="text-gray-400 italic">{cleanLine.substring(3).trim()}</span>
                    </div>
                );
            }
            return <div key={index} className="text-gray-600 ml-20 text-[11px] py-0.5">{line}</div>;
        }) 
        : [];

    return (
        <div className="space-y-8 slide-up">
            <div className="relative group p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:bg-white/[0.05] transition-all duration-500">
                <div className="absolute top-0 right-10 transform -translate-y-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-60 flex items-center gap-2">
                    <Activity className="h-3 w-3 text-accent-cyan" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest italic">User Story Input</span>
                </div>

                <div className="space-y-4">
                    {elicitationReport && (
                        <div className="flex flex-wrap gap-2 mb-2 p-1 bg-black/20 rounded-xl w-fit border border-white/5">
                            {elicitationReport.requirements?.slice(0, 3).map((r: string, i: number) => (
                                <button 
                                    key={i} 
                                    onClick={() => setUserStory(r)} 
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-all"
                                >
                                    Requirement {i + 1}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row gap-4">
                        <textarea
                            className="flex-grow bg-black/40 border-none rounded-2xl p-6 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all resize-none font-medium custom-scrollbar"
                            rows={3}
                            value={userStory}
                            onChange={(e) => setUserStory(e.target.value)}
                            placeholder="Describe the user's intent..."
                        />
                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading || !userStory}
                            className="lg:w-48 flex items-center justify-center gap-3 bg-accent-cyan text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#34e2cf] hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all disabled:opacity-20"
                        >
                            {isLoading ? <Spinner className="h-5 w-5" /> : <><Sparkles className="h-4 w-4" /> Generate Spec</>}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-2xl border border-accent-red/20 text-[10px] font-black uppercase tracking-widest">
                    {error}
                </div>
            )}
            
            {criteria && (
                <div className="relative group overflow-hidden bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 slide-up">
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-accent-cyan/20 rounded-xl border border-accent-cyan/30">
                                    <ListTodo className="h-5 w-5 text-accent-cyan" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tighter uppercase italic">Specification Terminal</h3>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Behavioral Logic Output</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-accent-cyan hover:bg-accent-cyan/10 transition-all group"
                            >
                                <Clipboard className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                                Copy Spec
                            </button>
                        </div>
                        
                        <div className="bg-black/40 rounded-[2rem] p-8 border border-white/5 font-mono text-xs leading-relaxed overflow-hidden group/term">
                            <div className="space-y-2">
                                {formattedCriteria}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const WireframeGenerator: React.FC<{ initiative: TInitiative, language: string }> = ({ initiative, language }) => {
    const { t } = useTranslation(['common', 'dashboard']);
    const [requirements, setRequirements] = useState('A login screen with a title "Welcome Back!", an email input, a password input, and a "Log In" button.');
    const [wireframe, setWireframe] = useState<TWireframeElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const elicitationReport = initiative.artifacts?.elicitation_report;

    const handleGenerate = useCallback(async () => {
        if (!requirements) return;
        setIsLoading(true);
        setError(null);
        setWireframe(null);
        try {
            const result = await generateWireframe(requirements, initiative.sector, language);
            setWireframe(result);
        } catch (err) {
            setError(t('dashboard:requirements.error_wireframe'));
        } finally {
            setIsLoading(false);
        }
    }, [requirements, initiative.sector, language, t]);

    return (
        <div className="space-y-8 slide-up">
            <div className="relative group p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:bg-white/[0.05] transition-all duration-500">
                <div className="absolute top-0 right-10 transform -translate-y-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-60 flex items-center gap-2">
                    <Layers className="h-3 w-3 text-accent-cyan" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Mockup Architect</span>
                </div>

                <div className="space-y-4">
                    {elicitationReport && (
                        <div className="flex flex-wrap gap-2 mb-2 p-1 bg-black/20 rounded-xl w-fit border border-white/5">
                            {elicitationReport.requirements?.slice(0, 3).map((r: string, i: number) => (
                                <button 
                                    key={i} 
                                    onClick={() => setRequirements(r)} 
                                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-all"
                                >
                                    Req {i + 1}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col lg:flex-row gap-4">
                        <textarea
                            className="flex-grow bg-black/40 border-none rounded-2xl p-6 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all resize-none font-medium custom-scrollbar"
                            rows={3}
                            value={requirements}
                            onChange={(e) => setRequirements(e.target.value)}
                            placeholder="Describe the UI layout..."
                        />
                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading || !requirements}
                            className="lg:w-48 flex items-center justify-center gap-3 bg-accent-cyan text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#34e2cf] hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all disabled:opacity-20"
                        >
                            {isLoading ? <Spinner className="h-5 w-5" /> : <><Layout className="h-4 w-4" /> Build Blueprint</>}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-2xl border border-accent-red/20 text-[10px] font-black uppercase tracking-widest">
                    {error}
                </div>
            )}
            
            {wireframe && (
                <div className="relative group overflow-hidden bg-black/60 border border-white/10 rounded-[3rem] p-1 slide-up min-h-[600px] flex flex-col">
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/10 to-transparent pointer-events-none" />
                    
                    <div className="px-10 pt-10 pb-4 relative z-10 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-accent-cyan/20 rounded-lg">
                                <Layers className="h-4 w-4 text-accent-cyan" />
                            </div>
                            <span className="text-[10px] font-black text-white/50 tracking-[0.3em] uppercase">Tactical Low-Fidelity Synthesis</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-accent-cyan animate-pulse" />
                            <span className="text-[8px] font-black text-accent-cyan uppercase tracking-tighter">Draft Rev 2.1</span>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-10 relative z-10">
                        <div className="w-full max-w-lg bg-black/40 p-8 rounded-[2.5rem] border border-accent-cyan/30 shadow-2xl backdrop-blur-md relative transform hover:rotate-1 transition-transform duration-700">
                             <div className="absolute -top-4 -right-4 bg-accent-cyan text-black text-[8px] font-black px-2 py-1 rounded-md rotate-12 shadow-lg">CALIBRATED</div>
                             <RenderWireframeElement element={wireframe} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ValidationTool: React.FC<{ sector: string, language: string }> = ({ sector, language }) => {
    const { t } = useTranslation(['common', 'dashboard']);
    const [text, setText] = useState('The system must be fast and user-friendly for all admin users.');
    const [result, setResult] = useState<TValidationResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleValidate = async () => {
        if(!text) return;
        setIsLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await validateRequirement(text, sector as Sector, language);
            setResult(data);
        } catch(e) {
            setError(t('dashboard:requirements.error_validate'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8 slide-up">
            <div className="relative group p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:bg-white/[0.05] transition-all duration-500">
                <div className="absolute top-0 right-10 transform -translate-y-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-60 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3 text-accent-cyan" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Quality Audit Engine</span>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <textarea
                            className="flex-grow bg-black/40 border-none rounded-2xl p-6 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all resize-none font-medium custom-scrollbar"
                            rows={3}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Requirement draft for auditing..."
                        />
                        <button 
                            onClick={handleValidate} 
                            disabled={isLoading || !text.trim()}
                            className="lg:w-48 flex items-center justify-center gap-3 bg-accent-purple text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-accent-purple/80 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all disabled:opacity-20"
                        >
                            {isLoading ? <Spinner className="h-5 w-5" /> : <><Activity className="h-4 w-4" /> Run Audit</>}
                        </button>
                    </div>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-accent-red/10 text-accent-red rounded-2xl border border-accent-red/20 text-[10px] font-black uppercase tracking-widest">
                    {error}
                </div>
            )}
            
            {result && (
                <div className="relative group overflow-hidden bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 slide-up">
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-accent-purple/20 rounded-xl border border-accent-purple/30">
                                    <CheckCircle2 className="h-5 w-5 text-accent-purple" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tighter uppercase italic text-white">Quality Report Card</h3>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Formal Verification Results</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className={`text-5xl font-black tracking-tighter ${result.score > 70 ? 'text-accent-teal' : 'text-accent-amber'}`}>
                                    {result.score}<span className="text-sm opacity-30 ml-1">/100</span>
                                </div>
                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1">Compliance Score</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Tactical Critique</h4>
                                <ul className="space-y-4">
                                    {(Array.isArray(result.critique) ? result.critique : []).map((c, i) => (
                                        <li key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 group/critique hover:bg-white/10 transition-all">
                                            <ChevronRight className="h-4 w-4 shrink-0 text-accent-purple mt-0.5 opacity-40 group-hover/critique:translate-x-1 transition-transform" />
                                            <span className="text-xs font-medium text-gray-300 leading-relaxed uppercase tracking-wide">{c}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black text-accent-teal uppercase tracking-[0.2em]">AI Optimized Definition</h4>
                                <div className="p-8 bg-accent-teal/5 border border-accent-teal/20 rounded-[2.5rem] relative overflow-hidden group/opt min-h-[160px] flex flex-col justify-center">
                                    <div className="absolute -top-4 -right-4 bg-accent-teal text-black text-[8px] font-black px-2 py-1 rounded-md rotate-12 shadow-lg opacity-40 group-hover/opt:opacity-100 transition-opacity">VERIFIED</div>
                                    <p className="text-lg font-bold text-white mb-6 leading-relaxed italic">{result.improvedVersion}</p>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center gap-2 text-[10px] font-medium text-gray-500 italic uppercase tracking-wider">
                                            <AlertCircle className="h-3 w-3" />
                                            {result.reasoning}
                                        </div>
                                        <button 
                                            onClick={() => setText(result.improvedVersion)}
                                            className="w-fit flex items-center gap-2 px-6 py-2 bg-accent-teal text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#34e2cf] transition-all"
                                        >
                                            <Zap className="h-3.5 w-3.5" />
                                            Swap Draft
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const DataArchitectTool: React.FC<{ initiative: TInitiative, language: string }> = ({ initiative, language }) => {
    const { t } = useTranslation(['common', 'dashboard']);
    const { saveArtifact } = useCatalyst();
    const [description, setDescription] = useState('A patient management system where patients can book appointments with doctors.');
    const [model, setModel] = useState<TDataModel | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSql, setShowSql] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (initiative.artifacts?.dataModel) setModel(initiative.artifacts.dataModel);
    }, [initiative.artifacts]);

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateDataModel(description, initiative.sector, language);
            setModel(result);
            saveArtifact(initiative.id, 'dataModel', result);
        } catch(e) {
            setError(t('dashboard:requirements.error_data'));
        } finally {
            setIsLoading(false);
        }
    };

    const getEntityPos = (index: number, total: number) => {
        const radius = 180;
        const angle = (index / total) * 2 * Math.PI - Math.PI/2;
        return { x: 350 + radius * Math.cos(angle), y: 250 + radius * Math.sin(angle) };
    };

    return (
        <div className="space-y-8 slide-up">
            <div className="relative group p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] hover:bg-white/[0.05] transition-all duration-500">
                <div className="absolute top-0 right-10 transform -translate-y-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 opacity-60 flex items-center gap-2">
                    <Database className="h-3 w-3 text-accent-cyan" />
                    <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Data Architect Console</span>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <textarea
                            className="flex-grow bg-black/40 border-none rounded-2xl p-6 text-sm text-white placeholder:text-gray-700 focus:outline-none transition-all resize-none font-medium custom-scrollbar"
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe entities and relationships..."
                        />
                        <button 
                            onClick={handleGenerate} 
                            disabled={isLoading || !description.trim()}
                            className="lg:w-48 flex items-center justify-center gap-3 bg-accent-cyan text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-[#34e2cf] hover:shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all disabled:opacity-20"
                        >
                            {isLoading ? <Spinner className="h-5 w-5" /> : <><Target className="h-4 w-4" /> Build Schema</>}
                        </button>
                    </div>
                </div>
            </div>

            {model && (
                <div className="relative group overflow-hidden bg-white/[0.02] border border-white/5 rounded-[3rem] slide-up">
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none" />
                    
                    <div className="p-10 relative z-10">
                        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-accent-cyan/20 rounded-xl border border-accent-cyan/30">
                                    <Database className="h-5 w-5 text-accent-cyan" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tighter uppercase italic text-white">Cloud Architecture Diagram</h3>
                                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest italic">Multi-Entity Relationship Map</p>
                                </div>
                            </div>
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 gap-1">
                                <button 
                                    onClick={() => setShowSql(false)} 
                                    className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${!showSql ? 'bg-accent-cyan text-black' : 'text-gray-500 hover:text-white'}`}
                                >
                                    Diagram
                                </button>
                                <button 
                                    onClick={() => setShowSql(true)} 
                                    className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${showSql ? 'bg-accent-cyan text-black' : 'text-gray-500 hover:text-white'}`}
                                >
                                    SQL Script
                                </button>
                            </div>
                        </div>

                        {showSql ? (
                            <div className="bg-black/60 rounded-[2rem] p-10 border border-white/5 relative overflow-hidden group/sql">
                                <div className="absolute top-4 right-4 text-[9px] font-black text-accent-emerald uppercase tracking-[0.3em] opacity-40 group-hover/sql:opacity-100 transition-opacity flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-emerald animate-pulse" />
                                    PostgreSQL Ready
                                </div>
                                <pre className="font-mono text-[11px] text-accent-emerald/80 leading-loose overflow-x-auto custom-scrollbar">
                                    <code>{model.sqlPreview}</code>
                                </pre>
                            </div>
                        ) : (
                            <div className="relative h-[600px] w-full bg-black/40 rounded-[2rem] border border-white/5 overflow-hidden group/canvas">
                                {/* Interactivity Controls Overlay */}
                                <div className="absolute bottom-6 left-6 z-20 flex gap-2">
                                    <div className="flex bg-black/60 backdrop-blur-md border border-white/10 rounded-xl p-1 gap-1">
                                        <div className="p-2 text-white/40"><MousePointer2 className="h-4 w-4" /></div>
                                        <div className="px-3 flex items-center">
                                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">Pan/Zoom Active</span>
                                        </div>
                                    </div>
                                </div>

                                <TransformWrapper initialScale={0.8} minScale={0.2} maxScale={2} centerOnInit>
                                    {({ zoomIn, zoomOut, resetTransform }) => (
                                        <>
                                            <div className="absolute top-6 right-6 z-20 flex flex-col gap-2">
                                                <button onClick={() => zoomIn()} className="p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white hover:border-accent-cyan transition-all"><Maximize2 className="h-4 w-4" /></button>
                                                <button onClick={() => zoomOut()} className="p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white hover:border-accent-cyan transition-all"><Maximize2 className="h-4 w-4 rotate-180" /></button>
                                                <button onClick={() => resetTransform()} className="p-2.5 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white hover:border-accent-cyan transition-all"><RotateCcw className="h-4 w-4" /></button>
                                            </div>
                                            <TransformComponent wrapperClassName="!w-full !h-full" contentClassName="!w-full !h-full flex items-center justify-center">
                                                <svg width="1000" height="800" viewBox="0 0 1000 800" className="cursor-grab active:cursor-grabbing">
                                                    <defs>
                                                        <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                                            <path d="M0,0 L0,6 L9,3 z" fill="#22d3ee" opacity="0.5" />
                                                        </marker>
                                                        <filter id="glow">
                                                            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                                                            <feMerge>
                                                                <feMergeNode in="coloredBlur"/>
                                                                <feMergeNode in="SourceGraphic"/>
                                                            </feMerge>
                                                        </filter>
                                                    </defs>
                                                    
                                                    {/* Background Grid inside SVG */}
                                                    <pattern id="smallGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(34,211,238,0.03)" strokeWidth="0.5"/>
                                                    </pattern>
                                                    <rect width="100%" height="100%" fill="url(#smallGrid)" />

                                                    {(Array.isArray(model?.relationships) ? model.relationships : []).map((rel, i) => {
                                                        const entities = Array.isArray(model?.entities) ? model.entities : [];
                                                        const sIdx = entities.findIndex(e => e.name === rel.source);
                                                        const tIdx = entities.findIndex(e => e.name === rel.target);
                                                        if (sIdx === -1 || tIdx === -1) return null;
                                                        
                                                        // Offset positioning to handle 1000x800 canvas
                                                        const getPos = (idx: number, tot: number) => {
                                                            const rad = 280;
                                                            const ang = (idx / tot) * 2 * Math.PI - Math.PI/2;
                                                            return { x: 500 + rad * Math.cos(ang), y: 400 + rad * Math.sin(ang) };
                                                        };
                                                        
                                                        const sPos = getPos(sIdx, entities.length);
                                                        const tPos = getPos(tIdx, entities.length);
                                                        
                                                        return (
                                                            <g key={i}>
                                                                <line x1={sPos.x} y1={sPos.y} x2={tPos.x} y2={tPos.y} stroke="#22d3ee" strokeWidth="1" strokeDasharray="4 4" markerEnd="url(#arrow)" opacity="0.4" filter="url(#glow)" />
                                                                <text x={(sPos.x + tPos.x)/2} y={(sPos.y + tPos.y)/2 - 12} textAnchor="middle" className="fill-accent-cyan text-[9px] font-black uppercase tracking-[0.3em] italic">{rel.type}</text>
                                                            </g>
                                                        );
                                                    })}

                                                    {(Array.isArray(model?.entities) ? model.entities : []).map((entity, i) => {
                                                        const entities = Array.isArray(model?.entities) ? model.entities : [];
                                                        const getPos = (idx: number, tot: number) => {
                                                            const rad = 280;
                                                            const ang = (idx / tot) * 2 * Math.PI - Math.PI/2;
                                                            return { x: 500 + rad * Math.cos(ang), y: 400 + rad * Math.sin(ang) };
                                                        };
                                                        const pos = getPos(i, entities.length);
                                                        
                                                        return (
                                                            <g key={entity.id} transform={`translate(${pos.x - 80}, ${pos.y - 60})`}>
                                                                <rect width="160" height="120" rx="20" className="fill-black/90 stroke-accent-cyan/20 stroke-1" filter="url(#glow)" />
                                                                <rect width="160" height="32" rx="16" className="fill-accent-cyan/10" />
                                                                <text x="80" y="21" textAnchor="middle" className="fill-white font-black text-[11px] uppercase tracking-tighter italic">{entity.name}</text>
                                                                
                                                                <line x1="20" y1="32" x2="140" y2="32" stroke="rgba(255,255,255,0.05)" />
                                                                
                                                                {(Array.isArray(entity?.attributes) ? entity.attributes : []).slice(0, 4).map((attr, idx) => (
                                                                    <text key={idx} x="20" y={52 + (idx * 15)} className="fill-gray-400 text-[10px] font-medium uppercase tracking-wide">
                                                                        <tspan className="fill-accent-cyan text-[8px] font-black">{attr.isKey ? 'ID ' : '   '}</tspan>
                                                                        {attr.name} <tspan className="opacity-30 text-[8px]">: {attr.type}</tspan>
                                                                    </text>
                                                                ))}
                                                                {(Array.isArray(entity?.attributes) ? entity.attributes : []).length > 4 && <text x="80" y="110" textAnchor="middle" className="fill-gray-700 text-[10px] font-black">---</text>}
                                                            </g>
                                                        );
                                                    })}
                                                </svg>
                                            </TransformComponent>
                                        </>
                                    )}
                                </TransformWrapper>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export const RequirementsModeler: React.FC<{ initiative: TInitiative }> = ({ initiative }) => {
  const { t, i18n } = useTranslation(['common', 'dashboard']);
  const [activeTool, setActiveTool] = useState<Tool>('criteria');

  const toolConfig = {
    criteria: { icon: <Plus className="h-4 w-4" />, label: 'Criteria', comp: <AcceptanceCriteriaGenerator initiative={initiative} language={i18n.language} /> },
    wireframe: { icon: <Layers className="h-4 w-4" />, label: 'Blueprint', comp: <WireframeGenerator initiative={initiative} language={i18n.language} /> },
    bpmn: { icon: <Layers className="h-4 w-4" />, label: 'Process', comp: <ProcessModelerTool initiative={initiative} /> },
    validator: { icon: <ShieldCheck className="h-4 w-4" />, label: 'Audit', comp: <ValidationTool sector={initiative.sector} language={i18n.language} /> },
    data: { icon: <Database className="h-4 w-4" />, label: 'Data', comp: <DataArchitectTool initiative={initiative} language={i18n.language} /> }
  };

  return (
    <div className="h-full flex flex-col space-y-8 animate-fade-in p-2">
        <div className="flex flex-col xl:flex-row justify-between xl:items-end gap-6 pb-6 border-b border-white/5">
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-accent-cyan/20 rounded-xl">
                        <Layers className="h-6 w-6 text-accent-cyan" />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Requirements Modeler</h2>
                </div>
                <p className="text-sm text-gray-500 font-medium uppercase tracking-[0.2em]">Technical Synthesis & Structural Orchestration</p>
            </div>
            
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 gap-1 shadow-inner backdrop-blur-xl flex-wrap">
                {(Object.keys(toolConfig) as Tool[]).map((key) => (
                    <button 
                        key={key}
                        onClick={() => setActiveTool(key)} 
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            activeTool === key 
                                ? 'bg-accent-cyan text-black shadow-lg' 
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            {React.cloneElement(toolConfig[key].icon as React.ReactElement, { className: 'h-3.5 w-3.5' })}
                            {toolConfig[key].label}
                        </div>
                    </button>
                ))}
            </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
            {toolConfig[activeTool].comp}
        </div>
    </div>
  );
};
