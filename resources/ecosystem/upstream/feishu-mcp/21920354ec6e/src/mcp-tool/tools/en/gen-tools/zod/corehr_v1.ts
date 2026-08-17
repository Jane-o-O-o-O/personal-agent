import { z } from 'zod';
export type corehrV1ToolName =
  | 'corehr.v1.assignedUser.search'
  | 'corehr.v1.authorization.addRoleAssign'
  | 'corehr.v1.authorization.getByParam'
  | 'corehr.v1.authorization.query'
  | 'corehr.v1.authorization.removeRoleAssign'
  | 'corehr.v1.authorization.updateRoleAssign'
  | 'corehr.v1.commonDataId.convert'
  | 'corehr.v1.commonDataMetaData.addEnumOption'
  | 'corehr.v1.commonDataMetaData.editEnumOption'
  | 'corehr.v1.company.create'
  | 'corehr.v1.company.delete'
  | 'corehr.v1.company.get'
  | 'corehr.v1.company.list'
  | 'corehr.v1.company.patch'
  | 'corehr.v1.compensationStandard.match'
  | 'corehr.v1.contract.create'
  | 'corehr.v1.contract.delete'
  | 'corehr.v1.contract.get'
  | 'corehr.v1.contract.list'
  | 'corehr.v1.contract.patch'
  | 'corehr.v1.countryRegion.get'
  | 'corehr.v1.countryRegion.list'
  | 'corehr.v1.currency.get'
  | 'corehr.v1.currency.list'
  | 'corehr.v1.customField.getByParam'
  | 'corehr.v1.customField.listObjectApiName'
  | 'corehr.v1.customField.query'
  | 'corehr.v1.department.create'
  | 'corehr.v1.department.delete'
  | 'corehr.v1.department.get'
  | 'corehr.v1.department.list'
  | 'corehr.v1.department.patch'
  | 'corehr.v1.employeeType.create'
  | 'corehr.v1.employeeType.delete'
  | 'corehr.v1.employeeType.get'
  | 'corehr.v1.employeeType.list'
  | 'corehr.v1.employeeType.patch'
  | 'corehr.v1.employment.create'
  | 'corehr.v1.employment.delete'
  | 'corehr.v1.employment.patch'
  | 'corehr.v1.jobChange.create'
  | 'corehr.v1.jobData.create'
  | 'corehr.v1.jobData.delete'
  | 'corehr.v1.jobData.get'
  | 'corehr.v1.jobData.list'
  | 'corehr.v1.jobData.patch'
  | 'corehr.v1.jobFamily.create'
  | 'corehr.v1.jobFamily.delete'
  | 'corehr.v1.jobFamily.get'
  | 'corehr.v1.jobFamily.list'
  | 'corehr.v1.jobFamily.patch'
  | 'corehr.v1.jobLevel.create'
  | 'corehr.v1.jobLevel.delete'
  | 'corehr.v1.jobLevel.get'
  | 'corehr.v1.jobLevel.list'
  | 'corehr.v1.jobLevel.patch'
  | 'corehr.v1.job.create'
  | 'corehr.v1.job.delete'
  | 'corehr.v1.job.get'
  | 'corehr.v1.job.list'
  | 'corehr.v1.job.patch'
  | 'corehr.v1.leaveGrantingRecord.create'
  | 'corehr.v1.leaveGrantingRecord.delete'
  | 'corehr.v1.leave.calendarByScope'
  | 'corehr.v1.leave.leaveBalances'
  | 'corehr.v1.leave.leaveRequestHistory'
  | 'corehr.v1.leave.leaveTypes'
  | 'corehr.v1.leave.workCalendar'
  | 'corehr.v1.leave.workCalendarDate'
  | 'corehr.v1.location.create'
  | 'corehr.v1.location.delete'
  | 'corehr.v1.location.get'
  | 'corehr.v1.location.list'
  | 'corehr.v1.nationalIdType.create'
  | 'corehr.v1.nationalIdType.delete'
  | 'corehr.v1.nationalIdType.get'
  | 'corehr.v1.nationalIdType.list'
  | 'corehr.v1.nationalIdType.patch'
  | 'corehr.v1.offboarding.query'
  | 'corehr.v1.offboarding.search'
  | 'corehr.v1.offboarding.submit'
  | 'corehr.v1.person.create'
  | 'corehr.v1.person.delete'
  | 'corehr.v1.person.get'
  | 'corehr.v1.person.patch'
  | 'corehr.v1.preHire.delete'
  | 'corehr.v1.preHire.get'
  | 'corehr.v1.preHire.list'
  | 'corehr.v1.preHire.patch'
  | 'corehr.v1.processFormVariableData.get'
  | 'corehr.v1.securityGroup.list'
  | 'corehr.v1.securityGroup.query'
  | 'corehr.v1.subdivision.get'
  | 'corehr.v1.subdivision.list'
  | 'corehr.v1.subregion.get'
  | 'corehr.v1.subregion.list'
  | 'corehr.v1.transferReason.query'
  | 'corehr.v1.transferType.query'
  | 'corehr.v1.workingHoursType.create'
  | 'corehr.v1.workingHoursType.delete'
  | 'corehr.v1.workingHoursType.get'
  | 'corehr.v1.workingHoursType.list'
  | 'corehr.v1.workingHoursType.patch';
