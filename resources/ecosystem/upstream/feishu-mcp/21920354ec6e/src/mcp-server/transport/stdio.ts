import express from 'express';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { InitTransportServerFunction } from '../shared';
import { authStore } from '../../auth';
import { LarkAuthHandlerLocal } from '../../auth';
import { logger } from '../../utils/logger';

export const initStdioServer: InitTransportServerFunction = async (
  getNewServer,
  options,
  { needAuthFlow } = { needAuthFlow: false },
) => {
  const { userAccessToken, appId, oauth } = options;

  let authHandler: LarkAuthHandlerLocal | undefined;

  if (!userAccessToken && needAuthFlow) {
    const app = express();
    app.use(express.json());
    authHandler = new LarkAuthHandlerLocal(app, options);
    if (oauth) {
      authHandler.setupRoutes();
    }
  }

  const transport = new StdioServerTransport();

  const userAccessTokenValue = userAccessToken
    ? userAccessToken
    : appId
      ? { getter: async () => await authStore.getLocalAccessToken(appId) }
      : undefined;

  const mcpServer = getNewServer({ ...options, userAccessToken: userAccessTokenValue }, authHandler);

  logger.info(
    `[StdioServerTransport] Connecting to MCP Server, userAccessToken: ${Boolean(userAccessToken)}, appId: ${appId}`,
  );
  mcpServer.connect(transport).catch((error) => {
    logger.error(`[StdioServerTransport] MCP Connect Error: ${error}`);
    process.exit(1);
  });
};
