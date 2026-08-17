import { filterTools } from '../../../src/mcp-tool/utils/filter-tools';
import { McpTool, ToolsFilterOptions, TokenMode } from '../../../src/mcp-tool/types';
import { ProjectName, ToolName } from '../../../src/mcp-tool/tools';

describe('filterTools', () => {
  const mockTools: McpTool[] = [
    {
      name: 'im.v1.message.create',
      description: '发送消息',
      schema: {},
      project: 'im',
      accessTokens: ['user', 'tenant'],
    },
    {
      name: 'im.v1.chat.create',
      description: '创建群',
      schema: {},
      project: 'im',
      accessTokens: ['user', 'tenant'],
    },
    {
      name: 'wiki.v1.node.search',
      description: '搜索知识库节点',
      schema: {},
      project: 'wiki',
      accessTokens: ['user'],
    },
    {
      name: 'docx.v1.document.rawContent',
      description: '获取文档内容',
      schema: {},
      project: 'docx',
      accessTokens: ['tenant'],
    },
  ];

  it('应该按工具名称过滤', () => {
    const options: ToolsFilterOptions = {
      allowTools: ['im.v1.message.create', 'docx.v1.document.rawContent'] as ToolName[],
    };

    const result = filterTools(mockTools, options);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('im.v1.message.create');
    expect(result[1].name).toBe('docx.v1.document.rawContent');
  });

  it('应该按项目名称过滤', () => {
    const options: ToolsFilterOptions = {
      allowProjects: ['im'] as ProjectName[],
    };

    const result = filterTools(mockTools, options);
    expect(result).toHaveLength(2);
    expect(result[0].project).toBe('im');
    expect(result[1].project).toBe('im');
  });

  it('应该按token模式过滤 - user_access_token', () => {
    const options: ToolsFilterOptions = {
      tokenMode: TokenMode.USER_ACCESS_TOKEN,
      allowTools: mockTools.map((tool) => tool.name) as ToolName[],
    };

    const result = filterTools(mockTools, options);
    expect(result).toHaveLength(3);
    expect(result).toContainEqual(expect.objectContaining({ name: 'im.v1.message.create' }));
    expect(result).toContainEqual(expect.objectContaining({ name: 'im.v1.chat.create' }));
    expect(result).toContainEqual(expect.objectContaining({ name: 'wiki.v1.node.search' }));
    expect(result).not.toContainEqual(expect.objectContaining({ name: 'docx.v1.document.rawContent' }));
  });

  it('应该按token模式过滤 - tenant_access_token', () => {
    const options: ToolsFilterOptions = {
      tokenMode: TokenMode.TENANT_ACCESS_TOKEN,
      allowTools: mockTools.map((tool) => tool.name) as ToolName[],
    };

    const result = filterTools(mockTools, options);
    expect(result).toHaveLength(3);
    expect(result).toContainEqual(expect.objectContaining({ name: 'im.v1.message.create' }));
    expect(result).toContainEqual(expect.objectContaining({ name: 'im.v1.chat.create' }));
    expect(result).toContainEqual(expect.objectContaining({ name: 'docx.v1.document.rawContent' }));
    expect(result).not.toContainEqual(expect.objectContaining({ name: 'wiki.v1.node.search' }));
  });

  it('应该按token模式过滤 - unknown', () => {
    const options: ToolsFilterOptions = {
      tokenMode: 'unknown' as TokenMode,
      allowTools: mockTools.map((tool) => tool.name) as ToolName[],
    };

    const result = filterTools(mockTools, options);
    expect(result).toHaveLength(4);
  });

  it('应该按多个条件组合过滤', () => {
    const options: ToolsFilterOptions = {
      allowProjects: ['im'] as ProjectName[],
      tokenMode: TokenMode.USER_ACCESS_TOKEN,
    };

    const result = filterTools(mockTools, options);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('im.v1.message.create');
    expect(result[1].name).toBe('im.v1.chat.create');
  });

  it('当使用auto模式时应该返回所有工具', () => {
    const options: ToolsFilterOptions = {
      tokenMode: TokenMode.AUTO,
      allowTools: mockTools.map((tool) => tool.name) as ToolName[],
    };

    const result = filterTools(mockTools, options);
    expect(result).toHaveLength(4);
  });

  it('应该处理工具和令牌类型同时过滤', () => {
    const options: ToolsFilterOptions = {
      allowTools: ['im.v1.message.create', 'docx.v1.document.rawContent'],
      tokenMode: TokenMode.USER_ACCESS_TOKEN,
    };

    const result = filterTools(mockTools, options);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('im.v1.message.create');
  });

  it('应该处理工具没有accessTokens属性的情况', () => {
    const toolsWithoutAccessTokens: McpTool[] = [
      {
        name: 'test.tool',
        description: '测试工具',
        schema: {},
        project: 'test',
        // 没有accessTokens属性
      },
    ];

    // 测试user_access_token模式
    const filteredUser = filterTools(toolsWithoutAccessTokens, {
      tokenMode: TokenMode.USER_ACCESS_TOKEN,
      allowTools: ['test.tool'] as unknown as ToolName[],
    });
    expect(filteredUser.length).toBe(0);

    // 测试tenant_access_token模式
    const filteredTenant = filterTools(toolsWithoutAccessTokens, {
      tokenMode: TokenMode.TENANT_ACCESS_TOKEN,
      allowTools: ['test.tool'] as unknown as ToolName[],
    });
    expect(filteredTenant.length).toBe(0);

    // 测试auto模式
    const filteredAuto = filterTools(toolsWithoutAccessTokens, {
      tokenMode: TokenMode.AUTO,
      allowTools: ['test.tool'] as unknown as ToolName[],
    });
    expect(filteredAuto.length).toBe(1);
  });

  it('应该处理不包含任何过滤条件的情况', () => {
    const filtered = filterTools(mockTools, {});
    expect(filtered.length).toBe(0); // 因为没有指定allowTools和allowProjects
  });

  it('应该组合多个过滤条件 - 允许项目和名称', () => {
    const options: ToolsFilterOptions = {
      allowProjects: ['docx'],
      allowTools: ['im.v1.message.create'],
    };

    const result = filterTools(mockTools, options);
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'im.v1.message.create' }),
        expect.objectContaining({ name: 'docx.v1.document.rawContent' }),
      ]),
    );
  });
});