export const corehrV1AssignedUserSearch = {
  project: 'corehr',
  name: 'corehr.v1.assignedUser.search',
  sdkName: 'corehr.v1.assignedUser.search',
  path: '/open-apis/corehr/v1/assigned_users/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-User authorization-List organization class role authorizations-Query authorization information for organizational roles',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      role_id: z
        .string()
        .describe(
          'Role ID Only supports organizational roles Role IDs can be obtained through the bulk access role list interface',
        ),
      management_scope_list: z
        .array(
          z.object({
            management_dimension: z
              .string()
              .describe(
                'Management dimension Optional values are: - department: department - work_location: workplace - company: company - social_security_location: Social Security City',
              ),
            obj_id: z.string().describe('Authorized Department/Workplace/Company/Social Security City ID'),
          }),
        )
        .describe('Management Scope Information'),
      search_method: z
        .string()
        .describe(
          'How to find Optional values are: - 1: Only look for the specified department/work place/company/social security city, if there is no authorization information, it will return empty - 2: When the specified department/work place/company/social security city has no authorization information, look up the first authorization record and return directly',
        ),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
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
export const corehrV1AuthorizationAddRoleAssign = {
  project: 'corehr',
  name: 'corehr.v1.authorization.addRoleAssign',
  sdkName: 'corehr.v1.authorization.addRoleAssign',
  path: '/open-apis/corehr/v1/authorizations/add_role_assign',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-User authorization-Authorized roles managed by organizational structure.-Authorize roles and management scope for users. Continuing to authorize users who have been authorized for a certain role will add data scope on the basis of the original authorized data scope',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      assigned_organization_items: z
        .array(
          z.array(
            z.object({
              org_key: z.string().describe('Manage object keys'),
              org_ids: z.array(z.string()).describe('Manage object id list').optional(),
              org_codes: z.array(z.string()).describe('Manage object code list').optional(),
            }),
          ),
        )
        .describe(
          'Authorization scope of the authorized role. You need to construct the structure according to the request body example.It is a two-dimensional array that you can use to authorize roles with multiple administrative dimensions, such as a Local HRBP.- ==org_key==: Management dimension. Options are - department: ==department== - work location: ==work_location== - company: ==company== - cost center: ==organization_id_strand== - Social Security City:==social_security_location== - onboarding location: ==onboarding_location== - pay group: ==pay_group== - talent pool: ==talent_pool== - custom organization types: You can view the custom organization type code under the custom organization directory in "Feishu people - Settings-Organization Settings", such as ==custom_org_01==, ==custom_org_02==, ==custom_org_03==, ==custom_org_04==, ==custom_org_05==- ==org_ids==: Organization ID. Organization ID and organization code only need to fill in one- ==org_codes==: Organization Code. Organization ID and Organization Code only need to fill in one',
        ),
    }),
    params: z.object({
      employment_id: z
        .string()
        .describe(
          'The ID of the authorized user, defaults to ==employment_id== in Feishu People. You can also use the other 3 IDs declared in the ==user_id_type==.>If you need to use the job number, you can use [ID conversion service] in exchange for ==employment_id==',
        ),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      role_id: z
        .string()
        .describe(
          'The ID of the authorized role, which can only be authorized one role at a time. You can get it using [Batch Acquire Role List], or get it in the role details (number at the end of the URL)',
        ),
    }),
  },
};
export const corehrV1AuthorizationGetByParam = {
  project: 'corehr',
  name: 'corehr.v1.authorization.getByParam',
  sdkName: 'corehr.v1.authorization.getByParam',
  path: '/open-apis/corehr/v1/authorizations/get_by_param',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-User authorization-Query individual user authorization-Query individual user authorization',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      employment_id: z
        .string()
        .describe(
          'The ID of the authorized user, defaults to ==employment_id== in Feishu personnel. You can also use the other 3 IDs declared in the user_id_type.>If you need to use the job number, you can use [ID conversion service] in exchange for ==employment_id==',
        ),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
    }),
  },
};
export const corehrV1AuthorizationQuery = {
  project: 'corehr',
  name: 'corehr.v1.authorization.query',
  sdkName: 'corehr.v1.authorization.query',
  path: '/open-apis/corehr/v1/authorizations/query',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-User authorization-Batch query user authorization-Batch query the authorization information of a single user in the "Permission Settings" in Feishu\'s personnel management backend. You can find the corresponding location by following "Feishu Personnel" - "Permission Settings". Authorization information includes employee ID, authorized roles and other information',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        employment_id_list: z
          .array(z.string())
          .describe('Employee ID list, up to 100 (if not passed, all employees will be queried by default)')
          .optional(),
        role_id_list: z.array(z.string()).describe('Role ID list, up to 100').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.string().describe('Number of records fetched per page, up to 100').optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        updated_at_gte: z.string().describe('Authorization time is greater than').optional(),
        updated_at_lte: z.string().describe('Authorization time is less than').optional(),
      })
      .optional(),
  },
};
export const corehrV1AuthorizationRemoveRoleAssign = {
  project: 'corehr',
  name: 'corehr.v1.authorization.removeRoleAssign',
  sdkName: 'corehr.v1.authorization.removeRoleAssign',
  path: '/open-apis/corehr/v1/authorizations/remove_role_assign',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Feishu People（Enterprise Edition）-User authorization-Remove the user's authorized role-Remove the specified role and authorization scope for which the user is authorized. Existing authorization can be obtained by querying [the authorization of a single user].Or view it in the Feishu [personnel management backend]",
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      employment_id: z
        .string()
        .describe(
          'The ID of the authorized user, defaults to ==employment_id== in Feishu People. You can also use the other 3 IDs declared in the ==user_id_type==.>If you need to use the job number, you can use [ID conversion service] in exchange for ==employment_id==',
        ),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      role_id: z
        .string()
        .describe(
          'The ID of the character being removed., which can only be removed one role at a time. You can get it using [Get a list of roles in batches], or get (the number at the end of the URL) role_id from the URL of the Feishu personnel role details page',
        ),
    }),
  },
};
export const corehrV1AuthorizationUpdateRoleAssign = {
  project: 'corehr',
  name: 'corehr.v1.authorization.updateRoleAssign',
  sdkName: 'corehr.v1.authorization.updateRoleAssign',
  path: '/open-apis/corehr/v1/authorizations/update_role_assign',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-User authorization-更新组织类角色授权范围-Update the administrative scope of the role authorizationThe updated data range is subject to the data range submitted this time, and the unsubmitted part will be removed',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      assigned_organization_items: z
        .array(
          z.array(
            z.object({
              org_key: z.string().describe('Manage object keys'),
              org_ids: z.array(z.string()).describe('Manage object id list').optional(),
              org_codes: z.array(z.string()).describe('Manage object code list').optional(),
            }),
          ),
        )
        .describe(
          'Authorization scope of the authorized role. You need to construct the structure according to the request body example.It is a two-dimensional array that you can use to authorize roles with multiple administrative dimensions, such as a Local HRBP.- ==org_key==: Management dimension. Options are - Department: ==department== - Place of work: ==work_location== - Company: ==company== - cost center: ==organization_id_strand== - Social Security City: ==social_security_location== - Location: ==onboarding_location== - Salary group: ==pay_group== - Talent pool: ==talent_pool== - Custom Organization: You can view the custom organization type code under the custom organization directory in "Feishu People-Settings-Organization Settings", such as ==custom_org_01==, ==custom_org_02==, ==custom_org_03==, ==custom_org_04==, ==custom_org_05==- ==org_ids==: Organization ID. Organization ID and organization code only need to fill in one- ==org_codes==: Organization Code. Organization ID and Organization Code only need to fill in one',
        ),
    }),
    params: z.object({
      employment_id: z
        .string()
        .describe(
          'The ID of the authorized user, defaults to ==employment_id== in Feishu People. You can also use the other 3 IDs declared in the ==user_id_type==.>If you need to use the job number, you can use [ID conversion service] in exchange for ==employment_id==',
        ),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      role_id: z
        .string()
        .describe(
          'The ID of the authorized role, which can only be authorized one role at a time. You can get it using [Get a list of roles in batches], or get it in the role details (number at the end of the URL)',
        ),
    }),
  },
};
export const corehrV1CommonDataIdConvert = {
  project: 'corehr',
  name: 'corehr.v1.commonDataId.convert',
  sdkName: 'corehr.v1.commonDataId.convert',
  path: '/open-apis/corehr/v1/common_data/id/convert',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-ID Service-ID Convert-This interface is used to perform various ID conversions in Feishu People, Feishu Contacts, and people admin (Only applied to CoreHR new link tenants)',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      ids: z
        .array(z.string())
        .describe('ID list (up to 100 IDs are passed in, and the ID length is limited to 50 characters)'),
    }),
    params: z.object({
      id_transform_type: z
        .number()
        .describe(
          'ID conversion type Options:1(CoreHR2Feishu Feishu People - > Feishu Contacts),2(Feishu2CoreHR Feishu Contacts - > Feishu People),3(Admin2Feishu People Admin - > Feishu Contacts),4(Admin2CoreHR People admin - > Feishu People)',
        ),
      id_type: z
        .enum(['user_id', 'department_id', 'job_level_id', 'job_family_id', 'employee_type_id'])
        .describe(
          'ID type to convert Options:user_id(EmploymentID Employee ID, when user_id is selected and id_transform_type 1, 2, 4, feishu_user_id_type required),department_id(DepartmentID Department ID, when department_id is selected and id_transform_type 1, 2, 4, feishu_department_id_type required),job_level_id(JobLevelID rank ID),job_family_id(JobFamilyID Serial ID),employee_type_id(EmployeeTypeID Person Type ID, the Person Type ID of people admin is equal to the enum value of directory. Therefore, no conversion is required when the id transform type is 3)',
        ),
      feishu_user_id_type: z
        .enum(['open_id', 'union_id', 'user_id'])
        .describe(
          'User ID categories Options:open_id(Identifies the identity of a user in an application. The same user has different Open IDs in different applications. [Learn more: How to get an Open ID]),union_id(Identifies the identity of a user under an application developer. The Union ID of the same user in an application under the same developer is the same, and the Union ID in an application under different developers is different. With Union ID, application developers can associate the identity of the same user in multiple applications. [Learn more: How to get Union ID?]),user_id(Identifies the identity of a user in a tenant. The user ID of the same user in tenant A and tenant B is different. Within the same tenant, the user ID of a user is consistent in all applications (including store applications). User IDs are mainly used to connect user data between different applications. [Learn more: How to get a User ID?])',
        )
        .optional(),
      feishu_department_id_type: z
        .enum(['open_department_id', 'department_id'])
        .describe(
          'The type of department ID used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV1CommonDataMetaDataAddEnumOption = {
  project: 'corehr',
  name: 'corehr.v1.commonDataMetaData.addEnumOption',
  sdkName: 'corehr.v1.commonDataMetaData.addEnumOption',
  path: '/open-apis/corehr/v1/common_data/meta_data/add_enum_option',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Meta data-Add enumeration value option-Add field enumeration value option',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      object_api_name: z.string().describe('Owned object apiname'),
      enum_field_api_name: z.string().describe('Enumeration field apiname'),
      enum_field_options: z
        .array(
          z.object({
            option_api_name: z.string().describe('Option apiname, which is the unique identifier of the option'),
            name: z
              .object({
                zh_cn: z.string().describe('Chinese').optional(),
                en_us: z.string().describe('English').optional(),
              })
              .describe('Option name (fill in at least one language name)'),
          }),
        )
        .describe('Add enumeration options list'),
    }),
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
export const corehrV1CommonDataMetaDataEditEnumOption = {
  project: 'corehr',
  name: 'corehr.v1.commonDataMetaData.editEnumOption',
  sdkName: 'corehr.v1.commonDataMetaData.editEnumOption',
  path: '/open-apis/corehr/v1/common_data/meta_data/edit_enum_option',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Meta data-Modify enumeration value options-Modify field enumeration value options',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      object_api_name: z.string().describe('Owned object apiname'),
      enum_field_api_name: z.string().describe('Enumeration field apiname'),
      enum_field_option: z
        .object({
          option_api_name: z.string().describe('Option API name, which is the unique identifier of the option'),
          active: z.boolean().describe('Whether to enable'),
          name: z
            .object({
              zh_cn: z.string().describe('Chinese').optional(),
              en_us: z.string().describe('English').optional(),
            })
            .describe('Option name (fill in at least one language name)'),
        })
        .describe('Enumeration options'),
    }),
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
export const corehrV1CompanyCreate = {
  project: 'corehr',
  name: 'corehr.v1.company.create',
  sdkName: 'corehr.v1.company.create',
  path: '/open-apis/corehr/v1/companies',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Company-Create company-Support for adding company information in a single interface, including company basic information, registered address information, work address information, etc',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      hiberarchy_common: z
        .object({
          parent_id: z.string().describe('Parent organization').optional(),
          name: z
            .array(
              z.object({
                lang: z
                  .string()
                  .describe(
                    'Language.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US',
                  ),
                value: z
                  .string()
                  .describe(
                    'Content.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US',
                  ),
              }),
            )
            .describe('name'),
          active: z.boolean().describe('Enable the company'),
          effective_time: z
            .string()
            .describe(
              'Version effective date- Fill in the format: YYYY-MM-DD 00:00:00 (the system will automatically change the hours, minutes and seconds to 00:00:00)- The system defaults to take effect at 00:00:00 on the day when the date is filled in- This interface only supports the smallest unit of day- Date range requirements: 1900-01-01 00:00:00～9999-12-31 23:59:59',
            )
            .optional(),
          code: z
            .string()
            .describe(
              'Company code (cannot be duplicated with other records)- When turning on automatic encoding, if no value is passed, the encoding will be automatically generated, otherwise the incoming value shall prevail- When automatic encoding is not enabled, the encoding will not be automatically generated without passing the value',
            )
            .optional(),
          description: z
            .array(
              z.object({
                lang: z
                  .string()
                  .describe(
                    'Language.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US',
                  ),
                value: z
                  .string()
                  .describe(
                    'Content.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US',
                  ),
              }),
            )
            .describe('Description')
            .optional(),
          custom_fields: z
            .array(
              z.object({
                field_name: z.string().describe('Field name'),
                value: z
                  .string()
                  .describe(
                    'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                  ),
              }),
            )
            .describe('Custom fields')
            .optional(),
        })
        .describe(
          "Company basic information, the structure maintains the company's name, code, enabling status, parent company and other basic information",
        ),
      type: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe(
          'The nature of the company is obtained through the [Get Field Details] query. Request parameters: object_api_name = company; custom_api_name = type',
        )
        .optional(),
      industry_list: z
        .array(z.object({ enum_name: z.string().describe('Enumeration value') }))
        .describe(
          'The industry is located, and it is obtained through the [Get Field Details] query. Request parameters: object_api_name = company; custom_api_name = industry',
        )
        .optional(),
      legal_representative: z
        .array(
          z.object({
            lang: z
              .string()
              .describe('Language.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US'),
            value: z
              .string()
              .describe('Content.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US'),
          }),
        )
        .describe(
          'Legal Representative.Only when the country/region in the registered address is not Chinese mainland, the legal representative field is valid.If the country/region in the registered address is not Chinese mainland, then filling in the legal representative field is invalid',
        )
        .optional(),
      post_code: z.string().describe('Zip Code').optional(),
      tax_payer_id: z.string().describe('Taxpayer identification number').optional(),
      confidential: z
        .boolean()
        .describe('Whether it is confidential, this function is not supported for the time being and can be ignored')
        .optional(),
      sub_type_list: z
        .array(z.object({ enum_name: z.string().describe('Enumeration value') }))
        .describe(
          'Company principal type, obtained by [Get Field Details] query. Request parameters: object_api_name = company; custom_api_name = subtype',
        )
        .optional(),
      branch_company: z.boolean().describe('Is it a branch office?').optional(),
      primary_manager: z
        .array(
          z.object({
            lang: z
              .string()
              .describe('Language.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US'),
            value: z
              .string()
              .describe('Content.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US'),
          }),
        )
        .describe('Main person in charge')
        .optional(),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('Field name'),
            value: z
              .string()
              .describe(
                'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
              ),
          }),
        )
        .describe('Custom fields')
        .optional(),
      currency: z
        .object({
          currency_name: z
            .array(
              z.object({
                lang: z
                  .string()
                  .describe(
                    'language.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US',
                  ),
                value: z
                  .string()
                  .describe(
                    'content.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US',
                  ),
              }),
            )
            .describe('currency name')
            .optional(),
          numeric_code: z
            .number()
            .describe(
              'The reference code of the corresponding currency. obtained through the [Search currency information v2]',
            )
            .optional(),
          currency_alpha_3_code: z
            .string()
            .describe(
              'Legal currency corresponding codes, such as CNY, USD, etc.obtained through the [Search currency information v2]',
            )
            .optional(),
        })
        .describe('Default currency')
        .optional(),
      phone: z
        .object({
          area_code: z
            .object({ enum_name: z.string().describe('Area code corresponding name') })
            .describe(
              'The number corresponding to the area code.[Request Interface]Query and obtain. Request parameters: object_api_name = phone; custom_api_name = international_area_code',
            ),
          phone_number: z.string().describe('number'),
        })
        .describe('Telephone')
        .optional(),
      fax: z
        .object({
          area_code: z
            .object({ enum_name: z.string().describe('Area code corresponding name') })
            .describe(
              'area code.[Request Interface]Query and obtain. Request parameters: object_api_name = phone; custom_api_name = international_area_code',
            ),
          phone_number: z.string().describe('number'),
        })
        .describe('fax')
        .optional(),
      registered_office_address_info: z
        .object({
          country_region_id: z
            .string()
            .describe(
              'Country/region ID.The fields for each country/region can be queried by referring to [Address Filling Rules][Request Interface]Query and obtain',
            ),
          region_id: z
            .string()
            .describe('main administrative region ID.[Request Interface]Query and obtain')
            .optional(),
          city_id: z.string().describe('City ID.[Request Interface]Query and obtain').optional(),
          distinct_id: z.string().describe('District/County ID,[Request Interface]Query and obtain').optional(),
          address_line1: z.string().describe('Address line 1').optional(),
          address_line2: z.string().describe('Address line 2').optional(),
          address_line3: z.string().describe('Address line 3').optional(),
          address_line4: z.string().describe('Address line 4').optional(),
          address_line5: z.string().describe('Address line 5').optional(),
          address_line6: z.string().describe('Address line 6').optional(),
          address_line7: z.string().describe('Address line 7').optional(),
          address_line8: z.string().describe('Address line 8').optional(),
          address_line9: z.string().describe('Address line 9').optional(),
          local_address_line1: z.string().describe('Address line 1 (non-Latin native characters)').optional(),
          local_address_line2: z.string().describe('Address line 2 (non-Latin native characters)').optional(),
          local_address_line3: z.string().describe('Address line 3 (non-Latin native characters)').optional(),
          local_address_line4: z.string().describe('Address line 4 (non-Latin native characters)').optional(),
          local_address_line5: z.string().describe('Address line 5 (non-Latin native characters)').optional(),
          local_address_line6: z.string().describe('Address line 6 (non-Latin native characters)').optional(),
          local_address_line7: z.string().describe('Address line 7 (non-Latin native characters)').optional(),
          local_address_line8: z.string().describe('Address line 8 (non-Latin native characters)').optional(),
          local_address_line9: z.string().describe('Address line 9 (non-Latin native characters)').optional(),
          postal_code: z.string().describe('Postal Code').optional(),
        })
        .describe('Registered address details. Public field, required if the request is for a company')
        .optional(),
      office_address_info: z
        .object({
          country_region_id: z
            .string()
            .describe(
              'Country/region ID.The fields for each country/region can be queried by referring to [Address Filling Rules]。[Request Interface]Query and obtain',
            ),
          region_id: z
            .string()
            .describe('main administrative region ID.[Request Interface]Query and obtain')
            .optional(),
          city_id: z.string().describe('City ID.[Request Interface]Query and obtain').optional(),
          distinct_id: z.string().describe('District/County Id. [Request Interface]Query and obtain').optional(),
          address_line1: z.string().describe('Address line 1').optional(),
          address_line2: z.string().describe('Address line 2').optional(),
          address_line3: z.string().describe('Address line 3').optional(),
          address_line4: z.string().describe('Address line 4').optional(),
          address_line5: z.string().describe('Address line 5').optional(),
          address_line6: z.string().describe('Address line 6').optional(),
          address_line7: z.string().describe('Address line 7').optional(),
          address_line8: z.string().describe('Address line 8').optional(),
          address_line9: z.string().describe('Address line 9').optional(),
          local_address_line1: z.string().describe('Address line 1 (non-Latin native characters)').optional(),
          local_address_line2: z.string().describe('Address line 2 (non-Latin native characters)').optional(),
          local_address_line3: z.string().describe('Address line 3 (non-Latin native characters)').optional(),
          local_address_line4: z.string().describe('Address line 4 (non-Latin native characters)').optional(),
          local_address_line5: z.string().describe('Address line 5 (non-Latin native characters)').optional(),
          local_address_line6: z.string().describe('Address line 6 (non-Latin native characters)').optional(),
          local_address_line7: z.string().describe('Address line 7 (non-Latin native characters)').optional(),
          local_address_line8: z.string().describe('Address line 8 (non-Latin native characters)').optional(),
          local_address_line9: z.string().describe('Address line 9 (non-Latin native characters)').optional(),
          postal_code: z.string().describe('Postal Code').optional(),
        })
        .describe('Office address details. Public field, required if the request is for a company')
        .optional(),
    }),
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
export const corehrV1CompanyDelete = {
  project: 'corehr',
  name: 'corehr.v1.company.delete',
  sdkName: 'corehr.v1.company.delete',
  path: '/open-apis/corehr/v1/companies/:company_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Company-Delete company-Delete company',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      company_id: z
        .string()
        .describe(
          'The company ID that needs to be deleted. How to get the ID:- Call [Create Company] [Batch Query Company] and other interfaces to return the department ID',
        ),
    }),
  },
};
export const corehrV1CompanyGet = {
  project: 'corehr',
  name: 'corehr.v1.company.get',
  sdkName: 'corehr.v1.company.get',
  path: '/open-apis/corehr/v1/companies/:company_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Company-Query a single company-Query individual companies by ID',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      company_id: z
        .string()
        .describe(
          'The company ID to be queried. How to get the ID:- Call [Create Company] [Batch Query Company] and other interfaces to return the department ID',
        ),
    }),
  },
};
export const corehrV1CompanyList = {
  project: 'corehr',
  name: 'corehr.v1.company.list',
  sdkName: 'corehr.v1.company.list',
  path: '/open-apis/corehr/v1/companies',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Company-Get company list-Page query company, you can page through the full amount of company data',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
    }),
  },
};
export const corehrV1CompanyPatch = {
  project: 'corehr',
  name: 'corehr.v1.company.patch',
  sdkName: 'corehr.v1.company.patch',
  path: '/open-apis/corehr/v1/companies/:company_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Company-Update company-Update company information, including basic information, registered address, office address, etc',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        hiberarchy_common: z
          .object({
            parent_id: z.string().describe('parent organization').optional(),
            name: z
              .array(
                z.object({
                  lang: z
                    .string()
                    .describe(
                      'language.This supports Chinese and English. For Chinese, use zh-CN for English, use en-US',
                    ),
                  value: z.string().describe('content.This supports Chinese and English'),
                }),
              )
              .describe(
                'name- There will be a globally unique check for the Chinese and English names of the Job level- Name cannot contain 「/」「；」「;」 characters',
              )
              .optional(),
            active: z.boolean().describe('Whether to enable').optional(),
            effective_time: z
              .string()
              .describe(
                'Version effective date- Fill in the format: YYYY-MM-DD 00:00:00 (the system will automatically change the hours, minutes and seconds to 00:00:00)- The system defaults to take effect at 00:00:00 on the day when the date is filled in- This interface only supports the smallest unit of day- Date range requirements: 1900-01-01 00:00:00～9999-12-31 23:59:59',
              ),
            code: z
              .string()
              .describe(
                'Company Code (cannot be repeated with the encoding of other records), this field will be invalid when automatic encoding is turned on',
              )
              .optional(),
            description: z
              .array(
                z.object({
                  lang: z
                    .string()
                    .describe(
                      'language.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US',
                    ),
                  value: z.string().describe('content.This supports Chinese and English'),
                }),
              )
              .describe('describe')
              .optional(),
          })
          .describe('Hierarchical relationship, see entity for inner fields')
          .optional(),
        type: z
          .object({ enum_name: z.string().describe('enumeration value') })
          .describe(
            'Company properties, enumeration values are available in the document [Feishu personnel enumeration constants] Company type (company_type) enumeration definition section',
          )
          .optional(),
        industry_list: z
          .array(z.object({ enum_name: z.string().describe('enumeration value') }))
          .describe(
            'The industry is located, and it is obtained through the Get Field Details query. Request parameters: object_api_name = company; custom_api_name = industry',
          )
          .optional(),
        legal_representative: z
          .array(
            z.object({
              lang: z
                .string()
                .describe('language.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US'),
              value: z.string().describe('content.This supports Chinese and English'),
            }),
          )
          .describe(
            'legal representative.Only when the country/region in the registered address is Chinese mainland, the legal representative field is valid.If the country/region in the registered address is not Chinese mainland, then filling in the legal representative field is invalid',
          )
          .optional(),
        post_code: z.string().describe('zip code').optional(),
        tax_payer_id: z.string().describe('Taxpayer identification number').optional(),
        confidential: z.boolean().describe('Confidential').optional(),
        sub_type_list: z
          .array(z.object({ enum_name: z.string().describe('enumeration value') }))
          .describe(
            'Company principal type, obtained by Get Field Details query. Request parameters: object_api_name = company; custom_api_name = subtype',
          )
          .optional(),
        branch_company: z.boolean().describe('Is it a branch office?').optional(),
        primary_manager: z
          .array(
            z.object({
              lang: z
                .string()
                .describe('language.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US'),
              value: z.string().describe('content.This supports Chinese and English'),
            }),
          )
          .describe('main person in charge')
          .optional(),
        currency: z
          .object({
            currency_name: z
              .array(
                z.object({
                  lang: z
                    .string()
                    .describe(
                      'language.This supports Chinese and English. For Chinese, use zh-CN; for English, use en-US',
                    ),
                  value: z.string().describe('content.This supports Chinese and English'),
                }),
              )
              .describe('currency name')
              .optional(),
            numeric_code: z
              .number()
              .describe(
                'The reference code of the corresponding currency can be found through the internal system.obtained through the[Search currency information v2]',
              )
              .optional(),
            currency_alpha_3_code: z
              .string()
              .describe(
                'Legal tender corresponding codes, such as CNY, USD, etc.obtained through the [Search currency information v2]',
              )
              .optional(),
          })
          .describe('Default currency')
          .optional(),
        phone: z
          .object({
            area_code: z
              .object({
                enum_name: z
                  .string()
                  .describe(
                    'enumeration value.[Request Interface]Query and obtain. Request parameters: object_api_name = phone; custom_api_name = international_area_code',
                  ),
              })
              .describe('area code'),
            phone_number: z.string().describe('number'),
          })
          .describe('Telephone')
          .optional(),
        fax: z
          .object({
            area_code: z
              .object({
                enum_name: z
                  .string()
                  .describe(
                    'enumeration value.[Request Interface]Query and obtain. Request parameters: object_api_name = phone; custom_api_name = international_area_code',
                  ),
              })
              .describe('area code'),
            phone_number: z.string().describe('number'),
          })
          .describe('fax')
          .optional(),
        registered_office_address_info: z
          .object({
            country_region_id: z
              .string()
              .describe(
                'Country/Region ID. The fields for each country/region can be queried by referring to[Address Filling Rules]。.[Request Interface]Query and obtain',
              ),
            region_id: z
              .string()
              .describe('main administrative region ID.[Request Interface]Query and obtain')
              .optional(),
            city_id: z.string().describe('City ID, [Request Interface]Query and obtain').optional(),
            distinct_id: z
              .string()
              .describe('District/County ID, [Request Interface]Query and obtain.this field is pending')
              .optional(),
            address_line1: z.string().describe('Address line 1').optional(),
            address_line2: z.string().describe('Address line 2').optional(),
            address_line3: z.string().describe('Address line 3').optional(),
            address_line4: z.string().describe('Address line 4').optional(),
            address_line5: z.string().describe('Address line 5').optional(),
            address_line6: z.string().describe('Address line 6').optional(),
            address_line7: z.string().describe('Address line 7').optional(),
            address_line8: z.string().describe('Address line 8').optional(),
            address_line9: z.string().describe('Address line 9').optional(),
            local_address_line1: z.string().describe('Address line 1 (non-Latin native characters)').optional(),
            local_address_line2: z.string().describe('Address line 2 (non-Latin native characters)').optional(),
            local_address_line3: z.string().describe('Address line 3 (non-Latin native characters)').optional(),
            local_address_line4: z.string().describe('Address line 4 (non-Latin native characters)').optional(),
            local_address_line5: z.string().describe('Address line 5 (non-Latin native characters)').optional(),
            local_address_line6: z.string().describe('Address line 6 (non-Latin native characters)').optional(),
            local_address_line7: z.string().describe('Address line 7 (non-Latin native characters)').optional(),
            local_address_line8: z.string().describe('Address line 8 (non-Latin native characters)').optional(),
            local_address_line9: z.string().describe('Address line 9 (non-Latin native characters)').optional(),
            postal_code: z.string().describe('Postal Code').optional(),
          })
          .describe('Registered address details. Public field, required if the request is for a company')
          .optional(),
        office_address_info: z
          .object({
            country_region_id: z
              .string()
              .describe(
                'Country/Region ID. The fields for each country/region can be queried by referring to[Address Filling Rules]。[Request Interface]Query and obtain',
              ),
            region_id: z
              .string()
              .describe('main administrative region ID.[Request Interface]Query and obtain')
              .optional(),
            city_id: z.string().describe('City ID,[Request Interface]Query and obtain').optional(),
            distinct_id: z.string().describe('District/County ID,[Request Interface]Query and obtain').optional(),
            address_line1: z.string().describe('Address line 1').optional(),
            address_line2: z.string().describe('Address line 2').optional(),
            address_line3: z.string().describe('Address line 3').optional(),
            address_line4: z.string().describe('Address line 4').optional(),
            address_line5: z.string().describe('Address line 5').optional(),
            address_line6: z.string().describe('Address line 6').optional(),
            address_line7: z.string().describe('Address line 7').optional(),
            address_line8: z.string().describe('Address line 8').optional(),
            address_line9: z.string().describe('Address line 9').optional(),
            local_address_line1: z.string().describe('Address line 1 (non-Latin native characters)').optional(),
            local_address_line2: z.string().describe('Address line 2 (non-Latin native characters)').optional(),
            local_address_line3: z.string().describe('Address line 3 (non-Latin native characters)').optional(),
            local_address_line4: z.string().describe('Address line 4 (non-Latin native characters)').optional(),
            local_address_line5: z.string().describe('Address line 5 (non-Latin native characters)').optional(),
            local_address_line6: z.string().describe('Address line 6 (non-Latin native characters)').optional(),
            local_address_line7: z.string().describe('Address line 7 (non-Latin native characters)').optional(),
            local_address_line8: z.string().describe('Address line 8 (non-Latin native characters)').optional(),
            local_address_line9: z.string().describe('Address line 9 (non-Latin native characters)').optional(),
            postal_code: z.string().describe('Postal Code').optional(),
          })
          .describe('Office address details. Public field, required if the request is for a company')
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
      company_id: z
        .string()
        .describe(
          'The company ID that needs to be updated. How to get the ID:- Call [Create Company] [Batch Query Company] and other interfaces to return the department ID',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const corehrV1CompensationStandardMatch = {
  project: 'corehr',
  name: 'corehr.v1.compensationStandard.match',
  sdkName: 'corehr.v1.compensationStandard.match',
  path: '/open-apis/corehr/v1/compensation_standards/match',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic Compensation-Salary standard-Get employee salary standards-- Call this interface to get salary scale information that matches the employee- When requesting, you can optionally pass the employee's department ID, job level ID, sequence ID and other filter conditions to match the salary standard.- This interface will return all information of salary standards that employees can match, including salary standard table ID, salary level, salary bandwidth, salary standard value, etc",
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call. When passing in the department ID, this parameter needs to be passed in. Options:open_department_id([FeiShu]Identify departments by open_department_id),department_id([FeiShu]Identify departments by department_id),people_corehr_department_id([FeiShu_People]Identify departments by people_corehr_department_id)',
        )
        .optional(),
      employment_id: z
        .string()
        .describe(
          'Employment ID，obtain through the interface[【Batch access to employee information through employee ID】]',
        )
        .optional(),
      reference_object_api: z
        .enum(['cpst_item', 'cpst_indicator'])
        .describe(
          'The associated object, item or indicator of the salary standard Options:cpst_item(Salary items),cpst_indicator(Salary Statistics)',
        )
        .optional(),
      reference_object_id: z
        .string()
        .describe(
          'Salary Standard Associated Object ID，cpst_item ID / cpst_indicator ID, obtain through the interface[【Batch query compensation component】] and the interface[【Batch query compensation metric】]',
        ),
      department_id: z
        .string()
        .describe('Department ID，obtain through the interface[【Get department list】]')
        .optional(),
      work_location_id: z
        .string()
        .describe('Workplace ID，obtain through the interface[【Get location list】]')
        .optional(),
      company_id: z.string().describe('Company ID，obtain through the interface[【Get company list】]').optional(),
      job_family_id: z
        .string()
        .describe('Job Serial ID，obtain through the interface[【Get the list of job family】]')
        .optional(),
      job_id: z.string().describe('Job ID，obtain through the interface[【Get the list of job profile】]').optional(),
      job_level_id: z
        .string()
        .describe('Rank ID，obtain through the interface[【Get the list of job level】]')
        .optional(),
      employee_type_id: z
        .string()
        .describe('Person type ID，obtain through the interface[【Get the list of workforce type】]')
        .optional(),
      recruitment_type: z
        .enum(['experienced_professionals', 'recent_graduates', 'routine_intern'])
        .describe(
          'Recruitment type Options:experienced_professionals(Social Recruitment),recent_graduates(Campus recruitment),routine_intern(Daily Internship)',
        )
        .optional(),
      cpst_change_reason_id: z
        .string()
        .describe(
          'Reason for fixed salary adjustment ID, obtain through the interface[【Batch query reason for compensation setting and adjustment】]',
        )
        .optional(),
      cpst_plan_id: z
        .string()
        .describe('Salary Plan ID, obtain through the interface[【Batch query compensation plan】]')
        .optional(),
      cpst_salary_level_id: z.string().describe('Salary Scale Salary Level ID').optional(),
      effective_time: z.string().describe('Effective time(Millisecond-level timestamp)').optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const corehrV1ContractCreate = {
  project: 'corehr',
  name: 'corehr.v1.contract.create',
  sdkName: 'corehr.v1.contract.create',
  path: '/open-apis/corehr/v1/contracts',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Contract-Create contract-Create an employee contract directly through this interface',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      effective_time: z.string().describe('Contract start date'),
      expiration_time: z.string().describe('Actual end date').optional(),
      employment_id: z.string().describe('Employment ID, you can get more information by[get employment infomation]'),
      contract_type: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe(
          'Contract type can be obtained through the document[Get field details] with param:- object_api_name：contract- custom_api_name：contract_type',
        ),
      first_party_company_id: z
        .string()
        .describe('Company ID, Company Info can be obtained through the document [Get company by ID]'),
      person_id: z
        .string()
        .describe('Person Info can be obtained through the document [Get personal information by ID]')
        .optional(),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('Field name'),
            value: z
              .string()
              .describe(
                'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
              ),
          }),
        )
        .describe('Custom fields, reserved, current not supported')
        .optional(),
      duration_type: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe(
          'Duration type can be obtained through the document [Feishu CoreHR enumeration constants]duration type enumeration definition section',
        )
        .optional(),
      contract_end_date: z.string().describe('Contract end date').optional(),
      contract_number: z.string().describe('Contract Number').optional(),
      signing_type: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe(
          'Signing type can be obtained through the document [Feishu CoreHR enumeration constants]signing type enumeration definition section',
        )
        .optional(),
    }),
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
export const corehrV1ContractDelete = {
  project: 'corehr',
  name: 'corehr.v1.contract.delete',
  sdkName: 'corehr.v1.contract.delete',
  path: '/open-apis/corehr/v1/contracts/:contract_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Contract-Delete contract-Delete the contract data directly through this interface. It cannot be queried after deletion. Please operate with caution',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      contract_id: z.string().describe('Contract ID to be deleted, which can be obtained through [Get contract list]'),
    }),
  },
};
export const corehrV1ContractGet = {
  project: 'corehr',
  name: 'corehr.v1.contract.get',
  sdkName: 'corehr.v1.contract.get',
  path: '/open-apis/corehr/v1/contracts/:contract_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Contract-Query a single contract-This interface is used to query the details of a single contract based on the contract ID',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      contract_id: z.string().describe('Contract ID, which can be obtained through [Get contract list]'),
    }),
  },
};
export const corehrV1ContractList = {
  project: 'corehr',
  name: 'corehr.v1.contract.list',
  sdkName: 'corehr.v1.contract.list',
  path: '/open-apis/corehr/v1/contracts',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Contract-Get contract list-Through this interface, you can query contract list information in batches. Currently, other filtering conditions are not supported, and a single query supports up to 50 pieces of data',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size; 0~50'),
    }),
  },
};
export const corehrV1ContractPatch = {
  project: 'corehr',
  name: 'corehr.v1.contract.patch',
  sdkName: 'corehr.v1.contract.patch',
  path: '/open-apis/corehr/v1/contracts/:contract_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Contract-Update contract-Information related to employee contracts can be updated through this interface, and parameters that have not been modified will retain their original values',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        effective_time: z.string().describe('Contract start date').optional(),
        expiration_time: z.string().describe('Actual end date').optional(),
        employment_id: z
          .string()
          .describe('You should not use this parameter otherwise, the interface will give an error')
          .optional(),
        contract_type: z
          .object({ enum_name: z.string().describe('Enumeration value') })
          .describe(
            'Contract type can be obtained through the document [Feishu CoreHR enumeration constants]contract_type enumeration definition section',
          )
          .optional(),
        first_party_company_id: z
          .string()
          .describe('Company ID, Company Info can be obtained through the document [Get company by ID]')
          .optional(),
        person_id: z
          .string()
          .describe('You should not use this parameter; otherwise, the interface will give an error')
          .optional(),
        custom_fields: z
          .array(
            z.object({
              field_name: z.string().describe('Field name'),
              value: z
                .string()
                .describe(
                  'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                ),
            }),
          )
          .describe('Custom fields')
          .optional(),
        duration_type: z
          .object({ enum_name: z.string().describe('Enumeration value') })
          .describe(
            'Duration type can be obtained through the document [Feishu CoreHR enumeration constants]duration type enumeration definition section',
          )
          .optional(),
        contract_end_date: z.string().describe('Contract end date').optional(),
        contract_number: z.string().describe('Contract Number').optional(),
        signing_type: z
          .object({ enum_name: z.string().describe('Enumeration value') })
          .describe(
            'Signing type can be obtained through the document [Feishu CoreHR enumeration constants]signing type enumeration definition section',
          )
          .optional(),
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
    path: z.object({
      contract_id: z.string().describe('Contract ID, which can be obtained through [Get contract list]'),
    }),
  },
};
export const corehrV1CountryRegionGet = {
  project: 'corehr',
  name: 'corehr.v1.countryRegion.get',
  sdkName: 'corehr.v1.countryRegion.get',
  path: '/open-apis/corehr/v1/country_regions/:country_region_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-basic data-Location data-Search a single country/region information-Search a single country/region information',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ country_region_id: z.string().describe('Country/Region ID') }),
  },
};
export const corehrV1CountryRegionList = {
  project: 'corehr',
  name: 'corehr.v1.countryRegion.list',
  sdkName: 'corehr.v1.countryRegion.list',
  path: '/open-apis/corehr/v1/country_regions',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-basic data-Location data-Query country/region information in batches-Query country/region information in batches',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
    }),
  },
};
export const corehrV1CurrencyGet = {
  project: 'corehr',
  name: 'corehr.v1.currency.get',
  sdkName: 'corehr.v1.currency.get',
  path: '/open-apis/corehr/v1/currencies/:currency_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-basic data-Currency information-Query single currency information-Query single currency information',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ currency_id: z.string().describe('Currency ID') }),
  },
};
export const corehrV1CurrencyList = {
  project: 'corehr',
  name: 'corehr.v1.currency.list',
  sdkName: 'corehr.v1.currency.list',
  path: '/open-apis/corehr/v1/currencies',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-basic data-Currency information-Query currency information in batches-Query currency information in batches',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
    }),
  },
};
export const corehrV1CustomFieldGetByParam = {
  project: 'corehr',
  name: 'corehr.v1.customField.getByParam',
  sdkName: 'corehr.v1.customField.getByParam',
  path: '/open-apis/corehr/v1/custom_fields/get_by_param',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Meta data-Get field details-Get the details of a field under a specific "Feishu Personnel" object. Both system standard and user defined fields are supported. Could be used to get e.g. the enum option list in an enum field, the custom field list in a lookup field, and so on. Please refer to the operation manual ["How to operate custom fields through OpenAPI] for more details',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      object_api_name: z.string().describe('Object API name'),
      custom_api_name: z.string().describe('Field API name'),
    }),
  },
};
export const corehrV1CustomFieldListObjectApiName = {
  project: 'corehr',
  name: 'corehr.v1.customField.listObjectApiName',
  sdkName: 'corehr.v1.customField.listObjectApiName',
  path: '/open-apis/corehr/v1/custom_fields/list_object_api_name',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Meta data-Get a list of Feishu personnel objects-Get a list of objects in "Feishu Personnel", including system preset objects and custom objects',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
    }),
  },
};
export const corehrV1CustomFieldQuery = {
  project: 'corehr',
  name: 'corehr.v1.customField.query',
  sdkName: 'corehr.v1.customField.query',
  path: '/open-apis/corehr/v1/custom_fields/query',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Meta data-Get a list of custom fields-Get the list of custom fields under specified "Feishu Personnel" objects. Please refer to the operation manual ["How to operate custom fields through OpenAPI] for more details',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({ object_api_name_list: z.array(z.string()).describe('Object apiname') }),
  },
};
export const corehrV1DepartmentCreate = {
  project: 'corehr',
  name: 'corehr.v1.department.create',
  sdkName: 'corehr.v1.department.create',
  path: '/open-apis/corehr/v1/departments',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Department-Create department-Support department information addition in a single interface, including department basic information, department head, department custom field information, etc',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      sub_type: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe(
          'Department type, obtained through the[request interface]query. Request parameters: object_api_name = department; custom_api_name = subtype',
        )
        .optional(),
      manager: z
        .string()
        .describe(
          'department head- Detailed information can be obtained through the [Search Employee Information] or [Batch Query Employee] interface',
        )
        .optional(),
      is_confidential: z.boolean().describe('Is it confidential?').optional(),
      hiberarchy_common: z
        .object({
          parent_id: z
            .string()
            .describe(
              'The parent organization ID, this field is a general field, if it is a department dimension, it is required. Details can be obtained through the [Query a single department] interface',
            )
            .optional(),
          name: z
            .array(
              z.object({
                lang: z
                  .string()
                  .describe(
                    'Name information language, support Chinese and English. Chinese with zh-CN; English with en-US',
                  ),
                value: z
                  .string()
                  .describe(
                    'The content of the name information supports Chinese and English. Fill in the specificationThe name cannot contain 「/」「；」「;」 characters.- Enabled department names of the same superior department are not allowed to be duplicated',
                  ),
              }),
            )
            .describe('Name'),
          active: z.boolean().describe('Enable the department'),
          code: z.string().describe('Encoding').optional(),
          description: z
            .array(
              z.object({
                lang: z
                  .string()
                  .describe(
                    'Language for describing information, Chinese and English are supported. Chinese uses zh-CN; English uses en-US',
                  ),
                value: z.string().describe('Describe the content of the information'),
              }),
            )
            .describe('Description')
            .optional(),
        })
        .describe(
          'Organization entity public field, including name, description, superior, start and stop status, effective date, code and other basic information',
        ),
      effective_time: z
        .string()
        .describe(
          'Effective date- Fill in the format: YYYY-MM-DD 00:00:00 (the system will automatically change the hours, minutes and seconds to 00:00:00)- The system defaults to take effect at 00:00:00 on the day when the date is filled in- This interface only supports the smallest unit of day- Date range requirements: 1900-01-01 00:00:00～9999-12-31 23:59:59',
        ),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('Custom field API Name, the unique identifier of the custom field'),
            value: z
              .string()
              .describe(
                'Field value, which is a JSON-escaped string.**Note: For the specific value passing method, please refer to**[Get metadata of custom fields]',
              ),
          }),
        )
        .describe('custom field type，See [Get custom field list]')
        .optional(),
      cost_center_id: z
        .string()
        .describe(
          'Cost center idDetailed information can be obtained through the [Search cost center information] interface query',
        )
        .optional(),
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
          .describe('Determine whether it is the same request according to whether the client_token are consistent')
          .optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify departments open_department_id),department_id(Identify departments department_id),people_corehr_department_id(Identify departments people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV1DepartmentDelete = {
  project: 'corehr',
  name: 'corehr.v1.department.delete',
  sdkName: 'corehr.v1.department.delete',
  path: '/open-apis/corehr/v1/departments/:department_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Organization management-Delete department-You can delete a department record by department ID through this interface',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      department_id: z
        .string()
        .describe(
          'The department ID that needs to be deleted can be obtained through the [Search department information] interface query',
        ),
    }),
  },
};
export const corehrV1DepartmentGet = {
  project: 'corehr',
  name: 'corehr.v1.department.get',
  sdkName: 'corehr.v1.department.get',
  path: '/open-apis/corehr/v1/departments/:department_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Organization management-Get department information-The interface supports batch query of department details of the day by department id, including name, description, enable status, etc',
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
            'The department ID type used in this call Options:open_department_id(Identify departments open_department_id),department_id(Identify departments department_id),people_corehr_department_id(Identify departments people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      department_id: z
        .string()
        .describe(
          'Department I. ID acquisition:- Call [create department][search department] and other interfaces to return the department ID- You can also create departments through [[Event]Create departments](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/department/events/created) [[Event]Update departments](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/department/events/updated) Get department ID information',
        ),
    }),
  },
};
export const corehrV1DepartmentList = {
  project: 'corehr',
  name: 'corehr.v1.department.list',
  sdkName: 'corehr.v1.department.list',
  path: '/open-apis/corehr/v1/departments',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Organization management-Get department list-Query department information in batches, including department basic information, custom field information, etc',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('paging size'),
      department_id_list: z.array(z.string()).describe('Department ID List').optional(),
      name_list: z.array(z.string()).describe('List of department names, exact match required').optional(),
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
export const corehrV1DepartmentPatch = {
  project: 'corehr',
  name: 'corehr.v1.department.patch',
  sdkName: 'corehr.v1.department.patch',
  path: '/open-apis/corehr/v1/departments/:department_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Organization management-Update department-Update department information, including basic information and custom field information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      id: z.string().describe("Entity's unique key inside CoreHR").optional(),
      sub_type: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe('Subtype')
        .optional(),
      manager: z.string().describe('Head of Department').optional(),
      is_confidential: z.boolean().describe('Is it confidential').optional(),
      hiberarchy_common: z
        .object({
          parent_id: z
            .string()
            .describe(
              'Higher organization, this field is a general field. If it is the department dimension, it is required',
            )
            .optional(),
          name: z
            .array(
              z.object({
                lang: z
                  .string()
                  .describe('Language.Support Chinese and English. Use zh-CN for Chinese and en-US for English'),
                value: z.string().describe('Content'),
              }),
            )
            .describe('Name')
            .optional(),
          active: z.boolean().describe('Enable the department').optional(),
          code: z.string().describe('Encoding').optional(),
          description: z
            .array(
              z.object({
                lang: z
                  .string()
                  .describe('Language.Support Chinese and English. Use zh-CN for Chinese and en-US for English'),
                value: z.string().describe('Content'),
              }),
            )
            .describe('Description')
            .optional(),
        })
        .describe('Hierarchical relationship, see entity for inner field')
        .optional(),
      effective_time: z.string().describe('Effective time'),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('Field name'),
            value: z
              .string()
              .describe(
                'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
              ),
          }),
        )
        .describe('Custom fields')
        .optional(),
      cost_center_id: z
        .string()
        .describe(
          'Cost center ID, you can get the corresponding cost center information through the [Search cost center information] interface',
        )
        .optional(),
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
          .describe('Determine whether it is the same request according to whether the client_token are consistent')
          .optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify departments open_department_id),department_id(Identify departments department_id),people_corehr_department_id(Identify departments people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ department_id: z.string().describe('Department ID to be updated') }),
  },
};
export const corehrV1EmployeeTypeCreate = {
  project: 'corehr',
  name: 'corehr.v1.employeeType.create',
  sdkName: 'corehr.v1.employeeType.create',
  path: '/open-apis/corehr/v1/employee_types',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Employee type-Creator employee type-Creator employee type',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z
        .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
        .describe('Name'),
      default_employee_type: z.boolean().describe('Default employee type'),
      active: z.boolean().describe('Enable'),
      code: z.string().describe('Encoding').optional(),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('Field name'),
            value: z
              .string()
              .describe(
                'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
              ),
          }),
        )
        .describe('Custom fields')
        .optional(),
    }),
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
export const corehrV1EmployeeTypeDelete = {
  project: 'corehr',
  name: 'corehr.v1.employeeType.delete',
  sdkName: 'corehr.v1.employeeType.delete',
  path: '/open-apis/corehr/v1/employee_types/:employee_type_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Employee type-Delete employee type-Delete employee type. After deletion, the query interface cannot obtain the deleted data',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ employee_type_id: z.string().describe('The type of person ID that needs to be deleted') }),
  },
};
export const corehrV1EmployeeTypeGet = {
  project: 'corehr',
  name: 'corehr.v1.employeeType.get',
  sdkName: 'corehr.v1.employeeType.get',
  path: '/open-apis/corehr/v1/employee_types/:employee_type_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Employee type-Query an individual employee type-Obtain workforce type information with ID',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ employee_type_id: z.string().describe('Employee type ID') }),
  },
};
export const corehrV1EmployeeTypeList = {
  project: 'corehr',
  name: 'corehr.v1.employeeType.list',
  sdkName: 'corehr.v1.employeeType.list',
  path: '/open-apis/corehr/v1/employee_types',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Employee type-Batch query for employee types-Batch query for employee types',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
    }),
  },
};
export const corehrV1EmployeeTypePatch = {
  project: 'corehr',
  name: 'corehr.v1.employeeType.patch',
  sdkName: 'corehr.v1.employeeType.patch',
  path: '/open-apis/corehr/v1/employee_types/:employee_type_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Employee type-Update employee type-Update employee type',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        name: z
          .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
          .describe('Name')
          .optional(),
        default_employee_type: z.boolean().describe('Default employee type').optional(),
        active: z.boolean().describe('Enable').optional(),
        code: z.string().describe('Encoding').optional(),
        custom_fields: z
          .array(
            z.object({
              field_name: z.string().describe('Field name'),
              value: z
                .string()
                .describe(
                  'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                ),
            }),
          )
          .describe('Custom fields')
          .optional(),
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
    path: z.object({ employee_type_id: z.string().describe('Employee type ID') }),
  },
};
export const corehrV1EmploymentCreate = {
  project: 'corehr',
  name: 'corehr.v1.employment.create',
  sdkName: 'corehr.v1.employment.create',
  path: '/open-apis/corehr/v1/employments',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Employment information-Create employment information-Creator's employment information",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      seniority_date: z.string().describe('Seniority Start Date').optional(),
      employee_number: z.string().describe('Employee number').optional(),
      effective_time: z.string().describe('Onboard date'),
      expiration_time: z.string().describe('Date of separation').optional(),
      employment_type: z.object({ enum_name: z.string().describe('Enumeration value') }).describe('Type of employment'),
      person_id: z.string().describe('Person information, ID of the referenced Person'),
      primary_employment: z.boolean().describe('Is it the main employment information?'),
      employment_status: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe('Employee status')
        .optional(),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('Field name'),
            value: z
              .string()
              .describe(
                'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
              ),
          }),
        )
        .describe('Custom fields')
        .optional(),
      work_email_list: z
        .array(
          z.object({
            email: z.string().describe('Mailbox number'),
            is_primary: z.boolean().describe('Main mailbox').optional(),
            is_public: z.boolean().describe('Public mailbox').optional(),
            email_usage: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Mailbox Purpose')
              .optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe(
          'Work email List , the email is visible on the profile page only if all of the following conditions are met:- is_primary = `"true"` - is_public = `"true"`- email_usage = `"work"`',
        )
        .optional(),
      reason_for_offboarding: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe('Reason for leaving')
        .optional(),
      ats_application_id: z.string().describe('ATS application ID').optional(),
      rehire: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe('Whether to leave and rehire')
        .optional(),
      rehire_employment_id: z.string().describe('Historical Employment Information ID').optional(),
    }),
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
export const corehrV1EmploymentDelete = {
  project: 'corehr',
  name: 'corehr.v1.employment.delete',
  sdkName: 'corehr.v1.employment.delete',
  path: '/open-apis/corehr/v1/employments/:employment_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Employment information-Delete employment information-Delete employment information of personnel',
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
      employment_id: z.string().describe('The ID corresponding to the employment information that needs to be deleted'),
    }),
  },
};
export const corehrV1EmploymentPatch = {
  project: 'corehr',
  name: 'corehr.v1.employment.patch',
  sdkName: 'corehr.v1.employment.patch',
  path: '/open-apis/corehr/v1/employments/:employment_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Employment information-Update employment information-Update employment information',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        seniority_date: z.string().describe('Seniority start date').optional(),
        employee_number: z.string().describe('Employee number').optional(),
        employment_type: z
          .object({ enum_name: z.string().describe('Enumeration value') })
          .describe('Type of employment')
          .optional(),
        person_id: z
          .string()
          .describe(
            'Person ID, person detailed information can be obtained through [Query individual personal information] API',
          )
          .optional(),
        primary_employment: z.boolean().describe('Is it the main employment information').optional(),
        custom_fields: z
          .array(
            z.object({
              field_name: z.string().describe('Field name'),
              value: z
                .string()
                .describe(
                  'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                ),
            }),
          )
          .describe('Custom fields')
          .optional(),
        work_email_list: z
          .array(
            z.object({
              email: z.string().describe('Mailbox number'),
              is_primary: z.boolean().describe('Main mailbox').optional(),
              is_public: z.boolean().describe('Public mailbox').optional(),
              email_usage: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Mailbox Purpose')
                .optional(),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('Field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom fields')
                .optional(),
            }),
          )
          .describe(
            'Work email List , the email is visible on the profile page only if all of the following conditions are met:- is_primary = `"true"` - is_public = `"true"`- email_usage = `"work"`',
          )
          .optional(),
        reason_for_offboarding: z
          .object({ enum_name: z.string().describe('Enumeration value') })
          .describe('Reasons for leaving')
          .optional(),
        ats_application_id: z.string().describe('ATS application ID').optional(),
      })
      .optional(),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Determine whether it is the same request according to whether the client_token are consistent')
          .optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify departments open_department_id),department_id(Identify departments department_id),people_corehr_department_id(Identify departments people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ employment_id: z.string().describe('Employee ID') }),
  },
};
export const corehrV1JobChangeCreate = {
  project: 'corehr',
  name: 'corehr.v1.jobChange.create',
  sdkName: 'corehr.v1.jobChange.create',
  path: '/open-apis/corehr/v1/job_changes',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Feishu People（Enterprise Edition）-Job change-Initiate employee changes-This interface is used to initiate an employee change. If the initiation is successful, an employee's change data will be generated and corresponding events will be generated at the same time. Refer to [Change of Change Status]",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      transfer_mode: z.number().describe('Change mode Options:1(Direct Transaction),2(Initiate a change)'),
      employment_id: z
        .string()
        .describe(
          "Employee ID, the ID type is consistent with the value of the query parameter user_id_type. For example, when user_id_type is user_id, this field takes the user_id of the employee, and if user_id_type is people_corehr_id, it takes the employee's personnel employment ID",
        ),
      transfer_type_unique_identifier: z
        .string()
        .describe(
          'Unique identification of the transaction type. Transaction types that are only used in special scenarios, such as organization_adjustment, responsibility_transfer, and conversion_after_probation_period, are not supported. Available through the interface [Get a list of transaction types]Attention: This field is required',
        ),
      flow_id: z
        .string()
        .describe(
          'Associated process unique device identifiers, available through the interface [Get a list of transaction types]Note: When the transaction mode is 2, this field is required',
        )
        .optional(),
      effective_date: z.string().describe('Effective Date'),
      transfer_info: z
        .object({
          remark: z.string().describe('Remarks').optional(),
          offer_info: z.string().describe('Offer information').optional(),
          target_dotted_manager_clean: z.boolean().describe('Whether to revoke dotted-line manager').optional(),
          probation_exist: z.boolean().describe('Is there a probation period').optional(),
          original_department: z
            .string()
            .describe(
              'The original department ID, the ID type is consistent with the value of the query parameter department_id_type. For example, when the department_id_type is open_department_id, the field takes the open_department_id of the department, and if the department_id_type is people_corehr_department_id, the personnel department ID of the employee is taken',
            )
            .optional(),
          target_department: z
            .string()
            .describe(
              'The new department ID, the ID type is consistent with the value of the query parameter department_id_type. For example, when the department_id_type is open_department_id, the field takes the open_department_id of the department, and if the department_id_type is people_corehr_department_id, the personnel department ID of the employee is taken',
            )
            .optional(),
          original_work_location: z.string().describe('Original duty station').optional(),
          target_work_location: z.string().describe('New duty station').optional(),
          original_direct_manager: z.string().describe('Former direct manager').optional(),
          target_direct_manager: z.string().describe('New direct manager').optional(),
          original_dotted_manager: z.string().describe('Former dotted-line manager').optional(),
          target_dotted_manager: z.string().describe('New dotted-line manager').optional(),
          original_job: z.string().describe('Original job').optional(),
          target_job: z.string().describe('New job').optional(),
          original_job_family: z.string().describe('Original sequence').optional(),
          target_job_family: z.string().describe('New sequence').optional(),
          original_job_level: z.string().describe('Original level').optional(),
          target_job_level: z.string().describe('New level').optional(),
          original_workforce_type: z.string().describe('Original personnel type').optional(),
          target_workforce_type: z.string().describe('Type of new personnel').optional(),
          original_employee_subtype: z.string().describe('Original employee subtype').optional(),
          target_employee_subtype: z.string().describe('New employee subtype').optional(),
          original_company: z.string().describe('Original company').optional(),
          target_company: z.string().describe('New company').optional(),
          original_contract_number: z.string().describe('Original contract number').optional(),
          target_contract_number: z.string().describe('New contract number').optional(),
          original_contract_type: z.string().describe('Original contract type').optional(),
          target_contract_type: z.string().describe('New contract type').optional(),
          original_duration_type: z.string().describe('Original Term Type').optional(),
          target_duration_type: z.string().describe('New Term Type').optional(),
          original_signing_type: z.string().describe('Original signing type').optional(),
          target_signing_type: z.string().describe('New signing type').optional(),
          original_contract_start_date: z.string().describe('Original contract start date').optional(),
          target_contract_start_date: z.string().describe('New contract start date').optional(),
          original_contract_end_date: z.string().describe('Original contract end date').optional(),
          target_contract_end_date: z.string().describe('New contract end date').optional(),
          original_working_hours_type: z.string().describe('Original working hour system').optional(),
          target_working_hours_type: z.string().describe('New working hours system').optional(),
          original_working_calendar: z.string().describe('Original work calendar').optional(),
          target_working_calendar: z.string().describe('New work calendar').optional(),
          original_probation_end_date: z.string().describe('Expected end date of original probation period').optional(),
          target_probation_end_date: z.string().describe('Expected end date of new probation period').optional(),
          original_weekly_working_hours: z.string().describe('Original working week').optional(),
          target_weekly_working_hours: z.string().describe('Working hours in the new week').optional(),
          original_work_shift: z.string().describe('Original Schedule').optional(),
          target_work_shift: z.string().describe('New schedule').optional(),
          original_cost_center_rate: z
            .array(
              z.object({
                cost_center_id: z.string().describe('Supported cost center id').optional(),
                rate: z.number().describe('Apportionment ratio').optional(),
              }),
            )
            .describe('Original cost center allocation information')
            .optional(),
          target_cost_center_rate: z
            .array(
              z.object({
                cost_center_id: z.string().describe('Supported cost center id').optional(),
                rate: z.number().describe('Apportionment ratio').optional(),
              }),
            )
            .describe('New cost center allocation information')
            .optional(),
          original_employment_change: z
            .object({
              regular_employee_start_date: z.string().describe('Regular employee start date').optional(),
              seniority_date: z.string().describe('Seniority date').optional(),
              employee_number: z.string().describe('Employee number').optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe(
                        'Custom field apiname, which is the unique identifier of the custom field. You can get it by [Get Custom Field List]',
                      ),
                    value: z
                      .string()
                      .describe(
                        'Field value, which is the string escaped by json, according to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")Attention:1. The enumeration field value can be obtained by [Get Field Details], the reference interface returns, field details > field type configuration information > option configuration information > option information > enumeration value set API name',
                      ),
                  }),
                )
                .describe('custom field')
                .optional(),
            })
            .describe('Original employment change')
            .optional(),
          target_employment_change: z
            .object({
              regular_employee_start_date: z.string().describe('Regular employee start date').optional(),
              seniority_date: z.string().describe('Seniority date').optional(),
              employee_number: z.string().describe('Employee number').optional(),
              custom_fields: z
                .array(
                  z.object({
                    custom_api_name: z
                      .string()
                      .describe(
                        'Custom field apiname, which is the unique identifier of the custom field. You can get it by [Get Custom Field List]',
                      ),
                    value: z
                      .string()
                      .describe(
                        'Field value, which is the string escaped by json, according to the metadata definition, the field format is different (such as 123, 123.23, "true", ["id1", "id2"], "2006-01-02 15:04:05")Attention:1. The enumeration field value can be obtained by [Get Field Details], the reference interface returns, field details > field type configuration information > option configuration information > option information > enumeration value set API name',
                      ),
                  }),
                )
                .describe('custom field')
                .optional(),
            })
            .describe('Target employment change')
            .optional(),
          original_job_grade: z.string().describe('Original job grade').optional(),
          target_job_grade: z.string().describe('New job grade').optional(),
          original_compensation_type: z.string().describe('Original pay rate type').optional(),
          target_compensation_type: z.string().describe('New pay rate type').optional(),
          original_service_company: z.string().describe('Original service company').optional(),
          target_service_company: z.string().describe('New service company').optional(),
          original_position: z.string().describe('Original position').optional(),
          target_position: z.string().describe('New position').optional(),
        })
        .describe('Change details'),
      transfer_key: z.string().describe('transfer record identifier').optional(),
      initiator_id: z.string().describe('Transaction Promoter ID').optional(),
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
            'The department ID type used in this call Options:open_department_id(Identify departments open_department_id),department_id(Identify departments department_id),people_corehr_department_id(Identify departments people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV1JobDataCreate = {
  project: 'corehr',
  name: 'corehr.v1.jobData.create',
  sdkName: 'corehr.v1.jobData.create',
  path: '/open-apis/corehr/v1/job_datas',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Create job information-Create job data',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      job_level_id: z.string().describe('Level').optional(),
      employee_type_id: z.string().describe('Type of employee'),
      working_hours_type_id: z.string().describe('Working hours system').optional(),
      work_location_id: z.string().describe('Work location').optional(),
      department_id: z.string().describe('Department').optional(),
      job_id: z.string().describe('Position').optional(),
      probation_start_date: z.string().describe('Trial period start date').optional(),
      probation_end_date: z.string().describe('Trial period').optional(),
      primary_job_data: z.boolean().describe('Director post'),
      employment_id: z.string().describe('Employment ID'),
      effective_time: z.string().describe('Effective time'),
      expiration_time: z.string().describe('Failure time').optional(),
      job_family_id: z.string().describe('Job classification ID').optional(),
      assignment_start_reason: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe("Assignment start reason could only be filled in with 'onboarding'"),
      probation_expected_end_date: z.string().describe('End date of probation period').optional(),
      direct_manager_id: z.string().describe("Solid Line Supervisor's Employment Record ID").optional(),
      dotted_line_manager_id_list: z.array(z.string()).describe("Dotted supervisor's employment record ID").optional(),
      second_direct_manager_id: z.string().describe("Second solid line supervisor's employment record ID").optional(),
      cost_center_rate: z
        .array(
          z.object({
            cost_center_id: z.string().describe('Supported cost center id').optional(),
            rate: z.number().describe('Apportionment ratio').optional(),
          }),
        )
        .describe('Cost center allocation information')
        .optional(),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('Field name'),
            value: z
              .string()
              .describe(
                'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
              ),
          }),
        )
        .describe('Custom fields')
        .optional(),
    }),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Determine whether it is the same request according to whether the client_token are consistent')
          .optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify departments open_department_id),department_id(Identify departments department_id),people_corehr_department_id(Identify departments people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV1JobDataDelete = {
  project: 'corehr',
  name: 'corehr.v1.jobData.delete',
  sdkName: 'corehr.v1.jobData.delete',
  path: '/open-apis/corehr/v1/job_datas/:job_data_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Delete job information-Delete job information',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ job_data_id: z.string().describe('ID of the job information to be deleted') }),
  },
};
export const corehrV1JobDataGet = {
  project: 'corehr',
  name: 'corehr.v1.jobData.get',
  sdkName: 'corehr.v1.jobData.get',
  path: '/open-apis/corehr/v1/job_datas/:job_data_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Get job information-Obtain employee job information with ID',
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
            'The department ID type used in this call Options:open_department_id(Identify departments open_department_id),department_id(Identify departments department_id),people_corehr_department_id(Identify departments people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ job_data_id: z.string().describe('Job Information ID') }),
  },
};
export const corehrV1JobDataList = {
  project: 'corehr',
  name: 'corehr.v1.jobData.list',
  sdkName: 'corehr.v1.jobData.list',
  path: '/open-apis/corehr/v1/job_datas',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Get the list of job information-Get the list of job information',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
      employment_id: z.string().describe('Employment ID').optional(),
      job_data_id_list: z
        .array(z.string())
        .describe(
          'Job information ID list, up to 100 (if it is not passed, all job information will be queried by default)',
        )
        .optional(),
      department_id: z.string().describe('Department ID').optional(),
      job_id: z.string().describe('Job ID').optional(),
      get_all_version: z
        .boolean()
        .describe(
          'Whether to get all job versions. "true" means to get all versions of the job information, and "false" means to get only the currently valid job version. The default value is "false"',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
        .describe(
          'The department ID type used in this call Options:open_department_id(Identify departments open_department_id),department_id(Identify departments department_id),people_corehr_department_id(Identify departments people_corehr_department_id)',
        )
        .optional(),
    }),
  },
};
export const corehrV1JobDataPatch = {
  project: 'corehr',
  name: 'corehr.v1.jobData.patch',
  sdkName: 'corehr.v1.jobData.patch',
  path: '/open-apis/corehr/v1/job_datas/:job_data_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Job data-Update job information-Update job data',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        version_id: z
          .string()
          .describe(
            'Job record version ID- When the ID is not empty, the job record content of the specified version will be updated- When the ID is empty, a new version will be addedFunction grey release, if you need to update the specified version, please contact [technical support]',
          )
          .optional(),
        job_level_id: z.string().describe('Level').optional(),
        job_grade_id: z
          .string()
          .describe(
            'The grade ID, enumeration value and detailed information can be obtained through the [query grade] interface query',
          )
          .optional(),
        employee_type_id: z.string().describe('Type of employee').optional(),
        working_hours_type_id: z.string().describe('Working hours system').optional(),
        work_location_id: z.string().describe('Work location').optional(),
        department_id: z.string().describe('Department').optional(),
        job_id: z.string().describe('Position').optional(),
        probation_start_date: z.string().describe('Trial period start date').optional(),
        probation_end_date: z.string().describe('Trial period').optional(),
        primary_job_data: z.boolean().describe('Director post').optional(),
        employment_id: z.string().describe('Employment ID').optional(),
        effective_time: z.string().describe('Effective time').optional(),
        expiration_time: z.string().describe('Failure time').optional(),
        job_family_id: z.string().describe('Job classification ID').optional(),
        assignment_start_reason: z
          .object({ enum_name: z.string().describe('Enumeration value') })
          .describe(
            "Assignment start reason can be obtained by [Enum constant].Please note that 'assignment start reason' cannot be filled as 'onboarding'. When the previous job data version's 'assignment start reason' is 'onboarding', 'assignment start reason' is required",
          )
          .optional(),
        probation_expected_end_date: z.string().describe('End date of probation period').optional(),
        direct_manager_id: z.string().describe("Solid Line Supervisor's Employment Record ID").optional(),
        dotted_line_manager_id_list: z
          .array(z.string())
          .describe("Dotted supervisor's employment record ID")
          .optional(),
        second_direct_manager_id: z.string().describe("Second solid line supervisor's employment record ID").optional(),
        cost_center_rate: z
          .array(
            z.object({
              cost_center_id: z.string().describe('Supported cost center id').optional(),
              rate: z.number().describe('Apportionment ratio').optional(),
            }),
          )
          .describe(
            'Cost center informationWhen the version_id is not empty, updating the field value is not supported for the time being',
          )
          .optional(),
        work_shift: z
          .object({ enum_name: z.string().describe('Enumeration value. Customization required') })
          .describe('Shift type')
          .optional(),
        compensation_type: z
          .object({ enum_name: z.string().describe('Enumeration value. Customization required') })
          .describe('Salary type')
          .optional(),
        service_company: z
          .string()
          .describe(
            'The company ID, the detailed information can be obtained through the [Query a single company] interface query',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Determine whether it is the same request according to whether the client_token are consistent')
          .optional(),
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_corehr_department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify departments open_department_id),department_id(Identify departments department_id),people_corehr_department_id(Identify departments people_corehr_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ job_data_id: z.string().describe('Job Information ID') }),
  },
};
export const corehrV1JobFamilyCreate = {
  project: 'corehr',
  name: 'corehr.v1.jobFamily.create',
  sdkName: 'corehr.v1.jobFamily.create',
  path: '/open-apis/corehr/v1/job_families',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job family-Create job sequence-A single job faimly of information can be created through this API, and the API verifies the content of request',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z
        .array(
          z.object({
            lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
            value: z
              .string()
              .describe(
                'Content- There will be a globally unique check for the Chinese and English names of the Job family- Name cannot contain 「/」「；」「;」 characters',
              ),
          }),
        )
        .describe('Job faimly name'),
      active: z.boolean().describe('Enable'),
      selectable: z.boolean().describe('Selectable').optional(),
      parent_id: z
        .string()
        .describe(
          'Senior Job Family ID. ID acquisition method:- Call [Create Job Family] [Query the sequence information of the tenant] and other interfaces to return the Job Family ID',
        )
        .optional(),
      pathway_ids: z
        .array(z.string())
        .describe('Pathway ID, for details, please refer to [Get Pathway information]')
        .optional(),
      effective_time: z
        .string()
        .describe(
          'Version effective date- Fill in the format: YYYY-MM-DD 00:00:00 (the system will automatically change the hours, minutes and seconds to 00:00:00)- The system defaults to take effect at 00:00:00 on the day when the date is filled in- This interface only supports the smallest unit of day- Date range requirements: 1900-01-01 00:00:00～9999-12-31 23:59:59',
        ),
      code: z
        .string()
        .describe(
          'Job faimly Code (cannot be repeated with the encoding of other records), this field will be invalid when automatic encoding is turned on',
        )
        .optional(),
      description: z
        .array(
          z.object({
            lang: z.string().describe("description's language,zh-CN in Chinese, en-US in English"),
            value: z.string().describe("description's value"),
          }),
        )
        .describe('Description')
        .optional(),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('Field name'),
            value: z
              .string()
              .describe(
                'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")- custom field type，See [Get custom field list]',
              ),
          }),
        )
        .describe('Custom field (this field is temporarily unsupported)')
        .optional(),
    }),
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
export const corehrV1JobFamilyDelete = {
  project: 'corehr',
  name: 'corehr.v1.jobFamily.delete',
  sdkName: 'corehr.v1.jobFamily.delete',
  path: '/open-apis/corehr/v1/job_families/:job_family_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job family-Delete job sequence-The interface supports deleting single Job family information by Job family ID',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      job_family_id: z
        .string()
        .describe(
          'Job family ID to be deleted. How to get the ID:- Call [Create Job Family] [Query the Job Family of the tenant] and other API to return the Job Family ID',
        ),
    }),
  },
};
export const corehrV1JobFamilyGet = {
  project: 'corehr',
  name: 'corehr.v1.jobFamily.get',
  sdkName: 'corehr.v1.jobFamily.get',
  path: '/open-apis/corehr/v1/job_families/:job_family_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job family-Query a single job sequence-The API supports querying single Job faimly details by Job faimly ID',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      job_family_id: z
        .string()
        .describe(
          'List of Job Family IDs. How to get the ID:- Call [Create Job Family] [Query the Job Family of the tenant] and other API to return the Job Family ID',
        ),
    }),
  },
};
export const corehrV1JobFamilyList = {
  project: 'corehr',
  name: 'corehr.v1.jobFamily.list',
  sdkName: 'corehr.v1.jobFamily.list',
  path: '/open-apis/corehr/v1/job_families',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job family-Get the list of job sequence-The API supports obtaining all Job family information under the tenant. When there are too many job family, you can call the interface multiple times to obtain all job family details, including job family code, name, etc',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Paging size, the maximum value supports 100'),
    }),
  },
};
export const corehrV1JobFamilyPatch = {
  project: 'corehr',
  name: 'corehr.v1.jobFamily.patch',
  sdkName: 'corehr.v1.jobFamily.patch',
  path: '/open-apis/corehr/v1/job_families/:job_family_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job family-Update job sequence-Individual Job family details such as sequence name, parent sequence ID, etc. can be updated by sequence ID',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        name: z
          .array(
            z.object({
              lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
              value: z
                .string()
                .describe(
                  'content of Job faimly name- There will be a globally unique check for the Chinese and English names of the Job family- Name cannot contain 「/」「；」「」 characters',
                ),
            }),
          )
          .describe('Name')
          .optional(),
        active: z.boolean().describe('Enable').optional(),
        selectable: z.boolean().describe('Selectable').optional(),
        parent_id: z
          .string()
          .describe(
            'Senior Job Family ID. ID acquisition method:- Call [Create Job Family ID] [Query the sequence information of the tenant] and other interfaces to return the Job Family ID',
          )
          .optional(),
        pathway_ids: z
          .array(z.string())
          .describe('Pathway ID, for details, please refer to [Get Pathway information]')
          .optional(),
        effective_time: z
          .string()
          .describe(
            'Effective date- Fill in the format: YYYY-MM-DD 00:00:00 (the system will automatically change the hours, minutes and seconds to 00:00:00)- The system defaults to take effect at 00:00:00 on the day when the date is filled in- This interface only supports the smallest unit of day- Date range requirements: 1900-01-01 00:00:00～9999-12-31 23:59:59',
          )
          .optional(),
        code: z.string().describe('Custom field (this field is temporarily unsupported)').optional(),
        description: z
          .array(
            z.object({
              lang: z.string().describe("description's language,zh-CN in Chinese, en-US in English"),
              value: z.string().describe("description's value"),
            }),
          )
          .describe('Description')
          .optional(),
        custom_fields: z
          .array(
            z.object({
              field_name: z.string().describe('Custom field API Name, the unique identifier of the custom field'),
              value: z
                .string()
                .describe(
                  'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                ),
            }),
          )
          .describe('Custom field (this field is temporarily unsupported)')
          .optional(),
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
    path: z.object({ job_family_id: z.string().describe('Job family ID') }),
  },
};
export const corehrV1JobLevelCreate = {
  project: 'corehr',
  name: 'corehr.v1.jobLevel.create',
  sdkName: 'corehr.v1.jobLevel.create',
  path: '/open-apis/corehr/v1/job_levels',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job level-Create job level-Use the specified information to create job level information. Each call supports the creation of a job level object, and the relevant rules will be checked in the interface',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      level_order: z.number().describe('Job Level value'),
      code: z
        .string()
        .describe(
          'Job Level code. Non-required field, if a non-null value will be checked for global uniqueness, if a null value is passed, it will not participate in global verification',
        )
        .optional(),
      name: z
        .array(
          z.object({
            lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
            value: z
              .string()
              .describe(
                'The content of the name information.- There will be a globally unique check for the Chinese and English names of the rank- Name cannot contain 「/」「；」「;」 characters',
              ),
          }),
        )
        .describe('Job Level name'),
      description: z
        .array(
          z.object({
            lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
            value: z.string().describe('Content of name information'),
          }),
        )
        .describe('describe')
        .optional(),
      active: z.boolean().describe('Whether to enable, true to enable, false to disable'),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('field name'),
            value: z
              .string()
              .describe(
                'Field value, a JSON escaped string.** Note: For specific value transfer methods, see ** [Get metadata for custom fields]',
              ),
          }),
        )
        .describe('Custom fields (this feature is not currently supported by the rank)')
        .optional(),
      job_grade: z.array(z.string()).describe('Job grade IDs').optional(),
      pathway_ids: z
        .array(z.string())
        .describe('Pathway ID, for details, please refer to [Get Pathway information]')
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
  },
};
export const corehrV1JobLevelDelete = {
  project: 'corehr',
  name: 'corehr.v1.jobLevel.delete',
  sdkName: 'corehr.v1.jobLevel.delete',
  path: '/open-apis/corehr/v1/job_levels/:job_level_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job level-Delete job level-You can delete a rank object by rank ID through this OpenAPI',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      job_level_id: z
        .string()
        .describe(
          'Job level ID to be deleted.D acquisition method:- Call[New Job Level] [Query the rank information of the tenant] and other interfaces to return the Job Level ID',
        ),
    }),
  },
};
export const corehrV1JobLevelGet = {
  project: 'corehr',
  name: 'corehr.v1.jobLevel.get',
  sdkName: 'corehr.v1.jobLevel.get',
  path: '/open-apis/corehr/v1/job_levels/:job_level_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job level-Get single job level-The interface supports querying the detailed information of a single job level by job level ID, including the name, description, enabled status, and so on',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      job_level_id: z
        .string()
        .describe(
          'Job Level ID. ID acquisition method:- Call [Create Job Level] [Query the Job Level information of the tenant] and other interfaces to return the Job Level ID',
        ),
    }),
  },
};
export const corehrV1JobLevelList = {
  project: 'corehr',
  name: 'corehr.v1.jobLevel.list',
  sdkName: 'corehr.v1.jobLevel.list',
  path: '/open-apis/corehr/v1/job_levels',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job level-Get the list of job level-The interface supports obtaining all rank information under the tenant. When there are too many ranks, you can call the interface repeatedly to obtain all rank details, including rank value, code, name, etc',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Paging size, maximum support 100'),
    }),
  },
};
export const corehrV1JobLevelPatch = {
  project: 'corehr',
  name: 'corehr.v1.jobLevel.patch',
  sdkName: 'corehr.v1.jobLevel.patch',
  path: '/open-apis/corehr/v1/job_levels/:job_level_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job level-Update job level-You can update individual rank information by Job level ID, including Job level values, names, and other information',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        level_order: z.number().describe('The Job level code, if not passed, is set to null by default').optional(),
        code: z
          .string()
          .describe(
            'Job level code. Non-required field, if a non-null value will be checked for global uniqueness, if a null value is passed, it will not participate in global verification',
          )
          .optional(),
        name: z
          .array(
            z.object({
              lang: z.string().describe('Language of name information, zh-CN in Chinese, en-US in English'),
              value: z.string().describe('Content'),
            }),
          )
          .describe('Job level name')
          .optional(),
        description: z
          .array(
            z.object({
              lang: z.string().describe('Language'),
              value: z
                .string()
                .describe(
                  'Job level name- There will be a globally unique check for the Chinese and English names of the Job level- Name cannot contain 「/」「；」「」 characters',
                ),
            }),
          )
          .describe('Description')
          .optional(),
        active: z.boolean().describe('Enable').optional(),
        custom_fields: z
          .array(
            z.object({
              field_name: z.string().describe('Field name'),
              value: z
                .string()
                .describe(
                  'Field value, which is the string escaped by json, according to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2\\"], "2006-01-02 15:04:05")- See [Get custom field list] for details of custom fields (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/custom_field/query)',
                ),
            }),
          )
          .describe('Custom field (this field is temporarily unsupported)')
          .optional(),
        job_grade: z.array(z.string()).describe('Job grade IDs').optional(),
        pathway_ids: z
          .array(z.string())
          .describe('Pathway ID, for details, please refer to [Get Pathway information]')
          .optional(),
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
    path: z.object({
      job_level_id: z
        .string()
        .describe(
          'Job Level ID. ID acquisition method:- Call[New Job Level] [Query the rank information of the tenant] and other interfaces to return the Job Level ID',
        ),
    }),
  },
};
export const corehrV1JobCreate = {
  project: 'corehr',
  name: 'corehr.v1.job.create',
  sdkName: 'corehr.v1.job.create',
  path: '/open-apis/corehr/v1/jobs',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job-Create job profile-You can create new job information through this interface',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      code: z
        .string()
        .describe(
          "Job code (cannot be duplicated with other records' codes), this field is disabled when auto-encoding is turned on",
        )
        .optional(),
      name: z
        .array(
          z.object({
            lang: z.string().describe('Language information, Chinese with zh-CN, English with en-US'),
            value: z.string().describe('Content of name information'),
          }),
        )
        .describe(
          'Job title- Name cannot contain 「/」「；」「;」 characters- The Chinese and English names of the job title will be globally unique(Deactivated jobs will also be verified.)',
        ),
      description: z
        .array(
          z.object({
            lang: z.string().describe('Language information, Chinese with zh-CN, English with en-US'),
            value: z.string().describe('Content of name information'),
          }),
        )
        .describe('describe')
        .optional(),
      active: z.boolean().describe('Whether to enable, true to enable, false to disable'),
      job_title: z
        .array(
          z.object({
            lang: z.string().describe('Language of Name Information'),
            value: z.string().describe('Content of name information'),
          }),
        )
        .describe('job title')
        .optional(),
      pathway_id: z.string().describe('Pathway ID, for details, please refer to [Get Pathway information]').optional(),
      job_family_id_list: z
        .array(z.string())
        .describe('Job sequence ID list- Details can be obtained by [Batch Query Sequence]')
        .optional(),
      job_level_id_list: z
        .array(z.string())
        .describe('Job Level ID List- Details can be obtained by [Batch Query Job level]')
        .optional(),
      working_hours_type_id: z
        .string()
        .describe(
          'The working hour system ID, enumeration value and detailed information can be obtained through the [batch query working hour system] interface query',
        )
        .optional(),
      effective_time: z
        .string()
        .describe(
          'Version effective date- Fill in the format: YYYY-MM-DD 00:00:00 (the system will automatically change the time and seconds to 00:00:00)- The system defaults to 00:00:00 on the day of filling in the date.The interface is only supported up to the smallest unit for the day- Date range requirements: 1900-01-01 00:00:00~ 9999-12-31 23:59:59',
        ),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('field name'),
            value: z
              .string()
              .describe(
                'Field value, which is the string escaped by json, according to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2\\"], "2006-01-02 15:04:05")',
              ),
          }),
        )
        .describe('Custom field, format reference:[Custom Field Description]Position, Job, Custom Organization Module')
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
  },
};
export const corehrV1JobDelete = {
  project: 'corehr',
  name: 'corehr.v1.job.delete',
  sdkName: 'corehr.v1.job.delete',
  path: '/open-apis/corehr/v1/jobs/:job_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job-Delete job profile-Delete job profile',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      job_id: z
        .string()
        .describe(
          'The job ID that needs to be deleted. How to get the ID:- Call [Create job] [Batch query job] to return job ID- You can also create jobs through [[Event]Create Jobs](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/job/events/created) [[Event]Update jobs](https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/job/events/updated) Get ID',
        ),
    }),
  },
};
export const corehrV1JobGet = {
  project: 'corehr',
  name: 'corehr.v1.job.get',
  sdkName: 'corehr.v1.job.get',
  path: '/open-apis/corehr/v1/jobs/:job_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Organization management-Get job profile-The interface supports batch query of job details of the day by job id, including name, description, enabling status and so on',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ job_id: z.string().describe('Job ID') }),
  },
};
export const corehrV1JobList = {
  project: 'corehr',
  name: 'corehr.v1.job.list',
  sdkName: 'corehr.v1.job.list',
  path: '/open-apis/corehr/v1/jobs',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Organization management-Get the list of job profile-Get the list of job profile',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
      name: z.string().describe('Name').optional(),
      query_language: z.string().describe('Language').optional(),
    }),
  },
};
export const corehrV1JobPatch = {
  project: 'corehr',
  name: 'corehr.v1.job.patch',
  sdkName: 'corehr.v1.job.patch',
  path: '/open-apis/corehr/v1/jobs/:job_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job management-Job-Update Job-You can update a job through this interface',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        code: z
          .string()
          .describe(
            "Job code (cannot be duplicated with other records' codes), when automatic encoding is enabled, this field will be invalid",
          )
          .optional(),
        name: z
          .array(
            z.object({
              lang: z.string().describe('Language information, Chinese with zh-CN, English with en-US'),
              value: z.string().describe('Content of name information'),
            }),
          )
          .describe(
            'Job title- Name cannot contain 「/」「；」「」 characters- Xx Chinese and English names will have a globally unique check(Deactivated jobs will also be verified.)',
          )
          .optional(),
        description: z
          .array(
            z.object({
              lang: z.string().describe('Language information, Chinese with zh-CN, English with en-US'),
              value: z.string().describe('Content of name information'),
            }),
          )
          .describe('describe')
          .optional(),
        active: z.boolean().describe('Whether to enable, true to deactivate, fasle to enable').optional(),
        job_title: z
          .array(
            z.object({
              lang: z.string().describe('Language information, Chinese with zh-CN, English with en-US'),
              value: z.string().describe('Content of name information'),
            }),
          )
          .describe('job title')
          .optional(),
        pathway_id: z
          .string()
          .describe('Pathway ID, for details, please refer to [Get Pathway information]')
          .optional(),
        job_family_id_list: z
          .array(z.string())
          .describe(
            'List of job sequence IDs. How to get the ID:- Call [New Job family] [Query the sequence information of the tenant] and other interfaces to return the sequence ID',
          )
          .optional(),
        job_level_id_list: z
          .array(z.string())
          .describe(
            'List of job level IDs. How to get the ID:- Call [Create Job Level][Query the rank information of the tenant] and other interfaces to return the rank ID',
          )
          .optional(),
        working_hours_type_id: z
          .string()
          .describe(
            'The working hour system ID, enumeration value and detailed information can be obtained through the [batch query working hour system] interface query',
          )
          .optional(),
        effective_time: z
          .string()
          .describe(
            'Version effective date- Fill in the format: YYYY-MM-DD 00:00:00 (the system will automatically change the time and seconds to 00:00:00)- The system defaults to 00:00:00 on the day of filling in the date.The interface is only supported up to the smallest unit for the day- Date range requirements: 1900-01-01 00:00:00~ 9999-12-31 23:59:59',
          )
          .optional(),
        custom_fields: z
          .array(
            z.object({
              field_name: z.string().describe('Custom field API Name, the unique identifier of the custom field'),
              value: z
                .string()
                .describe(
                  'The field value is a string escaped from JSON. The field format varies depending on the metadata definition. For example: ```("\\"123\\"", "\\"123.23\\"", "\\"true\\"", [\\"id1\\",\\"id2\\"], \\"2006-01-02 15:04:05\\")```',
                ),
            }),
          )
          .describe(
            'Custom field, format reference:[Custom Field Description]Position, Job, Custom Organization Module',
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
      job_id: z
        .string()
        .describe(
          'Job ID. How to get ID:- Call [Create job] [Batch query job] to return job ID- You can also create jobs through [Event] [Event] Update jobs] (https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/corehr-v1/job/events/updated) Get ID',
        ),
    }),
  },
};
export const corehrV1LeaveGrantingRecordCreate = {
  project: 'corehr',
  name: 'corehr.v1.leaveGrantingRecord.create',
  sdkName: 'corehr.v1.leaveGrantingRecord.create',
  path: '/open-apis/corehr/v1/leave_granting_records',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Leave management-Create vacation grant records-Write the leave issuance record to the Feishu personnel leave system. Corresponding to the creation or import function of leave management - leave management - [issuance record]',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      leave_type_id: z
        .string()
        .describe(
          'Leave_type_id type ID, the enumeration value can be obtained through the [Get a list of vacation types] interface,if there is a vacation subclass under the vacation type, only the ID of the vacation subclass is passed in here',
        ),
      employment_id: z.string().describe('Employee ID, employee id of Feishu personnel. Corresponding user_id_type'),
      granting_quantity: z.string().describe('Number awarded'),
      granting_unit: z.number().describe('Grant duration unit Optional values are: - 1: day - 2:00 hours'),
      effective_date: z.string().describe('Effective time, in the format yyyy-MM-dd'),
      expiration_date: z.string().describe('Expiration time, in the format yyyy-MM-dd').optional(),
      section_type: z
        .number()
        .describe(
          'Whether to participate in the conversion (1 does not participate in the conversion, 2 participates in the conversion). Not converted by default',
        )
        .optional(),
      reason: z
        .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
        .describe('Reason for award'),
      external_id: z
        .string()
        .describe(
          'Custom external ID, which can be used to avoid repeated data writes (no more than 64 characters). If entered repeatedly, no new record will be created and no original record will be updated',
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
export const corehrV1LeaveGrantingRecordDelete = {
  project: 'corehr',
  name: 'corehr.v1.leaveGrantingRecord.delete',
  sdkName: 'corehr.v1.leaveGrantingRecord.delete',
  path: '/open-apis/corehr/v1/leave_granting_records/:leave_granting_record_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Leave management-Delete vacation grant records-Delete the issuance records in the Feishu personnel leave system, Leave Management - Leave Management - [Issuance Records] (only supports deleting records where the source of issuance is "manual issuance" or "external system issuance")',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      leave_granting_record_id: z
        .string()
        .describe('Vacation Issuance Record ID, which can be obtained from [Create Vacation Issuance Record]'),
    }),
  },
};
export const corehrV1LeaveCalendarByScope = {
  project: 'corehr',
  name: 'corehr.v1.leave.calendarByScope',
  sdkName: 'corehr.v1.leave.calendarByScope',
  path: '/open-apis/corehr/v1/leaves/calendar_by_scope',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Leave management-query calendar by scope-Get the work calendar id according to the scope of the calendar.The scope of application includes work location, working hours system, etc',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        wk_department_id: z
          .string()
          .describe(
            'List of IDs of the department to which the user belongs.You can obtain the ID of the department through [Batch query of job information]',
          )
          .optional(),
        wk_country_region_id: z
          .string()
          .describe('Country ID.You can get the country/region ID through [Batch query of job information]')
          .optional(),
        wk_employee_type_id: z
          .string()
          .describe('Employee Type ID.You can obtain the personnel type ID through [Batch query of job information]')
          .optional(),
        wk_work_location_id: z
          .string()
          .describe(
            'Work Location ID.You can obtain the work location ID through [Batch query of employment information]',
          )
          .optional(),
        wk_working_hours_type_id: z
          .string()
          .describe(
            'Working hours system ID.You can obtain the working hours system ID through [Batch query of job information]',
          )
          .optional(),
        wk_job_family_id: z
          .string()
          .describe('Job Family ID.You can obtain the job sequence ID through [Batch query of job information]')
          .optional(),
        wk_company_id: z
          .string()
          .describe('Company ID.You can get the company ID through [Batch query of job information]')
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const corehrV1LeaveLeaveBalances = {
  project: 'corehr',
  name: 'corehr.v1.leave.leaveBalances',
  sdkName: 'corehr.v1.leave.leaveBalances',
  path: '/open-apis/corehr/v1/leaves/leave_balances',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Leave management-Batch check employee vacation balance-Get the balance data of each vacation of employees in batches. The corresponding page is Leave Management - Leave Management - [Leave Report]',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
      as_of_date: z
        .string()
        .describe(
          'Query deadline, that is, the date until a certain day of balance data (if not passed, the default is the same day). The format is yyyy-MM-dd',
        )
        .optional(),
      employment_id_list: z
        .array(z.string())
        .describe(
          'List of employee IDs, up to 100 (if not passed, all employees will be queried by default), corresponding to user_id_type. Please note: this interface is a get request, so when passing in an array, it needs to meet the specifications of the get request to pass in an array, such as employment_id_ list=6919733291281024522 & employment_id_ list=6919733291281024523',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      time_zone: z.string().describe('Check time zone').optional(),
      include_offboard: z
        .boolean()
        .describe('Whether to get the exit conversion field, the default value is false')
        .optional(),
    }),
  },
};
export const corehrV1LeaveLeaveRequestHistory = {
  project: 'corehr',
  name: 'corehr.v1.leave.leaveRequestHistory',
  sdkName: 'corehr.v1.leave.leaveRequestHistory',
  path: '/open-apis/corehr/v1/leaves/leave_request_history',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Leave management-Batch query employee leave records-Get the leave record data of employees in batches. The corresponding page is Leave Management - Leave Management - [Leave Record]',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
      employment_id_list: z
        .array(z.string())
        .describe(
          'List of employee IDs, up to 100 (if not passed, all employees are queried by default), and the ID type is the same as user_id_type. Please note: this interface is a get request, so when passing in an array, it needs to meet the specifications of the get request to pass in an array, such as employment_id_ list=6919733291281024522 & employment_id_ list=6919733291281024523',
        )
        .optional(),
      initiator_id_list: z
        .array(z.string())
        .describe(
          'List of vacation initiator IDs, up to 100, with the same ID type as user_id_type. Note: This interface is a get request, so the incoming array needs to meet the specifications of the incoming array of get requests, such as initiator_id_list=6919733291281024522&initiator_id_list=6919733291281024523',
        )
        .optional(),
      leave_request_status: z
        .array(z.string())
        .describe(
          'The state of the leave record is not filled in as the unfiltered state. Please note: this interface is a get request, so when passing in the array, it needs to meet the specifications of the get request to pass in the array, for example leave_request_status = 1 & leave_request_status = 2Optional values are:- 1: Passed- 2: Approval is in progress- 3: Approval in progress (correction)- 4: Approval in progress (cancellation of vacation)- 5: Under approval (return to work)- 6: Returned to work- 7: rejected- 8: Cancelled- 9: Withdrawn',
        )
        .optional(),
      leave_type_id_list: z
        .array(z.string())
        .describe(
          'Vacation type ID list, enumeration values can be obtained through the [Get Vacation Type List] interface. Please note: This interface is a get request, so when passing an array, it needs to meet the specifications of the get request to pass an array, such as leave_type_id_list =4718803945687580501 & leave_type_id_ list=4718803945687580500',
        )
        .optional(),
      leave_start_date_min: z
        .string()
        .describe('The vacation starts later than or equal to the date in the format yyyy-MM-dd')
        .optional(),
      leave_start_date_max: z
        .string()
        .describe('The vacation start time is earlier than the equal date, in the format yyyy-MM-dd')
        .optional(),
      leave_end_date_min: z
        .string()
        .describe('Vacation ends later than or equal to a date in the format yyyy-MM-dd')
        .optional(),
      leave_end_date_max: z
        .string()
        .describe('The vacation end time is earlier than the equal date, in the format yyyy-MM-dd')
        .optional(),
      leave_submit_date_min: z
        .string()
        .describe('Vacation initiation time is later than or equal to the date, in the format yyyy-MM-dd')
        .optional(),
      leave_submit_date_max: z
        .string()
        .describe('Vacation initiation date earlier than or equal to, in the format yyyy-MM-dd')
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
      leave_update_time_min: z
        .string()
        .describe(
          'The leave record is updated later than or equal to the time, and the format is yyyy-MM-dd HH: mm: ss',
        )
        .optional(),
      leave_update_time_max: z
        .string()
        .describe(
          'The update time of the leave record is earlier than or equal to the time, and the format is yyyy-MM-dd HH: mm: ss',
        )
        .optional(),
      return_detail: z
        .boolean()
        .describe(
          '(Not yet open) Whether to return leave details, if true, leave details will be returned in the details field of each leave record',
        )
        .optional(),
      leave_term_type: z
        .number()
        .describe(
          'Specify the filter long/short fake type, 0 means no filter, 1 means only short fake, 2 means only long fake, default 0',
        )
        .optional(),
      time_zone: z.string().describe('Time zone where the leave record is located').optional(),
      data_source: z
        .number()
        .describe(
          '(Not yet open) Leave record data source, 1 means Chinese mainland vacation, 2 means overseas vacation, no transmission or 0 means no filtering',
        )
        .optional(),
      db_update_time_min: z
        .string()
        .describe(
          '(Not yet open) Leave record DB update time is later than or equal to the time, the format is yyyy-MM-dd HH: mm: ss',
        )
        .optional(),
      db_update_time_max: z
        .string()
        .describe(
          '(Not yet open) Leave record DB update time is earlier than or equal to the time, the format is yyyy-MM-dd HH: mm: ss',
        )
        .optional(),
      wd_need_amount_zero_records: z
        .boolean()
        .describe(
          'WorkDay-specific, whether to return a leave record with a value of 0, if true, a leave record with a value of 0 will be returned',
        )
        .optional(),
      wd_need_denied_and_canceled_record: z
        .boolean()
        .describe(
          'WorkDay-specific, whether rejected and cancelled leave records, if true, rejected and cancelled leave records will be returned',
        )
        .optional(),
      wd_paid_type: z
        .number()
        .describe(
          'WorkDay dedicated, deduction type, 1 does not participate in salary calculation 2 affects salary calculation 3 does not affect salary calculation',
        )
        .optional(),
    }),
  },
};
export const corehrV1LeaveLeaveTypes = {
  project: 'corehr',
  name: 'corehr.v1.leave.leaveTypes',
  sdkName: 'corehr.v1.leave.leaveTypes',
  path: '/open-apis/corehr/v1/leaves/leave_types',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Leave management-Get a list of vacation types-Get a list of vacation types configured in the background of vacation settings (such as annual leave, personal leave, marriage leave, etc.). The function of the corresponding page is Settings - Vacation Settings - [Vacation Types]',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
      status: z
        .string()
        .describe('"Vacation Type Status (All if not passed) Optional values are: - 1: Enabled - 2: Deactivated')
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_corehr_id']).describe('User ID type').optional(),
    }),
  },
};
export const corehrV1LeaveWorkCalendar = {
  project: 'corehr',
  name: 'corehr.v1.leave.workCalendar',
  sdkName: 'corehr.v1.leave.workCalendar',
  path: '/open-apis/corehr/v1/leaves/work_calendar',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Leave management-Get work calendar-Get work calendar information, such as name, status, etc',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      wk_calendar_ids: z
        .array(z.string())
        .describe(
          'A list of working calendar IDs, which can be passed in an empty array for the first time, such as []',
        ),
      wk_calendar_id_gt: z.string().describe('Work calendar ID greater than').optional(),
      wk_option: z
        .object({
          count: z
            .boolean()
            .describe('Whether to return the total number of work calendars that meet the criteria')
            .optional(),
          offset: z.number().describe('Offset').optional(),
          limit: z.number().describe('Limit'),
          sort_options: z
            .array(
              z.object({
                sort_field: z.string().describe('Sorting field').optional(),
                sort_order: z
                  .number()
                  .describe('Sorting order. Options:0(ASC Ascending order.),1(DESC Descending order.)')
                  .optional(),
                sort_i18n: z
                  .number()
                  .describe(
                    '0 = Chinese keywords; 1 = English keywords; 2 = Pinyin. Options:0(CN_KEYWORD Chinese keywords),1(EN_KEYWORD English keywords),2(SORT_FULL_PINYIN Pinyin)',
                  )
                  .optional(),
                sort_by_strand_length: z
                  .boolean()
                  .describe('Sort by the hierarchical depth of a specific field')
                  .optional(),
                sort_by_pinyin: z.boolean().describe('Is it sorted by Pinyin？').optional(),
                sort_by_enum_value_order: z
                  .boolean()
                  .describe('Is it sorted by the enumerated type value_order?')
                  .optional(),
              }),
            )
            .describe('Sort')
            .optional(),
        })
        .describe(
          'Pagination, sorting, and other options.Notice You need to set the limit parameter. The default value is 0',
        )
        .optional(),
      only_enable: z
        .boolean()
        .describe('Does it only return the enabled work calendars? If not specified, the default is true')
        .optional(),
    }),
  },
};
export const corehrV1LeaveWorkCalendarDate = {
  project: 'corehr',
  name: 'corehr.v1.leave.workCalendarDate',
  sdkName: 'corehr.v1.leave.workCalendarDate',
  path: '/open-apis/corehr/v1/leaves/work_calendar_date',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Leave management-Get work calendar date-Get work calendar date，the details for each day in the work calendar, such as date, date type, etc',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      wk_calendar_ids: z
        .array(z.string())
        .describe(
          'List of IDs in the work calendar, up to 100. You can obtain the work calendar ID through the API [Get work calendar]',
        ),
      dates: z
        .array(z.string())
        .describe(
          'Dates, in the format "2006-01-02", up to 50. **Note**:- If the ids parameter is not provided, then either the dates parameter or the [begin_date, end_date] parameters must be provided. - If the ids parameter is provided, then only the ids parameter will be effective, and there is no need to provide the dates parameter or the [begin_date, end_date] parameters',
        )
        .optional(),
      begin_date: z
        .string()
        .describe(
          'Date Range - Start Date;Must be used together with End Date.**Note**:- If the ids parameter is not provided, then either the dates parameter or the [begin_date, end_date] parameters must be provided. - If the ids parameter is provided, then only the ids parameter will be effective, and there is no need to provide the dates parameter or the [begin_date, end_date] parameters',
        )
        .optional(),
      end_date: z.string().describe('Date Range - End Date;Must be used together with Start Date;').optional(),
      offset: z.number().describe('Offset').optional(),
      limit: z.number().describe('Limit').optional(),
      ids: z
        .array(z.string())
        .describe(
          'Date id, you can use the response body data. calendar_dates.id.**Note**:- If the ids parameter is not provided, then either the dates parameter or the [begin_date, end_date] parameters must be provided. - If the ids parameter is provided, then only the ids parameter will be effective, and there is no need to provide the dates parameter or the [begin_date, end_date] parameters',
        )
        .optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const corehrV1LocationCreate = {
  project: 'corehr',
  name: 'corehr.v1.location.create',
  sdkName: 'corehr.v1.location.create',
  path: '/open-apis/corehr/v1/locations',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Location-Create location-Create location data for the first time in the system',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      hiberarchy_common: z
        .object({
          parent_id: z
            .string()
            .describe(
              'The superior location, in the creation of the scene, this field is required, and the enumeration value and detailed information can be obtained through the [Query Location List] interface query',
            )
            .optional(),
          name: z
            .array(
              z.object({
                lang: z.string().describe('language- Chinese with zh-CN, English with en-US'),
                value: z.string().describe('content'),
              }),
            )
            .describe(
              'nameThe name cannot contain 「/」「；」「;」 characters.- The Chinese and English names of the location will be globally unique',
            ),
          active: z.boolean().describe('enable'),
          code: z
            .string()
            .describe(
              'Code - Code (cannot be repeated with the encoding of other records), this field will be invalid when automatic encoding is turned on',
            )
            .optional(),
          description: z
            .array(
              z.object({
                lang: z.string().describe('Language- Chinese with zh-CN, English with en-US'),
                value: z.string().describe('content'),
              }),
            )
            .describe('describe')
            .optional(),
        })
        .describe(
          'Location basic information, the structure maintains the name of the location, code, enable status, location, and other basic information',
        ),
      location_usage_list: z
        .array(
          z.object({
            enum_name: z
              .string()
              .describe(
                'The enumeration value, location use ID, enumeration value and detailed information can be obtained through the [Batch Query Location Use] interface query',
              ),
          }),
        )
        .describe('Location Usage')
        .optional(),
      address: z
        .array(
          z.object({
            country_region_id: z
              .string()
              .describe('Country IDIt can be obtained through the [Query country/region information] interface'),
            region_id: z
              .string()
              .describe(
                'Main administrative region IDIt can be obtained through the [Query Province/Administrative Region Information] interface',
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
            address_line1: z
              .string()
              .describe('Address line 1- The filling rules can be seen in [Address Filling Guide]')
              .optional(),
            address_line2: z
              .string()
              .describe('Address line 2- The filling rules can be seen in [Address Filling Guide]')
              .optional(),
            address_line3: z
              .string()
              .describe('Address line 3- The filling rules can be seen in [Address Filling Guide]')
              .optional(),
            address_line4: z
              .string()
              .describe('Address line 4- The filling rules can be seen in [Address Filling Guide]')
              .optional(),
            address_line5: z
              .string()
              .describe('Address line 5- The filling rules can be seen in [Address Filling Guide]')
              .optional(),
            address_line6: z
              .string()
              .describe('Address line 6- The filling rules can be seen in [Address Filling Guide]')
              .optional(),
            address_line7: z
              .string()
              .describe('Address line 7- The filling rules can be seen in [Address Filling Guide]')
              .optional(),
            address_line8: z
              .string()
              .describe('Address line 8- The filling rules can be seen in [Address Filling Guide]')
              .optional(),
            address_line9: z
              .string()
              .describe('Address line 9- The filling rules can be seen in [Address Filling Guide]')
              .optional(),
            local_address_line1: z
              .string()
              .describe(
                'Address line 1 (non-Latin native script)- The filling rules can be seen in [Address Filling Guide]',
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
                'Address line 5 (non-Latin native script)- The filling rules can be seen in [Address Filling Guide]',
              )
              .optional(),
            local_address_line6: z
              .string()
              .describe(
                'Address line 6 (non-Latin native script)- The filling rules can be seen in [Address Filling Guide]',
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
            postal_code: z.string().describe('Postal Code').optional(),
            address_type_list: z
              .array(z.object({ enum_name: z.string().describe('enumeration value') }))
              .describe(
                'Address type, enumeration value and details can be obtained by [Query Address Type] interface query.- Request parameter object_api_name=address; custom_api_name=address_type',
              )
              .optional(),
            is_primary: z.boolean().describe('Primary address').optional(),
            is_public: z.boolean().describe('Public address').optional(),
          }),
        )
        .describe('address')
        .optional(),
      working_hours_type_id: z
        .string()
        .describe(
          'The working hour system ID, enumeration value and detailed information can be obtained through the [batch query working hour system] interface query',
        )
        .optional(),
      effective_time: z
        .string()
        .describe(
          'Version effective date- Fill in the format: YYYY-MM-DD 00:00:00 (the system will automatically change the hours, minutes and seconds to 00:00:00)- The system defaults to take effect at 00:00:00 on the day when the date is filled in- This interface only supports the smallest unit of day- Date range requirements: 1900-01-01 00:00:00～9999-12-31 23:59:59',
        ),
      locale: z
        .object({ enum_name: z.string().describe('enumeration value') })
        .describe(
          'Locale ID, enumeration values and details can be obtained by [Batch Query Enumeration Information] interface query.- Request parameter object_api_name=location; custom_api_name=locale',
        )
        .optional(),
      time_zone_id: z.string().describe('Time zone').optional(),
      display_language_id: z.string().describe('Default Language').optional(),
    }),
    params: z
      .object({
        client_token: z
          .string()
          .describe(
            'A unique identifier for an idempotent perform update operation in the standard UUIDV4 format. This value is null to indicate that a new request will be initiated, and this value is non-null to indicate an idempotent perform update operation',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV1LocationDelete = {
  project: 'corehr',
  name: 'corehr.v1.location.delete',
  sdkName: 'corehr.v1.location.delete',
  path: '/open-apis/corehr/v1/locations/:location_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Location-Delete location-Delete location',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      location_id: z
        .string()
        .describe(
          'Location ID to be deleted ID acquisition method:- Call [Create Location] [Batch Paging Query Location] and other interfaces to return the location ID',
        ),
    }),
  },
};
export const corehrV1LocationGet = {
  project: 'corehr',
  name: 'corehr.v1.location.get',
  sdkName: 'corehr.v1.location.get',
  path: '/open-apis/corehr/v1/locations/:location_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Location-Get location information-The interface is used to query location information according to location ID, including location name, description, location usage, working hours system, regional setting, time zone and associated address information',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      location_id: z
        .string()
        .describe(
          'The location record ID maintained by the location maintenance administrator in the Feishu personnel system, organization management module.ID acquisition method:- Call [Create Location] [Batch Paging Query Location] and other interfaces to return the location ID',
        ),
    }),
  },
};
export const corehrV1LocationList = {
  project: 'corehr',
  name: 'corehr.v1.location.list',
  sdkName: 'corehr.v1.location.list',
  path: '/open-apis/corehr/v1/locations',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Organization management-Location-Get location list-The interface is used to query location information in batches according to location ID, including location name, description, location purpose, working hours system, regional setting, time zone and associated address information',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
    }),
  },
};
export const corehrV1NationalIdTypeCreate = {
  project: 'corehr',
  name: 'corehr.v1.nationalIdType.create',
  sdkName: 'corehr.v1.nationalIdType.create',
  path: '/open-apis/corehr/v1/national_id_types',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Type of national certificate-Create national document type-Create national document type',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      country_region_id: z.string().describe('Country/Region'),
      name: z
        .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
        .describe('Name'),
      active: z.boolean().describe('Enable'),
      validation_rule: z.string().describe('Verification rule'),
      validation_rule_description: z
        .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
        .describe('Verification rule description')
        .optional(),
      code: z.string().describe('Encoding'),
      identification_type: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe('Type of certificate'),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('Field name'),
            value: z
              .string()
              .describe(
                'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
              ),
          }),
        )
        .describe('Custom fields')
        .optional(),
    }),
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
export const corehrV1NationalIdTypeDelete = {
  project: 'corehr',
  name: 'corehr.v1.nationalIdType.delete',
  sdkName: 'corehr.v1.nationalIdType.delete',
  path: '/open-apis/corehr/v1/national_id_types/:national_id_type_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Type of national certificate-Delete national document type-Delete national document type',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ national_id_type_id: z.string().describe('Type ID of national document to be deleted') }),
  },
};
export const corehrV1NationalIdTypeGet = {
  project: 'corehr',
  name: 'corehr.v1.nationalIdType.get',
  sdkName: 'corehr.v1.nationalIdType.get',
  path: '/open-apis/corehr/v1/national_id_types/:national_id_type_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Type of national certificate-Get national ID type-Obtain national ID type information with ID',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ national_id_type_id: z.string().describe('Type ID') }),
  },
};
export const corehrV1NationalIdTypeList = {
  project: 'corehr',
  name: 'corehr.v1.nationalIdType.list',
  sdkName: 'corehr.v1.nationalIdType.list',
  path: '/open-apis/corehr/v1/national_id_types',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Type of national certificate-Get the list of national ID type-Get the list of national ID type',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
      identification_type: z.string().describe('Type of certificate').optional(),
      code: z.string().describe('Certificate type code').optional(),
      country_region_id: z.string().describe('Country Area ID').optional(),
    }),
  },
};
export const corehrV1NationalIdTypePatch = {
  project: 'corehr',
  name: 'corehr.v1.nationalIdType.patch',
  sdkName: 'corehr.v1.nationalIdType.patch',
  path: '/open-apis/corehr/v1/national_id_types/:national_id_type_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Type of national certificate-Update national document type-Update national document type',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        country_region_id: z.string().describe('Country/Region').optional(),
        name: z
          .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
          .describe('Name')
          .optional(),
        active: z.boolean().describe('Enable').optional(),
        validation_rule: z.string().describe('Verification rule').optional(),
        validation_rule_description: z
          .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
          .describe('Verification rule description')
          .optional(),
        code: z.string().describe('Encoding').optional(),
        identification_type: z
          .object({ enum_name: z.string().describe('Enumeration value') })
          .describe('Type of certificate')
          .optional(),
        custom_fields: z
          .array(
            z.object({
              field_name: z.string().describe('Field name'),
              value: z
                .string()
                .describe(
                  'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                ),
            }),
          )
          .describe('Custom fields')
          .optional(),
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
    path: z.object({ national_id_type_id: z.string().describe('Type ID') }),
  },
};
export const corehrV1OffboardingQuery = {
  project: 'corehr',
  name: 'corehr.v1.offboarding.query',
  sdkName: 'corehr.v1.offboarding.query',
  path: '/open-apis/corehr/v1/offboardings/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee turnover-Query the list of reasons for employees offboarding-This interface is used to query the option information of [Offboarding configuration] > reason for offboarding, which return the unique identity, name and enabled status of the reason for offboarding option',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        active: z
          .boolean()
          .describe(
            'Enable status.Search the reason for offboarding in all status when empty. Options are:1. true2. false',
          )
          .optional(),
        offboarding_reason_unique_identifier: z
          .array(z.string())
          .describe(
            'Reason for offboarding unique identifier list, used to filter reason for offboarding, search for all reasons for offboarding when empty, up to 20 supported',
          )
          .optional(),
      })
      .optional(),
  },
};
export const corehrV1OffboardingSearch = {
  project: 'corehr',
  name: 'corehr.v1.offboarding.search',
  sdkName: 'corehr.v1.offboarding.search',
  path: '/open-apis/corehr/v1/offboardings/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee turnover-search offboarding information-This interface supports searching for offboarding information in fields such as employee ID, resignation approval start time, and resignation date, which can obtain information including resignation date, reason for resignation, resignation status, and process approval status',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        employment_ids: z
          .array(z.string())
          .describe(
            'Employment ID list.The ID type is consistent with the value of the query parameter user_id_type:1. When the value of user_id_type is open_id, please refer to [How to obtain your own Open ID] for the ID acquisition method.2. When the value of user_id_type is user_id, please refer to [How to obtain your own User ID] for the ID acquisition method.3. When the value of user_id_type is union_id, please refer to [How to obtain your own Union ID] for the ID acquisition method.4. When the value of user_id_type is people_corehr_id, first refer to [How to obtain your own User ID] to obtain the User ID. Then obtain the employment ID through [ID conversion]',
          )
          .optional(),
        apply_initiating_time_start: z
          .string()
          .describe(
            'Offboarding approval initiation time(the start of the search range).This field is optional and need to be used together with the end of the search range. please pass in the second-level timestamp format',
          )
          .optional(),
        apply_initiating_time_end: z
          .string()
          .describe(
            'Offboarding approval initiation time(the end of the search range).This field is optional and need to be used together with the start of the search range. Please pass in in the second-level timestamp format',
          )
          .optional(),
        apply_finished_time_start: z
          .string()
          .describe(
            'Exit approval end time (start range of search), please pass in the second-level timestamp format. This field is not required and needs to be used in conjunction with exit approval end time (end range of search)',
          )
          .optional(),
        apply_finished_time_end: z
          .string()
          .describe(
            'Exit approval end time (end range of search), please pass in the second-level timestamp format. This field is not required and needs to be used with exit approval end time (start range of search)',
          )
          .optional(),
        expected_offboarding_date_start: z
          .string()
          .describe(
            'Expected offboarding date(the start of the search range).This field is optional and need to be used together with the end of the search range.please enter in date format',
          )
          .optional(),
        expected_offboarding_date_end: z
          .string()
          .describe(
            'Expected offboarding date(the end of the search range).This field is optional and need to be used together with the start of the search range.please enter in date format',
          )
          .optional(),
        offboarding_date_start: z
          .string()
          .describe(
            'Offboarding date(the start of the search range).This field is optional and need to be used together with the end of the search range.please enter in date format',
          )
          .optional(),
        offboarding_date_end: z
          .string()
          .describe(
            'Offboarding date(the start of the search range).This field is optional and need to be used together with the start of the search range.please enter in date format',
          )
          .optional(),
        statuses: z
          .array(
            z
              .enum(['Approving', 'Approved', 'Offboarded', 'Rejected', 'Withdrawn', 'NoNeedApproval'])
              .describe(
                'Options:Approving(Approving approval),Approved(Approved),Offboarded(Offboarded),Rejected(Rejected Rejected),Withdrawn(Withdrawn),NoNeedApproval(NoNeedApproval is not required)',
              ),
          )
          .describe(
            'Separation status, an "or" relationship between multiple states.It will searching offboarding information in all status when the value is empty',
          )
          .optional(),
        reasons: z
          .array(z.string())
          .describe(
            'The reason for leaving list can be obtained through the [Query employee reason for leaving list] interface, and the departure information related to the lower-level reasons is not returned when querying.It will searching offboarding information in all reason when the value is empty. <b> Field permission requirements: </b> <md-perm name="corehr:employment.offboarding_reason.search:read" desc="Search by reason for offboarding" support_app_types="custom,isv" tags="">Search by reason for offboarding</md-perm>',
          )
          .optional(),
        employee_reasons: z
          .array(z.string())
          .describe(
            'The reason for leaving (employee) list can be obtained through the [Query the employee reason for leaving list] interface, and the departure information related to the subordinate reason is not returned when querying.It will searching offboarding information in all reason when the value is empty. <b> Field permission requirements: </b><md-perm name="corehr:employment.offboarding_reason.search:read" desc="Search by reason for offboarding" support_app_types="custom,isv" tags="">Search by reason for offboarding</md-perm>',
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
    }),
  },
};
export const corehrV1OffboardingSubmit = {
  project: 'corehr',
  name: 'corehr.v1.offboarding.submit',
  sdkName: 'corehr.v1.offboarding.submit',
  path: '/open-apis/corehr/v1/offboardings/submit',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Resignation-Operation employee resignation-This interface is used to initiate employee offboarding, which is equivalent to the direct offboarding function of employees in the Feishu CoreHR. If initiated successfully, an employee's offboarding record will be saved and corresponding events will be send.Refer to [Change of offboarding application status (new)] and [Change of offboarding checklist status]",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      offboarding_mode: z
        .number()
        .describe(
          'Offboarding mode,currently only direct offboarding is supported Options:1(Termination_of_dismissal Direct offboarding)',
        ),
      employment_id: z
        .string()
        .describe(
          'Employee ID. The ID type is consistent with the value of the query parameter user_id_type:1. When the value of user_id_type is open_id, please refer to [How to obtain your own Open ID] for the ID acquisition method.2. When the value of user_id_type is user_id, please refer to [How to obtain your own User ID] for the ID acquisition method.3. When the value of user_id_type is union_id, please refer to [How to obtain your own Union ID] for the ID acquisition method.4. When the value of user_id_type is people_corehr_id, first refer to [How to obtain your own User ID] to obtain the User ID. Then obtain the employment ID through [ID conversion]',
        ),
      offboarding_date: z.string().describe('Offboarding date,parameter format should be YYYY-MM-DD'),
      offboarding_reason_unique_identifier: z
        .string()
        .describe(
          'The reason for offboarding,can be obtained through the interface[【Query the list of reasons for employee offboarding】]',
        ),
      offboarding_reason_explanation: z
        .string()
        .describe(
          'The reason explanation for offboarding,length limit is 6000 characters.This field is allowed to be empty',
        )
        .optional(),
      initiator_id: z
        .string()
        .describe(
          'Initiator ID.The ID type is consistent with the value of the query parameter user_id_type:1. When the value of user_id_type is open_id, please refer to [How to obtain your own Open ID] for the ID acquisition method.2. When the value of user_id_type is user_id, please refer to [How to obtain your own User ID] for the ID acquisition method.3. When the value of user_id_type is union_id, please refer to [How to obtain your own Union ID] for the ID acquisition method.4. When the value of user_id_type is people_corehr_id, first refer to [How to obtain your own User ID] to obtain the User ID. Then obtain the employment ID through [ID conversion].Note: 1. Only the operator can revoke the offboarding2. The operator will be system user When it is empty',
        )
        .optional(),
      add_block_list: z
        .boolean()
        .describe(
          "Whether to join the offboarding block listAttention:1. When the value is true, the block_reason is required.2. When the value is false, it is not allowed to fill in the block_reason and block_reason_explanation.3. When the value is empty, it is not allowed to fill in the block_reason and block_reason_explanation.4. If you choose to join the block list when operate employee's offboarding, you will only enter the block list after the employee's offboarding takes effect",
        )
        .optional(),
      block_reason: z
        .string()
        .describe(
          'The reason for block listNotice:1. The value of this field is in the blocking reason field option set of [Individual Profile Settings] > Individual Information Settings > Offboarding Info.2. Whether this field is required depends on add_blokc_list',
        )
        .optional(),
      block_reason_explanation: z
        .string()
        .describe('The reason explanation for block list.this field is allowed to be empty')
        .optional(),
      custom_fields: z
        .array(
          z.object({
            field_name: z
              .string()
              .describe(
                'The unique identifier of the fieldNote: The value is the field apiname of each field in [Individual Profile Settings] > Individual Information Settings > Offboarding Info',
              ),
            value: z
              .string()
              .describe(
                'The field value is the string escaped by json, and the field format is different according to the metadata definition (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2\\"], "2006-01-02 15:04:05").Attention:1. The enumeration value of the enumeration field is set to [Personnel File Configuration] > Information Configuration > Leaving Information, which corresponds to the option encoding of the field option set.2. The enumeration field value also can be obtained by [Get Field Details], the reference interface returns, field details > field type configuration information > option configuration information > option information > enumeration value set API name3. The personnel field currently only supports the incoming employee\'s employment ID. First refer to [How to obtain your own User ID] to obtain the User ID. Then obtain the employment ID through [ID conversion].4. Filling in the attachment type field is not supported for the time being',
              ),
          }),
        )
        .describe(
          'Offboarding custom fieldNote: For the range of fields that can be filled in, please refer to the custom fields in [Individual Profile Settings] > Individual Information Settings > Offboarding Info',
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
export const corehrV1PersonCreate = {
  project: 'corehr',
  name: 'corehr.v1.person.create',
  sdkName: 'corehr.v1.person.create',
  path: '/open-apis/corehr/v1/persons',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Personal information-Create Personal Information-Create personal information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name_list: z
        .array(
          z.object({
            local_primary: z.string().describe('Last name-local text').optional(),
            local_first_name: z.string().describe('Name-local text').optional(),
            country_region_id: z.string().describe('Country/Region'),
            name_type: z.object({ enum_name: z.string().describe('Enumeration value') }).describe('Name Type'),
            local_first_name_2: z.string().describe('Name-second local text').optional(),
            local_primary_2: z.string().describe('Last name-second local text').optional(),
            additional_name_type: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Supplementary name type')
              .optional(),
            first_name: z.string().describe('Name').optional(),
            full_name: z.string().describe('Full name').optional(),
            hereditary: z.string().describe('Name').optional(),
            custom_name: z
              .string()
              .describe(
                'Custom name (when not passed in, the name will be spliced according to the rules of the country/region to which it belongs)',
              )
              .optional(),
            custom_local_name: z
              .string()
              .describe(
                'Custom name of local text (when not passed in, the name of the local text will be stitched together with the relevant last name and first name field of the local text according to the rules of the country/region to which it belongs)',
              )
              .optional(),
            middle_name: z.string().describe('Middle name').optional(),
            name_primary: z.string().describe('Last name').optional(),
            secondary: z.string().describe('Second surname').optional(),
            social: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Honorific title')
              .optional(),
            tertiary: z.string().describe('Married surname').optional(),
            title: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Title')
              .optional(),
            local_middle_name: z.string().describe('Local middle name').optional(),
            local_secondary: z.string().describe('Second surname-local text').optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Name'),
      gender: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe('Gender')
        .optional(),
      date_of_birth: z.string().describe('Date of birth').optional(),
      nationality_id: z.string().describe('ID number').optional(),
      race: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe('Ethnicity/race')
        .optional(),
      marital_status: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe('Marital status')
        .optional(),
      phone_list: z
        .array(
          z.object({
            international_area_code: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe(
                'Country area code Common such as: 86_china (China), 852_hong_kong (Hong Kong, China), 886_taiwan (Taiwan, China), 853_macao (Macao, China), 1_united_states_of_america (United States of America), 7_russian_federation (Russian Federation), 44_united_kingdom (United Kingdom), 81_japan (Japan), 82_korea_republic_of (Republic of Korea), 91_india (India)',
              )
              .optional(),
            phone_number: z.string().describe('Phone number'),
            device_type: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Device Type')
              .optional(),
            phone_usage: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Telephone use')
              .optional(),
            is_primary: z.boolean().describe('Main phone').optional(),
            is_public: z.boolean().describe('Public call').optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe(
          'Phone list , The phone is visible on the profile page only if all of the following conditions are met:- phone_number is not null- is_primary = `"true"` - phone_usage = `"home"`',
        )
        .optional(),
      address_list: z
        .array(
          z.object({
            country_region_id: z.string().describe('Country/Region'),
            region_id: z.string().describe('Main Administrative Region').optional(),
            city_id: z.string().describe('City').optional(),
            distinct_id: z.string().describe('District/County').optional(),
            local_address_line1: z.string().describe('Address line 1 (non-Latin native text)').optional(),
            local_address_line2: z.string().describe('Address line 2 (non-Latin native text)').optional(),
            local_address_line3: z.string().describe('Address line 3 (non-Latin native text)').optional(),
            local_address_line4: z.string().describe('Address line 4 (non-Latin native text)').optional(),
            local_address_line5: z.string().describe('Address line 5 (non-Latin native text)').optional(),
            local_address_line6: z.string().describe('Address line 6 (non-Latin native text)').optional(),
            local_address_line7: z.string().describe('Address line 7 (non-Latin native text)').optional(),
            local_address_line8: z.string().describe('Address line 8 (non-Latin native text)').optional(),
            local_address_line9: z.string().describe('Address line 9 (non-Latin native text)').optional(),
            postal_code: z.string().describe('Postal Code').optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Address')
        .optional(),
      email_list: z
        .array(
          z.object({
            email: z.string().describe('Mailbox number'),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Mail')
        .optional(),
      work_experience_list: z
        .array(
          z.object({
            company_organization: z
              .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
              .describe('Company/organization')
              .optional(),
            department: z
              .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
              .describe('Department')
              .optional(),
            job: z
              .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
              .describe('Position')
              .optional(),
            description: z
              .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
              .describe('Job description')
              .optional(),
            start_date: z.string().describe('Start date').optional(),
            end_date: z.string().describe('End date').optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Work history')
        .optional(),
      education_list: z
        .array(
          z.object({
            school: z
              .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
              .describe('School'),
            level_of_education: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Education')
              .optional(),
            start_date: z.string().describe('Start date').optional(),
            end_date: z.string().describe('End date').optional(),
            field_of_study: z
              .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
              .describe('Professional')
              .optional(),
            degree: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Degree')
              .optional(),
            school_name: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('School name')
              .optional(),
            field_of_study_name: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Professional name')
              .optional(),
            country_region_id: z.string().describe('Country Area ID').optional(),
            expected_end_date: z.string().describe('Expected end date').optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Educational experience')
        .optional(),
      bank_account_list: z
        .array(
          z.object({
            bank_name: z
              .string()
              .describe("Bank name , which can be empty if the field 'bank' has been filled in")
              .optional(),
            bank_account_number: z.string().describe('Bank account number'),
            account_holder: z.string().describe('Name of account holder'),
            bank: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Enum of banks , such as bank-5 (Bank of Communications)')
              .optional(),
            branch_name: z.string().describe('Branch name').optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
            country_region_id: z
              .string()
              .describe(
                'Country/region id, detailed information can be obtained through the [Query Country/Region Information] interface',
              )
              .optional(),
            bank_account_usage: z
              .array(z.object({ enum_name: z.string().describe('Enumeration value') }))
              .describe(
                'Bank card usage, the emuneration value can be obtained through the document [Feishu Personnel Enumeration Constant] Bank card usage (bank_account_usage) enumeration definition section',
              )
              .optional(),
            bank_account_type: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe(
                'The bank card type and emuneration value can be obtained through the document [Feishu Personnel Enumeration Constant] bank card type (bank_account_type) enumeration definition section',
              )
              .optional(),
            currency_id: z.string().describe('Currency id').optional(),
          }),
        )
        .describe('Bank account number')
        .optional(),
      national_id_list: z
        .array(
          z.object({
            national_id_type_id: z.string().describe('Type of national document'),
            national_id_number: z.string().describe('ID number'),
            issue_date: z.string().describe('Date of issuance').optional(),
            expiration_date: z.string().describe('Certificate expiration date').optional(),
            country_region_id: z.string().describe('Country/Region'),
            issued_by: z.string().describe('Document issuing agency').optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('ID number')
        .optional(),
      dependent_list: z
        .array(
          z.object({
            name: z
              .object({
                local_primary: z.string().describe('Last name-local text').optional(),
                local_first_name: z.string().describe('Name-local text').optional(),
                country_region_id: z.string().describe('Country/Region'),
                name_type: z.object({ enum_name: z.string().describe('Enumeration value') }).describe('Name Type'),
                local_first_name_2: z.string().describe('Name-second local text').optional(),
                local_primary_2: z.string().describe('Last name-second local text').optional(),
                additional_name_type: z
                  .object({ enum_name: z.string().describe('Enumeration value') })
                  .describe('Supplementary name type')
                  .optional(),
                first_name: z.string().describe('Name').optional(),
                full_name: z.string().describe('Full name').optional(),
                hereditary: z.string().describe('Name').optional(),
                custom_name: z
                  .string()
                  .describe(
                    'Custom name (when not passed in, the name will be spliced according to the rules of the country/region to which it belongs)',
                  )
                  .optional(),
                custom_local_name: z
                  .string()
                  .describe(
                    'Custom name of local text (when not passed in, the name of the local text will be stitched together with the relevant last name and first name field of the local text according to the rules of the country/region to which it belongs)',
                  )
                  .optional(),
                middle_name: z.string().describe('Middle name').optional(),
                name_primary: z.string().describe('Last name').optional(),
                secondary: z.string().describe('Second surname').optional(),
                social: z
                  .object({ enum_name: z.string().describe('Enumeration value') })
                  .describe('Honorific title')
                  .optional(),
                tertiary: z.string().describe('Married surname').optional(),
                title: z
                  .object({ enum_name: z.string().describe('Enumeration value') })
                  .describe('Title')
                  .optional(),
                local_middle_name: z.string().describe('Local middle name').optional(),
                local_secondary: z.string().describe('Second surname-local text').optional(),
                custom_fields: z
                  .array(
                    z.object({
                      field_name: z.string().describe('Field name'),
                      value: z
                        .string()
                        .describe(
                          'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                        ),
                    }),
                  )
                  .describe('Custom fields')
                  .optional(),
              })
              .describe('Name')
              .optional(),
            relationship: z.object({ enum_name: z.string().describe('Enumeration value') }).describe('Relationship'),
            gender: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Gender')
              .optional(),
            date_of_birth: z.string().describe('Birthday').optional(),
            nationality_id: z.string().describe('Nationality').optional(),
            national_id_list: z
              .array(
                z.object({
                  national_id_type_id: z.string().describe('Type of national document'),
                  national_id_number: z.string().describe('ID number'),
                  issue_date: z.string().describe('Date of issuance').optional(),
                  expiration_date: z.string().describe('Certificate expiration date').optional(),
                  country_region_id: z.string().describe('Country/Region'),
                  issued_by: z.string().describe('Document issuing agency').optional(),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('Field name'),
                        value: z
                          .string()
                          .describe(
                            'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                          ),
                      }),
                    )
                    .describe('Custom fields')
                    .optional(),
                }),
              )
              .describe('ID number')
              .optional(),
            spouses_working_status: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Spouse working status')
              .optional(),
            is_this_person_covered_by_health_insurance: z
              .boolean()
              .describe('Including family medical insurance')
              .optional(),
            is_this_person_allowed_for_tax_deduction: z
              .boolean()
              .describe('Allowing family members to deduct taxes')
              .optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
            dependent_name: z.string().describe('Family member name').optional(),
            employer: z.string().describe('work unit').optional(),
            job: z.string().describe('post').optional(),
            phone: z
              .object({
                international_area_code: z
                  .object({ enum_name: z.string().describe('Enumeration value') })
                  .describe(
                    'Country area code Common such as: 86_china (China), 852_hong_kong (Hong Kong, China), 886_taiwan (Taiwan, China), 853_macao (Macao, China), 1_united_states_of_america (United States of America), 7_russian_federation (Russian Federation), 44_united_kingdom (United Kingdom), 81_japan (Japan), 82_korea_republic_of (Republic of Korea), 91_india (India)',
                  )
                  .optional(),
                phone_number: z.string().describe('Phone number'),
                custom_fields: z
                  .array(
                    z.object({
                      field_name: z.string().describe('Field name'),
                      value: z
                        .string()
                        .describe(
                          'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                        ),
                    }),
                  )
                  .describe('Custom fields')
                  .optional(),
              })
              .describe('Telephone')
              .optional(),
            address: z
              .object({
                id: z.string().describe('Address id').optional(),
                country_region_id: z.string().describe('Country/Region'),
                region_id: z.string().describe('Main Administrative Region').optional(),
                city_id: z.string().describe('City').optional(),
                distinct_id: z.string().describe('District/County').optional(),
                local_address_line1: z
                  .string()
                  .describe('City, you can check through the [Query City Information] interface')
                  .optional(),
                local_address_line2: z
                  .string()
                  .describe('District/county, you can check through the [Query District/County Information] interface')
                  .optional(),
                local_address_line3: z.string().describe('Address line 1 (non-Latin native text)').optional(),
                local_address_line4: z.string().describe('Address line 2 (non-Latin native text)').optional(),
                local_address_line5: z.string().describe('Address line 3 (non-Latin native text)').optional(),
                local_address_line6: z.string().describe('Address line 4 (non-Latin native text)').optional(),
                local_address_line7: z.string().describe('Address line 5 (non-Latin native text)').optional(),
                local_address_line8: z.string().describe('Address line 6 (non-Latin native text)').optional(),
                local_address_line9: z.string().describe('Address line 7 (non-Latin native text)').optional(),
                postal_code: z.string().describe('Address line 8 (non-Latin native text)').optional(),
                custom_fields: z
                  .array(
                    z.object({
                      field_name: z.string().describe('Field name'),
                      value: z
                        .string()
                        .describe(
                          'The field value is a string escaped by json. According to the metadata definition, the field format is different (123,123.23, true, [\\ "id1\\",\\ "id2\\], 2006-01-02 15:04:05])',
                        ),
                    }),
                  )
                  .describe('Address line 9 (non-Latin native text)')
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
        .describe('Relatives')
        .optional(),
      emergency_contact_list: z
        .array(
          z.object({
            name: z
              .object({
                local_primary: z.string().describe('Last name-local text').optional(),
                local_first_name: z.string().describe('Name-local text').optional(),
                country_region_id: z.string().describe('Country/Region'),
                name_type: z.object({ enum_name: z.string().describe('Enumeration value') }).describe('Name Type'),
                local_first_name_2: z.string().describe('Name-second local text').optional(),
                local_primary_2: z.string().describe('Last name-second local text').optional(),
                additional_name_type: z
                  .object({ enum_name: z.string().describe('Enumeration value') })
                  .describe('Supplementary name type')
                  .optional(),
                first_name: z.string().describe('Name').optional(),
                full_name: z.string().describe('Full name').optional(),
                hereditary: z.string().describe('Name').optional(),
                custom_name: z
                  .string()
                  .describe(
                    'Custom name (when not passed in, the name will be spliced according to the rules of the country/region to which it belongs)',
                  )
                  .optional(),
                custom_local_name: z
                  .string()
                  .describe(
                    'Custom name of local text (when not passed in, the name of the local text will be stitched together with the relevant last name and first name field of the local text according to the rules of the country/region to which it belongs)',
                  )
                  .optional(),
                middle_name: z.string().describe('Middle name').optional(),
                name_primary: z.string().describe('Last name').optional(),
                secondary: z.string().describe('Second surname').optional(),
                social: z
                  .object({ enum_name: z.string().describe('Enumeration value') })
                  .describe('Honorific title')
                  .optional(),
                tertiary: z.string().describe('Married surname').optional(),
                title: z
                  .object({ enum_name: z.string().describe('Enumeration value') })
                  .describe('Title')
                  .optional(),
                local_middle_name: z.string().describe('Local middle name').optional(),
                local_secondary: z.string().describe('Second surname-local text').optional(),
                custom_fields: z
                  .array(
                    z.object({
                      field_name: z.string().describe('Field name'),
                      value: z
                        .string()
                        .describe(
                          'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                        ),
                    }),
                  )
                  .describe('Custom fields')
                  .optional(),
              })
              .describe('Name')
              .optional(),
            relationship: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Relationship')
              .optional(),
            phone_ist: z
              .array(
                z.object({
                  international_area_code: z
                    .object({ enum_name: z.string().describe('Enumeration value') })
                    .describe(
                      'Country area code Common such as: 86_china (China), 852_hong_kong (Hong Kong, China), 886_taiwan (Taiwan, China), 853_macao (Macao, China), 1_united_states_of_america (United States of America), 7_russian_federation (Russian Federation), 44_united_kingdom (United Kingdom), 81_japan (Japan), 82_korea_republic_of (Republic of Korea), 91_india (India)',
                    )
                    .optional(),
                  phone_number: z.string().describe('Phone number'),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('Field name'),
                        value: z
                          .string()
                          .describe(
                            'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                          ),
                      }),
                    )
                    .describe('Custom fields')
                    .optional(),
                }),
              )
              .describe('Phone')
              .optional(),
            custom_fields: z
              .array(
                z.object({
                  field_name: z.string().describe('Field name'),
                  value: z
                    .string()
                    .describe(
                      'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                    ),
                }),
              )
              .describe('Custom fields')
              .optional(),
            legal_name: z.string().describe('Legal name').optional(),
          }),
        )
        .describe('Emergency Contact')
        .optional(),
      date_entered_workforce: z.string().describe('Date of entry to workplace').optional(),
      profile_image_id: z.string().describe('The id of the avatar resource').optional(),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('Field name'),
            value: z
              .string()
              .describe(
                'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
              ),
          }),
        )
        .describe('Custom fields')
        .optional(),
      resident_tax_id_list: z.array(z.string()).describe('Tax identity information').optional(),
      age: z.number().describe('Age').optional(),
      personal_profile: z
        .array(
          z.object({
            personal_profile_type: z
              .object({ enum_name: z.string().describe('Enumeration value') })
              .describe('Data type')
              .optional(),
            files: z
              .array(z.object({ id: z.string().describe('Upload file ID').optional() }))
              .describe('Upload file list')
              .optional(),
          }),
        )
        .describe('Personal Data')
        .optional(),
    }),
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
export const corehrV1PersonDelete = {
  project: 'corehr',
  name: 'corehr.v1.person.delete',
  sdkName: 'corehr.v1.person.delete',
  path: '/open-apis/corehr/v1/persons/:person_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Employee information-Personal information-Delete personal information-Delete personal information',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ person_id: z.string().describe('Person ID to be deleted') }),
  },
};
export const corehrV1PersonGet = {
  project: 'corehr',
  name: 'corehr.v1.person.get',
  sdkName: 'corehr.v1.person.get',
  path: '/open-apis/corehr/v1/persons/:person_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Personal information-Get personal information-Obtain personal information with ID',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({ user_id_type: z.literal('people_employee_id').describe('User ID type').optional() }).optional(),
    path: z.object({ person_id: z.string().describe('Person ID') }),
  },
};
export const corehrV1PersonPatch = {
  project: 'corehr',
  name: 'corehr.v1.person.patch',
  sdkName: 'corehr.v1.person.patch',
  path: '/open-apis/corehr/v1/persons/:person_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Personal information-Update personal information-Update personal information',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        name_list: z
          .array(
            z.object({
              local_primary: z.string().describe('Last name-local text').optional(),
              local_first_name: z.string().describe('Name-local text').optional(),
              country_region_id: z.string().describe('Country/Region'),
              name_type: z.object({ enum_name: z.string().describe('Enumeration value') }).describe('Name Type'),
              local_first_name_2: z.string().describe('Name-second local text').optional(),
              local_primary_2: z.string().describe('Last name-second local text').optional(),
              additional_name_type: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Supplementary name type')
                .optional(),
              first_name: z.string().describe('Name').optional(),
              full_name: z.string().describe('Full name').optional(),
              hereditary: z.string().describe('Name').optional(),
              custom_name: z
                .string()
                .describe(
                  'Custom name (when not passed in, the name will be spliced according to the rules of the country/region to which it belongs)',
                )
                .optional(),
              custom_local_name: z
                .string()
                .describe(
                  'Custom name of local text (when not passed in, the name of the local text will be stitched together with the relevant last name and first name field of the local text according to the rules of the country/region to which it belongs)',
                )
                .optional(),
              middle_name: z.string().describe('Middle name').optional(),
              name_primary: z.string().describe('Last name').optional(),
              secondary: z.string().describe('Second surname').optional(),
              social: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Honorific title')
                .optional(),
              tertiary: z.string().describe('Married surname').optional(),
              title: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Title')
                .optional(),
              local_middle_name: z.string().describe('Local middle name').optional(),
              local_secondary: z.string().describe('Second surname-local text').optional(),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('Field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom fields')
                .optional(),
            }),
          )
          .describe('Name')
          .optional(),
        gender: z
          .object({ enum_name: z.string().describe('Enumeration value') })
          .describe('Gender')
          .optional(),
        date_of_birth: z.string().describe('Date of birth').optional(),
        nationality_id: z.string().describe('ID number').optional(),
        race: z
          .object({ enum_name: z.string().describe('Enumeration value') })
          .describe('Ethnicity/race')
          .optional(),
        marital_status: z
          .object({ enum_name: z.string().describe('Enumeration value') })
          .describe('Marital status')
          .optional(),
        phone_list: z
          .array(
            z.object({
              international_area_code: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe(
                  'Country area code Common such as: 86_china (China), 852_hong_kong (Hong Kong, China), 886_taiwan (Taiwan, China), 853_macao (Macao, China), 1_united_states_of_america (United States of America), 7_russian_federation (Russian Federation), 44_united_kingdom (United Kingdom), 81_japan (Japan), 82_korea_republic_of (Republic of Korea), 91_india (India)',
                )
                .optional(),
              phone_number: z.string().describe('Phone number'),
              device_type: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Device Type')
                .optional(),
              phone_usage: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Telephone use')
                .optional(),
              is_primary: z.boolean().describe('Main phone').optional(),
              is_public: z.boolean().describe('Public call').optional(),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('Field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom fields')
                .optional(),
            }),
          )
          .describe(
            'Phone list , The phone is visible on the profile page only if all of the following conditions are met:- phone_number is not null- is_primary = `"true"` - phone_usage = `"home"`',
          )
          .optional(),
        address_list: z
          .array(
            z.object({
              country_region_id: z.string().describe('Country/Region'),
              region_id: z.string().describe('Main Administrative Region').optional(),
              city_id: z.string().describe('City').optional(),
              distinct_id: z.string().describe('District/County').optional(),
              local_address_line1: z.string().describe('Address line 1 (non-Latin native text)').optional(),
              local_address_line2: z.string().describe('Address line 2 (non-Latin native text)').optional(),
              local_address_line3: z.string().describe('Address line 3 (non-Latin native text)').optional(),
              local_address_line4: z.string().describe('Address line 4 (non-Latin native text)').optional(),
              local_address_line5: z.string().describe('Address line 5 (non-Latin native text)').optional(),
              local_address_line6: z.string().describe('Address line 6 (non-Latin native text)').optional(),
              local_address_line7: z.string().describe('Address line 7 (non-Latin native text)').optional(),
              local_address_line8: z.string().describe('Address line 8 (non-Latin native text)').optional(),
              local_address_line9: z.string().describe('Address line 9 (non-Latin native text)').optional(),
              postal_code: z.string().describe('Postal Code').optional(),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('Field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom fields')
                .optional(),
            }),
          )
          .describe('Address')
          .optional(),
        email_list: z
          .array(
            z.object({
              email: z.string().describe('Mailbox number'),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('Field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom fields')
                .optional(),
            }),
          )
          .describe('Mail')
          .optional(),
        work_experience_list: z
          .array(
            z.object({
              company_organization: z
                .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
                .describe('Company/organization')
                .optional(),
              department: z
                .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
                .describe('Department')
                .optional(),
              job: z
                .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
                .describe('Position')
                .optional(),
              description: z
                .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
                .describe('Job description')
                .optional(),
              start_date: z.string().describe('Start date').optional(),
              end_date: z.string().describe('End date').optional(),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('Field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom fields')
                .optional(),
            }),
          )
          .describe('Work history')
          .optional(),
        education_list: z
          .array(
            z.object({
              school: z
                .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
                .describe('School'),
              level_of_education: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Education')
                .optional(),
              start_date: z.string().describe('Start date').optional(),
              end_date: z.string().describe('End date').optional(),
              field_of_study: z
                .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
                .describe('Professional')
                .optional(),
              degree: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Degree')
                .optional(),
              school_name: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('School name')
                .optional(),
              field_of_study_name: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Professional name')
                .optional(),
              country_region_id: z.string().describe('Country Area ID').optional(),
              expected_end_date: z.string().describe('Expected end date').optional(),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('Field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom fields')
                .optional(),
            }),
          )
          .describe('Educational experience')
          .optional(),
        bank_account_list: z
          .array(
            z.object({
              bank_name: z
                .string()
                .describe("Bank name , which can be empty if the field 'bank' has been filled in")
                .optional(),
              bank_account_number: z.string().describe('Bank account number'),
              account_holder: z.string().describe('Name of account holder'),
              bank: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Enum of banks , such as bank-5 (Bank of Communications)')
                .optional(),
              branch_name: z.string().describe('Branch name').optional(),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('Field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom fields')
                .optional(),
              country_region_id: z
                .string()
                .describe(
                  'Country/region id, detailed information can be obtained through the [Query Country/Region Information] interface',
                )
                .optional(),
              bank_account_usage: z
                .array(z.object({ enum_name: z.string().describe('Enumeration value') }))
                .describe(
                  'Bank card usage, the emuneration value can be obtained through the document [Feishu Personnel Enumeration Constant] Bank card usage (bank_account_usage) enumeration definition section',
                )
                .optional(),
              bank_account_type: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe(
                  'The bank card type and emuneration value can be obtained through the document [Feishu Personnel Enumeration Constant] bank card type (bank_account_type) enumeration definition section',
                )
                .optional(),
              currency_id: z.string().describe('Currency id').optional(),
            }),
          )
          .describe('Bank account number')
          .optional(),
        national_id_list: z
          .array(
            z.object({
              national_id_type_id: z.string().describe('Type of national document'),
              national_id_number: z.string().describe('ID number'),
              issue_date: z.string().describe('Date of issuance').optional(),
              expiration_date: z.string().describe('Certificate expiration date').optional(),
              country_region_id: z.string().describe('Country/Region'),
              issued_by: z.string().describe('Document issuing agency').optional(),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('Field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom fields')
                .optional(),
            }),
          )
          .describe('ID number')
          .optional(),
        dependent_list: z
          .array(
            z.object({
              name: z
                .object({
                  local_primary: z.string().describe('Last name-local text').optional(),
                  local_first_name: z.string().describe('Name-local text').optional(),
                  country_region_id: z.string().describe('Country/Region'),
                  name_type: z.object({ enum_name: z.string().describe('Enumeration value') }).describe('Name Type'),
                  local_first_name_2: z.string().describe('Name-second local text').optional(),
                  local_primary_2: z.string().describe('Last name-second local text').optional(),
                  additional_name_type: z
                    .object({ enum_name: z.string().describe('Enumeration value') })
                    .describe('Supplementary name type')
                    .optional(),
                  first_name: z.string().describe('Name').optional(),
                  full_name: z.string().describe('Full name').optional(),
                  hereditary: z.string().describe('Name').optional(),
                  custom_name: z
                    .string()
                    .describe(
                      'Custom name (when not passed in, the name will be spliced according to the rules of the country/region to which it belongs)',
                    )
                    .optional(),
                  custom_local_name: z
                    .string()
                    .describe(
                      'Custom name of local text (when not passed in, the name of the local text will be stitched together with the relevant last name and first name field of the local text according to the rules of the country/region to which it belongs)',
                    )
                    .optional(),
                  middle_name: z.string().describe('Middle name').optional(),
                  name_primary: z.string().describe('Last name').optional(),
                  secondary: z.string().describe('Second surname').optional(),
                  social: z
                    .object({ enum_name: z.string().describe('Enumeration value') })
                    .describe('Honorific title')
                    .optional(),
                  tertiary: z.string().describe('Married surname').optional(),
                  title: z
                    .object({ enum_name: z.string().describe('Enumeration value') })
                    .describe('Title')
                    .optional(),
                  local_middle_name: z.string().describe('Local middle name').optional(),
                  local_secondary: z.string().describe('Second surname-local text').optional(),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('Field name'),
                        value: z
                          .string()
                          .describe(
                            'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                          ),
                      }),
                    )
                    .describe('Custom fields')
                    .optional(),
                })
                .describe('Name')
                .optional(),
              relationship: z.object({ enum_name: z.string().describe('Enumeration value') }).describe('Relationship'),
              gender: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Gender')
                .optional(),
              date_of_birth: z.string().describe('Birthday').optional(),
              nationality_id: z.string().describe('Nationality').optional(),
              national_id_list: z
                .array(
                  z.object({
                    national_id_type_id: z.string().describe('Type of national document'),
                    national_id_number: z.string().describe('ID number'),
                    issue_date: z.string().describe('Date of issuance').optional(),
                    expiration_date: z.string().describe('Certificate expiration date').optional(),
                    country_region_id: z.string().describe('Country/Region'),
                    issued_by: z.string().describe('Document issuing agency').optional(),
                    custom_fields: z
                      .array(
                        z.object({
                          field_name: z.string().describe('Field name'),
                          value: z
                            .string()
                            .describe(
                              'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                            ),
                        }),
                      )
                      .describe('Custom fields')
                      .optional(),
                  }),
                )
                .describe('ID number')
                .optional(),
              spouses_working_status: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Spouse working status')
                .optional(),
              is_this_person_covered_by_health_insurance: z
                .boolean()
                .describe('Including family medical insurance')
                .optional(),
              is_this_person_allowed_for_tax_deduction: z
                .boolean()
                .describe('Allowing family members to deduct taxes')
                .optional(),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('Field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom fields')
                .optional(),
              dependent_name: z.string().describe('Family member name').optional(),
              employer: z.string().describe('work unit').optional(),
              job: z.string().describe('post').optional(),
              phone: z
                .object({
                  international_area_code: z
                    .object({ enum_name: z.string().describe('Enumeration value') })
                    .describe(
                      'Country area code Common such as: 86_china (China), 852_hong_kong (Hong Kong, China), 886_taiwan (Taiwan, China), 853_macao (Macao, China), 1_united_states_of_america (United States of America), 7_russian_federation (Russian Federation), 44_united_kingdom (United Kingdom), 81_japan (Japan), 82_korea_republic_of (Republic of Korea), 91_india (India)',
                    )
                    .optional(),
                  phone_number: z.string().describe('Phone number'),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('Field name'),
                        value: z
                          .string()
                          .describe(
                            'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                          ),
                      }),
                    )
                    .describe('Custom fields')
                    .optional(),
                })
                .describe('Telephone')
                .optional(),
              address: z
                .object({
                  id: z.string().describe('Address id').optional(),
                  country_region_id: z.string().describe('Country/Region'),
                  region_id: z.string().describe('Main Administrative Region').optional(),
                  city_id: z.string().describe('City').optional(),
                  distinct_id: z.string().describe('District/County').optional(),
                  local_address_line1: z
                    .string()
                    .describe('City, you can check through the [Query City Information] interface')
                    .optional(),
                  local_address_line2: z
                    .string()
                    .describe(
                      'District/county, you can check through the [Query District/County Information] interface',
                    )
                    .optional(),
                  local_address_line3: z.string().describe('Address line 1 (non-Latin native text)').optional(),
                  local_address_line4: z.string().describe('Address line 2 (non-Latin native text)').optional(),
                  local_address_line5: z.string().describe('Address line 3 (non-Latin native text)').optional(),
                  local_address_line6: z.string().describe('Address line 4 (non-Latin native text)').optional(),
                  local_address_line7: z.string().describe('Address line 5 (non-Latin native text)').optional(),
                  local_address_line8: z.string().describe('Address line 6 (non-Latin native text)').optional(),
                  local_address_line9: z.string().describe('Address line 7 (non-Latin native text)').optional(),
                  postal_code: z.string().describe('Address line 8 (non-Latin native text)').optional(),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('Field name'),
                        value: z
                          .string()
                          .describe(
                            'The field value is a string escaped by json. According to the metadata definition, the field format is different (123,123.23, true, [\\ "id1\\",\\ "id2\\], 2006-01-02 15:04:05])',
                          ),
                      }),
                    )
                    .describe('Address line 9 (non-Latin native text)')
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
          .describe('Relatives')
          .optional(),
        emergency_contact_list: z
          .array(
            z.object({
              name: z
                .object({
                  local_primary: z.string().describe('Last name-local text').optional(),
                  local_first_name: z.string().describe('Name-local text').optional(),
                  country_region_id: z.string().describe('Country/Region'),
                  name_type: z.object({ enum_name: z.string().describe('Enumeration value') }).describe('Name Type'),
                  local_first_name_2: z.string().describe('Name-second local text').optional(),
                  local_primary_2: z.string().describe('Last name-second local text').optional(),
                  additional_name_type: z
                    .object({ enum_name: z.string().describe('Enumeration value') })
                    .describe('Supplementary name type')
                    .optional(),
                  first_name: z.string().describe('Name').optional(),
                  full_name: z.string().describe('Full name').optional(),
                  hereditary: z.string().describe('Name').optional(),
                  custom_name: z
                    .string()
                    .describe(
                      'Custom name (when not passed in, the name will be spliced according to the rules of the country/region to which it belongs)',
                    )
                    .optional(),
                  custom_local_name: z
                    .string()
                    .describe(
                      'Custom name of local text (when not passed in, the name of the local text will be stitched together with the relevant last name and first name field of the local text according to the rules of the country/region to which it belongs)',
                    )
                    .optional(),
                  middle_name: z.string().describe('Middle name').optional(),
                  name_primary: z.string().describe('Last name').optional(),
                  secondary: z.string().describe('Second surname').optional(),
                  social: z
                    .object({ enum_name: z.string().describe('Enumeration value') })
                    .describe('Honorific title')
                    .optional(),
                  tertiary: z.string().describe('Married surname').optional(),
                  title: z
                    .object({ enum_name: z.string().describe('Enumeration value') })
                    .describe('Title')
                    .optional(),
                  local_middle_name: z.string().describe('Local middle name').optional(),
                  local_secondary: z.string().describe('Second surname-local text').optional(),
                  custom_fields: z
                    .array(
                      z.object({
                        field_name: z.string().describe('Field name'),
                        value: z
                          .string()
                          .describe(
                            'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                          ),
                      }),
                    )
                    .describe('Custom fields')
                    .optional(),
                })
                .describe('Name')
                .optional(),
              relationship: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Relationship')
                .optional(),
              phone_ist: z
                .array(
                  z.object({
                    international_area_code: z
                      .object({ enum_name: z.string().describe('Enumeration value') })
                      .describe(
                        'Country area code Common such as: 86_china (China), 852_hong_kong (Hong Kong, China), 886_taiwan (Taiwan, China), 853_macao (Macao, China), 1_united_states_of_america (United States of America), 7_russian_federation (Russian Federation), 44_united_kingdom (United Kingdom), 81_japan (Japan), 82_korea_republic_of (Republic of Korea), 91_india (India)',
                      )
                      .optional(),
                    phone_number: z.string().describe('Phone number'),
                    custom_fields: z
                      .array(
                        z.object({
                          field_name: z.string().describe('Field name'),
                          value: z
                            .string()
                            .describe(
                              'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                            ),
                        }),
                      )
                      .describe('Custom fields')
                      .optional(),
                  }),
                )
                .describe('Phone')
                .optional(),
              custom_fields: z
                .array(
                  z.object({
                    field_name: z.string().describe('Field name'),
                    value: z
                      .string()
                      .describe(
                        'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                      ),
                  }),
                )
                .describe('Custom fields')
                .optional(),
              legal_name: z.string().describe('Legal name').optional(),
            }),
          )
          .describe('Emergency Contact')
          .optional(),
        date_entered_workforce: z.string().describe('Date of entry to workplace').optional(),
        profile_image_id: z.string().describe('The id of the avatar resource').optional(),
        custom_fields: z
          .array(
            z.object({
              field_name: z.string().describe('Field name'),
              value: z
                .string()
                .describe(
                  'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                ),
            }),
          )
          .describe('Custom fields')
          .optional(),
        resident_tax_id_list: z.array(z.string()).describe('Tax identity information').optional(),
        age: z.number().describe('Age').optional(),
        personal_profile: z
          .array(
            z.object({
              personal_profile_type: z
                .object({ enum_name: z.string().describe('Enumeration value') })
                .describe('Data type')
                .optional(),
              files: z
                .array(z.object({ id: z.string().describe('Upload file ID').optional() }))
                .describe('Upload file list')
                .optional(),
            }),
          )
          .describe('Personal Data')
          .optional(),
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
    path: z.object({ person_id: z.string().describe('Person ID') }),
  },
};
export const corehrV1PreHireDelete = {
  project: 'corehr',
  name: 'corehr.v1.preHire.delete',
  sdkName: 'corehr.v1.preHire.delete',
  path: '/open-apis/corehr/v1/pre_hires/:pre_hire_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Pre hire-Delete pending staff-Delete pending staff',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ pre_hire_id: z.string().describe('Information ID of the candidate to be deleted') }),
  },
};
export const corehrV1PreHireGet = {
  project: 'corehr',
  name: 'corehr.v1.preHire.get',
  sdkName: 'corehr.v1.preHire.get',
  path: '/open-apis/corehr/v1/pre_hires/:pre_hire_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Pre hire-Query individual candidates-Query a single candidate by ID',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ pre_hire_id: z.string().describe('Onboarding ID') }),
  },
};
export const corehrV1PreHireList = {
  project: 'corehr',
  name: 'corehr.v1.preHire.list',
  sdkName: 'corehr.v1.preHire.list',
  path: '/open-apis/corehr/v1/pre_hires',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Pre hire-Batch query for candidates-Batch query for candidates',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
      pre_hire_ids: z.array(z.string()).describe('List of pending IDs').optional(),
    }),
  },
};
export const corehrV1PreHirePatch = {
  project: 'corehr',
  name: 'corehr.v1.preHire.patch',
  sdkName: 'corehr.v1.preHire.patch',
  path: '/open-apis/corehr/v1/pre_hires/:pre_hire_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Pre hire-Update pending entry information-Update pending entry information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      ats_application_id: z.string().describe('Application id').optional(),
      hire_date: z.string().describe('Entry date').optional(),
      employee_type: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe('Type of employment')
        .optional(),
      worker_id: z.string().describe('Personnel number').optional(),
      employee_type_id: z.string().describe('Type of employment').optional(),
      person_id: z.string().describe('Reference Person ID').optional(),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('Field name'),
            value: z
              .string()
              .describe(
                'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
              ),
          }),
        )
        .describe('Custom fields')
        .optional(),
      cost_center_rate: z
        .array(
          z.object({
            cost_center_id: z.string().describe('Supported cost center id').optional(),
            rate: z.number().describe('Apportionment ratio').optional(),
          }),
        )
        .describe('Cost center allocation information')
        .optional(),
      onboarding_status: z
        .object({ enum_name: z.string().describe('Enumeration value') })
        .describe('Entry status - Preboarding - deleted - Ready (day_one) - withdrawn - Completed'),
    }),
    params: z
      .object({
        client_token: z
          .string()
          .describe('Determine whether it is the same request according to whether the client_token are consistent')
          .optional(),
      })
      .optional(),
    path: z.object({ pre_hire_id: z.string().describe('Onboarding ID') }),
  },
};
export const corehrV1ProcessFormVariableDataGet = {
  project: 'corehr',
  name: 'corehr.v1.processFormVariableData.get',
  sdkName: 'corehr.v1.processFormVariableData.get',
  path: '/open-apis/corehr/v1/processes/:process_id/form_variable_data',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-Process-Get process form data-Get process form data, including business and custom fields in the form, based on the process instance id (process_id). Only support CoreHR and Attendance business processes for Feishu',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ process_id: z.string().describe('Process ID') }),
  },
};
export const corehrV1SecurityGroupList = {
  project: 'corehr',
  name: 'corehr.v1.securityGroup.list',
  sdkName: 'corehr.v1.securityGroup.list',
  path: '/open-apis/corehr/v1/security_groups',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-User authorization-Get a list of roles in batches-Batch query the role list in "Role Settings" in Feishu\'s personnel management backend. You can find the corresponding location by following "Feishu Personnel" - "Permission Settings" - "Role Settings". The role list contains information such as the role\'s ID, role name, and description',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
    }),
  },
};
export const corehrV1SecurityGroupQuery = {
  project: 'corehr',
  name: 'corehr.v1.securityGroup.query',
  sdkName: 'corehr.v1.securityGroup.query',
  path: '/open-apis/corehr/v1/security_groups/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-User authorization-Query HRBP/territory BP-Get HRBP/location BP by department or work location',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      item_list: z
        .array(
          z.object({
            role_key: z
              .string()
              .describe(
                'Unique identifier for role type- HRBP: related to the department, role_key fixed as "hrbp"- Location BP: related to departments and workplaces, role_key fixed as "location_bp"',
              ),
            department_id: z
              .string()
              .describe('Department ID, you need to enter the department ID to inquire about HRBP'),
            work_location_id: z
              .string()
              .describe(
                'Work place ID To inquire about the local BP, you need to enter the department ID and work place ID',
              )
              .optional(),
          }),
        )
        .describe('Role list, support up to 50 queries at a time'),
      updated_at_gte: z.string().describe('Authorization time is greater than').optional(),
      updated_at_lte: z.string().describe('Authorization time is less than').optional(),
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
export const corehrV1SubdivisionGet = {
  project: 'corehr',
  name: 'corehr.v1.subdivision.get',
  sdkName: 'corehr.v1.subdivision.get',
  path: '/open-apis/corehr/v1/subdivisions/:subdivision_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-basic data-Location data-Query a single province/administrative region information-Query single province/administrative region information',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ subdivision_id: z.string().describe('Province/Administrative Region ID') }),
  },
};
export const corehrV1SubdivisionList = {
  project: 'corehr',
  name: 'corehr.v1.subdivision.list',
  sdkName: 'corehr.v1.subdivision.list',
  path: '/open-apis/corehr/v1/subdivisions',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-basic data-Location data-Query province/administrative region information in batches-Query province/administrative region information in batches',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
      country_region_id: z
        .string()
        .describe(
          'Country/region id, fill in and only query the provinces/administrative regions under the country/region',
        )
        .optional(),
    }),
  },
};
export const corehrV1SubregionGet = {
  project: 'corehr',
  name: 'corehr.v1.subregion.get',
  sdkName: 'corehr.v1.subregion.get',
  path: '/open-apis/corehr/v1/subregions/:subregion_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-basic data-Location data-Query single city/region information-Query single city/region information',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ subregion_id: z.string().describe('City/Region ID') }),
  },
};
export const corehrV1SubregionList = {
  project: 'corehr',
  name: 'corehr.v1.subregion.list',
  sdkName: 'corehr.v1.subregion.list',
  path: '/open-apis/corehr/v1/subregions',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Feishu People-basic data-Location data-Query city/region information in batches-Query city/region information in batches',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
      subdivision_id: z
        .string()
        .describe(
          'Province/administrative region id, fill in and only query the city/region under the province/administrative region',
        )
        .optional(),
    }),
  },
};
export const corehrV1TransferReasonQuery = {
  project: 'corehr',
  name: 'corehr.v1.transferReason.query',
  sdkName: 'corehr.v1.transferReason.query',
  path: '/open-apis/corehr/v1/transfer_reasons/query',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job change-Get a list of reasons for the change-Get a list of reasons for the change',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        active: z.boolean().describe('Change cause state').optional(),
        transfer_reason_unique_identifier: z
          .array(z.string())
          .describe('Unique identification of the cause of the change, the maximum number of multiple pieces is 10')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV1TransferTypeQuery = {
  project: 'corehr',
  name: 'corehr.v1.transferType.query',
  sdkName: 'corehr.v1.transferType.query',
  path: '/open-apis/corehr/v1/transfer_types/query',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Job change-Get a list of change types-Get a list of change types',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        active: z.boolean().describe('Change type state').optional(),
        transfer_type_unique_identifier: z
          .array(z.string())
          .describe('Unique identification of the type of change, the maximum number of multiple bars is 10')
          .optional(),
      })
      .optional(),
  },
};
export const corehrV1WorkingHoursTypeCreate = {
  project: 'corehr',
  name: 'corehr.v1.workingHoursType.create',
  sdkName: 'corehr.v1.workingHoursType.create',
  path: '/open-apis/corehr/v1/working_hours_types',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Working hours type-Create working hours type-Creation of a working hour system',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      code: z.string().describe('Encoding').optional(),
      name: z
        .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
        .describe('Name'),
      country_region_id_list: z.array(z.string()).describe('Country/Region').optional(),
      default_for_job: z.boolean().describe('Job default'),
      active: z.boolean().describe('Enable'),
      custom_fields: z
        .array(
          z.object({
            field_name: z.string().describe('Field name'),
            value: z
              .string()
              .describe(
                'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
              ),
          }),
        )
        .describe('Custom fields')
        .optional(),
    }),
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
export const corehrV1WorkingHoursTypeDelete = {
  project: 'corehr',
  name: 'corehr.v1.workingHoursType.delete',
  sdkName: 'corehr.v1.workingHoursType.delete',
  path: '/open-apis/corehr/v1/working_hours_types/:working_hours_type_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Working hours type-Delete working hours type-Delete working hours system',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      working_hours_type_id: z.string().describe('ID of the working hour system that needs to be deleted'),
    }),
  },
};
export const corehrV1WorkingHoursTypeGet = {
  project: 'corehr',
  name: 'corehr.v1.workingHoursType.get',
  sdkName: 'corehr.v1.workingHoursType.get',
  path: '/open-apis/corehr/v1/working_hours_types/:working_hours_type_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Working hours type-Query individual working hours type-Obtain working hours information with ID',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ working_hours_type_id: z.string().describe('Working hours system ID') }),
  },
};
export const corehrV1WorkingHoursTypeList = {
  project: 'corehr',
  name: 'corehr.v1.workingHoursType.list',
  sdkName: 'corehr.v1.workingHoursType.list',
  path: '/open-apis/corehr/v1/working_hours_types',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Working hours type-Get the list of working hours-Get the list of working hours',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().describe('Page size'),
    }),
  },
};
export const corehrV1WorkingHoursTypePatch = {
  project: 'corehr',
  name: 'corehr.v1.workingHoursType.patch',
  sdkName: 'corehr.v1.workingHoursType.patch',
  path: '/open-apis/corehr/v1/working_hours_types/:working_hours_type_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feishu People（Enterprise Edition）-Basic infomation-Working hours type-Update working hours type-Update the working hours system',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        code: z.string().describe('Encoding').optional(),
        name: z
          .array(z.object({ lang: z.string().describe('Language'), value: z.string().describe('Content') }))
          .describe('Name')
          .optional(),
        country_region_id_list: z.array(z.string()).describe('Country/Region').optional(),
        default_for_job: z.boolean().describe('Job default').optional(),
        active: z.boolean().describe('Enable').optional(),
        custom_fields: z
          .array(
            z.object({
              field_name: z.string().describe('Field name'),
              value: z
                .string()
                .describe(
                  'The field value is the character string after json escape. According to the metadata definition, the field format is different (such as 123, 123.23, "true", [\\ "id1\\",\\ "id2 \\"], " 2006-01-02 15:04:05")',
                ),
            }),
          )
          .describe('Custom fields')
          .optional(),
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
    path: z.object({ working_hours_type_id: z.string().describe('Working hours system ID') }),
  },
};
export const corehrV1Tools = [
  corehrV1AssignedUserSearch,
  corehrV1AuthorizationAddRoleAssign,
  corehrV1AuthorizationGetByParam,
  corehrV1AuthorizationQuery,
  corehrV1AuthorizationRemoveRoleAssign,
  corehrV1AuthorizationUpdateRoleAssign,
  corehrV1CommonDataIdConvert,
  corehrV1CommonDataMetaDataAddEnumOption,
  corehrV1CommonDataMetaDataEditEnumOption,
  corehrV1CompanyCreate,
  corehrV1CompanyDelete,
  corehrV1CompanyGet,
  corehrV1CompanyList,
  corehrV1CompanyPatch,
  corehrV1CompensationStandardMatch,
  corehrV1ContractCreate,
  corehrV1ContractDelete,
  corehrV1ContractGet,
  corehrV1ContractList,
  corehrV1ContractPatch,
  corehrV1CountryRegionGet,
  corehrV1CountryRegionList,
  corehrV1CurrencyGet,
  corehrV1CurrencyList,
  corehrV1CustomFieldGetByParam,
  corehrV1CustomFieldListObjectApiName,
  corehrV1CustomFieldQuery,
  corehrV1DepartmentCreate,
  corehrV1DepartmentDelete,
  corehrV1DepartmentGet,
  corehrV1DepartmentList,
  corehrV1DepartmentPatch,
  corehrV1EmployeeTypeCreate,
  corehrV1EmployeeTypeDelete,
  corehrV1EmployeeTypeGet,
  corehrV1EmployeeTypeList,
  corehrV1EmployeeTypePatch,
  corehrV1EmploymentCreate,
  corehrV1EmploymentDelete,
  corehrV1EmploymentPatch,
  corehrV1JobChangeCreate,
  corehrV1JobDataCreate,
  corehrV1JobDataDelete,
  corehrV1JobDataGet,
  corehrV1JobDataList,
  corehrV1JobDataPatch,
  corehrV1JobFamilyCreate,
  corehrV1JobFamilyDelete,
  corehrV1JobFamilyGet,
  corehrV1JobFamilyList,
  corehrV1JobFamilyPatch,
  corehrV1JobLevelCreate,
  corehrV1JobLevelDelete,
  corehrV1JobLevelGet,
  corehrV1JobLevelList,
  corehrV1JobLevelPatch,
  corehrV1JobCreate,
  corehrV1JobDelete,
  corehrV1JobGet,
  corehrV1JobList,
  corehrV1JobPatch,
  corehrV1LeaveGrantingRecordCreate,
  corehrV1LeaveGrantingRecordDelete,
  corehrV1LeaveCalendarByScope,
  corehrV1LeaveLeaveBalances,
  corehrV1LeaveLeaveRequestHistory,
  corehrV1LeaveLeaveTypes,
  corehrV1LeaveWorkCalendar,
  corehrV1LeaveWorkCalendarDate,
  corehrV1LocationCreate,
  corehrV1LocationDelete,
  corehrV1LocationGet,
  corehrV1LocationList,
  corehrV1NationalIdTypeCreate,
  corehrV1NationalIdTypeDelete,
  corehrV1NationalIdTypeGet,
  corehrV1NationalIdTypeList,
  corehrV1NationalIdTypePatch,
  corehrV1OffboardingQuery,
  corehrV1OffboardingSearch,
  corehrV1OffboardingSubmit,
  corehrV1PersonCreate,
  corehrV1PersonDelete,
  corehrV1PersonGet,
  corehrV1PersonPatch,
  corehrV1PreHireDelete,
  corehrV1PreHireGet,
  corehrV1PreHireList,
  corehrV1PreHirePatch,
  corehrV1ProcessFormVariableDataGet,
  corehrV1SecurityGroupList,
  corehrV1SecurityGroupQuery,
  corehrV1SubdivisionGet,
  corehrV1SubdivisionList,
  corehrV1SubregionGet,
  corehrV1SubregionList,
  corehrV1TransferReasonQuery,
  corehrV1TransferTypeQuery,
  corehrV1WorkingHoursTypeCreate,
  corehrV1WorkingHoursTypeDelete,
  corehrV1WorkingHoursTypeGet,
  corehrV1WorkingHoursTypeList,
  corehrV1WorkingHoursTypePatch,
];
