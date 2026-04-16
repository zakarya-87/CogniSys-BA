
import React, { useRef, useState, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { useCatalyst } from '../../../context/CatalystContext';
import { useTheme } from '../../../context/UIContext';
import { generateMonteCarloSimulation, runEthicalCheck, generateText, generateAnalysisPlan } from '../../../services/geminiService';
import { Microservices } from '../../../services/ai/agents';
import { OracleService } from '../../../services/oracleService';
import { AI_PROVIDERS, getProviderForModel } from '../../../constants';

const MembersView = lazy(() => import('./MembersView').then(m => ({ default: m.MembersView })));
const BillingView = lazy(() => import('./BillingView').then(m => ({ default: m.BillingView })));

const SettingsCard: React.FC<{ title: string; description: string; children: React.ReactNode }> = ({ title, description, children }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">{description}</p>
    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
      {children}
    </div>
  </div>
);

const CloudArrowDownIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>;
const CloudArrowUpIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>;
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-green-500" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-500" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const BeakerIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 01-6.23-.693L4.2 15.3m15.6 0c1.255 0 2.443.29 3.5.832v-2.67a1.5 1.5 0 00-1.5-1.5h-15a1.5 1.5 0 00-1.5 1.5v2.67c1.057-.542 2.245-.832 3.5-.832h12.5z" /></svg>;

const AIProviderSelector: React.FC<{ aiModel: string; setAiModel: (id: string) => void }> = ({ aiModel, setAiModel }) => {
  const activeProvider = getProviderForModel(aiModel) ?? AI_PROVIDERS[0];
  const [selectedProviderId, setSelectedProviderId] = useState(activeProvider.id);
  const selectedProvider = AI_PROVIDERS.find(p => p.id === selectedProviderId) ?? AI_PROVIDERS[0];

  return (
    <div className="space-y-5">
      {/* Provider tabs */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">AI Provider</p>
        <div className="flex flex-wrap gap-2">
          {AI_PROVIDERS.map(provider => {
            const isActive = provider.id === selectedProviderId;
            const isCurrentProvider = provider.id === (getProviderForModel(aiModel)?.id);
            return (
              <button
                key={provider.id}
                onClick={() => setSelectedProviderId(provider.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  isActive
                    ? 'bg-accent-purple text-white border-transparent shadow-md shadow-accent-purple/30'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:border-accent-purple/50'
                }`}
              >
                <span>{provider.icon}</span>
                <span>{provider.name}</span>
                {isCurrentProvider && (
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-green-500'}`} title="Currently active" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model list for selected provider */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Model — <span className="normal-case font-normal">{selectedProvider.name}</span>
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {selectedProvider.models.map(model => {
            const isSelected = aiModel === model.id;
            return (
              <button
                key={model.id}
                onClick={() => setAiModel(model.id)}
                className={`text-left p-3 rounded-xl border transition-all duration-200 group ${
                  isSelected
                    ? 'border-accent-purple bg-accent-purple/10 dark:bg-accent-purple/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-accent-purple/40 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-accent-purple' : 'text-gray-800 dark:text-gray-100'}`}>
                      {model.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{model.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent-purple">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-purple inline-block" />
                        Active
                      </span>
                    )}
                    {model.contextWindow && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{model.contextWindow}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Env var hint */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-dashed border-gray-200 dark:border-gray-700">
        <span className="text-lg">🔑</span>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-semibold text-gray-700 dark:text-gray-300">{selectedProvider.name}</span> requires{' '}
          <code className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-[11px] font-mono text-accent-purple">
            {selectedProvider.requiresKey}
          </code>{' '}
          to be set in your <code className="font-mono text-[11px]">.env.local</code>.
        </p>
      </div>
    </div>
  );
};

export const SettingsView: React.FC = () => {
  const { exportData, importData, initiatives, aiModel, setAiModel, resetData } = useCatalyst();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation(['settings', 'common']);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'members' | 'billing'>('general');

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // Diagnostics State
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'running' | 'pass' | 'fail'>>({
      core: 'idle',
      json: 'idle',
      oracle: 'idle',
      monteCarlo: 'idle',
      ethics: 'idle',
      hive: 'idle'
  });
  const [testLogs, setTestLogs] = useState<string[]>([]);

  const handleExport = async () => {
    const json = await exportData();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cognisys_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        if (event.target?.result) {
            importData(event.target.result as string);
        }
    };
    reader.readAsText(file);
  };

  const runDiagnostics = async () => {
      setIsRunningTests(true);
      setTestLogs([]);
      setTestStatus({ core: 'idle', json: 'idle', oracle: 'idle', monteCarlo: 'idle', ethics: 'idle', hive: 'idle' });

      const log = (msg: string) => setTestLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

      // 1. Core Connectivity Test
      log("1. Testing Gemini Core connectivity...");
      setTestStatus(prev => ({ ...prev, core: 'running' }));
      try {
          const start = Date.now();
          const res = await generateText("Reply with 'OK' only.");
          if (res.includes('OK')) {
              setTestStatus(prev => ({ ...prev, core: 'pass' }));
              log(`Core: Success (${Date.now() - start}ms).`);
          } else {
              throw new Error("Unexpected response.");
          }
      } catch (e: any) {
          setTestStatus(prev => ({ ...prev, core: 'fail' }));
          log(`Core Failed: ${e.message}`);
      }

      // 2. JSON Structural Integrity
      log("2. Testing JSON Schema enforcement...");
      setTestStatus(prev => ({ ...prev, json: 'running' }));
      try {
          const res = await generateAnalysisPlan("Test Project", "General");
          if (res.approach && Array.isArray(res?.stakeholders)) {
              setTestStatus(prev => ({ ...prev, json: 'pass' }));
              log("JSON: Success. Schema validated.");
          } else {
              throw new Error("Invalid schema.");
          }
      } catch (e: any) {
          setTestStatus(prev => ({ ...prev, json: 'fail' }));
          log(`JSON Failed: ${e.message}`);
      }

      // 3. Oracle RAG Test
      log("3. Testing Oracle Knowledge Retrieval...");
      setTestStatus(prev => ({ ...prev, oracle: 'running' }));
      try {
          const res = await OracleService.ask("What is the status of the first project?", initiatives);
          if (res.answer && Array.isArray(res?.citations)) {
              setTestStatus(prev => ({ ...prev, oracle: 'pass' }));
              log("Oracle: Success. Semantic search operational.");
          } else {
              throw new Error("Invalid RAG response.");
          }
      } catch (e: any) {
          setTestStatus(prev => ({ ...prev, oracle: 'fail' }));
          log(`Oracle Failed: ${e.message}`);
      }

      // 4. Monte Carlo Test
      log("4. Starting Monte Carlo Engine check...");
      setTestStatus(prev => ({ ...prev, monteCarlo: 'running' }));
      try {
          const res = await generateMonteCarloSimulation("Test Var", 10, "General");
          if (res.buckets && Array.isArray(res?.buckets) && res.buckets.length > 0) {
              setTestStatus(prev => ({ ...prev, monteCarlo: 'pass' }));
              log("Monte Carlo: Success. Buckets generated.");
          } else {
              throw new Error("No buckets returned.");
          }
      } catch (e: any) {
          setTestStatus(prev => ({ ...prev, monteCarlo: 'fail' }));
          log(`Monte Carlo Failed: ${e.message}`);
      }

      // 5. Ethical Guardian Test
      log("5. Starting Ethical Guardian check...");
      setTestStatus(prev => ({ ...prev, ethics: 'running' }));
      try {
          const res = await runEthicalCheck("We will only hire young people.", "HR");
          if (res.biasRisks && Array.isArray(res?.biasRisks) && res.biasRisks.length > 0) {
              setTestStatus(prev => ({ ...prev, ethics: 'pass' }));
              log("Ethical Guardian: Success. Bias detected.");
          } else {
               if (res.score !== undefined) {
                   setTestStatus(prev => ({ ...prev, ethics: 'pass' }));
                   log("Ethical Guardian: Success. Score generated.");
               } else {
                   throw new Error("Invalid structure.");
               }
          }
      } catch (e: any) {
          setTestStatus(prev => ({ ...prev, ethics: 'fail' }));
          log(`Ethical Guardian Failed: ${e.message}`);
      }

      // 6. Hive Routing Test
      log("6. Starting Hive Brain routing check...");
      setTestStatus(prev => ({ ...prev, hive: 'running' }));
      try {
          const response = await Microservices.Orchestrator.execute(
              [{ id: '1', role: 'user', agent: 'Orchestrator', content: 'Run a Monte Carlo simulation for project risks.', timestamp: Date.now() }],
              'Route this request.',
              undefined
          );
          
          if (response.nextAction === 'delegate' && response.targetAgent === 'Simulation') {
              setTestStatus(prev => ({ ...prev, hive: 'pass' }));
              log("Hive Brain: Success. Correctly delegated to Simulation agent.");
          } else {
              setTestStatus(prev => ({ ...prev, hive: 'fail' }));
              log(`Hive Brain Failed: Routed to ${response.targetAgent} instead of Simulation.`);
          }
      } catch (e: any) {
          setTestStatus(prev => ({ ...prev, hive: 'fail' }));
          log(`Hive Brain Failed: ${e.message}`);
      }

      setIsRunningTests(false);
      log("All System Diagnostics complete.");
  };

  const TestBadge: React.FC<{ label: string; status: 'idle' | 'running' | 'pass' | 'fail' }> = ({ label, status }) => (
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700/50 p-2 rounded-md border border-gray-200 dark:border-gray-600">
          <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
              status === 'idle' ? 'bg-gray-400' : 
              status === 'running' ? 'bg-indigo-500 animate-pulse' : 
              status === 'pass' ? 'bg-green-500' : 'bg-red-500'
          }`}></span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{label}</span>
      </div>
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('settings:title')}</h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {(['general', 'members', 'billing'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveSettingsTab(tab)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              activeSettingsTab === tab
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeSettingsTab === 'members' && (
        <Suspense fallback={<div className="p-6 text-slate-400 text-sm">Loading…</div>}>
          <MembersView />
        </Suspense>
      )}

      {activeSettingsTab === 'billing' && (
        <Suspense fallback={<div className="p-6 text-slate-400 text-sm">Loading…</div>}>
          <BillingView />
        </Suspense>
      )}

      {activeSettingsTab === 'general' && <>
      <SettingsCard
        title={t('settings:appearance')}
        description={t('settings:appearanceDesc')}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${theme === 'light' ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            {t('settings:light')}
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${theme === 'dark' ? 'bg-indigo-500 text-white' : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'}`}
          >
            {t('settings:dark')}
          </button>
        </div>

        <div className="mt-6 space-y-2">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('settings:language')}</label>
          <select 
            value={i18n.resolvedLanguage ?? i18n.language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full max-w-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-accent-purple outline-none"
          >
            <option value="en">English (US)</option>
            <option value="fr">Français (FR)</option>
            <option value="ar">العربية (Arabic)</option>
          </select>
        </div>
      </SettingsCard>

      <SettingsCard
        title={t('settings:aiConfig')}
        description={t('settings:aiConfigDesc')}
      >
        <AIProviderSelector aiModel={aiModel} setAiModel={setAiModel} />
      </SettingsCard>

      <SettingsCard
          title={t('settings:diagnostics')}
          description={t('settings:diagnosticsDesc')}
      >
          <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                 <TestBadge label="Core Connectivity" status={testStatus.core} />
                 <TestBadge label="JSON Architect" status={testStatus.json} />
                 <TestBadge label="Oracle RAG" status={testStatus.oracle} />
                 <TestBadge label="Monte Carlo Engine" status={testStatus.monteCarlo} />
                 <TestBadge label="Ethical Guardian" status={testStatus.ethics} />
                 <TestBadge label="Hive Orchestrator" status={testStatus.hive} />
              </div>

              <div className="flex justify-end mt-4">
                   <Button onClick={runDiagnostics} disabled={isRunningTests} className="bg-indigo-600 hover:bg-indigo-700">
                       {isRunningTests ? <Spinner /> : <><BeakerIcon className="h-4 w-4 me-2" /> {t('settings:runCheck')}</>}
                   </Button>
              </div>

              {testLogs.length > 0 && (
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs max-h-40 overflow-y-auto border border-gray-700 custom-scrollbar">
                      {testLogs.map((log, i) => (
                          <div key={i}>{log}</div>
                      ))}
                  </div>
              )}
          </div>
      </SettingsCard>

      <SettingsCard
        title={t('settings:dataPortability')}
        description={t('settings:dataPortabilityDesc')}
      >
        <div className="flex gap-4">
            <Button onClick={handleExport} className="bg-green-600 hover:bg-green-700">
                <CloudArrowDownIcon className="h-5 w-5 me-2" />
                {t('settings:export')}
            </Button>
            <Button onClick={handleImportClick} className="bg-indigo-600 hover:bg-indigo-700">
                <CloudArrowUpIcon className="h-5 w-5 me-2" />
                {t('settings:import')}
            </Button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange}
            />
        </div>
      </SettingsCard>

      <SettingsCard
        title={t('settings:dangerZone')}
        description={t('settings:dangerZoneDesc')}
      >
        <Button onClick={resetData} className="bg-red-600 hover:bg-red-700 focus:ring-red-500">
          {t('settings:reset')}
        </Button>
      </SettingsCard>
      </>}
    </div>
  );
};
