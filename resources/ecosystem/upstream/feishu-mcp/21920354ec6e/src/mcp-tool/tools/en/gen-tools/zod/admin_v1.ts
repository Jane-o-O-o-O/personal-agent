import { z } from 'zod';
export type adminV1ToolName =
  | 'admin.v1.adminDeptStat.list'
  | 'admin.v1.adminUserStat.list'
  | 'admin.v1.auditInfo.list'
  | 'admin.v1.badge.create'
  | 'admin.v1.badge.get'
  | 'admin.v1.badgeGrant.create'
  | 'admin.v1.badgeGrant.delete'
  | 'admin.v1.badgeGrant.get'
  | 'admin.v1.badgeGrant.list'
  | 'admin.v1.badgeGrant.update'
  | 'admin.v1.badge.list'
  | 'admin.v1.badge.update'
  | 'admin.v1.password.reset';
export const adminV1AdminDeptStatList = {
  project: 'admin',
  name: 'admin.v1.adminDeptStat.list',
  sdkName: 'admin.v1.adminDeptStat.list',
  path: '/open-apis/admin/v1/admin_dept_stats',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Admin-Data report management-Obtain active users and function usage data in the department dimension-The API is used to obtain active users and function usage data in the department dimension, including the usage data about IM (Instant Messaging), Calendar, Docs, Audio/Video and Email Conferencing',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      department_id_type: z
        .enum(['department_id', 'open_department_id'])
        .describe('Department ID type Options:department_id(Department ID),open_department_id(Department Open ID)'),
      start_date: z.string().describe('Start date (inclusive) in the format of YYYY-mm-dd'),
      end_date: z
        .string()
        .describe(
          'End date (inclusive) in YYYY-mm-dd. The difference between start date and end date shall not exceed 91 days (inclusive)',
        ),
      department_id: z
        .string()
        .describe(
          'Department ID, depending on department_id_type and supporting only the root department and its top four sub-departments',
        ),
      contains_child_dept: z
        .boolean()
        .describe(
          'Whether sub-departments are included. If the value is false, only the active users and function usage data directly under the department are searched. If the value is true, the active users and function usage data of the department and its sub-departments (the level of sub-department does not exceed the top four levels under the root department) are searched',
        ),
      page_size: z.number().describe('Page size').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      target_geo: z
        .string()
        .describe(
          'Geo data that needs to be accessed across domains. Each Geo only contains this Geo data. Local data will be checked by default if not passed. You need to activate FG (cn, us, sg, jp) before calling. Only one Geo data can be checked at a time',
        )
        .optional(),
      with_product_version: z
        .boolean()
        .describe(
          'Whether to return sub product version data (grayscale function, please ask CMS classmates to help enable grayscale)',
        )
        .optional(),
    }),
  },
};
export const adminV1AdminUserStatList = {
  project: 'admin',
  name: 'admin.v1.adminUserStat.list',
  sdkName: 'admin.v1.adminUserStat.list',
  path: '/open-apis/admin/v1/admin_user_stats',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Admin-Data report management-Obtain active users and function usage data in the user dimension-This API is used to obtain active users and function usage data in the user dimension. That is, the usage data of IM (Instant messaging), Calendar, Docs, Audio/Video conferencing and Email functions',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['department_id', 'open_department_id'])
        .describe('Department ID type Options:department_id(Department ID),open_department_id(Department Open ID)')
        .optional(),
      start_date: z.string().describe('Start date (inclusive) in the format of YYYY-mm-dd'),
      end_date: z
        .string()
        .describe(
          'End date (inclusive) in YYYY-mm-dd. The difference between start date and end date shall not exceed 31 days (inclusive)',
        ),
      department_id: z.string().describe('Department ID, depending on department_id_type').optional(),
      user_id: z.string().describe("User's open_id, user_id, or union_id, depending on user_id_type").optional(),
      page_size: z.number().describe('Page size').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      target_geo: z
        .string()
        .describe(
          'Geo data that needs to be accessed across domains. Each Geo only contains this Geo data. Local data will be checked by default if not passed. You need to activate FG (cn, us, sg, jp) before calling. Only one Geo data can be checked at a time',
        )
        .optional(),
    }),
  },
};
export const adminV1AuditInfoList = {
  project: 'admin',
  name: 'admin.v1.auditInfo.list',
  sdkName: 'admin.v1.auditInfo.list',
  path: '/open-apis/admin/v1/audit_infos',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-security_and_compliance-Behavior audit log-Get behavior audit log',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('User ID type').optional(),
        latest: z.number().optional(),
        oldest: z.number().optional(),
        event_name: z.string().optional(),
        operator_type: z
          .enum(['user', 'bot'])
          .describe('Options:user(以user_id来识别用户),bot([已废弃] 以bot_id来识别用户)')
          .optional(),
        operator_value: z.string().optional(),
        event_module: z.number().optional(),
        page_token: z.string().optional(),
        page_size: z.number().optional(),
        user_type: z
          .number()
          .describe('Options:0(all 互联网上的任何人),1(normal_user 组织内成员),2(external_user 组织外成员)')
          .optional(),
        object_type: z.number().optional(),
        object_value: z.string().optional(),
        ext_filter_object_by_ccm_token: z.string().optional(),
      })
      .optional(),
  },
};
export const adminV1BadgeCreate = {
  project: 'admin',
  name: 'admin.v1.badge.create',
  sdkName: 'admin.v1.badge.create',
  path: '/open-apis/admin/v1/badges',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Admin-Enterprise badge-Badge management-Create a badge-Use this API to create a complete badge information, up to 1000 badges can be created under a tenant',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z.string().describe('Unique badge name within the tenant, up to 30 characters'),
      explanation: z.string().describe('Description copy of the badge, up to 100 characters').optional(),
      detail_image: z
        .string()
        .describe(
          'The details of the enterprise badge Key. 1. Permission verification: The picture key uploaded by the non-tenant cannot be used directly; 2. Time limit verification: When creating a badge or modifying the image key of the badge, you need to use the image key uploaded within 1h',
        ),
      show_image: z
        .string()
        .describe(
          'Key of the profile decoration image of the enterprise badge. 1. Permission verification: The picture key uploaded by the non-tenant cannot be used directly; 2. Time limit verification: When creating a badge or modifying the image key of the badge, you need to use the image key uploaded within 1h',
        ),
      i18n_name: z
        .object({
          zh_cn: z.string().describe('Chinese').optional(),
          en_us: z.string().describe('English').optional(),
          ja_jp: z.string().describe('Japanese').optional(),
        })
        .describe(
          'The multi-language name of the badge, the same as the name field limit, with a maximum of 30 characters',
        )
        .optional(),
      i18n_explanation: z
        .object({
          zh_cn: z.string().describe('Chinese').optional(),
          en_us: z.string().describe('English').optional(),
          ja_jp: z.string().describe('Japanese').optional(),
        })
        .describe(
          'The multi-language description copy of the badge, the same as the explanation field limit, has a maximum of 100 characters',
        )
        .optional(),
    }),
  },
};
export const adminV1BadgeGet = {
  project: 'admin',
  name: 'admin.v1.badge.get',
  sdkName: 'admin.v1.badge.get',
  path: '/open-apis/admin/v1/badges/:badge_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Admin-Enterprise badge-Badge management-Get the badge detail-You can query the detail of the badge through this API',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ badge_id: z.string().describe('Badge id') }),
  },
};
export const adminV1BadgeGrantCreate = {
  project: 'admin',
  name: 'admin.v1.badgeGrant.create',
  sdkName: 'admin.v1.badgeGrant.create',
  path: '/open-apis/admin/v1/badges/:badge_id/grants',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Admin-Enterprise badge-Badge grant-Create a grant list-Through this API, a list of grants can be created for a specific badge, and up to 1,000 grant lists can be created under one badge',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z.string().describe('Grant list names, up to 100 characters'),
      grant_type: z
        .number()
        .describe(
          'Grant List Type Options:0(manual Manually select valid period),1(join_time Matching system date of employment)',
        ),
      time_zone: z
        .string()
        .describe(
          "The time zone corresponding to the effective time of the grant list, used to check whether the value of RuleDetail's timestamp is standardized, and the value range is TZ database name",
        ),
      rule_detail: z
        .object({
          effective_time: z
            .string()
            .describe(
              'The timestamp that takes effect. 1. Manually set the valid period type badge, the configuration validity period needs to configure this field; 2. timestamp must be the zero point timestamp of the day in the time zone, such as 1649606400 when the time zone is Asia/Shanghai time zone',
            )
            .optional(),
          expiration_time: z
            .string()
            .describe(
              'The timestamp that ends in effect. 1. Manually set the valid period type badge, the configuration validity period needs to configure this field; 2. Maximum value: no more than effective_time + 100 years; 3. Non-permanent valid: timestamp must be 23:59:59 timestamp on the day of the time zone, such as 1649692799 when the time zone is Asia/Shanghai time zone; 4. Permanent valid: pass the value as 0',
            )
            .optional(),
          anniversary: z
            .number()
            .describe('Onboarding anniversary. Depending on the date of employment, this field needs to be configured')
            .optional(),
          effective_period: z
            .number()
            .describe(
              'Validity period. Depending on the date of employment, this field needs to be configured. Options:1(one_year Valid period is one year),2(permanent Permanently valid)',
            )
            .optional(),
        })
        .describe('Rules Details'),
      is_grant_all: z
        .boolean()
        .describe(
          'Whether to grant to all employees. 1. When false, 1 to 500 client bases need to be associated. 2. When true, users, user groups, and departments cannot be associated',
        ),
      user_ids: z
        .array(z.string())
        .describe(
          'Granted user ID list, this field is not returned in the return result of the grant list list interface, but only returned in the detail API',
        )
        .optional(),
      department_ids: z
        .array(z.string())
        .describe(
          'List of granted department IDs, this field is not returned in the return result of the grant list list interface, but only returned in the detail API',
        )
        .optional(),
      group_ids: z
        .array(z.string())
        .describe(
          'Granted user group ID list, this field is not returned in the return result of the grant list list interface, but only returned in the details API',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call. Options:department_id(Identify departments with custom department_id),open_department_id(Identify departments by open_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ badge_id: z.string().describe('Badge ID') }),
  },
};
export const adminV1BadgeGrantDelete = {
  project: 'admin',
  name: 'admin.v1.badgeGrant.delete',
  sdkName: 'admin.v1.badgeGrant.delete',
  path: '/open-apis/admin/v1/badges/:badge_id/grants/:grant_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Admin-Enterprise badge-Badge grant-Delete the grant list-This API allows you to delete information for a specific grant',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      badge_id: z.string().describe('Unique ID for the enterprise badge'),
      grant_id: z
        .string()
        .describe('A unique identifier of a grant list within a tenant, randomly generated by the system'),
    }),
  },
};
export const adminV1BadgeGrantGet = {
  project: 'admin',
  name: 'admin.v1.badgeGrant.get',
  sdkName: 'admin.v1.badgeGrant.get',
  path: '/open-apis/admin/v1/badges/:badge_id/grants/:grant_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Admin-Enterprise badge-Badge grant-Get the grant list detail-Information on specific grant can be obtained through this API',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call. Options:department_id(Identify departments with custom department_id.),open_department_id(Identify departments by open_department_id.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      badge_id: z.string().describe('A unique identifier of a medal within a tenant, randomly generated by the system'),
      grant_id: z
        .string()
        .describe('A unique identifier of a grant list within a tenant, randomly generated by the system'),
    }),
  },
};
export const adminV1BadgeGrantList = {
  project: 'admin',
  name: 'admin.v1.badgeGrant.list',
  sdkName: 'admin.v1.badgeGrant.list',
  path: '/open-apis/admin/v1/badges/:badge_id/grants',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Admin-Enterprise badge-Badge grant-List of grants to receive badge-Through this API, you can obtain a list of grant lists under a specific badge, and the order of the grant lists is displayed in descending order according to the creation time',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().describe('Page size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['department_id', 'open_department_id'])
        .describe(
          'The type of department ID used in this call. Options:department_id(Identify departments with custom department_id.),open_department_id(Identify departments by open_department_id.)',
        )
        .optional(),
      name: z.string().describe('Grant list name, exact match').optional(),
    }),
    path: z.object({ badge_id: z.string().describe('Unique ID for the enterprise badge') }),
  },
};
export const adminV1BadgeGrantUpdate = {
  project: 'admin',
  name: 'admin.v1.badgeGrant.update',
  sdkName: 'admin.v1.badgeGrant.update',
  path: '/open-apis/admin/v1/badges/:badge_id/grants/:grant_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Admin-Enterprise badge-Badge grant-Modify the grant list-Through this API, information about a specific grant list can be modified',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z.string().describe('Grant list names, up to 100 characters'),
      grant_type: z
        .number()
        .describe(
          'Grant List Type Options:0(manual Manually select valid period),1(join_time Matching system date of employment)',
        ),
      time_zone: z
        .string()
        .describe(
          "The time zone corresponding to the effective time of the grant list, used to check whether the value of RuleDetail's timestamp is standardized, and the value range is TZ database name",
        ),
      rule_detail: z
        .object({
          effective_time: z
            .string()
            .describe(
              'The timestamp that takes effect. 1. Manually set the valid period type badge, the configuration validity period needs to configure this field; 2. timestamp must be the zero point timestamp of the day in the time zone, such as 1649606400 when the time zone is Asia/Shanghai time zone',
            )
            .optional(),
          expiration_time: z
            .string()
            .describe(
              'The timestamp that ends in effect. 1. Manually set the valid period type badge, the configuration validity period needs to configure this field; 2. Maximum value: no more than effective_time + 100 years; 3. Non-permanent valid: timestamp must be 23:59:59 timestamp on the day of the time zone, such as 1649692799 when the time zone is Asia/Shanghai time zone; 4. Permanent valid: pass the value as 0',
            )
            .optional(),
          anniversary: z
            .number()
            .describe('Onboarding anniversary. Depending on the date of employment, this field needs to be configured')
            .optional(),
          effective_period: z
            .number()
            .describe(
              'Validity period. Depending on the date of employment, this field needs to be configured. Options:1(one_year Valid period is one year),2(permanent Permanently valid)',
            )
            .optional(),
        })
        .describe('Rules Details'),
      is_grant_all: z
        .boolean()
        .describe(
          'Whether to grant to all employees. 1. When false, 1 to 500 client bases need to be associated. 2. When true, users, user groups, and departments cannot be associated',
        ),
      user_ids: z
        .array(z.string())
        .describe(
          'Granted user ID list, this field is not returned in the return result of the grant list list interface, but only returned in the detail API',
        )
        .optional(),
      department_ids: z
        .array(z.string())
        .describe(
          'List of granted department IDs, this field is not returned in the return result of the grant list list interface, but only returned in the detail API',
        )
        .optional(),
      group_ids: z
        .array(z.string())
        .describe(
          'Granted user group ID list, this field is not returned in the return result of the grant list list interface, but only returned in the details API',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call. Options:department_id(Identify departments with custom department_id.),open_department_id(Identify departments by open_department_id.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ badge_id: z.string().describe('Badge ID'), grant_id: z.string().describe('Grant List ID') }),
  },
};
export const adminV1BadgeList = {
  project: 'admin',
  name: 'admin.v1.badge.list',
  sdkName: 'admin.v1.badge.list',
  path: '/open-apis/admin/v1/badges',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Admin-Enterprise badge-Badge management-Get a list of badges-All the badges under the tenant can be listed through this API, and the order of the badges is displayed in descending order according to the creation time',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().describe('Page size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      name: z.string().describe('Unique badge name within the tenant, exact match').optional(),
    }),
  },
};
export const adminV1BadgeUpdate = {
  project: 'admin',
  name: 'admin.v1.badge.update',
  sdkName: 'admin.v1.badge.update',
  path: '/open-apis/admin/v1/badges/:badge_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Admin-Enterprise badge-Badge management-Modify the badge information-Through this API, the information of the badge can be modified',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z.string().describe('Unique badge name within the tenant, up to 30 characters'),
      explanation: z.string().describe('Description copy of the badge, up to 100 characters').optional(),
      detail_image: z
        .string()
        .describe(
          'The details of the enterprise badge Key. 1. Permission verification: The picture key uploaded by the non-tenant cannot be used directly; 2. Time limit verification: When creating a badge or modifying the image key of the badge, you need to use the image key uploaded within 1h',
        ),
      show_image: z
        .string()
        .describe(
          'Key of the profile decoration image of the enterprise badge. 1. Permission verification: The picture key uploaded by the non-tenant cannot be used directly; 2. Time limit verification: When creating a badge or modifying the image key of the badge, you need to use the image key uploaded within 1h',
        ),
      i18n_name: z
        .object({
          zh_cn: z.string().describe('Chinese').optional(),
          en_us: z.string().describe('English').optional(),
          ja_jp: z.string().describe('Japanese').optional(),
        })
        .describe(
          'The multi-language name of the badge, the same as the name field limit, with a maximum of 30 characters',
        )
        .optional(),
      i18n_explanation: z
        .object({
          zh_cn: z.string().describe('Chinese').optional(),
          en_us: z.string().describe('English').optional(),
          ja_jp: z.string().describe('Japanese').optional(),
        })
        .describe(
          'The multi-language description copy of the badge, the same as the explanation field limit, has a maximum of 100 characters',
        )
        .optional(),
    }),
    path: z.object({ badge_id: z.string().describe('Badge ID') }),
  },
};
export const adminV1PasswordReset = {
  project: 'admin',
  name: 'admin.v1.password.reset',
  sdkName: 'admin.v1.password.reset',
  path: '/open-apis/admin/v1/password/reset',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Admin-Login password management-Reset user enterprise email password',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      password: z
        .object({ ent_email_password: z.string() })
        .describe(
          'Password reset parameters: the password should contain at least 8 characters, including at least 2 character types (letters, numbers and symbols)',
        ),
      user_id: z
        .string()
        .describe(
          'The user ID password can only be reset if the user’s login email address and business email address (including aliases) are the same. Data validation rule: Length range: 0 to 200 characters',
        ),
    }),
    params: z.object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type') }),
  },
};
export const adminV1Tools = [
  adminV1AdminDeptStatList,
  adminV1AdminUserStatList,
  adminV1AuditInfoList,
  adminV1BadgeCreate,
  adminV1BadgeGet,
  adminV1BadgeGrantCreate,
  adminV1BadgeGrantDelete,
  adminV1BadgeGrantGet,
  adminV1BadgeGrantList,
  adminV1BadgeGrantUpdate,
  adminV1BadgeList,
  adminV1BadgeUpdate,
  adminV1PasswordReset,
];
