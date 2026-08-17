import { z } from 'zod';
export type hireV2ToolName = 'hire.v2.interviewRecord.get' | 'hire.v2.interviewRecord.list' | 'hire.v2.talent.get';
export const hireV2InterviewRecordGet = {
  project: 'hire',
  name: 'hire.v2.interviewRecord.get',
  sdkName: 'hire.v2.interviewRecord.get',
  path: '/open-apis/hire/v2/interview_records/:interview_record_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Interview-Get Interview Feedback Detail（new version）-Get interview feedback details',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ interview_record_id: z.string().describe('Interview record ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const hireV2InterviewRecordList = {
  project: 'hire',
  name: 'hire.v2.interviewRecord.list',
  sdkName: 'hire.v2.interviewRecord.list',
  path: '/open-apis/hire/v2/interview_records',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Interview-Batch Get Interview Feedback Details（new version）-Batch get interview feedback',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        ids: z.array(z.string()).describe('List interview feedback by IDs, page param will not be used').optional(),
        page_size: z.number().describe('Paging size').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const hireV2TalentGet = {
  project: 'hire',
  name: 'hire.v2.talent.get',
  sdkName: 'hire.v2.talent.get',
  path: '/open-apis/hire/v2/talents/:talent_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Talent-Get talent details-Obtain talent information according to talent ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({ talent_id: z.string().describe('Talent ID') }),
  },
};
export const hireV2Tools = [hireV2InterviewRecordGet, hireV2InterviewRecordList, hireV2TalentGet];
