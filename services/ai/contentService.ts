import { generateJson, generateGroundedJson, generateText, generatedSchemas, Type } from './aiCore';
import { callGeminiProxy } from '../geminiProxy';
import { safeParseJSON } from '../../utils/aiUtils';
import { PromptFactory } from '../promptFactory';
import {
  Sector,
  TInitiative,
  TSlide,
  TUatTestCase,
  TReleaseChecklistItem,
  TReadinessAssessment,
  TRetroItem,
  TPersona,
  TImpactAnalysis,
  TReleaseNote,
  THiveMessage,
  TTeamMember,
  TDebateTurn,
  TCodeArtifact,
  TVisionResult,
  TVisionAnalysisType,
} from '../../types';

const logger = {
  log: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
};

// --- Exports ---

export const generatePresentation = async (title: string, desc: string, sector: string): Promise<{ slides: TSlide[], executiveSummary: string }> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `أنت خبير في ريادة الأعمال والابتكار وفقًا للقرار 1275 في الجزائر الخاص بالمؤسسات الناشئة والمشاريع المبتكرة.
مهمتك إعداد عرض تقديمي احترافي (Pitch Deck) لفكرة مشروع مبتكر بطريقة أكاديمية وريادية في آنٍ واحد.

يجب أن يكون العرض منظمًا في شرائح واضحة، وكل شريحة تحتوي على عنوان ومحتوى مركز ومقنع.

هيكل العرض يجب أن يتضمن ما يلي:
- تقديم عام عن المشروع (اسم المشروع، الرؤية والرسالة، القطاع المستهدف)
- المشكلة المطروحة (وصف دقيق وعميق للمشكلة، حجم وتأثير المشكلة اقتصاديًا أو اجتماعيًا، لماذا الحلول الحالية غير كافية)
- الحل المقترح (شرح واضح لكيفية عمل الحل، التكنولوجيا أو المنهجية المستخدمة، كيف يعالج الحل جوهر المشكلة، القيمة المضافة)
- الجوانب الابتكارية وفق القرار 1275 (توضيح عنصر الابتكار، كيف يحقق المشروع صفة "مبتكر" حسب معايير القرار 1275، عنصر التفرد وعدم التقليدية)
- نموذج الأعمال (مصادر الإيرادات، الفئة المستهدفة، استراتيجية الوصول للسوق)
- الأثر الاقتصادي والاجتماعي (خلق مناصب شغل، دعم الاقتصاد الرقمي أو الصناعي، المساهمة في التنمية الوطنية)
- خطة التطوير المستقبلية (مراحل النمو، التوسع، الشراكات المحتملة)

يجب أن يكون الأسلوب: رسمي، احترافي، مقنع، بلغة واضحة وقوية، خالٍ من الحشو، موجه للجنة تقييم جامعية أو لجنة وسم "مشروع مبتكر".

في النهاية، قدم ملخصًا تنفيذيًا قصيرًا يمكن قراءته في أقل من دقيقة.

Return a JSON object with two properties:
1. "slides": An array of slide objects. Each slide object must have:
   - "title": string
   - "bullets": array of strings (the content)
   - "footer": string
   - "type": string (e.g., "Vision", "Problem", "Solution", "Business Model", etc.)
2. "executiveSummary": string (the short executive summary)`,
      `${title}: ${desc}`,
      sector as Sector
  );
  return generateJson<{ slides: TSlide[], executiveSummary: string }>(prompt);
};

export const generateReleaseNotes = async (items: string[], sector: string, version: string): Promise<TReleaseNote> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Draft Release Notes for version ${version}. Items: ${items.join(', ')}.`,
        "Release Management",
        sector as Sector
    );
    return generateJson<TReleaseNote>(prompt, generatedSchemas['TReleaseNote'], generatedSchemas['TReleaseNote']?.required || []);
};

export const generateProjectDocument = async (initiative: TInitiative, type: string): Promise<string> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Draft a ${type}.`,
      initiative.title,
      initiative.sector,
      "Markdown"
  );
  return generateText(prompt);
};

export const generateReleaseChecklist = async (sector: string): Promise<TReleaseChecklistItem[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Generate a release checklist.`,
      "Release Management",
      sector as Sector
  );
  return generateJson<TReleaseChecklistItem[]>(prompt, { type: 'array', items: generatedSchemas['TReleaseChecklistItem'] }, []);
};

export const analyzeLaunchReadiness = async (checklist: TReleaseChecklistItem[], openBugs: number, sector: string): Promise<TReadinessAssessment> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Assess launch readiness. Checklist: ${JSON.stringify(checklist)}. Open bugs: ${openBugs}.`,
      "Release Gate",
      sector as Sector
  );
  return generateJson<TReadinessAssessment>(prompt, generatedSchemas['TReadinessAssessment'], generatedSchemas['TReadinessAssessment']?.required || []);
};

export const chatWithCatalyst = async (history: { sender: string; text: string }[], newMessage: string, context: string, sector: string): Promise<string> => {
    const conversation = history.map(m => `${m.sender}: ${m.text}`).join('\n');
    const prompt = PromptFactory.createContextAwarePrompt(
        `Continue the conversation. User says: "${newMessage}"`,
        `History:\n${conversation}\n\nProject Context: ${context}`,
        sector as Sector,
        "Text"
    );
    return generateText(prompt);
};

