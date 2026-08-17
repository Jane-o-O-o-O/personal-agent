import axios from 'axios';
import { USER_AGENT } from '../../src/utils/constants';
import { oapiHttpInstance } from '../../src/utils/http-instance';

// 我们需要在导入被测模块前先模拟axios
jest.mock('axios', () => {
  return {
    create: jest.fn(() => ({
      interceptors: {
        request: {
          use: jest.fn((successFn) => {
            // 保存拦截器函数以便测试
            (axios as any).mockRequestInterceptor = successFn;
          }),
        },
        response: {
          use: jest.fn((successFn) => {
            // 保存拦截器函数以便测试
            (axios as any).mockResponseInterceptor = successFn;
          }),
        },
      },
    })),
  };
});

describe('http-instance', () => {
  it('应该创建axios实例', () => {
    const { oapiHttpInstance } = require('../../src/utils/http-instance');
    expect(axios.create).toHaveBeenCalled();
    expect(oapiHttpInstance).toBeDefined();
  });

  it('应该正确设置请求拦截器', () => {
    // 测试请求拦截器逻辑
    const mockRequest = { headers: {} };
    const interceptor = (axios as any).mockRequestInterceptor;

    expect(typeof interceptor).toBe('function');
    const result = interceptor(mockRequest);

    expect(result).toBe(mockRequest);
    expect(result.headers['User-Agent']).toBe(USER_AGENT);
  });

  it('当请求没有headers属性时应该正确处理', () => {
    // 测试请求拦截器处理没有headers的情况
    const mockRequest = {};
    const interceptor = (axios as any).mockRequestInterceptor;

    const result = interceptor(mockRequest);

    expect(result).toBe(mockRequest);
    // 不应该添加任何headers
    expect(mockRequest).not.toHaveProperty('headers');
  });

  it('应该正确设置响应拦截器', () => {
    // 测试响应拦截器逻辑
    const mockResponse = { data: { key: 'value' } };
    const interceptor = (axios as any).mockResponseInterceptor;

    expect(typeof interceptor).toBe('function');
    const result = interceptor(mockResponse);

    expect(result).toBe(mockResponse.data);
  });
});
