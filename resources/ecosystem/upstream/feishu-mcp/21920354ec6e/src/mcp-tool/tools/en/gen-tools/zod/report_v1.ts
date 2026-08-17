import { z } from 'zod';
export type reportV1ToolName = 'report.v1.rule.query' | 'report.v1.ruleView.remove' | 'report.v1.task.query';
export const reportV1RuleQuery = {
  project: 'report',
  name: 'report.v1.rule.query',
  sdkName: 'report.v1.rule.query',
  path: '/open-apis/report/v1/rules/query',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Report-Rule-Query rules-Query rules',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      rule_name: z.string().describe('Rule name'),
      include_deleted: z
        .number()
        .describe(
          'Whether to include deleted, not deleted by default Options:0(Exclude Does not include deleted),1(Include Include deleted)',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
  },
};
export const reportV1RuleViewRemove = {
  project: 'report',
  name: 'report.v1.ruleView.remove',
  sdkName: 'report.v1.ruleView.remove',
  path: '/open-apis/report/v1/rules/:rule_id/views/remove',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Report-Rule view-Remove rule board-Remove rule board',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_ids: z
          .array(z.string())
          .describe(
            'If the list is empty and, deletes the full user view under the rule. If the list is not empty, then deletes the specified user view. The size limit is 200',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ rule_id: z.string().describe('Reporting tule ID') }),
  },
};
export const reportV1TaskQuery = {
  project: 'report',
  name: 'report.v1.task.query',
  sdkName: 'report.v1.task.query',
  path: '/open-apis/report/v1/tasks/query',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Report-Task-Query tasks-Query tasks',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      commit_start_time: z.number().describe('Commit start time timestamp'),
      commit_end_time: z.number().describe('End of submission timestamp'),
      rule_id: z.string().describe('Reporting rule ID').optional(),
      user_id: z.string().describe('User ID').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        ),
      page_size: z.number().describe('Number of items returned by a single page'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const reportV1Tools = [reportV1RuleQuery, reportV1RuleViewRemove, reportV1TaskQuery];
