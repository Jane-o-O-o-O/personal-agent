import { z } from 'zod';
export type corehrV2ToolName =
  | 'corehr.v2.approvalGroups.get'
  | 'corehr.v2.approvalGroups.openQueryDepartmentChangeListByIds'
  | 'corehr.v2.approvalGroups.openQueryJobChangeListByIds'
  | 'corehr.v2.approver.list'
  | 'corehr.v2.basicInfoBankBranch.search'
  | 'corehr.v2.basicInfoBank.search'
  | 'corehr.v2.basicInfoCity.search'
  | 'corehr.v2.basicInfoCountryRegionSubdivision.search'
  | 'corehr.v2.basicInfoCountryRegion.search'
  | 'corehr.v2.basicInfoCurrency.search'
  | 'corehr.v2.basicInfoDistrict.search'
  | 'corehr.v2.basicInfoLanguage.search'
  | 'corehr.v2.basicInfoNationality.search'
  | 'corehr.v2.basicInfoTimeZone.search'
  | 'corehr.v2.bp.getByDepartment'
  | 'corehr.v2.bp.list'
  | 'corehr.v2.company.active'
  | 'corehr.v2.company.batchGet'
  | 'corehr.v2.company.queryRecentChange'
  | 'corehr.v2.contract.search'
  | 'corehr.v2.costAllocation.batchQuery'
  | 'corehr.v2.costAllocation.createVersion'
  | 'corehr.v2.costAllocation.removeVersion'
  | 'corehr.v2.costAllocation.updateVersion'
  | 'corehr.v2.costCenter.create'
  | 'corehr.v2.costCenter.delete'
  | 'corehr.v2.costCenter.patch'
  | 'corehr.v2.costCenter.queryRecentChange'
  | 'corehr.v2.costCenter.search'
  | 'corehr.v2.costCenterVersion.create'
  | 'corehr.v2.costCenterVersion.delete'
  | 'corehr.v2.costCenterVersion.patch'
  | 'corehr.v2.customOrg.active'
  | 'corehr.v2.customOrg.create'
  | 'corehr.v2.customOrg.deleteOrg'
  | 'corehr.v2.customOrg.patch'
  | 'corehr.v2.customOrg.query'
  | 'corehr.v2.customOrg.updateRule'
  | 'corehr.v2.defaultCostCenter.batchQuery'
  | 'corehr.v2.defaultCostCenter.createVersion'
  | 'corehr.v2.defaultCostCenter.removeVersion'
  | 'corehr.v2.defaultCostCenter.updateVersion'
  | 'corehr.v2.department.batchGet'
  | 'corehr.v2.department.delete'
  | 'corehr.v2.department.parents'
  | 'corehr.v2.department.patch'
  | 'corehr.v2.department.queryMultiTimeline'
  | 'corehr.v2.department.queryOperationLogs'
  | 'corehr.v2.department.queryRecentChange'
  | 'corehr.v2.department.queryTimeline'
  | 'corehr.v2.department.search'
  | 'corehr.v2.department.tree'
  | 'corehr.v2.employee.batchGet'
  | 'corehr.v2.employee.create'
  | 'corehr.v2.employee.search'
  | 'corehr.v2.employeesAdditionalJob.batch'
  | 'corehr.v2.employeesAdditionalJob.create'
  | 'corehr.v2.employeesAdditionalJob.delete'
  | 'corehr.v2.employeesAdditionalJob.patch'
  | 'corehr.v2.employeesBp.batchGet'
  | 'corehr.v2.employeesInternationalAssignment.create'
  | 'corehr.v2.employeesInternationalAssignment.delete'
  | 'corehr.v2.employeesInternationalAssignment.list'
  | 'corehr.v2.employeesInternationalAssignment.patch'
  | 'corehr.v2.employeesJobData.batchGet'
  | 'corehr.v2.employeesJobData.query'
  | 'corehr.v2.enum.search'
  | 'corehr.v2.jobChange.create'
  | 'corehr.v2.jobChange.revoke'
  | 'corehr.v2.jobChange.search'
  | 'corehr.v2.jobFamily.batchGet'
  | 'corehr.v2.jobGrade.create'
  | 'corehr.v2.jobGrade.delete'
  | 'corehr.v2.jobGrade.patch'
  | 'corehr.v2.jobGrade.query'
  | 'corehr.v2.jobLevel.batchGet'
  | 'corehr.v2.job.get'
  | 'corehr.v2.job.list'
  | 'corehr.v2.job.queryRecentChange'
  | 'corehr.v2.location.active'
  | 'corehr.v2.locationAddress.create'
  | 'corehr.v2.locationAddress.delete'
  | 'corehr.v2.locationAddress.patch'
  | 'corehr.v2.location.batchGet'
  | 'corehr.v2.location.patch'
  | 'corehr.v2.location.queryRecentChange'
  | 'corehr.v2.offboarding.edit'
  | 'corehr.v2.offboarding.revoke'
  | 'corehr.v2.offboarding.submitV2'
  | 'corehr.v2.person.create'
  | 'corehr.v2.person.patch'
  | 'corehr.v2.preHire.complete'
  | 'corehr.v2.preHire.create'
  | 'corehr.v2.preHire.delete'
  | 'corehr.v2.preHire.patch'
  | 'corehr.v2.preHire.query'
  | 'corehr.v2.preHire.restoreFlowInstance'
  | 'corehr.v2.preHire.search'
  | 'corehr.v2.preHire.transitTask'
  | 'corehr.v2.preHire.withdrawOnboarding'
  | 'corehr.v2.processRevoke.update'
  | 'corehr.v2.processWithdraw.update'
  | 'corehr.v2.processApprover.update'
  | 'corehr.v2.processExtra.update'
  | 'corehr.v2.processFormVariableData.get'
  | 'corehr.v2.process.get'
  | 'corehr.v2.process.list'
  | 'corehr.v2.processTransfer.update'
  | 'corehr.v2.reportDetailRow.batchDelete'
  | 'corehr.v2.reportDetailRow.batchSave'
  | 'corehr.v2.workforcePlanDetailRow.batchDelete'
  | 'corehr.v2.workforcePlanDetailRow.batchSave'
  | 'corehr.v2.workforcePlanDetail.batch'
  | 'corehr.v2.workforcePlanDetail.batchV2'
  | 'corehr.v2.workforcePlan.list';
