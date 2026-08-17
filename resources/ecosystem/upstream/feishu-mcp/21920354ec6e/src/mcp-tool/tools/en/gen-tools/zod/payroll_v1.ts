import { z } from 'zod';
export type payrollV1ToolName =
  | 'payroll.v1.costAllocationDetail.list'
  | 'payroll.v1.costAllocationPlan.list'
  | 'payroll.v1.costAllocationReport.list'
  | 'payroll.v1.datasourceRecord.query'
  | 'payroll.v1.datasourceRecord.save'
  | 'payroll.v1.datasource.list';
export const payrollV1CostAllocationDetailList = {
  project: 'payroll',
  name: 'payroll.v1.costAllocationDetail.list',
  sdkName: 'payroll.v1.costAllocationDetail.list',
  path: '/open-apis/payroll/v1/cost_allocation_details',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Payroll-cost allocation detail-query details on cost allocation reports-Obtain detailed cost allocation data based on report plan, period and report type. Before invoking the interface, the "financial Posting" switch should be turned on and the cost allocation report should be published',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      page_size: z.number().describe('paging size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      cost_allocation_plan_id: z
        .string()
        .describe('Cost sharing scheme ID, get the id by[batch query cost allocation plans]'),
      pay_period: z
        .string()
        .describe('Period, the month corresponding to the cost allocation statement,the length is 7'),
      report_type: z.number().describe('Report type Options:0(Default),1(Accrued),2(Paid)'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const payrollV1CostAllocationPlanList = {
  project: 'payroll',
  name: 'payroll.v1.costAllocationPlan.list',
  sdkName: 'payroll.v1.costAllocationPlan.list',
  path: '/open-apis/payroll/v1/cost_allocation_plans',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Payroll-cost plan-Get Cost Plans-Get Cost Plans',
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
      pay_period: z
        .string()
        .describe(
          'During the period, generate the year and month corresponding to the cost allocation report. The format is yyyy-MM',
        ),
    }),
  },
};
export const payrollV1CostAllocationReportList = {
  project: 'payroll',
  name: 'payroll.v1.costAllocationReport.list',
  sdkName: 'payroll.v1.costAllocationReport.list',
  path: '/open-apis/payroll/v1/cost_allocation_reports',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Payroll-cost report-Batch Get Cost Reports-Batch Get Cost Reports',
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
      cost_allocation_plan_id: z
        .string()
        .describe('Cost-sharing scheme ID, obtained through [Bulk query cost-sharing scheme]'),
      pay_period: z
        .string()
        .describe(
          'During the period, the year and month corresponding to the cost allocation data are in the format yyyy-MM',
        ),
      report_type: z
        .number()
        .describe(
          'report type Options:0(Default Default - By default, it indicates the type of report that has not been activated for Accrued and RealPay. After activating Accrued and RealPay, this type of report will not be able to be published),1(Accrued),2(Paid RealPay)',
        ),
    }),
  },
};
export const payrollV1DatasourceRecordQuery = {
  project: 'payroll',
  name: 'payroll.v1.datasourceRecord.query',
  sdkName: 'payroll.v1.datasourceRecord.query',
  path: '/open-apis/payroll/v1/datasource_records/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Payroll-datasource_record-query datasource records-1. Support through payroll_period (required), employment_id (optional) these two preset fields, batch query the data record list under the specified data source.2. The data source configuration information can be obtained from the [list datasource configs] or "Feishu Personnel Background - Settings - Salary Data Settings - External Data Source Configuration" page',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      source_code: z.string().describe('Data source code'),
      selected_fields: z
        .array(z.string())
        .describe(
          'Specifies the data source field code for the query.1. If this field is not passed in, all data source fields are returned by default2. If passed in, in addition to returning the specified field, the system will return the value of emplyment_id, payroll_period fields by default',
        )
        .optional(),
      field_filters: z
        .array(
          z.object({
            field_code: z.string().describe('Field Encoding'),
            field_values: z.array(z.string()).describe('List of included field values').optional(),
          }),
        )
        .describe(
          'List of query conditions, and the relationship between multiple conditions. The supported query conditions are as follows:1. employment_id- Not required, up to 100 passes, field_type = 3 (text type).- This id is the basic information id of the employee in Feishu personnel, which can be obtained through [Search employee information].The query operator only supports IsAnyOf (inclusive).2. The time range condition must be transmitted. According to the different data writing dimensions of the data source, the supported time range query conditions are as follows:- Payroll period dimension. payroll_period field, format: 2024-01,Query method: The IsAnyOf operator enumerates the months to be checked, up to a maximum of 2 months.- Data date dimension (in grey release). occur_day fields, format 2024-01-02,Query method: Query through the InDateRange operator (date range query), occur_day time range is not allowed to exceed 90 days,- Custom data period dimension (in grey release). custom_start, custom_end fields, format: 2024-01-02. Query method: both must be passed, query through InDateRange operator (date range query), the time range is not allowed to exceed 90 days',
        )
        .optional(),
    }),
    params: z.object({
      page_size: z.number(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const payrollV1DatasourceRecordSave = {
  project: 'payroll',
  name: 'payroll.v1.datasourceRecord.save',
  sdkName: 'payroll.v1.datasourceRecord.save',
  path: '/open-apis/payroll/v1/datasource_records/save',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Payroll-datasource_record-save datasource records-Refer to the data source configuration field format to save (create or update) data records in batches.1. The unique flag of the record is judged by the business primary key (employment_id + payroll_period)2. If there is no data record, 1 record will be inserted into this save.3. If a data record already exists, this save will overwrite and update the existing record (only the value of the incoming field is updated, and the value of the unpassed field is not updated). If the incoming data record has not changed, it will not be updated.4. If the update or insertion is successful, the number of records that have changed the data will be returned',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      source_code: z
        .string()
        .describe(
          'Data source code. External data source configuration information can be obtained from [https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/payroll-v1/datasources/list]Or on the "Feishu Personnel Background - Settings - Salary Data Settings - External Data Source Configuration" page, get',
        ),
      records: z
        .array(
          z.object({
            active_status: z
              .number()
              .describe(
                'The enable and deactivate status of the record. Description: After the data record is deactivated, it can still be saved and queried by the API, but it cannot be used for salary calculation. Options:1(active Enabled),2(in_active Deactivated)',
              ),
            field_values: z
              .array(
                z.object({
                  field_code: z
                    .string()
                    .describe(
                      'Data source field code, please ensure that the field exists and is enabled. You can get it from the "Query External Data Source Settings" API or "Feishu Personnel Background - Settings - Salary Data Settings - External Data Source Configuration" page',
                    ),
                  value: z
                    .string()
                    .describe(
                      'Field values, transmitted by string, are not allowed to enter empty strings, please ensure that the value of the field conforms to the type constraints.',
                    ),
                  field_type: z
                    .number()
                    .describe(
                      '1. There is no need to pass this field, it is only for documentation.2. Field types can be obtained from datasources.fields.field_type in the return value of Query External Data Source Settings3. The format of the value passed by value must conform to the type constraints:- field_type = 1: Amount. eg: "12.23". Currently only RMB ¥is supported, and the accuracy beyond the setting will be rounded;- field_type = 2: numeric. eg: "12.23". Accuracies exceeding the setting are rounded.- field_type = 3: Text. eg: "I am a piece of text". The number of text characters cannot exceed 500, and the total number of characters in a recorded text cannot exceed 3000.- field_type = 4: Date. All custom fields except the payroll_period field preset by the system have the date format "yyy-mm-dd", example: "2024-01-01". But payroll_period represents the payroll period, accurate to the month, format "yyy-mm", example: "2024-01".- field_type = 5: percentage. Percentage "10" represents 10%, with a maximum of two decimal places, rounded',
                    )
                    .optional(),
                }),
              )
              .describe(
                'List of specific field values to create or update records:- Required fields:According to the data of the recorded data source, there are different required fields for writing dimension attributes:1. Dimension of salary calculation period. "payroll_period", "employment_id" fields must be passed, payroll_period format: "2024-01".2. Data date dimension (in grey release). "occur_day", "employment_id" fields must be passed. occur_day format: "2024-01-02".3. Customize the data period dimension (in grey release). "custom_start", "custom_end", "employment_id" fields must be passed. custom_start, custom_end format: "2024-01-02".employment_id is the basic information id of the employee in Feishu personnel, which can be obtained through [search employee information]- Other custom fields can be passed in according to the request, and it is necessary to ensure that the written fields exist and are enabled in the configuration. Field codes cannot be passed in repeatedly, and the value of the field must meet the constraints corresponding to the type',
              ),
          }),
        )
        .describe('List of records to be saved'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const payrollV1DatasourceList = {
  project: 'payroll',
  name: 'payroll.v1.datasource.list',
  sdkName: 'payroll.v1.datasource.list',
  path: '/open-apis/payroll/v1/datasources',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Payroll-datasource config-list datasource configs-Batch query Feishu personnel background: Settings - > Salary data settings - > External data source settings, the list of data source settings in',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      page_size: z.number(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const payrollV1Tools = [
  payrollV1CostAllocationDetailList,
  payrollV1CostAllocationPlanList,
  payrollV1CostAllocationReportList,
  payrollV1DatasourceRecordQuery,
  payrollV1DatasourceRecordSave,
  payrollV1DatasourceList,
];
