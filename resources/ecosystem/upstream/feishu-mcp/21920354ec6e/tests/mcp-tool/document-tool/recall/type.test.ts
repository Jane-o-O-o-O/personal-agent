import type { DocumentRecallToolOptions, DocumentRecallTool } from '../../../../src/mcp-tool/document-tool/recall/type';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

describe('DocumentRecallTool Types', () => {
  describe('DocumentRecallToolOptions', () => {
    it('should allow undefined values for all optional properties', () => {
      const options: DocumentRecallToolOptions = {};

      expect(options.domain).toBeUndefined();
      expect(options.smallToBig).toBeUndefined();
      expect(options.count).toBeUndefined();
      expect(options.multiQuery).toBeUndefined();
      expect(options.timeout).toBeUndefined();
    });

    it('should accept valid option values', () => {
      const options: DocumentRecallToolOptions = {
        domain: 'https://example.com',
        smallToBig: true,
        count: 10,
        multiQuery: false,
        timeout: 5000,
      };

      expect(options.domain).toBe('https://example.com');
      expect(options.smallToBig).toBe(true);
      expect(options.count).toBe(10);
      expect(options.multiQuery).toBe(false);
      expect(options.timeout).toBe(5000);
    });

    it('should allow partial options', () => {
      const options1: DocumentRecallToolOptions = {
        domain: 'https://test.com',
        count: 5,
      };

      const options2: DocumentRecallToolOptions = {
        smallToBig: false,
        timeout: 3000,
      };

      expect(options1.domain).toBe('https://test.com');
      expect(options1.count).toBe(5);
      expect(options1.smallToBig).toBeUndefined();

      expect(options2.smallToBig).toBe(false);
      expect(options2.timeout).toBe(3000);
      expect(options2.domain).toBeUndefined();
    });

    it('should accept boolean values for smallToBig and multiQuery', () => {
      const trueOptions: DocumentRecallToolOptions = {
        smallToBig: true,
        multiQuery: true,
      };

      const falseOptions: DocumentRecallToolOptions = {
        smallToBig: false,
        multiQuery: false,
      };

      expect(trueOptions.smallToBig).toBe(true);
      expect(trueOptions.multiQuery).toBe(true);
      expect(falseOptions.smallToBig).toBe(false);
      expect(falseOptions.multiQuery).toBe(false);
    });

    it('should accept number values for count and timeout', () => {
      const options: DocumentRecallToolOptions = {
        count: 0,
        timeout: 0,
      };

      expect(options.count).toBe(0);
      expect(options.timeout).toBe(0);
    });
  });

  describe('DocumentRecallTool', () => {
    const mockHandler = jest.fn().mockResolvedValue({
      content: [{ type: 'text' as const, text: 'Mock result' }],
    });

    const validTool: DocumentRecallTool = {
      name: 'test-recall-tool',
      description: 'A test recall tool',
      schema: { query: z.string() },
      handler: mockHandler,
    };

    it('should have required properties', () => {
      expect(validTool).toHaveProperty('name');
      expect(validTool).toHaveProperty('description');
      expect(validTool).toHaveProperty('schema');
      expect(validTool).toHaveProperty('handler');
    });

    it('should have correct types for each property', () => {
      expect(typeof validTool.name).toBe('string');
      expect(typeof validTool.description).toBe('string');
      expect(typeof validTool.schema).toBe('object');
      expect(typeof validTool.handler).toBe('function');
    });

    it('should have schema with query property of ZodType<string>', () => {
      expect(validTool.schema).toHaveProperty('query');
      expect(validTool.schema.query).toBeInstanceOf(z.ZodString);
    });

    it('should have handler that accepts correct parameters and returns Promise<CallToolResult>', async () => {
      const params = { query: 'test query' };
      const options: DocumentRecallToolOptions = {
        domain: 'https://test.com',
        count: 5,
      };

      const result = await validTool.handler(params, options);

      expect(mockHandler).toHaveBeenCalledWith(params, options);
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
    });

    it('should support different schema types for query', () => {
      const stringSchema: DocumentRecallTool = {
        name: 'string-tool',
        description: 'String tool',
        schema: { query: z.string() },
        handler: mockHandler,
      };

      const refinedStringSchema: DocumentRecallTool = {
        name: 'refined-tool',
        description: 'Refined tool',
        schema: { query: z.string().min(1).max(100) },
        handler: mockHandler,
      };

      expect(stringSchema.schema.query).toBeInstanceOf(z.ZodString);
      expect(refinedStringSchema.schema.query).toBeInstanceOf(z.ZodString);
    });

    it('should work with async handlers', async () => {
      const asyncHandler = async (
        params: { query: string },
        options: DocumentRecallToolOptions,
      ): Promise<CallToolResult> => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return {
          content: [{ type: 'text', text: `Processed: ${params.query}` }],
        };
      };

      const asyncTool: DocumentRecallTool = {
        name: 'async-tool',
        description: 'Async tool',
        schema: { query: z.string() },
        handler: asyncHandler,
      };

      const result = await asyncTool.handler({ query: 'test' }, {});
      expect(result.content[0]).toEqual({
        type: 'text',
        text: 'Processed: test',
      });
    });

    it('should support handlers with different CallToolResult formats', async () => {
      const textHandler = async (): Promise<CallToolResult> => ({
        content: [{ type: 'text', text: 'Text result' }],
      });

      const imageHandler = async (): Promise<CallToolResult> => ({
        content: [{ type: 'image', data: 'base64data', mimeType: 'image/png' }],
      });

      const multiContentHandler = async (): Promise<CallToolResult> => ({
        content: [
          { type: 'text', text: 'Mixed content' },
          { type: 'image', data: 'imagedata', mimeType: 'image/jpeg' },
        ],
      });

      const textTool: DocumentRecallTool = {
        name: 'text-tool',
        description: 'Text tool',
        schema: { query: z.string() },
        handler: textHandler,
      };

      const imageTool: DocumentRecallTool = {
        name: 'image-tool',
        description: 'Image tool',
        schema: { query: z.string() },
        handler: imageHandler,
      };

      const multiTool: DocumentRecallTool = {
        name: 'multi-tool',
        description: 'Multi tool',
        schema: { query: z.string() },
        handler: multiContentHandler,
      };

      const textResult = await textTool.handler({ query: 'test' }, {});
      const imageResult = await imageTool.handler({ query: 'test' }, {});
      const multiResult = await multiTool.handler({ query: 'test' }, {});

      expect(textResult.content[0].type).toBe('text');
      expect(imageResult.content[0].type).toBe('image');
      expect(multiResult.content).toHaveLength(2);
    });
  });

  describe('Type compatibility tests', () => {
    it('should work with different query schema variations', () => {
      const schemas = [
        { query: z.string() },
        { query: z.string().describe('Query description') },
        { query: z.string().min(1) },
        { query: z.string().max(1000) },
        { query: z.string().email() },
        { query: z.string().url() },
      ];

      schemas.forEach((schema, index) => {
        const tool: DocumentRecallTool = {
          name: `tool-${index}`,
          description: `Tool ${index}`,
          schema,
          handler: async () => ({ content: [{ type: 'text', text: 'result' }] }),
        };

        expect(tool.schema.query).toBeInstanceOf(z.ZodString);
      });
    });

    it('should ensure handler parameter types are enforced', () => {
      // This test ensures TypeScript type checking works correctly
      const handler = async (
        params: { query: string },
        options: DocumentRecallToolOptions,
      ): Promise<CallToolResult> => {
        // Verify params structure
        expect(typeof params.query).toBe('string');

        // Verify options structure (all optional)
        if (options.domain !== undefined) {
          expect(typeof options.domain).toBe('string');
        }
        if (options.smallToBig !== undefined) {
          expect(typeof options.smallToBig).toBe('boolean');
        }
        if (options.count !== undefined) {
          expect(typeof options.count).toBe('number');
        }
        if (options.multiQuery !== undefined) {
          expect(typeof options.multiQuery).toBe('boolean');
        }
        if (options.timeout !== undefined) {
          expect(typeof options.timeout).toBe('number');
        }

        return { content: [{ type: 'text', text: 'validated' }] };
      };

      const tool: DocumentRecallTool = {
        name: 'validation-tool',
        description: 'Validation tool',
        schema: { query: z.string() },
        handler,
      };

      expect(tool.handler).toBe(handler);
    });
  });
});
