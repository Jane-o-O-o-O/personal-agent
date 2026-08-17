import { z } from 'zod';
export type apaasV1ToolName =
  | 'apaas.v1.app.list'
  | 'apaas.v1.applicationAuditLog.auditLogList'
  | 'apaas.v1.applicationAuditLog.dataChangeLogDetail'
  | 'apaas.v1.applicationAuditLog.dataChangeLogsList'
  | 'apaas.v1.applicationAuditLog.get'
  | 'apaas.v1.applicationEnvironmentVariable.get'
  | 'apaas.v1.applicationEnvironmentVariable.query'
  | 'apaas.v1.applicationFlow.execute'
  | 'apaas.v1.applicationFunction.invoke'
  | 'apaas.v1.applicationObject.oqlQuery'
  | 'apaas.v1.applicationObjectRecord.batchCreate'
  | 'apaas.v1.applicationObjectRecord.batchDelete'
  | 'apaas.v1.applicationObjectRecord.batchQuery'
  | 'apaas.v1.applicationObjectRecord.batchUpdate'
  | 'apaas.v1.applicationObjectRecord.create'
  | 'apaas.v1.applicationObjectRecord.delete'
  | 'apaas.v1.applicationObjectRecord.patch'
  | 'apaas.v1.applicationObjectRecord.query'
  | 'apaas.v1.applicationObject.search'
  | 'apaas.v1.applicationRecordPermissionMember.batchCreateAuthorization'
  | 'apaas.v1.applicationRecordPermissionMember.batchRemoveAuthorization'
  | 'apaas.v1.applicationRoleMember.batchCreateAuthorization'
  | 'apaas.v1.applicationRoleMember.batchRemoveAuthorization'
  | 'apaas.v1.applicationRoleMember.get'
  | 'apaas.v1.approvalInstance.cancel'
  | 'apaas.v1.approvalTask.addAssignee'
  | 'apaas.v1.approvalTask.agree'
  | 'apaas.v1.approvalTask.reject'
  | 'apaas.v1.approvalTask.transfer'
  | 'apaas.v1.seatActivity.list'
  | 'apaas.v1.seatAssignment.list'
  | 'apaas.v1.userTask.cc'
  | 'apaas.v1.userTask.chatGroup'
  | 'apaas.v1.userTask.expediting'
  | 'apaas.v1.userTask.query'
  | 'apaas.v1.userTask.rollback'
  | 'apaas.v1.userTask.rollbackPoints';
