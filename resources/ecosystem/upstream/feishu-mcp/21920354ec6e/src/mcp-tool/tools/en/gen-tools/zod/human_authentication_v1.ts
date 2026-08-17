import { z } from 'zod';
export type humanAuthenticationV1ToolName = 'human_authentication.v1.identity.create';
export const humanAuthenticationV1IdentityCreate = {
  project: 'human_authentication',
  name: 'human_authentication.v1.identity.create',
  sdkName: 'human_authentication.v1.identity.create',
  path: '/open-apis/human_authentication/v1/identities',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Identity Authentication-Upload Identity Information-This interface is used to upload the identity information for real-name authentication. Before arousing active living body authentication, this interface needs to be used for real-name authentication',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      identity_name: z.string().describe('Name'),
      identity_code: z.string().describe('User identification number'),
      mobile: z.string().describe('Mobile phone').optional(),
    }),
    params: z.object({
      user_id: z
        .string()
        .describe(
          'The unique identifier of the user(For the ID type used, see the next parameter description, the difference and acquisition of different ID types, refer to the document: [How to obtain User ID, Open ID and Union ID?])',
        ),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
  },
};
export const humanAuthenticationV1Tools = [humanAuthenticationV1IdentityCreate];
