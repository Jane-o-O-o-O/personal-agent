import { z } from 'zod';
export type momentsV1ToolName = 'moments.v1.post.get';
export const momentsV1PostGet = {
  project: 'moments',
  name: 'moments.v1.post.get',
  sdkName: 'moments.v1.post.get',
  path: '/open-apis/moments/v1/posts/:post_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Moments-Post-Query post information-Query post entity data information by post id',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      post_id: z
        .string()
        .describe(
          'Post ID, which can be got from the data returned by the "Publish moment" interface or the "Moment posted" event',
        ),
    }),
  },
};
export const momentsV1Tools = [momentsV1PostGet];
