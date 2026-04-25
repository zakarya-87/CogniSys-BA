
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    Mic, 
    Upload, 
    Activity, 
    Sparkles, 
    Save, 
    CheckCircle2, 
    AlertCircle, 
    ArrowRight, 
    Plus, 
    Trash2, 
    Edit3, 
    ChevronRight,
    Search,
    BrainCircuit,
    ListChecks,
    Target,
    Zap,
    FileText
} from 'lucide-react';
import { TElicitationAnalysis, TActionItem, BacklogItemType, TInitiative, Sector } from '../../types';
import { analyzeTranscript } from '../../services/geminiService';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createBlob, decode, decodeAudioData } from '../../utils/liveAudioUtils';
import { useUI } from '../../context/UIContext';
import { useCatalyst } from '../../context/CatalystContext';

const MOCK_TRANSCRIPT = `[00:01:05] Sarah: Okay team, let's sync on the mobile app revamp. What's the status?
[00:01:15] Alex: We've completed the initial user research. The main feedback is that the login process is too clunky. Users want biometric login, like Face ID or fingerprint.
[00:01:30] Brenda: I agree. That should be a priority requirement. It will significantly improve the UX.
[00:01:45] Sarah: Decision made. Biometric login is in for V1. Alex, can you create the user stories for that?
[00:01:55] Alex: Will do. That's an action item for me.
[00:02:10] Brenda: We also need to consider the payment gateway integration. Our current provider's contract is up for renewal. Should we stick with them or explore alternatives? The acronym for the provider is PGI.
[00:02:30] Sarah: Good point. Brenda, please research two alternative payment providers and present your findings by next Friday. That's an action item for you. For now, the requirement is to 'support seamless in-app payments'.
[00:02:45] Alex: Got it. I'll keep the requirements generic for now.`;

interface ElicitationHubProps {
    setToastMessage: (message: any) => void;
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
  const { isFocusModeActive } = useUI();
  const currentLanguage = i18n.language;
  const { saveArtifact } = useCatalyst();

