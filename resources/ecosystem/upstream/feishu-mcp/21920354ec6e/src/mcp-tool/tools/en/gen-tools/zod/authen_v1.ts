import { z } from 'zod';
export type authenV1ToolName = 'authen.v1.userInfo.get';
export const authenV1UserInfoGet = {
  project: 'authen',
  name: 'authen.v1.userInfo.get',
  sdkName: 'authen.v1.userInfo.get',
  path: '/open-apis/authen/v1/user_info',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Authenticate and Authorize-Login state management-Get User Information-Get related user info via `user_access_token`',
  accessTokens: ['user'],
  schema: {
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const authenV1Tools = [authenV1UserInfoGet];
