import { z } from 'zod';
export type compensationV1ToolName =
  | 'compensation.v1.archive.query'
  | 'compensation.v1.changeReason.list'
  | 'compensation.v1.indicator.list'
  | 'compensation.v1.itemCategory.list'
  | 'compensation.v1.item.list'
  | 'compensation.v1.plan.list';
export const compensationV1ArchiveQuery = {
  project: 'compensation',
  name: 'compensation.v1.archive.query',
  sdkName: 'compensation.v1.archive.query',
  path: '/open-apis/compensation/v1/archives/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic Compensation-Compensation Profile-Batch query compensation profile-Batch query compensation profile',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      user_id_list: z
        .array(z.string())
        .describe('User ID list, the acquisition method can refer to the "user_id_type" field in the query parameters'),
      tid_list: z.array(z.string()).describe('Archive Tid List').optional(),
      effective_start_date: z.string().describe('Effective start time').optional(),
      effective_end_date: z.string().describe('Effective end time').optional(),
    }),
    params: z.object({
      page_size: z.number().describe('paging size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const compensationV1ChangeReasonList = {
  project: 'compensation',
  name: 'compensation.v1.changeReason.list',
  sdkName: 'compensation.v1.changeReason.list',
  path: '/open-apis/compensation/v1/change_reasons',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic Compensation-Compensation setting and adjustment-Batch query reason for compensation setting and adjustment-Batch query reason for compensation setting and adjustment',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().describe('paging size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const compensationV1IndicatorList = {
  project: 'compensation',
  name: 'compensation.v1.indicator.list',
  sdkName: 'compensation.v1.indicator.list',
  path: '/open-apis/compensation/v1/indicators',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic Compensation-Compensation component / metric-Batch query compensation metric-Batch query compensation metric',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().describe('paging size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const compensationV1ItemCategoryList = {
  project: 'compensation',
  name: 'compensation.v1.itemCategory.list',
  sdkName: 'compensation.v1.itemCategory.list',
  path: '/open-apis/compensation/v1/item_categories',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic Compensation-Compensation component / metric-Batch query compensation component type-Batch query compensation component type',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z.number().describe('paging size').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
      })
      .optional(),
  },
};
export const compensationV1ItemList = {
  project: 'compensation',
  name: 'compensation.v1.item.list',
  sdkName: 'compensation.v1.item.list',
  path: '/open-apis/compensation/v1/items',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic Compensation-Compensation component / metric-Batch query compensation component-Batch query compensation component',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().describe('paging size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const compensationV1PlanList = {
  project: 'compensation',
  name: 'compensation.v1.plan.list',
  sdkName: 'compensation.v1.plan.list',
  path: '/open-apis/compensation/v1/plans',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic Compensation-Compensation Plan-Batch query compensation plan-- This interface will return all salary plan information, including salary plan ID, effective date, salary item/salary statistics indicator, etc',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().describe('paging size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const compensationV1Tools = [
  compensationV1ArchiveQuery,
  compensationV1ChangeReasonList,
  compensationV1IndicatorList,
  compensationV1ItemCategoryList,
  compensationV1ItemList,
  compensationV1PlanList,
];
