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
    '[Feishu/Lark]-关联组织-关联组织-获取关联组织部门详情-获取对方的关联组织部门详情，需要对部门有可见性权限才可以获取',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        target_department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe('对方关联组织的入参部门类型 Options:department_id(部门ID),open_department_id(部门open ID)')
          .optional(),
      })
      .optional(),
    path: z.object({
      target_tenant_key: z.string().describe('对方关联组织的tenant key，可通过[管理员获取所有关联组织列表]获取'),
      target_department_id: z
        .string()
        .describe('对方关联组织的部门，需要与target_department_id_type中填写的值保持一致'),
    }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const trustPartyV1CollaborationTenantCollaborationUserGet = {
  project: 'trust_party',
  name: 'trust_party.v1.collaborationTenantCollaborationUser.get',
  sdkName: 'trust_party.v1.collaborationTenantCollaborationUser.get',
  path: '/open-apis/trust_party/v1/collaboration_tenants/:target_tenant_key/collaboration_users/:target_user_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-关联组织-关联组织-获取关联组织成员详情-获取关联组织成员详情，需要对关联组织成员有权限才可以获取',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        target_user_id_type: z
          .enum(['user_id', 'union_id', 'open_id'])
          .describe(
            '用户ID类型，可以在[获取关联组织的部门和成员信息]中获取对应的用户ID Options:user_id(以user_id来识别用户),union_id(以union_id来识别用户),open_id(以open_id来识别用户)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      target_tenant_key: z.string().describe('对方关联组织的tenant key，可通过[管理员获取所有关联组织列表]获取'),
      target_user_id: z.string().describe('请求的关联组织用户ID，需要与target_user_id_type中填写的类型保持一致'),
    }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const trustPartyV1CollaborationTenantGet = {
  project: 'trust_party',
  name: 'trust_party.v1.collaborationTenant.get',
  sdkName: 'trust_party.v1.collaborationTenant.get',
  path: '/open-apis/trust_party/v1/collaboration_tenants/:target_tenant_key',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-关联组织-关联组织-获取关联组织详情-基于组织tenant key获取关联组织详情，需要对对方组织有可见权限才可以获取',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      target_tenant_key: z.string().describe('对方关联组织的tenant key，可通过[管理员获取所有关联组织列表]获取'),
    }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const trustPartyV1CollaborationTenantList = {
  project: 'trust_party',
  name: 'trust_party.v1.collaborationTenant.list',
  sdkName: 'trust_party.v1.collaborationTenant.list',
  path: '/open-apis/trust_party/v1/collaboration_tenants',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-关联组织-关联组织-获取可见关联组织的列表-分页获取用户可见的关联列表',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_token: z
          .string()
          .describe(
            '分页标记，第一次请求不填，表示从头开始遍历；分页查询结果还有更多项时会同时返回新的 page_token，下次遍历可采用该 page_token 获取查询结果',
          )
          .optional(),
        page_size: z.number().describe('单次请求的关联组织数量').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const trustPartyV1CollaborationTenantVisibleOrganization = {
  project: 'trust_party',
  name: 'trust_party.v1.collaborationTenant.visibleOrganization',
  sdkName: 'trust_party.v1.collaborationTenant.visibleOrganization',
  path: '/open-apis/trust_party/v1/collaboration_tenants/:target_tenant_key/visible_organization',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-关联组织-关联组织-获取关联组织的部门和成员信息-该接口会返回用户在外部部门下可见的下级部门、用户、用户组',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            '此次调用中使用的部门ID的类型 Options:department_id(以自定义department_id来标识部门),open_department_id(以open_department_id来标识部门)',
          )
          .optional(),
        target_department_id: z
          .string()
          .describe(
            '请求关联组织的部门ID，0代表根部门，与target_group_id二选一；可以从[获取关联组织的部门和成员信息]中获得',
          )
          .optional(),
        page_token: z
          .string()
          .describe(
            '分页标记，第一次请求不填，表示从头开始遍历；分页查询结果还有更多项时会同时返回新的 page_token，下次遍历可采用该 page_token 获取查询结果',
          )
          .optional(),
        page_size: z.number().describe('请求的可见实体数量').optional(),
        group_id_type: z
          .enum(['group_id', 'open_group_id'])
          .describe(
            '此次调用中使用的用户组ID的类型 Options:group_id(group_id),open_group_id(以open_group_id来标识用户组)',
          )
          .optional(),
        target_group_id: z
          .string()
          .describe('请求关联组织的用户组ID，与target_department_id二选一；可以从[获取关联组织的部门和成员信息]中获得')
          .optional(),
      })
      .optional(),
    path: z.object({
      target_tenant_key: z.string().describe('对方关联组织的 tenant key。可通过[管理员获取所有关联组织列表]获取'),
    }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const trustPartyV1Tools = [
  trustPartyV1CollaborationTenantCollaborationDepartmentGet,
  trustPartyV1CollaborationTenantCollaborationUserGet,
  trustPartyV1CollaborationTenantGet,
  trustPartyV1CollaborationTenantList,
  trustPartyV1CollaborationTenantVisibleOrganization,
];
