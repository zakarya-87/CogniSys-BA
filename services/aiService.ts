import { callGeminiProxy } from './geminiProxy';
import { TInitiative, TKpi } from "../types";

export const generateDailyBriefing = async (initiatives: TInitiative[], language?: string) => {
  const schema = {
    type: 'OBJECT', properties: {
      summary: { type: 'STRING' }, risks: { type: 'ARRAY', items: { type: 'STRING' } },
      opportunities: { type: 'ARRAY', items: { type: 'STRING' } },
      priorities: { type: 'ARRAY', items: { type: 'STRING' } },
      sentiment: { type: 'STRING', enum: ['Positive', 'Neutral', 'Cautionary'] }
    }, required: ['summary', 'risks', 'opportunities', 'priorities', 'sentiment']
  };
  const prompt = `
    Generate a daily executive briefing for the Intelligence Center.
    Focus on:
    1. Overall ecosystem health based on the provided initiatives.
    2. Critical risks or anomalies that require immediate attention.
    3. Strategic opportunities for growth or optimization.
    4. A concise summary of the top 3 priorities for today.
    ${language ? `IMPORTANT: Generate the response in the following language: ${language}. However, the 'sentiment' field MUST remain strictly one of ["Positive", "Neutral", "Cautionary"] in English.` : ''}
    Data:
    ${JSON.stringify(initiatives.map(i => ({ title: i.title, sector: i.sector, status: i.status })))}
    Return ONLY valid JSON matching this schema: ${JSON.stringify(schema)}
  `;
  const text = await callGeminiProxy(prompt, 'flash');
  return JSON.parse(text);
};

export const generateKpiInsights = async (kpi: TKpi, language?: string) => {
  const schema = {
    type: 'OBJECT', properties: {
      analysis: { type: 'STRING' },
      drivers: { type: 'ARRAY', items: { type: 'STRING' } },
      recommendations: { type: 'ARRAY', items: { type: 'STRING' } }
    }, required: ['analysis', 'drivers', 'recommendations']
  };
  const prompt = `
    Analyze the following KPI and provide strategic insights:
    KPI: ${kpi.name}, Current Value: ${kpi.value}, Target: ${kpi.target}, Trend: ${kpi.trend}
    Provide: 1. A brief analysis. 2. Potential drivers. 3. Recommended actions.
    ${language ? `IMPORTANT: Generate the response in the following language: ${language}.` : ''}
    Return ONLY valid JSON matching this schema: ${JSON.stringify(schema)}
  `;
  const text = await callGeminiProxy(prompt, 'flash');
  return JSON.parse(text);
};
