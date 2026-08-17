import { z } from 'zod';
export type performanceV1ToolName =
  | 'performance.v1.reviewData.query'
  | 'performance.v1.semester.list'
  | 'performance.v1.stageTask.findByPage'
  | 'performance.v1.stageTask.findByUserList';
export const performanceV1ReviewDataQuery = {
  project: 'performance',
  name: 'performance.v1.reviewData.query',
  sdkName: 'performance.v1.reviewData.query',
  path: '/open-apis/performance/v1/review_datas/query',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Performance-Review data-Get performance result-Get performance result',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      start_time: z
        .string()
        .describe(
          "Start date of query scope, a timestamp accurate to milliseconds. Start date can't be later than end date",
        ),
      end_time: z
        .string()
        .describe(
          "End date of query scope, a timestamp accurate to milliseconds. End date can't be earlier than start date",
        ),
      stage_types: z
        .array(
          z
            .enum(['leader_review', 'communication_and_open_result', 'view_result'])
            .describe(
              'Options:leader_review(Final Review),communication_and_open_result(Final Feedback Session),view_result(View Performance Result)',
            ),
        )
        .describe(
          'Step type. Currently only final review, result communication and view performance result steps are supported (all steps are included by default if no values are specified)',
        ),
      stage_progress: z
        .array(
          z
            .number()
            .describe(
              "Options:0(Not started. Task start time hasn't been reached.),1(To be completed. Task start time has been reached but end time hasn't, and the task hasn't been completed.),2(Expired. Task end time has been reached and the task hasn't been completed.),3(Completed. Task has been completed.),4(Reconsideration initiated. Performance result has been released and the reviewee has initiated a reconsideration.)",
            ),
        )
        .describe(
          'View Performance Result step (all statuses are included by default if no values are specified)**Optional values are**:- `0`: Released. Performance result has been released, without reconsideration initiated or result confirmation required- `1`: To be confirmed. Performance result has been released and is pending confirmation by the reviewee, with the confirmation deadline not reached.- `2`: Expired. Performance result has been released and is pending confirmation by the reviewee, with the confirmation deadline missed.- `3`: Confirmed. Performance result has been released and confirmed by the reviewee.- `4`: Reconsideration initiated. Performance result has been released and the reviewee has initiated a reconsideration.Review step status (all statuses are included by default if no values are specified)<!--',
        )
        .optional(),
      semester_id_list: z
        .array(z.string())
        .describe(
          '-->**Data validation rules**:- Maximum length: `50` </md-dt-td></md-dt-tr><md-dt-tr level="0"> <md-dt-td> <md-text type="field-name" >semester_id_list</md-text> </md-dt-td> <md-dt-td> <md-text type="field-type" >string\\[\\]</md-text> </md-dt-td> <md-dt-td> 否 </md-dt-td> <md-dt-td>Review cycle ID list. "semester_id" is the unique identifier of review cycles. You can get it via the URL on the "My Reviews" page or the value returned by this interface',
        )
        .optional(),
      reviewee_user_id_list: z.array(z.string()).describe('Reviewee ID list'),
      updated_later_than: z
        .string()
        .describe(
          'Step updated later than, a timestamp accurate to milliseconds. This field can filter out steps that have content submitted after this time',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const performanceV1SemesterList = {
  project: 'performance',
  name: 'performance.v1.semester.list',
  sdkName: 'performance.v1.semester.list',
  path: '/open-apis/performance/v1/semesters',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Cycles and projects-Cycles-Obtain cycle-Obtain basic information about the cycle',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        start_time: z
          .string()
          .describe("Start time of the query range in milliseconds. The start time can't be later than the end time")
          .optional(),
        end_time: z
          .string()
          .describe("End time of the query range in milliseconds. The end time can't be earlier than the start time")
          .optional(),
        year: z.number().describe('Year').optional(),
        type_group: z
          .enum(['Annual', 'Semi-annual', 'Quarter', 'Bimonth', 'Month', 'Non-standard'])
          .describe(
            'Cycle type group Options:Annual(Annual),Semi-annual(SemiAnnual Semi-annual),Quarter(Quarter),Bimonth(Bimonth),Month(Month),Non-standard(NonStandard Non-standard cycle)',
          )
          .optional(),
        type: z
          .enum([
            'Annual',
            'H1',
            'H2',
            'Q1',
            'Q2',
            'Q3',
            'Q4',
            'January-February',
            'March-April',
            'May-June',
            'July-August',
            'September-October',
            'November-December',
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
            'Custom',
          ])
          .describe(
            'Cycle type Options:Annual(Annual),H1(H1),H2(H2),Q1(Q1),Q2(Q2),Q3(Q3),Q4(Q4),January-February(January2February January-February),March-April(March2April March-April),May-June(May2June May-June),July-August(July2August July-August),September-October(September2October September-October),November-December(November2December November-December),January(January),February(February),March(March),April(April),May(May),June(June),July(July),August(August),September(September),October(October),November(November),December(December),Custom(Custom)',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const performanceV1StageTaskFindByPage = {
  project: 'performance',
  name: 'performance.v1.stageTask.findByPage',
  sdkName: 'performance.v1.stageTask.findByPage',
  path: '/open-apis/performance/v1/stage_tasks/find_by_page',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Review tasks-Obtain Cycle Tasks (all users)-Get task information for all users',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      semester_id: z
        .string()
        .describe(
          'Cycle ID. Only 1 cycle can be queried at a time. You can obtain the cycle ID through the "Obtain Cycle" interface',
        ),
      task_option_lists: z
        .array(z.number())
        .describe(
          'Task category (default to all if it is empty)1. To be completed2. Completed 3. Overdue (this category only applies when the tenant is set to not allow overdue submissions)',
        )
        .optional(),
      after_time: z.string().describe('Search for steps that end after this time').optional(),
      before_time: z.string().describe('Search for steps that have ended before this time').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.number().describe('Page size').optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const performanceV1StageTaskFindByUserList = {
  project: 'performance',
  name: 'performance.v1.stageTask.findByUserList',
  sdkName: 'performance.v1.stageTask.findByUserList',
  path: '/open-apis/performance/v1/stage_tasks/find_by_user_list',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Review tasks-Obtain Cycle Tasks (specified users)-Get task information for specified users',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      semester_id: z
        .string()
        .describe(
          'Cycle ID. Only 1 cycle can be queried at a time. You can obtain the cycle ID through the "Obtain Cycle" interface',
        ),
      user_id_lists: z
        .array(z.string())
        .describe('User ID list, if accessed as a user, this value can only fill in the personal ID'),
      task_option_lists: z
        .array(z.number())
        .describe(
          'Task category (default to all if it is empty)1. To be completed2. Completed3. Overdue (this category only applies when the tenant is set to not allow overdue submissions)',
        )
        .optional(),
      after_time: z.string().describe('Search for steps that end after this time').optional(),
      before_time: z.string().describe('Search for steps that have ended before this time').optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const performanceV1Tools = [
  performanceV1ReviewDataQuery,
  performanceV1SemesterList,
  performanceV1StageTaskFindByPage,
  performanceV1StageTaskFindByUserList,
];
