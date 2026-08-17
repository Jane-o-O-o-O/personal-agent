import { z } from 'zod';
export type acsV1ToolName =
  | 'acs.v1.accessRecord.list'
  | 'acs.v1.device.list'
  | 'acs.v1.ruleExternal.create'
  | 'acs.v1.ruleExternal.delete'
  | 'acs.v1.ruleExternal.deviceBind'
  | 'acs.v1.ruleExternal.get'
  | 'acs.v1.user.get'
  | 'acs.v1.user.list'
  | 'acs.v1.user.patch'
  | 'acs.v1.visitor.create'
  | 'acs.v1.visitor.delete';
export const acsV1AccessRecordList = {
  project: 'acs',
  name: 'acs.v1.accessRecord.list',
  sdkName: 'acs.v1.accessRecord.list',
  path: '/open-apis/acs/v1/access_records',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Smart Access Control-Access Record-Get access record list',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().optional(),
      page_token: z.string().optional(),
      from: z.number().describe('Record start time, in seconds'),
      to: z.number().describe('Record the end time, in seconds,Limit: to-from < 30 days'),
      device_id: z.string().describe('Device ID, Used to access recognition records of a specified device').optional(),
      user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('User ID type').optional(),
    }),
  },
};
export const acsV1DeviceList = {
  project: 'acs',
  name: 'acs.v1.device.list',
  sdkName: 'acs.v1.device.list',
  path: '/open-apis/acs/v1/devices',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Smart Access Control-Device-Get device list',
  accessTokens: ['tenant'],
  schema: {},
};
export const acsV1RuleExternalCreate = {
  project: 'acs',
  name: 'acs.v1.ruleExternal.create',
  sdkName: 'acs.v1.ruleExternal.create',
  path: '/open-apis/acs/v1/rule_external',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Smart Access Control-Rule-Create or update rule-rule create or update rule',
  accessTokens: ['user'],
  schema: {
    data: z.object({
      rule: z
        .object({
          id: z.string().describe('rule id').optional(),
          name: z.string().describe('rule name').optional(),
          devices: z
            .array(
              z.object({
                id: z.string().describe('device id').optional(),
                name: z.string().describe('device name').optional(),
              }),
            )
            .describe('devices included')
            .optional(),
          user_count: z.string().describe('employees num').optional(),
          users: z
            .array(
              z.object({
                user_type: z
                  .number()
                  .describe('user type Options:1(user employee),2(department),10(tenant all staff),11(guest visitor)'),
                user_id: z.string().describe('user id').optional(),
                user_name: z.string().describe('user name').optional(),
                phone_num: z.string().describe('phone num').optional(),
                department_id: z.string().describe('department id').optional(),
              }),
            )
            .describe('employees list')
            .optional(),
          visitor_count: z.string().describe('visitors num').optional(),
          visitors: z
            .array(
              z.object({
                user_type: z
                  .number()
                  .describe('user type Options:1(user employee),2(department),10(tenant all staff),11(guest visitor)'),
                user_id: z.string().describe('visitor id').optional(),
                user_name: z.string().describe('visitor name').optional(),
                phone_num: z.string().describe('phone num').optional(),
                department_id: z.string().describe('department id').optional(),
              }),
            )
            .describe('visitors list')
            .optional(),
          remind_face: z.boolean().describe('is remind face entry').optional(),
          opening_time: z
            .object({
              valid_day: z
                .object({ start_day: z.number().describe('start date'), end_day: z.number().describe('end date') })
                .describe('valid date')
                .optional(),
              weekdays: z.array(z.number()).describe('valid week').optional(),
              day_times: z
                .array(
                  z.object({
                    start_hhmm: z.number().describe('start time'),
                    end_hhmm: z.number().describe('end time'),
                  }),
                )
                .describe('valid time')
                .optional(),
            })
            .describe('opening time period')
            .optional(),
          is_temp: z.boolean().describe('is temporary rule').optional(),
        })
        .describe('rule info'),
    }),
    params: z
      .object({
        rule_id: z.string().describe('rule id,create if null,update if no null').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const acsV1RuleExternalDelete = {
  project: 'acs',
  name: 'acs.v1.ruleExternal.delete',
  sdkName: 'acs.v1.ruleExternal.delete',
  path: '/open-apis/acs/v1/rule_external',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Smart Access Control-Rule-Delete rule-rule delete',
  accessTokens: ['user'],
  schema: {
    params: z.object({ rule_id: z.string() }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const acsV1RuleExternalDeviceBind = {
  project: 'acs',
  name: 'acs.v1.ruleExternal.deviceBind',
  sdkName: 'acs.v1.ruleExternal.deviceBind',
  path: '/open-apis/acs/v1/rule_external/device_bind',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Smart Access Control-Rule-Device bind rule-device bind rules',
  accessTokens: ['user'],
  schema: {
    data: z.object({
      device_id: z.string().describe('device id'),
      rule_ids: z.array(z.string()).describe('rule list'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const acsV1RuleExternalGet = {
  project: 'acs',
  name: 'acs.v1.ruleExternal.get',
  sdkName: 'acs.v1.ruleExternal.get',
  path: '/open-apis/acs/v1/rule_external',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Smart Access Control-Rule-Get rule info-rule info get',
  accessTokens: ['user'],
  schema: {
    params: z
      .object({
        device_id: z.string().optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const acsV1UserGet = {
  project: 'acs',
  name: 'acs.v1.user.get',
  sdkName: 'acs.v1.user.get',
  path: '/open-apis/acs/v1/users/:user_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Smart Access Control-User Management-Get individual user information',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ user_id: z.string().describe('User ID') }),
  },
};
export const acsV1UserList = {
  project: 'acs',
  name: 'acs.v1.user.list',
  sdkName: 'acs.v1.user.list',
  path: '/open-apis/acs/v1/users',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Smart Access Control-User Management-Get user list',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z.number().optional(),
        page_token: z.string().optional(),
        user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const acsV1UserPatch = {
  project: 'acs',
  name: 'acs.v1.user.patch',
  sdkName: 'acs.v1.user.patch',
  path: '/open-apis/acs/v1/users/:user_id',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Smart Access Control-User Management-Modify parts of user information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ feature: z.object({ card: z.number().optional() }).optional() }).optional(),
    params: z
      .object({ user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ user_id: z.string().describe('User ID') }),
  },
};
export const acsV1VisitorCreate = {
  project: 'acs',
  name: 'acs.v1.visitor.create',
  sdkName: 'acs.v1.visitor.create',
  path: '/open-apis/acs/v1/visitors',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Smart Access Control-Visitor-Add visitor-visitor add',
  accessTokens: ['user'],
  schema: {
    data: z.object({
      user: z
        .object({
          user_type: z
            .number()
            .describe('user type Options:1(user employee),2(department),10(tenant all staff),11(guest visitor)'),
          user_id: z.string().describe('visitor id').optional(),
          user_name: z.string().describe('visitor name').optional(),
          phone_num: z.string().describe('phone num').optional(),
          department_id: z.string().describe('department id').optional(),
        })
        .describe('visitor info'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const acsV1VisitorDelete = {
  project: 'acs',
  name: 'acs.v1.visitor.delete',
  sdkName: 'acs.v1.visitor.delete',
  path: '/open-apis/acs/v1/visitors/:visitor_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Smart Access Control-Visitor-Delete visitor-visitor delete',
  accessTokens: ['user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ visitor_id: z.string().describe('visitor id') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const acsV1Tools = [
  acsV1AccessRecordList,
  acsV1DeviceList,
  acsV1RuleExternalCreate,
  acsV1RuleExternalDelete,
  acsV1RuleExternalDeviceBind,
  acsV1RuleExternalGet,
  acsV1UserGet,
  acsV1UserList,
  acsV1UserPatch,
  acsV1VisitorCreate,
  acsV1VisitorDelete,
];
