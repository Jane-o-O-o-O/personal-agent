import { z } from 'zod';
export type trustPartyV1ToolName =
  | 'trust_party.v1.collaborationTenantCollaborationDepartment.get'
  | 'trust_party.v1.collaborationTenantCollaborationUser.get'
  | 'trust_party.v1.collaborationTenant.get'
  | 'trust_party.v1.collaborationTenant.list'
  | 'trust_party.v1.collaborationTenant.visibleOrganization';
export const trustPartyV1CollaborationTenantCollaborationDepartmentGet = {
  project: 'trust_party',
  name: 'trust_party.v1.collaborationTenantCollaborationDepartment.get',
  sdkName: 'trust_party.v1.collaborationTenantCollaborationDepartment.get',
  path: '/open-apis/trust_party/v1/collaboration_tenants/:target_tenant_key/collaboration_departments/:target_department_id',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Trust Party-Collaboraiton Organization-Query department details of trusted party-Get the details of the organization's trusted party department, and you nee permission to the department to query the information. When using the user_access_token, the verification shall be aligned with the visibility rules set for the user in the trusted party list on the admin console. When using the tenant_access_token, the verification shall be aligned with the rules set for the application in the application sharing",
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        target_department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Related organization imported parameters Department type Options:department_id(Department ID),open_department_id(Department open ID)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      target_tenant_key: z.string().describe('The tenant key of the collaboration organization'),
      target_department_id: z.string().describe("The department of the other party's collaboration organization"),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const trustPartyV1CollaborationTenantCollaborationUserGet = {
  project: 'trust_party',
  name: 'trust_party.v1.collaborationTenantCollaborationUser.get',
  sdkName: 'trust_party.v1.collaborationTenantCollaborationUser.get',
  path: '/open-apis/trust_party/v1/collaboration_tenants/:target_tenant_key/collaboration_users/:target_user_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Trust Party-Collaboraiton Organization-Query the details of trusted party members-To obtain the trusted party member details, you need to have permissions on the trust party members to obtain them',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        target_user_id_type: z
          .enum(['user_id', 'union_id', 'open_id'])
          .describe(
            'user ID type, can be obtained by [Query details of trusted party members and departments] Options:user_id(Identify users user_id),union_id(Identify users union_id),open_id(Identify users open_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      target_tenant_key: z
        .string()
        .describe(
          'The tenant key of the other party. It can be obtained through [Query the list of trusted parties by Admin]',
        ),
      target_user_id: z.string().describe('The requested collaboration user ID'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const trustPartyV1CollaborationTenantGet = {
  project: 'trust_party',
  name: 'trust_party.v1.collaborationTenant.get',
  sdkName: 'trust_party.v1.collaborationTenant.get',
  path: '/open-apis/trust_party/v1/collaboration_tenants/:target_tenant_key',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Trust Party-Collaboraiton Organization-Query the trusted party information-Obtain the trusted party information based on the tenant key, and you need to have permission to the other tenant to obtain it.When using the user_access_token, the verification shall be aligned with the visibility rules set for the user in the trusted party on the admin console. When using the tenant_access_token, the verification shall be aligned with the visibility rules set for the application in the application sharing',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      target_tenant_key: z
        .string()
        .describe(
          'The tenant key of the associated organization of the other party. It can be obtained through [Query the list of trusted parties by Admin]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const trustPartyV1CollaborationTenantList = {
  project: 'trust_party',
  name: 'trust_party.v1.collaborationTenant.list',
  sdkName: 'trust_party.v1.collaborationTenant.list',
  path: '/open-apis/trust_party/v1/collaboration_tenants',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Trust Party-Collaboraiton Organization-Query visible trusted parties list-Query a list of trusted parties visible to the user. When using the user_access_token, the permissions shall be aligned with the visibility rules set for the user in the trusted parties list on the admin console. When using the tenant_access_token, the permissions shall be aligned with the visibility rules set for the application in the application sharing',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('Number of affiliated organizations per request').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const trustPartyV1CollaborationTenantVisibleOrganization = {
  project: 'trust_party',
  name: 'trust_party.v1.collaborationTenant.visibleOrganization',
  sdkName: 'trust_party.v1.collaborationTenant.visibleOrganization',
  path: '/open-apis/trust_party/v1/collaboration_tenants/:target_tenant_key/visible_organization',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Trust Party-Collaboraiton Organization-Query department and member information for trusted party-The query will return the lower-level departments, users, and user groups that are visible to the user under the collaboration department',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this function call Options:department_id(Identify departments with custom department_id),open_department_id(Identify departments by open_department_id)',
          )
          .optional(),
        target_department_id: z
          .string()
          .describe(
            'Request the department ID of the associated organization, 0 represents the root department, and choose one of the target_group_id it can be obtained from [Query departments and member information for truyst parties]',
          )
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('Number of visible entities requested').optional(),
        group_id_type: z
          .enum(['group_id', 'open_group_id'])
          .describe(
            'The type of user group ID used in this call Options:group_id(group_id),open_group_id(Identify group by open_group_id)',
          )
          .optional(),
        target_group_id: z
          .string()
          .describe('Request the user group ID of the associated organization, choose one of target_department_id')
          .optional(),
      })
      .optional(),
    path: z.object({
      target_tenant_key: z
        .string()
        .describe(
          'The tenant key of the associated organization of the other party. It can be obtained through [Query the list of trusted parties by Admin]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const trustPartyV1Tools = [
  trustPartyV1CollaborationTenantCollaborationDepartmentGet,
  trustPartyV1CollaborationTenantCollaborationUserGet,
  trustPartyV1CollaborationTenantGet,
  trustPartyV1CollaborationTenantList,
  trustPartyV1CollaborationTenantVisibleOrganization,
];
