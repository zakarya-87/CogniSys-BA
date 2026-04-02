
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TElicitationAnalysis, TActionItem, BacklogItemType, TInitiative, Sector } from '../../types';
import { analyzeTranscript } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createBlob, decode, decodeAudioData } from '../../utils/liveAudioUtils';

const MOCK_TRANSCRIPT = `[00:01:05] Sarah: Okay team, let's sync on the mobile app revamp. What's the status?
[00:01:15] Alex: We've completed the initial user research. The main feedback is that the login process is too clunky. Users want biometric login, like Face ID or fingerprint.
[00:01:30] Brenda: I agree. That should be a priority requirement. It will significantly improve the UX.
[00:01:45] Sarah: Decision made. Biometric login is in for V1. Alex, can you create the user stories for that?
[00:01:55] Alex: Will do. That's an action item for me.
[00:02:10] Brenda: We also need to consider the payment gateway integration. Our current provider's contract is up for renewal. Should we stick with them or explore alternatives? The acronym for the provider is PGI.
[00:02:30] Sarah: Good point. Brenda, please research two alternative payment providers and present your findings by next Friday. That's an action item for you. For now, the requirement is to 'support seamless in-app payments'.
[00:02:45] Alex: Got it. I'll keep the requirements generic for now.`;

interface ElicitationHubProps {
    setToastMessage: (message: string) => void;
    onAddToBacklog: (title: string, type: BacklogItemType) => void;
    initiative: TInitiative;
}

type EditableItem = {
    type: keyof Omit<TElicitationAnalysis, 'actionItems' | 'keyTerms'>;
    index: number;
    content: string;
} | {
    type: 'actionItems';
    index: number;
    content: TActionItem;
} | {
    type: 'keyTerms';
    index: number;
    content: string;
}

