
import { describe, it, expect } from 'vitest';
import { cleanJsonString, validateStructure, safeParseJSON } from './aiUtils';

describe('aiUtils', () => {
  describe('cleanJsonString', () => {
    it('removes markdown code blocks', () => {
      const input = '```json\n{"foo":"bar"}\n```';
      expect(cleanJsonString(input)).toBe('{"foo":"bar"}');
    });

    it('extracts JSON object from surrounding text', () => {
      const input = 'Here is the data: {"foo":"bar"} hope it helps.';
      expect(cleanJsonString(input)).toBe('{"foo":"bar"}');
    });

    it('extracts JSON array from surrounding text', () => {
      const input = 'Here is the list: [{"id":1}] end of list.';
      expect(cleanJsonString(input)).toBe('[{"id":1}]');
    });

    it('handles nested braces correctly', () => {
      const input = '{"a": {"b": "c"}}';
      expect(cleanJsonString(input)).toBe('{"a": {"b": "c"}}');
    });

    it('returns original string if no json found', () => {
      const input = 'just text';
      expect(cleanJsonString(input)).toBe('just text');
    });
  });

  describe('validateStructure', () => {
    it('returns data if all keys are present', () => {
      const data = { id: 1, name: 'Test' };
      const result = validateStructure(data, ['id', 'name']);
      expect(result).toEqual(data);
    });

    it('throws error if key is missing', () => {
      const data = { id: 1 };
      expect(() => validateStructure(data, ['id', 'name'])).toThrow(/Missing keys: name/);
    });

    it('throws error if input is not an object', () => {
      expect(() => validateStructure(null, ['id'])).toThrow(/AI response was not a valid object/);
    });
  });

  describe('safeParseJSON', () => {
      it('parses valid JSON', () => {
          expect(safeParseJSON('{"a":1}')).toEqual({a: 1});
      });

      it('cleans and parses JSON with markdown', () => {
          expect(safeParseJSON('```json\n{"a":1}```')).toEqual({a: 1});
      });

      it('returns fallback on failure', () => {
          const fallback = { error: true };
          expect(safeParseJSON('invalid', fallback)).toEqual(fallback);
      });
      
      it('throws if no fallback provided on invalid json', () => {
          expect(() => safeParseJSON('invalid')).toThrow();
      });
  });
});
