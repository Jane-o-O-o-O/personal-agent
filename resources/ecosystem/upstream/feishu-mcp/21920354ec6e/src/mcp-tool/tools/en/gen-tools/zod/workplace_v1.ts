import { z } from 'zod';
export type workplaceV1ToolName =
  | 'workplace.v1.customWorkplaceAccessData.search'
  | 'workplace.v1.workplaceAccessData.search'
  | 'workplace.v1.workplaceBlockAccessData.search';
export const workplaceV1CustomWorkplaceAccessDataSearch = {
  project: 'workplace',
  name: 'workplace.v1.customWorkplaceAccessData.search',
  sdkName: 'workplace.v1.customWorkplaceAccessData.search',
  path: '/open-apis/workplace/v1/custom_workplace_access_data/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Workplace-workplace access data-Get Custom Workplace Access Data-Get Custom Workplace Access Data',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      from_date: z.string(),
      to_date: z.string(),
      page_size: z.number(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      custom_workplace_id: z
        .string()
        .describe(
          'Custom workplace ID,which is not mandatory. When empty, all custom workplace data is responsed. How to obtain a custom workplace ID: You can go to Feishu Admin>Workplace>Custom Workplace, click on the settings of the specified workplace to enter the settings page; Click the "Settings" button at the top three times with the mouse to display the ID, and then copy the ID',
        )
        .optional(),
    }),
  },
};
export const workplaceV1WorkplaceAccessDataSearch = {
  project: 'workplace',
  name: 'workplace.v1.workplaceAccessData.search',
  sdkName: 'workplace.v1.workplaceAccessData.search',
  path: '/open-apis/workplace/v1/workplace_access_data/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Workplace-workplace access data-search workplace access data-Get Workplace Access Data, including default workplace and custom workplace',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      from_date: z.string(),
      to_date: z.string(),
      page_size: z.number(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const workplaceV1WorkplaceBlockAccessDataSearch = {
  project: 'workplace',
  name: 'workplace.v1.workplaceBlockAccessData.search',
  sdkName: 'workplace.v1.workplaceBlockAccessData.search',
  path: '/open-apis/workplace/v1/workplace_block_access_data/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Workplace-workplace access data-Get Block Access Data-Get Custom Workplace Block Access Data',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      from_date: z.string(),
      to_date: z.string(),
      page_size: z.number(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      block_id: z
        .string()
        .describe(
          'BlockID. You can go to Feishu Admin>Workplace>Custom Workplace, select the specified workplace and enter the Workplace Builder. Click on a block to view the "BlockID" below the block name in the right panel of the page',
        )
        .optional(),
    }),
  },
};
export const workplaceV1Tools = [
  workplaceV1CustomWorkplaceAccessDataSearch,
  workplaceV1WorkplaceAccessDataSearch,
  workplaceV1WorkplaceBlockAccessDataSearch,
];
