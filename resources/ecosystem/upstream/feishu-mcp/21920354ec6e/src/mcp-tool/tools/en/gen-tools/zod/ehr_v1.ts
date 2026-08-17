import { z } from 'zod';
export type ehrV1ToolName = 'ehr.v1.employee.list';
export const ehrV1EmployeeList = {
  project: 'ehr',
  name: 'ehr.v1.employee.list',
  sdkName: 'ehr.v1.employee.list',
  path: '/open-apis/ehr/v1/employees',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu CoreHR - (Standard version)-Employee directory information batch retrieval-You can batch retrieve employee directory fields with filters, such as Feishu user ID, employee status, and employee type. Directory fields can be divided into system fields (system_fields) and custom fields (custom_fields)',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        view: z
          .enum(['basic', 'full'])
          .describe(
            'Data range. If no value is passed, it defaults to basic. Options:basic(Overview. Only the ID, name, and other basic information will be returned.),full(Details. A combination of system fields and custom fields will be returned.)',
          )
          .optional(),
        status: z
          .array(
            z
              .number()
              .describe(
                'Options:1(to_be_onboarded To be onboarded),2(active),3(onboarding_cancelled Onboarding cancelle),4(offboarding),5(offboarded)',
              ),
          )
          .describe(
            'Employee statusAll employee statuses will be returned by default if this attribute is not specified.Currently active employees = 2&4Multiple status records can be queried at the same time, such as status=2&status=4',
          )
          .optional(),
        type: z
          .array(
            z
              .number()
              .describe(
                'Options:1(regular To be onboarded),2(intern Active),3(consultant Onboard canceled),4(outsourcing Offboarding),5(contractor Offboarded)',
              ),
          )
          .describe(
            'Employee typeAll employee types will be returned by default if this attribute is not specified.You can use the int value of the custom employee type for search, and the name of the custom employee type for the tenant can be obtained through the API: [Obtain workforce type]',
          )
          .optional(),
        start_time: z.string().describe('Query start time(Hire time &gt= this time)').optional(),
        end_time: z.string().describe('Query end time(Hire time &gt;= this time)').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        user_ids: z
          .array(z.string())
          .describe(
            'user_id, open_id, or union_id. The "open_id" will be returned by default.If the passed value is not an "open_id" , you need to pass the "user_id_type" parameter together.You can query users with multiple ids at once, for example: user_ids=ou_8ebd4f35d7101ffdeb4771d7c8ec517e&user_ids=ou_7abc4f35d7101ffdeb4771dabcde[The ID concepts]',
          )
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('Page size, value range 1~ 100, default 10').optional(),
      })
      .optional(),
  },
};
export const ehrV1Tools = [ehrV1EmployeeList];