export const corehrV2ApprovalGroupsGet = {
  project: 'corehr',
  name: 'corehr.v2.approvalGroups.get',
  sdkName: 'corehr.v2.approvalGroups.get',
  path: '/open-apis/corehr/v2/approval_groups/:process_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization adjustment-Query organization adjustment records by process ID-Query organization adjustment records by process ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z.object({
      process_id: z
        .string()
        .describe(
          'Organizational Structure Adjustment Process ID, the user initiates an organizational structure adjustment through "Feishu Personnel - My Team - Organizational Structure" or "Feishu Personnel - Personnel Management - Organizational Structure", and after submitting for approval, the system will generate one or more approval documents according to the rules configured by the administrator in the approval process',
        ),
    }),
  },
};
export const corehrV2ApprovalGroupsOpenQueryDepartmentChangeListByIds = {
  project: 'corehr',
  name: 'corehr.v2.approvalGroups.openQueryDepartmentChangeListByIds',
  sdkName: 'corehr.v2.approvalGroups.openQueryDepartmentChangeListByIds',
  path: '/open-apis/corehr/v2/approval_groups/open_query_department_change_list_by_ids',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization adjustment-Batch query department change records-Batch query department adjustment content based on department adjustment record ID, such as department adjustment type, department name before and after adjustment, role information before and after department adjustment, etc',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        department_change_ids: z
          .array(z.string())
          .describe(
            'Department adjustment record ID list. The adjustment record details can be obtained through [Query organizational structure adjustment records based on process ID].- Must be the department adjustment record ID under the process corresponding to the query parameter process_id.- If not set, the queried department adjustment record is empty.- The returned change ID type is consistent with the ```department_id_type``` in the query parameter.',
          )
          .optional(),
        need_department_path: z
          .boolean()
          .describe(
            'Whether to return the full path of the department. This is used in the scenario of cascading department creation during organizational structure adjustment. Since the parent department has not yet taken effect, the full path is returned for data query',
          )
          .optional(),
      })
      .optional(),
    params: z.object({
      process_id: z
        .string()
        .describe(
          'Organizational structure adjustment process ID. When a user initiates an organizational structure adjustment through "Feishu HR-My Team-Organizational Structure" or "Feishu HR-Personnel Management-Organizational Structure" and submits it for approval, the system will generate one or more approval documents based on the rules configured by the administrator in the approval process',
        ),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The type of department ID used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV2ApprovalGroupsOpenQueryJobChangeListByIds = {
  project: 'corehr',
  name: 'corehr.v2.approvalGroups.openQueryJobChangeListByIds',
  sdkName: 'corehr.v2.approvalGroups.openQueryJobChangeListByIds',
  path: '/open-apis/corehr/v2/approval_groups/open_query_job_change_list_by_ids',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization adjustment-Batch query job change records-Batch query job change records by job change record ID',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        job_change_ids: z
          .array(z.string())
          .describe(
            'Personnel change record ID List. After the organizational structure adjustment is initiated, an employee change record will be generated for the employees involved in the adjustment. The corresponding record ID is job_change_id. The adjustment record can be obtained by [Query the organizational structure adjustment record according to the process ID].',
          )
          .optional(),
        need_department_path: z.boolean().describe('Whether to return to the full path of the department').optional(),
      })
      .optional(),
    params: z.object({
      process_id: z
        .string()
        .describe(
          'Organizational Structure Adjustment Process ID, the user initiates an organizational structure adjustment through "Feishu Personnel - My Team - Organizational Structure" or "Feishu Personnel - Personnel Management - Organizational Structure", and after submitting for approval, the system will generate one or more approval documents according to the rules configured by the administrator in the approval process',
        ),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The type of department ID used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV2ApproverList = {
  project: 'corehr',
  name: 'corehr.v2.approver.list',
  sdkName: 'corehr.v2.approver.list',
  path: '/open-apis/corehr/v2/approvers',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Feishu People（Enterprise Edition）-Process management-Approver Task-Get specified employment process approver list-Approval tasks depend on the existence of process node instances, each process node instance may contain one or more approval tasks, each task indicates who the current node's approver is, and the interface can obtain the approval task list of the specified member(This function is not controlled by the scope of data permissions)",
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
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      user_id: z.string().describe('Specified employment id. Passed by user_id_type type'),
      approver_status: z
        .number()
        .describe(
          'task status Options:-2(Skipped),-1(Initiated),0(Not started),1(In progress),2(Rejected),3(Approved),4(Cancelled),5(CC),6(Form submitted),12(Failed),14(Rolled back),16(Revoke)',
        )
        .optional(),
    }),
  },
};
export const corehrV2BasicInfoBankBranchSearch = {
  project: 'corehr',
  name: 'corehr.v2.basicInfoBankBranch.search',
  sdkName: 'corehr.v2.basicInfoBankBranch.search',
  path: '/open-apis/corehr/v2/basic_info/bank_branchs/search',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-bank info-Search bank branch information-Search bank branch information, by bank ID, bank branch ID, bank branch's exact name, bank code, bank status or update time",
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        bank_id_list: z.array(z.string()).describe('Bank ID list').optional(),
        bank_branch_id_list: z.array(z.string()).describe('Bank branch ID list').optional(),
        bank_branch_name_list: z.array(z.string()).describe('Bank branch name list').optional(),
        code_list: z
          .array(z.string())
          .describe('List of financial branch codes (link numbers), enabling accurate search of financial branch codes')
          .optional(),
        status_list: z
          .array(z.number().describe('Options:1(active),0(inactive)'))
          .describe('Minimum update time')
          .optional(),
        update_start_time: z.string().describe('Maximum update time').optional(),
        update_end_time: z.string().describe('latest update time').optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const corehrV2BasicInfoBankSearch = {
  project: 'corehr',
  name: 'corehr.v2.basicInfoBank.search',
  sdkName: 'corehr.v2.basicInfoBank.search',
  path: '/open-apis/corehr/v2/basic_info/banks/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-bank info-Search bank information-Search bank information by its ID or exact name',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        bank_id_list: z.array(z.string()).describe('Bank ID list').optional(),
        bank_name_list: z.array(z.string()).describe('Bank name list').optional(),
        status_list: z
          .array(z.number().describe('Options:1(enabled active),0(disabled inactive)'))
          .describe('Status')
          .optional(),
        update_start_time: z.string().describe('Minimum update time').optional(),
        update_end_time: z.string().describe('Maximum update time').optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const corehrV2BasicInfoCitySearch = {
  project: 'corehr',
  name: 'corehr.v2.basicInfoCity.search',
  sdkName: 'corehr.v2.basicInfoCity.search',
  path: '/open-apis/corehr/v2/basic_info/cities/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Location data-Search city information-Search city information, by city ID or principal subdivision (province) ID',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        country_region_subdivision_id_list: z
          .array(z.string())
          .describe(
            'The list of province/administrative region IDs can be obtained through the [Search province/administrative region information] interface.If it is empty, it is a mean query',
          )
          .optional(),
        city_id_list: z.array(z.string()).describe('City ID List.If it is empty, it is a mean query').optional(),
        status_list: z
          .array(z.number().describe('Options:1(active),0(inactive)'))
          .describe('City status list.If it is empty, it is a mean query')
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const corehrV2BasicInfoCountryRegionSubdivisionSearch = {
  project: 'corehr',
  name: 'corehr.v2.basicInfoCountryRegionSubdivision.search',
  sdkName: 'corehr.v2.basicInfoCountryRegionSubdivision.search',
  path: '/open-apis/corehr/v2/basic_info/country_region_subdivisions/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Location data-Search principal subdivision (province) information-Search principal subdivision (province) information by country/region ID, principal subdivision ID, or status',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        country_region_id_list: z
          .array(z.string())
          .describe(
            'List of country/region IDs, which can be obtained through the [Query country/region information] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/corehr-v2/basic_info - country_region/search) interface. Return all records if omitted',
          )
          .optional(),
        country_region_subdivision_id_list: z
          .array(z.string())
          .describe('List of principal subdivision IDs. Return all records if omitted')
          .optional(),
        status_list: z
          .array(z.number().describe('Options:1(Effective take effect),0(Expiration failure)'))
          .describe('Status list, return all if not filled in')
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const corehrV2BasicInfoCountryRegionSearch = {
  project: 'corehr',
  name: 'corehr.v2.basicInfoCountryRegion.search',
  sdkName: 'corehr.v2.basicInfoCountryRegion.search',
  path: '/open-apis/corehr/v2/basic_info/country_regions/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Location data-Search country/region information-Search country/region information according to country/region ID and status',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        country_region_id_list: z
          .array(z.string())
          .describe('Country ID list all records will be returned if omitted')
          .optional(),
        status_list: z
          .array(z.number().describe('Options:1(active),0(inactive)'))
          .describe('Country/region status list.If it is empty, it is a mean query')
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const corehrV2BasicInfoCurrencySearch = {
  project: 'corehr',
  name: 'corehr.v2.basicInfoCurrency.search',
  sdkName: 'corehr.v2.basicInfoCurrency.search',
  path: '/open-apis/corehr/v2/basic_info/currencies/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Currency information-Search currency information-Search currency information according to currency ID and status',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        currency_id_list: z
          .array(z.string())
          .describe('List of currency IDs.If it is empty, it is a mean query')
          .optional(),
        status_list: z
          .array(z.number().describe('Options:1(active),0(inactive)'))
          .describe('Currency status. Match all records if omitted')
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const corehrV2BasicInfoDistrictSearch = {
  project: 'corehr',
  name: 'corehr.v2.basicInfoDistrict.search',
  sdkName: 'corehr.v2.basicInfoDistrict.search',
  path: '/open-apis/corehr/v2/basic_info/districts/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Location data-Search area/county information-Search district/county information, by district/county ID or city ID',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        city_id_list: z
          .array(z.string())
          .describe(
            'The list of city IDs to which it belongs, and the detailed information can be obtained through the [Search city information] interface. Match all records if omitted',
          )
          .optional(),
        district_id_list: z
          .array(z.string())
          .describe('District/county ID list. Match all records if omitted')
          .optional(),
        status_list: z
          .array(z.number().describe('Options:1(active),0(inactive)'))
          .describe('List of status codes. Match all records if omitted')
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const corehrV2BasicInfoLanguageSearch = {
  project: 'corehr',
  name: 'corehr.v2.basicInfoLanguage.search',
  sdkName: 'corehr.v2.basicInfoLanguage.search',
  path: '/open-apis/corehr/v2/basic_info/languages/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Language information-Query language information-Query language information in batches according to language ID and status',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        language_id_list: z.array(z.string()).describe('List of language IDs, if empty, return all data').optional(),
        status_list: z
          .array(z.number().describe('Options:1(active valid),0(inactive invalid)'))
          .describe('status list')
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const corehrV2BasicInfoNationalitySearch = {
  project: 'corehr',
  name: 'corehr.v2.basicInfoNationality.search',
  sdkName: 'corehr.v2.basicInfoNationality.search',
  path: '/open-apis/corehr/v2/basic_info/nationalities/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-nationality info-Search nationality information-Search nationality information according to country ID and nationality ID',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        nationality_id_list: z
          .array(z.string())
          .describe(
            'List of nationality IDs the `person_info.nationality_id_v2` response field from the [Batch get employee information] interface could be used as element of which',
          )
          .optional(),
        country_region_id_list: z
          .array(z.string())
          .describe(
            'Country/region ID List, which can be queried through the [Search country/region information] interface',
          )
          .optional(),
        status_list: z.array(z.number().describe('Options:1(active),0(inactive)')).describe('status list').optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const corehrV2BasicInfoTimeZoneSearch = {
  project: 'corehr',
  name: 'corehr.v2.basicInfoTimeZone.search',
  sdkName: 'corehr.v2.basicInfoTimeZone.search',
  path: '/open-apis/corehr/v2/basic_info/time_zones/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Time zone information-Query time zone information-Query time zone information in batches according to time zone ID and status',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        time_zone_id_list: z.array(z.string()).describe('Time zone ID list, if empty, returns all data').optional(),
        status_list: z
          .array(z.number().describe('Options:1(active invalid),0(inactive valid)'))
          .describe('status list')
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const corehrV2BpGetByDepartment = {
  project: 'corehr',
  name: 'corehr.v2.bp.getByDepartment',
  sdkName: 'corehr.v2.bp.getByDepartment',
  path: '/open-apis/corehr/v2/bps/get_by_department',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-User authorization-Batch Get Department HRBP-Get departmen HRBP information, including HRBPs from superior departments',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      department_id: z
        .string()
        .describe(
          'Department ID, ID type has the same value meaning as department_id_type.You can use the [ID conversion service] to exchange for department_id',
        ),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2BpList = {
  project: 'corehr',
  name: 'corehr.v2.bp.list',
  sdkName: 'corehr.v2.bp.list',
  path: '/open-apis/corehr/v2/bps',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-User authorization-Get HRBP List-Get a list of HRBPs. The list contains HRBP ID and department ID information',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().describe('Page size, up to 500'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV2CompanyActive = {
  project: 'corehr',
  name: 'corehr.v2.company.active',
  sdkName: 'corehr.v2.company.active',
  path: '/open-apis/corehr/v2/companies/active',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Company-Enable/Disable Company-Enabling or deactivating a company',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      company_id: z.string().describe('Company ID- Available from the id field of [Bulk Query Company]'),
      effective_time: z
        .string()
        .describe(
          'Company enable/disable effective time- Fill in the format: YYYY-MM-DD- The system defaults to 00:00:00 on the day of filling in the date.- The interface is only supported up to the smallest unit for the day- Date range requirements: 1900-01-01~ 9999-12-31',
        ),
      active: z
        .boolean()
        .describe('Enabled/Deactivated state.- active pass true means enabled- active pass false means disabled'),
      operation_reason: z.string().describe('Operating reason'),
    }),
  },
};
export const corehrV2CompanyBatchGet = {
  project: 'corehr',
  name: 'corehr.v2.company.batchGet',
  sdkName: 'corehr.v2.company.batchGet',
  path: '/open-apis/corehr/v2/companies/batch_get',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Company-Batch get company information by ID-Query company information in batches by ID',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      company_ids: z
        .array(z.string())
        .describe(
          'List of company IDs to be queried. How to get the ID:- Call [Create Company] [Batch Query Company] and other interfaces to return the department ID',
        ),
    }),
  },
};
export const corehrV2CompanyQueryRecentChange = {
  project: 'corehr',
  name: 'corehr.v2.company.queryRecentChange',
  sdkName: 'corehr.v2.company.queryRecentChange',
  path: '/open-apis/corehr/v2/companies/query_recent_change',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Company-Query information-changed companies-Query the companies whose current effective information has changed within the specified time range, that is, only when the effective time of the current effective version of the company is within the query time range, will the company ID be returned',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().describe('Page size, up to 2000'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      start_date: z
        .string()
        .describe(
          'The start time of the query, in the format "YYYY-MM-DD HH:MM:SS", query for changes in the UTC+8 time zone',
        ),
      end_date: z
        .string()
        .describe(
          'The end time of the query, in the format "YYYY-MM-DD HH:MM:SS", query for changes in the UTC+8 time zone. The end time of the query should be greater than the start time',
        ),
    }),
  },
};
export const corehrV2ContractSearch = {
  project: 'corehr',
  name: 'corehr.v2.contract.search',
  sdkName: 'corehr.v2.contract.search',
  path: '/open-apis/corehr/v2/contracts/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Contract-Search Contract-This interface can be used to search for contract information, including contract start time, contract expected end time, contract actual end time, contract company entity, etc',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        employment_id_list: z
          .array(z.string())
          .describe('Employment ID List, you can get ID by[Get Employment Infomation]')
          .optional(),
        contract_id_list: z
          .array(z.string())
          .describe('Contract ID List, which can be obtained through [Get contract list]')
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
    }),
  },
};
export const corehrV2CostAllocationBatchQuery = {
  project: 'corehr',
  name: 'corehr.v2.costAllocation.batchQuery',
  sdkName: 'corehr.v2.costAllocation.batchQuery',
  path: '/open-apis/corehr/v2/cost_allocations/batch_query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Cost allocation-Query cost allocation-query cost allocation',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ employment_ids: z.array(z.string()).describe('Employee ID List') }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2CostAllocationCreateVersion = {
  project: 'corehr',
  name: 'corehr.v2.costAllocation.createVersion',
  sdkName: 'corehr.v2.costAllocation.createVersion',
  path: '/open-apis/corehr/v2/cost_allocations/create_version',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Cost allocation-Create cost allocation-Create cost allocation',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      employment_id: z.string().describe('Employee Employment ID'),
      cost_allocation: z
        .object({
          effective_time: z.string().describe('Effective time'),
          expiration_time: z.string().describe('Expiration time').optional(),
          job_data_cost_center_id: z
            .array(
              z.object({
                cost_center_id: z
                  .string()
                  .describe(
                    'Cost center ID, you can obtain the corresponding cost center information through the [Query a single cost center information] interface',
                  ),
                new_rate: z.number().describe('proportion of assessment'),
              }),
            )
            .describe('cost allocation')
            .optional(),
          reason: z.string().describe('Reason for change').optional(),
        })
        .describe('cost allocation')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        client_token: z
          .string()
          .describe('Determine whether the same request is based on whether the client_token are consistent')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2CostAllocationRemoveVersion = {
  project: 'corehr',
  name: 'corehr.v2.costAllocation.removeVersion',
  sdkName: 'corehr.v2.costAllocation.removeVersion',
  path: '/open-apis/corehr/v2/cost_allocations/remove_version',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Cost allocation-Delete cost allocation-Delete cost allocation',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      employment_id: z.string().describe('employment id'),
      cost_allocation: z
        .object({ wk_id: z.string().describe('cost center id') })
        .describe('cost center')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        client_token: z
          .string()
          .describe('Determine whether the same request is based on whether the client_token are consistent')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2CostAllocationUpdateVersion = {
  project: 'corehr',
  name: 'corehr.v2.costAllocation.updateVersion',
  sdkName: 'corehr.v2.costAllocation.updateVersion',
  path: '/open-apis/corehr/v2/cost_allocations/update_version',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Cost allocation-Update cost allocation-Update cost allocation',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      employment_id: z.string().describe('Employee Employment ID'),
      cost_allocation: z
        .object({
          wk_id: z.string().describe('ID'),
          effective_time: z.string().describe('Effective time').optional(),
          expiration_time: z.string().describe('Expiration time').optional(),
          job_data_cost_center_id: z
            .array(
              z.object({
                cost_center_id: z
                  .string()
                  .describe(
                    'Cost center ID, you can obtain the corresponding cost center information through the [Query a single cost center information] interface',
                  )
                  .optional(),
                new_rate: z.number().describe('proportion of assessment').optional(),
              }),
            )
            .describe('cost allocation')
            .optional(),
          reason: z.string().describe('Reason for change').optional(),
        })
        .describe('cost allocation')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        client_token: z
          .string()
          .describe('Determine whether the same request is based on whether the client_token are consistent')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2CostCenterCreate = {
  project: 'corehr',
  name: 'corehr.v2.costCenter.create',
  sdkName: 'corehr.v2.costCenter.create',
  path: '/open-apis/corehr/v2/cost_centers',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-cost center-create cost center-Create a cost center; you can define the name of the cost center, the parent cost center, the person in charge of the cost center, the effective time, etc',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z
        .array(
          z.object({
            lang: z
              .string()
              .describe(
                'Name information language, support Chinese and English. Chinese with zh-CN; English with en-US',
              ),
            value: z.string().describe('content'),
          }),
        )
        .describe(
          '- Name cannot contain 「/」「；」「;」 characters- The Chinese and English names of the cost center will be globally unique',
        ),
      code: z
        .string()
        .describe(
          '- Encoding (cannot be repeated with the encoding of other records); when automatic encoding is turned on, if no encoding is passed in, the encoding will be automatically generated. If an encoding is passed in, the incoming encoding shall prevail',
        )
        .optional(),
      parent_cost_center_id: z
        .string()
        .describe(
          'The superior cost center ID, the detailed information can be obtained through the [Search cost center information] interface query',
        )
        .optional(),
      managers: z
        .array(z.string())
        .describe(
          'XXX ID. ID acquisition method:- Call [Create Employee] to return the employment information ID- Call the [Search Employee Information] interface to return the employment information ID',
        )
        .optional(),
      description: z
        .array(
          z.object({
            lang: z
              .string()
              .describe('Language of information, support Chinese and English. Chinese with zh-CN; English with en-US'),
            value: z.string().describe('content'),
          }),
        )
        .describe('Cost center description')
        .optional(),
      effective_time: z
        .string()
        .describe('Effective time; the interface is best known to taste to the smallest unit of day'),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2CostCenterDelete = {
  project: 'corehr',
  name: 'corehr.v2.costCenter.delete',
  sdkName: 'corehr.v2.costCenter.delete',
  path: '/open-apis/corehr/v2/cost_centers/:cost_center_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-cost center-delete cost center-Delete cost center records',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ operation_reason: z.string().describe('Operational reasons') }),
    path: z
      .object({
        cost_center_id: z
          .string()
          .describe('Cost center ID can be obtained through the [Search cost center information] interface query')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2CostCenterPatch = {
  project: 'corehr',
  name: 'corehr.v2.costCenter.patch',
  sdkName: 'corehr.v2.costCenter.patch',
  path: '/open-apis/corehr/v2/cost_centers/:cost_center_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-cost center-enable or disable cost center-Enable and deactivate the cost center to support a single operation',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      effective_time: z.string(),
      active: z.boolean().describe('Enable deactivated state'),
      operation_reason: z.string().describe('Operational reasons'),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z
      .object({
        cost_center_id: z
          .string()
          .describe('The cost center ID can be obtained through the [Search cost center information] interface query')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2CostCenterQueryRecentChange = {
  project: 'corehr',
  name: 'corehr.v2.costCenter.queryRecentChange',
  sdkName: 'corehr.v2.costCenter.queryRecentChange',
  path: '/open-apis/corehr/v2/cost_centers/query_recent_change',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-cost center-query recent change cost center-Query the cost center whose current effective information has changed within the specified time range, that is, only when the effective time of the current effective version of the cost center is within the query time range, the cost center ID will be returned',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      start_date: z.string(),
      end_date: z.string(),
    }),
  },
};
export const corehrV2CostCenterSearch = {
  project: 'corehr',
  name: 'corehr.v2.costCenter.search',
  sdkName: 'corehr.v2.costCenter.search',
  path: '/open-apis/corehr/v2/cost_centers/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-cost center-search cost center version-Search cost center information; support cost center ID, cost center name, cost center code, cost center superior search cost center information, with paging function',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        cost_center_id_list: z.array(z.string()).describe('Cost center ID list').optional(),
        name_list: z.array(z.string()).describe('List of growth center names, exact match').optional(),
        code: z.string().describe('Cost center code').optional(),
        parent_cost_center_id: z
          .string()
          .describe('The superior cost center ID, which can be used to query the direct subordinate cost center')
          .optional(),
        get_all_version: z.boolean().describe('Whether to get all Chen Ben Center versions').optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
    }),
  },
};
export const corehrV2CostCenterVersionCreate = {
  project: 'corehr',
  name: 'corehr.v2.costCenterVersion.create',
  sdkName: 'corehr.v2.costCenterVersion.create',
  path: '/open-apis/corehr/v2/cost_centers/:cost_center_id/versions',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-cost center-cost center version-create version of cost center-Create the cost center version; you can define the name, description, superior cost, cost center person in charge, version effective time and other information of the cost center',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z
        .array(
          z.object({
            lang: z
              .string()
              .describe('Language of information, support Chinese and English. Chinese with zh-CN; English with en-US'),
            value: z.string().describe('content'),
          }),
        )
        .describe('Cost center name'),
      parent_cost_center_id: z
        .string()
        .describe(
          'The superior cost center ID can be obtained through the [Search cost center information] interface query',
        )
        .optional(),
      managers: z
        .array(z.string())
        .describe(
          'The ID list of the person in charge of the cost center can be obtained through the [Search employee information] interface',
        )
        .optional(),
      description: z
        .array(
          z.object({
            lang: z
              .string()
              .describe('Language of information, support Chinese and English. Chinese with zh-CN; English with en-US'),
            value: z.string().describe('content'),
          }),
        )
        .describe('Cost center description')
        .optional(),
      effective_time: z
        .string()
        .describe(
          'Effective time- Fill in the format: YYYY-MM-DD (the system will automatically change the time and seconds to )- The system defaults to on the day of filling in the date.The interface is only supported up to the smallest unit for the day- Date range requirements: 1900-01-01~ 9999-12-31',
        ),
      operation_reason: z.string().describe('Operating reason'),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z
      .object({
        cost_center_id: z
          .string()
          .describe('The cost center ID can be obtained through the [Search cost center information] interface query')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2CostCenterVersionDelete = {
  project: 'corehr',
  name: 'corehr.v2.costCenterVersion.delete',
  sdkName: 'corehr.v2.costCenterVersion.delete',
  path: '/open-apis/corehr/v2/cost_centers/:cost_center_id/versions/:version_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-cost center-cost center version-delete version of cost center-The interface supports revocation of cost center version information through the Version ID of the cost center',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ operation_reason: z.string().describe('Operational reasons') }),
    path: z
      .object({
        cost_center_id: z
          .string()
          .describe('The cost center ID can be obtained through the [Search cost center information] interface query')
          .optional(),
        version_id: z
          .string()
          .describe('Version ID, which can be obtained through the [Search cost center information] interface query')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2CostCenterVersionPatch = {
  project: 'corehr',
  name: 'corehr.v2.costCenterVersion.patch',
  sdkName: 'corehr.v2.costCenterVersion.patch',
  path: '/open-apis/corehr/v2/cost_centers/:cost_center_id/versions/:version_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-cost center-cost center version-update version of cost center-Correct the version record of the cost center. The fields that can be corrected include: name, superior cost center, list of cost center leaders, description of the cost center, and effective time',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z
        .array(
          z.object({
            lang: z
              .string()
              .describe('Language of information, support Chinese and English. Chinese with zh-CN; English with en-US'),
            value: z.string().describe('content'),
          }),
        )
        .describe('Cost center name'),
      parent_cost_center_id: z
        .string()
        .describe(
          'The superior cost center ID can be obtained through the [Search cost center information] interface query',
        )
        .optional(),
      managers: z
        .array(z.string())
        .describe(
          'The ID list of the person in charge of the cost center.ID acquisition method:- Call [Create Employee] to return the employment information ID- Call [Search Employee Information] interface to return the employment information ID',
        )
        .optional(),
      description: z
        .array(
          z.object({
            lang: z
              .string()
              .describe('Language of information, support Chinese and English. Chinese with zh-CN; English with en-US'),
            value: z.string().describe('content'),
          }),
        )
        .describe('Cost center description')
        .optional(),
      effective_time: z
        .string()
        .describe(
          'Effective time- Fill in the format: YYYY-MM-DD- The system defaults to 00:00:00 on the day of filling in the date.The interface is only supported up to the smallest unit for the day- Date range requirements: 1900-01-01~ 9999-12-31',
        ),
      operation_reason: z.string().describe('Operating reason'),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z
      .object({
        cost_center_id: z
          .string()
          .describe('The cost center ID can be obtained through the [Search cost center information] interface query')
          .optional(),
        version_id: z
          .string()
          .describe('Version ID, which can be obtained through the [Search cost center information] interface query')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2CustomOrgActive = {
  project: 'corehr',
  name: 'corehr.v2.customOrg.active',
  sdkName: 'corehr.v2.customOrg.active',
  path: '/open-apis/corehr/v2/custom_orgs/active',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-custom Organization-Enable / disable custom organization-Enable or disable custom organizations',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      org_id: z
        .string()
        .describe('Custom Organization ID- Available from the org_id field of [Bulk Query Custom Organization]'),
      object_api_name: z
        .string()
        .describe(
          'Organization type code, which can be viewed under the corresponding custom organization directory in "Feishu Personnel-Settings-Organization Settings"',
        ),
      active: z
        .boolean()
        .describe('Enabled/Deactivated state.- active pass true means enabled- active pass false means disabled'),
      effective_time: z
        .string()
        .describe(
          'Effective date- Fill in the format: YYYY-MM-DD (the system will automatically change the hours, minutes and seconds to 00:00:00)- The system defaults to take effect at 00:00:00 on the day when the date is filled in- This interface only supports the smallest unit of day- Date range requirements: 1900-01-01 ～ 9999-12-31',
        ),
    }),
  },
};
export const corehrV2CustomOrgCreate = {
  project: 'corehr',
  name: 'corehr.v2.customOrg.create',
  sdkName: 'corehr.v2.customOrg.create',
  path: '/open-apis/corehr/v2/custom_orgs',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-custom Organization-Create Custom Organization-Create a custom organization using the specified information, and the relevant rules will be checked in the interface',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      object_api_name: z
        .string()
        .describe(
          'Organization type code, which can be viewed under the corresponding custom organization directory in "Feishu Personnel-Settings-Organization Settings"',
        ),
      names: z
        .array(
          z.object({
            lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
            value: z.string().describe('The content of the name information'),
          }),
        )
        .describe(
          'Custom organization name- Chinese and English names of custom organizations with the same parent are not allowed to be repeated.The name cannot contain 「/」「；」「;」 characters',
        ),
      code: z
        .string()
        .describe(
          'Custom organization encoding (cannot be duplicated with the encoding of other records)- When turning on automatic encoding, if no value is passed, the encoding will be automatically generated, otherwise the incoming value shall prevail- When automatic encoding is not enabled, the encoding will not be automatically generated without passing the value',
        )
        .optional(),
      parent_id: z
        .string()
        .describe(
          'superior custom organization ID- The status of the superior custom organization must be enabled.- Available from the org_id field of [Bulk Query Custom Organization]',
        )
        .optional(),
      manager_ids: z
        .array(z.string())
        .describe(
          'Person ID list.- Detailed information can be obtained through [Search employee information] or [Batch query employee] API, ID is ==employment_id== of return value',
        )
        .optional(),
      description: z
        .array(
          z.object({
            lang: z.string().describe('Language, Chinese with zh-CN, English with en-US'),
            value: z.string().describe('content'),
          }),
        )
        .describe('Custom organization description')
        .optional(),
      effective_time: z
        .string()
        .describe(
          'Effective date- Fill in the format: YYYY-MM-DD (the system will automatically change the hours, minutes and seconds to 00:00:00)- The system defaults to take effect at 00:00:00 on the day when the date is filled in- This interface only supports the smallest unit of day- Date range requirements: 1900-01-01 ～ 9999-12-31',
        ),
      org_roles: z
        .array(
          z.object({
            api_name: z
              .string()
              .describe(
                'Role code- Can be obtained by [Batch Get Role List], the data is the code value in the returned data',
              ),
            employment_ids: z
              .array(z.string())
              .describe(
                'List of authorized employee IDs- Detailed information can be obtained through [Search employee information] or [Batch query employee] API',
              )
              .optional(),
          }),
        )
        .describe('Automatically delegate "roles authorized by custom organization"')
        .optional(),
      match_rule_groups: z
        .array(
          z.object({
            match_rules: z
              .array(
                z.object({
                  left_value: z
                    .enum([
                      'department',
                      'department_hierarchy',
                      'work_location',
                      'work_location_hierarchy',
                      'cost_center',
                      'cost_center_hierarchy',
                      'job',
                      'job_level',
                      'job_family',
                      'job_family_hierarchy',
                      'employee_type',
                    ])
                    .describe(
                      'lvalue Options:department(department),department_hierarchy(Department (including subordinates)),work_location(workplace),work_location_hierarchy(Work location (including lower level)),cost_center(cost center),cost_center_hierarchy(Cost center (including subordinates)),job(Job),job_level(Job Level),job_family(Job Family),job_family_hierarchy(Job Family (including lower-level)),employee_type(Employee Type)',
                    ),
                  operator: z
                    .enum(['contains', 'notContains'])
                    .describe('operator Options:contains(contain),notContains(Do not include)'),
                  right_values: z
                    .array(z.string())
                    .describe(
                      'Rvalue, fill in the ID list corresponding to the lvalue.- ==department== and ==department_hierarchy==: The detailed ID can be obtained through the [Query a single department] interface, the ID type needs to be ==people_corehr_department_id==.- ==work_location== and ==work_location_hierarchy==: Detailed IDs can be obtained through the [Query a single location] interface.- ==cost_center== and ==cost_center_hierarchy==: Detailed IDs can be obtained through the [Search cost center information] interface.- ==job==: The detailed ID can be obtained through the [Query individual job] interface.- ==job_level==: Detailed IDs can be obtained through the [Query single rank] interface.- ==job_family== and ==job_family_hierarchy==: Detailed IDs can be obtained through the [Query Single Sequence] interface.- ==employee_type==: The detailed ID can be obtained through the [Query Person Type] interface',
                    )
                    .optional(),
                }),
              )
              .describe('Match the list of rules, the group is the intersection relationship')
              .optional(),
          }),
        )
        .describe(
          'Automatically matched rule group.- You need to turn on the automatic matching switch of the corresponding organization type in "Feishu Personnel-Settings-Organization Settings" before you can use the matching rule group field.- between each ==match_rule_groups== is a union relationship- Each ==match_rules== is an intersection relationship',
        )
        .optional(),
      custom_fields: z
        .array(
          z.object({
            custom_api_name: z.string().describe('Custom field API Name, the unique identifier of the custom field'),
            value: z
              .string()
              .describe(
                'Field value, which is a JSON-escaped string.**Note: For the specific value passing method, please refer to**[Get metadata of custom fields]',
              ),
          }),
        )
        .describe('custom field type，See [Get custom field list]')
        .optional(),
    }),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Determine whether the same request is based on whether the client_token are consistent')
          .optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2CustomOrgDeleteOrg = {
  project: 'corehr',
  name: 'corehr.v2.customOrg.deleteOrg',
  sdkName: 'corehr.v2.customOrg.deleteOrg',
  path: '/open-apis/corehr/v2/custom_orgs/delete_org',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-custom Organization-Delete custom organization-Delete the corresponding custom organization based on the incoming custom organization ID',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      org_id: z
        .string()
        .describe('Custom Organization ID- Available from the org_id field of [Bulk Query Custom Organization]'),
      object_api_name: z
        .string()
        .describe(
          'Organization type code, which can be viewed under the corresponding custom organization directory in "Feishu Personnel-Settings-Organization Settings"',
        ),
    }),
  },
};
export const corehrV2CustomOrgPatch = {
  project: 'corehr',
  name: 'corehr.v2.customOrg.patch',
  sdkName: 'corehr.v2.customOrg.patch',
  path: '/open-apis/corehr/v2/custom_orgs/:org_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-custom Organization-Update Custom Organization Information-Update the basic information of a custom organization. Updating automatic matching rules is not supported. If you need to update automatic matching rules, please use [Update Matching Rules]',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      object_api_name: z
        .string()
        .describe(
          'Organization type code, which can be viewed under the corresponding custom organization directory in "Feishu Personnel-Settings-Organization Settings"',
        ),
      names: z
        .array(
          z.object({
            lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
            value: z.string().describe('content'),
          }),
        )
        .describe(
          'organization name- Chinese and English names of custom organizations with the same parent are not allowed to be repeated.The name cannot contain 「/」「；」「;」 characters',
        )
        .optional(),
      code: z
        .string()
        .describe(
          'Custom organization encoding (cannot be duplicated with the encoding of other records)- When turning on automatic encoding, if no value is passed, the encoding will be automatically generated, otherwise the incoming value shall prevail- When automatic encoding is not enabled, the encoding will not be automatically generated without passing the value',
        )
        .optional(),
      parent_id: z
        .string()
        .describe('parent organization ID- Available from the org_id field of [Bulk Query Custom Organization]')
        .optional(),
      manager_ids: z
        .array(z.string())
        .describe(
          'Person ID list.- Detailed information can be obtained through [Search employee information] or [Batch query employee] API, ID is ==employment_id== of return value',
        )
        .optional(),
      description: z
        .array(
          z.object({
            lang: z.string().describe('Language, Chinese with zh-CN, English with en-US'),
            value: z.string().describe('content'),
          }),
        )
        .describe('Custom organization description')
        .optional(),
      effective_time: z
        .string()
        .describe(
          'Effective date- Fill in the format: YYYY-MM-DD (the system will automatically change the hours, minutes and seconds to 00:00:00)- The system defaults to take effect at 00:00:00 on the day when the date is filled in- This interface only supports the smallest unit of day- Date range requirements: 1900-01-01 ～ 9999-12-31',
        ),
      org_roles: z
        .array(
          z.object({
            api_name: z
              .string()
              .describe(
                'Role code- Can be obtained by [Batch Get Role List], the data is the code value in the returned data',
              ),
            employment_ids: z
              .array(z.string())
              .describe(
                'List of authorized employee IDs- Detailed information can be obtained through [Search employee information] or [Batch query employee] API',
              )
              .optional(),
          }),
        )
        .describe('Automatically delegate "roles authorized by custom organization"')
        .optional(),
      custom_fields: z
        .array(
          z.object({
            custom_api_name: z.string().describe('Custom field API Name, the unique identifier of the custom field'),
            value: z
              .string()
              .describe(
                'Field value, which is a JSON-escaped string.**Note: For the specific value passing method, please refer to**[Get metadata of custom fields]',
              ),
          }),
        )
        .describe('custom field type，See [Get custom field list]')
        .optional(),
    }),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Determine whether the same request is based on whether the client_token are consistent')
          .optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z.object({
      org_id: z
        .string()
        .describe('Custom Organization ID- Available from the org_id field of [Bulk Query Custom Organization]'),
    }),
  },
};
export const corehrV2CustomOrgQuery = {
  project: 'corehr',
  name: 'corehr.v2.customOrg.query',
  sdkName: 'corehr.v2.customOrg.query',
  path: '/open-apis/corehr/v2/custom_orgs/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-custom Organization-Get custom organization information-Query custom organization information in bulk based on the passed filter criteria. Without passing any filter criteria, all custom organization data under this tenant is obtained by default',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      object_api_name: z
        .string()
        .describe(
          'Organization type code, which can be viewed under the corresponding custom organization directory in "Feishu Personnel-Settings-Organization Settings"',
        ),
      org_fields: z
        .array(z.string())
        .describe(
          'List of fields to return. The list of fields that can be filled in is as follows:- names- code- parent_id- manager_ids- description- effective_time- org_roles- active- org_idcustom field type，See [Get custom field list]',
        )
        .optional(),
      org_role_fields: z
        .array(z.string())
        .describe(
          'List of organizational role authorization information to return.- org_role_fields can be obtained by [Batch Acquisition Role List], the data is the code value in the returned data.- The maximum number of incoming org_role_fields supported per query is 1000',
        )
        .optional(),
      org_ids: z
        .array(z.string())
        .describe(
          'List of organization IDs to query.- ID is org_id field returned for [Get Custom Organization].- The maximum number of IDs supported per query is 1000- No ID related restrictions',
        )
        .optional(),
      code: z
        .string()
        .describe(
          'Return only custom organizational data with the same encoding as you passed in.- Encoding the code field returned as [Get Custom Organization].- Do not pass this restriction by default',
        )
        .optional(),
      parent_id: z
        .string()
        .describe(
          'Returns only custom organization data parent_id = passed in value.- parent_id org_id field returned for [Get Custom Organization].- Do not pass this restriction by default- Custom organization ID type needs to be ==people_corehr_id==',
        )
        .optional(),
      active: z
        .boolean()
        .describe('Returns only enabled/disabled custom organization data.- Do not pass this restriction by default')
        .optional(),
      need_match_rule: z
        .boolean()
        .describe(
          'Whether to return a matching rule.- Returns ==match_rule_groups== field for true, otherwise not returned',
        )
        .optional(),
    }),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
    }),
  },
};
export const corehrV2CustomOrgUpdateRule = {
  project: 'corehr',
  name: 'corehr.v2.customOrg.updateRule',
  sdkName: 'corehr.v2.customOrg.updateRule',
  path: '/open-apis/corehr/v2/custom_orgs/update_rule',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-custom Organization-Update matching rules for custom organization-Update the matching rules for custom organizations. Only custom organization types with "Set up automatic matching rules for organizations" turned on are available. To update the basic information of a custom organization, use [Update Custom Organization]',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      object_api_name: z.string().describe('Custom Organization Code'),
      org_id: z
        .string()
        .describe('Custom Organization ID- Available from the org_id field of [Bulk Query Custom Organization]'),
      match_rule_groups: z
        .array(
          z.object({
            match_rules: z
              .array(
                z.object({
                  left_value: z
                    .enum([
                      'department',
                      'department_hierarchy',
                      'work_location',
                      'work_location_hierarchy',
                      'cost_center',
                      'cost_center_hierarchy',
                      'job',
                      'job_level',
                      'job_family',
                      'job_family_hierarchy',
                      'employee_type',
                    ])
                    .describe(
                      'lvalue Options:department(department),department_hierarchy(Department (including subordinates)),work_location(work place),work_location_hierarchy(Work location (including lower level)),cost_center(Cost center),cost_center_hierarchy(Cost center (including subordinates)),job(Job),job_level(Job Level),job_family(Job Family),job_family_hierarchy(Job Family (including lower level)),employee_type(Employee Type)',
                    ),
                  operator: z
                    .enum(['contains', 'notContains'])
                    .describe('operator Options:contains(contain),notContains(Do not include)'),
                  right_values: z
                    .array(z.string())
                    .describe(
                      'Rvalue, fill in the ID list corresponding to the lvalue.- ==department== and ==department_hierarchy==: The detailed ID can be obtained through the [Query a single department] interface, the ID type needs to be ==people_corehr_department_id==.- ==work_location== and ==work_location_hierarchy==: Detailed IDs can be obtained through the [Query a single location] interface.- ==cost_center== and ==cost_center_hierarchy==: Detailed IDs can be obtained through the [Search cost center information] interface.- ==job==: The detailed ID can be obtained through the [Query individual job] interface.- ==job_level==: Detailed IDs can be obtained through the [Query single rank] interface.- ==job_family== and ==job_family_hierarchy==: Detailed IDs can be obtained through the [Query Single Sequence] interface.- ==employee_type==: The detailed ID can be obtained through the [Query Person Type] interface',
                    )
                    .optional(),
                }),
              )
              .describe('Match the list of rules, the group is the intersection relationship')
              .optional(),
          }),
        )
        .describe(
          'Automatically matched rule group.- You need to turn on the automatic matching switch of the corresponding organization type in "Feishu Personnel-Settings-Organization Settings" before you can use the matching rule group field.- between each ==match_rule_groups== is a union relationship- Each ==match_rules== is an intersection relationship',
        )
        .optional(),
    }),
  },
};
export const corehrV2DefaultCostCenterBatchQuery = {
  project: 'corehr',
  name: 'corehr.v2.defaultCostCenter.batchQuery',
  sdkName: 'corehr.v2.defaultCostCenter.batchQuery',
  path: '/open-apis/corehr/v2/default_cost_centers/batch_query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Default cost center-Batch query default cost center-Query default cost center',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ employment_ids: z.array(z.string()).describe('true') }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2DefaultCostCenterCreateVersion = {
  project: 'corehr',
  name: 'corehr.v2.defaultCostCenter.createVersion',
  sdkName: 'corehr.v2.defaultCostCenter.createVersion',
  path: '/open-apis/corehr/v2/default_cost_centers/create_version',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Default cost center-Create default cost center-Create default cost center',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      employment_id: z.string().describe('employment id'),
      default_cost_center: z
        .object({
          effective_time: z.string().describe('effective time'),
          cost_center_id: z.string().describe('cost center id').optional(),
          is_inherit: z.boolean().describe('is is_inherit').optional(),
          reason: z.string().describe('change reason').optional(),
        })
        .describe('cost center info')
        .optional(),
    }),
    params: z
      .object({
        client_token: z.string().optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2DefaultCostCenterRemoveVersion = {
  project: 'corehr',
  name: 'corehr.v2.defaultCostCenter.removeVersion',
  sdkName: 'corehr.v2.defaultCostCenter.removeVersion',
  path: '/open-apis/corehr/v2/default_cost_centers/remove_version',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Default cost center-Delete default cost center-Delete default cost center',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      employment_id: z.string().describe('Employee Employment ID'),
      default_cost_center: z
        .object({ wk_id: z.string().describe('ID'), wk_tid: z.string().describe('Version ID') })
        .describe('Cost center information')
        .optional(),
    }),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Idempotent flag, server level ignores client_token duplicate requests')
          .optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2DefaultCostCenterUpdateVersion = {
  project: 'corehr',
  name: 'corehr.v2.defaultCostCenter.updateVersion',
  sdkName: 'corehr.v2.defaultCostCenter.updateVersion',
  path: '/open-apis/corehr/v2/default_cost_centers/update_version',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Default cost center-Update default cost center-Update default cost center',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      employment_id: z.string().describe('employment id'),
      default_cost_center: z
        .object({
          wk_id: z.string().describe('id'),
          wk_tid: z.string().describe('version id'),
          effective_time: z.string().describe('effective time').optional(),
          cost_center_id: z.string().describe('cost center id').optional(),
          is_inherit: z.boolean().describe('is inherit').optional(),
          reason: z.string().describe('change reason').optional(),
        })
        .describe('default cost center')
        .optional(),
    }),
    params: z
      .object({
        client_token: z.string().optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2DepartmentBatchGet = {
  project: 'corehr',
  name: 'corehr.v2.department.batchGet',
  sdkName: 'corehr.v2.department.batchGet',
  path: '/open-apis/corehr/v2/departments/batch_get',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Department-Get department list-Batch query department information.Compared with the historical version of the ["Get department list" ] API, the V2 version has added sensitive field permission requirements and uses POST HTTP requests',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        department_id_list: z
          .array(z.string())
          .describe(
            'Department ID list. ID acquisition:- Call [create department][search department] and other interfaces to return the department ID- You can also create departments through [[Event]Create Department](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/department/events/created) [[Event]Update departments](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/department/events/updated) Get department ID information',
          )
          .optional(),
        fields: z
          .array(z.string())
          .describe(
            'Returns a list of fields for the data, with optional values:- version_id: Current Version ID- sub_type: Department Subtype- manager: person in charge- is_root: whether the root department- is_confidential: Confidentiality- effective_date: Effective date of current version- expiration_date: expiration date of current version- department_name: Department name- parent_department_id: Higher Department ID- tree_order: Tree sort- list_order: List sort- code: department code- active: whether to enable- description: Department description- custom_fields: custom fields- staffing_model: Post Position Mode- cost_center_id: department default cost center- created_time：Department Verison Create Time- updated_time：Department Version Updated Time- created_by：Department Version Created By- updated_by：Department Version Updated By- record_created_time：Department Create Time - record_updated_time：Department Updated Time- record_created_by：Department Created By- record_updated_by：Department Updated By',
          )
          .optional(),
        department_name_list: z
          .array(z.string())
          .describe(
            'Department names match accurately, up to 100 are passed.- pass department_id_list at least one, and both fields will be queried in AND mode',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2DepartmentDelete = {
  project: 'corehr',
  name: 'corehr.v2.department.delete',
  sdkName: 'corehr.v2.department.delete',
  path: '/open-apis/corehr/v2/departments/:department_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Department-Delete department V2-Delete department V2',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The type of department ID used in this deletion Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      department_id: z
        .string()
        .describe(
          'The department ID that needs to be deleted can be obtained through the [Search department information] interface query',
        ),
    }),
  },
};
export const corehrV2DepartmentParents = {
  project: 'corehr',
  name: 'corehr.v2.department.parents',
  sdkName: 'corehr.v2.department.parents',
  path: '/open-apis/corehr/v2/departments/parents',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Department-Get Parent Department Information-This interface is used to recursively obtain the parent department information of the department, and return the list of authorized parent department information in the order from child to parent',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      department_id_list: z
        .array(z.string())
        .describe(
          'List of department IDs, up to 100Department ID list. ID acquisition:- Call [create department][search department] and other interfaces to return the department ID',
        ),
    }),
    params: z
      .object({
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2DepartmentPatch = {
  project: 'corehr',
  name: 'corehr.v2.department.patch',
  sdkName: 'corehr.v2.department.patch',
  path: '/open-apis/corehr/v2/departments/:department_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Department-Update department V2-Update department V2 to increase data line authority',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      id: z.string().describe('This field is temporarily invalid and can be ignored').optional(),
      sub_type: z
        .object({ enum_name: z.string().describe('enumeration value') })
        .describe(
          'Department type, obtained by the [Get Field Details] query. Request parameters: object_api_name = department; custom_api_name = subtype',
        )
        .optional(),
      manager: z
        .string()
        .describe(
          'Department Head IDDetailed information can be obtained through the [Search Employee Information] or [Batch Query Employee] API',
        )
        .optional(),
      is_confidential: z
        .boolean()
        .describe('Whether to keep it confidential (this field is not supported for the time being and can be ignored)')
        .optional(),
      hiberarchy_common: z
        .object({
          parent_id: z.string().describe('parent organization').optional(),
          name: z
            .array(
              z.object({
                lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
                value: z.string().describe('content'),
              }),
            )
            .describe(
              'department name- There will be a unique check for the Chinese and English names of Deparment- Name cannot contain 「/」「；」「;」 characters',
            )
            .optional(),
          active: z.boolean().describe('Department enabled status, true is enabled, false is disabled').optional(),
          code: z
            .string()
            .describe(
              'Department Code (cannot be repeated with the encoding of other records), this field will be invalid when automatic encoding is turned on',
            )
            .optional(),
          description: z
            .array(
              z.object({
                lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
                value: z.string().describe('content'),
              }),
            )
            .describe('describe')
            .optional(),
        })
        .describe('Hierarchical relationship, see entity for inner fields')
        .optional(),
      effective_time: z
        .string()
        .describe(
          'Version effective date- Fill in the format: YYYY-MM-DD 00:00:00 (the system will automatically change the hours, minutes and seconds to 00:00:00)- The system defaults to take effect at 00:00:00 on the day when the date is filled in- This interface only supports the smallest unit of day- Date range requirements: 1900-01-01 00:00:00～9999-12-31 23:59:59',
        ),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('field name'),
            value: z
              .string()
              .describe(
                'Field value, which is a JSON-escaped string.**Note: For the specific value passing method, please refer to**[Get metadata of custom fields]',
              ),
          }),
        )
        .describe('custom field')
        .optional(),
      cost_center_id: z.string().describe('Cost center id').optional(),
      staffing_model: z
        .object({ enum_name: z.string().describe('enumeration value') })
        .describe(
          'Post management mode- For detailed enumeration types, please refer to the definition of staffing_model in [enumeration scene]',
        )
        .optional(),
    }),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Determine whether the same request is based on whether the client_token are consistent')
          .optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ department_id: z.string().describe('Department ID that needs to be updated') }),
  },
};
export const corehrV2DepartmentQueryMultiTimeline = {
  project: 'corehr',
  name: 'corehr.v2.department.queryMultiTimeline',
  sdkName: 'corehr.v2.department.queryMultiTimeline',
  path: '/open-apis/corehr/v2/departments/query_multi_timeline',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Department-Batch query department version information-According to the department ID list, batch query all department version information within the start and end time, including department name, department type, superior, code, person in charge, whether it is enabled, description and other information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      department_ids: z.array(z.string()).describe('Department ID List，Request[搜索部门信息]'),
      effective_date_start: z.string().describe('Effective date begins (inclusive)').optional(),
      effective_date_end: z.string().describe('End of effective date (inclusive)').optional(),
      fields: z
        .array(z.string())
        .describe(
          'Returns a list of fields for the data, optionally ["department_name", "sub_type", "code", "active", "parent_department_id", "manager", "description", "effective_date"], and custom fields field_name',
        )
        .optional(),
    }),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The type of department ID used in this call Options:open_department_id([Feishu] is used to identify a department in a specific application, and the same department_id open_department_id the same in different applications.),department_id([Feishu] is used to identify a unique department within a tenant.),people_corehr_department_id([Feishu Personnel] is used to identify departments in "Feishu Personnel".)',
        )
        .optional(),
    }),
  },
};
export const corehrV2DepartmentQueryOperationLogs = {
  project: 'corehr',
  name: 'corehr.v2.department.queryOperationLogs',
  sdkName: 'corehr.v2.department.queryOperationLogs',
  path: '/open-apis/corehr/v2/departments/query_operation_logs',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Department-query department operation logs-Batch query department operation logs within a specified time range',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      department_ids: z
        .array(z.string())
        .describe(
          'Department ID list, ID acquisition method:- Call [Create Department] or [Search Department]for the department interface can return the department ID.- You can also get the department ID by [[Event]Create Department](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/department/events/created) or [[Event]Update departments](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/department/events/updated)',
        ),
      start_date: z
        .string()
        .describe(
          'The start date of the query, in the format "YYYY-MM-DD", without time and seconds, including the time start_date passed in, the system will query with the start time of 00:00:00 start_date',
        ),
      end_date: z
        .string()
        .describe(
          'The deadline for the query, in the format "YYYY-MM-DD", without time and seconds, including end_date incoming time, the system will query with the end_date 23:59:59 as the deadline. The query deadline should be greater than the start date, and the start and end date span is up to 366 days',
        ),
    }),
    params: z.object({
      page_size: z.number().describe('Page size, up to 1000'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV2DepartmentQueryRecentChange = {
  project: 'corehr',
  name: 'corehr.v2.department.queryRecentChange',
  sdkName: 'corehr.v2.department.queryRecentChange',
  path: '/open-apis/corehr/v2/departments/query_recent_change',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Department-Query information-changed departments-Query the departments whose current effective information has changed within the specified time range, that is, only when the effective time of the current effective version of the department is within the query time range, the department ID will be returned',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().describe('Page size, up to 2000'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      start_date: z
        .string()
        .describe(
          'The start time of the query, in the format "YYYY-MM-DD HH:MM:SS", query for changes in the UTC+8 time zone',
        ),
      end_date: z
        .string()
        .describe(
          'The end time of the query, in the format "YYYY-MM-DD HH:MM:SS", query for changes in the UTC+8 time zone. The end time of the query should be greater than the start time',
        ),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV2DepartmentQueryTimeline = {
  project: 'corehr',
  name: 'corehr.v2.department.queryTimeline',
  sdkName: 'corehr.v2.department.queryTimeline',
  path: '/open-apis/corehr/v2/departments/query_timeline',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Department-Get department information on a specified date-Query the basic information of the designated effective department, including department name, department type, superior, code, person in charge, whether it is enabled, description and other information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      department_ids: z.array(z.string()).describe('Department ID List，Request[搜索部门信息]'),
      effective_date: z
        .string()
        .describe(
          'Effective date- Return format: YYYY-MM-DD 00:00:00 (minimum unit to day)- Date range: 1900-01-01～9999-12-31',
        ),
      fields: z
        .array(z.string())
        .describe(
          'Returns a list of fields of data, optionally ["department_name", "sub_type", "code", "active", "parent_department_id", "manager", "description", "effective_date"]',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id([Feishu] is used to identify a department in a specific application, and the same department_id open_department_id the same in different applications.),department_id([Feishu] is used to identify a unique department within a tenant.),people_corehr_department_id([Feishu Personnel] is used to identify departments in "Feishu Personnel".)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2DepartmentSearch = {
  project: 'corehr',
  name: 'corehr.v2.department.search',
  sdkName: 'corehr.v2.department.search',
  path: '/open-apis/corehr/v2/departments/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Department-Search department information-The interface supports batch search for department details of the day by department ID, superior department ID, department head, name, and coding fields, including the name, description, and enabling status of the department',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        active: z
          .boolean()
          .describe(
            'Whether the department is enabled, true is enabled, false is disabled- If empty, all enabled status data is returned',
          )
          .optional(),
        get_all_children: z
          .boolean()
          .describe(
            'When querying through the superior department ID, fill in true to return all sub-departments, and fill in false to return only direct sub-department.- default to false',
          )
          .optional(),
        manager_list: z
          .array(z.string())
          .describe(
            'Department Head ID List- Detailed information can be obtained through the [Search Employee Information] or [Batch Query Employee] interface- Pass a non-null value to return the department of the person in charge of the specified department, and pass a null value without this filter condition',
          )
          .optional(),
        department_id_list: z
          .array(z.string())
          .describe(
            'Department ID list for conditional filtering- Pass a non-null value to return the specified department ID, pass a null value without this filter condition',
          )
          .optional(),
        name_list: z
          .array(z.string())
          .describe(
            'List of department names, with exact matches, for filtering criteria- If a non-null value is passed, the department with the specified department name will be returned, and if a null value is passed, the filter condition will not be applied',
          )
          .optional(),
        parent_department_id: z
          .string()
          .describe(
            'Higher department ID- Details can be obtained through [Bulk Query Department V2] or [Search Department Information]- Pass a non-null value to return the sub-department of the specified superior department ID, and pass a null value without this filter condition',
          )
          .optional(),
        code_list: z.array(z.string()).describe('List of department codes').optional(),
        fields: z
          .array(z.string())
          .describe(
            'Returns a list of fields for the data. If passed empty, only the department id is returned. Optional value:- version_id: Current Version ID- sub_type: Department Subtype- manager: person in charge- is_root: whether the root department- is_confidential: Confidentiality- effective_date: Effective date of current version- expiration_date: expiration date of current version- department_name: Department name- parent_department_id: Higher Department ID- tree_order: Tree sort- list_order: List sort- code: department code- active: whether to enable- description: Department description- custom_fields: custom fields- staffing_model: Post Position Mode- cost_center_id: department default cost center- created_time：Department Verison Create Time- updated_time：Department Version Updated Time- created_by：Department Version Created By- updated_by：Department Version Updated By- record_created_time：Department Create Time - record_updated_time：Department Updated Time- record_created_by：Department Created By- record_updated_by：Department Updated By',
          )
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('paging size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV2DepartmentTree = {
  project: 'corehr',
  name: 'corehr.v2.department.tree',
  sdkName: 'corehr.v2.department.tree',
  path: '/open-apis/corehr/v2/departments/tree',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Department-Get the department architecture tree on any date-Support passing in department ID (default root department), any date (default current date). Breadth traversal from a given department ID, returning up to 2000 rows of data per page',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        department_id: z.string().describe('Department ID, default root department').optional(),
        need_inactive: z.boolean().describe('Whether to include invalid departments, the default is false').optional(),
        effective_date: z.string().describe('Effective date, format yyyy-mm-dd, default current date').optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV2EmployeeBatchGet = {
  project: 'corehr',
  name: 'corehr.v2.employee.batchGet',
  sdkName: 'corehr.v2.employee.batchGet',
  path: '/open-apis/corehr/v2/employees/batch_get',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Batch access to employee information through employee ID-Batch access to employee information through employee ID',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        fields: z
          .array(z.string())
          .describe('A list of fields that return data, fill in the method: When empty, only ID is returned by default')
          .optional(),
        employment_ids: z
          .array(z.string())
          .describe(
            "Employment ID List，「employment_ids」，「person_ids」，「work_emails」can't be empty at the same time.Please select a query mode based on requirements. If multiple request parameters have values in a single request, only the first parameter with values is identified in the sequence of 【employment_ids > person_ids > work_emails】",
          )
          .optional(),
        person_ids: z
          .array(z.string())
          .describe(
            'List of personal information IDs, 「employment_ids」parameter has a value, the parameter does not take effect',
          )
          .optional(),
        work_emails: z
          .array(z.string())
          .describe(
            'List of work emails，「employment_ids」「person_ids」parameter has a value, the parameter does not take effect',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2EmployeeCreate = {
  project: 'corehr',
  name: 'corehr.v2.employee.create',
  sdkName: 'corehr.v2.employee.create',
  path: '/open-apis/corehr/v2/employees',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Add individual-Support for adding all personnel information in a single interface, including basic personnel information, employment information, job records, and other grouping information',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        personal_info: z
          .object({
            personal_basic_info: z
              .object({
                legal_name: z
                  .object({
                    additional_name_type: z
                      .string()
                      .describe(
                        'Supplementary name type, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: - object_api_name = "person_name" - custom_api_name = "additional_name_type"',
                      )
                      .optional(),
                    country_region: z.string().describe('Country ID').optional(),
                    full_name: z.string().describe('full name').optional(),
                    hereditary: z.string().describe('surname title').optional(),
                    middle_name: z.string().describe('middle name').optional(),
                    secondary: z.string().describe('second surname').optional(),
                    social: z
                      .string()
                      .describe(
                        'Respectful name, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: - object_api_name = "person_name" - custom_api_name = "social"',
                      )
                      .optional(),
                    tertiary: z.string().describe('Married surname').optional(),
                    local_first_name_2: z.string().describe('First Name - Second Local Character').optional(),
                    local_middle_name: z.string().describe('local middle name').optional(),
                    local_primary: z.string().describe('Last Name - Local Text').optional(),
                    local_primary_2: z.string().describe('Last Name - Second Local Character').optional(),
                    local_secondary: z.string().describe('Second Last Name - Local Text').optional(),
                    title: z
                      .string()
                      .describe(
                        'Title, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: - object_api_name = "person_name" - custom_api_name = "title"',
                      )
                      .optional(),
                    local_first_name: z.string().describe('Name - Local Text').optional(),
                    custom_local_name: z.string().describe('Custom name (local text)').optional(),
                    custom_western_name: z.string().describe('Custom Name (Western Text)').optional(),
                    first_name: z.string().describe('name').optional(),
                    name_primary: z.string().describe('surname').optional(),
                  })
                  .describe('legal name')
                  .optional(),
                preferred_name: z
                  .object({
                    additional_name_type: z
                      .string()
                      .describe(
                        'Supplementary name type, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: - object_api_name = "person_name" - custom_api_name = "additional_name_type"',
                      )
                      .optional(),
                    country_region: z.string().describe('Country ID').optional(),
                    full_name: z.string().describe('full name').optional(),
                    hereditary: z.string().describe('surname title').optional(),
                    middle_name: z.string().describe('middle name').optional(),
                    secondary: z.string().describe('second surname').optional(),
                    social: z
                      .string()
                      .describe(
                        'Respectful name, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: - object_api_name = "person_name" - custom_api_name = "social"',
                      )
                      .optional(),
                    tertiary: z.string().describe('Married surname').optional(),
                    local_first_name_2: z.string().describe('First Name - Second Local Character').optional(),
                    local_middle_name: z.string().describe('local middle name').optional(),
                    local_primary: z.string().describe('Last Name - Local Text').optional(),
                    local_primary_2: z.string().describe('Last Name - Second Local Character').optional(),
                    local_secondary: z.string().describe('Second Last Name - Local Text').optional(),
                    title: z
                      .string()
                      .describe(
                        'Title, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: - object_api_name = "person_name" - custom_api_name = "title"',
                      )
                      .optional(),
                    local_first_name: z.string().describe('Name - Local Text').optional(),
                    custom_local_name: z.string().describe('Custom name (local text)').optional(),
                    custom_western_name: z.string().describe('Custom Name (Western Text)').optional(),
                    first_name: z.string().describe('name').optional(),
                    name_primary: z.string().describe('surname').optional(),
                  })
                  .describe('common name')
                  .optional(),
                additional_name: z.string().describe('additional name').optional(),
                gender: z
                  .string()
                  .describe(
                    'Gender, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "person" custom_api_name = "gender"',
                  )
                  .optional(),
                nationality_v2: z.string().describe('Nationality ID').optional(),
                ethnicity_race: z
                  .string()
                  .describe(
                    'Ethnicity/race, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "person" custom_api_name = "ethnicity_race"',
                  )
                  .optional(),
                phone: z
                  .object({
                    international_area_code: z
                      .string()
                      .describe(
                        'International telephone area code, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "phone" custom_api_name = "international_area_code"',
                      )
                      .optional(),
                    phone_number: z.string().describe('Phone number').optional(),
                  })
                  .describe('personal phone')
                  .optional(),
                email: z.string().describe('Personal mailbox').optional(),
                date_of_birth: z.string().describe('Date of birth').optional(),
                marital_status: z
                  .string()
                  .describe(
                    'Marital status, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "person" custom_api_name = "marital_status"',
                  )
                  .optional(),
                is_disabled: z.boolean().describe('Is it disabled?').optional(),
                disable_card_number: z
                  .string()
                  .describe('Disability certificate number, required when is_disabled is true')
                  .optional(),
                is_martyr_family: z.boolean().describe('Is it martyred?').optional(),
                martyr_card_number: z
                  .string()
                  .describe("Martyr's certificate number, required when is_martyr_family is true")
                  .optional(),
                is_old_alone: z.boolean().describe('Is it lonely?').optional(),
                born_country_region: z.string().describe('Country of birth').optional(),
                political_affiliation: z
                  .string()
                  .describe(
                    'Political outlook, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "person_info_chn" custom_api_name = "political_affiliation"',
                  )
                  .optional(),
                native_region: z.string().describe('Nationality (Province/Administrative Region ID)').optional(),
                date_entered_workforce: z.string().describe('Date of participation').optional(),
                first_entry_time: z.string().describe('First entry date').optional(),
                leave_time: z.string().describe('Estimated departure date').optional(),
                custom_fields: z
                  .array(
                    z.object({
                      field_name: z.string().describe('field name'),
                      value: z
                        .string()
                        .describe(
                          'Field value, is the string escaped by json. According to the metadata definition, the field format is different. For the use method, please refer to the [Operation Manual] How to maintain custom fields through OpenAPI',
                        )
                        .optional(),
                    }),
                  )
                  .describe('custom field')
                  .optional(),
                additional_nationalities: z.array(z.string()).describe('additional nationalities').optional(),
              })
              .describe('Basic information')
              .optional(),
            emergency_contacts: z
              .array(
                z.object({
                  legal_name: z.string().describe('name').optional(),
                  relationship: z
                    .string()
                    .describe(
                      'Relationship, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "emergency_contract" custom_api_name = "relationship"',
                    )
                    .optional(),
                  is_primary: z.boolean().describe('primary contact').optional(),
                  phone: z
                    .object({
                      international_area_code: z
                        .string()
                        .describe(
                          'International telephone area code, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "phone" custom_api_name = "international_area_code"',
                        )
                        .optional(),
                      phone_number: z.string().describe('Phone number').optional(),
                    })
                    .describe('Telephone')
                    .optional(),
                  email: z.string().describe('email').optional(),
                  address: z
                    .object({
                      address_type: z
                        .string()
                        .describe(
                          'Address type, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "address" custom_api_name = "address_type"',
                        )
                        .optional(),
                      country_region: z.string().describe('Country ID').optional(),
                      region: z.string().describe('Main Administrative Region ID').optional(),
                      region_subdivision_1: z
                        .string()
                        .describe(
                          'The main administrative district is subdivided into administrative districts 1 level down',
                        )
                        .optional(),
                      region_subdivision_2: z
                        .string()
                        .describe(
                          'The main administrative district is subdivided into administrative districts 2 levels down',
                        )
                        .optional(),
                      city_v2: z.string().describe('City V2 ID').optional(),
                      city_text: z.string().describe('City (text)').optional(),
                      local_city_text: z.string().describe('City (text only, non-Latin native script)').optional(),
                      city_subdivision_1: z
                        .string()
                        .describe('The city is subdivided into administrative districts one level down')
                        .optional(),
                      city_subdivision_2: z
                        .string()
                        .describe('The city is subdivided into administrative districts 2 levels down')
                        .optional(),
                      district_v2: z.string().describe('District/County V2 ID').optional(),
                      postal_code: z.string().describe('Postal Code').optional(),
                      address_line_1: z.string().describe('Address line 1').optional(),
                      local_address_line_1: z
                        .string()
                        .describe('Address line 1 (non-Latin native characters)')
                        .optional(),
                      address_line_2: z.string().describe('Address line 2').optional(),
                      local_address_line_2: z
                        .string()
                        .describe('Address line 2 (non-Latin native characters)')
                        .optional(),
                      address_line_3: z.string().describe('Address line 3').optional(),
                      local_address_line_3: z
                        .string()
                        .describe('Address line 3 (non-Latin native characters)')
                        .optional(),
                      address_line_4: z.string().describe('Address line 4').optional(),
                      local_address_line_5: z
                        .string()
                        .describe('Address line 5 (non-Latin native characters)')
                        .optional(),
                      address_line_6: z.string().describe('Address line 6').optional(),
                      local_address_line_6: z
                        .string()
                        .describe('Address line 6 (non-Latin native characters)')
                        .optional(),
                      address_line_7: z.string().describe('Address line 7').optional(),
                      local_address_line_7: z
                        .string()
                        .describe('Address line 7 (non-Latin native characters)')
                        .optional(),
                      address_line_8: z.string().describe('Address line 8').optional(),
                      local_address_line_8: z
                        .string()
                        .describe('Address line 8 (non-Latin native characters)')
                        .optional(),
                      address_line_9: z.string().describe('Address line 9').optional(),
                      local_address_line_9: z
                        .string()
                        .describe('Address line 9 (non-Latin native characters)')
                        .optional(),
                      local_address_line_4: z
                        .string()
                        .describe('Address line 4 (non-Latin native characters)')
                        .optional(),
                      address_line_5: z.string().describe('Address line 5').optional(),
                    })
                    .describe('Address')
                    .optional(),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('field name'),
                        value: z
                          .string()
                          .describe(
                            'Field value, is the string escaped by json. According to the metadata definition, the field format is different. For the use method, please refer to the [Operation Manual] How to maintain custom fields through OpenAPI',
                          )
                          .optional(),
                      }),
                    )
                    .describe('custom field')
                    .optional(),
                }),
              )
              .describe('Emergency Contact')
              .optional(),
            bank_accounts: z
              .array(
                z.object({
                  country_region: z.string().describe('Country ID').optional(),
                  bank_name: z.string().describe('bank name').optional(),
                  branch_name: z.string().describe('Branch name').optional(),
                  account_holder: z.string().describe('Account holder name').optional(),
                  bank_account_number: z.string().describe('bank account number').optional(),
                  bank_account_usages: z
                    .array(z.string())
                    .describe(
                      'Bank card purpose, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "bank_account" custom_api_name = "bank_account_usage"',
                    )
                    .optional(),
                  bank_account_type: z
                    .string()
                    .describe(
                      'Bank card type, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "bank_account" custom_api_name = "bank_account_type"',
                    )
                    .optional(),
                  bank_id: z.string().describe('Bank ID').optional(),
                  branch_id: z.string().describe('Bank Branch ID').optional(),
                  payment_type: z
                    .enum(['percent', 'amount', 'balance'])
                    .describe(
                      'payment type Options:percent(proportional allocation),amount(allocation by amount),balance(default)',
                    )
                    .optional(),
                  payment_rate: z.string().describe('payment rate').optional(),
                  payment_amount: z.string().describe('payment amount').optional(),
                  priority: z.string().describe('priority').optional(),
                }),
              )
              .describe('bank account')
              .optional(),
            nationals: z
              .array(
                z.object({
                  country_region: z.string().describe('Country ID').optional(),
                  national_id_type: z.string().describe('National Document Type ID').optional(),
                  national_id_number: z.string().describe('ID number').optional(),
                  issued_date: z.string().describe('Document issue date').optional(),
                  issued_by: z.string().describe('Document issuing authority').optional(),
                  expiration_date: z.string().describe('Document expiration date').optional(),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('field name'),
                        value: z
                          .string()
                          .describe(
                            'Field value, is the string escaped by json. According to the metadata definition, the field format is different. For the use method, please refer to the [Operation Manual] How to maintain custom fields through OpenAPI',
                          )
                          .optional(),
                      }),
                    )
                    .describe('custom field')
                    .optional(),
                }),
              )
              .describe('certificate')
              .optional(),
            resident_taxes: z
              .array(
                z.object({
                  year_resident_tax: z.string().describe('annual').optional(),
                  tax_country_region: z.string().describe('Country ID').optional(),
                  resident_status: z
                    .string()
                    .describe(
                      'Resident identity, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "resident_tax" custom_api_name = "resident_status"',
                    )
                    .optional(),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('field name'),
                        value: z
                          .string()
                          .describe(
                            'Field value, is the string escaped by json. According to the metadata definition, the field format is different. For the use method, please refer to the [Operation Manual] How to maintain custom fields through OpenAPI',
                          )
                          .optional(),
                      }),
                    )
                    .describe('custom field')
                    .optional(),
                }),
              )
              .describe('Resident identity information')
              .optional(),
            dependents: z
              .array(
                z.object({
                  legal_name: z.string().describe('name').optional(),
                  date_of_birth: z.string().describe('birthday').optional(),
                  relationship_with_dependent: z
                    .string()
                    .describe(
                      'Relationship, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "dependent" custom_api_name = "relationship_with_dependent"',
                    )
                    .optional(),
                  gender: z
                    .string()
                    .describe(
                      'Gender, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "dependent" custom_api_name = "gender"',
                    )
                    .optional(),
                  phone: z
                    .object({
                      international_area_code: z
                        .string()
                        .describe(
                          'International telephone area code, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "phone" custom_api_name = "international_area_code"',
                        )
                        .optional(),
                      phone_number: z.string().describe('Phone number').optional(),
                    })
                    .describe('Telephone')
                    .optional(),
                  job: z.string().describe('position').optional(),
                  child_birth_certificates: z
                    .array(
                      z.object({
                        file_id: z.string().describe('File ID').optional(),
                        mime_type: z.string().describe('File MIME type').optional(),
                        name: z.string().describe('file name').optional(),
                        size: z.string().describe('File size (KB)').optional(),
                        token: z.string().describe('File token').optional(),
                      }),
                    )
                    .describe('Birth certificate')
                    .optional(),
                  employer: z.string().describe('work unit').optional(),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('field name'),
                        value: z
                          .string()
                          .describe(
                            'Field value, is the string escaped by json. According to the metadata definition, the field format is different. For the use method, please refer to the [Operation Manual] How to maintain custom fields through OpenAPI',
                          )
                          .optional(),
                      }),
                    )
                    .describe('custom field')
                    .optional(),
                  address: z
                    .object({
                      address_type: z
                        .string()
                        .describe(
                          'Address type, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "address" custom_api_name = "address_type"',
                        )
                        .optional(),
                      country_region: z.string().describe('Country ID').optional(),
                      region: z.string().describe('Main Administrative Region ID').optional(),
                      region_subdivision_1: z
                        .string()
                        .describe(
                          'The main administrative district is subdivided into administrative districts 1 level down',
                        )
                        .optional(),
                      region_subdivision_2: z
                        .string()
                        .describe(
                          'The main administrative district is subdivided into administrative districts 2 levels down',
                        )
                        .optional(),
                      city_v2: z.string().describe('City V2 ID').optional(),
                      city_text: z.string().describe('City (text)').optional(),
                      local_city_text: z.string().describe('City (text only, non-Latin native script)').optional(),
                      city_subdivision_1: z
                        .string()
                        .describe('The city is subdivided into administrative districts one level down')
                        .optional(),
                      city_subdivision_2: z
                        .string()
                        .describe('The city is subdivided into administrative districts 2 levels down')
                        .optional(),
                      district_v2: z.string().describe('District/County V2 ID').optional(),
                      postal_code: z.string().describe('Postal Code').optional(),
                      address_line_1: z.string().describe('Address line 1').optional(),
                      local_address_line_1: z
                        .string()
                        .describe('Address line 1 (non-Latin native characters)')
                        .optional(),
                      address_line_2: z.string().describe('Address line 2').optional(),
                      local_address_line_2: z
                        .string()
                        .describe('Address line 2 (non-Latin native characters)')
                        .optional(),
                      address_line_3: z.string().describe('Address line 3').optional(),
                      local_address_line_3: z
                        .string()
                        .describe('Address line 3 (non-Latin native characters)')
                        .optional(),
                      address_line_4: z.string().describe('Address line 4').optional(),
                      local_address_line_5: z
                        .string()
                        .describe('Address line 5 (non-Latin native characters)')
                        .optional(),
                      address_line_6: z.string().describe('Address line 6').optional(),
                      local_address_line_6: z
                        .string()
                        .describe('Address line 6 (non-Latin native characters)')
                        .optional(),
                      address_line_7: z.string().describe('Address line 7').optional(),
                      local_address_line_7: z
                        .string()
                        .describe('Address line 7 (non-Latin native characters)')
                        .optional(),
                      address_line_8: z.string().describe('Address line 8').optional(),
                      local_address_line_8: z
                        .string()
                        .describe('Address line 8 (non-Latin native characters)')
                        .optional(),
                      address_line_9: z.string().describe('Address line 9').optional(),
                      local_address_line_9: z
                        .string()
                        .describe('Address line 9 (non-Latin native characters)')
                        .optional(),
                      local_address_line_4: z
                        .string()
                        .describe('Address line 4 (non-Latin native characters)')
                        .optional(),
                      address_line_5: z.string().describe('Address line 5').optional(),
                    })
                    .describe('contact address')
                    .optional(),
                }),
              )
              .describe('family member')
              .optional(),
            hukou: z
              .object({
                hukou_type: z
                  .string()
                  .describe(
                    'Account type, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "person_info_chn" custom_api_name = "hukou_type"',
                  )
                  .optional(),
                hukou_location: z.string().describe('hukou location').optional(),
                custom_fields: z
                  .array(
                    z.object({
                      field_name: z.string().describe('field name'),
                      value: z
                        .string()
                        .describe(
                          'Field value, is the string escaped by json. According to the metadata definition, the field format is different. For the use method, please refer to the [Operation Manual] How to maintain custom fields through OpenAPI',
                        )
                        .optional(),
                    }),
                  )
                  .describe('custom field')
                  .optional(),
              })
              .describe('hukou')
              .optional(),
            contact_addresses: z
              .array(
                z.object({
                  address_type: z
                    .string()
                    .describe(
                      'Address type, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "address" custom_api_name = "address_type"',
                    )
                    .optional(),
                  country_region: z.string().describe('Country ID').optional(),
                  region: z.string().describe('Main Administrative Region ID').optional(),
                  region_subdivision_1: z
                    .string()
                    .describe(
                      'The main administrative district is subdivided into administrative districts 1 level down',
                    )
                    .optional(),
                  region_subdivision_2: z
                    .string()
                    .describe(
                      'The main administrative district is subdivided into administrative districts 2 levels down',
                    )
                    .optional(),
                  city_v2: z.string().describe('City V2 ID').optional(),
                  city_text: z.string().describe('City (text)').optional(),
                  local_city_text: z.string().describe('City (text only, non-Latin native script)').optional(),
                  city_subdivision_1: z
                    .string()
                    .describe('The city is subdivided into administrative districts one level down')
                    .optional(),
                  city_subdivision_2: z
                    .string()
                    .describe('The city is subdivided into administrative districts 2 levels down')
                    .optional(),
                  district_v2: z.string().describe('District/County V2 ID').optional(),
                  postal_code: z.string().describe('Postal Code').optional(),
                  address_line_1: z.string().describe('Address line 1').optional(),
                  local_address_line_1: z.string().describe('Address line 1 (non-Latin native characters)').optional(),
                  address_line_2: z.string().describe('Address line 2').optional(),
                  local_address_line_2: z.string().describe('Address line 2 (non-Latin native characters)').optional(),
                  address_line_3: z.string().describe('Address line 3').optional(),
                  local_address_line_3: z.string().describe('Address line 3 (non-Latin native characters)').optional(),
                  address_line_4: z.string().describe('Address line 4').optional(),
                  local_address_line_5: z.string().describe('Address line 5 (non-Latin native characters)').optional(),
                  address_line_6: z.string().describe('Address line 6').optional(),
                  local_address_line_6: z.string().describe('Address line 6 (non-Latin native characters)').optional(),
                  address_line_7: z.string().describe('Address line 7').optional(),
                  local_address_line_7: z.string().describe('Address line 7 (non-Latin native characters)').optional(),
                  address_line_8: z.string().describe('Address line 8').optional(),
                  local_address_line_8: z.string().describe('Address line 8 (non-Latin native characters)').optional(),
                  address_line_9: z.string().describe('Address line 9').optional(),
                  local_address_line_9: z.string().describe('Address line 9 (non-Latin native characters)').optional(),
                  local_address_line_4: z.string().describe('Address line 4 (non-Latin native characters)').optional(),
                  address_line_5: z.string().describe('Address line 5').optional(),
                }),
              )
              .describe('contact address')
              .optional(),
            custom_groups: z
              .array(
                z.object({
                  group_name: z.string().describe('group name').optional(),
                  items: z
                    .array(
                      z.object({
                        custom_fields: z
                          .array(
                            z.object({
                              field_name: z.string().describe('field name'),
                              value: z
                                .string()
                                .describe(
                                  'Field value, is the string escaped by json. According to the metadata definition, the field format is different. For the use method, please refer to the [Operation Manual] How to maintain custom fields through OpenAPI',
                                )
                                .optional(),
                            }),
                          )
                          .describe('custom field')
                          .optional(),
                      }),
                    )
                    .describe('packet data')
                    .optional(),
                }),
              )
              .describe('custom grouping')
              .optional(),
            citizenship_statuses: z
              .array(
                z.object({
                  country_region: z.string().describe('country region').optional(),
                  citizenship_status: z.string().describe('citizenship status').optional(),
                }),
              )
              .describe('citizenship statuses')
              .optional(),
          })
          .describe('personal information')
          .optional(),
        employment_info: z
          .object({
            basic_info: z
              .object({
                employee_number: z.string().describe('Employee ID').optional(),
                effective_time: z.string().describe('Onboard date').optional(),
                regular_employee_start_date: z.string().describe('Date of transfer to regular employee').optional(),
                seniority_date: z.string().describe('seniority start date').optional(),
                work_email: z.string().describe('Work mailbox').optional(),
                phone: z
                  .object({
                    international_area_code: z
                      .string()
                      .describe(
                        'International telephone area code, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "phone" custom_api_name = "international_area_code"',
                      )
                      .optional(),
                    phone_number: z.string().describe('Phone number').optional(),
                  })
                  .describe('Work phone')
                  .optional(),
                user_geo: z
                  .string()
                  .describe(
                    'data residencyEnterprises that have opened the Feishu data residency service, this field is required',
                  )
                  .optional(),
                custom_fields: z
                  .array(
                    z.object({
                      field_name: z.string().describe('field name'),
                      value: z
                        .string()
                        .describe(
                          'Field value, is the string escaped by json. According to the metadata definition, the field format is different. For the use method, please refer to the [Operation Manual] How to maintain custom fields through OpenAPI',
                        )
                        .optional(),
                    }),
                  )
                  .describe('custom field')
                  .optional(),
              })
              .describe('Basic information')
              .optional(),
            probation_info: z
              .object({
                probation_start_date: z.string().describe('Probation period start date').optional(),
                probation_expected_end_date: z.string().describe('Projected end date of probation period').optional(),
                actual_probation_end_date: z.string().describe('Actual end date of probation period').optional(),
              })
              .describe('Probation period information')
              .optional(),
            employment_record: z
              .object({
                employee_type: z.string().describe('Person Type ID').optional(),
                department: z.string().describe('Department ID').optional(),
                direct_manager: z.string().describe('Solid Supervisor Employment ID').optional(),
                working_hours_type: z.string().describe('Working hours system ID').optional(),
                cost_centers: z
                  .array(
                    z.object({
                      id: z.string().describe('100').optional(),
                      rate: z.number().describe('apportionment ratio').optional(),
                    }),
                  )
                  .describe('Cost center information')
                  .optional(),
                direct_manager_effective_time: z.string().describe('Solid supervisor onboard date').optional(),
                dotted_line_manager: z.string().describe('Dotted line supervisor employment ID').optional(),
                dotted_line_manager_effective_time: z
                  .string()
                  .describe('Dotted line supervisor onboard date')
                  .optional(),
                job: z.string().describe('Job ID').optional(),
                job_family: z.string().describe('Job Serial ID').optional(),
                job_level: z.string().describe('Job Level ID').optional(),
                job_grade: z.string().describe('Grade ID').optional(),
                work_location: z.string().describe('Workplace ID').optional(),
                weekly_working_hours: z.number().describe('weekly working hours').optional(),
                position: z.string().describe('Job ID').optional(),
                pathway: z.string().describe('pathway').optional(),
              })
              .describe('job record')
              .optional(),
            emp_contract_record: z
              .object({
                contract_number: z.string().describe('Contract agreement number').optional(),
                contract_type: z
                  .string()
                  .describe(
                    'Contract type, enumeration value is optional, can be queried through the [Get Field Details] interface, query parameters are as follows: object_api_name = "contract" custom_api_name = "contract_type"',
                  )
                  .optional(),
                first_party: z
                  .string()
                  .describe(
                    "Party A's company ID, the ID of the referenced Company, the detailed information can be obtained through the [Query a single company] interface query",
                  )
                  .optional(),
                effective_time: z.string().describe('Contract start date').optional(),
                duration_type: z
                  .string()
                  .describe(
                    'Term type, enumeration value is optional, can be queried through the [Get Field Details] interface, query parameters are as follows: object_api_name = "contract" custom_api_name = "duration_type"',
                  )
                  .optional(),
                contract_end_date: z.string().describe('Contract end date').optional(),
              })
              .describe('Contract records')
              .optional(),
            custom_groups: z
              .array(
                z.object({
                  group_name: z.string().describe('group name').optional(),
                  items: z
                    .array(
                      z.object({
                        custom_fields: z
                          .array(
                            z.object({
                              field_name: z.string().describe('field name'),
                              value: z
                                .string()
                                .describe(
                                  'field valueIt is a JSON escaped string. According to the metadata definition, the field format is different. For the use method, please refer to [[Operation Manual] How to maintain custom fields through OpenAPI] (https://feishu.feishu.cn/docx/QlUudBfCtosWMbxx3vxcOFDknn7)',
                                )
                                .optional(),
                            }),
                          )
                          .describe('custom field')
                          .optional(),
                      }),
                    )
                    .describe('packet data')
                    .optional(),
                }),
              )
              .describe('custom grouping')
              .optional(),
            custom_org_groups: z
              .array(
                z.object({
                  effective_time: z.string().describe('effective time'),
                  start_reason: z.string().describe('start reason').optional(),
                  custom_org_with_rates: z
                    .array(z.object({ id: z.string().describe('id'), rate: z.number().describe('rate').optional() }))
                    .describe('custom organization with rates'),
                  object_api_name: z.string().describe('object api name'),
                }),
              )
              .describe('custom organization groups')
              .optional(),
            seniority_adjust_informations: z
              .array(
                z.object({
                  seniority_adjustment_type: z
                    .enum(['increase', 'decrease'])
                    .describe('seniority adjustment type Options:increase(increase),decrease(decrease)'),
                  start_date: z.string().describe('start date').optional(),
                  end_date: z.string().describe('end date').optional(),
                  reasons_for_seniority_adjustment: z.string().describe('reasons for seniority adjustment').optional(),
                  seniority_adjustment: z.number().describe('seniority adjustment'),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('field name'),
                        value: z.string().describe('value').optional(),
                      }),
                    )
                    .describe('custom fields')
                    .optional(),
                }),
              )
              .describe('seniority adjust informations')
              .optional(),
            default_cost_center: z
              .object({
                reason: z.string().describe('reason').optional(),
                is_inherit: z.boolean().describe('is inherit').optional(),
                cost_center_id: z
                  .object({ wk_id: z.string().describe('wk id').optional() })
                  .describe('cost center id')
                  .optional(),
              })
              .describe('default cost center')
              .optional(),
            cost_allocation: z
              .object({
                effective_time: z.string().describe('effective time').optional(),
                expiration_time: z.string().describe('expiration time').optional(),
                cost_center_rates: z
                  .array(
                    z.object({
                      cost_center_id: z.string().describe('cost center id').optional(),
                      rate: z.number().describe('rate').optional(),
                      new_rate: z.number().describe('new rate').optional(),
                    }),
                  )
                  .describe('cost center rates')
                  .optional(),
              })
              .describe('cost allocation')
              .optional(),
          })
          .describe('Job information')
          .optional(),
        career: z
          .object({
            educations: z
              .array(
                z.object({
                  school: z.string().describe('school').optional(),
                  school_enum: z
                    .string()
                    .describe(
                      '"School, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name =" education "custom_api_name =" school_name ""',
                    )
                    .optional(),
                  start_date: z.string().describe('Start Date').optional(),
                  end_date: z.string().describe('end date').optional(),
                  level_of_education: z
                    .string()
                    .describe(
                      'Education, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "education" custom_api_name = "level_of_education"',
                    )
                    .optional(),
                  field_of_study: z.string().describe('professional').optional(),
                  degree: z
                    .string()
                    .describe(
                      'Degree, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "education" custom_api_name = "degree"',
                    )
                    .optional(),
                  field_of_study_enum: z
                    .string()
                    .describe(
                      '"Professional, enumeration values. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name =" education "custom_api_name =" field_of_study_name ""',
                    )
                    .optional(),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('field name'),
                        value: z
                          .string()
                          .describe(
                            'Field value, is the string escaped by json. According to the metadata definition, the field format is different. For the use method, please refer to the [Operation Manual] How to maintain custom fields through OpenAPI',
                          )
                          .optional(),
                      }),
                    )
                    .describe('custom field')
                    .optional(),
                }),
              )
              .describe('Educational experience')
              .optional(),
            work_experiences: z
              .array(
                z.object({
                  company_organization: z
                    .object({
                      zh_cn: z.string().describe('Chinese').optional(),
                      en_us: z.string().describe('English').optional(),
                    })
                    .describe('Company/Organization')
                    .optional(),
                  department: z
                    .object({
                      zh_cn: z.string().describe('Chinese').optional(),
                      en_us: z.string().describe('English').optional(),
                    })
                    .describe('department')
                    .optional(),
                  start_date: z.string().describe('Start Date').optional(),
                  end_date: z.string().describe('end date').optional(),
                  job: z
                    .object({
                      zh_cn: z.string().describe('Chinese').optional(),
                      en_us: z.string().describe('English').optional(),
                    })
                    .describe('position')
                    .optional(),
                  description: z
                    .object({
                      zh_cn: z.string().describe('Chinese').optional(),
                      en_us: z.string().describe('English').optional(),
                    })
                    .describe('Job Description')
                    .optional(),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('field name'),
                        value: z
                          .string()
                          .describe(
                            'Field value, is the string escaped by json. According to the metadata definition, the field format is different. For the use method, please refer to the [Operation Manual] How to maintain custom fields through OpenAPI',
                          )
                          .optional(),
                      }),
                    )
                    .describe('custom field')
                    .optional(),
                }),
              )
              .describe('work experience')
              .optional(),
            custom_groups: z
              .array(
                z.object({
                  group_name: z.string().describe('group name').optional(),
                  items: z
                    .array(
                      z.object({
                        custom_fields: z
                          .array(
                            z.object({
                              field_name: z.string().describe('field name'),
                              value: z
                                .string()
                                .describe(
                                  'Field value, is the string escaped by json. According to the metadata definition, the field format is different. For the use method, please refer to the [Operation Manual] How to maintain custom fields through OpenAPI',
                                )
                                .optional(),
                            }),
                          )
                          .describe('custom field')
                          .optional(),
                      }),
                    )
                    .describe('packet data')
                    .optional(),
                }),
              )
              .describe('custom grouping')
              .optional(),
          })
          .describe('biographical information')
          .optional(),
        data_attachment: z
          .object({
            personal_records: z
              .array(
                z.object({
                  profile_type: z
                    .string()
                    .describe(
                      'Data type, enumeration value. Optionally, you can query through the [Get Field Details] interface. The query parameters are as follows: object_api_name = "personal_profile" custom_api_name = "profile_type"',
                    )
                    .optional(),
                  files: z
                    .array(
                      z.object({
                        file_id: z.string().describe('File ID').optional(),
                        mime_type: z.string().describe('File MIME type').optional(),
                        name: z.string().describe('file name').optional(),
                        size: z.string().describe('File size (KB)').optional(),
                        token: z.string().describe('File token').optional(),
                      }),
                    )
                    .describe('file list')
                    .optional(),
                }),
              )
              .describe('data attachment record')
              .optional(),
            custom_groups: z
              .array(
                z.object({
                  group_name: z.string().describe('group name').optional(),
                  items: z
                    .array(
                      z.object({
                        custom_fields: z
                          .array(
                            z.object({
                              field_name: z.string().describe('field name'),
                              value: z
                                .string()
                                .describe(
                                  'field valueIt is a JSON escaped string. According to the metadata definition, the field format is different. For the use method, please refer to [[Operation Manual] How to maintain custom fields through OpenAPI] (https://feishu.feishu.cn/docx/QlUudBfCtosWMbxx3vxcOFDknn7)',
                                )
                                .optional(),
                            }),
                          )
                          .describe('custom field')
                          .optional(),
                      }),
                    )
                    .describe('packet data')
                    .optional(),
                }),
              )
              .describe('custom grouping')
              .optional(),
          })
          .describe('data attachment')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Idempotent flag, server level ignores client_token duplicate requests')
          .optional(),
        rehire: z
          .boolean()
          .describe(
            'Whether to rehire for separation:false: No, the system directly marks it as a non-departure rehire staff, and no longer makes repeated judgments "true: Yes, requires rehire_employment_id',
          )
          .optional(),
        rehire_employment_id: z.string().describe('Departure and rehire employee Employment ID, rehire').optional(),
        force_submit: z
          .boolean()
          .describe(
            'Whether to force the submission, overediting and other scenarios require the user to confirm the impact before submitting',
          )
          .optional(),
        ignore_working_hours_type_rule: z
          .boolean()
          .describe('Whether to ignore the automatic generation rules of the working hour system')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2EmployeeSearch = {
  project: 'corehr',
  name: 'corehr.v2.employee.search',
  sdkName: 'corehr.v2.employee.search',
  path: '/open-apis/corehr/v2/employees/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-search employee information-Search for employee information',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        fields: z
          .array(z.string())
          .describe('Returns a list of fields for data, no fields are returned when empty')
          .optional(),
        employment_id_list: z.array(z.string()).describe('Employment ID List').optional(),
        employee_number_list: z.array(z.string()).describe('Job number list').optional(),
        work_email: z.string().describe('Email, exact match query').optional(),
        phone_number: z.string().describe('Personal phone, exact match query').optional(),
        key_word: z
          .string()
          .describe('Search keywords, support fuzzy matching of email, job number and name')
          .optional(),
        employment_status: z
          .enum(['hired', 'terminated'])
          .describe('Employment status Options:hired(on-the-job),terminated(resign)')
          .optional(),
        employee_type_id: z.string().describe('Person Type ID').optional(),
        department_id_list: z
          .array(z.string())
          .describe(
            "Department ID, according to the direct department inquiry of the employee's main position, can be obtained through the [Query Department] API, department ID",
          )
          .optional(),
        direct_manager_id_list: z
          .array(z.string())
          .describe(
            "The employment ID of the direct superior, according to the direct superior of the employee's main position",
          )
          .optional(),
        dotted_line_manager_id_list: z
          .array(z.string())
          .describe(
            "The employment ID of the dotted-line manager, according to the dotted-line manager of the employee's main position",
          )
          .optional(),
        regular_employee_start_date_start: z
          .string()
          .describe('Transfer to regular employee date - search scope starts')
          .optional(),
        regular_employee_start_date_end: z
          .string()
          .describe('Transfer to regular employee date - search scope ends')
          .optional(),
        effective_time_start: z
          .string()
          .describe('Onboard date - the start of the search range, needs to be used with the end of the search range')
          .optional(),
        effective_time_end: z.string().describe('Onboard date - search range ends').optional(),
        work_location_id_list_include_sub: z
          .array(z.string())
          .describe('List of workplace IDs to find employees belonging to that workplace and subordinate workplaces')
          .optional(),
        preferred_english_full_name_list: z
          .array(z.string())
          .describe('Preferred English full name precise search')
          .optional(),
        preferred_local_full_name_list: z
          .array(z.string())
          .describe('Preferred local full name precise search')
          .optional(),
        national_id_number_list: z.array(z.string()).describe('Resident ID number precise search').optional(),
        phone_number_list: z.array(z.string()).describe('Personal phone list, exact match query').optional(),
        email_address_list: z.array(z.string()).describe('Work email address list, exact match query').optional(),
        department_id_list_include_sub: z
          .array(z.string())
          .describe('List of department IDs to find employees belonging to the department and sub-department')
          .optional(),
        additional_national_id_number_list: z
          .array(z.string())
          .describe(
            'Other nationality ID lists, accurately match the query- Field permission requirements - <md-perm name ="corehr:person.additional_nationalities:read" desc="read employee other nationality" support_app_types = "custom, isv"> read employee other nationality </md-perm >',
          )
          .optional(),
        citizenship_status_list: z
          .array(z.string())
          .describe(
            'List of citizenship types, exact match query- Field permission requirements - <md-perm name = "corehr:person.citizenship_status:read" desc = "read employee citizenship" support_app_types = "custom, isv" > read employee citizenship </md-perm >',
          )
          .optional(),
        cost_center_id_list: z
          .array(z.string())
          .describe('Cost center ID list- Available through [Search cost center information]')
          .optional(),
        service_company_list: z
          .array(z.string())
          .describe(
            'Company ID List- [Bulk Query Company] Get- Field permission requirements: - <md-perm name = "corehr:job_data.service_company:read" desc = "Read employee company" support_app_types = "custom, isv" > Read employee company </md-perm >',
          )
          .optional(),
        service_company_list_include_sub: z
          .array(z.string())
          .describe(
            'List of company IDs (including subordinates)- [Bulk Query Company] Get- Field permission requirements: - <md-perm name = "corehr:job_data.service_company:read" desc = "read employee company" support_app_types = "custom, isv" > read employee company </md-perm >',
          )
          .optional(),
        job_family_id_list: z.array(z.string()).describe('list of serial IDs- [Batch Query Sequence] get').optional(),
        job_family_id_list_include_sub: z
          .array(z.string())
          .describe('List of serial IDs (including subordinates)- [Batch Query Sequence] get')
          .optional(),
        job_level_id_list: z
          .array(z.string())
          .describe(
            'List of rank IDs- Available through [Batch Query Rank]- Field permission requirements: - <md-perm name = "corehr:employment.job_level:read" desc = "read employee rank" support_app_types = "custom, isv" > read employee rank </md-perm >',
          )
          .optional(),
        job_grade_id_list: z
          .array(z.string())
          .describe(
            'List of grade IDs- Available through [query grade]- Field permission requirements: - <md-perm name = "corehr:employment.job_grade:read" desc = "read employee grade" support_app_types = "custom, isv" > read employee grade </md-perm >',
          )
          .optional(),
        job_id_list: z
          .array(z.string())
          .describe(
            'Job ID List- Can be obtained through [Batch Query Job]- Field permission requirements: - <md-perm name = "corehr:employment.job:read" desc = "read employee title" support_app_types = "custom, isv" > read employee title </md-perm >',
          )
          .optional(),
        position_id_list: z
          .array(z.string())
          .describe(
            'Job ID List- Function grey release, if you need it, please contact [technical support]- Field permission requirements: - <md-perm name = "corehr:employment.position:read" desc = "read employee positions" support_app_types = "custom, isv" > read employee positions </md-perm >',
          )
          .optional(),
        position_id_list_include_sub: z
          .array(z.string())
          .describe(
            'Job ID list (including subordinates)- Function grey release, if you need it, please contact [technical support]- Field permission requirements: - <md-perm name = "corehr:employment.position:read" desc = "read employee positions" support_app_types = "custom, isv" > read employee positions </md-perm >',
          )
          .optional(),
        working_hours_type_id_list: z
          .array(z.string())
          .describe('List of working hours system IDs- Can be obtained through [Batch query working hours system]')
          .optional(),
        nationality_id_list: z
          .array(z.string())
          .describe(
            'Nationality ID List- Can be obtained through [Query nationality information]- Field permission requirements: - <md-perm name = "corehr:person.nationality:read" desc = "read employee nationality" support_app_types = "custom, isv" > read employee nationality </md-perm >',
          )
          .optional(),
        pay_group_id_list: z
          .array(z.string())
          .describe(
            'Salary group ID list of employees- You can get it through [Get basic information of salary group]- Field permission requirements: - <md-perm name = "corehr:employment.pay_group:read" desc = "read employee payroll group" support_app_types = "custom, isv" > read employee payroll group </md-perm >',
          )
          .optional(),
        assignment_pay_group_id_list: z
          .array(z.string())
          .describe(
            'Employee international relocation payroll group ID list- You can get it through [Get basic information of salary group]- Field permission requirements: - <md-perm name = "corehr:employment.assignment_pay_group:read" desc = "read employee international relocation salary group" support_app_types = "custom, isv" > read employee international relocation salary group </md-perm >',
          )
          .optional(),
        contract_type_list: z
          .array(z.string())
          .describe(
            'List of current contract types for employees- You can check through [Get field details]- object_api_name: contract- custom_api_name: contract_type- Field permission requirements: - <md-perm name = "corehr:employment.contract_type:read" desc = "Read employee\'s current contract type" support_app_types = "custom, isv" > Read employee\'s current contract type </md-perm >',
          )
          .optional(),
        archive_cpst_plan_id_list: z
          .array(z.string())
          .describe(
            'List of employee\'s current salary plan ID- You can get it through [Batch inquiry salary plan]- Field permission requirements: - <md-perm name = "corehr:employment.archive_cpst_plan:read" desc = "Read employee\'s current salary plan" support_app_types = "custom, isv" > Read employee\'s current salary plan </md-perm >',
          )
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV2EmployeesAdditionalJobBatch = {
  project: 'corehr',
  name: 'corehr.v2.employeesAdditionalJob.batch',
  sdkName: 'corehr.v2.employeesAdditionalJob.batch',
  path: '/open-apis/corehr/v2/employees/additional_jobs/batch',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Additional job-Batch querying additional jobs-Query the additional job information of employees in batches',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        employment_ids: z
          .array(z.string())
          .describe(
            'Employment ID, you can get detailed information through [Batch query employee information]- Type is consistent with user_id_type- When the parameter is empty, there is a problem of returning empty pages due to authentication filtering, and the data can be searched based on page_token pages until has_moreIs false',
          )
          .optional(),
        start_date: z
          .object({ start: z.string().describe('start'), end: z.string().describe('end') })
          .describe('Start Date')
          .optional(),
        end_date: z
          .object({ start: z.string().describe('start'), end: z.string().describe('end') })
          .describe('end date')
          .optional(),
        data_date: z.string().describe('View data date, default day').optional(),
        is_effective: z
          .boolean()
          .describe('Only inquire about part-time jobs that are effective on the day of [data_date]')
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('paging size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call Options:open_department_id([Feishu] is used to identify a department in a specific application, and the same department_id open_department_id the same in different applications.),department_id([Feishu] is used to identify a unique department within a tenant.),people_corehr_department_id([Feishu Personnel] is used to identify departments in "Feishu Personnel".)',
        )
        .optional(),
    }),
  },
};
export const corehrV2EmployeesAdditionalJobCreate = {
  project: 'corehr',
  name: 'corehr.v2.employeesAdditionalJob.create',
  sdkName: 'corehr.v2.employeesAdditionalJob.create',
  path: '/open-apis/corehr/v2/employees/additional_jobs',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Additional job-Create Additional Job-Create additional job for employees',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      employee_type_id: z
        .string()
        .describe('Personnel type ID, which can be obtained through [Batch query personnel type]'),
      working_hours_type_id: z
        .string()
        .describe('Working hour system ID, you can get detailed information through [Batch query working hour system]')
        .optional(),
      work_location_id: z
        .string()
        .describe('Workplace ID, you can get detailed information through [Bulk query location]')
        .optional(),
      department_id: z
        .string()
        .describe(
          'Department ID, you can get detailed information through [Bulk Query Department]The type is consistent with department_id_type',
        ),
      job_id: z.string().describe('Job ID, you can get detailed information through [Batch query job]').optional(),
      job_level_id: z
        .string()
        .describe('Rank ID, you can get detailed information through [Batch query rank]')
        .optional(),
      job_family_id: z
        .string()
        .describe('Serial ID, you can get detailed information through [Batch Query Sequence]')
        .optional(),
      employment_id: z
        .string()
        .describe(
          'Employment ID, you can get detailed information through [Batch query employee information]The type is consistent with user_id_type',
        ),
      start_date: z.string().describe('Part-time start date'),
      end_date: z.string().describe('Part-time end date cannot be cleared').optional(),
      direct_manager_id: z
        .string()
        .describe(
          'The employment ID of the direct manager, you can get detailed information through [Batch query employee information]The type is consistent with user_id_type',
        )
        .optional(),
      dotted_line_manager_id: z
        .string()
        .describe(
          'The employment ID of the dotted-line manager, which can be obtained through [Batch Query Employee Information]The type is consistent with user_id_type',
        )
        .optional(),
      work_shift: z
        .object({ enum_name: z.string().describe('enumeration value') })
        .describe(
          'The scheduling type can be queried through the [Get Field Details] interface. The query parameters are as follows:- object_api_name = "job_data"- custom_api_name = "work_shift"',
        )
        .optional(),
      compensation_type: z
        .object({ enum_name: z.string().describe('enumeration value') })
        .describe(
          'Salary type, can be queried through the [Get field details] interface, the query parameters are as follows:- object_api_name = "job_data"- custom_api_name = "compensation_type"',
        )
        .optional(),
      service_company: z
        .string()
        .describe('The company you work for can get detailed information through [Bulk Query Company]')
        .optional(),
      weekly_working_hours: z.string().describe('Weekly working hours [0~168]').optional(),
      work_calendar_id: z.string().describe('Work calendar ID').optional(),
      position_id: z.string().describe('Position ID').optional(),
      employee_subtype_id: z.string().describe('Employee subtype ID').optional(),
    }),
    params: z
      .object({
        client_token: z
          .string()
          .describe(
            'The unique identifier of the operation, used for idempotent verification, in standard UUIDV4 format. When the request is successful, the duplicate client_token will not create or change data',
          )
          .optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id([Feishu] is used to identify a department in a specific application, and the same department_id open_department_id the same in different applications.),department_id([Feishu] is used to identify a unique department within a tenant.),people_corehr_department_id([Feishu Personnel] is used to identify departments in "Feishu Personnel".)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2EmployeesAdditionalJobDelete = {
  project: 'corehr',
  name: 'corehr.v2.employeesAdditionalJob.delete',
  sdkName: 'corehr.v2.employeesAdditionalJob.delete',
  path: '/open-apis/corehr/v2/employees/additional_jobs/:additional_job_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Additional job-Delete Additional Job-Delete a designated employee additional job',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ additional_job_id: z.string().describe('Part-time record ID') }),
  },
};
export const corehrV2EmployeesAdditionalJobPatch = {
  project: 'corehr',
  name: 'corehr.v2.employeesAdditionalJob.patch',
  sdkName: 'corehr.v2.employeesAdditionalJob.patch',
  path: '/open-apis/corehr/v2/employees/additional_jobs/:additional_job_id',
  httpMethod: 'PATCH',
  description:
    "[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Additional job-Update Additional Job-Update employees' additional jobs",
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        employee_type_id: z
          .string()
          .describe('Personnel type ID, which can be obtained through [Batch query personnel type]')
          .optional(),
        working_hours_type_id: z
          .string()
          .describe(
            'Working hour system ID, you can get detailed information through [Batch query working hour system]',
          )
          .optional(),
        work_location_id: z
          .string()
          .describe('Workplace ID, you can get detailed information through [Bulk query location]')
          .optional(),
        department_id: z
          .string()
          .describe(
            'Department ID, you can get detailed information through [Bulk Query Department]The type is consistent with department_id_type',
          )
          .optional(),
        job_id: z.string().describe('Job ID, you can get detailed information through [Batch query job]').optional(),
        job_level_id: z
          .string()
          .describe('Rank ID, you can get detailed information through [Batch query rank]')
          .optional(),
        job_family_id: z
          .string()
          .describe('Serial ID, you can get detailed information through [Batch Query Sequence]')
          .optional(),
        start_date: z.string().describe('Part-time start date').optional(),
        end_date: z.string().describe('Part-time end date cannot be cleared').optional(),
        direct_manager_id: z
          .string()
          .describe(
            'The employment ID of the direct manager, you can get detailed information through [Batch query employee information]The type is consistent with user_id_type',
          )
          .optional(),
        dotted_line_manager_id: z
          .string()
          .describe(
            'The employment ID of the dotted-line manager, which can be obtained through [Batch Query Employee Information]The type is consistent with user_id_type',
          )
          .optional(),
        work_shift: z
          .object({ enum_name: z.string().describe('enumeration value') })
          .describe(
            'The scheduling type can be queried through the [Get Field Details] interface. The query parameters are as follows:- object_api_name = "job_data"- custom_api_name = "work_shift"',
          )
          .optional(),
        compensation_type: z
          .object({ enum_name: z.string().describe('enumeration value') })
          .describe(
            'Salary type, can be queried through the [Get field details] interface, the query parameters are as follows:- object_api_name = "job_data"- custom_api_name = "compensation_type"',
          )
          .optional(),
        service_company: z
          .string()
          .describe('The company you work for can get detailed information through [Bulk Query Company]')
          .optional(),
        weekly_working_hours: z.string().describe('Weekly working hours [0~ 168]').optional(),
        work_calendar_id: z.string().describe('Work calendar ID').optional(),
        position_id: z.string().describe('Position ID').optional(),
        employee_subtype_id: z.string().describe('Employee subtype id').optional(),
      })
      .optional(),
    params: z
      .object({
        client_token: z
          .string()
          .describe(
            'The unique identifier of the operation, used for idempotent verification, in standard UUIDV4 format. When the request is successful, the duplicate client_token will not create or change data',
          )
          .optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id([Feishu] is used to identify a department in a specific application, and the same department_id open_department_id the same in different applications.),department_id([Feishu] is used to identify a unique department within a tenant.),people_corehr_department_id([Feishu Personnel] is used to identify departments in "Feishu Personnel".)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ additional_job_id: z.string().describe('Part-time record ID') }),
  },
};
export const corehrV2EmployeesBpBatchGet = {
  project: 'corehr',
  name: 'corehr.v2.employeesBp.batchGet',
  sdkName: 'corehr.v2.employeesBp.batchGet',
  path: '/open-apis/corehr/v2/employees/bps/batch_get',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Feishu People（Enterprise Edition）-User authorization-Batch Get Employee BP/Location BP Information-Get employee's HRBP and Location BP, including HRBP and Location BP from superior department",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      employment_ids: z
        .array(z.string())
        .describe(
          'Employee ID, ID type has the same value meaning as user_id_type.>If you need to use the job number, you can use [ID conversion service] in exchange for ==employment_id==',
        ),
      get_all: z
        .boolean()
        .describe(
          "Whether to get all BP. True is to get all HRBP and Location BP of the employee's department and from the superior department, false is to get only the employee's direct HRBP and Location BP (when there is no BP in the employee's department and location, it will drill up to find the nearest BP). The default is false",
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2EmployeesInternationalAssignmentCreate = {
  project: 'corehr',
  name: 'corehr.v2.employeesInternationalAssignment.create',
  sdkName: 'corehr.v2.employeesInternationalAssignment.create',
  path: '/open-apis/corehr/v2/employees/international_assignments',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Employee International Assignment Information-Create International Assignment-Create assignment information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      work_location_id: z.string().describe('work location id'),
      service_company: z.string().describe('service company id').optional(),
      work_shift: z.string().describe('work shift').optional(),
      weekly_working_hours_v2: z.number().describe('weekly_working_hours_v2').optional(),
      working_hours_type_id: z.string().describe('working_hours_type_id').optional(),
      employee_type_id: z.string().describe('employee_type_id').optional(),
      department_id: z.string().describe('department_id').optional(),
      job_id: z.string().describe('job_id').optional(),
      job_family_id: z.string().describe('job_family_id').optional(),
      job_level_id: z.string().describe('job_level_id').optional(),
      job_grade_id: z.string().describe('job_grade_id').optional(),
      compensation_type: z.string().describe('compensation_type').optional(),
      direct_manager_id: z.string().describe('direct_manager_id').optional(),
      dotted_line_manager_id: z.string().describe('dotted_line_manager_id').optional(),
      work_calendar_id: z.string().describe('work_calendar_id').optional(),
      position_id: z.string().describe('position_id').optional(),
      employment_id: z.string().describe('employment_id'),
      custom_fields: z
        .array(z.object({ field_name: z.string().describe('field_name'), value: z.string().describe('value') }))
        .describe('custom_fields')
        .optional(),
      international_assignment_reason: z.string().describe('international_assignment_reason').optional(),
      description: z.string().describe('description').optional(),
      international_assignment_expected_end_date: z
        .string()
        .describe('international_assignment_expected_end_date')
        .optional(),
      international_assignment_type: z.string().describe('international_assignment_type'),
      effective_time: z.string().describe('effective_time'),
      expiration_time: z.string().describe('expiration_time').optional(),
    }),
    params: z
      .object({
        client_token: z.string().optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'Options:open_department_id(Identify departments with department_id),department_id(Identify departments with people_comrehr_department_id),people_corehr_department_id(Identify departments with people_comrehr_department_id)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2EmployeesInternationalAssignmentDelete = {
  project: 'corehr',
  name: 'corehr.v2.employeesInternationalAssignment.delete',
  sdkName: 'corehr.v2.employeesInternationalAssignment.delete',
  path: '/open-apis/corehr/v2/employees/international_assignments/:international_assignment_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Employee International Assignment Information-Delete International Assignment-Delete a certain overseas assignment information',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ international_assignment_id: z.string() }),
  },
};
export const corehrV2EmployeesInternationalAssignmentList = {
  project: 'corehr',
  name: 'corehr.v2.employeesInternationalAssignment.list',
  sdkName: 'corehr.v2.employeesInternationalAssignment.list',
  path: '/open-apis/corehr/v2/employees/international_assignments',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Employee International Assignment Information-Query International Assignment Information-Query Employee‘s International Assignment Information',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'Options:open_department_id(Identify departments open_department_id),department_id(Identify departments department_id),people_corehr_department_id(Identify departments people_corehr_department_id)',
          )
          .optional(),
        page_size: z.number().optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        employment_ids: z.array(z.string()).optional(),
        international_assignment_ids: z.array(z.string()).optional(),
        effective_time: z.string().optional(),
        expiration_time: z.string().optional(),
      })
      .optional(),
  },
};
export const corehrV2EmployeesInternationalAssignmentPatch = {
  project: 'corehr',
  name: 'corehr.v2.employeesInternationalAssignment.patch',
  sdkName: 'corehr.v2.employeesInternationalAssignment.patch',
  path: '/open-apis/corehr/v2/employees/international_assignments/:international_assignment_id',
  httpMethod: 'PATCH',
  description:
    "[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Employee International Assignment Information-Patch Employees Assignment-- The departmental job mode will affect the mandatory verification of fields such as position and job title- The fields related to overseas assignment information will be verified as mandatory based on the 'Feishu Personnel - Personnel Profile Configuration'",
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        work_location_id: z
          .string()
          .describe(
            'International relocation ID- It can be obtained through [Batch Query Location], and select [Location Use] as the record of the international relocation location (international_assignment)- This field can be passed without a null value',
          )
          .optional(),
        service_company: z
          .string()
          .describe('International relocation company ID- You can get it through [Bulk Query Company]')
          .optional(),
        work_shift: z
          .string()
          .describe(
            'Shift type- You can query through the [Get Field Details] interface, the query parameters are as follows:- object_api_name: job_data- custom_api_name: work_shift',
          )
          .optional(),
        weekly_working_hours_v2: z.number().describe('weekly working hours- Limit two decimal places').optional(),
        working_hours_type_id: z
          .string()
          .describe('Working hours system ID- Can be obtained through [Batch query working hours system]')
          .optional(),
        employee_type_id: z
          .string()
          .describe('Person Type ID- Can be obtained through [Batch Query Personnel Type]')
          .optional(),
        department_id: z
          .string()
          .describe(
            'Department ID- Available through [Bulk Query Department]- Type is consistent with department_id_type',
          )
          .optional(),
        job_id: z.string().describe('Job ID- Can be obtained through [Batch Query Job]').optional(),
        job_family_id: z.string().describe('sequence ID- Can be obtained through [Batch Query Sequence]').optional(),
        job_level_id: z.string().describe('rank ID- Available through [Batch Query Rank]').optional(),
        job_grade_id: z.string().describe('Grade ID- Available through [query grade]').optional(),
        compensation_type: z
          .string()
          .describe(
            'Salary type- You can query through the [Get Field Details] interface, the query parameters are as follows:- object_api_name: job_data- custom_api_name: compensation_type',
          )
          .optional(),
        direct_manager_id: z
          .string()
          .describe(
            'Direct manager employment ID- Can be obtained through [Batch Query Employee Information]- Type is consistent with user_id_type',
          )
          .optional(),
        dotted_line_manager_id: z
          .string()
          .describe(
            'Dotted-line manager employment ID- Can be obtained through [Batch Query Employee Information]- Type is consistent with user_id_type',
          )
          .optional(),
        work_calendar_id: z.string().describe('Work calendar ID- Available through [Query work calendar]').optional(),
        position_id: z.string().describe('Job ID- Feature grey release, please contact [Technical Support]').optional(),
        custom_fields: z
          .array(
            z.object({
              field_name: z.string().describe('field name'),
              value: z
                .string()
                .describe(
                  'Field value, is the string after json escape, according to the metadata definition, the field format is different (123, 123.23, true, [\\ "id1\\",\\ "id2\\], 2006-01-02 15:04:05])',
                ),
            }),
          )
          .describe('custom field- Please refer to [Custom Field Description]')
          .optional(),
        international_assignment_reason: z.string().describe('Reasons for international relocation').optional(),
        description: z.string().describe('Remarks').optional(),
        international_assignment_expected_end_date: z
          .string()
          .describe('Expected end date- Format: yyyy-mm-dd')
          .optional(),
        international_assignment_type: z
          .string()
          .describe(
            'Types of international relocation- You can query through the [Get Field Details] interface, the query parameters are as follows:- object_api_name: international_assignment- custom_api_name: international_assignment_type',
          )
          .optional(),
        effective_time: z.string().describe('Start Date- Format: yyyy-mm-dd').optional(),
        expiration_time: z.string().describe('end date- Format: yyyy-mm-dd').optional(),
      })
      .optional(),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Idempotent flag, server level ignores client_token duplicate requests')
          .optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ international_assignment_id: z.string().describe('International relocation ID') }),
  },
};
export const corehrV2EmployeesJobDataBatchGet = {
  project: 'corehr',
  name: 'corehr.v2.employeesJobData.batchGet',
  sdkName: 'corehr.v2.employeesJobData.batchGet',
  path: '/open-apis/corehr/v2/employees/job_datas/batch_get',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Batch Get Employee JobData-Batch get job data through employee employment ID',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      employment_ids: z.array(z.string()).describe('Employee Employment ID List'),
      get_all_version: z
        .boolean()
        .describe(
          'Whether to get all job datas, true is to get all versions of job datas of employees, false is to get only the currently valid job datas, the default is false',
        )
        .optional(),
      effective_date_start: z.string().describe('Effective Date - Search Range Begins').optional(),
      effective_date_end: z.string().describe('Effective Date - End of Search Range').optional(),
      data_date: z.string().describe('View data date, default is today').optional(),
      primary_job_data: z
        .boolean()
        .describe(
          'Whether to inquire only about the main position- true: returns only employment records primary_job_data true- false: returns only job records primary_job_data false- Do not pass: return to all',
        )
        .optional(),
      assignment_start_reasons: z
        .array(z.string())
        .describe(
          'Business type (original: reason for employment)- You can query through the [Get Field Details] interface, the query parameters are as follows:- object_api_name: job_data- custom_api_name: assignment_start_reason',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2EmployeesJobDataQuery = {
  project: 'corehr',
  name: 'corehr.v2.employeesJobData.query',
  sdkName: 'corehr.v2.employeesJobData.query',
  path: '/open-apis/corehr/v2/employees/job_datas/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Get Employee JobData List-Get a list of job data',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        get_all_version: z
          .boolean()
          .describe(
            'Whether to get all job datas, true is to get all versions of job datas of employees, false is to get only the currently valid job datas, the default is false',
          )
          .optional(),
        data_date: z.string().describe('View data date').optional(),
        effective_date_start: z.string().describe('Effective Date - Search Range Begins').optional(),
        effective_date_end: z.string().describe('Effective Date - End of Search Range').optional(),
        department_id: z
          .string()
          .describe("The employee's current department ID- Type should be consistent with department_id_type")
          .optional(),
        employment_ids: z
          .array(z.string())
          .describe('Employee employment ID list- Type should be consistent with user_id_type')
          .optional(),
        primary_job_data: z
          .boolean()
          .describe(
            'Whether to inquire only about the main position- true: returns only employment records primary_job_data true- false: returns only job records primary_job_data false- Do not pass: return to all',
          )
          .optional(),
        assignment_start_reasons: z
          .array(z.string())
          .describe(
            'Business type (original: reason for employment)- You can query through the [Get Field Details] interface, the query parameters are as follows:- object_api_name: job_data- custom_api_name: assignment_start_reason',
          )
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV2EnumSearch = {
  project: 'corehr',
  name: 'corehr.v2.enum.search',
  sdkName: 'corehr.v2.enum.search',
  path: '/open-apis/corehr/v2/enums/search',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Enums-Query enums-Query the enumeration details based on the enumeration's APIName for scenarios like BPM",
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        enum_apiname_lists: z
          .array(z.string())
          .describe('Enum apiname list （The result is empty if you do not specify a value.）')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2JobChangeCreate = {
  project: 'corehr',
  name: 'corehr.v2.jobChange.create',
  sdkName: 'corehr.v2.jobChange.create',
  path: '/open-apis/corehr/v2/job_changes',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Feishu People（Enterprise Edition）-Job change-Job Change-This interface is used to initiate an employee change. If the initiation is successful, an employee's change data will be generated",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      transfer_mode: z.number().describe('change mode Options:1(type1 direct outliers),2(type2 initiate a change)'),
      employment_id: z.string().describe('Employee ID'),
      transfer_type_unique_identifier: z
        .string()
        .describe(
          'Unique identification of the transaction type. Filling in the system preset transaction type is not supported, including organizational adjustment, transfer of responsibilities, and positive probation period',
        ),
      flow_id: z.string().describe('transition process ID').optional(),
      effective_date: z.string().describe('Effective Date'),
      transfer_info: z
        .object({
          remark: z.string().describe('Remarks').optional(),
          offer_info: z.string().describe('Offer information').optional(),
          target_dotted_manager_clean: z.boolean().describe('Whether to undo dotted-line manager').optional(),
          probation_exist: z.boolean().describe('Is there a probation period').optional(),
          target_department: z.string().describe('new department').optional(),
          target_work_location: z.string().describe('New workplace').optional(),
          target_direct_manager: z.string().describe('New direct manager').optional(),
          target_dotted_manager: z.string().describe('New dotted-line manager').optional(),
          target_job: z.string().describe('new position').optional(),
          target_job_family: z.string().describe('new sequence').optional(),
          target_job_level: z.string().describe('new level').optional(),
          target_workforce_type: z.string().describe('New personnel type').optional(),
          target_employee_subtype: z.string().describe('New personnel subtype').optional(),
          target_company: z.string().describe('New Company').optional(),
          target_contract_number: z.string().describe('New contract number').optional(),
          target_contract_type: z.string().describe('New contract type').optional(),
          target_duration_type: z.string().describe('New Term Type').optional(),
          target_signing_type: z.string().describe('New signing type').optional(),
          target_contract_start_date: z.string().describe('New contract start date').optional(),
          target_contract_end_date: z.string().describe('New contract end date').optional(),
          target_working_hours_type: z.string().describe('New working hour system').optional(),
          target_working_calendar: z.string().describe('New work calendar').optional(),
          target_probation_end_date: z.string().describe('Expected end date of probation period').optional(),
          target_weekly_working_hours: z.string().describe('New week working hours').optional(),
          target_work_shift: z.string().describe('new schedule').optional(),
          target_cost_center_rates: z
            .array(
              z.object({
                cost_center_id: z
                  .string()
                  .describe(
                    'Cost center ID, you can obtain the corresponding cost center information through the [Query a single cost center information] interface',
                  )
                  .optional(),
                rate: z.number().describe('proportion of assessment').optional(),
              }),
            )
            .describe('New cost center apportionment')
            .optional(),
          target_employment_change: z
            .object({
              regular_employee_start_date: z.string().describe('Date of transfer to regular employee').optional(),
              seniority_date: z.string().describe('Tenure commencement date').optional(),
              employee_number: z.string().describe('Employee ID').optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'Field value, which is the string escaped by json, according to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('custom field')
                .optional(),
            })
            .describe('New job information')
            .optional(),
          target_job_grade: z.string().describe('new grade').optional(),
          target_compensation_type: z.string().describe('New salary type').optional(),
          target_service_company: z.string().describe('Xinjian Company').optional(),
          target_position: z.string().describe('new position').optional(),
          target_social_security_city: z.string().describe('New social security city').optional(),
          is_transfer_with_workforce: z.boolean().describe('-').optional(),
        })
        .describe('Change Details'),
      transfer_key: z.string().describe('Transaction Record Identifier').optional(),
      initiator_id: z.string().describe('Transaction Promoter ID').optional(),
      transfer_reason_unique_identifier: z.string().describe('-').optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_admin_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2JobChangeRevoke = {
  project: 'corehr',
  name: 'corehr.v2.jobChange.revoke',
  sdkName: 'corehr.v2.jobChange.revoke',
  path: '/open-apis/corehr/v2/job_changes/:job_change_id/revoke',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job change-Revoke job change-The interface is used to revoke employee changes. If initiated successfully, it will revoke a change request that has been submitted, is pending, or has already taken effect, while generating the corresponding event：[Transaction state change]. An operator must be specified when using it, and must have permissions of the job change process or must be the approvor of the process',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      operator_id: z
        .string()
        .describe(
          "operator's user ID. The operator must have permissions of the job change process or must be the approvor of the process",
        ),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_admin_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z.object({ job_change_id: z.string() }),
  },
};
export const corehrV2JobChangeSearch = {
  project: 'corehr',
  name: 'corehr.v2.jobChange.search',
  sdkName: 'corehr.v2.jobChange.search',
  path: '/open-apis/corehr/v2/job_changes/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job change-Search job_change information-Search for movement information',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        employment_ids: z.array(z.string()).describe('Employee ID list').optional(),
        job_change_ids: z.array(z.string()).describe('Transaction record ID list').optional(),
        statuses: z
          .array(
            z
              .enum(['Approving', 'Approved', 'Transformed', 'Rejected', 'Cancelled', 'NoNeedApproval'])
              .describe(
                'Options:Approving(Approving approval),Approved(Approved),Transformed(Transformed),Rejected(Rejected rejected),Cancelled(Cancelled Cancelled),NoNeedApproval(NoNeedApproval No approval required)',
              ),
          )
          .describe('Transaction state, the relationship between multiple states is "or"')
          .optional(),
        effective_date_start: z
          .string()
          .describe(
            'Effective date of the change - the start of the search range, which needs to be used together with the end of the search range',
          )
          .optional(),
        effective_date_end: z.string().describe('Effective date of the change - search range ends').optional(),
        updated_time_start: z
          .string()
          .describe(
            'Updated time of the change - the start of the search range, which needs to be used together with the end of the search range. Millisecond timestamp',
          )
          .optional(),
        updated_time_end: z
          .string()
          .describe('Updated time of the change - search range ends. Millisecond timestamp')
          .optional(),
        target_department_ids: z.array(z.string()).describe('List of new department IDs').optional(),
        transfer_type_unique_identifier: z.array(z.string()).describe('transfer type list').optional(),
        transfer_reason_unique_identifier: z.array(z.string()).describe('transfer reason list').optional(),
        exception_statuses: z
          .array(z.enum(['pending', 'processed']).describe('Options:pending(pending),processed(processed)'))
          .describe('exception status list')
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV2JobFamilyBatchGet = {
  project: 'corehr',
  name: 'corehr.v2.jobFamily.batchGet',
  sdkName: 'corehr.v2.jobFamily.batchGet',
  path: '/open-apis/corehr/v2/job_families/batch_get',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job family-Get job family information in batches according to conditions-Batch query the detailed information of the currently effective version of the job family through the sequence ID or sequence Code, including the sequence name, activation status, parent sequence, etc',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        job_family_ids: z
          .array(z.string())
          .describe(
            'List of Job Family IDs. How to get the ID:- At least one item in the Job Family ID list and the Job Family Code list has a value, otherwise the interface call will fail.- If not set, it means that the condition is not filtered- Code acquisition method: Call [Create job family] [Query the job family information of tenant] and other interfaces to return the Job Family Code',
          )
          .optional(),
        job_family_codes: z
          .array(z.string())
          .describe(
            'List of Job Family Codes.- At least one item in the Job Family ID list and the Job Family Code list has a value, otherwise the interface call will fail.- If not set, it means that the condition is not filtered- Code acquisition method: Call [Create job family] [Query the job family information of tenant] and other interfaces to return the Job Family Code',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2JobGradeCreate = {
  project: 'corehr',
  name: 'corehr.v2.jobGrade.create',
  sdkName: 'corehr.v2.jobGrade.create',
  path: '/open-apis/corehr/v2/job_grades',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-job_grade-Create JobGrade-create job grade',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      grade_order: z.number().describe('Job grade order'),
      code: z.string().describe('Job grade code').optional(),
      names: z
        .array(
          z.object({
            lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
            value: z
              .string()
              .describe(
                'Content- There will be a globally unique check for the Chinese and English names of the Job Grade- Name cannot contain 「/」「；」「;」 characters',
              ),
          }),
        )
        .describe('Job grade name'),
      descriptions: z
        .array(
          z.object({
            lang: z.string().describe('Language of description information, zh-CN in Chinese, en-US in English'),
            value: z
              .string()
              .describe(
                'Content- There will be a globally unique check for the Chinese and English descriptions of the Job Grade- Name cannot contain 「/」「；」「;」 characters',
              ),
          }),
        )
        .describe('Job grade description')
        .optional(),
    }),
    params: z.object({ client_token: z.string().optional() }).optional(),
  },
};
export const corehrV2JobGradeDelete = {
  project: 'corehr',
  name: 'corehr.v2.jobGrade.delete',
  sdkName: 'corehr.v2.jobGrade.delete',
  path: '/open-apis/corehr/v2/job_grades/:job_grade_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-job_grade-Delete JobGrade-delete job grade',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      job_grade_id: z
        .string()
        .describe(
          'Job Grade Id. ID acquisition method:- Call [New Job Grade] [Query the Job grade information of the tenant] and other interfaces to return the sequence ID',
        ),
    }),
  },
};
export const corehrV2JobGradePatch = {
  project: 'corehr',
  name: 'corehr.v2.jobGrade.patch',
  sdkName: 'corehr.v2.jobGrade.patch',
  path: '/open-apis/corehr/v2/job_grades/:job_grade_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-job_grade-Patch JobGrade-update job grade',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        grade_order: z.number().describe('Job grade order').optional(),
        code: z.string().describe('Job grade code').optional(),
        names: z
          .array(
            z.object({
              lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
              value: z
                .string()
                .describe(
                  'Content- There will be a globally unique check for the Chinese and English names of the Job Grade- Name cannot contain 「/」「；」「」 characters',
                ),
            }),
          )
          .describe('Job grade name')
          .optional(),
        descriptions: z
          .array(
            z.object({
              lang: z.string().describe('Language of description information, zh-CN in Chinese, en-US in English'),
              value: z
                .string()
                .describe(
                  'Content- There will be a globally unique check for the Chinese and English descriptions of the Job Grade- Name cannot contain 「/」「；」「;」 characters',
                ),
            }),
          )
          .describe('Job grade description')
          .optional(),
        active: z.boolean().describe('Enable').optional(),
      })
      .optional(),
    params: z.object({ client_token: z.string().optional() }).optional(),
    path: z.object({
      job_grade_id: z
        .string()
        .describe(
          'Job Grade Id. ID acquisition method:- Call [New Job Grade] [Query the Job grade information of the tenant] and other interfaces to return the sequence ID',
        ),
    }),
  },
};
export const corehrV2JobGradeQuery = {
  project: 'corehr',
  name: 'corehr.v2.jobGrade.query',
  sdkName: 'corehr.v2.jobGrade.query',
  path: '/open-apis/corehr/v2/job_grades/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-job_grade-Get the job grade-query job grade',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        ids: z.array(z.string()).describe('Level ID List.If it is empty, it is a mean query').optional(),
        codes: z.array(z.string()).describe('List of grade codes.If it is empty, it is a mean query').optional(),
        active: z.boolean().describe('Whether to enable.If it is empty, it is a mean query').optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const corehrV2JobLevelBatchGet = {
  project: 'corehr',
  name: 'corehr.v2.jobLevel.batchGet',
  sdkName: 'corehr.v2.jobLevel.batchGet',
  path: '/open-apis/corehr/v2/job_levels/batch_get',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job level-Get job level information in batches according to conditions-This interface supports batch query of job level details by job level ID or job level Code, including the name, description, and activation status',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        job_level_ids: z
          .array(z.string())
          .describe(
            'Job level ID list- At least one of the job level ID list and the job level Code list must have a value, otherwise the interface call will fail.- If not set, it means that this condition is not filtered- ID acquisition method: Calling interfaces such as [Create job level][Batch query job level] can return job level IDs',
          )
          .optional(),
        job_level_codes: z
          .array(z.string())
          .describe(
            'Job level code list- At least one of the job level ID list and the job level code list must have a value, otherwise the interface call will fail.- If not set, it means that this condition is not filtered- Code acquisition method: Calling [Create job level][Batch query job level] and other interfaces can return the job level code',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2JobGet = {
  project: 'corehr',
  name: 'corehr.v2.job.get',
  sdkName: 'corehr.v2.job.get',
  path: '/open-apis/corehr/v2/jobs/:job_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job-Get job profile (V2)-Obtain job profile with ID',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      job_id: z
        .string()
        .describe(
          'Job ID. How to get ID:- Call [Create job] [Batch query job] to return job ID- You can also create jobs through [[Event]Create jobs](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/job/events/created) [[Event] Update jobs](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/department/events/updated) Get ID',
        ),
    }),
  },
};
export const corehrV2JobList = {
  project: 'corehr',
  name: 'corehr.v2.job.list',
  sdkName: 'corehr.v2.job.list',
  path: '/open-apis/corehr/v2/jobs',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job-Get the list of job profile-Get the list of job profile',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Number of records fetched per page, up to 100'),
      name: z.string().describe('name').optional(),
      query_language: z
        .string()
        .describe('Language information, Chinese with zh-CN, English with en-US- Passing empty defaults to ALL')
        .optional(),
    }),
  },
};
export const corehrV2JobQueryRecentChange = {
  project: 'corehr',
  name: 'corehr.v2.job.queryRecentChange',
  sdkName: 'corehr.v2.job.queryRecentChange',
  path: '/open-apis/corehr/v2/jobs/query_recent_change',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job-query recent change job-Query the job where the current effective information has changed within the specified time range, that is, only the effective time of the current effective version of the job is within the query time range will the job id be returned',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().describe('Page size, up to 2000'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      start_date: z
        .string()
        .describe('The start time of the query, supports "yyyy-MM-dd HH: MM: SS".Limited query range within 90 days'),
      end_date: z
        .string()
        .describe(
          'The end time of the query, in the format "yyyy-MM-dd HH: MM: SS".Limited query range within 90 days',
        ),
    }),
  },
};
export const corehrV2LocationActive = {
  project: 'corehr',
  name: 'corehr.v2.location.active',
  sdkName: 'corehr.v2.location.active',
  path: '/open-apis/corehr/v2/locations/active',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Location-Enable/Disable Location-Enable/Disable Location',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      location_id: z
        .string()
        .describe(
          'Location ID. ID acquisition method:- Call [Create Location] [Batch Paging Query Location] and other interfaces to return the location ID',
        ),
      effective_time: z
        .string()
        .describe(
          'Location enable/disable effective date- Fill in the format: YYYY-MM-DD (the system will automatically change the hours, minutes and seconds to 00:00:00)- The system defaults to take effect at 00:00:00 on the day when the date is filled in- This interface only supports the smallest unit of day- Date range requirements: 1900-01-01～9999-12-31',
        ),
      active: z.boolean().describe('Location enabled/deactivated status- true means enable- false means deactivate'),
      operation_reason: z.string().describe('Operating reason'),
    }),
  },
};
export const corehrV2LocationAddressCreate = {
  project: 'corehr',
  name: 'corehr.v2.locationAddress.create',
  sdkName: 'corehr.v2.locationAddress.create',
  path: '/open-apis/corehr/v2/locations/:location_id/addresses',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Location-Location Address-Add Location Address-Add Location Address',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      country_region_id: z
        .string()
        .describe('Country ID- It can be obtained through the [Query country/region information] interface'),
      region_id: z
        .string()
        .describe(
          'Main administrative region ID- It can be obtained through the [Query Province/Administrative Region Information] interface',
        ),
      city_id: z.string().describe('City ID.- It can be obtained through the [Query City Information] interface'),
      distinct_id: z
        .string()
        .describe(
          'District/County ID- It can be obtained through the [Query District and County Information] interface',
        ),
      local_address_line1: z
        .string()
        .describe('Address line 1 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]')
        .optional(),
      local_address_line2: z
        .string()
        .describe('Address line 2 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]')
        .optional(),
      local_address_line3: z
        .string()
        .describe('Address line 3 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]')
        .optional(),
      local_address_line4: z
        .string()
        .describe('Address line 4 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]')
        .optional(),
      local_address_line5: z
        .string()
        .describe('Address line 5 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]')
        .optional(),
      local_address_line6: z
        .string()
        .describe('Address line 6 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]')
        .optional(),
      local_address_line7: z
        .string()
        .describe('Address line 7 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]')
        .optional(),
      local_address_line8: z
        .string()
        .describe('Address line 8 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]')
        .optional(),
      local_address_line9: z
        .string()
        .describe('Address line 9 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]')
        .optional(),
      postal_code: z.string().describe('Postal code').optional(),
      address_types: z
        .array(z.object({ enum_name: z.string().describe('enumeration value') }))
        .describe(
          'Address type, enumeration value and details can be obtained by [Introduction to enumeration constants] query',
        )
        .optional(),
      is_primary: z
        .boolean()
        .describe(
          'Whether it is a primary address, there can only be one primary address in a location. Adding a primary address will cancel the original primary address.- true means the address is the primary address- false means the address is not the primary address',
        )
        .optional(),
      is_public: z
        .boolean()
        .describe(
          'Whether to disclose the address- true means the address is a public address- false means the address is not a public address',
        )
        .optional(),
    }),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Determine whether the same request is based on whether the client_token are consistent')
          .optional(),
      })
      .optional(),
    path: z.object({
      location_id: z
        .string()
        .describe(
          'Location ID. ID acquisition method:- Call [Create Location] [Batch Paging Query Location] and other interfaces to return the location ID',
        ),
    }),
  },
};
export const corehrV2LocationAddressDelete = {
  project: 'corehr',
  name: 'corehr.v2.locationAddress.delete',
  sdkName: 'corehr.v2.locationAddress.delete',
  path: '/open-apis/corehr/v2/locations/:location_id/addresses/:address_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Location-Location Address-Delete Location Address-Delete Location Address',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      location_id: z
        .string()
        .describe(
          'Location ID. ID acquisition method:- Call [Create Location] [Batch Paging Query Location] and other interfaces to return the location ID',
        ),
      address_id: z
        .string()
        .describe(
          'Address ID. ID acquisition method:- Call [Create Location] [Batch Paging Query Location] [Add Location Address] and other interfaces to return the address ID',
        ),
    }),
  },
};
export const corehrV2LocationAddressPatch = {
  project: 'corehr',
  name: 'corehr.v2.locationAddress.patch',
  sdkName: 'corehr.v2.locationAddress.patch',
  path: '/open-apis/corehr/v2/locations/:location_id/addresses/:address_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Location-Location Address-Update Location Address-Update Location Address',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        country_region_id: z
          .string()
          .describe('Country ID- It can be obtained through the [Query country/region information] interface')
          .optional(),
        region_id: z
          .string()
          .describe(
            'Main administrative region ID- It can be obtained through the [Query Province/Administrative Region Information] interface',
          )
          .optional(),
        city_id: z
          .string()
          .describe('City ID.- It can be obtained through the [Query City Information] interface')
          .optional(),
        distinct_id: z
          .string()
          .describe(
            'District/County ID- It can be obtained through the [Query District and County Information] interface',
          )
          .optional(),
        local_address_line1: z
          .string()
          .describe(
            'Address line 1 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]',
          )
          .optional(),
        local_address_line2: z
          .string()
          .describe(
            'Address line 2 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]',
          )
          .optional(),
        local_address_line3: z
          .string()
          .describe(
            'Address line 3 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]',
          )
          .optional(),
        local_address_line4: z
          .string()
          .describe(
            'Address line 4 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]',
          )
          .optional(),
        local_address_line5: z
          .string()
          .describe(
            'Address line 5 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]',
          )
          .optional(),
        local_address_line6: z
          .string()
          .describe(
            'Address line 6 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]',
          )
          .optional(),
        local_address_line7: z
          .string()
          .describe(
            'Address line 7 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]',
          )
          .optional(),
        local_address_line8: z
          .string()
          .describe(
            'Address line 8 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]',
          )
          .optional(),
        local_address_line9: z
          .string()
          .describe(
            'Address line 9 (non-Latin native scripts)- The filling rules can be seen in [Address Filling Guide]',
          )
          .optional(),
        postal_code: z.string().describe('Postal code').optional(),
        address_types: z
          .array(z.object({ enum_name: z.string().describe('enumeration value') }))
          .describe(
            'Address type, enumeration value and details can be obtained by [Introduction to enumeration constants] query',
          )
          .optional(),
        is_primary: z
          .boolean()
          .describe(
            'Whether it is a primary address, there can only be one primary address in a location. Updating the address to a primary address will cancel the original primary address, and the primary address cannot be updated to a non-primary address.- true means the address is the primary address- false means the address is not the primary address',
          )
          .optional(),
        is_public: z
          .boolean()
          .describe(
            'Whether to disclose the address- true means the address is a public address- false means the address is not a public address',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Determine whether the same request is based on whether the client_token are consistent')
          .optional(),
      })
      .optional(),
    path: z.object({
      location_id: z
        .string()
        .describe(
          'Location ID. ID acquisition method:- Call [Create Location] [Batch Paging Query Location] and other interfaces to return the location ID',
        ),
      address_id: z
        .string()
        .describe(
          'Address ID. ID acquisition method:- Call [Create Location] [Batch Paging Query Location] [Add Location Address] and other interfaces to return the address ID',
        ),
    }),
  },
};
export const corehrV2LocationBatchGet = {
  project: 'corehr',
  name: 'corehr.v2.location.batchGet',
  sdkName: 'corehr.v2.location.batchGet',
  path: '/open-apis/corehr/v2/locations/batch_get',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Location-Batch get location information by ID-Batch get location information by location ID list',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      location_ids: z
        .array(z.string())
        .describe(
          'Location ID list, location record ID maintained by the location maintenance administrator in the Feishu personnel system, organization management module. ID acquisition method:- Call [Create Location] [Batch Paging Query Location] and other interfaces to return the location ID',
        ),
    }),
  },
};
export const corehrV2LocationPatch = {
  project: 'corehr',
  name: 'corehr.v2.location.patch',
  sdkName: 'corehr.v2.location.patch',
  path: '/open-apis/corehr/v2/locations/:location_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Location-Update Location-Update location',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      parent_id: z
        .string()
        .describe(
          'Higher-level location, under the creation scenario, this field is required, and the enumeration value and detailed information can be obtained by [Batch paging query location] query',
        )
        .optional(),
      names: z
        .array(
          z.object({
            lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
            value: z.string().describe('name content'),
          }),
        )
        .describe(
          'Location name- Name cannot contain 「/」「；」「;」 characters- There will be a globally unique check for the Chinese and English names of the Location',
        )
        .optional(),
      active: z
        .boolean()
        .describe('Location enabled/deactivated status- true means enable- false means deactivate')
        .optional(),
      effective_time: z
        .string()
        .describe(
          'Version effective date- Fill in the format: YYYY-MM-DD (the system will automatically change the hours, minutes and seconds to 00:00:00)- The system defaults to take effect at 00:00:00 on the day when the date is filled in- This interface only supports the smallest unit of day- Date range requirements: 1900-01-01～9999-12-31',
        ),
      code: z
        .string()
        .describe(
          'Location code (cannot be repeated with the encoding of other records), this field will be invalid when automatic encoding is turned on',
        )
        .optional(),
      descriptions: z
        .array(
          z.object({
            lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
            value: z.string().describe('Describe content'),
          }),
        )
        .describe('Location description')
        .optional(),
      location_usages: z
        .array(z.object({ enum_name: z.string().describe('enumeration value') }))
        .describe(
          'Location use ID, enumeration value and detailed information can be obtained by [batch query location usage] interface query.- Request parameter object_api_name=location; custom_api_name=location_usage',
        )
        .optional(),
      working_hours_type_id: z
        .string()
        .describe(
          'The working hour system ID, enumeration value and detailed information can be obtained through the [batch query working hour system] interface query',
        )
        .optional(),
      locale: z
        .object({ enum_name: z.string().describe('enumeration value') })
        .describe(
          'Locale ID, enumeration value and details can be obtained by [batch query enumeration information] interface query.- Request parameter object_api_name=location; custom_api_name=locale',
        )
        .optional(),
      time_zone_id: z.string().describe('Time Zone ID').optional(),
      display_language_id: z.string().describe('Default display language ID').optional(),
    }),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Determine whether the same request is based on whether the client_token are consistent')
          .optional(),
      })
      .optional(),
    path: z.object({
      location_id: z
        .string()
        .describe(
          'Location ID. ID acquisition method:- Call [Create Location] [Batch Paging Query Location] and other interfaces to return the location ID',
        ),
    }),
  },
};
export const corehrV2LocationQueryRecentChange = {
  project: 'corehr',
  name: 'corehr.v2.location.queryRecentChange',
  sdkName: 'corehr.v2.location.queryRecentChange',
  path: '/open-apis/corehr/v2/locations/query_recent_change',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Location-query recent change location-Query the cost center whose current effective information has changed within the specified time range, that is, only when the effective time of the current effective version of the cost center is within the query time range, the department ID will be returned',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      start_date: z.string(),
      end_date: z.string(),
    }),
  },
};
export const corehrV2OffboardingEdit = {
  project: 'corehr',
  name: 'corehr.v2.offboarding.edit',
  sdkName: 'corehr.v2.offboarding.edit',
  path: '/open-apis/corehr/v2/offboardings/edit',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee turnover-Edit offboarding info-This interface is used to edit Feishu CoreHR's [Offboarding information]. Supported fields include offboarding date, offboarding reason, offboarding initiation time, and offboarding approval time, etc. It also supports editing custom fields of offboarding (except attachment fields). When the interface is successfully submitted, the corresponding [offboarding information change] event will be generated",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      offboarding_id: z
        .string()
        .describe(
          'Offboarding record ID. It cannot be empty. You can get it by [searching offboarding information]. The value is taken from data > items > offboarding_id returned by the interface',
        ),
      operator_id: z
        .string()
        .describe(
          'Operator ID. The ID type is consistent with the value of the query parameter user_id_type:1. When the value of user_id_type is open_id, please refer to [How to obtain your own Open ID] for the ID acquisition method.2. When the value of user_id_type is user_id, please refer to [How to obtain your own User ID] for the ID acquisition method.3. When the value of user_id_type is union_id, please refer to [How to obtain your own Union ID] for the ID acquisition method.4. When the value of user_id_type is people_corehr_id, first refer to [How to obtain your own User ID] to obtain the User ID. Then obtain the employment ID through [ID conversion]',
        )
        .optional(),
      update_data: z
        .array(
          z.object({
            field_name: z
              .string()
              .describe(
                'Field unique identifier (api_name) Note: 1. This field value is taken from the field code of each field in [Personnel Profile Configuration] > Information Configuration > Resignation Information 2. Custom fields can also be obtained through [Get Custom Field List] 3. Non-editable field api_name range: -wk_id -wk_tenant_id -employment -process_id -flow_id -node_id -initiator_id -status -checklist_status -checklist_process_id -type-hrbp_ids -hrbp_list -probation_id -wk_created_at -wk_created_by -wk_updated_at -wk_updated_by -wk_deleted_at -wk_is_deleted -noncompete_agreement_id -social_insurance_end_date -provident_fund_end_date -sign_type',
              ),
            value: z
              .string()
              .describe(
                'The field value is a string escaped from JSON. The field format varies depending on the metadata definition, for example: - Text type (1): "text" - Boolean type (2): "true" - Number type (3): "123" - Single-value enumeration type (4): "option_1" - Multi-value enumeration type (4): "[\\"option_1\\",\\"option_2\\"]" - Date type (7): "2024-06-30" Note: 1. The enumeration value of the enumeration field is taken from the option code of the corresponding field option set in [Personnel Profile Configuration] > Information Configuration > Resignation Information. 2. Enumeration field values ​​can also be obtained through [Get Field Details], refer to the field details returned by the interface > Field Type Configuration Information > Option Configuration Information > Option Information > Enumeration Constant Set API name 3. The personnel field currently only supports the incoming employee\'s employment ID. First refer to [How to obtain your own User ID] to obtain the User ID. Then obtain the employment ID through [ID conversion]',
              ),
          }),
        )
        .describe('Edit field data information, it is not allowed to be empty'),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2OffboardingRevoke = {
  project: 'corehr',
  name: 'corehr.v2.offboarding.revoke',
  sdkName: 'corehr.v2.offboarding.revoke',
  path: '/open-apis/corehr/v2/offboardings/revoke',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee turnover-Revoke offboarding-Revoke the [offboarding information] of Feishu personnel through the offboarding ID. When the interface is successfully submitted, the corresponding [exit information change] event will be generated',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      offboarding_id: z
        .string()
        .describe(
          'The offboarding record ID is not allowed to be empty. It can be obtained through [Search for exit information], and the value is returned by the interface data > items > offboarding_id',
        ),
      operator_id: z
        .string()
        .describe(
          'Operator employment ID. The ID type is consistent with the value of the query parameter user_id_type:1. When the value of user_id_type is open_id, please refer to [How to obtain your own Open ID] for the ID acquisition method.2. When the value of user_id_type is user_id, please refer to [How to obtain your own User ID] for the ID acquisition method.3. When the value of user_id_type is union_id, please refer to [How to obtain your own Union ID] for the ID acquisition method.4. When the value of user_id_type is people_corehr_id, first refer to [How to obtain your own User ID] to obtain the User ID. Then obtain the employment ID through [ID conversion].Note: When empty, the default system operator',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2OffboardingSubmitV2 = {
  project: 'corehr',
  name: 'corehr.v2.offboarding.submitV2',
  sdkName: 'corehr.v2.offboarding.submitV2',
  path: '/open-apis/corehr/v2/offboardings/submit_v2',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee turnover-Submit offboarding-This interface is used to submit the [offboarding information] of Feishu Personnel. It supports filling in the offboarding date, reason for offboarding, block list and custom fields (except attachment fields). When the interface is successfully submitted, the corresponding [offboarding information change] event will be generated',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      offboarding_mode: z
        .number()
        .describe(
          'way of leaving Options:1(Termination_of_dismissal direct offboarding),2(Offboarding_with_process offboarding with process)',
        ),
      employment_id: z
        .string()
        .describe(
          'The offboarding employee ID is not allowed to be empty. The ID type is consistent with the value of the query parameter user_id_type:1. When the value of user_id_type is open_id, please refer to [How to obtain your own Open ID] for the ID acquisition method.2. When the value of user_id_type is user_id, please refer to [How to obtain your own User ID] for the ID acquisition method.3. When the value of user_id_type is union_id, please refer to [How to obtain your own Union ID] for the ID acquisition method.4. When the value of user_id_type is people_corehr_id, first refer to [How to obtain your own User ID] to obtain the User ID. Then obtain the employment ID through [ID conversion]',
        ),
      offboarding_date: z
        .string()
        .describe(
          "Offboarding date is not allowed to be empty. When filling in, it needs to conform to the date format of YYYY-MM-DD.Notes:It will take effect at 24:00 in the time zone of the employee's worklocation on the day of resignation. Assume that the employee's resignation date is 2024-12-01. If the employee is in mainland China, the effective time is 2024-12-01 23:59:59 in East Eighth District. If the employee is in Washington, the effective time is 2024-12-02 12:59:59 in East District 8, which corresponds to 2024-12-01 23:59:59 in West District 5",
        ),
      offboarding_reason_unique_identifier: z
        .string()
        .describe(
          'Reason for offboarding not allowed to be empty, available through the interface[Query the list of reasons for offboarding] Get',
        ),
      offboarding_reason_explanation: z
        .string()
        .describe('Offboarding reason explanation, optional, maximum length 6000')
        .optional(),
      initiator_id: z
        .string()
        .describe(
          'The initiator ID. The initiator should have a Feishu account, and can login the system. The ID type is consistent with the value of the query parameter user_id_type:1. When the value of user_id_type is open_id, please refer to [How to obtain your own Open ID] for the ID acquisition method.2. When the value of user_id_type is user_id, please refer to [How to obtain your own User ID] for the ID acquisition method.3. When the value of user_id_type is union_id, please refer to [How to obtain your own Union ID] for the ID acquisition method.4. When the value of user_id_type is people_corehr_id, first refer to [How to obtain your own User ID] to obtain the User ID. Then obtain the employment ID through [ID conversion].Attention:1. Only the initiator can revoke the process2. When empty, the default system initiator',
        )
        .optional(),
      add_block_list: z
        .boolean()
        .describe(
          "Whether to join the offboarding block listAttention:1. When the value is true, the block reason is required.2. When the value is false, it is not allowed to fill in the block reason and block reason explanation.3. When the value is empty, it is not allowed to fill in the block reason and block reason explanation.4. If you choose to join the block list when terminating, you will only enter the block list after the employee's offboarding takes effect",
        )
        .optional(),
      block_reason: z
        .string()
        .describe(
          'block reasonAttention:1. The value of this field is in the masking reason field option set of [Personnel File Configuration] > Information Configuration > Leaving Information.2. The enumeration field value can also be obtained by [Get Field Details], the reference interface returns, field details > field type configuration information > option configuration information > option information > enumeration value set API name3. Whether this field is required depends on whether to join the exit block list (add_block_list)',
        )
        .optional(),
      block_reason_explanation: z
        .string()
        .describe('Block reason explanation, optional, maximum length 6000')
        .optional(),
      custom_fields: z
        .array(
          z.object({
            field_name: z
              .string()
              .describe(
                'Custom field unique identifierAttention:1. The value of this field is in the field code of each field in [Personnel File Configuration] > Information Configuration > Leaving Information2. This field can also be obtained by [Get Custom Field List]',
              ),
            value: z
              .string()
              .describe(
                'Custom field values, field formats is depend on the metadata definition(e.g. 123, 123.23, "true", [\\ "id1\\",\\ "id2\\"], "2006-01-02 15:04:05").Attention:1. The enumeration value of the enumeration field is set to [Personnel File Configuration] > Information Configuration > Leaving Information, which corresponds to the option encoding of the field option set.2. The enumeration field value can also be obtained by [Get Field Details], the reference interface returns, field details > field type configuration information > option configuration information > option information > enumeration value set API name3. The personnel field currently only supports the incoming employee\'s employment ID. First refer to [How to obtain your own User ID] to obtain the User ID. Then obtain the employment ID through [ID conversion].4. Filling in the attachment type field is not supported for the time being',
              ),
          }),
        )
        .describe(
          'Offboarding custom fields.Note: The field ranges that can be filled in refer to the custom fields in [Personnel Profile Configuration] > Information Configuration > Leaving Information',
        )
        .optional(),
      retain_account: z.boolean().describe('Retain account when offboarding effected').optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2PersonCreate = {
  project: 'corehr',
  name: 'corehr.v2.person.create',
  sdkName: 'corehr.v2.person.create',
  path: '/open-apis/corehr/v2/persons',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Personal information-Create person information-Create personal information',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        name_list: z
          .array(
            z.object({
              local_primary: z.string().describe('Last Name - Local Text').optional(),
              local_first_name: z.string().describe('First Name - Local Text').optional(),
              country_region_id: z.string().describe('Country/Region'),
              name_type: z.object({ enum_name: z.string().describe('enumeration value') }).describe('Name type'),
              local_first_name_2: z.string().describe('First Name - Second Local Text').optional(),
              local_primary_2: z.string().describe('Last Name - Second Local Character').optional(),
              additional_name_type: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('Supplementary Name Type')
                .optional(),
              first_name: z.string().describe('name').optional(),
              full_name: z.string().describe('full name').optional(),
              hereditary: z.string().describe('surname').optional(),
              custom_name: z
                .string()
                .describe(
                  'Custom name (when not passed in, the name will be spliced together according to the rules of the country/region to which it belongs)',
                )
                .optional(),
              custom_local_name: z
                .string()
                .describe(
                  'Custom name of local text (when not passed in, the name of the local text will be spliced with the relevant last name and first name field of the local text by default according to the rules of the country/region to which it belongs)',
                )
                .optional(),
              middle_name: z.string().describe('middle name').optional(),
              name_primary: z.string().describe('surname').optional(),
              secondary: z.string().describe('Second surname').optional(),
              social: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('honorific title')
                .optional(),
              tertiary: z.string().describe('Married name').optional(),
              title: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('title')
                .optional(),
              local_middle_name: z.string().describe('Local middle name').optional(),
              local_secondary: z.string().describe('Second Last Name - Local Text').optional(),
            }),
          )
          .describe('Name list')
          .optional(),
        gender: z
          .object({ enum_name: z.string().describe('enumeration value') })
          .describe(
            'Gender, enumeration values are available through the document [Feishu Personnel Enumeration Constants] Gender (gender) enumeration definition section',
          )
          .optional(),
        date_of_birth: z.string().describe('Date of Birth').optional(),
        nationality_id_v2: z
          .string()
          .describe('Nationality ID, which can be queried through the [Query Nationality Information] interface')
          .optional(),
        race: z
          .object({ enum_name: z.string().describe('enumeration value') })
          .describe(
            'Ethnicity/race, enumeration values are available through the documentation [Feishu Personnel Enumeration Constants] Ethnicity (race) enumeration definition section',
          )
          .optional(),
        marital_status: z
          .object({ enum_name: z.string().describe('enumeration value') })
          .describe(
            'Marital status, enumeration values are available in the Marital Status (marital_status) enumeration definition section of the document [Feishu Personnel enumeration constants]',
          )
          .optional(),
        phone_list: z
          .array(
            z.object({
              international_area_code: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('Country code')
                .optional(),
              phone_number: z.string().describe('Phone number'),
            }),
          )
          .describe('Phone list')
          .optional(),
        address_list: z
          .array(
            z.object({
              address_id: z.string().describe('Address ID').optional(),
              country_region_id: z.string().describe('Country/Region'),
              region_id: z.string().describe('Main administrative region').optional(),
              address_line1: z.string().describe('Address line 1').optional(),
              address_line2: z.string().describe('Address line 2').optional(),
              address_line3: z.string().describe('Address line 3').optional(),
              address_line4: z.string().describe('Address line 4').optional(),
              address_line5: z.string().describe('Address line 5').optional(),
              address_line6: z.string().describe('Address line 6').optional(),
              address_line7: z.string().describe('Address line 7').optional(),
              address_line8: z.string().describe('Address line 8').optional(),
              address_line9: z.string().describe('Address line 9').optional(),
              local_address_line1: z.string().describe('Address line 1 (non-Latin native script)').optional(),
              local_address_line2: z.string().describe('Address line 2 (non-Latin native scripts)').optional(),
              local_address_line3: z.string().describe('Address line 3 (non-Latin native scripts)').optional(),
              local_address_line4: z.string().describe('Address line 4 (non-Latin native scripts)').optional(),
              local_address_line5: z.string().describe('Address line 5 (non-Latin native script)').optional(),
              local_address_line6: z.string().describe('Address line 6 (non-Latin native scripts)').optional(),
              local_address_line7: z.string().describe('Address line 7 (non-Latin native script)').optional(),
              local_address_line8: z.string().describe('Address line 8 (non-Latin native script)').optional(),
              local_address_line9: z.string().describe('Address line 9 (non-Latin native script)').optional(),
              postal_code: z.string().describe('Postal Code').optional(),
              address_type_list: z
                .array(z.object({ enum_name: z.string().describe('enumeration value') }))
                .describe('Address type'),
              is_primary: z.boolean().describe('Main address'),
              is_public: z.boolean().describe('public address'),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
            }),
          )
          .describe('Address list')
          .optional(),
        email_list: z
          .array(
            z.object({
              email: z.string().describe('Email address'),
              is_primary: z.boolean().describe('Is it the main mailbox?').optional(),
              is_public: z.boolean().describe('Is it a public email address?').optional(),
              email_usage: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe(
                  'Mailbox purpose, the enumeration value can be obtained through the document [Feishu personnel enumeration constant] Mailbox purpose (email_usage) enumeration definition',
                )
                .optional(),
            }),
          )
          .describe('Mailbox list')
          .optional(),
        work_experience_list: z
          .array(
            z.object({
              company_organization: z
                .array(z.object({ lang: z.string().describe('language'), value: z.string().describe('content') }))
                .describe('Company/Organization')
                .optional(),
              department: z
                .array(z.object({ lang: z.string().describe('language'), value: z.string().describe('content') }))
                .describe('department')
                .optional(),
              job: z
                .array(z.object({ lang: z.string().describe('language'), value: z.string().describe('content') }))
                .describe('post')
                .optional(),
              description: z
                .array(z.object({ lang: z.string().describe('language'), value: z.string().describe('content') }))
                .describe('Job Description')
                .optional(),
              start_date: z.string().describe('Start Date').optional(),
              end_date: z.string().describe('End date').optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
            }),
          )
          .describe('List of work experience')
          .optional(),
        education_list: z
          .array(
            z.object({
              school: z
                .array(z.object({ lang: z.string().describe('language'), value: z.string().describe('content') }))
                .describe('school'),
              level_of_education: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('Education')
                .optional(),
              start_date: z.string().describe('Start Date').optional(),
              end_date: z.string().describe('End date').optional(),
              field_of_study: z
                .array(z.object({ lang: z.string().describe('language'), value: z.string().describe('content') }))
                .describe('professional')
                .optional(),
              degree: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('degree')
                .optional(),
              school_name: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('School name')
                .optional(),
              field_of_study_name: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('Professional name')
                .optional(),
              country_region_id: z.string().describe('Country ID').optional(),
              expected_end_date: z.string().describe('Expected end date').optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
            }),
          )
          .describe('List of educational experiences')
          .optional(),
        bank_account_list: z
          .array(
            z.object({
              bank_name: z.string().describe('Bank name').optional(),
              bank_account_number: z.string().describe('Bank account number'),
              account_holder: z.string().describe('Account holder name'),
              branch_name: z.string().describe('Branch name').optional(),
              bank_id_v2: z
                .string()
                .describe(
                  'Bank ID, detailed information can be obtained through the [Query Bank Information] interface',
                )
                .optional(),
              branch_id_v2: z
                .string()
                .describe(
                  'Sub-branch ID, which must be filled in as the sub-branch of the bank. Detailed information can be obtained through the [Query Sub-branch Information] interface query',
                )
                .optional(),
              country_region_id: z
                .string()
                .describe(
                  'Country/region ID, detailed information can be obtained through the [Query Country/Region Information] interface query',
                )
                .optional(),
              bank_account_usage: z
                .array(z.object({ enum_name: z.string().describe('enumeration value') }))
                .describe(
                  'Bank card usage, the enumeration value can be obtained from the Bank Account Usage enumeration definition section of the document [Feishu Personnel Enumeration Constants]',
                )
                .optional(),
              bank_account_type: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe(
                  'Bank card type, the enumeration value can be obtained from the Bank Account Type enumeration definition section of the document [Feishu Personnel Enumeration Constants]',
                )
                .optional(),
              currency_id: z.string().describe('Currency ID').optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
            }),
          )
          .describe('bank account')
          .optional(),
        national_id_list: z
          .array(
            z.object({
              national_id_type_id: z.string().describe('National document type'),
              national_id_number: z.string().describe('ID number'),
              issue_date: z.string().describe('Document issue date').optional(),
              expiration_date: z.string().describe('Document expiration date').optional(),
              country_region_id: z.string().describe('Country/Region'),
              issued_by: z.string().describe('Document issuing agency').optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
            }),
          )
          .describe('certificate')
          .optional(),
        dependent_list: z
          .array(
            z.object({
              relationship: z.object({ enum_name: z.string().describe('enumeration value') }).describe('relationship'),
              gender: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('Gender')
                .optional(),
              date_of_birth: z.string().describe('birthday').optional(),
              nationality_id_v2: z
                .string()
                .describe('Nationality ID, which can be queried through the [Query Nationality Information] interface')
                .optional(),
              national_id_list: z
                .array(
                  z.object({
                    national_id_type_id: z.string().describe('National document type'),
                    national_id_number: z.string().describe('ID number'),
                    issue_date: z.string().describe('Document issue date').optional(),
                    expiration_date: z.string().describe('Document expiration date').optional(),
                    country_region_id: z.string().describe('Country/Region'),
                    issued_by: z.string().describe('Document issuing agency').optional(),
                    custom_fields: z
                      .array(
                        z.object({
                          custom_api_name: z
                            .string()
                            .describe('Custom field apiname, which is the unique identifier of the custom field'),
                          value: z
                            .string()
                            .describe(
                              'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                            ),
                        }),
                      )
                      .describe('Custom Fields')
                      .optional(),
                  }),
                )
                .describe('ID number')
                .optional(),
              spouses_working_status: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe("Spouse's work status")
                .optional(),
              is_this_person_covered_by_health_insurance: z
                .boolean()
                .describe('Family medical insurance included')
                .optional(),
              is_this_person_allowed_for_tax_deduction: z
                .boolean()
                .describe('Allow dependents to deduct tax')
                .optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
              dependent_name: z.string().describe('Family member name').optional(),
              employer: z.string().describe('work unit').optional(),
              job: z.string().describe('post').optional(),
              phone: z
                .object({
                  international_area_code: z
                    .object({ enum_name: z.string().describe('enumeration value') })
                    .describe('Country code')
                    .optional(),
                  phone_number: z.string().describe('Phone number'),
                })
                .describe('Telephone')
                .optional(),
              address: z
                .object({
                  address_id: z.string().describe('Address ID').optional(),
                  country_region_id: z.string().describe('Country/Region'),
                  region_id: z.string().describe('Main administrative region').optional(),
                  address_line1: z.string().describe('Address line 1').optional(),
                  address_line2: z.string().describe('Address line 2').optional(),
                  address_line3: z.string().describe('Address line 3').optional(),
                  address_line4: z.string().describe('Address line 4').optional(),
                  address_line5: z.string().describe('Address line 5').optional(),
                  address_line6: z.string().describe('Address line 6').optional(),
                  address_line7: z.string().describe('Address line 7').optional(),
                  address_line8: z.string().describe('Address line 8').optional(),
                  address_line9: z.string().describe('Address line 9').optional(),
                  local_address_line1: z.string().describe('Address line 1 (non-Latin native script)').optional(),
                  local_address_line2: z.string().describe('Address line 2 (non-Latin native scripts)').optional(),
                  local_address_line3: z.string().describe('Address line 3 (non-Latin native scripts)').optional(),
                  local_address_line4: z.string().describe('Address line 4 (non-Latin native scripts)').optional(),
                  local_address_line5: z.string().describe('Address line 5 (non-Latin native script)').optional(),
                  local_address_line6: z.string().describe('Address line 6 (non-Latin native scripts)').optional(),
                  local_address_line7: z.string().describe('Address line 7 (non-Latin native script)').optional(),
                  local_address_line8: z.string().describe('Address line 8 (non-Latin native script)').optional(),
                  local_address_line9: z.string().describe('Address line 9 (non-Latin native script)').optional(),
                  postal_code: z.string().describe('Postal Code').optional(),
                  custom_fields: z
                    .array(
                      z.object({
                        custom_api_name: z
                          .string()
                          .describe('Custom field apiname, which is the unique identifier of the custom field'),
                        value: z
                          .string()
                          .describe(
                            'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                          ),
                      }),
                    )
                    .describe('Custom Fields')
                    .optional(),
                })
                .describe('Contact address')
                .optional(),
              birth_certificate_of_child: z
                .array(z.object({ id: z.string().describe('Upload file ID').optional() }))
                .describe('Birth certificate')
                .optional(),
            }),
          )
          .describe('List of family members')
          .optional(),
        emergency_contact_list: z
          .array(
            z.object({
              name: z
                .object({
                  local_primary: z.string().describe('Last Name - Local Text').optional(),
                  local_first_name: z.string().describe('First Name - Local Text').optional(),
                  country_region_id: z.string().describe('Country/Region'),
                  name_type: z.object({ enum_name: z.string().describe('enumeration value') }).describe('Name type'),
                  local_first_name_2: z.string().describe('First Name - Second Local Text').optional(),
                  local_primary_2: z.string().describe('Last Name - Second Local Character').optional(),
                  additional_name_type: z
                    .object({ enum_name: z.string().describe('enumeration value') })
                    .describe('Supplementary Name Type')
                    .optional(),
                  first_name: z.string().describe('name').optional(),
                  full_name: z.string().describe('full name').optional(),
                  hereditary: z.string().describe('surname').optional(),
                  custom_name: z
                    .string()
                    .describe(
                      'Custom name (when not passed in, the name will be spliced together according to the rules of the country/region to which it belongs)',
                    )
                    .optional(),
                  custom_local_name: z
                    .string()
                    .describe(
                      'Custom name of local text (when not passed in, the name of the local text will be spliced with the relevant last name and first name field of the local text by default according to the rules of the country/region to which it belongs)',
                    )
                    .optional(),
                  middle_name: z.string().describe('middle name').optional(),
                  name_primary: z.string().describe('surname').optional(),
                  secondary: z.string().describe('Second surname').optional(),
                  social: z
                    .object({ enum_name: z.string().describe('enumeration value') })
                    .describe('honorific title')
                    .optional(),
                  tertiary: z.string().describe('Married name').optional(),
                  title: z
                    .object({ enum_name: z.string().describe('enumeration value') })
                    .describe('title')
                    .optional(),
                  local_middle_name: z.string().describe('Local middle name').optional(),
                  local_secondary: z.string().describe('Second Last Name - Local Text').optional(),
                })
                .describe('name')
                .optional(),
              relationship: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('relationship')
                .optional(),
              phone_ist: z
                .array(
                  z.object({
                    international_area_code: z
                      .object({ enum_name: z.string().describe('enumeration value') })
                      .describe('Country code')
                      .optional(),
                    phone_number: z.string().describe('Phone number'),
                  }),
                )
                .describe('Telephone')
                .optional(),
              legal_name: z.string().describe('Legal name').optional(),
            }),
          )
          .describe('Emergency Contact List')
          .optional(),
        date_entered_workforce: z.string().describe('Date of participation in work').optional(),
        profile_image_id: z.string().describe('ID of the profile photo resource').optional(),
        personal_profile: z
          .array(
            z.object({
              personal_profile_type: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('Data Type')
                .optional(),
              files: z
                .array(z.object({ id: z.string().describe('Upload file ID').optional() }))
                .describe('Upload file list')
                .optional(),
            }),
          )
          .describe('Personal data attachment')
          .optional(),
        native_region: z.string().describe('Nationality ID').optional(),
        hukou_type: z
          .object({ enum_name: z.string().describe('enumeration value') })
          .describe('Account type')
          .optional(),
        hukou_location: z.string().describe('hukou location').optional(),
        political_affiliations: z
          .array(z.object({ enum_name: z.string().describe('enumeration value') }))
          .describe(
            'Political affiliation, enumeration values can be obtained from the document [Feishu personnel enumeration constant] Political affiliation (political_affiliation) enumeration definition section',
          )
          .optional(),
        talent_id: z.string().describe('Talent ID').optional(),
        custom_fields: z
          .array(
            z.object({
              custom_api_name: z
                .string()
                .describe('Custom field apiname, which is the unique identifier of the custom field'),
              value: z
                .string()
                .describe(
                  'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                ),
            }),
          )
          .describe('Custom Fields')
          .optional(),
        born_country_region: z.string().describe('Country of birth').optional(),
        is_disabled: z.boolean().describe('Is it disabled?').optional(),
        disable_card_number: z.string().describe('Disability certificate number').optional(),
        is_martyr_family: z.boolean().describe('Is it martyred?').optional(),
        martyr_card_number: z.string().describe("Martyr's certificate number").optional(),
        is_old_alone: z.boolean().describe('Is it lonely?').optional(),
        resident_taxes: z
          .array(
            z.object({
              year_resident_tax: z.string().describe('annual'),
              resident_status: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe(
                  '- | Resident identity, enumeration value api_name can be queried through the [Get Field Details] interface, the query parameters are as follows: - object_api_name = "resident_tax" - custom_api_name = "resident_status"',
                )
                .optional(),
              tax_country_region_id: z
                .string()
                .describe('Country/region, you can check through the [Query Country/Region Information] interface')
                .optional(),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the string escaped by json, and the field format is different according to the metadata definition (123, 123.23, true, [\\ "id1\\",\\ "id2\\], 2006-01-02 15:04:05])',
                      ),
                  }),
                )
                .describe('custom field')
                .optional(),
            }),
          )
          .describe('Resident identity information')
          .optional(),
        first_entry_time: z.string().describe('First entry date').optional(),
        leave_time: z.string().describe('Estimated departure date').optional(),
      })
      .optional(),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Determine whether it is the same request according to whether the client_token are consistent')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2PersonPatch = {
  project: 'corehr',
  name: 'corehr.v2.person.patch',
  sdkName: 'corehr.v2.person.patch',
  path: '/open-apis/corehr/v2/persons/:person_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Personal information-update person information-Update personal information',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        name_list: z
          .array(
            z.object({
              local_primary: z.string().describe('Last Name - Local Text').optional(),
              local_first_name: z.string().describe('First Name - Local Text').optional(),
              country_region_id: z.string().describe('Country/Region'),
              name_type: z.object({ enum_name: z.string().describe('enumeration value') }).describe('Name type'),
              local_first_name_2: z.string().describe('First Name - Second Local Text').optional(),
              local_primary_2: z.string().describe('Last Name - Second Local Character').optional(),
              additional_name_type: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('Supplementary Name Type')
                .optional(),
              first_name: z.string().describe('name').optional(),
              full_name: z.string().describe('full name').optional(),
              hereditary: z.string().describe('surname').optional(),
              custom_name: z
                .string()
                .describe(
                  'Custom name (when not passed in, the name will be spliced together according to the rules of the country/region to which it belongs)',
                )
                .optional(),
              custom_local_name: z
                .string()
                .describe(
                  'Custom name of local text (when not passed in, the name of the local text will be spliced with the relevant last name and first name field of the local text by default according to the rules of the country/region to which it belongs)',
                )
                .optional(),
              middle_name: z.string().describe('middle name').optional(),
              name_primary: z.string().describe('surname').optional(),
              secondary: z.string().describe('Second surname').optional(),
              social: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('honorific title')
                .optional(),
              tertiary: z.string().describe('Married name').optional(),
              title: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('title')
                .optional(),
              local_middle_name: z.string().describe('Local middle name').optional(),
              local_secondary: z.string().describe('Second Last Name - Local Text').optional(),
            }),
          )
          .describe('Name list')
          .optional(),
        gender: z
          .object({ enum_name: z.string().describe('enumeration value') })
          .describe(
            'Gender, enumeration values are available through the document [Feishu Personnel Enumeration Constants] Gender (gender) enumeration definition section',
          )
          .optional(),
        date_of_birth: z.string().describe('Date of Birth').optional(),
        nationality_id_v2: z.string().describe('nationality_id_v2').optional(),
        race: z
          .object({ enum_name: z.string().describe('enumeration value') })
          .describe(
            'Ethnicity/race, enumeration values are available through the documentation [Feishu Personnel Enumeration Constants] Ethnicity (race) enumeration definition section',
          )
          .optional(),
        marital_status: z
          .object({ enum_name: z.string().describe('enumeration value') })
          .describe(
            'Marital status, enumeration values are available in the Marital Status (marital_status) enumeration definition section of the document [Feishu Personnel enumeration constants]',
          )
          .optional(),
        phone_list: z
          .array(
            z.object({
              international_area_code: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('Country code')
                .optional(),
              phone_number: z.string().describe('Phone number'),
            }),
          )
          .describe('Phone list')
          .optional(),
        address_list: z
          .array(
            z.object({
              address_id: z.string().describe('Address ID').optional(),
              country_region_id: z.string().describe('Country/Region'),
              region_id: z.string().describe('Main administrative region').optional(),
              address_line1: z.string().describe('city_id_v2').optional(),
              address_line2: z.string().describe('district_id_v2').optional(),
              address_line3: z.string().describe('Address line 3').optional(),
              address_line4: z.string().describe('Address line 4').optional(),
              address_line5: z.string().describe('Address line 5').optional(),
              address_line6: z.string().describe('Address line 6').optional(),
              address_line7: z.string().describe('Address line 7').optional(),
              address_line8: z.string().describe('Address line 8').optional(),
              address_line9: z.string().describe('Address line 9').optional(),
              local_address_line1: z.string().describe('Address line 1 (non-Latin native script)').optional(),
              local_address_line2: z.string().describe('Address line 2 (non-Latin native scripts)').optional(),
              local_address_line3: z.string().describe('Address line 3 (non-Latin native scripts)').optional(),
              local_address_line4: z.string().describe('Address line 4 (non-Latin native scripts)').optional(),
              local_address_line5: z.string().describe('Address line 5 (non-Latin native script)').optional(),
              local_address_line6: z.string().describe('Address line 6 (non-Latin native scripts)').optional(),
              local_address_line7: z.string().describe('Address line 7 (non-Latin native script)').optional(),
              local_address_line8: z.string().describe('Address line 8 (non-Latin native script)').optional(),
              local_address_line9: z.string().describe('Address line 9 (non-Latin native script)').optional(),
              postal_code: z.string().describe('Postal Code').optional(),
              address_type_list: z
                .array(z.object({ enum_name: z.string().describe('enumeration value') }))
                .describe('Address type'),
              is_primary: z.boolean().describe('Main address'),
              is_public: z.boolean().describe('public address'),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
            }),
          )
          .describe('Address list')
          .optional(),
        email_list: z
          .array(
            z.object({
              email: z.string().describe('Email address'),
              is_primary: z.boolean().describe('Is it the main mailbox?').optional(),
              is_public: z.boolean().describe('Is it a public email address?').optional(),
              email_usage: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe(
                  'Mailbox purpose, the enumeration value can be obtained through the document [Feishu personnel enumeration constant] Mailbox purpose (email_usage) enumeration definition',
                )
                .optional(),
            }),
          )
          .describe('Mailbox list')
          .optional(),
        work_experience_list: z
          .array(
            z.object({
              company_organization: z
                .array(z.object({ lang: z.string().describe('language'), value: z.string().describe('content') }))
                .describe('Company/Organization')
                .optional(),
              department: z
                .array(z.object({ lang: z.string().describe('language'), value: z.string().describe('content') }))
                .describe('department')
                .optional(),
              job: z
                .array(z.object({ lang: z.string().describe('language'), value: z.string().describe('content') }))
                .describe('post')
                .optional(),
              description: z
                .array(z.object({ lang: z.string().describe('language'), value: z.string().describe('content') }))
                .describe('Job Description')
                .optional(),
              start_date: z.string().describe('Start Date').optional(),
              end_date: z.string().describe('End date').optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
            }),
          )
          .describe('List of work experience')
          .optional(),
        education_list: z
          .array(
            z.object({
              school: z
                .array(z.object({ lang: z.string().describe('language'), value: z.string().describe('content') }))
                .describe('school'),
              level_of_education: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('Education')
                .optional(),
              start_date: z.string().describe('Start Date').optional(),
              end_date: z.string().describe('End date').optional(),
              field_of_study: z
                .array(z.object({ lang: z.string().describe('language'), value: z.string().describe('content') }))
                .describe('professional')
                .optional(),
              degree: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('degree')
                .optional(),
              school_name: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('School name')
                .optional(),
              field_of_study_name: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('Professional name')
                .optional(),
              country_region_id: z.string().describe('Country ID').optional(),
              expected_end_date: z.string().describe('Expected end date').optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
            }),
          )
          .describe('List of educational experiences')
          .optional(),
        bank_account_list: z
          .array(
            z.object({
              bank_name: z.string().describe('Bank name').optional(),
              bank_account_number: z.string().describe('Bank account number'),
              account_holder: z.string().describe('Account holder name'),
              branch_name: z.string().describe('Branch name').optional(),
              bank_id_v2: z
                .string()
                .describe(
                  'Bank ID, detailed information can be obtained through the [Query Bank Information] interface',
                )
                .optional(),
              branch_id_v2: z
                .string()
                .describe(
                  'Sub-branch ID, which must be filled in as the sub-branch of the bank. Detailed information can be obtained through the [Query Sub-branch Information] interface query',
                )
                .optional(),
              country_region_id: z
                .string()
                .describe(
                  'Country/region ID, detailed information can be obtained through the [Query Country/Region Information] interface query',
                )
                .optional(),
              bank_account_usage: z
                .array(z.object({ enum_name: z.string().describe('enumeration value') }))
                .describe(
                  'Bank card usage, the enumeration value can be obtained from the Bank Account Usage enumeration definition section of the document [Feishu Personnel Enumeration Constants]',
                )
                .optional(),
              bank_account_type: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe(
                  'Bank card type, the enumeration value can be obtained from the Bank Account Type enumeration definition section of the document [Feishu Personnel Enumeration Constants]',
                )
                .optional(),
              currency_id: z.string().describe('Currency ID').optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
            }),
          )
          .describe('bank account')
          .optional(),
        national_id_list: z
          .array(
            z.object({
              national_id_type_id: z.string().describe('National document type'),
              national_id_number: z.string().describe('ID number'),
              issue_date: z.string().describe('Document issue date').optional(),
              expiration_date: z.string().describe('Document expiration date').optional(),
              country_region_id: z.string().describe('Country/Region'),
              issued_by: z.string().describe('Document issuing agency').optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
            }),
          )
          .describe('certificate')
          .optional(),
        dependent_list: z
          .array(
            z.object({
              relationship: z.object({ enum_name: z.string().describe('enumeration value') }).describe('relationship'),
              gender: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('Gender')
                .optional(),
              date_of_birth: z.string().describe('birthday').optional(),
              nationality_id_v2: z
                .string()
                .describe('Nationality ID, which can be queried through the [Query Nationality Information] interface')
                .optional(),
              national_id_list: z
                .array(
                  z.object({
                    national_id_type_id: z.string().describe('National document type'),
                    national_id_number: z.string().describe('ID number'),
                    issue_date: z.string().describe('Document issue date').optional(),
                    expiration_date: z.string().describe('Document expiration date').optional(),
                    country_region_id: z.string().describe('Country/Region'),
                    issued_by: z.string().describe('Document issuing agency').optional(),
                    custom_fields: z
                      .array(
                        z.object({
                          custom_api_name: z
                            .string()
                            .describe('Custom field apiname, which is the unique identifier of the custom field'),
                          value: z
                            .string()
                            .describe(
                              'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                            ),
                        }),
                      )
                      .describe('Custom Fields')
                      .optional(),
                  }),
                )
                .describe('ID number')
                .optional(),
              spouses_working_status: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe("Spouse's work status")
                .optional(),
              is_this_person_covered_by_health_insurance: z
                .boolean()
                .describe('Family medical insurance included')
                .optional(),
              is_this_person_allowed_for_tax_deduction: z
                .boolean()
                .describe('Allow dependents to deduct tax')
                .optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe('Custom field apiname, which is the unique identifier of the custom field'),
                    value: z
                      .string()
                      .describe(
                        'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
              dependent_name: z.string().describe('Family member name').optional(),
              employer: z.string().describe('work unit').optional(),
              job: z.string().describe('post').optional(),
              phone: z
                .object({
                  international_area_code: z
                    .object({ enum_name: z.string().describe('enumeration value') })
                    .describe('Country code')
                    .optional(),
                  phone_number: z.string().describe('Phone number'),
                })
                .describe('Telephone')
                .optional(),
              address: z
                .object({
                  address_id: z.string().describe('Address ID').optional(),
                  country_region_id: z.string().describe('Country/Region'),
                  region_id: z.string().describe('Main administrative region').optional(),
                  address_line1: z.string().describe('city_id_v2').optional(),
                  address_line2: z.string().describe('district_id_v2').optional(),
                  address_line3: z.string().describe('Address line 3').optional(),
                  address_line4: z.string().describe('Address line 4').optional(),
                  address_line5: z.string().describe('Address line 5').optional(),
                  address_line6: z.string().describe('Address line 6').optional(),
                  address_line7: z.string().describe('Address line 7').optional(),
                  address_line8: z.string().describe('Address line 8').optional(),
                  address_line9: z.string().describe('Address line 9').optional(),
                  local_address_line1: z.string().describe('Address line 1 (non-Latin native script)').optional(),
                  local_address_line2: z.string().describe('Address line 2 (non-Latin native scripts)').optional(),
                  local_address_line3: z.string().describe('Address line 3 (non-Latin native scripts)').optional(),
                  local_address_line4: z.string().describe('Address line 4 (non-Latin native scripts)').optional(),
                  local_address_line5: z.string().describe('Address line 5 (non-Latin native script)').optional(),
                  local_address_line6: z.string().describe('Address line 6 (non-Latin native scripts)').optional(),
                  local_address_line7: z.string().describe('Address line 7 (non-Latin native script)').optional(),
                  local_address_line8: z.string().describe('Address line 8 (non-Latin native script)').optional(),
                  local_address_line9: z.string().describe('Address line 9 (non-Latin native script)').optional(),
                  postal_code: z.string().describe('Postal Code').optional(),
                  custom_fields: z
                    .array(
                      z.object({
                        custom_api_name: z
                          .string()
                          .describe('Custom field apiname, which is the unique identifier of the custom field'),
                        value: z
                          .string()
                          .describe(
                            'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                          ),
                      }),
                    )
                    .describe('Custom Fields')
                    .optional(),
                })
                .describe('Contact address')
                .optional(),
              birth_certificate_of_child: z
                .array(z.object({ id: z.string().describe('Upload file ID').optional() }))
                .describe('Birth certificate')
                .optional(),
            }),
          )
          .describe('List of family members')
          .optional(),
        emergency_contact_list: z
          .array(
            z.object({
              name: z
                .object({
                  local_primary: z.string().describe('Last Name - Local Text').optional(),
                  local_first_name: z.string().describe('First Name - Local Text').optional(),
                  country_region_id: z.string().describe('Country/Region'),
                  name_type: z.object({ enum_name: z.string().describe('enumeration value') }).describe('Name type'),
                  local_first_name_2: z.string().describe('First Name - Second Local Text').optional(),
                  local_primary_2: z.string().describe('Last Name - Second Local Character').optional(),
                  additional_name_type: z
                    .object({ enum_name: z.string().describe('enumeration value') })
                    .describe('Supplementary Name Type')
                    .optional(),
                  first_name: z.string().describe('name').optional(),
                  full_name: z.string().describe('full name').optional(),
                  hereditary: z.string().describe('surname').optional(),
                  custom_name: z
                    .string()
                    .describe(
                      'Custom name (when not passed in, the name will be spliced together according to the rules of the country/region to which it belongs)',
                    )
                    .optional(),
                  custom_local_name: z
                    .string()
                    .describe(
                      'Custom name of local text (when not passed in, the name of the local text will be spliced with the relevant last name and first name field of the local text by default according to the rules of the country/region to which it belongs)',
                    )
                    .optional(),
                  middle_name: z.string().describe('middle name').optional(),
                  name_primary: z.string().describe('surname').optional(),
                  secondary: z.string().describe('Second surname').optional(),
                  social: z
                    .object({ enum_name: z.string().describe('enumeration value') })
                    .describe('honorific title')
                    .optional(),
                  tertiary: z.string().describe('Married name').optional(),
                  title: z
                    .object({ enum_name: z.string().describe('enumeration value') })
                    .describe('title')
                    .optional(),
                  local_middle_name: z.string().describe('Local middle name').optional(),
                  local_secondary: z.string().describe('Second Last Name - Local Text').optional(),
                })
                .describe('name')
                .optional(),
              relationship: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('relationship')
                .optional(),
              phone_ist: z
                .array(
                  z.object({
                    international_area_code: z
                      .object({ enum_name: z.string().describe('enumeration value') })
                      .describe('Country code')
                      .optional(),
                    phone_number: z.string().describe('Phone number'),
                  }),
                )
                .describe('Telephone')
                .optional(),
              legal_name: z.string().describe('Legal name').optional(),
            }),
          )
          .describe('Emergency Contact List')
          .optional(),
        date_entered_workforce: z.string().describe('Date of participation in work').optional(),
        profile_image_id: z.string().describe('ID of the profile photo resource').optional(),
        personal_profile: z
          .array(
            z.object({
              personal_profile_type: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe('Data Type')
                .optional(),
              files: z
                .array(z.object({ id: z.string().describe('Upload file ID').optional() }))
                .describe('Upload file list')
                .optional(),
            }),
          )
          .describe('Personal data attachment')
          .optional(),
        native_region: z.string().describe('Nationality ID').optional(),
        hukou_type: z
          .object({ enum_name: z.string().describe('enumeration value') })
          .describe(
            'Account type, the enumeration value can be obtained from the document [Feishu personnel enumeration constants] Account type (hukou_type) enumeration definition section',
          )
          .optional(),
        hukou_location: z.string().describe('hukou location').optional(),
        political_affiliations: z
          .array(z.object({ enum_name: z.string().describe('enumeration value') }))
          .describe(
            'Political outlook, enumeration values can be obtained from the document [Feishu personnel enumeration constant] Political outlook (political_affiliation) enumeration definition section',
          )
          .optional(),
        talent_id: z.string().describe('Talent ID').optional(),
        custom_fields: z
          .array(
            z.object({
              custom_api_name: z
                .string()
                .describe('Custom field apiname, which is the unique identifier of the custom field'),
              value: z
                .string()
                .describe(
                  'The field value is a string escaped by json. According to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")',
                ),
            }),
          )
          .describe('Custom Fields')
          .optional(),
        born_country_region: z.string().describe('Country of birth').optional(),
        is_disabled: z.boolean().describe('Is it disabled?').optional(),
        disable_card_number: z.string().describe('Disability certificate number').optional(),
        is_martyr_family: z.boolean().describe('Is it martyred?').optional(),
        martyr_card_number: z.string().describe("Martyr's certificate number").optional(),
        is_old_alone: z.boolean().describe('Is it lonely?').optional(),
        resident_taxes: z
          .array(
            z.object({
              year_resident_tax: z.string().describe('annual'),
              resident_status: z
                .object({ enum_name: z.string().describe('enumeration value') })
                .describe(
                  'Resident identity, enumeration value api_name can be queried through the [Get Field Details] interface, the query parameters are as follows: - object_api_name = "resident_tax" - custom_api_name = "resident_status"',
                )
                .optional(),
              tax_country_region_id: z
                .string()
                .describe('Country/region, you can check through the [Query Country/Region Information] interface')
                .optional(),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the string escaped by json, and the field format is different according to the metadata definition (123, 123.23, true, [\\ "id1\\",\\ "id2\\], 2006-01-02 15:04:05])',
                      ),
                  }),
                )
                .describe('custom field')
                .optional(),
            }),
          )
          .describe('Resident identity information')
          .optional(),
        first_entry_time: z.string().describe('First entry date').optional(),
        leave_time: z.string().describe('Estimated departure date').optional(),
      })
      .optional(),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Determine whether it is the same request according to whether the client_token are consistent')
          .optional(),
        no_need_query: z
          .boolean()
          .describe(
            'The variable "no_need_query" can be utilized to determine whether the updated personal information is returned after the update action. In case the value is "true", only the update result information will be provided',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({
        person_id: z
          .string()
          .describe(
            'Person ID. The ID can be obtained from the response body (person_id) when creating personal information. In addition, you can also call the [Search Employee Information] interface to obtain the specified employee person_id',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2PreHireComplete = {
  project: 'corehr',
  name: 'corehr.v2.preHire.complete',
  sdkName: 'corehr.v2.preHire.complete',
  path: '/open-apis/corehr/v2/pre_hires/:pre_hire_id/complete',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Pre hire-Hire employee-Operate the employees to be hired to complete the induction, and officially enter the job to establish an employment relationship',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      pre_hire_id: z.string().describe('The pending job ID can be obtained from the [pending job list] interface'),
    }),
  },
};
export const corehrV2PreHireCreate = {
  project: 'corehr',
  name: 'corehr.v2.preHire.create',
  sdkName: 'corehr.v2.preHire.create',
  path: '/open-apis/corehr/v2/pre_hires',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Feishu People（Enterprise Edition）-Pre hire-Create pending staff-Create pending staff',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      basic_info: z
        .object({
          name: z
            .object({
              full_name: z.string().describe('Full name').optional(),
              first_name: z.string().describe('Name').optional(),
              middle_name: z.string().describe('Middle name').optional(),
              name_primary: z.string().describe('Last name').optional(),
              local_first_name: z.string().describe('Name - Local Text').optional(),
              local_middle_name: z.string().describe('Local middle name').optional(),
              local_primary: z.string().describe('Last Name - Local Text').optional(),
              country_region_id: z.string().describe('Country/Region').optional(),
              custom_local_name: z.string().describe('Custom name for local text').optional(),
              custom_western_name: z.string().describe('Custom names for Western characters').optional(),
              additional_name: z.string().describe('alias').optional(),
            })
            .describe('Description')
            .optional(),
          phone_number: z.string().describe('Mobile phone number').optional(),
          international_area_code: z
            .string()
            .describe(
              'Area code，the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: phone- custom_api_name: international_area_code',
            )
            .optional(),
          email: z.string().describe('Personal mailbox').optional(),
          date_of_birth: z.string().describe('Birthday').optional(),
          personal_id_number: z.string().describe('Document number').optional(),
          personal_id_type: z.string().describe('ID type').optional(),
          date_entered_workforce: z.string().describe('Date of participation in work').optional(),
          gender_id: z.string().describe('Gender').optional(),
          nationality_v2_id: z.string().describe('Nationality (new)').optional(),
          additional_nationality_id_list: z.array(z.string()).describe('Other Nationalities').optional(),
          citizenship_status_id_list: z.array(z.string()).describe('citizenship').optional(),
          home_address: z.string().describe('Home address').optional(),
          worker_id: z.string().describe('Staff number').optional(),
          user_geo: z.string().describe('data residency').optional(),
          legal_name: z
            .object({
              full_name: z.string().describe('full name').optional(),
              first_name: z.string().describe('name').optional(),
              middle_name: z.string().describe('middle name').optional(),
              name_primary: z.string().describe('surname').optional(),
              local_first_name: z.string().describe('Name - Local Text').optional(),
              local_middle_name: z.string().describe('local middle name').optional(),
              local_primary: z.string().describe('Last Name - Local Text').optional(),
              country_region_id: z.string().describe('Country/Region').optional(),
              custom_local_name: z.string().describe('Custom name for local text').optional(),
              custom_western_name: z.string().describe('Custom names for Western characters').optional(),
              additional_name: z.string().describe('alias').optional(),
            })
            .describe('legal name')
            .optional(),
          additional_name: z
            .object({
              full_name: z.string().describe('full name').optional(),
              first_name: z.string().describe('name').optional(),
              middle_name: z.string().describe('middle name').optional(),
              name_primary: z.string().describe('surname').optional(),
              local_first_name: z.string().describe('Name - Local Text').optional(),
              local_middle_name: z.string().describe('local middle name').optional(),
              local_primary: z.string().describe('Last Name - Local Text').optional(),
              country_region_id: z.string().describe('Country/Region').optional(),
              custom_local_name: z.string().describe('Custom name for local text').optional(),
              custom_western_name: z.string().describe('Custom names for Western characters').optional(),
              additional_name: z.string().describe('alias').optional(),
            })
            .describe('alias')
            .optional(),
          resident_tax_list: z
            .array(
              z.object({
                tax_country_region: z.string().describe('Country ID').optional(),
                resident_status: z.string().describe('residency').optional(),
                tax_address: z
                  .object({
                    country_region_id: z.string().describe('Country/Region'),
                    region_id: z.string().describe('main administrative region').optional(),
                    local_address_line1: z.string().describe('Address line 1 (non-Latin native scripts)').optional(),
                    local_address_line2: z.string().describe('Address line 2 (non-Latin native scripts)').optional(),
                    local_address_line3: z.string().describe('Address line 3 (non-Latin native scripts)').optional(),
                    local_address_line4: z.string().describe('Address line 4 (non-Latin native scripts)').optional(),
                    local_address_line5: z.string().describe('Address line 5 (non-Latin native scripts)').optional(),
                    local_address_line6: z.string().describe('Address line 6 (non-Latin native scripts)').optional(),
                    local_address_line7: z.string().describe('Address line 7 (non-Latin native scripts)').optional(),
                    local_address_line8: z.string().describe('Address line 8 (non-Latin native scripts)').optional(),
                    local_address_line9: z.string().describe('Address line 9 (non-Latin native scripts)').optional(),
                    postal_code: z.string().describe('Postal code').optional(),
                    address_types: z
                      .array(z.string())
                      .describe(
                        'Address type, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: address- custom_api_name: address_type',
                      ),
                    is_primary: z.boolean().describe('main address'),
                    is_public: z.boolean().describe('public address'),
                    city_id_v2: z
                      .string()
                      .describe(
                        'City, you can get details through the interface [Query city information] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/corehr-v2/basic_info -city/search)',
                      )
                      .optional(),
                    district_id_v2: z
                      .string()
                      .describe(
                        'District/county, you can get details through the interface [Query District/County Information] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/corehr-v2/basic_info -district/search)',
                      )
                      .optional(),
                  })
                  .describe('Tax address')
                  .optional(),
                resident_status_specification: z.string().describe('resident status specification').optional(),
                year_resident_tax: z.string().describe('year resident tax').optional(),
                custom_fields: z
                  .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                  .describe('custom fields')
                  .optional(),
              }),
            )
            .describe('Tax identification information')
            .optional(),
          born_country_region: z
            .string()
            .describe(
              'The country/region of birth, It can be obtained through the [Query Country/Region Information] interface',
            )
            .optional(),
          is_disabled: z.boolean().describe('Disabled or not').optional(),
          disable_card_number: z.string().describe('Disability ID number').optional(),
          is_old_alone: z.boolean().describe('is old alone').optional(),
          is_martyr_family: z.boolean().describe('is martyr family').optional(),
          martyr_card_number: z.string().describe('martyr card number').optional(),
          dependent_list: z
            .array(
              z.object({
                relationship: z
                  .string()
                  .describe(
                    'relationship, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: dependent- custom_api_name: relationship_with_dependent',
                  ),
                gender: z
                  .string()
                  .describe(
                    'gender, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: person- custom_api_name: gender',
                  )
                  .optional(),
                date_of_birth: z.string().describe('date of birth').optional(),
                national_ids: z
                  .array(
                    z.object({
                      country_region_id: z
                        .string()
                        .describe(
                          'country_region, It can be obtained through the [Query Country/Region Information] interface',
                        ),
                      national_id_type_id: z
                        .string()
                        .describe(
                          'national id type id, It can be obtained through the [Get the list of national ID type] interface',
                        ),
                      national_id_number: z.string().describe('national id number'),
                      issue_date: z.string().describe('issue date').optional(),
                      expiration_date: z.string().describe('expiration date').optional(),
                      issued_by: z.string().describe('issued by').optional(),
                      custom_fields: z
                        .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                        .describe('custom fields')
                        .optional(),
                    }),
                  )
                  .describe('national ids')
                  .optional(),
                spouses_working_status: z
                  .string()
                  .describe(
                    'spouses working status, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: dependent- custom_api_name: spouses_working_status',
                  )
                  .optional(),
                is_this_person_covered_by_health_insurance: z
                  .boolean()
                  .describe('Includes family medical insurance')
                  .optional(),
                is_this_person_allowed_for_tax_deduction: z
                  .boolean()
                  .describe('Allow dependents to deduct taxes')
                  .optional(),
                dependent_name: z.string().describe('family member name').optional(),
                employer: z.string().describe('employer').optional(),
                job: z.string().describe('job').optional(),
                phone: z
                  .object({
                    international_area_code: z
                      .string()
                      .describe(
                        'Area code, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: phone- custom_api_name: international_area_code',
                      ),
                    phone_number: z.string().describe('phone number'),
                    device_type: z
                      .string()
                      .describe(
                        'device type, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: phone- custom_api_name: device_type',
                      ),
                    phone_usage: z
                      .string()
                      .describe(
                        'phone usage, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: phone- custom_api_name: phone_usage',
                      ),
                    is_primary: z
                      .boolean()
                      .describe(
                        'Primary phone number. If there are multiple phones, only one phone\'s "is_primary" can be true',
                      ),
                    is_public: z.boolean().describe('is public'),
                  })
                  .describe('phone')
                  .optional(),
                address: z
                  .object({
                    country_region_id: z
                      .string()
                      .describe(
                        'country region id, It can be obtained through the [Query Country/Region Information] interface',
                      ),
                    region_id: z
                      .string()
                      .describe(
                        'region id, It can be obtained through the [Search province/administrative region information] interface',
                      )
                      .optional(),
                    local_address_line1: z.string().describe('Address line 1 (non-Latin native scripts)').optional(),
                    local_address_line2: z.string().describe('Address line 2 (non-Latin native scripts)').optional(),
                    local_address_line3: z.string().describe('Address line 3 (non-Latin native scripts)').optional(),
                    local_address_line4: z.string().describe('Address line 4 (non-Latin native scripts)').optional(),
                    local_address_line5: z.string().describe('Address line 5 (non-Latin native scripts)').optional(),
                    local_address_line6: z.string().describe('Address line 6 (non-Latin native scripts)').optional(),
                    local_address_line7: z.string().describe('Address line 7 (non-Latin native scripts)').optional(),
                    local_address_line8: z.string().describe('Address line 8 (non-Latin native scripts)').optional(),
                    local_address_line9: z.string().describe('Address line 9 (non-Latin native scripts)').optional(),
                    postal_code: z.string().describe('Postal code').optional(),
                    address_types: z
                      .array(z.string())
                      .describe(
                        'address type, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: address- custom_api_name: address_type',
                      ),
                    is_primary: z.boolean().describe('main address'),
                    is_public: z.boolean().describe('public address'),
                    city_id_v2: z
                      .string()
                      .describe(
                        'City, you can get details through the interface [Query city information] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/corehr-v2/basic_info -city/search)',
                      )
                      .optional(),
                    district_id_v2: z
                      .string()
                      .describe(
                        'District/county, you can get details through the interface [Query District/County Information] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/corehr-v2/basic_info -district/search)',
                      )
                      .optional(),
                  })
                  .describe('address')
                  .optional(),
                custom_fields: z
                  .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                  .describe('-')
                  .optional(),
              }),
            )
            .describe('dependent list')
            .optional(),
          religion: z
            .string()
            .describe(
              'religion, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: person- custom_api_name: religion',
            )
            .optional(),
          bank_account_list: z
            .array(
              z.object({
                bank_name: z
                  .string()
                  .describe(
                    'Bank name:- When bank_id is filled in, the name of the bank is automatically filled in- If bank_id is not filled in, the incoming bank name is taken',
                  )
                  .optional(),
                branch_name: z
                  .string()
                  .describe('Branch name, this field only needs to be filled in when the branch is entered manually')
                  .optional(),
                bank_account_number: z.string().describe('Bank account number'),
                account_holder: z.string().describe('Account holder'),
                country_region_id: z
                  .string()
                  .describe(
                    'Country region id, It can be obtained through the [Query Country/Region Information] interface',
                  )
                  .optional(),
                bank_account_usages: z
                  .array(z.string())
                  .describe(
                    'Bank account usage, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: bank_account- custom_api_name: bank_account_usage',
                  )
                  .optional(),
                bank_account_type: z
                  .string()
                  .describe(
                    'Bank account type, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: bank_account- custom_api_name: bank_account_type',
                  )
                  .optional(),
                custom_fields: z
                  .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                  .describe('-')
                  .optional(),
              }),
            )
            .describe('bank account list')
            .optional(),
          national_id_list: z
            .array(
              z.object({
                country_region_id: z
                  .string()
                  .describe(
                    'Country region id, it can be obtained through the [Query Country/Region Information] interface',
                  ),
                national_id_type_id: z
                  .string()
                  .describe(
                    'National id type id, it can be obtained through the [Get the list of national ID type] interface',
                  ),
                national_id_number: z.string().describe('National id number'),
                issue_date: z.string().describe('issue date').optional(),
                expiration_date: z.string().describe('expiration date').optional(),
                issued_by: z.string().describe('issued by').optional(),
                custom_fields: z
                  .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                  .describe('-')
                  .optional(),
              }),
            )
            .describe('National id list')
            .optional(),
          personal_profile_list: z
            .array(
              z.object({
                personal_profile_type: z
                  .string()
                  .describe(
                    'Personal profile type, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: personal_profile- custom_api_name: profile_type',
                  )
                  .optional(),
                files: z
                  .array(
                    z.object({
                      id: z
                        .string()
                        .describe('file id, it can be obtained through the [Upload file] interface')
                        .optional(),
                    }),
                  )
                  .describe('files')
                  .optional(),
              }),
            )
            .describe('personal profile list')
            .optional(),
          emergency_contact_list: z
            .array(
              z.object({
                legal_name: z.string().describe('legal name').optional(),
                relationship: z
                  .string()
                  .describe(
                    'relationship, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: emergency_contact- custom_api_name: relationship',
                  )
                  .optional(),
                phones: z
                  .array(
                    z.object({
                      international_area_code: z
                        .string()
                        .describe(
                          'Area code, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: phone- custom_api_name: international_area_code',
                        ),
                      phone_number: z.string().describe('Phone number'),
                      device_type: z
                        .string()
                        .describe(
                          'Device type, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: phone- custom_api_name: device_type',
                        ),
                      phone_usage: z
                        .string()
                        .describe(
                          'Phone usage, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: phone- custom_api_name: phone_usage',
                        ),
                      is_primary: z
                        .boolean()
                        .describe(
                          'Primary phone number. If there are multiple phones, only one phone\'s "is_primary" can be true',
                        ),
                      is_public: z.boolean().describe('Is Public'),
                    }),
                  )
                  .describe('phone')
                  .optional(),
                address: z
                  .object({
                    country_region_id: z
                      .string()
                      .describe(
                        'Country region id, it can be obtained through the [Query Country/Region Information] interface',
                      ),
                    region_id: z
                      .string()
                      .describe(
                        'Region id, it can be obtained through the [Search province/administrative region information] interface',
                      )
                      .optional(),
                    local_address_line1: z.string().describe('Address line 1 (non-Latin native scripts)').optional(),
                    local_address_line2: z.string().describe('Address line 2 (non-Latin native scripts)').optional(),
                    local_address_line3: z.string().describe('Address line 3 (non-Latin native scripts)').optional(),
                    local_address_line4: z.string().describe('Address line 4 (non-Latin native scripts)').optional(),
                    local_address_line5: z.string().describe('Address line 5 (non-Latin native scripts)').optional(),
                    local_address_line6: z.string().describe('Address line 6 (non-Latin native scripts)').optional(),
                    local_address_line7: z.string().describe('Address line 7 (non-Latin native scripts)').optional(),
                    local_address_line8: z.string().describe('Address line 8 (non-Latin native scripts)').optional(),
                    local_address_line9: z.string().describe('Address line 9 (non-Latin native scripts)').optional(),
                    postal_code: z.string().describe('Postal code').optional(),
                    address_types: z
                      .array(z.string())
                      .describe(
                        'Address type, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: address- custom_api_name: address_type',
                      ),
                    is_primary: z.boolean().describe('Whether primary address'),
                    is_public: z.boolean().describe('Whether public address'),
                    city_id_v2: z
                      .string()
                      .describe(
                        'City, you can get details through the interface [Query city information] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/corehr-v2/basic_info -city/search)',
                      )
                      .optional(),
                    district_id_v2: z
                      .string()
                      .describe(
                        'District/county, you can get details through the interface [Query District/County Information] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/corehr-v2/basic_info -district/search)',
                      )
                      .optional(),
                  })
                  .describe('Address')
                  .optional(),
                email: z
                  .object({
                    email: z.string().describe('Email Address'),
                    is_primary: z
                      .boolean()
                      .describe(
                        'Whether primary email address. If there are multiple mailboxes, only one mailbox can have "is_primary" set to true',
                      ),
                    is_public: z.boolean().describe('Whether public email address'),
                    email_usage: z
                      .string()
                      .describe(
                        'Email usage, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: email- custom_api_name: email_usage',
                      ),
                  })
                  .describe('Email')
                  .optional(),
                is_primary: z
                  .boolean()
                  .describe("Primary contact, if there are multiple contacts, only one contact's is_primary is true")
                  .optional(),
                custom_fields: z
                  .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                  .describe('-')
                  .optional(),
              }),
            )
            .describe('Emergency contact list')
            .optional(),
          address_list: z
            .array(
              z.object({
                country_region_id: z
                  .string()
                  .describe(
                    'Country region id, it can be obtained through the [Query Country/Region Information] interface',
                  ),
                region_id: z
                  .string()
                  .describe(
                    'Region id, it can be obtained through the [Search province/administrative region information] interface',
                  )
                  .optional(),
                local_address_line1: z.string().describe('Address line 1 (non-Latin native scripts)').optional(),
                local_address_line2: z.string().describe('Address line 2 (non-Latin native scripts)').optional(),
                local_address_line3: z.string().describe('Address line 3 (non-Latin native scripts)').optional(),
                local_address_line4: z.string().describe('Address line 4 (non-Latin native scripts)').optional(),
                local_address_line5: z.string().describe('Address line 5 (non-Latin native scripts)').optional(),
                local_address_line6: z.string().describe('Address line 6 (non-Latin native scripts)').optional(),
                local_address_line7: z.string().describe('Address line 7 (non-Latin native scripts)').optional(),
                local_address_line8: z.string().describe('Address line 8 (non-Latin native scripts)').optional(),
                local_address_line9: z.string().describe('Address line 9 (non-Latin native scripts)').optional(),
                postal_code: z.string().describe('Postal code').optional(),
                address_types: z
                  .array(z.string())
                  .describe(
                    'Address type, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: address- custom_api_name: address_type',
                  ),
                is_primary: z.boolean().describe('Whether primary address'),
                is_public: z.boolean().describe('Whether public address'),
                city_id_v2: z
                  .string()
                  .describe(
                    'City, you can get details through the interface [Query city information] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/corehr-v2/basic_info -city/search)',
                  )
                  .optional(),
                district_id_v2: z
                  .string()
                  .describe(
                    'District/county, you can get details through the interface [Query District/County Information] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/corehr-v2/basic_info -district/search)',
                  )
                  .optional(),
              }),
            )
            .describe('Address list')
            .optional(),
          marital_status: z
            .string()
            .describe(
              'Marital status, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: person- custom_api_name: marital_status',
            )
            .optional(),
          ethnicity_race: z
            .string()
            .describe(
              'Ethnicity race, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: person- custom_api_name: ethnicity_race',
            )
            .optional(),
          native_region: z
            .string()
            .describe(
              'Native region, it can be obtained through the [Search province/administrative region information] interface',
            )
            .optional(),
          hukou_type: z
            .string()
            .describe(
              'Hukou type, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: person_info_chn- custom_api_name: hukou_type',
            )
            .optional(),
          hukou_location: z.string().describe('Hukou location').optional(),
          custom_fields: z
            .array(
              z.object({
                field_name: z.string().describe('Field name'),
                value: z
                  .string()
                  .describe(
                    'Field value, it is a string after json escape, the field format is different depending on the metadata definition (123, 123.23, true, [\\"id1\\",\\"id2\\], 2006-01-02 15:04:05])',
                  ),
              }),
            )
            .describe('Custom fields')
            .optional(),
          expected_graduate_date: z.string().describe('Expected graduation date').optional(),
        })
        .describe('Personal information'),
      offer_info: z
        .object({
          offer_id: z.string().describe('Offer id').optional(),
          offer_hr_id: z.string().describe('Offer hr id').optional(),
          department_id: z.string().describe('Department id').optional(),
          direct_leader_id: z.string().describe('Direct leader id').optional(),
          dotted_line_manager_id: z
            .string()
            .describe(
              'Dotted-line manager ID, which can be obtained through the [Batch Query Employee Information] interface- Function grey release, if you need it, please contact [Technical Support]',
            )
            .optional(),
          job_id: z.string().describe('Job ID').optional(),
          job_family_id: z.string().describe('Sequence id').optional(),
          job_level_id: z.string().describe('Level id').optional(),
          job_title: z.string().describe('Job title id').optional(),
          probation_start_date: z.string().describe('Probation period start date').optional(),
          probation_end_date: z.string().describe('End of probation period').optional(),
          contract_start_date: z.string().describe('Contract start date').optional(),
          contract_end_date: z.string().describe('Contract end date').optional(),
          duration_period: z.number().describe('Duration period').optional(),
          duration_unit: z
            .string()
            .describe(
              'Duration unit, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: pre_hire- custom_api_name: duration_unit',
            )
            .optional(),
          onboarding_date: z.string().describe('Onboard date').optional(),
          onboarding_location_id: z.string().describe('Location ID').optional(),
          office_location_id: z.string().describe('Office location id').optional(),
          recruitment_type_id: z.string().describe('Recruitment source id').optional(),
          probation_period: z.string().describe('Probation period').optional(),
          employee_type_id: z.string().describe('Personnel type id').optional(),
          employee_subtype_id: z.string().describe('Person subtype id').optional(),
          employment_type_id: z
            .string()
            .describe(
              'Employment type ID: Please note that this field is required. The enumerated values can be obtained by querying the interface[Get Field Details]. Query with the following parameters:- object_api_name: pre_hire- custom_api_name: employment_type',
            )
            .optional(),
          work_email: z.string().describe('Work mailbox').optional(),
          duration_type_id: z.string().describe('Term type id').optional(),
          signing_type_id: z.string().describe('Signing type id').optional(),
          entry_mode: z.string().describe('Entry method').optional(),
          social_security_city_id: z.string().describe('Social Security City ID').optional(),
          contract_type: z.string().describe('Type of contract').optional(),
          company: z.string().describe('Company').optional(),
          cost_center_rate: z
            .array(
              z.object({
                cost_center_id: z
                  .string()
                  .describe(
                    'The cost center ID can be obtained through the [Inquire about cost center information] interface',
                  )
                  .optional(),
                rate: z.number().describe('Apportionment ratio').optional(),
                new_rate: z.number().describe('-').optional(),
              }),
            )
            .describe('Cost center allocation information- To be deprecated, it is recommended to use cost_allocation')
            .optional(),
          job_grade_id: z
            .string()
            .describe('Job grade id, it can be obtained through the [Get the job grade] interface')
            .optional(),
          custom_fields: z
            .array(
              z.object({
                field_name: z.string().describe('Field name'),
                value: z.string().describe('The field value. Please write it as a string array'),
              }),
            )
            .describe('Custom fields')
            .optional(),
          service_company: z.string().describe('Service company').optional(),
          work_shift: z
            .string()
            .describe(
              'Work shift, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: pre_hire- custom_api_name: work_shift',
            )
            .optional(),
          compensation_type: z
            .string()
            .describe(
              'Compensation type, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: pre_hire- custom_api_name: compensation_type',
            )
            .optional(),
          work_location_id: z
            .string()
            .describe('Work location id, it can be obtained through the [Get location list] interface')
            .optional(),
          onboarding_address_id: z.string().describe('Onboarding dddress id').optional(),
          office_address_id: z.string().describe('Office address id').optional(),
          position_id: z.string().describe('Position id').optional(),
          working_calendar_id: z.string().describe('Working calendar id').optional(),
          working_hours_type: z
            .string()
            .describe('Working hours type, it can be obtained through the [Get the list of working hours] interface')
            .optional(),
          pay_group_id: z.string().describe('Pay group id').optional(),
          flow_id: z
            .string()
            .describe('Flow id, it can be obtained through the [Onboarding flow list] interface')
            .optional(),
          check_in_time: z.string().describe('Check in time').optional(),
          check_in_method: z
            .string()
            .describe(
              'Check in method, the enumeration value can be queried by the [Get Field Details] interface, and can be queried according to the following parameters:- object_api_name: pre_hire- custom_api_name: onboarding_method',
            )
            .optional(),
          seniority_date: z.string().describe('Tenure commencement date').optional(),
          seniority_adjust_information_list: z
            .array(
              z.object({
                seniority_adjustment: z
                  .number()
                  .describe(
                    'Adjustment value- precision: two decimal places- Unit: yearAutomatic calculation logic: If this value is null and the start and end dates of the tenure adjustment are not null, the adjustment value will be automatically calculated',
                  )
                  .optional(),
                seniority_adjustment_type: z
                  .enum(['decrease', 'increase'])
                  .describe(
                    'Adjustment type- You can query through the [Get Field Details] interface, the query parameters are as follows:- object_api_name: seniority_adjust_information- custom_api_name: seniority_adjustment_type Options:decrease(reduce),increase(increase)',
                  ),
                reasons_for_seniority_adjustment: z.string().describe('Tenure adjustment reasons').optional(),
                start_date: z.string().describe('Start Date- Format: yyyy-mm-dd').optional(),
                end_date: z.string().describe('end date- Format: yyyy-mm-dd').optional(),
                custom_fields: z
                  .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                  .describe('-')
                  .optional(),
              }),
            )
            .describe(
              'Tenure adjustment information- Function grey release, if you need it, please contact [Technical Support]',
            )
            .optional(),
          notice_period_probation_voluntary: z
            .object({
              wk_id: z.string().describe('ID').optional(),
              value: z.number().describe('numerical value').optional(),
              value_unit: z.string().describe('unit').optional(),
            })
            .describe(
              'Notice period within probation period (voluntary separation)- Function grey release, if you need it, please contact [Technical Support]',
            )
            .optional(),
          notice_period_probation_involuntary: z
            .object({
              wk_id: z.string().describe('ID').optional(),
              value: z.number().describe('numerical value').optional(),
              value_unit: z.string().describe('unit').optional(),
            })
            .describe(
              'Notice period within probation period (passive separation)- Function grey release, if you need it, please contact [Technical Support]',
            )
            .optional(),
          notice_period_positive_voluntary: z
            .object({
              wk_id: z.string().describe('ID').optional(),
              value: z.number().describe('numerical value').optional(),
              value_unit: z.string().describe('unit').optional(),
            })
            .describe(
              'Notification period after regularization (voluntary resignation)- Function grey release, if you need it, please contact [Technical Support]',
            )
            .optional(),
          notice_period_positive_involuntary: z
            .object({
              wk_id: z.string().describe('ID').optional(),
              value: z.number().describe('numerical value').optional(),
              value_unit: z.string().describe('unit').optional(),
            })
            .describe(
              'Post-regularization notice period (passive resignation)- Function grey release, if you need it, please contact [Technical Support]',
            )
            .optional(),
          condition_worker: z.boolean().describe('Is it an external person?').optional(),
          non_compete_covenant: z.boolean().describe('Does it include a non-compete clause?').optional(),
          company_sponsored_visa: z.boolean().describe('A company visa is required').optional(),
          work_station: z.string().describe('Workstation').optional(),
          pathway: z.string().describe('-').optional(),
          default_cost_center: z
            .object({
              cost_center_id: z
                .string()
                .describe(
                  'The cost center ID can be obtained through the [Inquire about cost center information] interface',
                ),
              is_herit: z.boolean().describe('Whether to inherit the default cost center of the position/department'),
            })
            .describe('Default cost center- Function grey release, if you need it, please contact [Technical Support]')
            .optional(),
          cost_allocation: z
            .object({
              effective_time: z.string().describe('-').optional(),
              expiration_time: z.string().describe('-').optional(),
              cost_center_rates: z
                .array(
                  z.object({
                    cost_center_id: z
                      .string()
                      .describe(
                        'The cost center ID can be obtained through the [Inquire about cost center information] interface',
                      )
                      .optional(),
                    rate: z.number().describe('-').optional(),
                    new_rate: z.number().describe('-').optional(),
                  }),
                )
                .describe('-')
                .optional(),
            })
            .describe('Cost allocation- Function grey release, if you need it, please contact [Technical Support]')
            .optional(),
          talent_id: z
            .string()
            .describe(
              'talent id, only supports Feishu Hire talent ID, it can be obtained through the [Get talent list] interface. please leave it blank if Feishu Hire is not used',
            )
            .optional(),
        })
        .describe('Job Information'),
      education_info: z
        .array(
          z.object({
            school_name: z.string().describe('School name').optional(),
            education: z.string().describe('Education').optional(),
            start_time: z.string().describe('Start time').optional(),
            end_time: z.string().describe('End time').optional(),
            field_of_study: z.string().describe('Professional').optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('field name'),
                  value: z
                    .string()
                    .describe(
                      'Field value, is the string escaped by json, according to the metadata definition, the field format is different (123, 123.23, true, [\\ "id1\\",\\ "id2\\], 2006-01-02 15:04:05])',
                    ),
                }),
              )
              .describe('custom field')
              .optional(),
          }),
        )
        .describe('Educational experience')
        .optional(),
      work_experience: z
        .array(
          z.object({
            company_name: z.string().describe('Company name').optional(),
            start_time: z.string().describe('Start time').optional(),
            end_time: z.string().describe('End time').optional(),
            job_title: z.string().describe('Position').optional(),
            description: z.string().describe('Job Description').optional(),
            department: z.string().describe('Department').optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('field name'),
                  value: z
                    .string()
                    .describe(
                      'Field value, is the string escaped by json, according to the metadata definition, the field format is different (123, 123.23, true, [\\ "id1\\",\\ "id2\\], 2006-01-02 15:04:05])',
                    ),
                }),
              )
              .describe('custom field')
              .optional(),
          }),
        )
        .describe('Work experience')
        .optional(),
      ats_application_id: z.string().describe('Recruitment Application ID').optional(),
      out_biz_id: z.string().describe('Unique ID, used to support idempotent creation').optional(),
    }),
  },
};
export const corehrV2PreHireDelete = {
  project: 'corehr',
  name: 'corehr.v2.preHire.delete',
  sdkName: 'corehr.v2.preHire.delete',
  path: '/open-apis/corehr/v2/pre_hires/:pre_hire_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Pre hire-delete prehire (recommend)-Deleting employees who are not yet hired, once deleted, their information cannot be searched. Please proceed with caution',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ pre_hire_id: z.string() }),
  },
};
export const corehrV2PreHirePatch = {
  project: 'corehr',
  name: 'corehr.v2.preHire.patch',
  sdkName: 'corehr.v2.preHire.patch',
  path: '/open-apis/corehr/v2/pre_hires/:pre_hire_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Pre hire-update prehire (recommend)-update the value of prehire object',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        basic_info_update: z
          .object({
            names: z
              .array(
                z.object({
                  full_name: z.string().describe('full name').optional(),
                  first_name: z.string().describe('first name').optional(),
                  middle_name: z.string().describe('middle name').optional(),
                  name_primary: z.string().describe('last name').optional(),
                  local_first_name: z.string().describe('local first name').optional(),
                  local_middle_name: z.string().describe('local middle name').optional(),
                  local_primary: z.string().describe('local last name').optional(),
                  custom_local_name: z.string().describe('custom local name').optional(),
                  custom_western_name: z.string().describe('custom west').optional(),
                  country_region: z.string().describe('country / region'),
                  name_type: z
                    .string()
                    .describe('Name type, enum value- legal_name- preferred_name- former_name- additional_name'),
                  additional_name: z.string().describe('alias').optional(),
                }),
              )
              .describe(
                'name,this value is a list and will be updated in full.If the unpassed fields originally have values, they will be cleared synchronously',
              )
              .optional(),
            phones: z
              .array(
                z.object({
                  international_area_code: z.string().describe('Country code, enum value'),
                  phone_number: z.string().describe('telephone number'),
                  device_type: z.string().describe('Device type, enum value- mobile_phone- landline- fax'),
                  phone_usage: z
                    .string()
                    .describe('Phone usage, enumeration value- work- home- emergency_contact- company'),
                  is_primary: z
                    .boolean()
                    .describe(
                      'Primary phone. If there are multiple phones, only one phone\'s "is_primary" can be true',
                    ),
                  is_public: z.boolean().describe('public phone number'),
                }),
              )
              .describe(
                'Phone, this value is a list and will be updated in full.If the unpassed fields originally have values, they will be cleared synchronously',
              )
              .optional(),
            emails: z
              .array(
                z.object({
                  email: z.string().describe('email address'),
                  is_primary: z
                    .boolean()
                    .describe(
                      'Is it the primary mailbox? If there are multiple mailboxes, only one mailbox can have "is_primary" set to true',
                    ),
                  is_public: z.boolean().describe('Is it a public email address?'),
                  email_usage: z
                    .string()
                    .describe('Email usage, the enumeration value can be obtained through [Enum constant]'),
                }),
              )
              .describe(
                'Mailbox, this value is a list and will be updated in full.If the unpassed fields originally have values, they will be cleared synchronously',
              )
              .optional(),
            nationality_v2_id: z.string().describe('nationality').optional(),
            additional_nationality_id_list: z.array(z.string()).describe('Other Nationalities').optional(),
            resident_tax_list: z
              .array(
                z.object({
                  tax_country_region: z
                    .string()
                    .describe(
                      'Country/Region, it can be obtained through the [Query Country/Region Information] interface',
                    )
                    .optional(),
                  resident_status: z.string().describe('residency').optional(),
                  tax_address: z
                    .object({
                      country_region_id: z
                        .string()
                        .describe(
                          'Country/Region, it can be obtained through the [Query Country/Region Information] interface',
                        ),
                      region_id: z
                        .string()
                        .describe(
                          'main administrative region, it can be obtained through the [Search principal subdivision (province) information]interface',
                        )
                        .optional(),
                      local_address_line1: z.string().describe('Address line 1 (non-Latin native scripts)').optional(),
                      local_address_line2: z.string().describe('Address line 2 (non-Latin native scripts)').optional(),
                      local_address_line3: z.string().describe('Address line 3 (non-Latin native scripts)').optional(),
                      local_address_line4: z.string().describe('Address line 4 (non-Latin native scripts)').optional(),
                      local_address_line5: z.string().describe('Address line 5 (non-Latin native scripts)').optional(),
                      local_address_line6: z.string().describe('Address line 6 (non-Latin native scripts)').optional(),
                      local_address_line7: z.string().describe('Address line 7 (non-Latin native scripts)').optional(),
                      local_address_line8: z.string().describe('Address line 8 (non-Latin native scripts)').optional(),
                      local_address_line9: z.string().describe('Address line 9 (non-Latin native scripts)').optional(),
                      postal_code: z.string().describe('Postal code').optional(),
                      address_types: z
                        .array(z.string())
                        .describe(
                          'Address type, enumeration value can query the [Get Field Details] interface to obtain, query according to the following parameters: - object_api_name = "address" - custom_api_name = "address_type"',
                        ),
                      is_primary: z.boolean().describe('Whether primary address'),
                      is_public: z.boolean().describe('Whether public address'),
                      city_id_v2: z
                        .string()
                        .describe(
                          'City, you can get details through the interface [Query city information] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/corehr-v2/basic_info -city/search)',
                        )
                        .optional(),
                      district_id_v2: z
                        .string()
                        .describe(
                          'District/county, you can get details through the interface [Query District/County Information] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/corehr-v2/basic_info -district/search)',
                        )
                        .optional(),
                    })
                    .describe('Tax address')
                    .optional(),
                  resident_status_specification: z.string().describe('Resident tax status description').optional(),
                  year_resident_tax: z.string().describe('annual').optional(),
                  custom_fields: z
                    .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                    .describe('-')
                    .optional(),
                }),
              )
              .describe('Tax identity information, the value is a list, will be updated in full')
              .optional(),
            born_country_region: z.string().describe('Country of birth').optional(),
            is_disabled: z.boolean().describe('Whether disabled').optional(),
            disable_card_number: z.string().describe('Disability certificate number').optional(),
            is_old_alone: z.boolean().describe('Whether lonely').optional(),
            is_martyr_family: z.boolean().describe('Whether martyred').optional(),
            martyr_card_number: z.string().describe('Martyred certificate number').optional(),
            dependent_list: z
              .array(
                z.object({
                  relationship: z.string().describe('relationship'),
                  gender: z.string().describe('Gender').optional(),
                  date_of_birth: z.string().describe('birthday').optional(),
                  national_ids: z
                    .array(
                      z.object({
                        country_region_id: z
                          .string()
                          .describe(
                            'Country/Region, it can be obtained through the [Query Country/Region Information] interface',
                          ),
                        national_id_type_id: z.string().describe('National id type id'),
                        national_id_number: z.string().describe('National id number'),
                        issue_date: z.string().describe('Issue date').optional(),
                        expiration_date: z.string().describe('Expiration date').optional(),
                        issued_by: z.string().describe('Issued by').optional(),
                        custom_fields: z
                          .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                          .describe('-')
                          .optional(),
                      }),
                    )
                    .describe('national ids')
                    .optional(),
                  spouses_working_status: z.string().describe('Spouses working status').optional(),
                  is_this_person_covered_by_health_insurance: z
                    .boolean()
                    .describe('Whether covered by health insurance')
                    .optional(),
                  is_this_person_allowed_for_tax_deduction: z
                    .boolean()
                    .describe('Whether allowed for tax deduction')
                    .optional(),
                  dependent_name: z.string().describe('Dependent name').optional(),
                  employer: z.string().describe('Employer').optional(),
                  job: z.string().describe('Job').optional(),
                  phone: z
                    .object({
                      international_area_code: z.string().describe('Area code'),
                      phone_number: z.string().describe('Phone number'),
                      device_type: z.string().describe('Device type'),
                      phone_usage: z.string().describe('Phone usage'),
                      is_primary: z.boolean().describe('Whether primary phone'),
                      is_public: z.boolean().describe('Whether public phone'),
                    })
                    .describe('Phone')
                    .optional(),
                  address: z
                    .object({
                      country_region_id: z
                        .string()
                        .describe(
                          'Country/Region, it can be obtained through the [Query Country/Region Information] interface',
                        ),
                      region_id: z
                        .string()
                        .describe(
                          'main administrative region, it can be obtained through the [Search principal subdivision (province) information]interface',
                        )
                        .optional(),
                      local_address_line1: z.string().describe('Address line 1 (non-Latin native scripts)').optional(),
                      local_address_line2: z.string().describe('Address line 2 (non-Latin native scripts)').optional(),
                      local_address_line3: z.string().describe('Address line 3 (non-Latin native scripts)').optional(),
                      local_address_line4: z.string().describe('Address line 4 (non-Latin native scripts)').optional(),
                      local_address_line5: z.string().describe('Address line 5 (non-Latin native scripts)').optional(),
                      local_address_line6: z.string().describe('Address line 6 (non-Latin native scripts)').optional(),
                      local_address_line7: z.string().describe('Address line 7 (non-Latin native scripts)').optional(),
                      local_address_line8: z.string().describe('Address line 8 (non-Latin native scripts)').optional(),
                      local_address_line9: z.string().describe('Address line 9 (non-Latin native scripts)').optional(),
                      postal_code: z.string().describe('Postal code').optional(),
                      address_types: z
                        .array(z.string())
                        .describe(
                          'Address type, enumeration value can query the [Get Field Details] interface to obtain, query according to the following parameters: - object_api_name = "address" - custom_api_name = "address_type"',
                        ),
                      is_primary: z.boolean().describe('main address'),
                      is_public: z.boolean().describe('public address'),
                      city_id_v2: z.string().describe('city').optional(),
                      district_id_v2: z.string().describe('District/County').optional(),
                    })
                    .describe('address')
                    .optional(),
                  custom_fields: z
                    .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                    .describe('-')
                    .optional(),
                }),
              )
              .describe('family member')
              .optional(),
            religion: z.string().describe('Religion').optional(),
            bank_account_list: z
              .array(
                z.object({
                  bank_name: z.string().describe('Bank name').optional(),
                  branch_name: z.string().describe('Branch name').optional(),
                  bank_account_number: z.string().describe('Bank account number'),
                  account_holder: z.string().describe('Account holder'),
                  country_region_id: z.string().describe('Country region id').optional(),
                  bank_account_usages: z.array(z.string()).describe('Bank account usage').optional(),
                  bank_account_type: z.string().describe('Bank account type').optional(),
                  custom_fields: z
                    .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                    .describe('-')
                    .optional(),
                }),
              )
              .describe('Bank account list')
              .optional(),
            national_id_list: z
              .array(
                z.object({
                  country_region_id: z
                    .string()
                    .describe(
                      'Country/Region, it can be obtained through the [Query Country/Region Information] interface',
                    ),
                  national_id_type_id: z.string().describe('national id type id'),
                  national_id_number: z.string().describe('national id number'),
                  issue_date: z.string().describe('issue date').optional(),
                  expiration_date: z.string().describe('expiration date').optional(),
                  issued_by: z.string().describe('issued by').optional(),
                  custom_fields: z
                    .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                    .describe('-')
                    .optional(),
                }),
              )
              .describe('national id list')
              .optional(),
            personal_profile_list: z
              .array(
                z.object({
                  personal_profile_type: z.string().describe('Personal profile type').optional(),
                  files: z
                    .array(z.object({ id: z.string().describe('File ID').optional() }))
                    .describe('Files')
                    .optional(),
                }),
              )
              .describe('Personal profile list')
              .optional(),
            emergency_contact_list: z
              .array(
                z.object({
                  legal_name: z.string().describe('legal name').optional(),
                  relationship: z.string().describe('Relationship').optional(),
                  phones: z
                    .array(
                      z.object({
                        international_area_code: z.string().describe('Area code'),
                        phone_number: z.string().describe('Phone number'),
                        device_type: z.string().describe('Device type'),
                        phone_usage: z.string().describe('Phone usage'),
                        is_primary: z
                          .boolean()
                          .describe(
                            'Primary phone number. If there are multiple phones, only one phone\'s "is_primary" can be true',
                          ),
                        is_public: z.boolean().describe('Whether public phone'),
                      }),
                    )
                    .describe('Phone')
                    .optional(),
                  address: z
                    .object({
                      country_region_id: z
                        .string()
                        .describe(
                          'Country/Region, it can be obtained through the [Query Country/Region Information] interface',
                        ),
                      region_id: z
                        .string()
                        .describe(
                          'main administrative region, it can be obtained through the [Search principal subdivision (province) information]interface',
                        )
                        .optional(),
                      local_address_line1: z.string().describe('Address line 1 (non-Latin native scripts)').optional(),
                      local_address_line2: z.string().describe('Address line 2 (non-Latin native scripts)').optional(),
                      local_address_line3: z.string().describe('Address line 3 (non-Latin native scripts)').optional(),
                      local_address_line4: z.string().describe('Address line 4 (non-Latin native scripts)').optional(),
                      local_address_line5: z.string().describe('Address line 5 (non-Latin native scripts)').optional(),
                      local_address_line6: z.string().describe('Address line 6 (non-Latin native scripts)').optional(),
                      local_address_line7: z.string().describe('Address line 7 (non-Latin native scripts)').optional(),
                      local_address_line8: z.string().describe('Address line 8 (non-Latin native scripts)').optional(),
                      local_address_line9: z.string().describe('Address line 9 (non-Latin native scripts)').optional(),
                      postal_code: z.string().describe('Postal code').optional(),
                      address_types: z
                        .array(z.string())
                        .describe(
                          'Address type, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: address- custom_api_name: address_type',
                        ),
                      is_primary: z.boolean().describe('Whether primary address'),
                      is_public: z.boolean().describe('Whether public address'),
                      city_id_v2: z.string().describe('city').optional(),
                      district_id_v2: z.string().describe('District/County').optional(),
                    })
                    .describe('Address')
                    .optional(),
                  email: z
                    .object({
                      email: z.string().describe('Email address'),
                      is_primary: z.boolean().describe('Whether primary email'),
                      is_public: z.boolean().describe('Whether public email'),
                      email_usage: z
                        .string()
                        .describe(
                          'Email usage, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: email- custom_api_name: email_usage',
                        ),
                    })
                    .describe('Email')
                    .optional(),
                  is_primary: z
                    .boolean()
                    .describe("Primary contact, if there are multiple contacts, only one contact's is_primary is true")
                    .optional(),
                  custom_fields: z
                    .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                    .describe('-')
                    .optional(),
                }),
              )
              .describe('Emergency contact list')
              .optional(),
            address_list: z
              .array(
                z.object({
                  country_region_id: z
                    .string()
                    .describe(
                      'Country/Region, it can be obtained through the [Query Country/Region Information] interface',
                    ),
                  region_id: z
                    .string()
                    .describe(
                      'main administrative region, it can be obtained through the [Search principal subdivision (province) information]interface',
                    )
                    .optional(),
                  local_address_line1: z.string().describe('Address line 1 (non-Latin native scripts)').optional(),
                  local_address_line2: z.string().describe('Address line 2 (non-Latin native scripts)').optional(),
                  local_address_line3: z.string().describe('Address line 3 (non-Latin native scripts)').optional(),
                  local_address_line4: z.string().describe('Address line 4 (non-Latin native scripts)').optional(),
                  local_address_line5: z.string().describe('Address line 5 (non-Latin native scripts)').optional(),
                  local_address_line6: z.string().describe('Address line 6 (non-Latin native scripts)').optional(),
                  local_address_line7: z.string().describe('Address line 7 (non-Latin native scripts)').optional(),
                  local_address_line8: z.string().describe('Address line 8 (non-Latin native scripts)').optional(),
                  local_address_line9: z.string().describe('Address line 9 (non-Latin native scripts)').optional(),
                  postal_code: z.string().describe('Postal code').optional(),
                  address_types: z
                    .array(z.string())
                    .describe(
                      'Address type, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: address- custom_api_name: address_type',
                    ),
                  is_primary: z.boolean().describe('Whether primary address'),
                  is_public: z.boolean().describe('Whether public address'),
                  city_id_v2: z.string().describe('city').optional(),
                  district_id_v2: z.string().describe('District/County').optional(),
                }),
              )
              .describe('Address list')
              .optional(),
            marital_status: z
              .string()
              .describe(
                'Marital status, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: person- custom_api_name: marital_status',
              )
              .optional(),
            ethnicity_race: z
              .string()
              .describe(
                'Ethnicity race, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: person- custom_api_name: ethnicity_race',
              )
              .optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'Field value, it is a string after json escape, the field format is different depending on the metadata definition (123, 123.23, true, [\\"id1\\",\\"id2\\], 2006-01-02 15:04:05])',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
            native_region: z
              .string()
              .describe(
                'Native region, it can be obtained through the [Search principal subdivision (province) information]interface',
              )
              .optional(),
            hukou_type: z
              .string()
              .describe(
                'Hukou type, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: person_info_chn- custom_api_name: hukou_type',
              )
              .optional(),
            hukou_location: z.string().describe('Hukou location').optional(),
            gender_id: z
              .string()
              .describe(
                'Gender, enumeration value can be queried [Get Field Details] interface to obtain, query according to the following parameters:- object_api_name: dependent- custom_api_name: gender',
              )
              .optional(),
            date_of_birth: z.string().describe('birthday').optional(),
            date_entered_workforce: z.string().describe('Attendance date').optional(),
            expected_graduate_date: z.string().describe('Expected graduation date').optional(),
            citizenship_status_id_list: z.array(z.string()).describe('citizenship').optional(),
            work_experience: z
              .array(
                z.object({
                  company_name: z.string().describe('Company name').optional(),
                  start_time: z.string().describe('start time').optional(),
                  end_time: z.string().describe('end time').optional(),
                  job_title: z.string().describe('position').optional(),
                  description: z.string().describe('Job Description').optional(),
                  department: z.string().describe('department').optional(),
                }),
              )
              .describe('work history')
              .optional(),
            education_info: z
              .array(
                z.object({
                  school_name: z.string().describe('School name').optional(),
                  education: z
                    .string()
                    .describe(
                      'Education, enumeration values can be obtained from the document [Introduction to enumeration constants] Education (level_of_education) enumeration definition',
                    )
                    .optional(),
                  start_time: z.string().describe('start time').optional(),
                  end_time: z.string().describe('end time').optional(),
                  field_of_study: z.string().describe('professional').optional(),
                }),
              )
              .describe('Educational experience')
              .optional(),
          })
          .describe('update personal info')
          .optional(),
        offer_info_update: z
          .object({
            onboarding_date: z.string().describe('Update prehire information').optional(),
            ats_application_id: z.string().describe('Recruitment Application ID').optional(),
            onboarding_location_id: z
              .string()
              .describe('Job location ID, detailed information can be obtained through [Batch Query Location]')
              .optional(),
            onboarding_address_id: z
              .string()
              .describe(
                'Entry address ID, detailed information can be obtained through the [Batch Query Address] interface',
              )
              .optional(),
            office_location_id: z
              .string()
              .describe('Office location ID, detailed information can be obtained through [Batch Query Location]')
              .optional(),
            office_address_id: z
              .string()
              .describe('Office address ID, detailed information can be obtained through the [Batch Query Address]')
              .optional(),
            employment_type: z
              .string()
              .describe(
                'Employment type, obtain the enumeration apiName through [Enum constant]- employee- contingent_worker',
              )
              .optional(),
            onboarding_method: z
              .string()
              .describe('Onboarding method, obtain the enumeration apiName through[Enum constant]- onsite- remote')
              .optional(),
            work_emails: z
              .array(
                z.object({
                  email: z.string().describe('email address'),
                  is_primary: z
                    .boolean()
                    .describe(
                      'Is it the primary mailbox? If there are multiple mailboxes, only one mailbox can have "is_primary" set to true',
                    ),
                  is_public: z.boolean().describe('Is it a public email address?'),
                  email_usage: z
                    .string()
                    .describe('Email usage, the enumeration value can be obtained through [Enum constant]'),
                }),
              )
              .describe('work email')
              .optional(),
            cost_center_rates: z
              .array(
                z.object({
                  cost_center_id: z
                    .string()
                    .describe(
                      'The cost center ID can be obtained through the [Inquire about cost center information] interface',
                    )
                    .optional(),
                  rate: z.number().describe('Apportionment ratio').optional(),
                  new_rate: z.number().describe('-').optional(),
                }),
              )
              .describe(
                'Cost center allocation information only supports commercial tenants- To be deprecated, it is recommended to use cost_allocation',
              )
              .optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'Field value, which is an escaped string of a string list. For details, please refer to the request body example',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
            position_id: z.string().describe('Position id').optional(),
            probation_period: z.number().describe('Probation period').optional(),
            probation_start_date: z.string().describe('Probation start date').optional(),
            probation_end_date: z.string().describe('Probation end date').optional(),
            contract_start_date: z.string().describe('Contract start date').optional(),
            contract_end_date: z.string().describe('Contract end date').optional(),
            contract_type: z
              .string()
              .describe(
                'Contract type, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: pre_hire- custom_api_name: contract_type',
              )
              .optional(),
            duration_type_id: z
              .string()
              .describe(
                'Duration type, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: pre_hire- custom_api_name: duration_type',
              )
              .optional(),
            signing_type_id: z
              .string()
              .describe(
                'Signing type, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: pre_hire- custom_api_name: signing_type',
              )
              .optional(),
            worker_id: z.string().describe('Worker id').optional(),
            check_in_time: z.string().describe('Check in time').optional(),
            check_in_method: z
              .string()
              .describe(
                'Check in method, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: pre_hire- custom_api_name: onboarding_method',
              )
              .optional(),
            company: z
              .string()
              .describe('Company, it can be obtained through the [Get company list]interface')
              .optional(),
            work_shift: z
              .string()
              .describe(
                'Work shift, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: pre_hire- custom_api_name: work_shift',
              )
              .optional(),
            recruitment_type_id: z
              .string()
              .describe(
                'Recruitment type id, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: pre_hire- custom_api_name: recruitment_type',
              )
              .optional(),
            compensation_type: z
              .string()
              .describe(
                'Pay group id, the enumeration value can be queried by the [Get Field Details]interface, and can be queried according to the following parameters:- object_api_name: pre_hire- custom_api_name: compensation_type',
              )
              .optional(),
            pay_group_id: z.string().describe('Pay group id').optional(),
            offer_hr_id: z
              .string()
              .describe(
                'Offer HR ID, it can be obtained through the [Batch access to employee information through employee ID]interface',
              )
              .optional(),
            job_id: z
              .string()
              .describe('Job ID, it can be obtained through the [Get the list of job profile]interface')
              .optional(),
            job_family_id: z
              .string()
              .describe('Job Family ID, it can be obtained through the [Get the list of job sequence]interface')
              .optional(),
            job_level_id: z
              .string()
              .describe('Job Level ID, it can be obtained through the [Get the list of job level]interface')
              .optional(),
            job_grade_id: z
              .string()
              .describe('Job Grade ID, it can be obtained through the [Get the job grade]interface')
              .optional(),
            employee_type_id: z.string().describe('Employee type id,').optional(),
            employee_subtype_id: z.string().describe('personnel subtype').optional(),
            direct_leader_id: z.string().describe('Direct leader id').optional(),
            dotted_line_manager_id: z
              .string()
              .describe(
                'Dotted-line manager, you can get details through the [Search Employee Information] interface- Function grey release, if you need it, please contact [Technical Support]',
              )
              .optional(),
            department_id: z.string().describe('Department id').optional(),
            social_security_city: z.string().describe('Social security city').optional(),
            work_location_id: z.string().describe('Work location id').optional(),
            working_calendar: z.string().describe('Working calendar').optional(),
            working_hours_type: z.string().describe('Working hours type').optional(),
            seniority_date: z.string().describe('Tenure commencement date').optional(),
            seniority_adjust_information_list: z
              .array(
                z.object({
                  seniority_adjustment: z
                    .number()
                    .describe(
                      'Adjustment value- precision: two decimal places- Unit: yearAutomatic calculation logic: If this value is null and the start and end dates of the tenure adjustment are not null, the adjustment value will be automatically calculated',
                    )
                    .optional(),
                  seniority_adjustment_type: z
                    .enum(['decrease', 'increase'])
                    .describe(
                      'Adjustment type- You can query through the [Get Field Details] interface, the query parameters are as follows:- object_api_name: seniority_adjust_information- custom_api_name: seniority_adjustment_type Options:decrease(reduce),increase(increase)',
                    ),
                  reasons_for_seniority_adjustment: z.string().describe('Tenure adjustment reasons').optional(),
                  start_date: z.string().describe('Start Date- Format: yyyy-mm-dd').optional(),
                  end_date: z.string().describe('end date- Format: yyyy-mm-dd').optional(),
                  custom_fields: z
                    .array(z.object({ field_name: z.string().describe('-'), value: z.string().describe('-') }))
                    .describe('-')
                    .optional(),
                }),
              )
              .describe(
                'Tenure adjustment information- Function grey release, if you need it, please contact [Technical Support]',
              )
              .optional(),
            notice_period_probation_voluntary: z
              .object({
                wk_id: z.string().describe('ID').optional(),
                value: z.number().describe('numerical value').optional(),
                value_unit: z.string().describe('unit').optional(),
              })
              .describe(
                'Notice period within probation period (voluntary separation)- Function grey release, if you need it, please contact [Technical Support]',
              )
              .optional(),
            notice_period_probation_involuntary: z
              .object({
                wk_id: z.string().describe('ID').optional(),
                value: z.number().describe('numerical value').optional(),
                value_unit: z.string().describe('unit').optional(),
              })
              .describe(
                'Notice period within probation period (passive separation)- Function grey release, if you need it, please contact [Technical Support]',
              )
              .optional(),
            notice_period_positive_voluntary: z
              .object({
                wk_id: z.string().describe('ID').optional(),
                value: z.number().describe('numerical value').optional(),
                value_unit: z.string().describe('unit').optional(),
              })
              .describe(
                'Notification period after regularization (voluntary resignation)- Function grey release, if you need it, please contact [Technical Support]',
              )
              .optional(),
            notice_period_positive_involuntary: z
              .object({
                wk_id: z.string().describe('ID').optional(),
                value: z.number().describe('numerical value').optional(),
                value_unit: z.string().describe('unit').optional(),
              })
              .describe(
                'Post-regularization notice period (passive resignation)- Function grey release, if you need it, please contact [Technical Support]',
              )
              .optional(),
            condition_worker: z.boolean().describe('Is it an external person?').optional(),
            company_sponsored_visa: z.boolean().describe('A company visa is required').optional(),
            weekly_working_hours_v2: z.number().describe('Weekly working hours (in hours)').optional(),
            work_station: z.string().describe('Workstation').optional(),
            service_company: z
              .string()
              .describe('The company you work for can query through the [batch query company] interface')
              .optional(),
            non_compete_covenant: z.boolean().describe('Does it include a non-compete clause?').optional(),
            pathway: z.string().describe('-').optional(),
            default_cost_center: z
              .object({
                cost_center_id: z
                  .string()
                  .describe(
                    'The cost center ID can be obtained through the [Inquire about cost center information] interface',
                  ),
                is_herit: z.boolean().describe('Whether to inherit the default business of the position/department'),
              })
              .describe(
                'Default cost center- Function grey release, if you need it, please contact [Technical Support]',
              )
              .optional(),
            cost_allocation: z
              .object({
                effective_time: z.string().describe('-').optional(),
                expiration_time: z.string().describe('-').optional(),
                cost_center_rates: z
                  .array(
                    z.object({
                      cost_center_id: z
                        .string()
                        .describe(
                          'The cost center ID can be obtained through the [Inquire about cost center information] interface',
                        )
                        .optional(),
                      rate: z.number().describe('-').optional(),
                      new_rate: z.number().describe('-').optional(),
                    }),
                  )
                  .describe('-')
                  .optional(),
              })
              .describe('Cost allocation- Function grey release, if you need it, please contact [Technical Support]')
              .optional(),
          })
          .describe(
            'Email usage, the enumeration value can be obtained through the document [Feishu Personnel Enumeration Constants] Email Usage (email_usage) enumeration definition',
          )
          .optional(),
        standard_update_fields: z
          .array(z.string())
          .describe(
            'Specify the system fields that need to be updated. It only supports drilling down to one level. The format is as follows: - basic_info_update field: basic_info_update.names (overwrite and update the entire name) basic_info_update.emails (update the entire mailbox) - offer_info_update field: offer_info_update.onboarding_methodNote that if a system field to be updated is specified but the corresponding value is not passed in the structure, the value of the field will be cleared',
          )
          .optional(),
        custom_update_fields: z
          .array(z.string())
          .describe(
            'Specify the custom field on the PreHire object that needs to be updated, in the following format: - custom_field1__cNote that if a custom field to be updated is specified but the corresponding value is not passed in the structure, the value of the field will be cleared',
          )
          .optional(),
        person_custom_update_fields: z
          .array(z.string())
          .describe(
            'Specify the custom field on the Person object that needs to be updated, in the following format: - custom_field1__c',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ pre_hire_id: z.string().describe('prehireID') }),
  },
};
export const corehrV2PreHireQuery = {
  project: 'corehr',
  name: 'corehr.v2.preHire.query',
  sdkName: 'corehr.v2.preHire.query',
  path: '/open-apis/corehr/v2/pre_hires/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Pre hire-query prehire-The interface is used to query the information of the personnel to be hired according to the ID of the personnel to be hired (support batch), including personal information such as name, mobile phone number and job information.- Delay description: The delay of the database leader/follower is within 2s, that is, the data may not be queried by calling this interface within 2s after directly creating the job.- Performance description: This interface returns a lot of data. Please control the number of batches (< 10) and appropriately reduce the number of query fields (< 50) when querying',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        pre_hire_ids: z.array(z.string()).describe('List of pending employee IDs').optional(),
        fields: z
          .array(z.string())
          .describe(
            'Returns a list of fields for the data, filled in by:- Only return pre_hire_id when empty- When not empty, return the data according to the incoming field. The data structure can refer to the data structure of the response. The format example is as follows:- person_info (personal information) fields: person_info, person_info- employment_info field: employment_info department- onboarding_info (onboarding information) field: onboarding_info onboarding_date- probation_info (probation period information) field: probation_info probation_period- contract_info (Contract Information) field: contract_info contract_type- If you want to return all subordinates, just pass the parent structure name, such as person_info- The more data returned, the slower the query interface performance, please fill in the return field as needed',
          )
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 10'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV2PreHireRestoreFlowInstance = {
  project: 'corehr',
  name: 'corehr.v2.preHire.restoreFlowInstance',
  sdkName: 'corehr.v2.preHire.restoreFlowInstance',
  path: '/open-apis/corehr/v2/pre_hires/restore_flow_instance',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Pre hire-restore flow instance-Perform the resume onboarding operation on the designated cancelled pending prehire through this interface, and correspond to the resume onboarding button on the onboarding management page',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      pre_hire_id: z
        .string()
        .describe('The pending prehire ID can be obtained from the [pending prehire list] interface'),
      confirm_workforce: z
        .boolean()
        .describe('Whether to force occupation; true is mandatory occupation; false is non-mandatory occupation')
        .optional(),
    }),
  },
};
export const corehrV2PreHireSearch = {
  project: 'corehr',
  name: 'corehr.v2.preHire.search',
  sdkName: 'corehr.v2.preHire.search',
  path: '/open-apis/corehr/v2/pre_hires/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Pre hire-Search Pre Hire-Search for pre hire information',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        worker_ids: z.array(z.string()).describe('List of job numbers for incoming staff').optional(),
        pre_hire_ids: z.array(z.string()).describe('ID list of pre_hire employees').optional(),
        person_ids: z
          .array(z.string())
          .describe(
            'The list of personal information IDs can be obtained through [[Event] Update personal information] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/person/events/updated)',
          )
          .optional(),
        onboarding_date_start: z
          .string()
          .describe('Onboard date - the start of the search range, needs to be used with the end of the search range')
          .optional(),
        onboarding_date_end: z.string().describe('Onboard date - search range ends').optional(),
        updated_date_start: z
          .string()
          .describe(
            'The update time of the data to be hired (the start time of the search) needs to be used together with the update time (updated_date_end). If it is not filled in, it will not be filtered according to the data update time',
          )
          .optional(),
        updated_date_end: z
          .string()
          .describe(
            'The update time of the data to be hired (the end time of the search) needs to be used together with the update time (updated_date_start). If it is not filled in, it will not be filtered according to the data update time',
          )
          .optional(),
        onboarding_location_ids: z.array(z.string()).describe('Location ID List').optional(),
        onboarding_status: z
          .enum(['preboarding', 'deleted', 'day_one', 'withdrawn', 'completed'])
          .describe(
            'Onboarding status Options:preboarding(To be hired),deleted(Deleted),day_one(DayOne Ready),withdrawn(Revoked),completed(Completed)',
          )
          .optional(),
        department_ids: z.array(z.string()).describe('Department ID List').optional(),
        direct_manager_ids: z.array(z.string()).describe('List of employment IDs of direct superiors').optional(),
        employee_type_ids: z.array(z.string()).describe('List of person type IDs').optional(),
        employee_subtype_ids: z.array(z.string()).describe('List of personnel subtype IDs').optional(),
        job_family_ids: z.array(z.string()).describe('Job family ID list').optional(),
        key_word: z
          .string()
          .describe('Search keywords, support common name fuzzy search + job number precise search')
          .optional(),
        condition_worker: z.boolean().describe('-').optional(),
        rehire: z
          .enum(['to_be_confirmed', 'no', 'yes'])
          .describe(
            'Whether rehire or not Options:to_be_confirmed(ToBeConfirmed To be confirmed, the system will determine whether the employee has a historical employment record. If it exists and requires secondary confirmation, the call will fail and the historical employment record will be returned.),no(No, the system directly marks it as a non-resignation rehired person, and no longer makes repeated judgments),yes(Yes, Requires Historical Employment Information ID Required)',
          )
          .optional(),
        fields: z
          .array(z.string())
          .describe(
            'Returns a list of fields for the data, filled in by:- only returns pre_hire_id when empty- When not empty, return data according to the incoming fields in the following format:- person_info fields: person_info, person_info- employment_info field: employment_info- onboarding_info field: onboarding_info onboarding_date- probation_info field: probation_info probation_period- contract_info field: contract_info contract_type- If you want to return all subordinates, just pass the parent structure name, such as person_info- The more data returned, the slower the performance of the query interface, please fill in the return field as needed',
          )
          .optional(),
      })
      .optional(),
    params: z.object({
      page_size: z.number().describe('Page size, up to 100'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV2PreHireTransitTask = {
  project: 'corehr',
  name: 'corehr.v2.preHire.transitTask',
  sdkName: 'corehr.v2.preHire.transitTask',
  path: '/open-apis/corehr/v2/pre_hires/:pre_hire_id/transit_task',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Pre hire-Transit task-Configuring the onboarding process, tasks in progress can be filled in locally through this api',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      task_id: z
        .string()
        .describe(
          'Task code.- For system-built tasks, the correspondence between task codes and task names is as follows: > The task **Create Account SSO** is a hidden task node that is automatically executed before **Personal Information**. - 1: Position Information - 2: Personal Information - 3: Create Account SSO - 4: Check-in - 9: Sign Employment Documents- For custom task nodes (e.g., 3095697a-065f-4627-a47c-46fe958a6754), the method to obtain the name is as follows: 1. Use `pre_hire_id` to call the [Search Pre-Hire Information] API or [Query Pre-Hire] 2. Add `onboarding_info.onboarding_task_list` to the query field `fields` After querying, the returned structure of the onboarding_task_list contains the correspondence between task codes and task names, as shown in the example below:```json{ "onboarding_task_list": [ { "task_code": "3095697a-065f-4627-a47c-46fe958a6754", "task_name": "Modify Onboarding Date", "task_status": "uninitialized" }, { "task_code": "d37b9d7c-232d-4a55-98fa-541318234ede", "task_name": "Work Visa Supplement Task", "task_status": "uninitialized" } ]}```',
        ),
    }),
    path: z.object({ pre_hire_id: z.string() }),
  },
};
export const corehrV2PreHireWithdrawOnboarding = {
  project: 'corehr',
  name: 'corehr.v2.preHire.withdrawOnboarding',
  sdkName: 'corehr.v2.preHire.withdrawOnboarding',
  path: '/open-apis/corehr/v2/pre_hires/withdraw_onboarding',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Pre hire-withdraw onboarding-Through this interface, perform the withdraw onboarding operation on the designated prehire who are ready for onboarding, and correspond to the withdraw onboarding button on the onboarding management page',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      pre_hire_id: z
        .string()
        .describe('The prehire ID can be obtained through the [Search for prehire information] interface'),
      withdraw_reason: z.string().describe('Reason for withdraw, limited to 500 words'),
    }),
  },
};
export const corehrV2ProcessRevokeUpdate = {
  project: 'corehr',
  name: 'corehr.v2.processRevoke.update',
  sdkName: 'corehr.v2.processRevoke.update',
  path: '/open-apis/corehr/v2/process_revoke/:process_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Process management-Process Instance-Revoke process-Revoke a single process, the status is that the completed process can be revoked, and an operator needs to be designated when using it. Currently, process administrators and document administrators are supported',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_id: z
          .string()
          .describe(
            'Pass the corresponding user ID according to the user ID type specified in the query parameters, which defaults to Open ID',
          )
          .optional(),
        reason: z.string().describe('reason').optional(),
        system_user: z.boolean().describe('Is this request initiated by system').optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z.object({ process_id: z.string().describe('Process instance id') }),
  },
};
export const corehrV2ProcessWithdrawUpdate = {
  project: 'corehr',
  name: 'corehr.v2.processWithdraw.update',
  sdkName: 'corehr.v2.processWithdraw.update',
  path: '/open-apis/corehr/v2/process_withdraw/:process_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Process management-Process Instance-Withdraw process-Rollback a single approval instance in the "Under review" status. The approval process ends after rollback',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_id: z
          .string()
          .describe(
            'Pass the corresponding user ID according to the user ID type specified in the query parameters, which defaults to Open ID.If the system_user is true, this field can be left unfilled',
          )
          .optional(),
        reason: z.string().describe('reason').optional(),
        system_user: z
          .boolean()
          .describe('Whether to operate in the system identity or not. If it is false, the user_id must be filled in')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z.object({ process_id: z.string().describe('Process instance id') }),
  },
};
export const corehrV2ProcessApproverUpdate = {
  project: 'corehr',
  name: 'corehr.v2.processApprover.update',
  sdkName: 'corehr.v2.processApprover.update',
  path: '/open-apis/corehr/v2/processes/:process_id/approvers/:approver_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Process management-Approver Task-Approve / Reject approver-Approve or Reject approval task. For individual approval, if one approval task is approved, the entire node is approved; For countersign approval, if all approval tasks are approved, the node will be approved. if there are mandatory fields in the form, it is supported to submit the value of form fields',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      status: z.number().describe('Approve or reject approvers Options:2(Approved reject),3(Rejected approve)'),
      user_id: z
        .string()
        .describe(
          'Passed as user_id_type. If system approval is false, Then the user_id of the original approver corresponding to the approval task "approver_id" is required. Otherwise, it is not mandatory',
        )
        .optional(),
      system_approval: z
        .boolean()
        .describe(
          'true - Use system identity for approval. If you use system identity, the original approver corresponding to approver_id will be replaced for approval, and the original approver will lose the viewing permission of the approval task.；false - use user identity approval',
        )
        .optional(),
      reason: z.string().describe('Reason for approval using system identity').optional(),
      field_values_v2: z
        .array(
          z.object({
            variable_api_name: z.string().describe('variable api name').optional(),
            variable_value: z
              .object({
                text_value: z.string().describe('text value').optional(),
                bool_value: z.boolean().describe('boolean value').optional(),
                number_value: z.string().describe('number value').optional(),
                enum_value: z.string().describe('enum value. Note: enum value id').optional(),
                date_value: z.string().describe('from 1970').optional(),
                date_time_value: z.string().describe('timestamp, MSEL').optional(),
                i18n_value: z
                  .object({
                    zh_cn: z.string().describe('Chinese').optional(),
                    en_us: z.string().describe('English').optional(),
                  })
                  .describe('i18n')
                  .optional(),
                object_value: z
                  .object({
                    wk_id: z.string().describe('object identification in Wukong').optional(),
                    wk_api_name: z.string().describe('metadata identification in Wukong').optional(),
                  })
                  .describe('object value. Include object id and type')
                  .optional(),
                department_value: z
                  .string()
                  .describe('department id. According param to choose department id')
                  .optional(),
                employment_value: z.string().describe('employment id').optional(),
                list_values: z.array(z.string()).describe('Arrays value.Refer to the list in subValues').optional(),
                file_value: z
                  .object({
                    open_file_id: z.string().describe('ID obtained via [Upload File Interface]').optional(),
                    file_name: z.string().describe('file name').optional(),
                    length: z.number().describe('File size, in Bytes').optional(),
                  })
                  .describe('File type field value')
                  .optional(),
              })
              .describe('variable value')
              .optional(),
            sub_values: z
              .array(
                z.object({
                  key: z.string().describe('key about list and record').optional(),
                  value: z
                    .object({
                      text_value: z.string().describe('text value').optional(),
                      bool_value: z.boolean().describe('Boolean value').optional(),
                      number_value: z.string().describe('number value').optional(),
                      enum_value: z.string().describe('enum value. Note: enum value id').optional(),
                      date_value: z.string().describe('from 1970').optional(),
                      date_time_value: z.string().describe('timestamp，MSEL').optional(),
                      i18n_value: z
                        .object({
                          zh_cn: z.string().describe('Chinese').optional(),
                          en_us: z.string().describe('English').optional(),
                        })
                        .describe('I18n')
                        .optional(),
                      object_value: z
                        .object({
                          wk_id: z.string().describe('object identification in Wukong').optional(),
                          wk_api_name: z.string().describe('metadata identification in Wukong').optional(),
                        })
                        .describe('object value. Include object id and type')
                        .optional(),
                      department_value: z
                        .string()
                        .describe('department id. According param to choose department id')
                        .optional(),
                      employment_value: z.string().describe('employment id').optional(),
                      list_values: z
                        .array(z.string())
                        .describe('Arrays value.Refer to the list in subValues')
                        .optional(),
                      file_value: z
                        .object({
                          open_file_id: z.string().describe('ID obtained via [Upload File Interface]').optional(),
                          file_name: z.string().describe('file name').optional(),
                          length: z.number().describe('File size, in Bytes').optional(),
                        })
                        .describe('File type field value')
                        .optional(),
                    })
                    .describe('Variable value')
                    .optional(),
                }),
              )
              .describe('variable in list_values and record_values')
              .optional(),
          }),
        )
        .describe('form data')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(record department as open_department_id),department_id(record department as department_id),people_corehr_department_id(Identify departments by people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      process_id: z
        .string()
        .describe(
          'The process instance ID is a unique identifier for a process.It can be obtained from the process_ids field returned by the [Query Process Instance List] API',
        ),
      approver_id: z
        .string()
        .describe(
          'Identify the approval tasks of an approver in an approval node in the process. If there are multiple approvers in the same approval node, different approvers will have different approver_ids.You can obtain the approver_id of each approval task in the process through the [Get process detail] API',
        ),
    }),
  },
};
export const corehrV2ProcessExtraUpdate = {
  project: 'corehr',
  name: 'corehr.v2.processExtra.update',
  sdkName: 'corehr.v2.processExtra.update',
  path: '/open-apis/corehr/v2/processes/:process_id/extra',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Process management-Approver Task-Extra approver-There are three ways to extra a node or approver in a single process: pre-extra, current-extra and post-extra',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      operator: z.string().describe('Operator, if the system_user is true, this field can be left blank').optional(),
      node_id: z
        .string()
        .describe('Process node id, choose one of the approver_id and pass it in, and node_id shall prevail')
        .optional(),
      approver_id: z
        .string()
        .describe(
          'Identify the approval tasks of an approver in an approval node in the process. If there are multiple approvers in the same approval node, different approvers will have different approver_ids.You can obtain the approver_id of each approval task in the process through the [Get process detail] API.Node_id choose one of the two incoming, all passed node_id shall prevail',
        )
        .optional(),
      extra_type: z
        .number()
        .describe('extra method Options:0(PreExtra pre-extra),1(CurrentExtra current-extra),2(PostExtra post-extra)'),
      approval_type: z
        .number()
        .describe(
          'Approval method when multiple people extra.It should be noted that when the extra_type is "current-extra", only "and extra" can be selected here. Options:0(OR or extra),1(AND and extra)',
        )
        .optional(),
      extra_user_ids: z.array(z.string()).describe('Extra person id list'),
      remark: z.string().describe('Remarks').optional(),
      system_user: z
        .boolean()
        .describe('Whether to operate in the system identity or not. If it is false, the operator must be filled in')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z.object({
      process_id: z
        .string()
        .describe(
          'The process instance ID is a unique identifier for a process.It can be obtained from the process_ids field returned by the [Query Process Instance List] API',
        ),
    }),
  },
};
export const corehrV2ProcessFormVariableDataGet = {
  project: 'corehr',
  name: 'corehr.v2.processFormVariableData.get',
  sdkName: 'corehr.v2.processFormVariableData.get',
  path: '/open-apis/corehr/v2/processes/:process_id/form_variable_data',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Process management-Process Instance-Get process form data-Get process form data, including business and custom fields in the form, based on the process instance id (process_id). Only support CoreHR and Attendance business processes for Feishu.Note: The old version of the API document has been moved to the [Historical Version] directory',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(record department as open_department_id),department_id(record department as department_id),people_corehr_department_id(Identify departments by department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      process_id: z
        .string()
        .describe(
          'The process instance ID is a unique identifier for a process.It can be obtained from the process_ids field returned by the [Query Process Instance List] API',
        ),
    }),
  },
};
export const corehrV2ProcessGet = {
  project: 'corehr',
  name: 'corehr.v2.process.get',
  sdkName: 'corehr.v2.process.get',
  path: '/open-apis/corehr/v2/processes/:process_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Process management-Process Instance-Get process detail-Get process detail by process_id(This function is not controlled by the scope of data permissions). For example, process status, process initiator, process initiation time, process summary, all pending, done, and CC tasks in the process',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z.object({ process_id: z.string().describe('Process ID') }),
  },
};
export const corehrV2ProcessList = {
  project: 'corehr',
  name: 'corehr.v2.process.list',
  sdkName: 'corehr.v2.process.list',
  path: '/open-apis/corehr/v2/processes',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Process management-Process Instance-Query the list of process instance-Query the list of process instances(This function is not controlled by the scope of data permissions).Process Instance: It refers to the specific process initiated by the user in the business function or the Feishu HR approval center. The process_id is its unique identifier.Process Definition: It refers to the process configured by the administrator on the settings side, similar to a process template. The flow_definition_id is its unique identifier. The process initiated by the user is generated according to the configuration of the corresponding process definition',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      statuses: z
        .array(z.number())
        .describe(
          'Query status list. If you need to query multiple status values at once, you can pass the same parameter name multiple times and pass different parameter values each time. For example: https://{url}?statuses=1&statuses=2Optional Value: 1: In progress2: Rejected4: Withdrawn8: Cancelled9: Completed15: Cancelling',
        )
        .optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.number().describe('paging size'),
      modify_time_from: z
        .string()
        .describe(
          'Task query start time, closed intervalUnit: ms. The number of milliseconds elapsed since January 1, 1970 (midnight UTC/GMT)Attention: Start and end times cannot exceed 31 days',
        ),
      modify_time_to: z
        .string()
        .describe(
          'Task query end time, closed intervalUnit: ms. The number of milliseconds elapsed since January 1, 1970 (midnight UTC/GMT)Attention: Start and end times cannot exceed 31 days',
        ),
      flow_definition_id: z
        .string()
        .describe(
          'process definition IDThe process definition ID corresponding to the process instance can be queried by [Get individual process details]',
        )
        .optional(),
    }),
  },
};
export const corehrV2ProcessTransferUpdate = {
  project: 'corehr',
  name: 'corehr.v2.processTransfer.update',
  sdkName: 'corehr.v2.processTransfer.update',
  path: '/open-apis/corehr/v2/processes/:process_id/transfer',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Process management-Approver Task-Transfer approver-Transfers a single approval task. After that, the approval process will be transferred to the transfer recipient',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      operator: z.string().describe('Operator, If the system_user is true, this field can be left blank').optional(),
      to_user_id: z.string().describe('Transferred person id'),
      approver_ids: z
        .array(z.string())
        .describe(
          'List of approver IDsIf there are multiple approvers in the same approval node, different approvers will have different approver_ids.You can obtain the approver_id of each approval task in the process through the [Get process detail] API',
        ),
      remark: z.string().describe('Remarks').optional(),
      system_user: z
        .boolean()
        .describe('Whether to operate in the system identity or not. If it is false, the operator must be filled in')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z.object({
      process_id: z
        .string()
        .describe(
          'The process instance ID is a unique identifier for a process.It can be obtained from the process_ids field returned by the [Query Process Instance List] API',
        ),
    }),
  },
};
export const corehrV2ReportDetailRowBatchDelete = {
  project: 'corehr',
  name: 'corehr.v2.reportDetailRow.batchDelete',
  sdkName: 'corehr.v2.reportDetailRow.batchDelete',
  path: '/open-apis/corehr/v2/report_detail_row/batchDelete',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Workforce_plan-batch delete report detail row-After deleting the reporting lines in batches, you can view it in [Settings - Compilation Planning Settings - Compilation Planning XXX - Centralized Filling - View Data]',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      workforce_plan_id: z
        .string()
        .describe('The planning ID can be resolved in "Settings - Planning Settings - Planning XXX - Page URL"'),
      centralized_reporting_project_id: z
        .string()
        .describe(
          'Fill in the ID centrally, which can be resolved in "Settings - Compilation Planning Settings - Compilation Planning XXX - Centralized Filling XXX - View Data"',
        ),
      items: z
        .array(
          z.object({
            dimensions: z
              .array(
                z.object({
                  dimension_key: z
                    .string()
                    .describe(
                      'Dimension key, which can be selected from the following list:- "department": department.- "employee_type": employee type.- "location": location.- "position": position.- "cost_center": cost center/line of business.- "job_family": job family.- "job_level": job level.- "job": job.Custom organization:- "custom_org_01"- "custom_org_02"- "custom_org_03"- "custom_org_04"- "custom_org_05"',
                    ),
                  dimension_value: z
                    .string()
                    .describe(
                      'Dimensional value.- department_id: Available from [Query Department].- location_id: Available from [Query Location].- cost_center_id: Available from [Query Cost Center].- job_id: Available from [Query Job].- job_level_id: Available from [Query Job Level].- job_family_id: Available from [Query Job Family].- employee_type_id: Available from [Query Employee Type].- position_id: post, function grey release, please contact [technical support]- custom_org_01_id: custom organization, function grey release, please contact [technical support]- custom_org_02_id: custom organization, function grey release, please contact [technical support]- custom_org_03_id: custom organization, function grey release, please contact [technical support]- custom_org_04_id: custom organization, function grey release, please contact [technical support]- custom_org_05_id: custom organization, function grey release, please contact [technical support]',
                    ),
                }),
              )
              .describe(
                'The dimension information filled in centrally should match the dimension created by the user, that is, all dimensions except the automatic matching dimension are passed in, no more or no less.Check out the dimensions of the planning through "Settings - Planning Settings - Planning XXX".Custom organization temporarily does not support [Set automatic matching rules for organization], please contact [Technical Support] to learn how to determine whether this field is an automatic matching field',
              ),
            eai_details: z
              .array(
                z.object({
                  date: z
                    .string()
                    .describe(
                      'The date of the estimated number of incumbents is the same as the date of the estimated number of incumbents displayed on the centralized filing page, and the format should be given according to the example. If the two do not match, the identification update cannot be completed',
                    )
                    .optional(),
                  estimated_active_individuals: z
                    .string()
                    .describe(
                      'The estimated number of incumbents should match the number of decimal places specified when creating the preparation plan. If there is no match, it cannot be updated. Decimal places viewing method: "Settings - Preparation Plan - Preparation Plan XXX" to view the number of decimal places for the estimated number of incumbents',
                    )
                    .optional(),
                }),
              )
              .describe(
                'Information about the estimated number of incumbents. You can check the time of the estimated number of incumbents from "Settings - Compilation Planning Settings - Compilation Planning XXX - Centralized Filling". If this field does not exist, it means that the user is not allowed to fill in this field when creating it. If it exists, the user needs to check the date of the estimated number of incumbents and use the example value format to pass the parameter',
              )
              .optional(),
            plan_value: z
              .string()
              .describe(
                'The planning value must match the number of decimal places specified when creating the planning. If it does not match, it cannot be updated. Decimal places viewing method: "Settings - Planning - Planning XXX" to view the number of decimal places in the planning',
              )
              .optional(),
          }),
        )
        .describe('The number of reporting lines should be between 1 and 5'),
    }),
  },
};
export const corehrV2ReportDetailRowBatchSave = {
  project: 'corehr',
  name: 'corehr.v2.reportDetailRow.batchSave',
  sdkName: 'corehr.v2.reportDetailRow.batchSave',
  path: '/open-apis/corehr/v2/report_detail_row/batchSave',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Workforce_plan-batch create and update report detail row-After creating/updating the reporting line in batches, you can view it in [Settings - Compilation Planning Settings - Compilation Planning XXX - Centralized Filling - View Data]',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      workforce_plan_id: z
        .string()
        .describe('The planning ID can be resolved in "Settings - Planning Settings - Planning XXX - Page URL"'),
      centralized_reporting_project_id: z
        .string()
        .describe(
          'Fill in the ID centrally, and you can analyze report_id in "Settings - Compilation Planning Settings - Compilation Planning XXX - Centralized Filling XXX - View Data - Page URL"',
        ),
      items: z
        .array(
          z.object({
            dimensions: z
              .array(
                z.object({
                  dimension_key: z
                    .string()
                    .describe(
                      'Dimension key, which can be selected from the following list:- "department": department.- "employee_type": type of person.- "location": location.- "position": position.- "cost_center": cost center/line of business.- "job_family": sequence.- "job_level": rank.- "job": position.Custom organization:- "custom_org_01"- "custom_org_02"- "custom_org_03"- "custom_org_04"- "custom_org_05"',
                    ),
                  dimension_value: z
                    .string()
                    .describe(
                      'Dimensional value.- department_id: Available from [Inquiry Department].- location_id: Available from [Query Location].- cost_center_id: Available from [query cost center].- job_id: Available from [Query Job].- job_level_id: Available from [query rank].- job_family_id: Available from [Query Sequence].- employee_type_id: Available from [Query Person Type].- position_id: Post, function grey release, please contact technical support if you need it- custom_org_01_id: Custom organization, function grey release, please contact technical support if necessary- custom_org_02_id: Custom organization, function grey release, please contact technical support if necessary- custom_org_03_id: Custom organization, function grey release, please contact technical support if necessary- custom_org_04_id: Custom organization, function grey release, please contact technical support if necessary- custom_org_05_id: Custom organization, function grey release, please contact technical support if necessary',
                    ),
                }),
              )
              .describe(
                'The dimension information filled in centrally should match the dimension created by the user, that is, all dimensions except the automatic matching dimension are passed in, no more or no less.Check out the dimensions of the planning through "Settings - Planning Settings - Planning XXX".Custom organization temporarily does not support [Set automatic matching rules for organization], please contact [Technical Support] to learn how to determine whether this field is an automatic matching field',
              ),
            eai_details: z
              .array(
                z.object({
                  date: z
                    .string()
                    .describe(
                      'The date of the estimated number of incumbents is the same as the date of the estimated number of incumbents displayed on the centralized filing page, and the format should be given according to the example. If the two do not match, the identification update cannot be completed',
                    )
                    .optional(),
                  estimated_active_individuals: z
                    .string()
                    .describe(
                      'The estimated number of incumbents should match the number of decimal places specified when creating the preparation plan. If there is no match, it cannot be updated. Decimal places viewing method: "Settings - Preparation Plan - Preparation Plan XXX" to view the number of decimal places for the estimated number of incumbents',
                    )
                    .optional(),
                }),
              )
              .describe(
                'Information about the estimated number of incumbents. You can check the time of the estimated number of incumbents from "Settings - Compilation Planning Settings - Compilation Planning XXX - Centralized Filling". If this field does not exist, it means that the user is not allowed to fill in this field when creating/updating the reporting line in batches. This field is not required. If it exists, the user needs to check the date of the estimated number of incumbents and use the example value format to pass the parameter',
              )
              .optional(),
            plan_value: z
              .string()
              .describe(
                'Compilation planning value. It must match the number of decimal places specified when creating the preparation plan. If it does not match, it cannot be updated. Decimal places viewing method: "Settings-Compilation Planning-Compilation Planning XXX" to view the number of decimal places for the preparation plan. Note that when the preparation plan is selected according to the natural cycle, this value must be empty, and the preparation planning information multi_period_values of the natural cycle needs to be set',
              )
              .optional(),
            multi_period_values: z
              .array(
                z.object({
                  period_date: z
                    .string()
                    .describe('The last day of the cycle. Note that it needs to be within the selected cycle range')
                    .optional(),
                  workforce_plan: z
                    .string()
                    .describe(
                      'The planning value corresponding to the natural cycle. The planning value must match the number of decimal places specified when creating the planning. If it does not match, it cannot be updated. Decimal places viewing method: "Settings - Planning - Planning XXX" to view the number of decimal places in the planning',
                    )
                    .optional(),
                  individuals_to_be_added: z
                    .string()
                    .describe(
                      'Corresponds to the number of natural cycle incrementers. This field is not required when creating updates in batches',
                    )
                    .optional(),
                  individuals_to_be_removed: z
                    .string()
                    .describe(
                      'Corresponds to the number of natural-cycle retrenchments. You do not need to write to this field when creating updates in bulk',
                    )
                    .optional(),
                }),
              )
              .describe(
                'Natural cycle planning information. Set this field when the planning plan is selected according to the natural cycle. Function grey release, please contact [technical support]',
              )
              .optional(),
          }),
        )
        .describe('The number of reporting lines should be between 1 and 5'),
    }),
  },
};
export const corehrV2WorkforcePlanDetailRowBatchDelete = {
  project: 'corehr',
  name: 'corehr.v2.workforcePlanDetailRow.batchDelete',
  sdkName: 'corehr.v2.workforcePlanDetailRow.batchDelete',
  path: '/open-apis/corehr/v2/workforce_plan_detail_row/batchDelete',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Workforce_plan-batch delete workforce plan detail row-After deleting the detailed rows in batches, you can check whether the detailed rows are deleted in [Settings - Planning Settings - Planning XXX - Editing Data]',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      workforce_plan_id: z
        .string()
        .describe('The planning ID can be resolved in "Settings - Planning Settings - Planning XXX - Page URL"'),
      items: z
        .array(
          z.object({
            dimensions: z
              .array(
                z.object({
                  dimension_key: z
                    .string()
                    .describe(
                      'Dimension key, which can be selected from the following list:- "department": department.- "employee_type": employee type.- "location": location.- "position": position.- "cost_center": cost center/line of business.- "job_family": job family.- "job_level": job level.- "job": job.Custom organization:- "custom_org_01"- "custom_org_02"- "custom_org_03"- "custom_org_04"- "custom_org_05"',
                    ),
                  dimension_value: z
                    .string()
                    .describe(
                      'Dimensional value.- department_id: Available from [Query Department].- location_id: Available from [Query Location].- cost_center_id: Available from [Query Cost Center].- job_id: Available from [Query Job].- job_level_id: Available from [Query Job Level].- job_family_id: Available from [Query Job Family].- employee_type_id: Available from [Query Employee Type].- position_id: post, function grey release, please contact [technical support]- custom_org_01_id: custom organization, function grey release, please contact [technical support]- custom_org_02_id: custom organization, function grey release, please contact [technical support]- custom_org_03_id: custom organization, function grey release, please contact [technical support]- custom_org_04_id: custom organization, function grey release, please contact [technical support]- custom_org_05_id: custom organization, function grey release, please contact [technical support]',
                    ),
                }),
              )
              .describe(
                'The planned dimension information should match the dimensions created by the user, that is, all dimensions except the automatic matching dimension are passed in, no more or no less.Check out the dimensions of the planning through "Settings - Planning Settings - Planning XXX".Custom organization temporarily does not support [Set automatic matching rules for organization], please contact [Technical Support] to learn how to determine whether this field is an automatic matching field',
              ),
            eai_details: z
              .array(
                z.object({
                  date: z
                    .string()
                    .describe(
                      'The date of the estimated number of incumbents is the same as the date of the estimated number of incumbents displayed on the planning page, and the format should be given according to the example. If the two do not match, the identification update cannot be completed',
                    )
                    .optional(),
                  estimated_active_individuals: z
                    .string()
                    .describe(
                      'The estimated number of incumbents should match the number of decimal places specified when creating the preparation plan. If there is no match, it cannot be updated. Decimal places viewing method: "Settings - Preparation Plan - Preparation Plan XXX" to view the number of decimal places for the estimated number of incumbents',
                    )
                    .optional(),
                }),
              )
              .describe(
                'Information about the estimated number of incumbents. You can view the time of the estimated number of incumbents from "Settings - Compilation Planning Settings - Compilation Planning XXX". If this field does not exist, it means that the user is not allowed to fill in this field when creating it. If it exists, the user needs to view the date of the estimated number of incumbents and use the example value format to pass the parameter',
              )
              .optional(),
            plan_value: z
              .string()
              .describe(
                'The planning value must match the number of decimal places specified when creating the planning. If it does not match, it cannot be updated. Decimal places viewing method: "Settings - Planning - Planning XXX" to view the number of decimal places in the planning',
              )
              .optional(),
          }),
        )
        .describe('The number of detailed lines for planning should be between 1 and 5'),
    }),
  },
};
export const corehrV2WorkforcePlanDetailRowBatchSave = {
  project: 'corehr',
  name: 'corehr.v2.workforcePlanDetailRow.batchSave',
  sdkName: 'corehr.v2.workforcePlanDetailRow.batchSave',
  path: '/open-apis/corehr/v2/workforce_plan_detail_row/batchSave',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Workforce_plan-batch create and update workforce plan detail row-After creating/updating detailed rows in batches, you can view them in [Settings - Planning Settings - Planning XXX - Editing Data]',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      workforce_plan_id: z
        .string()
        .describe('The planning ID can be resolved in "Settings - Planning Settings - Planning XXX - Page URL"'),
      items: z
        .array(
          z.object({
            dimensions: z
              .array(
                z.object({
                  dimension_key: z
                    .string()
                    .describe(
                      'Dimension key, which can be selected from the following list:- "department": department.- "employee_type": type of person.- "location": location.- "position": position.- "cost_center": cost center/line of business.- "job_family": sequence.- "job_level": rank.- "job": position.Custom organization:- "custom_org_01"- "custom_org_02"- "custom_org_03"- "custom_org_04"- "custom_org_05"',
                    ),
                  dimension_value: z
                    .string()
                    .describe(
                      'Dimensional value.- department_id: Available from [Inquiry Department].- location_id: Available from [Query Location].- cost_center_id: Available from [query cost center].- job_id: Available from [Query Job].- job_level_id: Available from [query rank].- job_family_id: Available from [Query Sequence].- employee_type_id: Available from [Query Person Type].- position_id: post, function grey release, please contact [technical support]- custom_org_01_id: custom organization, function grey release, please contact [technical support]- custom_org_02_id: custom organization, function grey release, please contact [technical support]- custom_org_03_id: custom organization, function grey release, please contact [technical support]- custom_org_04_id: custom organization, function grey release, please contact [technical support]- custom_org_05_id: custom organization, function grey release, please contact [technical support]',
                    ),
                }),
              )
              .describe(
                'The planned dimension information should match the dimensions created by the user, that is, all dimensions except the automatic matching dimension are passed in, no more or no less.Check out the dimensions of the planning through "Settings - Planning Settings - Planning XXX".Custom organization temporarily does not support [Set automatic matching rules for organization], please contact [Technical Support] to learn how to determine whether this field is an automatic matching field',
              ),
            eai_details: z
              .array(
                z.object({
                  date: z
                    .string()
                    .describe(
                      'The date of the estimated number of incumbents is the same as the date of the estimated number of incumbents displayed on the planning page, and the format should be given according to the example. If the two do not match, the identification update cannot be completed',
                    )
                    .optional(),
                  estimated_active_individuals: z
                    .string()
                    .describe(
                      'The estimated number of incumbents should match the number of decimal places specified when creating the preparation plan. If there is no match, it cannot be updated. Decimal places viewing method: "Settings - Preparation Plan - Preparation Plan XXX" to view the number of decimal places for the estimated number of incumbents',
                    )
                    .optional(),
                }),
              )
              .describe(
                'Information about the estimated number of incumbents. You can view the time of the estimated number of incumbents from "Settings - Compilation Planning Settings - Edit Compilation Planning XXX". If this field does not exist, it means that the user is not allowed to fill in this field when creating/updating detail lines in batches. This field is not required. If it exists, the user needs to view the date of the estimated number of incumbents and use the example value format to pass the parameter',
              )
              .optional(),
            plan_value: z
              .string()
              .describe(
                'Compilation planning value. It must match the number of decimal places specified when creating the preparation plan. If it does not match, it cannot be updated. Decimal places viewing method: "Settings-Compilation Planning-Compilation Planning XXX" to view the number of decimal places for the preparation plan. Note that when the preparation plan is selected according to the natural cycle, this value must be empty, and the preparation planning information multi_period_values of the natural cycle needs to be set',
              )
              .optional(),
            multi_period_values: z
              .array(
                z.object({
                  period_date: z.string().describe('The last day of the cycle').optional(),
                  workforce_plan: z
                    .string()
                    .describe(
                      'The planning value corresponding to the natural cycle. The planning value must match the number of decimal places specified when creating the planning. If it does not match, it cannot be updated. Decimal places viewing method: "Settings - Planning - Planning XXX" to view the number of decimal places in the planning',
                    )
                    .optional(),
                  individuals_to_be_added: z
                    .string()
                    .describe(
                      'The number of preincrements corresponding to the natural cycle. You do not need to write to this field when creating updates in batches',
                    )
                    .optional(),
                  individuals_to_be_removed: z
                    .string()
                    .describe(
                      'The number of retrenchments corresponding to the natural cycle. You do not need to write to this field when creating updates in bulk',
                    )
                    .optional(),
                }),
              )
              .describe(
                'Natural cycle planning information. Set this field when the planning plan is selected according to the natural cycle. Function grey release, please contact [technical support]',
              )
              .optional(),
          }),
        )
        .describe('The number of detailed lines for planning should be between 1 and 5'),
    }),
  },
};
export const corehrV2WorkforcePlanDetailBatch = {
  project: 'corehr',
  name: 'corehr.v2.workforcePlanDetail.batch',
  sdkName: 'corehr.v2.workforcePlanDetail.batch',
  path: '/open-apis/corehr/v2/workforce_plan_details/batch',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Workforce_plan-Query workforce plan details (not supports custom organization)-Query the workforce plan detail, including dimension information, workforce plan and estimated number of employees',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        workforce_plan_id: z
          .string()
          .describe(
            'The workforce plan ID, ID and detailed information can be obtained by [Getting a list of workforce plan]. When querying workforce plan detail, the workforce plan ID is required',
          )
          .optional(),
        is_centralized_reporting_project: z
          .boolean()
          .describe(
            'Whether it is a centralized project. If tenant is not using the centralized reporting project, leave this parameter blank.**Field permission requirements**: Get the detailed information in the preparation plan (corehr: workforce_plan_centralized_reporting_project_detail: read)',
          )
          .optional(),
        centralized_reporting_project_id: z
          .string()
          .describe(
            'Centralized reporting project ID.If tenant is not using the centralized reporting project, leave this parameter blank. When querying centralized reporting project, the workfroce plan ID can be left blank.**Field permission requirements**: Get the detailed information in the preparation plan (corehr: workforce_plan_centralized_reporting_project_detail: read)',
          )
          .optional(),
        department_ids: z
          .array(z.string())
          .describe(
            'Department ID list. ID acquisition:- Call [create department][search department] and other interfaces to return the department ID- You can also create departments through [[Event]Create Department](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/department/events/created) [[Event]Update departments](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/department/events/updated) Get department ID information',
          )
          .optional(),
        employee_type_ids: z
          .array(z.string())
          .describe('List of person type IDs- Details can be obtained by [Query Person Type]')
          .optional(),
        work_location_ids: z
          .array(z.string())
          .describe(
            'Location ID. ID acquisition method:- Call [Create Location] [Batch Paging Query Location] and other interfaces to return the location ID',
          )
          .optional(),
        job_family_ids: z
          .array(z.string())
          .describe(
            'List of Job Family IDs. How to get the ID:- Call [Create Job Family] [Query the Job Family of the tenant] and other API to return the Job Family ID',
          )
          .optional(),
        job_level_ids: z
          .array(z.string())
          .describe(
            'Job Level ID. ID acquisition method:- Call[New Job Level] [Query the rank information of the tenant] and other interfaces to return the Job Level ID',
          )
          .optional(),
        job_ids: z
          .array(z.string())
          .describe(
            'Job ID. How to get ID:- Call [Create job] [Batch query job] to return job ID- You can also create jobs through [[Event]Create jobs](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/job/events/created) [[Event] Update jobs](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/job/events/updated) Get ID',
          )
          .optional(),
        cost_center_ids: z
          .array(z.string())
          .describe(
            'Cost center ID list. ID acquisition method:- Calling [Create cost center] [Search cost center] and other interfaces can return the cost center ID',
          )
          .optional(),
        include_missing_dimension_rows: z
          .boolean()
          .describe(
            'Whether to include missing dimension detail row data, true is to contain missing dimension detail row data, false is to only get the detail row data that all dimensions have values, the default is false',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('paging size').optional(),
      })
      .optional(),
  },
};
export const corehrV2WorkforcePlanDetailBatchV2 = {
  project: 'corehr',
  name: 'corehr.v2.workforcePlanDetail.batchV2',
  sdkName: 'corehr.v2.workforcePlanDetail.batchV2',
  path: '/open-apis/corehr/v2/workforce_plan_details/batch_v2',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Workforce_plan-Query workforce plan details (supports custom organization)-Query the workforce plan detail, including dimension information, workforce plan, estimated number of employees, incumbency, active individuals and pre-increase/decrease numbers',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        workforce_plan_id: z
          .string()
          .describe(
            'The ID, ID and detailed information of the planning plan can be obtained through [the interface query of the list of workforce plans]. When inquiring about the detailed information of the planning plan, the ID of the planning plan is required. Whether it is a centralized project is set to false, and the centralized project ID is not filled in (whether it is filled in does not affect the return result)',
          )
          .optional(),
        is_centralized_reporting_project: z
          .boolean()
          .describe(
            'Whether to fill in the item centrally. If the tenant does not use the centralized filling function, leave this parameter blank. Set this parameter to true if the query fills in the details centrally.**Field permission requirements**: Get the detailed information in the preparation plan (corehr: workforce_plan_centralized_reporting_project_detail: read)',
          )
          .optional(),
        centralized_reporting_project_id: z
          .string()
          .describe(
            'Compile planning centralized reporting item ID, ID can be extracted from the URL by visiting the centralized reporting page report_id parameters. If the tenant does not use the centralized reporting function, this parameter can be set blank. When inquiring about centralized reporting information, the centralized reporting item ID is required. Whether it is a centralized reporting item is set to true, and the planning plan ID is not filled in (whether to fill in does not affect the return result)**Field permission requirements**: Get the detailed information in the preparation plan (corehr: workforce_plan_centralized_reporting_project_detail: read)',
          )
          .optional(),
        dimension_id_in_datas: z
          .array(
            z.object({
              dimension_key: z
                .string()
                .describe(
                  'Dimension key, which can be selected from the following list:- "department": department.- "employee_type": type of person.- "location": location.- "position": position.- "cost_center": cost center/line of business.- "job_family": sequence.- "job_level": rank.- "job": position.Custom organization:- "custom_org_01"- "custom_org_02"- "custom_org_03"- "custom_org_04"- "custom_org_05"',
                )
                .optional(),
              dimension_ids: z
                .array(z.string())
                .describe(
                  'Dimensional value.- department_id: Available from [Query Department].- location_id: Available from [Query Location].- cost_center_id: Available from [Query Cost Center].- job_id: Available from [Query Job].- job_level_id: Available from [Query Job Level].- job_family_id: Available from [Query Job Family].- employee_type_id: Available from [Query Employee Type].- position_id: post, function grey release, please contact [technical support]- custom_org_01_id: custom organization, function grey release, please contact [technical support]- custom_org_02_id: custom organization, function grey release, please contact [technical support]- custom_org_03_id: custom organization, function grey release, please contact [technical support]- custom_org_04_id: custom organization, function grey release, please contact [technical support]- custom_org_05_id: custom organization, function grey release, please contact [technical support]',
                )
                .optional(),
            }),
          )
          .describe('dimension filter')
          .optional(),
        include_missing_dimension_rows: z
          .boolean()
          .describe(
            'Whether to include detailed row data with missing dimensions, true is to contain detailed row data with missing dimensions, false is to only get detailed row data with values for all dimensions, the default is false',
          )
          .optional(),
        filter_all_zero_value_rows: z
          .boolean()
          .describe(
            'Whether to filter the line where the number of incumbents, pre-increase/pre-decrease personnel, compiled numbers, and estimated incumbents are all 0, true is to filter the line where the number of incumbents, pre-increase/pre-decrease personnel, compiled numbers, and estimated incumbents are all 0, false is not to filter the line where the number of incumbents, pre-increase/pre-decrease personnel, compiled numbers, and estimated incumbents are all 0, the default is false',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('paging size').optional(),
      })
      .optional(),
  },
};
export const corehrV2WorkforcePlanList = {
  project: 'corehr',
  name: 'corehr.v2.workforcePlan.list',
  sdkName: 'corehr.v2.workforcePlan.list',
  path: '/open-apis/corehr/v2/workforce_plans',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Workforce_plan-Query workforce plan-Get a list of workforce plan based on incoming filters',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        get_all_plan: z
          .boolean()
          .describe(
            'Whether to get all planning plans, the default is false.- true list of all planning options.- false to obtain only the current effective preparation plan',
          )
          .optional(),
        active: z
          .boolean()
          .describe(
            'Whether to get only enabled scenarios, the default is true.- true access to enabled planning schemes- false access to all planning schemes,',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV2Tools = [
  corehrV2ApprovalGroupsGet,
  corehrV2ApprovalGroupsOpenQueryDepartmentChangeListByIds,
  corehrV2ApprovalGroupsOpenQueryJobChangeListByIds,
  corehrV2ApproverList,
  corehrV2BasicInfoBankBranchSearch,
  corehrV2BasicInfoBankSearch,
  corehrV2BasicInfoCitySearch,
  corehrV2BasicInfoCountryRegionSubdivisionSearch,
  corehrV2BasicInfoCountryRegionSearch,
  corehrV2BasicInfoCurrencySearch,
  corehrV2BasicInfoDistrictSearch,
  corehrV2BasicInfoLanguageSearch,
  corehrV2BasicInfoNationalitySearch,
  corehrV2BasicInfoTimeZoneSearch,
  corehrV2BpGetByDepartment,
  corehrV2BpList,
  corehrV2CompanyActive,
  corehrV2CompanyBatchGet,
  corehrV2CompanyQueryRecentChange,
  corehrV2ContractSearch,
  corehrV2CostAllocationBatchQuery,
  corehrV2CostAllocationCreateVersion,
  corehrV2CostAllocationRemoveVersion,
  corehrV2CostAllocationUpdateVersion,
  corehrV2CostCenterCreate,
  corehrV2CostCenterDelete,
  corehrV2CostCenterPatch,
  corehrV2CostCenterQueryRecentChange,
  corehrV2CostCenterSearch,
  corehrV2CostCenterVersionCreate,
  corehrV2CostCenterVersionDelete,
  corehrV2CostCenterVersionPatch,
  corehrV2CustomOrgActive,
  corehrV2CustomOrgCreate,
  corehrV2CustomOrgDeleteOrg,
  corehrV2CustomOrgPatch,
  corehrV2CustomOrgQuery,
  corehrV2CustomOrgUpdateRule,
  corehrV2DefaultCostCenterBatchQuery,
  corehrV2DefaultCostCenterCreateVersion,
  corehrV2DefaultCostCenterRemoveVersion,
  corehrV2DefaultCostCenterUpdateVersion,
  corehrV2DepartmentBatchGet,
  corehrV2DepartmentDelete,
  corehrV2DepartmentParents,
  corehrV2DepartmentPatch,
  corehrV2DepartmentQueryMultiTimeline,
  corehrV2DepartmentQueryOperationLogs,
  corehrV2DepartmentQueryRecentChange,
  corehrV2DepartmentQueryTimeline,
  corehrV2DepartmentSearch,
  corehrV2DepartmentTree,
  corehrV2EmployeeBatchGet,
  corehrV2EmployeeCreate,
  corehrV2EmployeeSearch,
  corehrV2EmployeesAdditionalJobBatch,
  corehrV2EmployeesAdditionalJobCreate,
  corehrV2EmployeesAdditionalJobDelete,
  corehrV2EmployeesAdditionalJobPatch,
  corehrV2EmployeesBpBatchGet,
  corehrV2EmployeesInternationalAssignmentCreate,
  corehrV2EmployeesInternationalAssignmentDelete,
  corehrV2EmployeesInternationalAssignmentList,
  corehrV2EmployeesInternationalAssignmentPatch,
  corehrV2EmployeesJobDataBatchGet,
  corehrV2EmployeesJobDataQuery,
  corehrV2EnumSearch,
  corehrV2JobChangeCreate,
  corehrV2JobChangeRevoke,
  corehrV2JobChangeSearch,
  corehrV2JobFamilyBatchGet,
  corehrV2JobGradeCreate,
  corehrV2JobGradeDelete,
  corehrV2JobGradePatch,
  corehrV2JobGradeQuery,
  corehrV2JobLevelBatchGet,
  corehrV2JobGet,
  corehrV2JobList,
  corehrV2JobQueryRecentChange,
  corehrV2LocationActive,
  corehrV2LocationAddressCreate,
  corehrV2LocationAddressDelete,
  corehrV2LocationAddressPatch,
  corehrV2LocationBatchGet,
  corehrV2LocationPatch,
  corehrV2LocationQueryRecentChange,
  corehrV2OffboardingEdit,
  corehrV2OffboardingRevoke,
  corehrV2OffboardingSubmitV2,
  corehrV2PersonCreate,
  corehrV2PersonPatch,
  corehrV2PreHireComplete,
  corehrV2PreHireCreate,
  corehrV2PreHireDelete,
  corehrV2PreHirePatch,
  corehrV2PreHireQuery,
  corehrV2PreHireRestoreFlowInstance,
  corehrV2PreHireSearch,
  corehrV2PreHireTransitTask,
  corehrV2PreHireWithdrawOnboarding,
  corehrV2ProcessRevokeUpdate,
  corehrV2ProcessWithdrawUpdate,
  corehrV2ProcessApproverUpdate,
  corehrV2ProcessExtraUpdate,
  corehrV2ProcessFormVariableDataGet,
  corehrV2ProcessGet,
  corehrV2ProcessList,
  corehrV2ProcessTransferUpdate,
  corehrV2ReportDetailRowBatchDelete,
  corehrV2ReportDetailRowBatchSave,
  corehrV2WorkforcePlanDetailRowBatchDelete,
  corehrV2WorkforcePlanDetailRowBatchSave,
  corehrV2WorkforcePlanDetailBatch,
  corehrV2WorkforcePlanDetailBatchV2,
  corehrV2WorkforcePlanList,
];
