import { z } from 'zod';
export type mdmV1ToolName = 'mdm.v1.userAuthDataRelation.bind' | 'mdm.v1.userAuthDataRelation.unbind';
export const mdmV1UserAuthDataRelationBind = {
  project: 'mdm',
  name: 'mdm.v1.userAuthDataRelation.bind',
  sdkName: 'mdm.v1.userAuthDataRelation.bind',
  path: '/open-apis/mdm/v1/user_auth_data_relations/bind',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu Master Data Management-Data dimension-User data dimension binding-Through this interface, a type of data dimension can be bound to users under a specified application, and batch authorization can be granted to multiple users at the same time',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      root_dimension_type: z.string().describe('data type encoding'),
      sub_dimension_types: z.array(z.string()).describe('data encoding list'),
      authorized_user_ids: z.array(z.string()).describe("authorizer's lark id"),
      uams_app_id: z.string().describe('application id in uams system'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const mdmV1UserAuthDataRelationUnbind = {
  project: 'mdm',
  name: 'mdm.v1.userAuthDataRelation.unbind',
  sdkName: 'mdm.v1.userAuthDataRelation.unbind',
  path: '/open-apis/mdm/v1/user_auth_data_relations/unbind',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu Master Data Management-Data dimension-User data dimension unbinding-Through this interface, a type of data dimension can be released for a specified user under a specified application',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      root_dimension_type: z.string().describe('data type encoding'),
      sub_dimension_types: z.array(z.string()).describe('data encoding list'),
      authorized_user_ids: z.array(z.string()).describe("authorizer's lark id"),
      uams_app_id: z.string().describe('application id in uams system'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const mdmV1Tools = [mdmV1UserAuthDataRelationBind, mdmV1UserAuthDataRelationUnbind];
