import { TokenMode } from '../types';

export function getShouldUseUAT(tokenMode: TokenMode = TokenMode.AUTO, useUAT?: boolean) {
  switch (tokenMode) {
    case TokenMode.USER_ACCESS_TOKEN: {
      return true;
    }
    case TokenMode.TENANT_ACCESS_TOKEN: {
      return false;
    }
    case TokenMode.AUTO:
    default: {
      return useUAT;
    }
  }
}
