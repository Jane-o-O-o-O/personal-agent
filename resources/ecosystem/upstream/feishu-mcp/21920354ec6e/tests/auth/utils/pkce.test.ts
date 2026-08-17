import crypto from 'crypto';
import { generateCodeVerifier, generateCodeChallenge, generatePKCEPair } from '../../../src/auth/utils/pkce';

describe('PKCE Utils', () => {
  describe('generateCodeVerifier', () => {
    it('应该生成一个base64url编码的code verifier', () => {
      const codeVerifier = generateCodeVerifier();

      expect(typeof codeVerifier).toBe('string');
      expect(codeVerifier.length).toBeGreaterThan(0);

      // 检查是否是有效的base64url格式（不包含+, /, =字符）
      expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('应该每次生成不同的code verifier', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();

      expect(verifier1).not.toBe(verifier2);
    });

    it('应该生成合适长度的code verifier', () => {
      const codeVerifier = generateCodeVerifier();

      // 32字节的随机数据经过base64url编码后应该是43个字符（无padding）
      expect(codeVerifier.length).toBe(43);
    });
  });

  describe('generateCodeChallenge', () => {
    it('应该为给定的code verifier生成正确的code challenge', () => {
      const codeVerifier = 'test-code-verifier-12345';
      const codeChallenge = generateCodeChallenge(codeVerifier);

      expect(typeof codeChallenge).toBe('string');
      expect(codeChallenge.length).toBeGreaterThan(0);

      // 检查是否是有效的base64url格式
      expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('应该为相同的code verifier生成相同的code challenge', () => {
      const codeVerifier = 'test-code-verifier-12345';
      const challenge1 = generateCodeChallenge(codeVerifier);
      const challenge2 = generateCodeChallenge(codeVerifier);

      expect(challenge1).toBe(challenge2);
    });

    it('应该为不同的code verifier生成不同的code challenge', () => {
      const verifier1 = 'test-code-verifier-1';
      const verifier2 = 'test-code-verifier-2';

      const challenge1 = generateCodeChallenge(verifier1);
      const challenge2 = generateCodeChallenge(verifier2);

      expect(challenge1).not.toBe(challenge2);
    });

    it('应该生成合适长度的code challenge', () => {
      const codeVerifier = 'test-code-verifier-12345';
      const codeChallenge = generateCodeChallenge(codeVerifier);

      // SHA256哈希结果经过base64url编码后应该是43个字符（无padding）
      expect(codeChallenge.length).toBe(43);
    });

    it('应该正确实现SHA256+base64url编码', () => {
      const codeVerifier = 'test-verifier';
      const expectedChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

      const actualChallenge = generateCodeChallenge(codeVerifier);

      expect(actualChallenge).toBe(expectedChallenge);
    });

    it('应该为已知的code verifier生成正确的code challenge（RFC测试向量）', () => {
      const codeVerifier = 'dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk';
      const expectedChallenge = 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM';

      const codeChallenge = generateCodeChallenge(codeVerifier);

      expect(codeChallenge).toBe(expectedChallenge);
    });
  });

  describe('generatePKCEPair', () => {
    it('应该生成包含codeVerifier和codeChallenge的对象', () => {
      const pkcePair = generatePKCEPair();

      expect(pkcePair).toHaveProperty('codeVerifier');
      expect(pkcePair).toHaveProperty('codeChallenge');
      expect(typeof pkcePair.codeVerifier).toBe('string');
      expect(typeof pkcePair.codeChallenge).toBe('string');
    });

    it('应该生成有效的PKCE对', () => {
      const { codeVerifier, codeChallenge } = generatePKCEPair();

      // 验证生成的challenge是否与verifier匹配
      const expectedChallenge = generateCodeChallenge(codeVerifier);
      expect(codeChallenge).toBe(expectedChallenge);
    });

    it('应该每次生成不同的PKCE对', () => {
      const pair1 = generatePKCEPair();
      const pair2 = generatePKCEPair();

      expect(pair1.codeVerifier).not.toBe(pair2.codeVerifier);
      expect(pair1.codeChallenge).not.toBe(pair2.codeChallenge);
    });

    it('应该生成符合规范的PKCE对', () => {
      const { codeVerifier, codeChallenge } = generatePKCEPair();

      // 验证code verifier格式
      expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(codeVerifier.length).toBe(43);

      // 验证code challenge格式
      expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(codeChallenge.length).toBe(43);

      // 验证code challenge是基于code verifier正确生成的
      const expectedChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
      expect(codeChallenge).toBe(expectedChallenge);
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该处理空字符串的code verifier', () => {
      const codeChallenge = generateCodeChallenge('');

      expect(typeof codeChallenge).toBe('string');
      expect(codeChallenge.length).toBe(43);
    });

    it('应该处理非常长的code verifier', () => {
      const longVerifier = 'a'.repeat(1000);
      const codeChallenge = generateCodeChallenge(longVerifier);

      expect(typeof codeChallenge).toBe('string');
      expect(codeChallenge.length).toBe(43);
    });

    it('应该处理包含特殊字符的code verifier', () => {
      const specialVerifier = 'test!@#$%^&*()_+-={}[]|\\:";\'<>?,./';
      const codeChallenge = generateCodeChallenge(specialVerifier);

      expect(typeof codeChallenge).toBe('string');
      expect(codeChallenge.length).toBe(43);
    });
  });
});
