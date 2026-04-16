
import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { 
    generateStrategicRecommendations, 
    generateKpiForecast,
    generateDailyBriefing
} from '../services/geminiService';
import { OracleService } from '../services/oracleService';
import { TInitiative, TKpi, TStrategicRecommendation, TKpiForecast, TDailyBriefing, Sector, TOracleResponse } from '../types';

interface AIContextType {
  isAIProcessing: boolean;
  aiError: string | null;
  getRecommendations: (initiatives: TInitiative[], kpis: TKpi[], sector: Sector, lang: string) => Promise<TStrategicRecommendation[]>;
  getForecast: (kpiName: string, value: number, sector: string, lang: string) => Promise<TKpiForecast>;
  getDailyBriefing: (initiatives: TInitiative[], lang: string) => Promise<TDailyBriefing>;
  getKpiInsights: (kpi: TKpi, lang: string) => Promise<{ analysis: string; drivers: string[]; recommendations: string[] }>;
  askOracle: (query: string, initiatives: TInitiative[]) => Promise<TOracleResponse>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const wrapCall = useCallback(async function<T>(fn: () => Promise<T>): Promise<T> {
    setIsAIProcessing(true);
    setAiError(null);
    try {
      return await fn();
    } catch (err: any) {
      const msg = err.message || 'AI operation failed';
      setAiError(msg);
      throw err;
    } finally {
      setIsAIProcessing(false);
    }
  }, []);

  const getRecommendations = useCallback((initiatives: TInitiative[], kpis: TKpi[], sector: Sector, lang: string) => 
    wrapCall(() => generateStrategicRecommendations(initiatives, kpis, sector, lang)), [wrapCall]);

  const getForecast = useCallback((kpiName: string, value: number, sector: string, lang: string) => 
    wrapCall(() => generateKpiForecast(kpiName, value, sector, lang)), [wrapCall]);

  const getDailyBriefing = useCallback((initiatives: TInitiative[], lang: string) => 
    wrapCall(() => generateDailyBriefing('', 'general', lang)), [wrapCall]);

  const getKpiInsights = useCallback((kpi: TKpi, lang: string) => 
    wrapCall(async () => ({ analysis: '', drivers: [], recommendations: [] })), [wrapCall]);

  const askOracle = useCallback((query: string, initiatives: TInitiative[]) => 
    wrapCall(() => OracleService.ask(query, initiatives)), [wrapCall]);

  return (
    <AIContext.Provider value={{
      isAIProcessing,
      aiError,
      getRecommendations,
      getForecast,
      getDailyBriefing,
      getKpiInsights,
      askOracle
    }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAI must be used within an AIProvider');
  return context;
};