export const apaasV1AppList = {
  project: 'apaas',
  name: 'apaas.v1.app.list',
  sdkName: 'apaas.v1.app.list',
  path: '/open-apis/apaas/v1/apps',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Application-Query application basic information-Query basic information of applications under a tenant, such as application name and application namespace',
  accessTokens: ['user'],
  schema: {
    params: z
      .object({
        page_size: z.string().describe('Page size, required, range: [0,50]').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const apaasV1ApplicationAuditLogAuditLogList = {
  project: 'apaas',
  name: 'apaas.v1.applicationAuditLog.auditLogList',
  sdkName: 'apaas.v1.applicationAuditLog.auditLogList',
  path: '/open-apis/apaas/v1/applications/:namespace/audit_log/audit_log_list',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Feishu aPaaS-audit log-Query audit log list-Query the audit log list',
  accessTokens: ['user'],
  schema: {
    params: z.object({
      page_size: z.string().describe('paging size'),
      offset: z.string().describe('number of pages turned'),
      quick_query: z.string().describe('fuzzy query').optional(),
      from: z.string().describe('Query time range: start time (in millisecond timestamps)'),
      to: z.string().describe('Query time range: end time (in millisecond timestamps)'),
      log_type: z
        .string()
        .describe(
          'Log type:- 10000: all logs- 10001: Enterprise management log- 10002: Login log- 10003: Application management log',
        ),
      filter: z.string().describe('Log queries: filtering capabilities').optional(),
      columns: z
        .array(z.string())
        .describe(
          'Log list: choose to display line information such as ["opTime", "appName", "eventName", "clientIP", "operator", "status"]',
        )
        .optional(),
      sort_by: z.string().describe('Query sorting field: optionally operation time (opTime)').optional(),
      sort_order: z
        .string()
        .describe('Query sorting: default by time from large to small; use asc from small to large')
        .optional(),
      app_type: z.string().describe('Application type, 0 is the apaas type, 1 is the aily type').optional(),
    }),
    path: z.object({ namespace: z.string().describe('application namespace') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const apaasV1ApplicationAuditLogDataChangeLogDetail = {
  project: 'apaas',
  name: 'apaas.v1.applicationAuditLog.dataChangeLogDetail',
  sdkName: 'apaas.v1.applicationAuditLog.dataChangeLogDetail',
  path: '/open-apis/apaas/v1/applications/:namespace/audit_log/data_change_log_detail',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Feishu aPaaS-audit log-Data Change Log Detail-Query data change log details by log ID',
  accessTokens: ['user'],
  schema: {
    params: z.object({ log_id: z.string().describe('Data changelog ID information') }),
    path: z.object({ namespace: z.string().describe('application') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const apaasV1ApplicationAuditLogDataChangeLogsList = {
  project: 'apaas',
  name: 'apaas.v1.applicationAuditLog.dataChangeLogsList',
  sdkName: 'apaas.v1.applicationAuditLog.dataChangeLogsList',
  path: '/open-apis/apaas/v1/applications/:namespace/audit_log/data_change_logs_list',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu aPaaS-audit log-Data Change Logs List-Query the data changelog list based on search/filter criteria',
  accessTokens: ['user'],
  schema: {
    params: z.object({
      quick_query: z.string().describe('fuzzy query').optional(),
      page_size: z.string().describe('paging size'),
      offset: z.string().describe('number of pages turned'),
      from: z.string().describe('Query time range: start time').optional(),
      to: z.string().describe('Query time range: end time').optional(),
      log_type: z.string().describe('Log Type: 10007 - Data Changelog'),
      filter: z.string().describe('Log queries: filtering capabilities').optional(),
      columns: z
        .array(z.string())
        .describe(
          'Log list: choose to display line information such as ["opTime", "appName", "eventName", "clientIP", "operator", "status"]',
        )
        .optional(),
      sort_by: z.string().describe('Query sorting field: optionally operation time (opTime)').optional(),
      sort_order: z.string().describe('Query sorting: use asc from small to large by time').optional(),
      app_type: z.string().describe('Application type, 0 is the apaas type, 1 is the illy type').optional(),
    }),
    path: z.object({ namespace: z.string().describe('application namespace') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const apaasV1ApplicationAuditLogGet = {
  project: 'apaas',
  name: 'apaas.v1.applicationAuditLog.get',
  sdkName: 'apaas.v1.applicationAuditLog.get',
  path: '/open-apis/apaas/v1/applications/:namespace/audit_log',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Feishu aPaaS-audit log-Query The Audit Log detail-Query log details based on Log ID',
  accessTokens: ['user'],
  schema: {
    params: z.object({
      log_id: z.string().describe('Audit log ID information (obtain a single log ID by [Query audit log list])'),
    }),
    path: z.object({ namespace: z.string().describe('Application namespace') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const apaasV1ApplicationEnvironmentVariableGet = {
  project: 'apaas',
  name: 'apaas.v1.applicationEnvironmentVariable.get',
  sdkName: 'apaas.v1.applicationEnvironmentVariable.get',
  path: '/open-apis/apaas/v1/applications/:namespace/environment_variables/:environment_variable_api_name',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Environment Variable-Query Environment Variable Details-Query details of a specified environment variable in an app built on Feishu aPaaS, including label, description, value, etc',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      namespace: z.string().describe('application namespace'),
      environment_variable_api_name: z.string().describe('Environment variables API name'),
    }),
  },
};
export const apaasV1ApplicationEnvironmentVariableQuery = {
  project: 'apaas',
  name: 'apaas.v1.applicationEnvironmentVariable.query',
  sdkName: 'apaas.v1.applicationEnvironmentVariable.query',
  path: '/open-apis/apaas/v1/applications/:namespace/environment_variables/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Environment Variable-Query Environment Variables List-Query a list of environment variables in an app built on Feishu aPaaS',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        filter: z
          .object({ quick_query: z.string().describe('Fuzzy search by keyword').optional() })
          .describe('Filter')
          .optional(),
        limit: z
          .number()
          .describe('Limit for the number of records. The default is 500, and the upper limit is 500')
          .optional(),
        offset: z
          .number()
          .describe(
            'Offset of returned records. The default is 0, which means data will be returned beginning from the first record found',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ namespace: z.string() }),
  },
};
export const apaasV1ApplicationFlowExecute = {
  project: 'apaas',
  name: 'apaas.v1.applicationFlow.execute',
  sdkName: 'apaas.v1.applicationFlow.execute',
  path: '/open-apis/apaas/v1/applications/:namespace/flows/:flow_id/execute',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Flow-operator flow-Execute flow-Execute the corresponding flow',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      is_async: z.boolean().describe('Whether to execute asynchronously (default false without passing)').optional(),
      idempotent_key: z
        .string()
        .describe(
          'idempotent key (it is recommended to generate uuid locally and pass it, if repeated, the request will report an error)',
        )
        .optional(),
      loop_masks: z
        .array(z.string())
        .describe('Loop flag information (the current version can not be passed)')
        .optional(),
      params: z
        .string()
        .describe('flow imported parameters (json string, when flow have no input params, it can not be passed)')
        .optional(),
      operator: z
        .string()
        .describe(
          'Operator (fill in at least one _id and email, the id and email of the user of the low-code platform, need to be obtained from the low-code platform, json string)',
        ),
    }),
    path: z.object({
      namespace: z
        .string()
        .describe('Application namespace (low_code platform - > My Apps - > Application Management - > viewable)'),
      flow_id: z
        .string()
        .describe(
          'Flow API name (low_code platform - > my app - > development - > flow - > expand to table - > viewable)',
        ),
    }),
  },
};
export const apaasV1ApplicationFunctionInvoke = {
  project: 'apaas',
  name: 'apaas.v1.applicationFunction.invoke',
  sdkName: 'apaas.v1.applicationFunction.invoke',
  path: '/open-apis/apaas/v1/applications/:namespace/functions/:function_api_name/invoke',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Function-Execution Function-execute the custom functions in an app built on Feishu App Engine',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({ params: z.string().describe('Function input parameters (a string after JSON marshal)').optional() })
      .optional(),
    path: z.object({
      namespace: z.string().describe('Application namespace'),
      function_api_name: z.string().describe('Function API name'),
    }),
  },
};
export const apaasV1ApplicationObjectOqlQuery = {
  project: 'apaas',
  name: 'apaas.v1.applicationObject.oqlQuery',
  sdkName: 'apaas.v1.applicationObject.oqlQuery',
  path: '/open-apis/apaas/v1/applications/:namespace/objects/oql_query',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Object-Execute OQL-Execute OQL statement in an app',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      query: z.string().describe('OQL statement to execute'),
      args: z.string().describe('Specify the value of anonymous parameters in an OQL statement').optional(),
      named_args: z.string().describe('Specify the value of named parameters in an OQL statement').optional(),
    }),
    path: z.object({ namespace: z.string() }),
  },
};
export const apaasV1ApplicationObjectRecordBatchCreate = {
  project: 'apaas',
  name: 'apaas.v1.applicationObjectRecord.batchCreate',
  sdkName: 'apaas.v1.applicationObjectRecord.batchCreate',
  path: '/open-apis/apaas/v1/applications/:namespace/objects/:object_api_name/records/batch_create',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Object-Batch Create Records-Creates multiple records',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ records: z.string().describe('The list to be created, create up to 500 records at a time') }),
    path: z.object({ namespace: z.string(), object_api_name: z.string() }),
  },
};
export const apaasV1ApplicationObjectRecordBatchDelete = {
  project: 'apaas',
  name: 'apaas.v1.applicationObjectRecord.batchDelete',
  sdkName: 'apaas.v1.applicationObjectRecord.batchDelete',
  path: '/open-apis/apaas/v1/applications/:namespace/objects/:object_api_name/records/batch_delete',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Feishu aPaaS-Object-Batch Delete Records-Deletes multiple records',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      ids: z.array(z.string()).describe('The record ID list you want to delete, delete up to 500 pieces at a time'),
    }),
    path: z.object({ namespace: z.string(), object_api_name: z.string() }),
  },
};
export const apaasV1ApplicationObjectRecordBatchQuery = {
  project: 'apaas',
  name: 'apaas.v1.applicationObjectRecord.batchQuery',
  sdkName: 'apaas.v1.applicationObjectRecord.batchQuery',
  path: '/open-apis/apaas/v1/applications/:namespace/objects/:object_api_name/records/batch_query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Object-Query Record List-Get the record list that meets specified conditions',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      select: z
        .array(z.string())
        .describe(
          'Field to get. Using the unique identifier of field to query. Joined fields can be drilled down by "."',
        ),
      filter: z
        .object({
          conditions: z
            .array(
              z.object({
                index: z.string().describe('The index of the current condition. Used in logic').optional(),
                left: z
                  .object({
                    type: z
                      .string()
                      .describe('Type: The left value contains the following options: 1. metadataVariable')
                      .optional(),
                    settings: z.string().describe('Configuration of left or right value in JSON format').optional(),
                  })
                  .describe('Left value of filter condition')
                  .optional(),
                right: z
                  .object({
                    type: z
                      .string()
                      .describe('Type: The right value contains the following options: 1. constant')
                      .optional(),
                    settings: z.string().describe('Configuration of left or right value in JSON format').optional(),
                  })
                  .describe('Right value of filter condition')
                  .optional(),
                operator: z.string().describe('Operator for linking left and right values').optional(),
              }),
            )
            .describe('Conditions array')
            .optional(),
          logic_expression: z.string().describe('The logical relationship between multiple conditions').optional(),
        })
        .describe('Filter condition. Conditions are specified in the JSON format')
        .optional(),
      order_by: z
        .array(
          z.object({
            field: z.string().describe('API Name of the field'),
            direction: z
              .enum(['ASC', 'DESC'])
              .describe(
                'Sorting parameter: sort direction Options:ASC(SortDirectionASC ascending order),DESC(SortDirectionDESC descending order)',
              ),
          }),
        )
        .describe(
          'Sorting parameters. Conditions are specified in the JSON format. Specifically, "field" refers to the fields to be sorted and "direction" refers to the sorting order in which multiple conditions take effect according to their order in the array',
        )
        .optional(),
      group_by: z
        .array(z.object({ field: z.string().describe('API Name of the field') }))
        .describe(
          'Aggregate parameter. Conditions are specified in JSON format. Specifically, "field" refers to the fields that will be aggregated',
        )
        .optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      use_page_token: z
        .boolean()
        .describe(
          'Whether to use page_token. If true, the value of page_token is used as the start position to query records, and next_page_token will be returned in response. False by default',
        )
        .optional(),
      page_size: z
        .number()
        .describe(
          'The number of records to be returned by the server side, maximum 500 entries. The value will be 500 by default if left blank',
        )
        .optional(),
      offset: z
        .number()
        .describe(
          "Return the offset of the record, which is 0 by default, that is, return from the first record found. The query performance will be poor if the offset is large, and it may result in API response timeout. It's recommended to use ID cursor-based pagination when pulling all records",
        )
        .optional(),
      need_total_count: z
        .boolean()
        .describe(
          'Whether to return the total number of conditions that meet the conditions (Total). False by default, the total number will not be returned',
        )
        .optional(),
    }),
    path: z.object({ namespace: z.string(), object_api_name: z.string() }),
  },
};
export const apaasV1ApplicationObjectRecordBatchUpdate = {
  project: 'apaas',
  name: 'apaas.v1.applicationObjectRecord.batchUpdate',
  sdkName: 'apaas.v1.applicationObjectRecord.batchUpdate',
  path: '/open-apis/apaas/v1/applications/:namespace/objects/:object_api_name/records/batch_update',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Feishu aPaaS-Object-Batch Update Records-Edits multiple records',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ records: z.string().describe('The list to be updated, up to 500 updates at a time') }),
    path: z.object({ namespace: z.string(), object_api_name: z.string() }),
  },
};
export const apaasV1ApplicationObjectRecordCreate = {
  project: 'apaas',
  name: 'apaas.v1.applicationObjectRecord.create',
  sdkName: 'apaas.v1.applicationObjectRecord.create',
  path: '/open-apis/apaas/v1/applications/:namespace/objects/:object_api_name/records',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Object-Create Record-Creates record',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ record: z.string().describe('Record details') }),
    path: z.object({ namespace: z.string(), object_api_name: z.string() }),
  },
};
export const apaasV1ApplicationObjectRecordDelete = {
  project: 'apaas',
  name: 'apaas.v1.applicationObjectRecord.delete',
  sdkName: 'apaas.v1.applicationObjectRecord.delete',
  path: '/open-apis/apaas/v1/applications/:namespace/objects/:object_api_name/records/:id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Feishu aPaaS-Object-Delete Record-Deletes specified record',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ namespace: z.string(), object_api_name: z.string(), id: z.string() }),
  },
};
export const apaasV1ApplicationObjectRecordPatch = {
  project: 'apaas',
  name: 'apaas.v1.applicationObjectRecord.patch',
  sdkName: 'apaas.v1.applicationObjectRecord.patch',
  path: '/open-apis/apaas/v1/applications/:namespace/objects/:object_api_name/records/:id',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Feishu aPaaS-Object-Edit Record-Edits specified record',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ record: z.string().describe('Record details') }),
    path: z.object({ namespace: z.string(), object_api_name: z.string(), id: z.string() }),
  },
};
export const apaasV1ApplicationObjectRecordQuery = {
  project: 'apaas',
  name: 'apaas.v1.applicationObjectRecord.query',
  sdkName: 'apaas.v1.applicationObjectRecord.query',
  path: '/open-apis/apaas/v1/applications/:namespace/objects/:object_api_name/records/:id/query',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Object-Get Record Details-Get specified record details',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        select: z
          .array(z.string())
          .describe(
            'Field to get. Using the unique identifier of field to query. Joined fields can be drilled down by "."',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ namespace: z.string(), object_api_name: z.string(), id: z.string() }),
  },
};
export const apaasV1ApplicationObjectSearch = {
  project: 'apaas',
  name: 'apaas.v1.applicationObject.search',
  sdkName: 'apaas.v1.applicationObject.search',
  path: '/open-apis/apaas/v1/applications/:namespace/objects/search',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Object-Search Record-Searches recourds in app',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        q: z.string().describe('Keyword').optional(),
        search_objects: z
          .array(
            z.object({
              api_name: z
                .string()
                .describe('Indicates the objects to be searched, where the API name of the object is the value')
                .optional(),
              search_fields: z
                .array(z.string())
                .describe('List of return field searched, only _id will be returned by default')
                .optional(),
              select: z
                .array(z.string())
                .describe(
                  'List of search field, only searchable fields set in the object are valid, search all searchable fields if left blank',
                )
                .optional(),
              filter: z
                .object({
                  conditions: z
                    .array(
                      z.object({
                        index: z.string().describe('The index of the current condition. Used in logic').optional(),
                        left: z
                          .object({
                            type: z
                              .string()
                              .describe('Type: The left value contains the following options: 1. metadataVariable')
                              .optional(),
                            settings: z
                              .string()
                              .describe('Configuration of left or right value in JSON format')
                              .optional(),
                          })
                          .describe('Left value of filter condition')
                          .optional(),
                        right: z
                          .object({
                            type: z
                              .string()
                              .describe('Type: The right value contains the following options: 1. constant')
                              .optional(),
                            settings: z
                              .string()
                              .describe('Configuration of left or right value in JSON format')
                              .optional(),
                          })
                          .describe('Right value of filter condition')
                          .optional(),
                        operator: z.string().describe('Operator for linking left and right values').optional(),
                      }),
                    )
                    .describe('Filter condition')
                    .optional(),
                  logic_expression: z
                    .string()
                    .describe('The logical relationship between multiple conditions')
                    .optional(),
                })
                .describe('Filter conditions, please use the standard Criterion structure')
                .optional(),
              order_by: z
                .object({
                  field: z.string().describe('Sorting parameter: API name of sorting field').optional(),
                  order_type: z
                    .enum(['asc', 'desc'])
                    .describe(
                      'Sorting parameter: sort direction, contains the following options: 1. asc, which stands for ascending order 2. desc, which stands for descending order Options:asc(OrderTypeASC ascending order),desc(OrderTypeDESC descending order)',
                    )
                    .optional(),
                })
                .describe('Sorting field. Multiple fields can be designated for sorting')
                .optional(),
            }),
          )
          .describe('Range of search object, no more than 5 objects')
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.string().describe('Number of search record, 20 by default, up to 200 only').optional(),
        metadata: z
          .enum(['Label', 'SearchLayout'])
          .describe(
            'Control the metadata returned: Label, returns the Label value when searching the corresponding entity metadata; SearchLayout, returns search layout info, corresponding field values, and Label values Options:Label(MetadataOptionLabel returns the Label value when searching the corresponding entity metadata),SearchLayout(MetadataOptionSearchLayout returns search layout info, corresponding field values, and Label values)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ namespace: z.string() }),
  },
};
export const apaasV1ApplicationRecordPermissionMemberBatchCreateAuthorization = {
  project: 'apaas',
  name: 'apaas.v1.applicationRecordPermissionMember.batchCreateAuthorization',
  sdkName: 'apaas.v1.applicationRecordPermissionMember.batchCreateAuthorization',
  path: '/open-apis/apaas/v1/applications/:namespace/record_permissions/:record_permission_api_name/member/batch_create_authorization',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Permission-Record Permission-Batch Create Record Permission Member Authorizations-Batch create record permission user authorizations',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_ids: z
          .array(z.string())
          .describe('List of user IDs to be added, using user IDs of the Feishu aPaaS')
          .optional(),
      })
      .optional(),
    path: z.object({
      namespace: z.string().describe('namespace'),
      record_permission_api_name: z.string().describe('Record permission API name'),
    }),
  },
};
export const apaasV1ApplicationRecordPermissionMemberBatchRemoveAuthorization = {
  project: 'apaas',
  name: 'apaas.v1.applicationRecordPermissionMember.batchRemoveAuthorization',
  sdkName: 'apaas.v1.applicationRecordPermissionMember.batchRemoveAuthorization',
  path: '/open-apis/apaas/v1/applications/:namespace/record_permissions/:record_permission_api_name/member/batch_remove_authorization',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Permission-Record Permission-Batch Delete Record Permission Member Authorizations-Batch delete record permission user authorizations',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_ids: z
          .array(z.string())
          .describe('List of user IDs to be deleted, using user IDs of the Feishu aPaaS')
          .optional(),
      })
      .optional(),
    path: z.object({
      namespace: z.string().describe('namespace'),
      record_permission_api_name: z.string().describe('Record permission API name'),
    }),
  },
};
export const apaasV1ApplicationRoleMemberBatchCreateAuthorization = {
  project: 'apaas',
  name: 'apaas.v1.applicationRoleMember.batchCreateAuthorization',
  sdkName: 'apaas.v1.applicationRoleMember.batchCreateAuthorization',
  path: '/open-apis/apaas/v1/applications/:namespace/roles/:role_api_name/member/batch_create_authorization',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Permission-Role-Batch Create Role Member Authorizations-Batch create role member authorizations',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_ids: z
          .array(z.string())
          .describe('List of user IDs to be added, using user IDs of the Feishu aPaaS')
          .optional(),
        department_ids: z
          .array(z.string())
          .describe('List of department IDs to be added, using department IDs of the Feishu aPaaS')
          .optional(),
      })
      .optional(),
    path: z.object({
      namespace: z.string().describe('namespace'),
      role_api_name: z.string().describe('Role API name'),
    }),
  },
};
export const apaasV1ApplicationRoleMemberBatchRemoveAuthorization = {
  project: 'apaas',
  name: 'apaas.v1.applicationRoleMember.batchRemoveAuthorization',
  sdkName: 'apaas.v1.applicationRoleMember.batchRemoveAuthorization',
  path: '/open-apis/apaas/v1/applications/:namespace/roles/:role_api_name/member/batch_remove_authorization',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Permission-Role-Batch Delete Role Member Authorizations-Batch delete role member authorizations',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_ids: z
          .array(z.string())
          .describe('List of user IDs to be deleted, using user IDs of the Feishu aPaaS')
          .optional(),
        department_ids: z
          .array(z.string())
          .describe('List of department IDs to be deleted, using department IDs of the Feishu aPaaS')
          .optional(),
      })
      .optional(),
    path: z.object({ namespace: z.string(), role_api_name: z.string().describe('Role API name') }),
  },
};
export const apaasV1ApplicationRoleMemberGet = {
  project: 'apaas',
  name: 'apaas.v1.applicationRoleMember.get',
  sdkName: 'apaas.v1.applicationRoleMember.get',
  path: '/open-apis/apaas/v1/applications/:namespace/roles/:role_api_name/member',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Feishu aPaaS-Permission-Role-Query Role Member-Query Role Member',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        need_display_name: z
          .boolean()
          .describe(
            'Whether a display name is required for formula (so that it can be easily understood and displayed in the user interface)',
          )
          .optional(),
        use_api_id: z
          .boolean()
          .describe('Whether to use the APIID field as an request and response parameter, the default value is false')
          .optional(),
      })
      .optional(),
    path: z.object({
      namespace: z.string().describe('namespace'),
      role_api_name: z.string().describe('Role API name'),
    }),
  },
};
export const apaasV1ApprovalInstanceCancel = {
  project: 'apaas',
  name: 'apaas.v1.approvalInstance.cancel',
  sdkName: 'apaas.v1.approvalInstance.cancel',
  path: '/open-apis/apaas/v1/approval_instances/:approval_instance_id/cancel',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Flow-User task-Cancel User Task-Cancel a human task (including approval tasks, fill in tasks)',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z
        .string()
        .describe('The kunlunUserID of the operating user can be obtained through the Apaas user management page'),
      opinion: z.string().describe('Reason for revocation'),
    }),
    path: z.object({
      approval_instance_id: z
        .string()
        .describe(
          'Approval instance, which can be obtained by [Query Human Task] (/uAjLw4CM/ukTMukTMukTM/apaas-v1/user_task/query)',
        ),
    }),
  },
};
export const apaasV1ApprovalTaskAddAssignee = {
  project: 'apaas',
  name: 'apaas.v1.approvalTask.addAssignee',
  sdkName: 'apaas.v1.approvalTask.addAssignee',
  path: '/open-apis/apaas/v1/approval_tasks/:approval_task_id/add_assignee',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Flow-User task-Add approver for user task-Perform the action of adding approver for user task',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z.string().describe('Operator ID'),
      approvers: z.array(z.string()).describe('List of approvers').optional(),
      add_assignee_type: z
        .string()
        .describe(
          'Type of adding approver:- Parallel appoval: currentAndAddAssign- Sequential approval: afterAndAddAssign',
        )
        .optional(),
      opinion: z.string().describe('Reason for approver addition').optional(),
    }),
    path: z.object({ approval_task_id: z.string().describe('User task ID') }),
  },
};
export const apaasV1ApprovalTaskAgree = {
  project: 'apaas',
  name: 'apaas.v1.approvalTask.agree',
  sdkName: 'apaas.v1.approvalTask.agree',
  path: '/open-apis/apaas/v1/approval_tasks/:approval_task_id/agree',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Flow-User task-Approve user task-Perform approval actions for user task',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z.string().describe('Operator ID'),
      opinion: z.string().describe('Approval comment').optional(),
    }),
    path: z.object({ approval_task_id: z.string().describe('User task ID') }),
  },
};
export const apaasV1ApprovalTaskReject = {
  project: 'apaas',
  name: 'apaas.v1.approvalTask.reject',
  sdkName: 'apaas.v1.approvalTask.reject',
  path: '/open-apis/apaas/v1/approval_tasks/:approval_task_id/reject',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Flow-User task-Reject user task-Perform rejection actions for user task',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z.string().describe('Operator ID'),
      opinion: z.string().describe('Approval comment').optional(),
    }),
    path: z.object({ approval_task_id: z.string().describe('User task ID') }),
  },
};
export const apaasV1ApprovalTaskTransfer = {
  project: 'apaas',
  name: 'apaas.v1.approvalTask.transfer',
  sdkName: 'apaas.v1.approvalTask.transfer',
  path: '/open-apis/apaas/v1/approval_tasks/:approval_task_id/transfer',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Flow-User task-Transfer user task-Perform transfer actions for user task',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z.string().describe('Operator ID'),
      from_user_ids: z.array(z.string()).describe('Original approver ID').optional(),
      to_user_ids: z.array(z.string()).describe('New Approver ID').optional(),
      opinion: z.string().describe('Reason for transfer').optional(),
    }),
    path: z.object({ approval_task_id: z.string().describe('User task ID') }),
  },
};
export const apaasV1SeatActivityList = {
  project: 'apaas',
  name: 'apaas.v1.seatActivity.list',
  sdkName: 'apaas.v1.seatActivity.list',
  path: '/open-apis/apaas/v1/seat_activities',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Seat Activity-Query Seat Activities Details-Gets the most recent active time for a user under a tenant to access an application using a per_user seat or a per_user_per_app seat. Feishu aPaaS system administrator is required to invoke the current API as an authorized person',
  accessTokens: ['user'],
  schema: {
    params: z.object({
      seat_type: z
        .enum(['per_user', 'per_user_per_app'])
        .describe('Options:per_user(per_user),per_user_per_app(per_user_per_app)'),
      page_size: z.string(),
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
export const apaasV1SeatAssignmentList = {
  project: 'apaas',
  name: 'apaas.v1.seatAssignment.list',
  sdkName: 'apaas.v1.seatAssignment.list',
  path: '/open-apis/apaas/v1/seat_assignments',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Seat Assignment-Query seat assignments details-Get details about the assignments of per_user seats and per_user_per_app seats under the tenant, such as user ID, app namespace, etc. Feishu aPaaS system administrator is required to invoke the current API as an authorized person',
  accessTokens: ['user'],
  schema: {
    params: z.object({
      seat_type: z
        .enum(['per_user', 'per_user_per_app'])
        .describe('Options:per_user(per_user),per_user_per_app(per_user_per_app)'),
      page_size: z.string(),
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
export const apaasV1UserTaskCc = {
  project: 'apaas',
  name: 'apaas.v1.userTask.cc',
  sdkName: 'apaas.v1.userTask.cc',
  path: '/open-apis/apaas/v1/user_tasks/:task_id/cc',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Flow-User task-CC User Task-Make a CC of the current task',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      cc_user_ids: z
        .array(z.string())
        .describe("The list of CC's kunlunIDs, available through the Apaas user management page"),
      operator_user_id: z.string().describe('Operator kunlunUserID, available through the Apaas user management page'),
    }),
    path: z.object({
      task_id: z
        .string()
        .describe(
          'Task ID, which can be obtained by [Query Human Task] (/uAjLw4CM/ukTMukTMukTM/apaas-v1/user_task/query)',
        ),
    }),
  },
};
export const apaasV1UserTaskChatGroup = {
  project: 'apaas',
  name: 'apaas.v1.userTask.chatGroup',
  sdkName: 'apaas.v1.userTask.chatGroup',
  path: '/open-apis/apaas/v1/user_tasks/:task_id/chat_group',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Flow-User task-Chat User Task-Start a Feishu group chat based on the task',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      operator_user_id: z.string().describe('Operator kunlunUserID, available through the Apaas user management page'),
      invite_user_ids: z
        .array(z.string())
        .describe('The list of invited group users KunlunID can be obtained through the Apaas user management page')
        .optional(),
      chat_id: z.string().describe('The group openID to be pulled in, if it is empty, create a new group').optional(),
      chat_name: z
        .string()
        .describe('The name of the group to join, which is used to create a group chat when the chat_id is empty')
        .optional(),
    }),
    path: z.object({
      task_id: z
        .string()
        .describe(
          'Task ID, which can be obtained by [Query Human Task] (/uAjLw4CM/ukTMukTMukTM/apaas-v1/user_task/query)',
        ),
    }),
  },
};
export const apaasV1UserTaskExpediting = {
  project: 'apaas',
  name: 'apaas.v1.userTask.expediting',
  sdkName: 'apaas.v1.userTask.expediting',
  path: '/open-apis/apaas/v1/user_tasks/:task_id/expediting',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Flow-User task-Expedition User Task-Initiate a reminder for the current handler of the task',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      operator_user_id: z.string().describe('Operator kunlunUserID, available through the Apaas user management page'),
      expediting_user_ids: z
        .array(z.string())
        .describe('The kunlunID list of the sponsor can be obtained through the Apaas user management page'),
      opinion: z.string().describe('Reason for urging').optional(),
    }),
    path: z.object({
      task_id: z
        .string()
        .describe(
          'Task ID, which can be obtained by [Query Human Task] (/uAjLw4CM/ukTMukTMukTM/apaas-v1/user_task/query)',
        ),
    }),
  },
};
export const apaasV1UserTaskQuery = {
  project: 'apaas',
  name: 'apaas.v1.userTask.query',
  sdkName: 'apaas.v1.userTask.query',
  path: '/open-apis/apaas/v1/user_task/query',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Flow-User task-Query User Task-Query the human task list',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      type: z.string().describe('Type- archived: completed - pending: to be processed').optional(),
      source: z.string().describe('Source - fromMe: I initiated - assignMe: assigned to me- CCMe: CC my').optional(),
      limit: z.string().describe('Get number of items- Minimum value: 1- Max: 50').optional(),
      offset: z.string().describe('starting position').optional(),
      start_time: z.string().describe('Start time (milliseconds)').optional(),
      end_time: z.string().describe('End time (milliseconds)').optional(),
      api_ids: z
        .array(z.string())
        .describe('Process apiid list, which can be obtained through the apaas process list page')
        .optional(),
      kunlun_user_id: z.string().describe('KunlunUserID, available through the Apaas user management page'),
    }),
  },
};
export const apaasV1UserTaskRollback = {
  project: 'apaas',
  name: 'apaas.v1.userTask.rollback',
  sdkName: 'apaas.v1.userTask.rollback',
  path: '/open-apis/apaas/v1/user_tasks/:task_id/rollback',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu aPaaS-Flow-User task-Rollback User Task-Return the current task once',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      operator_user_id: z.string().describe('Operator kunlunUserID, available through the Apaas user management page'),
      to_task_id: z
        .string()
        .describe(
          'The returned task ID can be obtained by [Query the point where the human task can be returned] (/uAjLw4CM/ukTMukTMukTM/apaas-v1/user_task/rollback_points)',
        ),
      opinion: z.string().describe('Reason for return'),
    }),
    path: z.object({
      task_id: z
        .string()
        .describe(
          'Task ID, which can be obtained by [Query Human Task] (/uAjLw4CM/ukTMukTMukTM/apaas-v1/user_task/query)',
        ),
    }),
  },
};
export const apaasV1UserTaskRollbackPoints = {
  project: 'apaas',
  name: 'apaas.v1.userTask.rollbackPoints',
  sdkName: 'apaas.v1.userTask.rollbackPoints',
  path: '/open-apis/apaas/v1/user_tasks/:task_id/rollback_points',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu aPaaS-Flow-User task-Query User Task Rollback Point-Query the location where the current task can be returned',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      operator_user_id: z.string().describe('Operator kunlunUserID, available through the Apaas user management page'),
    }),
    path: z.object({
      task_id: z
        .string()
        .describe(
          'Task ID, which can be obtained by [Query Human Task] (/uAjLw4CM/ukTMukTMukTM/apaas-v1/user_task/query)',
        ),
    }),
  },
};
export const apaasV1Tools = [
  apaasV1AppList,
  apaasV1ApplicationAuditLogAuditLogList,
  apaasV1ApplicationAuditLogDataChangeLogDetail,
  apaasV1ApplicationAuditLogDataChangeLogsList,
  apaasV1ApplicationAuditLogGet,
  apaasV1ApplicationEnvironmentVariableGet,
  apaasV1ApplicationEnvironmentVariableQuery,
  apaasV1ApplicationFlowExecute,
  apaasV1ApplicationFunctionInvoke,
  apaasV1ApplicationObjectOqlQuery,
  apaasV1ApplicationObjectRecordBatchCreate,
  apaasV1ApplicationObjectRecordBatchDelete,
  apaasV1ApplicationObjectRecordBatchQuery,
  apaasV1ApplicationObjectRecordBatchUpdate,
  apaasV1ApplicationObjectRecordCreate,
  apaasV1ApplicationObjectRecordDelete,
  apaasV1ApplicationObjectRecordPatch,
  apaasV1ApplicationObjectRecordQuery,
  apaasV1ApplicationObjectSearch,
  apaasV1ApplicationRecordPermissionMemberBatchCreateAuthorization,
  apaasV1ApplicationRecordPermissionMemberBatchRemoveAuthorization,
  apaasV1ApplicationRoleMemberBatchCreateAuthorization,
  apaasV1ApplicationRoleMemberBatchRemoveAuthorization,
  apaasV1ApplicationRoleMemberGet,
  apaasV1ApprovalInstanceCancel,
  apaasV1ApprovalTaskAddAssignee,
  apaasV1ApprovalTaskAgree,
  apaasV1ApprovalTaskReject,
  apaasV1ApprovalTaskTransfer,
  apaasV1SeatActivityList,
  apaasV1SeatAssignmentList,
  apaasV1UserTaskCc,
  apaasV1UserTaskChatGroup,
  apaasV1UserTaskExpediting,
  apaasV1UserTaskQuery,
  apaasV1UserTaskRollback,
  apaasV1UserTaskRollbackPoints,
];
