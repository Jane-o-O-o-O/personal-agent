import { caseTransf } from '../../../src/mcp-tool/utils/case-transf';

describe('caseTransf', () => {
  const testToolName = 'im.v1.chat.create';

  it('应该将点号转换为下划线 (snake case)', () => {
    const result = caseTransf(testToolName, 'snake');
    expect(result).toBe('im_v1_chat_create');
  });

  it('应该将点号转换为驼峰命名 (camel case)', () => {
    const result = caseTransf(testToolName, 'camel');
    expect(result).toBe('imV1ChatCreate');
  });

  it('应该将点号转换为短横线 (kebab case)', () => {
    const result = caseTransf(testToolName, 'kebab');
    expect(result).toBe('im-v1-chat-create');
  });

  it('不指定时应该保持原样 (dot case)', () => {
    const result = caseTransf(testToolName);
    expect(result).toBe('im.v1.chat.create');
  });

  it('处理已经是目标格式的工具名', () => {
    const kebabCaseName = 'im-v1-chat-create';
    const result = caseTransf(kebabCaseName, 'kebab');
    expect(result).toBe('im-v1-chat-create');
  });

  it('处理空字符串', () => {
    const result = caseTransf('', 'camel');
    expect(result).toBe('');
  });

  it('处理没有点号的工具名', () => {
    const noDotName = 'createchat';
    const result = caseTransf(noDotName, 'snake');
    expect(result).toBe('createchat');
  });
});
