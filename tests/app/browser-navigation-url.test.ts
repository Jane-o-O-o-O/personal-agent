import { describe, expect, it } from 'vitest';
import { normalizeBrowserNavigationUrl } from '../../src/server/browser/index.js';

describe('browser address bar normalization', () => {
  it('opens a bare domain over HTTPS and local development addresses over HTTP', () => {
    expect(normalizeBrowserNavigationUrl('www.baidu.com')).toBe('https://www.baidu.com/');
    expect(normalizeBrowserNavigationUrl('example.com/path?q=1')).toBe('https://example.com/path?q=1');
    expect(normalizeBrowserNavigationUrl('localhost:4099/fixture')).toBe('http://localhost:4099/fixture');
    expect(normalizeBrowserNavigationUrl('127.0.0.1:4099')).toBe('http://127.0.0.1:4099/');
  });

  it('sends ordinary Chinese and English terms to Baidu search', () => {
    expect(normalizeBrowserNavigationUrl('上海地铁末班车')).toBe('https://www.baidu.com/s?wd=%E4%B8%8A%E6%B5%B7%E5%9C%B0%E9%93%81%E6%9C%AB%E7%8F%AD%E8%BD%A6');
    expect(normalizeBrowserNavigationUrl('weather today')).toBe('https://www.baidu.com/s?wd=weather+today');
  });

  it('rejects unsafe URL schemes and credential-bearing URLs', () => {
    for (const value of ['file:///etc/passwd', 'javascript:alert(1)', 'ftp://example.com', 'https://user:pass@example.com'])
      expect(() => normalizeBrowserNavigationUrl(value)).toThrowError(expect.objectContaining({ code: 'INVALID_BROWSER_URL', statusCode: 400 }));
  });
});
