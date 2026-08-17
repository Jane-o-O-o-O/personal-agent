import { cleanEnvArgs } from '../../src/utils/clean-env-args';

describe('cleanEnvArgs', () => {
  it('should remove undefined values from the object', () => {
    const input = {
      validKey: 'validValue',
      undefinedKey: undefined,
      anotherValidKey: 'anotherValue',
    };

    const result = cleanEnvArgs(input);

    expect(result).toEqual({
      validKey: 'validValue',
      anotherValidKey: 'anotherValue',
    });
  });

  it('should remove empty string values', () => {
    const input = {
      validKey: 'validValue',
      emptyKey: '',
      anotherValidKey: 'anotherValue',
    };

    const result = cleanEnvArgs(input);

    expect(result).toEqual({
      validKey: 'validValue',
      anotherValidKey: 'anotherValue',
    });
  });

  it('should handle an empty object', () => {
    const input = {};

    const result = cleanEnvArgs(input);

    expect(result).toEqual({});
  });

  it('should handle object with all undefined values', () => {
    const input = {
      key1: undefined,
      key2: undefined,
      key3: undefined,
    };

    const result = cleanEnvArgs(input);

    expect(result).toEqual({});
  });

  it('should handle object with all valid values', () => {
    const input = {
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    };

    const result = cleanEnvArgs(input);

    expect(result).toEqual({
      key1: 'value1',
      key2: 'value2',
      key3: 'value3',
    });
  });

  it('should handle mixed undefined, empty strings, and valid values', () => {
    const input = {
      validKey: 'validValue',
      undefinedKey: undefined,
      emptyKey: '',
      anotherValidKey: 'anotherValue',
      nullishKey: undefined,
    };

    const result = cleanEnvArgs(input);

    expect(result).toEqual({
      validKey: 'validValue',
      anotherValidKey: 'anotherValue',
    });
  });

  it('should preserve whitespace-only strings as they are truthy', () => {
    const input = {
      validKey: 'validValue',
      whitespaceKey: '   ',
      tabKey: '\t',
      newlineKey: '\n',
    };

    const result = cleanEnvArgs(input);

    expect(result).toEqual({
      validKey: 'validValue',
      whitespaceKey: '   ',
      tabKey: '\t',
      newlineKey: '\n',
    });
  });

  it('should handle numeric strings', () => {
    const input = {
      zeroString: '0',
      numberString: '123',
      undefinedKey: undefined,
    };

    const result = cleanEnvArgs(input);

    expect(result).toEqual({
      zeroString: '0',
      numberString: '123',
    });
  });
});
