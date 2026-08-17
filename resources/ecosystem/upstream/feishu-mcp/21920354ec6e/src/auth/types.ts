import { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import { OAuthClientInformationFull } from '@modelcontextprotocol/sdk/shared/auth.js';

export interface StorageData {
  localTokens?: { [appId: string]: string }; // encrypted local tokens by appId
  tokens: { [key: string]: AuthInfo }; // encrypted tokens
  clients: { [key: string]: OAuthClientInformationFull }; // encrypted clients
}
