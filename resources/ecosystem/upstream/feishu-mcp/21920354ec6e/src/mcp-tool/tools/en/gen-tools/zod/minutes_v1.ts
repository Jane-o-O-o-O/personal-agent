import { z } from 'zod';
export type minutesV1ToolName =
  | 'minutes.v1.minute.get'
  | 'minutes.v1.minuteMedia.get'
  | 'minutes.v1.minuteStatistics.get';
export const minutesV1MinuteGet = {
  project: 'minutes',
  name: 'minutes.v1.minute.get',
  sdkName: 'minutes.v1.minute.get',
  path: '/open-apis/minutes/v1/minutes/:minute_token',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Minutes-Minutes Meta-Get minutes meta-Through this api, you can get a basic overview of Lark Minutes, including `owner_id`, `create_time`, title, cover picture, duration and URL',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      minute_token: z
        .string()
        .describe(
          'The unique identifier for Minutes. It can be obtained from the URL link of the Minutes, usually the last string of characters: https://sample.feishu.cn/minutes/==obcnq3b9jl72l83w4f14xxxx==',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const minutesV1MinuteMediaGet = {
  project: 'minutes',
  name: 'minutes.v1.minuteMedia.get',
  sdkName: 'minutes.v1.minuteMedia.get',
  path: '/open-apis/minutes/v1/minutes/:minute_token/media',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Minutes-Minutes audio or video file-Download minutes audio or video file-Get the audio or video file of minutes',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      minute_token: z
        .string()
        .describe(
          'The unique identifier for Minutes. It can be obtained from the URL link of the Minutes, usually the last string of characters: https://sample.feishu.cn/minutes/==obcnq3b9jl72l83w4f14xxxx==',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const minutesV1MinuteStatisticsGet = {
  project: 'minutes',
  name: 'minutes.v1.minuteStatistics.get',
  sdkName: 'minutes.v1.minuteStatistics.get',
  path: '/open-apis/minutes/v1/minutes/:minute_token/statistics',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Minutes-Minutes statistics-Get minutes statistics-Through this API, you can get access statistics of Feishu Minutes, including PV, UV, visited user id, visited user timestamp',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      minute_token: z
        .string()
        .describe(
          'The unique identifier for Minutes. It can be obtained from the URL link of the Minutes, usually the last string of characters: https://sample.feishu.cn/minutes/==obcnq3b9jl72l83w4f14xxxx==',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const minutesV1Tools = [minutesV1MinuteGet, minutesV1MinuteMediaGet, minutesV1MinuteStatisticsGet];