export const ElicitationHub: React.FC<ElicitationHubProps> = ({ setToastMessage, onAddToBacklog, initiative }) => {
  const { t, i18n } = useTranslation(['common', 'dashboard']);
  const currentLanguage = i18n.language;
  const [activeMode, setActiveMode] = useState<'upload' | 'live'>('upload');
  
  // Transcript State
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<TElicitationAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [editingItem, setEditingItem] = useState<EditableItem | null>(null);
  const [newKeyTerm, setNewKeyTerm] = useState('');

  // Live API State
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<{speaker: 'You' | 'AI', text: string}[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Refs for Live API
  const nextStartTime = useRef(0);
  const inputAudioContext = useRef<AudioContext | null>(null);
  const outputAudioContext = useRef<AudioContext | null>(null);
  const outputNode = useRef<GainNode | null>(null);
  const sources = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionPromise = useRef<Promise<any> | null>(null);
  const currentInputTrans = useRef('');
  const currentOutputTrans = useRef('');

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
        disconnectLiveSession();
    };
  }, []);

  const disconnectLiveSession = () => {
      if (sessionPromise.current) {
          sessionPromise.current.then(session => session.close()).catch(() => {});
          sessionPromise.current = null;
      }
      if (inputAudioContext.current) {
          inputAudioContext.current.close();
          inputAudioContext.current = null;
      }
      if (outputAudioContext.current) {
          outputAudioContext.current.close();
          outputAudioContext.current = null;
      }
      setIsLiveConnected(false);
      setAudioLevel(0);
  };

  const startLiveSession = async () => {
      try {
          setIsLiveConnected(true);
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
          
          nextStartTime.current = 0;
          inputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          outputAudioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          outputNode.current = outputAudioContext.current.createGain();
          outputNode.current.connect(outputAudioContext.current.destination);

          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          
          sessionPromise.current = ai.live.connect({
              model: 'gemini-2.5-flash-native-audio-preview-09-2025',
              config: {
                  responseModalities: [Modality.AUDIO],
                  speechConfig: {
                      voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
                  },
                  systemInstruction: `You are a helpful, professional Business Analyst Co-pilot. Context: You are assisting with an initiative titled "${initiative.title}" in the ${initiative.sector} sector. Language: ${currentLanguage === 'ar' ? 'Arabic' : 'English'}. Listen to the user's meeting or thoughts. If asked, summarize what was said, capture requirements relevant to ${initiative.sector}, or ask a clarifying question. Otherwise, just acknowledge briefly. Keep responses concise.`,
                  inputAudioTranscription: {},
                  outputAudioTranscription: {}
              },
              callbacks: {
                  onopen: () => {
                      console.log("Live Session Connected");
                      const source = inputAudioContext.current!.createMediaStreamSource(stream);
                      const scriptProcessor = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);
                      
                      scriptProcessor.onaudioprocess = (e) => {
                          const inputData = e.inputBuffer.getChannelData(0);
                          // Simple volume meter
                          let sum = 0;
                          for(let i = 0; i < inputData.length; i++) sum += inputData[i] * inputData[i];
                          setAudioLevel(Math.sqrt(sum / inputData.length));

                          const pcmBlob = createBlob(inputData);
                          sessionPromise.current?.then(session => {
                              session.sendRealtimeInput({ media: pcmBlob });
                          });
                      };
                      source.connect(scriptProcessor);
                      scriptProcessor.connect(inputAudioContext.current!.destination);
                  },
                  onmessage: async (msg: LiveServerMessage) => {
                      // Handle Audio Output
                      const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                      if (base64Audio) {
                          const ctx = outputAudioContext.current!;
                          nextStartTime.current = Math.max(nextStartTime.current, ctx.currentTime);
                          const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                          const source = ctx.createBufferSource();
                          source.buffer = audioBuffer;
                          source.connect(outputNode.current!);
                          source.addEventListener('ended', () => sources.current.delete(source));
                          source.start(nextStartTime.current);
                          nextStartTime.current += audioBuffer.duration;
                          sources.current.add(source);
                      }

                      // Handle Transcription
                      if (msg.serverContent?.inputTranscription) {
                          currentInputTrans.current += msg.serverContent.inputTranscription.text;
                      }
                      if (msg.serverContent?.outputTranscription) {
                          currentOutputTrans.current += msg.serverContent.outputTranscription.text;
                      }

                      if (msg.serverContent?.turnComplete) {
                          if (currentInputTrans.current.trim()) {
                              setLiveTranscript(prev => [...prev, { speaker: 'You', text: currentInputTrans.current }]);
                              currentInputTrans.current = '';
                          }
                          if (currentOutputTrans.current.trim()) {
                              setLiveTranscript(prev => [...prev, { speaker: 'AI', text: currentOutputTrans.current }]);
                              currentOutputTrans.current = '';
                          }
                      }
                  },
                  onclose: () => {
                      console.log("Live Session Closed");
                      setIsLiveConnected(false);
                  },
                  onerror: (e) => {
                      console.error("Live Session Error", e);
                      setIsLiveConnected(false);
                      setError("Live session disconnected unexpectedly.");
                  }
              }
          });

      } catch (e) {
          console.error("Failed to start live session", e);
          setError("Failed to access microphone or connect to AI.");
          setIsLiveConnected(false);
      }
  };

  // Existing Transcript Analysis Logic
  const handleAnalyze = useCallback(async () => {
    if (!transcript) return;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setEditingItem(null);
    try {
      const result = await analyzeTranscript(transcript, initiative.sector as Sector, currentLanguage);
      setAnalysis(result);
    } catch (err) {
      setError(t('dashboard:elicitation.error_analyze'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [transcript, initiative.sector, currentLanguage, t]);

  const handleUpload = () => {
    setTranscript(MOCK_TRANSCRIPT);
    setIsUploaded(true);
    setToastMessage("Mock transcript uploaded successfully.");
  };
  
  const handleEdit = (type: EditableItem['type'], index: number) => {
    if (!analysis) return;
    const content = analysis[type][index];
    setEditingItem({ type, index, content } as EditableItem);
  };

  const handleSave = () => {
    if (!editingItem || !analysis) return;

    setAnalysis(prev => {
      if (!prev) return null;
      const newAnalysis = { ...prev };
      const items = [...newAnalysis[editingItem.type]];
      items[editingItem.index] = editingItem.content as any;
      (newAnalysis[editingItem.type] as any) = items;
      return newAnalysis;
    });

    setEditingItem(null);
  };

  const handleCancel = () => {
    setEditingItem(null);
  };
  
  const handleContentChange = (value: string) => {
      if (editingItem && (editingItem.type === 'requirements' || editingItem.type === 'decisions' || editingItem.type === 'keyTerms')) {
          setEditingItem({ ...editingItem, content: value });
      }
  };

  const handleActionItemChange = (field: keyof TActionItem, value: string) => {
      if(editingItem && editingItem.type === 'actionItems') {
          setEditingItem({
              ...editingItem,
              content: { ...editingItem.content, [field]: value }
          });
      }
  };

  const handleAddKeyTerm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysis || !newKeyTerm.trim()) return;
    setAnalysis(prev => {
        if (!prev) return null;
        return {
            ...prev,
            keyTerms: [...(prev.keyTerms || []), newKeyTerm.trim()]
        };
    });
    setNewKeyTerm('');
  };

  const handleDeleteKeyTerm = (indexToDelete: number) => {
    if (!analysis) return;
    setAnalysis(prev => {
        if (!prev) return null;
        return {
            ...prev,
            keyTerms: (prev.keyTerms || []).filter((_, index) => index !== indexToDelete)
        };
    });
  };

  const renderAnalysisCard = (title: string, type: 'requirements' | 'decisions', icon: React.ReactNode) => {
    const items = analysis ? (analysis[type] || []) : [];
    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 flex items-center">{icon} {t(`dashboard:elicitation.${type}`)}</h3>
        <ul className="space-y-3">
          {items.map((item, index) => (
            <li key={index} className="group text-gray-700 dark:text-gray-300">
              {editingItem && editingItem.type === type && editingItem.index === index ? (
                <div className="space-y-2">
                  <textarea
                    value={editingItem.content as string}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm"
                    rows={3}
                  />
                  <div className="flex items-center space-x-2">
                    <button onClick={handleSave} className="text-accent-emerald hover:text-accent-emerald/80"><CheckIcon className="h-5 w-5" /></button>
                    <button onClick={handleCancel} className="text-accent-red hover:text-accent-red/80"><XMarkIcon className="h-5 w-5" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <span>- {item}</span>
                  <div className="flex items-center ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(type, index)} className="text-accent-purple hover:text-accent-purple/80">
                        <PencilIcon className="h-4 w-4" />
                    </button>
                    {type === 'requirements' && (
                        <button onClick={() => onAddToBacklog(item, 'Requirement')} className="ml-2 text-accent-purple hover:text-accent-purple/80">
                            <WandSparklesIcon className="h-4 w-4" />
                        </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };
  
  const renderActionItemsCard = () => {
    const items = analysis ? (analysis.actionItems || []) : [];
    return (
       <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 flex items-center"><ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" /> {t('dashboard:elicitation.action_items')}</h3>
        <ul className="space-y-3">
            {items.map((item, index) => (
                <li key={index} className="group border-b border-gray-200 dark:border-gray-600 pb-2 last:border-b-0 last:pb-0">
                  {editingItem && editingItem.type === 'actionItems' && editingItem.index === index ? (
                     <div className="space-y-2 text-sm">
                        <textarea
                            value={editingItem.content.task}
                            onChange={(e) => handleActionItemChange('task', e.target.value)}
                            className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
                            rows={2}
                        />
                        <input
                            type="text"
                            value={editingItem.content.assignee}
                            onChange={(e) => handleActionItemChange('assignee', e.target.value)}
                             className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
                        />
                         <input
                            type="text"
                            value={editingItem.content.dueDate}
                            onChange={(e) => handleActionItemChange('dueDate', e.target.value)}
                             className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700"
                        />
                        <div className="flex items-center space-x-2">
                           <button onClick={handleSave} className="text-accent-emerald hover:text-accent-emerald/80"><CheckIcon className="h-5 w-5" /></button>
                           <button onClick={handleCancel} className="text-accent-red hover:text-accent-red/80"><XMarkIcon className="h-5 w-5" /></button>
                        </div>
                     </div>
                  ) : (
                    <>
                        <div className="flex justify-between items-start">
                            <p className="text-gray-800 dark:text-gray-200">{item.task}</p>
                            <div className="flex items-center ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit('actionItems', index)} className="text-accent-purple hover:text-accent-purple/80">
                                    <PencilIcon className="h-4 w-4" />
                                </button>
                                <button onClick={() => onAddToBacklog(item.task, 'Task')} className="ml-2 text-accent-purple hover:text-accent-purple/80 flex-shrink-0">
                                    <WandSparklesIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1.5 space-x-4">
                            <span className="flex items-center">
                                <UserCircleIcon className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
                                {item.assignee}
                            </span>
                            <span className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1 text-gray-400 dark:text-gray-500" />
                                {item.dueDate}
                            </span>
                        </div>
                    </>
                  )}
                </li>
            ))}
        </ul>
    </div>
    );
  }

  const renderKeyTermsCard = () => {
    const items = analysis ? (analysis.keyTerms || []) : [];
    return (
      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex flex-col">
        <h3 className="text-lg font-semibold mb-3 flex items-center"><BookOpenIcon className="h-5 w-5 mr-2" /> {t('dashboard:elicitation.key_terms')}</h3>
        <ul className="space-y-3 flex-grow">
          {items.map((item, index) => (
            <li key={index} className="group text-gray-700 dark:text-gray-300">
              {editingItem && editingItem.type === 'keyTerms' && editingItem.index === index ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editingItem.content as string}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm"
                  />
                  <div className="flex items-center space-x-2">
                    <button onClick={handleSave} className="text-accent-emerald hover:text-accent-emerald/80"><CheckIcon className="h-5 w-5" /></button>
                    <button onClick={handleCancel} className="text-accent-red hover:text-accent-red/80"><XMarkIcon className="h-5 w-5" /></button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-start">
                  <span>- {item}</span>
                  <div className="flex items-center ml-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit('keyTerms', index)} className="text-accent-purple hover:text-accent-purple/80">
                        <PencilIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => handleDeleteKeyTerm(index)} className="ml-2 text-accent-red hover:text-accent-red/80">
                        <TrashIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => setToastMessage(`Term '${item}' added to project glossary.`)} className="ml-2 text-accent-purple hover:text-accent-purple/80">
                        <WandSparklesIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={handleAddKeyTerm} className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex space-x-2">
             <input
                type="text"
                value={newKeyTerm}
                onChange={(e) => setNewKeyTerm(e.target.value)}
                placeholder={t('dashboard:elicitation.add_term_placeholder')}
                className="flex-grow w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-accent-purple"
             />
             <Button type="submit" disabled={!newKeyTerm.trim()}>{t('common:add')}</Button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('dashboard:elicitation.title')}</h2>
            <p className="text-gray-600 dark:text-gray-400">{t('dashboard:elicitation.description')}</p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 gap-1">
            <button onClick={() => setActiveMode('upload')} className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${activeMode === 'upload' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>{t('dashboard:elicitation.upload')}</button>
            <button onClick={() => setActiveMode('live')} className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${activeMode === 'live' ? 'bg-white dark:bg-gray-600 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>{t('dashboard:elicitation.live_copilot')}</button>
        </div>
      </div>
      
      {activeMode === 'upload' ? (
          <div className="animate-fade-in-down space-y-4">
            <div className="flex justify-end">
                <Button onClick={handleUpload}>
                    <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                    {t('dashboard:elicitation.upload_recording')}
                </Button>
            </div>
            <div>
                <label htmlFor="transcript" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('dashboard:elicitation.meeting_transcript')}</label>
                <textarea
                id="transcript"
                rows={8}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-accent-purple font-mono text-sm disabled:bg-gray-200 dark:disabled:bg-gray-700/50"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={t('dashboard:elicitation.transcript_placeholder')}
                disabled={!isUploaded}
                />
            </div>
            <Button onClick={handleAnalyze} disabled={isLoading || !transcript}>
                {isLoading ? <Spinner /> : t('dashboard:elicitation.analyze_transcript')}
            </Button>
          </div>
      ) : (
          <div className="animate-fade-in-down space-y-6">
              <div className="flex flex-col items-center justify-center py-8 bg-gray-900 text-white rounded-xl relative overflow-hidden transition-all duration-500" style={{ height: '400px' }}>
                  
                  {!isLiveConnected ? (
                      <div className="text-center space-y-4 z-10">
                          <div className="bg-gray-800 p-4 rounded-full inline-block">
                              <MicrophoneIcon className="h-12 w-12 text-gray-400" />
                          </div>
                          <h3 className="text-xl font-bold">{t('dashboard:elicitation.start_live')}</h3>
                          <p className="text-gray-400 max-w-md">{t('dashboard:elicitation.live_description')}</p>
                          <Button onClick={startLiveSession} className="bg-accent-emerald hover:bg-accent-emerald/80 text-white border-none">
                              {t('dashboard:elicitation.connect_copilot')}
                          </Button>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center w-full h-full p-4 z-10">
                          {/* Visualizer */}
                          <div className="flex items-center gap-2 mb-6">
                              <div className="w-3 h-3 rounded-full bg-accent-red animate-pulse"></div>
                              <span className="text-sm font-bold text-accent-red">LIVE RECORDING</span>
                          </div>
                          
                          <div className="w-32 h-32 rounded-full bg-accent-purple/20 flex items-center justify-center mb-6 relative">
                              <div className="absolute w-full h-full rounded-full bg-accent-purple/30 animate-ping" style={{ animationDuration: '2s' }}></div>
                              <div className="w-24 h-24 rounded-full bg-accent-purple flex items-center justify-center transition-all duration-75"
                                   style={{ transform: `scale(${1 + audioLevel * 2})` }}
                              >
                                  <MicrophoneIcon className="h-10 w-10 text-white" />
                              </div>
                          </div>

                          {/* Live Transcript Stream */}
                          <div className="flex-grow w-full max-w-2xl bg-black/20 rounded-lg p-4 overflow-y-auto custom-scrollbar space-y-2 mb-4 backdrop-blur-sm border border-white/10">
                              {liveTranscript.length === 0 && (
                                  <p className="text-gray-500 text-center italic mt-10">Waiting for speech...</p>
                              )}
                              {liveTranscript.map((line, i) => (
                                  <div key={i} className={`flex ${line.speaker === 'AI' ? 'justify-start' : 'justify-end'}`}>
                                      <div className={`max-w-[80%] p-2 rounded-lg text-sm ${line.speaker === 'AI' ? 'bg-accent-purple/20 text-accent-purple' : 'bg-gray-700/80 text-gray-200'}`}>
                                          <span className="font-bold text-xs block mb-1 opacity-70">{line.speaker}</span>
                                          {line.text}
                                      </div>
                                  </div>
                              ))}
                          </div>

                          <Button onClick={disconnectLiveSession} className="bg-accent-red hover:bg-accent-red/80 text-white border-none">
                              End Session
                          </Button>
                      </div>
                  )}
              </div>
          </div>
      )}

      {error && <p className="text-accent-red">{error}</p>}

      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 pt-4">
          {renderAnalysisCard('Requirements', 'requirements', <LightBulbIcon className="h-5 w-5 mr-2" />)}
          {renderAnalysisCard('Decisions', 'decisions', <CheckCircleIcon className="h-5 w-5 mr-2" />)}
          {renderActionItemsCard()}
          {renderKeyTermsCard()}
        </div>
      )}
    </div>
  );
};


// Icons
const ArrowUpTrayIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const LightBulbIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-11.62a6.01 6.01 0 00-3 0a6.01 6.01 0 001.5 11.62z" /></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const ClipboardDocumentCheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" /></svg>;
const UserCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CalendarIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0h18M12 13.5h.008v.008H12v-.008z" /></svg>;
const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>;
const WandSparklesIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.572L16.5 21.75l-.398-1.178a3.375 3.375 0 00-2.455-2.456L12.75 18l1.178-.398a3.375 3.375 0 002.455-2.456L16.5 14.25l.398 1.178a3.375 3.375 0 002.456 2.456L20.25 18l-1.178.398a3.375 3.375 0 00-2.456 2.456z" /></svg>;
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>;
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09.92-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const MicrophoneIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
