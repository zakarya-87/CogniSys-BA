
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generateAcceptanceCriteria, generateWireframe, validateRequirement, generateDataModel } from '../../services/geminiService';
import { TWireframeElement, TValidationResult, TInitiative, TDataModel, Sector } from '../../types';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { ProcessModelerTool } from './ProcessModelerTool';
import { useCatalyst } from '../../context/CatalystContext';

type Tool = 'criteria' | 'wireframe' | 'bpmn' | 'validator' | 'data';

// Recursive component to render the wireframe
const RenderWireframeElement: React.FC<{ element: TWireframeElement }> = ({ element }) => {
  const { t } = useTranslation(['common', 'dashboard']);
  const { type, props = {}, children = [] } = element;

  const baseClasses = "border-dashed border-2 border-gray-400 dark:border-gray-600";
  const elementClasses: { [key: string]: string } = {
    div: `${baseClasses} p-4 space-y-4 flex flex-col items-start w-full`,
    h1: `text-2xl font-bold p-2 text-gray-800 dark:text-gray-200`,
    p: `p-2 text-gray-600 dark:text-gray-400`,
    button: `bg-accent-cyan text-white font-bold py-2 px-4 rounded w-full text-center`,
    input: `border-2 border-gray-300 bg-white dark:bg-gray-700 p-2 rounded w-full`,
    img: `${baseClasses} w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500`,
  };

  const Component = type;
  const componentProps: any = {};

  switch (type) {
    case 'input':
      componentProps.placeholder = props.placeholder || t('dashboard:requirements.input_field');
      componentProps.className = elementClasses.input;
      return <input {...componentProps} readOnly />;
    case 'img':
        return <div className={elementClasses.img}>{t('dashboard:requirements.image_placeholder')}</div>;
    case 'button':
    case 'h1':
    case 'p':
      return <Component className={elementClasses[type]}>{props.text || type}</Component>;
    case 'div':
    default:
      return (
        <div className={elementClasses.div}>
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

    const handleGenerate = useCallback(async () => {
        if (!userStory) return;
        setError(null);
        setIsLoading(true);
        setError(null);
        setCriteria('');
        try {
            const result = await generateAcceptanceCriteria(userStory, initiative.sector, language);
            setCriteria(result);
        } catch (err) {
            setError(t('dashboard:requirements.error_criteria'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [userStory, language, t]);

    const formattedCriteria = (criteria && typeof criteria === 'string') 
        ? criteria.split('\n').filter(line => line.trim() !== '').map((line, index) => {
            if (line.toLowerCase().startsWith('given')) {
            return <div key={index} className="mt-3"><span className="font-semibold text-accent-cyan">GIVEN</span> {line.substring(5)}</div>;
            }
            if (line.toLowerCase().startsWith('when')) {
            return <div key={index}><span className="font-semibold text-accent-cyan">WHEN</span> {line.substring(4)}</div>;
            }
            if (line.toLowerCase().startsWith('then')) {
            return <div key={index}><span className="font-semibold text-accent-purple">THEN</span> {line.substring(4)}</div>;
            }
            return <div key={index}>{line}</div>;
        }) 
        : [];

    return (
        <div className="space-y-4">
             <div>
                <label htmlFor="userStory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">User Story</label>
                <textarea
                id="userStory"
                rows={3}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-cyan"
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder="As a [type of user], I want to [perform some task] so that I can [achieve some goal]."
                />
            </div>
            <Button onClick={handleGenerate} disabled={isLoading || !userStory}>
                {isLoading ? <Spinner /> : 'Generate Acceptance Criteria'}
            </Button>
            {error && <p className="text-accent-red text-sm">{error}</p>}
            {criteria && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg mt-4">
                <h3 className="text-lg font-semibold mb-2">Generated Acceptance Criteria</h3>
                <div className="text-gray-700 dark:text-gray-300 space-y-1 font-mono text-sm">
                    {formattedCriteria}
                </div>
                </div>
            )}
        </div>
    );
}

const WireframeGenerator: React.FC<{ initiative: TInitiative, language: string }> = ({ initiative, language }) => {
    const { t } = useTranslation(['common', 'dashboard']);
    const [requirements, setRequirements] = useState('A login screen with a title "Welcome Back!", an email input, a password input, and a "Log In" button. There should also be a paragraph of text below the button for a "Forgot Password?" link.');
    const [wireframe, setWireframe] = useState<TWireframeElement | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = useCallback(async () => {
        if (!requirements) return;
        setError(null);
        setIsLoading(true);
        setError(null);
        setWireframe(null);
        try {
            const result = await generateWireframe(requirements, initiative.sector, language);
            setWireframe(result);
        } catch (err) {
            setError(t('dashboard:requirements.error_wireframe'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [requirements, initiative.sector, language, t]);

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="wireframeReqs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Functional Requirements for Screen</label>
                <textarea
                id="wireframeReqs"
                rows={4}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-cyan"
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="List the components and layout for the screen..."
                />
            </div>
            <Button onClick={handleGenerate} disabled={isLoading || !requirements}>
                {isLoading ? <Spinner /> : 'Generate Wireframe'}
            </Button>
            {error && <p className="text-accent-red text-sm">{error}</p>}
            {wireframe && (
                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg mt-4 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-center">Generated Low-Fidelity Wireframe</h3>
                    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-4 rounded shadow-lg">
                        <RenderWireframeElement element={wireframe} />
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
        setError(null);
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

    const scoreColor = (score: number) => {
        if (score >= 80) return 'text-accent-emerald';
        if (score >= 50) return 'text-accent-amber';
        return 'text-accent-red';
    };

    return (
        <div className="space-y-4">
            <div className="bg-surface-dark dark:bg-surface-darker p-3 rounded-md border border-surface-dark dark:border-surface-darker/30 text-sm text-accent-cyan dark:text-accent-cyan">
                <strong>Context:</strong> Auditing against <strong>{sector}</strong> standards.
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Requirement / User Story Draft</label>
                <textarea
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste your draft here..."
                />
            </div>
            <Button onClick={handleValidate} disabled={isLoading || !text.trim()}>
                {isLoading ? <Spinner /> : 'Audit Quality'}
            </Button>
            {error && <p className="text-accent-red text-sm">{error}</p>}
            
            {result && (
                <div className="mt-6 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm">
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800 dark:text-white">Quality Report Card</h3>
                        <div className={`text-2xl font-bold ${scoreColor(result.score)}`}>{result.score}/100</div>
                    </div>
                    <div className="p-4 space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Critique</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                                {(Array.isArray(result.critique) ? result.critique : []).map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                        </div>
                        <div className="bg-surface-dark dark:bg-surface-darker p-3 rounded-md border border-surface-dark dark:border-surface-darker">
                            <h4 className="text-xs font-bold text-accent-purple dark:text-accent-purple uppercase tracking-wide mb-1">AI Rewritten Version</h4>
                            <p className="text-base font-medium text-gray-900 dark:text-white">{result.improvedVersion}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">{result.reasoning}</p>
                        </div>
                        <button 
                            onClick={() => setText(result.improvedVersion)}
                            className="text-sm text-accent-purple dark:text-accent-purple hover:underline font-medium"
                        >
                            Replace Draft with Improved Version
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const DataArchitectTool: React.FC<{ initiative: TInitiative, language: string }> = ({ initiative, language }) => {
    const { t } = useTranslation(['common', 'dashboard']);
    const { saveArtifact } = useCatalyst();
    const [description, setDescription] = useState('A patient management system where patients can book appointments with doctors and view their prescriptions.');
    const [model, setModel] = useState<TDataModel | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showSql, setShowSql] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load generated model on mount
    useEffect(() => {
        if (initiative.artifacts?.dataModel) {
            setModel(initiative.artifacts.dataModel);
        }
    }, [initiative.id, initiative.artifacts]);

    const handleGenerate = async () => {
        setError(null);
        setIsLoading(true);
        setModel(null);
        try {
            const result = await generateDataModel(description, initiative.sector, language);
            setModel(result);
            // Persist
            saveArtifact(initiative.id, 'dataModel', result);
        } catch(e) {
            console.error(e);
            setError(t('dashboard:requirements.error_data'));
        } finally {
            setIsLoading(false);
        }
    };

    const getEntityPos = (index: number, total: number) => {
        const radius = 150;
        const angle = (index / total) * 2 * Math.PI;
        return {
            x: 300 + radius * Math.cos(angle),
            y: 250 + radius * Math.sin(angle)
        };
    };

    return (
        <div className="space-y-4">
            <div className="bg-surface-dark dark:bg-surface-darker p-3 rounded-md text-sm text-accent-cyan dark:text-accent-cyan border border-surface-dark dark:border-surface-darker">
                <strong>Data Architect:</strong> Designing schema for <strong>{initiative.sector}</strong> context.
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">System Data Description</label>
                <textarea
                    rows={3}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-cyan"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the entities and relationships (e.g., users, orders, products)..."
                />
            </div>
            {error && (
                <div className="p-3 bg-accent-red/10 text-accent-red rounded-lg border border-accent-red/20 text-sm">
                    {error}
                </div>
            )}
            <Button onClick={handleGenerate} disabled={isLoading || !description.trim()}>
                {isLoading ? <Spinner /> : 'Generate Data Model'}
            </Button>

            {model && (
                <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Entity Relationship Diagram (ERD)</h3>
                        <button 
                            onClick={() => setShowSql(!showSql)}
                            className="text-xs font-bold text-accent-purple hover:underline"
                        >
                            {showSql ? 'Show Diagram' : 'Show SQL'}
                        </button>
                    </div>

                    {showSql ? (
                        <pre className="p-4 bg-gray-800 text-green-400 rounded-lg overflow-x-auto text-xs font-mono">
                            {model.sqlPreview}
                        </pre>
                    ) : (
                        <div className="overflow-x-auto custom-scrollbar">
                            <svg width="600" height="500" className="mx-auto">
                                <defs>
                                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
                                        <path d="M0,0 L0,6 L9,3 z" fill="#9ca3af" />
                                    </marker>
                                </defs>
                                {(Array.isArray(model?.relationships) ? model.relationships : []).map((rel, i) => {
                                    const entities = Array.isArray(model?.entities) ? model.entities : [];
                                    const sourceIdx = entities.findIndex(e => e.name === rel.source);
                                    const targetIdx = entities.findIndex(e => e.name === rel.target);
                                    if (sourceIdx === -1 || targetIdx === -1) return null;
                                    
                                    const sourcePos = getEntityPos(sourceIdx, entities.length);
                                    const targetPos = getEntityPos(targetIdx, entities.length);

                                    return (
                                        <g key={i}>
                                            <line 
                                                x1={sourcePos.x} y1={sourcePos.y} 
                                                x2={targetPos.x} y2={targetPos.y} 
                                                stroke="#9ca3af" strokeWidth="2" 
                                                markerEnd="url(#arrow)"
                                            />
                                            <text 
                                                x={(sourcePos.x + targetPos.x)/2} 
                                                y={(sourcePos.y + targetPos.y)/2 - 5} 
                                                textAnchor="middle" 
                                                className="stroke-white dark:stroke-gray-900 text-[10px]"
                                                strokeWidth="4"
                                                strokeLinejoin="round"
                                                fill="none"
                                            >
                                                {rel.type}
                                            </text>
                                            <text 
                                                x={(sourcePos.x + targetPos.x)/2} 
                                                y={(sourcePos.y + targetPos.y)/2 - 5} 
                                                textAnchor="middle" 
                                                className="fill-gray-500 text-[10px]"
                                            >
                                                {rel.type}
                                            </text>
                                        </g>
                                    );
                                })}
                                {(Array.isArray(model?.entities) ? model.entities : []).map((entity, i) => {
                                    const entities = Array.isArray(model?.entities) ? model.entities : [];
                                    const pos = getEntityPos(i, entities.length);
                                    return (
                                        <g key={entity.id} transform={`translate(${pos.x - 60}, ${pos.y - 40})`}>
                                            <rect width="120" height="80" rx="5" className="fill-white dark:fill-gray-800 stroke-accent-cyan stroke-2" />
                                            <text x="60" y="20" textAnchor="middle" fontWeight="bold" className="fill-gray-900 dark:fill-white text-xs">{entity.name}</text>
                                            <line x1="0" y1="25" x2="120" y2="25" stroke="#e5e7eb" />
                                            {(Array.isArray(entity?.attributes) ? entity.attributes : []).slice(0, 3).map((attr, idx) => (
                                                <text key={idx} x="10" y={40 + (idx * 12)} className="fill-gray-600 dark:fill-gray-300 text-[9px]">
                                                    {attr.isKey ? 'PK ' : ''}{attr.name}: {attr.type}
                                                </text>
                                            ))}
                                            {(Array.isArray(entity?.attributes) ? entity.attributes : []).length > 3 && <text x="10" y={75} className="fill-gray-400 text-[9px]">...</text>}
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const RequirementsModeler: React.FC<{ initiative: TInitiative }> = ({ initiative }) => {
  const { t, i18n } = useTranslation(['common', 'dashboard']);
  const [activeTool, setActiveTool] = useState<Tool>('criteria');

  const toolConfig = {
    criteria: {
        title: t('dashboard:requirements.criteria_title'),
        description: t('dashboard:requirements.criteria_desc'),
        component: <AcceptanceCriteriaGenerator initiative={initiative} language={i18n.language} />
    },
    wireframe: {
        title: t('dashboard:requirements.wireframe_title'),
        description: t('dashboard:requirements.wireframe_desc'),
        component: <WireframeGenerator initiative={initiative} language={i18n.language} />
    },
    bpmn: {
        title: t('dashboard:requirements.bpmn_title'),
        description: t('dashboard:requirements.bpmn_desc'),
        component: <ProcessModelerTool initiative={initiative} />
    },
    validator: {
        title: t('dashboard:requirements.validator_title'),
        description: t('dashboard:requirements.validator_desc', { sector: initiative.sector }),
        component: <ValidationTool sector={initiative.sector} language={i18n.language} />
    },
    data: {
        title: t('dashboard:requirements.data_title'),
        description: t('dashboard:requirements.data_desc'),
        component: <DataArchitectTool initiative={initiative} language={i18n.language} />
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-start">
            <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard:requirements.modeler_title')}</h2>
                <p className="text-gray-600 dark:text-gray-400">{toolConfig[activeTool].description}</p>
            </div>
            <div className="flex-shrink-0 mt-4 sm:mt-0 rounded-md p-1 bg-gray-200 dark:bg-gray-700 flex space-x-1 flex-wrap">
                <button 
                    onClick={() => setActiveTool('criteria')} 
                    className={`px-3 py-1 text-sm font-medium rounded ${activeTool === 'criteria' ? 'bg-white dark:bg-gray-900 shadow text-accent-purple' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                    {t('dashboard:requirements.tab_criteria')}
                </button>
                <button 
                    onClick={() => setActiveTool('wireframe')}
                    className={`px-3 py-1 text-sm font-medium rounded ${activeTool === 'wireframe' ? 'bg-white dark:bg-gray-900 shadow text-accent-purple' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                    {t('dashboard:requirements.tab_wireframe')}
                </button>
                 <button 
                    onClick={() => setActiveTool('bpmn')}
                    className={`px-3 py-1 text-sm font-medium rounded ${activeTool === 'bpmn' ? 'bg-white dark:bg-gray-900 shadow text-accent-purple' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                    {t('dashboard:requirements.tab_bpmn')}
                </button>
                <button 
                    onClick={() => setActiveTool('data')}
                    className={`px-3 py-1 text-sm font-medium rounded ${activeTool === 'data' ? 'bg-white dark:bg-gray-900 shadow text-accent-purple' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                    {t('dashboard:requirements.tab_data')}
                </button>
            </div>
        </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        {toolConfig[activeTool].component}
      </div>
    </div>
  );
};
