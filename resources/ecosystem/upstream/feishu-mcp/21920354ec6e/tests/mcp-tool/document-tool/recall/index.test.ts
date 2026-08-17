import { RecallTool } from '../../../../src/mcp-tool/document-tool/recall';
import * as request from '../../../../src/mcp-tool/document-tool/recall/request';
import { DocumentRecallToolOptions } from '../../../../src/mcp-tool/document-tool/recall/type';

// 模拟请求模块
jest.mock('../../../../src/mcp-tool/document-tool/recall/request');

describe('RecallTool', () => {
  // 获取模拟函数
  const mockedRecallDeveloperDocument = request.recallDeveloperDocument as jest.Mock;

  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
  });

  it('应该具有正确的名称和描述', () => {
    expect(RecallTool.name).toBe('openplatform_developer_document_recall');
    expect(RecallTool.description).toMatch(/Recall for relevant documents/);
    expect(RecallTool.schema).toBeDefined();
  });

  it('应该处理正常结果', async () => {
    // 模拟搜索结果
    const mockResults = ['result1', 'result2', 'result3'];
    mockedRecallDeveloperDocument.mockResolvedValueOnce(mockResults);

    // 调用参数
    const params = { query: 'test query' };
    const options: DocumentRecallToolOptions = { domain: 'https://example.com' };

    // 执行处理程序
    const result = await RecallTool.handler(params, options);

    // 验证结果
    expect(mockedRecallDeveloperDocument).toHaveBeenCalledWith('test query', options);
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: `Find 3 results:\n${mockResults.join('\n\n')}`,
        },
      ],
    });
  });

  it('应该处理空结果', async () => {
    // 模拟空搜索结果
    mockedRecallDeveloperDocument.mockResolvedValueOnce([]);

    // 调用参数
    const params = { query: 'test query' };
    const options: DocumentRecallToolOptions = { domain: 'https://example.com' };

    // 执行处理程序
    const result = await RecallTool.handler(params, options);

    // 验证结果
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: 'No results found',
        },
      ],
    });
  });

  it('应该处理错误情况', async () => {
    // 模拟错误
    const mockError = new Error('API error');
    mockedRecallDeveloperDocument.mockRejectedValueOnce(mockError);

    // 调用参数
    const params = { query: 'test query' };
    const options: DocumentRecallToolOptions = { domain: 'https://example.com' };

    // 执行处理程序
    const result = await RecallTool.handler(params, options);

    // 验证结果
    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Search failed:API error',
        },
      ],
    });
  });

  it('应该处理未知错误类型', async () => {
    // 模拟非Error类型的错误
    mockedRecallDeveloperDocument.mockRejectedValueOnce('String error');

    // 调用参数
    const params = { query: 'test query' };
    const options: DocumentRecallToolOptions = { domain: 'https://example.com' };

    // 执行处理程序
    const result = await RecallTool.handler(params, options);

    // 验证结果
    expect(result).toEqual({
      isError: true,
      content: [
        {
          type: 'text',
          text: 'Search failed:Unknown error',
        },
      ],
    });
  });
});
