import { GoogleGenAI, Type } from "@google/genai";
import { TInitiative, TKpi } from "../types";

let _aiSvcAi: GoogleGenAI | null = null;
const getAi = () => {
  if (!_aiSvcAi) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not configured");
    _aiSvcAi = new GoogleGenAI({ apiKey: key });
  }
  return _aiSvcAi;
};
const ai = { models: { generateContent: (...a: any[]) => getAi().models.generateContent(...a as any) } };

export const generateDailyBriefing = async (initiatives: TInitiative[], language?: string) => {
  const prompt = `
    Generate a daily executive briefing for the Intelligence Center.
    Focus on:
    1. Overall ecosystem health based on the provided initiatives.
    2. Critical risks or anomalies that require immediate attention.
    3. Strategic opportunities for growth or optimization.
    4. A concise summary of the top 3 priorities for today.

    ${language ? `IMPORTANT: Generate the response in the following language: ${language}. However, the 'sentiment' field MUST remain strictly one of ["Positive", "Neutral", "Cautionary"] in English.` : ''}

    Data:
    ${JSON.stringify(initiatives.map(i => ({
      title: i.title,
      sector: i.sector,
      status: i.status
    })))}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      systemInstruction: "You are a world-class strategic analyst providing daily briefings to an executive team. Be concise, insightful, and action-oriented.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          opportunities: { type: Type.ARRAY, items: { type: Type.STRING } },
          priorities: { type: Type.ARRAY, items: { type: Type.STRING } },
          sentiment: { type: Type.STRING, enum: ["Positive", "Neutral", "Cautionary"] }
        },
        required: ["summary", "risks", "opportunities", "priorities", "sentiment"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateKpiInsights = async (kpi: TKpi, language?: string) => {
    const prompt = `
        Analyze the following KPI and provide strategic insights:
        KPI: ${kpi.name}
        Current Value: ${kpi.value}
        Target: ${kpi.target}
        Trend: ${kpi.trend}
        
        Provide:
        1. A brief analysis of the current performance.
        2. Potential drivers for the observed trend.
        3. Recommended actions to reach or exceed the target.

        ${language ? `IMPORTANT: Generate the response in the following language: ${language}.` : ''}
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            systemInstruction: "You are an expert data analyst specializing in strategic KPI performance.",
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    analysis: { type: Type.STRING },
                    drivers: { type: Type.ARRAY, items: { type: Type.STRING } },
                    recommendations: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["analysis", "drivers", "recommendations"]
            }
        }
    });

    return JSON.parse(response.text);
};
