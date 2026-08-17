import { z } from 'zod';
export type applicationV5ToolName = 'application.v5.application.favourite' | 'application.v5.application.recommend';
export const applicationV5ApplicationFavourite = {
  project: 'application',
  name: 'application.v5.application.favourite',
  sdkName: 'application.v5.application.favourite',
  path: '/open-apis/application/v5/applications/favourite',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Workplace-My favorite-获取用户常用的应用',
  accessTokens: ['user'],
  schema: {
    params: z
      .object({
        language: z
          .enum(['zh_cn', 'en_us', 'ja_jp'])
          .describe('Options:zh_cn(Chinese 中文),en_us(English 英文),ja_jp(Japanese 日文)')
          .optional(),
        page_token: z.string().optional(),
        page_size: z.number().optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const applicationV5ApplicationRecommend = {
  project: 'application',
  name: 'application.v5.application.recommend',
  sdkName: 'application.v5.application.recommend',
  path: '/open-apis/application/v5/applications/recommend',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Workplace-My favorite-获取企业推荐的应用',
  accessTokens: ['user'],
  schema: {
    params: z
      .object({
        language: z
          .enum(['zh_cn', 'en_us', 'ja_jp'])
          .describe('Options:zh_cn(Chinese 中文),en_us(English 英文),ja_jp(Japanese 日文)')
          .optional(),
        recommend_type: z
          .enum(['user_unremovable', 'user_removable'])
          .describe(
            'Options:user_unremovable(UserUnremovable 用户不可移除的推荐应用列表),user_removable(UserRemovable 用户可移除的推荐应用列表)',
          )
          .optional(),
        page_token: z.string().optional(),
        page_size: z.number().optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const applicationV5Tools = [applicationV5ApplicationFavourite, applicationV5ApplicationRecommend];
