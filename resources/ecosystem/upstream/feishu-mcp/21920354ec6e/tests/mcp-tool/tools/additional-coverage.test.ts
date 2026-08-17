import { getShouldUseUAT } from '../../../src/mcp-tool/utils/get-should-use-uat';
import { caseTransf } from '../../../src/mcp-tool/utils/case-transf';
import { cleanEnvArgs } from '../../../src/utils/clean-env-args';
import { TokenMode } from '../../../src/mcp-tool/types';

describe('Additional Coverage Tests', () => {
  describe('getShouldUseUAT', () => {
    it('should return true for user access token mode', () => {
      const result = getShouldUseUAT(TokenMode.USER_ACCESS_TOKEN);
      expect(result).toBe(true);
    });

    it('should return false for tenant access token mode', () => {
      const result = getShouldUseUAT(TokenMode.TENANT_ACCESS_TOKEN);
      expect(result).toBe(false);
    });

    it('should return true for auto mode with useUAT=true', () => {
      const result = getShouldUseUAT(TokenMode.AUTO, true);
      expect(result).toBe(true);
    });

    it('should return false for auto mode with useUAT=false', () => {
      const result = getShouldUseUAT(TokenMode.AUTO, false);
      expect(result).toBe(false);
    });

    it('should return undefined for auto mode with useUAT=undefined', () => {
      const result = getShouldUseUAT(TokenMode.AUTO, undefined);
      expect(result).toBe(undefined);
    });

    it('should handle default auto mode', () => {
      const result = getShouldUseUAT(TokenMode.AUTO);
      expect(result).toBe(undefined);
    });
  });

  describe('caseTransf', () => {
    it('should transform to snake_case', () => {
      const result = caseTransf('test.tool.name', 'snake');
      expect(result).toBe('test_tool_name');
    });

    it('should transform to camelCase', () => {
      const result = caseTransf('test.tool.name', 'camel');
      expect(result).toBe('testToolName');
    });

    it('should transform to kebab-case', () => {
      const result = caseTransf('test.tool.name', 'kebab');
      expect(result).toBe('test-tool-name');
    });

    it('should return original name when no case type provided', () => {
      const result = caseTransf('test.tool.name');
      expect(result).toBe('test.tool.name');
    });

    it('should handle empty string', () => {
      const result = caseTransf('', 'snake');
      expect(result).toBe('');
    });
  });

  describe('cleanEnvArgs', () => {
    it('should remove undefined values and empty strings', () => {
      const args: Record<string, string | undefined> = {
        defined: 'value',
        undefined: undefined,
        empty: '',
        anotherDefined: 'value2',
      };
      const result = cleanEnvArgs(args);
      expect(result).toEqual({
        defined: 'value',
        anotherDefined: 'value2',
      });
    });

    it('should handle empty object', () => {
      const result = cleanEnvArgs({});
      expect(result).toEqual({});
    });

    it('should handle object with all undefined values', () => {
      const args: Record<string, string | undefined> = {
        a: undefined,
        b: undefined,
      };
      const result = cleanEnvArgs(args);
      expect(result).toEqual({});
    });

    it('should only keep truthy values', () => {
      const args: Record<string, string | undefined> = {
        empty: '',
        defined: 'value',
        undefined: undefined,
        whitespace: '   ',
      };
      const result = cleanEnvArgs(args);
      expect(result).toEqual({
        defined: 'value',
        whitespace: '   ',
      });
    });
  });
});
