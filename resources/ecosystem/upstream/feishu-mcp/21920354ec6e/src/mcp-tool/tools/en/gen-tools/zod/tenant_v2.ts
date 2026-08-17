import { z } from 'zod';
export type tenantV2ToolName = 'tenant.v2.tenantProductAssignInfo.query' | 'tenant.v2.tenant.query';
export const tenantV2TenantProductAssignInfoQuery = {
  project: 'tenant',
  name: 'tenant.v2.tenantProductAssignInfo.query',
  sdkName: 'tenant.v2.tenantProductAssignInfo.query',
  path: '/open-apis/tenant/v2/tenant/assign_info_list/query',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Company Information-Tenant Product Assign Info-Obtain company assign information-Obtain the seat list to be allocated under the tenant, including seat name, subscription ID, quantity and validity period',
  accessTokens: ['tenant'],
  schema: {},
};
export const tenantV2TenantQuery = {
  project: 'tenant',
  name: 'tenant.v2.tenant.query',
  sdkName: 'tenant.v2.tenant.query',
  path: '/open-apis/tenant/v2/tenant/query',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Company Information-Obtain company information-Obtains company information such as the company name and the company ID',
  accessTokens: ['tenant'],
  schema: {},
};
export const tenantV2Tools = [tenantV2TenantProductAssignInfoQuery, tenantV2TenantQuery];