export const generateAgentComment = async (agent: TTeamMember, artifactType: string, content: any): Promise<string> => {
    const context = typeof content === 'string' ? content : (content ? JSON.stringify(content) : "");

    const snippet = context.length > 500 ? context.substring(0, 500) + "..." : context;

    const prompt = `
    You are ${agent.name}, the ${agent.role}.
    Your Personality: ${agent.personality}.
    
    The user just updated a ${artifactType}.
    Artifact Snippet: "${snippet}"
    
    Write a short (1 sentence), professional but character-driven reaction or constructive comment.
    Do not use hashtags.
    `;

    return generateText(prompt);
};

export const generateDebateTurn = async (agent: TTeamMember, topic: string, history: TDebateTurn[]): Promise<TDebateTurn> => {
    const transcript = history.map(t => `${t.agentId}: ${t.text}`).join('\n');

    const prompt = `
    You are ${agent.name}, the ${agent.role}.
    Personality: ${agent.personality}.
    
    Current Debate Topic: "${topic}".
    
    TRANSCRIPT SO FAR:
    ${transcript}
    
    You are speaking next.
    1. Keep it short (2-3 sentences max).
    2. React to the previous speaker if applicable.
    3. Stay in character (e.g. Sentry is paranoid, Ledger is cheap).
    4. Provide a sentiment label (Agrees, Disagrees, Neutral, Constructive).
    
    Return JSON: { "text": "...", "sentiment": "..." }
    `;

    const response = await generateJson<{text: string, sentiment: any}>(prompt);

    return {
        id: `turn-${Date.now()}`,
        agentId: agent.id,
        text: response.text,
        sentiment: response.sentiment,
        timestamp: Date.now()
    };
};

export const generateConsensus = async (topic: string, history: TDebateTurn[]): Promise<string> => {
    const transcript = history.map(t => `${t.agentId}: ${t.text}`).join('\n');
    const prompt = `Summarize the debate on "${topic}" into a final consensus statement or board resolution. Transcript:\n${transcript}`;
    return generateText(prompt);
};

export const generateCodeArtifact = async (context: string, sourceType: string, targetLanguage: string, sector: string): Promise<TCodeArtifact> => {
    const prompt = PromptFactory.createContextAwarePrompt(
        `Generate production-quality ${targetLanguage} code based on this artifact.
         Source Type: ${sourceType}
         
         Source Data:
         ${context.substring(0, 8000)}
        `,
        "The Construct (Code Generator)",
        sector as Sector,
        "Text"
    );

    const code = await generateText(prompt);

    const cleanedCode = code.replace(/```[a-z]*\n?|```/g, '').trim();

    return {
        id: `code-${Date.now()}`,
        title: `${sourceType} -> ${targetLanguage}`,
        language: targetLanguage,
        code: cleanedCode,
        sourceArtifactType: sourceType,
        createdAt: new Date().toISOString()
    };
};

export const analyzeImageArtifact = async (
    imageBase64: string,
    analysisType: TVisionAnalysisType,
    sector: string
): Promise<TVisionResult> => {

    let userInstruction = "";
    switch(analysisType) {
        case 'Whiteboard to Backlog':
            userInstruction = "Analyze this whiteboard photo. Extract all sticky notes or text as 'User Stories' and 'Action Items'.";
            break;
        case 'Sketch to Wireframe':
            userInstruction = "Analyze this UI sketch. Describe the layout, components (buttons, inputs), and structure in a way that can be converted to code.";
            break;
        case 'Legacy to Spec':
            userInstruction = "Analyze this screenshot of a software application. Reverse engineer the functional requirements and data fields.";
            break;
        case 'Diagram to Process':
            userInstruction = "Analyze this flowchart or diagram. Describe the process steps, decisions, and flow logic.";
            break;
    }

    const prompt = PromptFactory.createContextAwarePrompt(
        userInstruction,
        "Visual Analysis Task",
        sector as Sector
    );

    const visionText = await callGeminiProxy(
        prompt,
        'flash',
        {
            inlineImage: {
                mimeType: 'image/png',
                data: imageBase64
            }
        }
    );

    const text = visionText || "{}";
    const json = safeParseJSON<any>(text);

    return {
        id: `vision-${Date.now()}`,
        type: analysisType,
        summary: json.summary || "Analysis Complete",
        extractedText: json.extractedText || [],
        structuredData: json,
        timestamp: new Date().toISOString()
    };
};

export const summarizeConversation = async (messages: THiveMessage[]): Promise<string> => {
    const text = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const prompt = `Summarize this conversation context to retain key facts and decisions:\n${text}`;
    return generateText(prompt);
};

export const getPersonaResponse = async (persona: TPersona, history: any[], input: string, context: string): Promise<string> => {
  const prompt = `Roleplay as ${persona.name} (${persona.role}). Context: ${context}. User says: "${input}". Reply briefly.`;
  return generateText(prompt);
};

export const generateStakeholderPersonas = async (title: string, desc: string, sector: string): Promise<TPersona[]> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Generate 3 stakeholder personas.`,
      title,
      sector as Sector
  );
  return generateJson<TPersona[]>(prompt, { type: 'array', items: generatedSchemas['TPersona'] }, []);
};

export const generateImpactAnalysis = async (description: string, title: string, sector: string): Promise<TImpactAnalysis> => {
  const prompt = PromptFactory.createContextAwarePrompt(
      `Analyze impact of change "${description}".`,
      title,
      sector as Sector
  );
  return generateJson<TImpactAnalysis>(prompt, generatedSchemas['TImpactAnalysis'], generatedSchemas['TImpactAnalysis']?.required || []);
};