  const [activeMode, setActiveMode] = useState<'upload' | 'live'>('upload');
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState<TElicitationAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
          const ai = new GoogleGenAI({ apiKey: process.env.VITE_GEMINI_API_KEY || '' });
          
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
                  systemInstruction: `You are a helpful, professional Business Analyst Co-pilot. Context: You are assisting with an initiative titled "${initiative.title}" in the ${initiative.sector} sector. Language: ${currentLanguage === 'ar' ? 'Arabic' : 'English'}. Listen to the user's meeting or thoughts. Summarize key requirements and cross-reference them with the ${initiative.sector} sector standards.`,
                  inputAudioTranscription: {},
                  outputAudioTranscription: {}
              },
              callbacks: {
                  onopen: () => {
                      const source = inputAudioContext.current!.createMediaStreamSource(stream);
                      const scriptProcessor = inputAudioContext.current!.createScriptProcessor(4096, 1, 1);
                      scriptProcessor.onaudioprocess = (e) => {
                          const inputData = e.inputBuffer.getChannelData(0);
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
                      const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                      if (base64Audio) {
                          const ctx = outputAudioContext.current!;
                          nextStartTime.current = Math.max(nextStartTime.current, ctx.currentTime);
                          const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
                          const source = ctx.createBufferSource();
                          source.buffer = audioBuffer;
                          source.connect(outputNode.current!);
                          source.start(nextStartTime.current);
                          nextStartTime.current += audioBuffer.duration;
                      }
                      if (msg.serverContent?.inputTranscription) currentInputTrans.current += msg.serverContent.inputTranscription.text;
                      if (msg.serverContent?.outputTranscription) currentOutputTrans.current += msg.serverContent.outputTranscription.text;
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
                  onclose: () => setIsLiveConnected(false),
                  onerror: () => {
                      setIsLiveConnected(false);
                      setError("Live session disconnected unexpectedly.");
                  }
              }
          });
      } catch (e) {
          setError("Failed to access microphone or connect to AI.");
          setIsLiveConnected(false);
      }
  };

  const handleAnalyze = useCallback(async () => {
    if (!transcript) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeTranscript(transcript, initiative.sector as Sector, currentLanguage);
      setAnalysis(result);
      // Automatically persist to cloud
      await saveArtifact(initiative.id, 'elicitation_report', result);
      setToastMessage({ title: "Analysis Finalized", description: "Requirement artifacts updated.", type: 'success' });
    } catch (err) {
      setError(t('dashboard:elicitation.error_analyze'));
    } finally {
      setIsLoading(false);
    }
  }, [transcript, initiative.id, initiative.sector, currentLanguage, t, saveArtifact, setToastMessage]);

  const handleUpload = () => {
    setTranscript(MOCK_TRANSCRIPT);
    setIsUploaded(true);
    setToastMessage({ title: "Mock Data Injected", description: "Meeting transcript ready for synthesis.", type: 'info' });
  };
  
  const handleEdit = (type: EditableItem['type'], index: number) => {
    if (!analysis) return;
    const content = analysis[type][index];
    setEditingItem({ type, index, content } as EditableItem);
  };

  const handleSaveItem = () => {
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

  const SwotQuadrant: React.FC<{ 
    title: string; 
    items: string[]; 
    accentColor: string; 
    icon: React.ReactNode;
    type: 'requirements' | 'decisions';
  }> = ({ title, items, accentColor, icon, type }) => (
    <div className={`glass-card p-6 border-l-4 ${accentColor} transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl slide-up`}>
        <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10 shadow-inner">
                    {React.cloneElement(icon as React.ReactElement, { className: 'h-5 w-5' })}
                </div>
                <h3 className="text-sm font-black tracking-[0.2em] uppercase">{title}</h3>
            </div>
        </div>

        <ul className="space-y-4">
            {(items || []).map((item, index) => (
                <li key={index} className="group/item flex gap-3 text-gray-300">
                    <ChevronRight className="h-3 w-3 mt-1.5 text-gray-500 shrink-0" />
                    <div className="flex flex-col gap-2 w-full">
                        {editingItem && editingItem.type === type && editingItem.index === index ? (
                            <div className="space-y-3">
                                <textarea
                                    value={editingItem.content as string}
                                    onChange={(e) => setEditingItem({ ...editingItem, content: e.target.value } as EditableItem)}
                                    className="w-full p-3 bg-black/20 border-none rounded-xl text-xs font-medium focus:ring-1 focus:ring-accent-cyan outline-none"
                                    rows={2}
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleSaveItem} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-emerald-500/30">Save</button>
                                    <button onClick={() => setEditingItem(null)} className="px-3 py-1 bg-white/5 text-gray-400 text-[10px] font-bold rounded-full uppercase tracking-widest">Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between items-start group/controls">
                                <span className="text-[13px] leading-relaxed">{item}</span>
                                <div className="flex items-center gap-2 opacity-0 group-hover/controls:opacity-100 transition-opacity translate-x-2 group-hover/controls:translate-x-0">
                                    <button onClick={() => handleEdit(type, index)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                                        <Edit3 className="h-3 w-3" />
                                    </button>
                                    {type === 'requirements' && (
                                        <button onClick={() => onAddToBacklog(item, 'Requirement')} className="p-1.5 hover:bg-accent-cyan/20 rounded-lg text-accent-cyan transition-colors" title="Send to Backlog">
                                            <Zap className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </li>
            ))}
        </ul>
    </div>
  );
  
  return (
    <div className={`space-y-8 fade-in ${isFocusModeActive ? 'p-0' : ''}`}>
      {!isFocusModeActive && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                    <BrainCircuit className="h-8 w-8 text-accent-cyan" />
                    ELICITATION HUB
                </h2>
                <p className="text-sm text-gray-400 font-medium">Extracting tactical requirements from conversation dynamics.</p>
            </div>
            
            <div className="flex bg-black/30 p-1.5 rounded-2xl border border-white/5 gap-1 shadow-inner backdrop-blur-xl">
                <button 
                    onClick={() => setActiveMode('upload')} 
                    className={`flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeMode === 'upload' ? 'bg-white shadow-lg text-black' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Upload className="h-3.5 w-3.5" />
                    Transcript Sync
                </button>
                <button 
                    onClick={() => setActiveMode('live')} 
                    className={`flex items-center gap-2 px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${activeMode === 'live' ? 'bg-accent-cyan shadow-lg text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <Activity className="h-3.5 w-3.5" />
                    Live Co-Pilot
                </button>
            </div>
          </div>
      )}
      
      {activeMode === 'upload' ? (
          <div className="glass-card p-8 border border-white/5 relative overflow-hidden slide-up">
            <div className="absolute top-0 right-0 p-8 opacity-5">
                <FileText className="h-24 w-24" />
            </div>

            <div className="flex justify-between items-end mb-6">
                <div className="space-y-1">
                    <label htmlFor="transcript" className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Meeting Transcript</label>
                    <p className="text-[11px] text-gray-500 font-medium">Auto-summarization engine active</p>
                </div>
                <button 
                    onClick={handleUpload}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent-cyan hover:underline transition-all"
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    Inject Mock Data
                </button>
            </div>

            <div className="relative group">
                <textarea
                    id="transcript"
                    rows={8}
                    className="w-full p-6 border-none rounded-3xl bg-black/20 text-sm font-medium focus:ring-2 focus:ring-accent-cyan/30 focus:bg-black/30 transition-all placeholder:text-gray-600 outline-none custom-scrollbar mb-8 leading-relaxed font-mono"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder="Paste meeting transcript or upload recording for AI synthesis..."
                    disabled={!isUploaded && transcript === ''}
                />
            </div>

            <Button 
                onClick={handleAnalyze} 
                disabled={isLoading || !transcript}
                className="bg-accent-cyan hover:bg-accent-cyan/90 text-white px-8 py-3 h-auto rounded-2xl font-black text-xs tracking-widest uppercase transition-all duration-500 shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)]"
            >
                {isLoading ? <Spinner className="h-4 w-4" /> : <ListChecks className="h-4 w-4 mr-2" />}
                {t('dashboard:elicitation.analyze_transcript')}
            </Button>
          </div>
      ) : (
          <div className="glass-card p-1 items-center justify-center bg-black/40 relative overflow-hidden rounded-[2.5rem] slide-up border border-white/5" style={{ minHeight: '500px' }}>
              <div className="absolute inset-0 bg-gradient-to-b from-accent-cyan/5 to-transparent pointer-events-none" />
              
              {!isLiveConnected ? (
                  <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-8 relative z-10 px-6">
                      <div className="w-24 h-24 rounded-[30%] bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-accent-cyan transition-colors">
                          <Mic className="h-10 w-10 text-gray-500" />
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-2xl font-black tracking-tighter uppercase">{t('dashboard:elicitation.start_live')}</h3>
                        <p className="text-gray-500 max-w-sm text-sm font-medium leading-relaxed">{t('dashboard:elicitation.live_description')}</p>
                      </div>
                      <Button onClick={startLiveSession} className="bg-accent-cyan text-white border-none px-10 py-4 h-auto rounded-2xl font-black text-xs tracking-widest uppercase shadow-2xl hover:scale-105 transition-all outline-none">
                          {t('dashboard:elicitation.connect_copilot')}
                      </Button>
                  </div>
              ) : (
                  <div className="flex flex-col items-center w-full h-[600px] p-8 z-10">
                      {/* Visualizer Area */}
                      <div className="flex items-center gap-3 mb-10 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                          <span className="text-[9px] font-black text-red-500 tracking-[0.2em] uppercase">Tactical Capture Active</span>
                      </div>
                      
                      <div className="w-40 h-40 rounded-full bg-accent-cyan/10 flex items-center justify-center mb-10 relative">
                          <div className="absolute inset-0 rounded-full border border-accent-cyan/20 scale-150 opacity-20 animate-ping" />
                          <div className="absolute inset-0 rounded-full border border-accent-cyan/10 scale-125 opacity-40 animate-pulse" />
                          <div 
                            className="w-32 h-32 rounded-full bg-accent-cyan/20 flex items-center justify-center transition-all duration-75 shadow-[inset_0_0_20px_rgba(255,255,255,0.1)]"
                            style={{ transform: `scale(${1 + audioLevel * 1.5})` }}
                          >
                              <div className="p-5 rounded-full bg-accent-cyan text-white shadow-xl">
                                <Activity className="h-10 w-10" />
                              </div>
                          </div>
                      </div>

                      {/* Live Stream */}
                      <div className="flex-grow w-full max-w-3xl bg-black/40 rounded-[2rem] p-8 overflow-y-auto custom-scrollbar space-y-6 mb-8 border border-white/5 backdrop-blur-3xl shadow-inner relative">
                          {liveTranscript.length === 0 && (
                              <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                                <Search className="h-12 w-12" />
                                <p className="text-sm font-black uppercase tracking-[0.3em]">Calibrating Signal...</p>
                              </div>
                          )}
                          {liveTranscript.map((line, i) => (
                              <div key={i} className={`flex ${line.speaker === 'AI' ? 'justify-start' : 'justify-end'} slide-up`}>
                                  <div className={`max-w-[85%] p-5 rounded-[1.5rem] shadow-lg ${line.speaker === 'AI' ? 'bg-white/10 text-white rounded-tl-none border border-white/5' : 'bg-accent-cyan text-white rounded-tr-none shadow-[0_10px_30px_rgba(34,211,238,0.2)]'}`}>
                                      <span className="text-[9px] font-black uppercase tracking-widest block mb-2 opacity-60 flex items-center gap-2">
                                        {line.speaker === 'AI' ? <Sparkles className="h-3 w-3" /> : <Target className="h-3 w-3" />}
                                        {line.speaker}
                                      </span>
                                      <p className="text-sm font-medium leading-relaxed">{line.text}</p>
                                  </div>
                              </div>
                          ))}
                      </div>

                      <Button onClick={disconnectLiveSession} className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 px-8 py-2.5 h-auto rounded-xl font-black text-[10px] tracking-widest uppercase transition-all duration-500">
                          End Discovery Session
                      </Button>
                  </div>
              )}
          </div>
      )}

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm font-bold slide-up">
            <AlertCircle className="h-4 w-4" />
            {error}
        </div>
      )}

      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 animate-fade-in">
           <SwotQuadrant 
                title={t('dashboard:elicitation.requirements')} 
                type="requirements" 
                accentColor="border-l-accent-cyan"
                items={analysis.requirements}
                icon={<BrainCircuit />}
            />
            <SwotQuadrant 
                title={t('dashboard:elicitation.decisions')} 
                type="decisions" 
                accentColor="border-l-indigo-500"
                items={analysis.decisions}
                icon={<CheckCircle2 />}
            />
            
            {/* Action Items Card */}
            <div className="glass-card p-6 border-l-4 border-l-amber-500 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl slide-up">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-xl bg-white/10 shadow-inner">
                        <ListChecks className="h-5 w-5 text-amber-500" />
                    </div>
                    <h3 className="text-sm font-black tracking-[0.2em] uppercase">{t('dashboard:elicitation.action_items')}</h3>
                </div>
                <ul className="space-y-4">
                    {(analysis.actionItems || []).map((item, index) => (
                        <li key={index} className="flex flex-col gap-2 p-3 bg-white/5 rounded-2xl border border-white/5 group/ai">
                            <p className="text-[13px] font-bold text-white/90 leading-tight">{item.task}</p>
                            <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-3 opacity-60">
                                    <div className="flex items-center gap-1">
                                        <Plus className="h-2.5 w-2.5" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">{item.assignee}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <ArrowRight className="h-2.5 w-2.5" />
                                        <span className="text-[9px] font-black uppercase tracking-tighter">{item.dueDate}</span>
                                    </div>
                                </div>
                                <button onClick={() => onAddToBacklog(item.task, 'Task')} className="p-1.5 opacity-0 group-hover/ai:opacity-100 transition-opacity text-amber-500 hover:bg-amber-500/10 rounded-lg">
                                    <Zap className="h-3 w-3" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            
            {/* Key Terms Card */}
            <div className="glass-card p-6 border-l-4 border-l-rose-500 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl slide-up col-span-1 md:col-span-2 lg:col-span-3">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-xl bg-white/10 shadow-inner">
                        <Sparkles className="h-5 w-5 text-rose-500" />
                    </div>
                    <h3 className="text-sm font-black tracking-[0.2em] uppercase">{t('dashboard:elicitation.key_terms')}</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    {(analysis.keyTerms || []).map((term, index) => (
                        <div key={index} className="group/term relative px-4 py-2 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 hover:bg-rose-500/20 transition-all">
                            <span className="text-xs font-bold text-rose-400">{term}</span>
                            <div className="flex items-center gap-1.5 opacity-0 group-hover/term:opacity-100 transition-all scale-90 group-hover/term:scale-100">
                                <button onClick={() => handleDeleteKeyTerm(index)} className="text-gray-400 hover:text-red-400 transition-colors">
                                    <Trash2 className="h-3 w-3" />
                                </button>
                                <button onClick={() => setToastMessage({ title: "Glossary Updated", description: `'${term}' added to domain knowledge.`, type: 'success' })} className="text-rose-400 hover:text-white transition-colors">
                                    <Plus className="h-3 w-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                    <form onSubmit={handleAddKeyTerm} className="relative">
                        <input
                            type="text"
                            value={newKeyTerm}
                            onChange={(e) => setNewKeyTerm(e.target.value)}
                            placeholder="Add tactical term..."
                            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-medium focus:ring-1 focus:ring-rose-500 min-w-[200px] outline-none"
                        />
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
