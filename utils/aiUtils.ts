
import { jsonrepair } from 'jsonrepair';

/**
 * AI Utilities for CogniSys BA
 * Implements modern best practices: Resiliency, Sanitization, and Validation.
 */

// --- 1. Resilience: Exponential Backoff Retry ---

export async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 5,
    delay = 2000,
    backoff = 2
): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        // Extract message and status from nested error object if present
        let errorMessage = error.message || '';
        let errorStatus = error.status;
        let errorCode = error.code;

        // Handle nested error objects from @google/genai
        if (error.error) {
            errorMessage = error.error.message || errorMessage;
            errorStatus = error.error.status || errorStatus;
            errorCode = error.error.code || errorCode;
        }

        // If it's still empty, stringify the whole thing
        if (!errorMessage && !errorStatus && !errorCode) {
            errorMessage = JSON.stringify(error);
        }

        // Don't retry if it's a safety block or permission issue (403)
        if (errorMessage.includes('Safety') || errorMessage.includes('403') || errorMessage.includes('blocked')) {
            throw error;
        }

        // Check for Quota Exceeded (429 / RESOURCE_EXHAUSTED)
        const isQuotaExceeded = 
            errorMessage.toLowerCase().includes('quota') || 
            errorMessage.toLowerCase().includes('rate limit') ||
            errorStatus === 'RESOURCE_EXHAUSTED' || 
            errorCode === 429 ||
            errorMessage.includes('429');
        
        // Retry on Server Errors (5xx), RPC/XHR failures, OR Quota Exceeded
        const isRetryable = 
            errorMessage.includes('503') || 
            errorMessage.includes('Overloaded') || 
            errorMessage.includes('Rpc failed') || 
            errorMessage.includes('xhr error') ||
            errorMessage.includes('500') ||
            errorStatus === 500 || 
            errorCode === 500 ||
            isQuotaExceeded;

        if (retries > 0 && isRetryable) {
            const jitter = Math.random() * 1000;
            console.warn(`AI Service Error (${errorMessage}). Retrying in ${delay + jitter}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay + jitter));
            return withRetry(fn, retries - 1, delay * backoff, backoff);
        }

        if (isQuotaExceeded) {
             throw new Error("AI Service Quota Exceeded. The free tier limit has been reached. The quota will reset the next day. Please try again later.");
        }

        throw error;
    }
}

// --- 2. Sanitization: Robust JSON Parsing ---

export function cleanJsonString(text: string): string {
    if (!text) return "{}";

    let cleaned = text;

    // 1. Remove Markdown code blocks
    cleaned = cleaned.replace(/```json\n?|```/g, '');
    
    // 2. Remove standard markdown bolding if AI tries to be helpful
    cleaned = cleaned.replace(/\*\*/g, '');

    // 3. Trim whitespace
    cleaned = cleaned.trim();

    // 4. Attempt to find the first '{' or '[' and the last '}' or ']'
    // This handles cases where the AI adds conversational text before or after the JSON.
    const firstOpenBrace = cleaned.indexOf('{');
    const firstOpenBracket = cleaned.indexOf('[');
    const lastCloseBrace = cleaned.lastIndexOf('}');
    const lastCloseBracket = cleaned.lastIndexOf(']');

    let start = -1;
    let end = -1;

    // Determine if we are looking for an object or an array based on which comes first
    if (firstOpenBrace !== -1 && (firstOpenBracket === -1 || firstOpenBrace < firstOpenBracket)) {
        start = firstOpenBrace;
        end = lastCloseBrace;
    } else if (firstOpenBracket !== -1) {
        start = firstOpenBracket;
        end = lastCloseBracket;
    }

    if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.substring(start, end + 1);
    }

    return cleaned;
}

export function safeParseJSON<T>(text: string, fallback?: T, silent = false): T {
    try {
        const cleaned = cleanJsonString(text);
        const repaired = jsonrepair(cleaned);
        const parsed = JSON.parse(repaired);
        if (typeof parsed !== 'object' || parsed === null) {
            throw new Error("AI generated a string, not an object/array.");
        }
        return parsed as T;
    } catch (error) {
        if (!silent) {
            console.error("JSON Parsing Failed. Raw text:", text);
        }
        if (fallback !== undefined) return fallback;
        throw new Error("The AI generated a response that could not be parsed.");
    }
}

// --- 3. Validation: Lightweight Runtime Checking ---

/**
 * Escapes special characters for Mermaid labels.
 */
export function escapeMermaidLabel(label: string): string {
    if (!label) return '';
    // Escape double quotes
    let escaped = label.replace(/"/g, '&quot;');
    // Replace brackets and parentheses with spaces to avoid breaking mermaid shapes
    escaped = escaped.replace(/[\[\]\(\)\{\}]/g, ' ');
    return escaped.trim();
}

/**
 * Checks if the object has the required keys. 
 * This prevents "Cannot read property of undefined" in the UI.
 */
/**
 * Validates that the data object matches the expected schema structure.
 * Throws an error if the structure is invalid.
 */
export function validateData<T>(data: any, schema: any): T {
    if (!data || typeof data !== 'object') {
        throw new Error("AI response was not a valid object.");
    }
    
    // Simple structural validation: check if all required properties in schema exist in data
    // This can be expanded to full JSON schema validation if needed.
    const requiredKeys = schema.required || [];
    const missingKeys = requiredKeys.filter((key: string) => !(key in data));
    
    if (missingKeys.length > 0) {
        throw new Error(`AI Response missing required keys: ${missingKeys.join(', ')}`);
    }
    
    return data as T;
}

export function validateStructure<T>(data: any, requiredKeys: string[]): T {
    if (!data || typeof data !== 'object') {
        throw new Error("AI response was not a valid object.");
    }

    const missingKeys = requiredKeys.filter(key => !(key in data));
    
    if (missingKeys.length > 0) {
        console.warn(`AI Response missing keys: ${missingKeys.join(', ')}.`, data);
        // We throw here to allow the retry mechanism (in geminiService) to trigger a repair.
        throw new Error(`Missing keys: ${missingKeys.join(', ')}`);
    }

    return data as T;
}
