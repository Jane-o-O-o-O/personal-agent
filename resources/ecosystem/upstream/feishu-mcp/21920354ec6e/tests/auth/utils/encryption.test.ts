import { EncryptionUtil } from '../../../src/auth/utils/encryption';
import { AUTH_CONFIG } from '../../../src/auth/config';
import crypto from 'crypto';

// Mock crypto
jest.mock('crypto');
const mockCrypto = crypto as jest.Mocked<typeof crypto>;

describe('EncryptionUtil', () => {
  let encryptionUtil: EncryptionUtil;
  const testKey = 'a'.repeat(64); // 32 bytes hex string

  beforeEach(() => {
    jest.clearAllMocks();
    encryptionUtil = new EncryptionUtil(testKey);
  });

  describe('encryption', () => {
    it('should encrypt data correctly', () => {
      const testData = 'test data';
      const mockIv = Buffer.from('1234567890123456');
      const mockCipher = {
        update: jest.fn().mockReturnValue('encrypted'),
        final: jest.fn().mockReturnValue('data'),
      };

      (mockCrypto.randomBytes as jest.Mock).mockReturnValue(mockIv);
      mockCrypto.createCipheriv.mockReturnValue(mockCipher as any);

      const result = encryptionUtil.encrypt(testData);

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(AUTH_CONFIG.ENCRYPTION.IV_LENGTH);
      expect(mockCrypto.createCipheriv).toHaveBeenCalledWith(
        AUTH_CONFIG.ENCRYPTION.ALGORITHM,
        Buffer.from(testKey, 'hex'),
        mockIv,
      );
      expect(mockCipher.update).toHaveBeenCalledWith(testData, 'utf8', 'hex');
      expect(mockCipher.final).toHaveBeenCalledWith('hex');
      expect(result).toBe(mockIv.toString('hex') + ':' + 'encrypteddata');
    });
  });

  describe('decryption', () => {
    it('should decrypt data correctly', () => {
      const encryptedData = '31323334353637383930313233343536:encrypteddata';
      const mockDecipher = {
        update: jest.fn().mockReturnValue('decrypted'),
        final: jest.fn().mockReturnValue(' data'),
      };

      mockCrypto.createDecipheriv.mockReturnValue(mockDecipher as any);

      const result = encryptionUtil.decrypt(encryptedData);

      const expectedIv = Buffer.from('31323334353637383930313233343536', 'hex');
      expect(mockCrypto.createDecipheriv).toHaveBeenCalledWith(
        AUTH_CONFIG.ENCRYPTION.ALGORITHM,
        Buffer.from(testKey, 'hex'),
        expectedIv,
      );
      expect(mockDecipher.update).toHaveBeenCalledWith('encrypteddata', 'hex', 'utf8');
      expect(mockDecipher.final).toHaveBeenCalledWith('utf8');
      expect(result).toBe('decrypted data');
    });

    it('should throw error for invalid encrypted data format', () => {
      const invalidData = 'invalid-format';

      expect(() => encryptionUtil.decrypt(invalidData)).toThrow('Invalid encrypted data format');
    });

    it('should throw error for encrypted data with multiple colons', () => {
      const encryptedData = '31323334353637383930313233343536:encrypted:data:with:colons';

      expect(() => encryptionUtil.decrypt(encryptedData)).toThrow('Invalid encrypted data format');
    });
  });

  describe('generateKey', () => {
    it('should generate key with correct length', () => {
      const mockRandomBytes = Buffer.from('a'.repeat(AUTH_CONFIG.ENCRYPTION.KEY_LENGTH));
      (mockCrypto.randomBytes as jest.Mock).mockReturnValue(mockRandomBytes);

      const result = EncryptionUtil.generateKey();

      expect(mockCrypto.randomBytes).toHaveBeenCalledWith(AUTH_CONFIG.ENCRYPTION.KEY_LENGTH);
      expect(result).toBe(mockRandomBytes.toString('hex'));
    });
  });

  describe('integration', () => {
    // Reset mocks and use real crypto for these tests
    beforeEach(() => {
      jest.resetModules();
      jest.unmock('crypto');
    });

    afterEach(() => {
      jest.doMock('crypto');
    });

    it('should encrypt and decrypt data correctly end-to-end', () => {
      const realCrypto = require('crypto');
      const { EncryptionUtil: RealEncryptionUtil } = require('../../../src/auth/utils/encryption');

      // Generate a real key
      const realKey = realCrypto.randomBytes(32).toString('hex');
      const realEncryptionUtil = new RealEncryptionUtil(realKey);

      const testData = 'Hello, World! This is a test message.';

      // Encrypt the data
      const encrypted = realEncryptionUtil.encrypt(testData);

      // Verify encrypted format (iv:encrypted_data)
      expect(encrypted).toMatch(/^[0-9a-f]{32}:[0-9a-f]+$/);

      // Decrypt the data
      const decrypted = realEncryptionUtil.decrypt(encrypted);

      // Verify the result
      expect(decrypted).toBe(testData);
    });

    it('should produce different encrypted outputs for same input', () => {
      const realCrypto = require('crypto');
      const { EncryptionUtil: RealEncryptionUtil } = require('../../../src/auth/utils/encryption');

      const realKey = realCrypto.randomBytes(32).toString('hex');
      const realEncryptionUtil = new RealEncryptionUtil(realKey);

      const testData = 'same input data';

      const encrypted1 = realEncryptionUtil.encrypt(testData);
      const encrypted2 = realEncryptionUtil.encrypt(testData);

      // Should be different due to random IV
      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      expect(realEncryptionUtil.decrypt(encrypted1)).toBe(testData);
      expect(realEncryptionUtil.decrypt(encrypted2)).toBe(testData);
    });
  });
});
