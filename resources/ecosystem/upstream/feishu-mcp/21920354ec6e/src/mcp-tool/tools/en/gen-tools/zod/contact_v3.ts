import { z } from 'zod';
export type contactV3ToolName =
  | 'contact.v3.customAttr.list'
  | 'contact.v3.department.batch'
  | 'contact.v3.department.children'
  | 'contact.v3.department.create'
  | 'contact.v3.department.delete'
  | 'contact.v3.department.get'
  | 'contact.v3.department.list'
  | 'contact.v3.department.parent'
  | 'contact.v3.department.patch'
  | 'contact.v3.department.search'
  | 'contact.v3.department.unbindDepartmentChat'
  | 'contact.v3.department.update'
  | 'contact.v3.department.updateDepartmentId'
  | 'contact.v3.employeeTypeEnum.create'
  | 'contact.v3.employeeTypeEnum.delete'
  | 'contact.v3.employeeTypeEnum.list'
  | 'contact.v3.employeeTypeEnum.update'
  | 'contact.v3.functionalRole.create'
  | 'contact.v3.functionalRole.delete'
  | 'contact.v3.functionalRoleMember.batchCreate'
  | 'contact.v3.functionalRoleMember.batchDelete'
  | 'contact.v3.functionalRoleMember.get'
  | 'contact.v3.functionalRoleMember.list'
  | 'contact.v3.functionalRoleMember.scopes'
  | 'contact.v3.functionalRole.update'
  | 'contact.v3.group.create'
  | 'contact.v3.group.delete'
  | 'contact.v3.group.get'
  | 'contact.v3.group.memberBelong'
  | 'contact.v3.groupMember.add'
  | 'contact.v3.groupMember.batchAdd'
  | 'contact.v3.groupMember.batchRemove'
  | 'contact.v3.groupMember.remove'
  | 'contact.v3.groupMember.simplelist'
  | 'contact.v3.group.patch'
  | 'contact.v3.group.simplelist'
  | 'contact.v3.jobFamily.create'
  | 'contact.v3.jobFamily.delete'
  | 'contact.v3.jobFamily.get'
  | 'contact.v3.jobFamily.list'
  | 'contact.v3.jobFamily.update'
  | 'contact.v3.jobLevel.create'
  | 'contact.v3.jobLevel.delete'
  | 'contact.v3.jobLevel.get'
  | 'contact.v3.jobLevel.list'
  | 'contact.v3.jobLevel.update'
  | 'contact.v3.jobTitle.get'
  | 'contact.v3.jobTitle.list'
  | 'contact.v3.scope.list'
  | 'contact.v3.unit.bindDepartment'
  | 'contact.v3.unit.create'
  | 'contact.v3.unit.delete'
  | 'contact.v3.unit.get'
  | 'contact.v3.unit.list'
  | 'contact.v3.unit.listDepartment'
  | 'contact.v3.unit.patch'
  | 'contact.v3.unit.unbindDepartment'
  | 'contact.v3.user.batch'
  | 'contact.v3.user.batchGetId'
  | 'contact.v3.user.create'
  | 'contact.v3.user.delete'
  | 'contact.v3.user.findByDepartment'
  | 'contact.v3.user.get'
  | 'contact.v3.user.list'
  | 'contact.v3.user.patch'
  | 'contact.v3.user.resurrect'
  | 'contact.v3.user.update'
  | 'contact.v3.user.updateUserId'
  | 'contact.v3.workCity.get'
  | 'contact.v3.workCity.list';
export const contactV3CustomAttrList = {
  project: 'contact',
  name: 'contact.v3.customAttr.list',
  sdkName: 'contact.v3.customAttr.list',
  path: '/open-apis/contact/v3/custom_attrs',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Custom user fields-Obtain custom user fields-Call this interface to query the configuration information of custom user fields in the current enterprise',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z
          .number()
          .describe('Paging size, used to limit the number of data entries returned in one request')
          .optional(),
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
export const contactV3DepartmentBatch = {
  project: 'contact',
  name: 'contact.v3.department.batch',
  sdkName: 'contact.v3.department.batch',
  path: '/open-apis/contact/v3/departments/batch',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Department-Obtain bulk department information-Call this interface to obtain information about one or more departments, including department name, ID, parent department, person in charge, status, number of members, etc',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      department_ids: z
        .array(z.string())
        .describe(
          'Department ID, ID type needs to be consistent with the value of the query parameter department_id_type. Instructions on how to obtain the ID:- After calling the [Create Department] interface, the department ID information can be obtained from the returned result.- The department API provides multiple ways to obtain the IDs of other departments, such as [Get list of sub-departments], [Get parent department information], [search department], you can choose the appropriate one API for querying.**Notice:**- The maximum number of IDs requested in a single request is 50.- If you need to query multiple departments at one time, you can pass the same parameter name multiple times, and pass a different department ID each time for query. GET request example:`https://{url}?department_ids={department_id1}&department_ids={department_id2}`. in: - `department_ids` is the parameter name and can be passed multiple times. - `department_id1` and `department_id2` are different parameter values',
        ),
      department_id_type: z
        .enum(['open_department_id', 'department_id'])
        .describe(
          'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.),department_id(Supports user-defined configuration of department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.)',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const contactV3DepartmentChildren = {
  project: 'contact',
  name: 'contact.v3.department.children',
  sdkName: 'contact.v3.department.children',
  path: '/open-apis/contact/v3/departments/:department_id/children',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Contacts-Department-Obtain the list of sub-departments-Call this interface to query the list of sub-departments under the specified department. The list contains information such as the department's name, ID, parent department, person in charge, and status",
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:department_id(Supports user-defined configured department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
        fetch_child: z
          .boolean()
          .describe(
            'Whether to recursively obtain subdepartments. When the value is true, the interface will recursively query sub-department information at all levels under the current department.**Optional values are:**- true- false (default)',
          )
          .optional(),
        page_size: z
          .number()
          .describe('Paging size, used to limit the number of data entries returned in one request')
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      department_id: z
        .string()
        .describe(
          'Department ID.**Note:**- The ID type needs to be consistent with the value of the query parameter department_id_type.- When you create a department, you can obtain the department ID information from the returned results. You can also call the [Search Department] interface to obtain The desired department ID.- The root department has a department ID of 0',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const contactV3DepartmentCreate = {
  project: 'contact',
  name: 'contact.v3.department.create',
  sdkName: 'contact.v3.department.create',
  path: '/open-apis/contact/v3/departments',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-Department-Create a department-Call this interface to create a department in the contacts',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z
        .string()
        .describe(
          'Department name.**Notice**:- Cannot contain slashes (`/`).- Cannot be the same as the existing department name',
        ),
      i18n_name: z
        .object({
          zh_cn: z.string().describe("Department's Chinese name").optional(),
          ja_jp: z.string().describe("Department's Japanese name").optional(),
          en_us: z.string().describe("Department's English name").optional(),
        })
        .describe(
          'International configuration of department names.**Notice**:- Cannot contain slashes (`/`).- It cannot be repeated with the internationalization configuration of the existing department name.**Default value**: empty',
        )
        .optional(),
      parent_department_id: z
        .string()
        .describe(
          'The ID of the parent department. How to obtain department ID:- If the department is currently being created under the root department, the value of this parameter is `0`.- The department API provides multiple ways to obtain the IDs of other departments, such as [Get list of sub-departments], [Get parent department information], [search department], you can choose the appropriate one API for querying',
        ),
      department_id: z
        .string()
        .describe(
          'Custom department ID.**Notice**:- cannot start with `od-`.- Cannot be set to `0` or `1`.**Default value**: empty, indicating that the ID is automatically generated by the system',
        )
        .optional(),
      leader_user_id: z
        .string()
        .describe(
          'The user ID of the department head. The ID type is consistent with the value of the query parameter user_id_type. For how to obtain user ID, please refer to [How to obtain different user IDs].**Default value**: empty',
        )
        .optional(),
      order: z
        .string()
        .describe(
          'The sorting of departments is the order in which departments are displayed among departments at the same level. The value format is a non-negative integer of String type. The smaller the value, the higher the sorting is.**Note**: The order value is unique, that is, the value passed in cannot be the same as the order value of the stock department. Therefore, when creating departments, it is recommended that you plan the ordering of departments at the same level and set different order values in order.**Default value**: empty. By default, the newly created departments are ranked after the existing departments',
        )
        .optional(),
      unit_ids: z
        .array(z.string())
        .describe(
          'A list of custom IDs for units bound to the department. Currently, only one unit is supported.- For unit information, see [Resource Introduction].- Call the [Get unit list] interface to obtain the unit ID.**Default value**: empty',
        )
        .optional(),
      create_group_chat: z
        .boolean()
        .describe(
          'Whether to create department groups. **Optional values are:**- true: create- false (default)**Note**: When creating a department group, the group name defaults to the department name, and the group owner defaults to the department head',
        )
        .optional(),
      leaders: z
        .array(
          z.object({
            leaderType: z
              .number()
              .describe(
                'Person in charge type. Options:1(main Main person in charge),2(deputy Deputy responsible person)',
              ),
            leaderID: z
              .string()
              .describe(
                'The user ID and ID type of the person in charge are consistent with the value of the query parameter user_id_type. For how to obtain user ID, please refer to [How to obtain different user IDs]',
              ),
          }),
        )
        .describe(
          'Department head information.**Notice**:- When configuring this parameter, you must specify a person in charge.- When setting up multiple persons in charge, only one person in charge can be set as the main person in charge.- If a department head (leader_user_id) is set at the same time, the department head set here must be the same person as the department head.**Default value**: empty',
        )
        .optional(),
      group_chat_employee_types: z
        .array(z.number())
        .describe(
          'Personnel type restrictions for department groups.The value range of personnel type is as follows. This parameter supports setting multiple type values. If there are multiple types, separate them with English `,`:- 1: Regular employee- 2: Intern- 3: Outsourcing- 4: Labor services- 5: ConsultantThis parameter supports passing in the number corresponding to the custom person type. You can call the [Query employee type] interface to obtain the corresponding number (enum_value).**Default value**: empty',
        )
        .optional(),
      department_hrbps: z
        .array(z.string())
        .describe(
          'List of user IDs for department HRBP. The ID type is consistent with the value of the query parameter user_id_type. For how to obtain user ID, please refer to [How to obtain different user IDs].**Default value**: empty',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description].**Default value**: open_department_id Options:department_id(Supports user-defined configuration of department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
        client_token: z
          .string()
          .describe(
            'Used to determine whether it is the same request idempotently to avoid repeated requests. String type, you need to generate parameter values yourself.**Default value**: empty',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3DepartmentDelete = {
  project: 'contact',
  name: 'contact.v3.department.delete',
  sdkName: 'contact.v3.department.delete',
  path: '/open-apis/contact/v3/departments/:department_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Contacts-Department-Delete a department-Call this interface to delete the specified department from the contacts',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:department_id(Supports user-defined configuration of department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({
        department_id: z
          .string()
          .describe(
            'Department ID, ID type needs to be consistent with the value of the query parameter department_id_type.- After calling the [Create Department] interface, the department ID information can be obtained from the returned result.- The department API provides multiple ways to obtain the IDs of other departments, such as [Get list of sub-departments], [Get parent department information], [search department], you can choose the appropriate one API for querying',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3DepartmentGet = {
  project: 'contact',
  name: 'contact.v3.department.get',
  sdkName: 'contact.v3.department.get',
  path: '/open-apis/contact/v3/departments/:department_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Department-Obtain single department information-Call this interface to obtain information about a single department, including department name, ID, parent department, person in charge, status, number of members, etc',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:department_id(Supports user-defined configuration of department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({
        department_id: z
          .string()
          .describe(
            'Department ID, ID type needs to be consistent with the value of the query parameter department_id_type. Instructions on how to obtain the ID:- After calling the [Create Department] interface, the department ID information can be obtained from the returned result.- The department API provides multiple ways to obtain the IDs of other departments, such as [Get list of sub-departments], [Get parent department information], [search department], you can choose the appropriate one API for querying',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const contactV3DepartmentList = {
  project: 'contact',
  name: 'contact.v3.department.list',
  sdkName: 'contact.v3.department.list',
  path: '/open-apis/contact/v3/departments',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Contact-Department-Get Department Information List-This API is used to obtain the list of sub-departments of a department. [FAQs]',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Type of department ID used in this call Options:department_id(Identify the department with the custom department_id),open_department_id(Identify the department with open_department_id)',
          )
          .optional(),
        parent_department_id: z
          .string()
          .describe(
            'Parent department ID. If this parameter is specified, all sub-departments under the department will be obtained. The ID entered must be the one specified by department_id_type',
          )
          .optional(),
        fetch_child: z.boolean().describe('Whether to obtain sub-departments recursively').optional(),
        page_token: z.string().optional(),
        page_size: z.number().optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const contactV3DepartmentParent = {
  project: 'contact',
  name: 'contact.v3.department.parent',
  sdkName: 'contact.v3.department.parent',
  path: '/open-apis/contact/v3/departments/parent',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Department-Obtain parent department information-Call this interface to recursively obtain the parent department information of the specified department, including department name, ID, person in charge, status, etc',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['department_id', 'open_department_id'])
        .describe(
          'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description].**Default**: open_department_id Options:department_id(Supports user-defined configured department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
        )
        .optional(),
      department_id: z
        .string()
        .describe(
          'Department ID. The ID type needs to be consistent with the value of the query parameter department_id_type.When you create a department, you can obtain the department ID information from the returned results. You can also call the [Search Department] interface to obtain all Required department ID',
        ),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z
        .number()
        .describe('Paging size, used to limit the number of data entries returned in one request')
        .optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const contactV3DepartmentPatch = {
  project: 'contact',
  name: 'contact.v3.department.patch',
  sdkName: 'contact.v3.department.patch',
  path: '/open-apis/contact/v3/departments/:department_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Contacts-Department-Modify department information in part-Call this interface to update some information of the specified department, including name, parent department, sorting, person in charge, etc',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        name: z
          .string()
          .describe(
            'Department name.**Notice**:- Cannot contain slashes (`/`).- Cannot be the same as the existing department name.**Default value**: empty, indicating no modification',
          )
          .optional(),
        i18n_name: z
          .object({
            zh_cn: z.string().describe("Department's Chinese name").optional(),
            ja_jp: z.string().describe("Department's Japanese name").optional(),
            en_us: z.string().describe("Department's English name").optional(),
          })
          .describe(
            'International configuration of department names.**Notice**:- Cannot contain slashes (`/`).- It cannot be repeated with the internationalization configuration of the existing department name.**Default value**: empty, indicating no modification',
          )
          .optional(),
        parent_department_id: z
          .string()
          .describe(
            'The ID of the parent department. How to obtain department ID:- If the parent department of the department needs to be set as the root department, this parameter takes the value `0`.- You can call the [Search Department] interface to obtain the required department ID.**Default value**: empty, indicating no modification',
          )
          .optional(),
        leader_user_id: z
          .string()
          .describe(
            'The user ID of the department head. The ID type is consistent with the value of the query parameter user_id_type. For how to obtain user ID, please refer to [How to obtain different user IDs].**Note**: The values of department head (leader_user_id) and department head (leaderID corresponding to leaderType value 1) are always consistent. therefore:- If the department head is set at the same time (leaderID corresponding to leaderType value 1), the department head set here must be the same person as the department head.- Only the department head is modified, and the department leader will be modified simultaneously (leaderID corresponding to leaderType value 1).**Default value**: empty, indicating no modification',
          )
          .optional(),
        order: z
          .string()
          .describe(
            'The sorting of departments is the order in which departments are displayed among departments at the same level. The value format is a non-negative integer of String type. The smaller the value, the higher the sorting is.**Note**: The order value is unique, that is, the value passed in cannot be the same as the order value of the stock department.**Default value**: empty, indicating no modification',
          )
          .optional(),
        create_group_chat: z
          .boolean()
          .describe(
            'Whether to create department groups. **Optional values are:**- true: create.- false: Do not create. If a department group has been created previously, the group will continue to exist even if set to false.**Note**: When creating a department group, the group name defaults to the department name, and the group owner defaults to the department head.**Default value**: empty, indicating no modification',
          )
          .optional(),
        leaders: z
          .array(
            z.object({
              leaderType: z
                .number()
                .describe(
                  'Person in charge type. Options:1(main Main person in charge),2(deputy Deputy responsible person)',
                ),
              leaderID: z
                .string()
                .describe(
                  'The user ID and ID type of the person in charge are consistent with the value of the query parameter user_id_type. For how to obtain user ID, please refer to [How to obtain different user IDs]',
                ),
            }),
          )
          .describe(
            'Department head information.**Notice**:- If an empty array is passed to leaders, the original value will be cleared.- When configuring this parameter, you must specify a person in charge.- When setting up multiple persons in charge, only one person in charge can be set as the main person in charge.- The values of department head (leader_user_id) and department head (leaderID corresponding to leaderType value 1) are always consistent. therefore: - If a department head (leader_user_id) is set at the same time, the department head set here must be the same person as the department head. - Only the department leader is modified, and the department head (leader_user_id) will be modified simultaneously',
          )
          .optional(),
        group_chat_employee_types: z
          .array(z.number())
          .describe(
            'Personnel type restrictions for department groups.The value range of personnel type is as follows. This parameter supports setting multiple type values. If there are multiple types, separate them with English `,`:- 1: Regular employee- 2: Intern- 3: Outsourcing- 4: Labor services- 5: ConsultantThis parameter supports passing in the number corresponding to the custom person type. You can call the [Query employee type] interface to obtain the corresponding number (enum_value).**Default**: empty',
          )
          .optional(),
        department_hrbps: z
          .array(z.string())
          .describe(
            'List of user IDs for department HRBP. The ID type is consistent with the value of the query parameter user_id_type. For how to obtain user ID, please refer to [How to obtain different user IDs].**Notice**: If an empty array is passed to department_hrbps, the original value will be cleared',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:department_id(Supports user-defined configuration of department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({
        department_id: z
          .string()
          .describe(
            'Department ID, ID type needs to be consistent with the value of the query parameter department_id_type. Instructions on how to obtain the ID:- After calling the [Create Department] interface, the department ID information can be obtained from the returned result.- The department API provides multiple ways to obtain the IDs of other departments, such as [Get list of sub-departments], [Get parent department information], [search department], you can choose the appropriate one API for querying',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3DepartmentSearch = {
  project: 'contact',
  name: 'contact.v3.department.search',
  sdkName: 'contact.v3.department.search',
  path: '/open-apis/contact/v3/departments/search',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Contacts-Department-Search for departments-Call this interface to query the visible department information through the department name keyword as a user, including the department's ID, parent department, person in charge, and status, etc",
  accessTokens: ['user'],
  schema: {
    data: z.object({
      query: z
        .string()
        .describe(
          'Search keywords, the matching field is the department name (matching department internationalized names is not supported)',
        ),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description].**Default**: open_department_id Options:department_id(Supports user-defined configured department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z
          .number()
          .describe('Paging size, used to limit the number of data entries returned in one request')
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const contactV3DepartmentUnbindDepartmentChat = {
  project: 'contact',
  name: 'contact.v3.department.unbindDepartmentChat',
  sdkName: 'contact.v3.department.unbindDepartmentChat',
  path: '/open-apis/contact/v3/departments/unbind_department_chat',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-Department-Change department group to common group-Call this interface to convert the department group of the specified department into a normal group',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      department_id: z
        .string()
        .describe(
          'Department ID, ID type needs to be consistent with the value of the query parameter department_id_type. Instructions on how to obtain the ID:- After calling the [Create Department] interface, the department ID information can be obtained from the returned result.- The department API provides multiple ways to obtain the IDs of other departments, such as [Get list of sub-departments], [Get parent department information], [search department], you can choose the appropriate one API for querying',
        ),
    }),
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description].**Default**: open_department_id Options:department_id(Supports user-defined configuration of department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3DepartmentUpdate = {
  project: 'contact',
  name: 'contact.v3.department.update',
  sdkName: 'contact.v3.department.update',
  path: '/open-apis/contact/v3/departments/:department_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Contacts-Department-Update department information in whole-Call this interface to update the information of the specified department, including name, parent department, person in charge, etc',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z
        .string()
        .describe(
          'Department name.**Notice**:- Cannot contain slashes (`/`).- Cannot be the same as the existing department name',
        ),
      i18n_name: z
        .object({
          zh_cn: z.string().describe("Department's Chinese name").optional(),
          ja_jp: z.string().describe("Department's Japanese name").optional(),
          en_us: z.string().describe("Department's English name").optional(),
        })
        .describe(
          'International configuration of department names.**Notice**:- Cannot contain slashes (`/`).- It cannot be repeated with the internationalization configuration of the existing department name',
        )
        .optional(),
      parent_department_id: z
        .string()
        .describe(
          'The ID of the parent department. How to obtain department ID:- If the parent department of the department needs to be set as the root department, this parameter takes the value `0`.- You can call the [Search Department] interface to obtain the required department ID',
        ),
      leader_user_id: z
        .string()
        .describe(
          'The user ID of the department head. The ID type is consistent with the value of the query parameter user_id_type. For how to obtain user ID, please refer to [How to obtain different user IDs].**Note**: The values of department head (leader_user_id) and department head (leaderID corresponding to leaderType value 1) are always consistent. therefore:- If the department head is set at the same time (leaderID corresponding to leaderType value 1), the department head set here must be the same person as the department head.- Only the department head is modified, and the department leader will be modified simultaneously (leaderID corresponding to leaderType value 1)',
        )
        .optional(),
      order: z
        .string()
        .describe(
          'The sorting of departments is the order in which departments are displayed among departments at the same level. The value format is a non-negative integer of String type. The smaller the value, the higher the sorting is.**Note**: The order value is unique, that is, the value passed in cannot be the same as the order value of the stock department.**Default value**: empty, indicating that the original order value of the department will not be modified',
        )
        .optional(),
      create_group_chat: z
        .boolean()
        .describe(
          'Whether to create department groups. **Optional values are:**- true: create.- false: do not create.**illustrate**:- If the department does not have a department group before, then the value of true will create a department group. When created, the group name defaults to the department name, and the group owner defaults to the department head.- If the department has previously created a department group, this parameter will not affect the original department group regardless of whether it is passed a value',
        )
        .optional(),
      leaders: z
        .array(
          z.object({
            leaderType: z
              .number()
              .describe(
                'Person in charge type. Options:1(main Main person in charge),2(deputy Deputy responsible person)',
              ),
            leaderID: z
              .string()
              .describe(
                'The user ID and ID type of the person in charge are consistent with the value of the query parameter user_id_type. For how to obtain user ID, please refer to [How to obtain different user IDs]',
              ),
          }),
        )
        .describe(
          'Department head information.**Notice**:- When configuring this parameter, you must specify a person in charge.- When setting up multiple persons in charge, only one person in charge can be set as the main person in charge.- The values of department head (leader_user_id) and department head (leaderID corresponding to leaderType value 1) are always consistent. therefore: - If a department head (leader_user_id) is set at the same time, the department head set here must be the same person as the department head. - Only the department leader is modified, and the department head (leader_user_id) will be modified simultaneously',
        )
        .optional(),
      group_chat_employee_types: z
        .array(z.number())
        .describe(
          'Personnel type restrictions for department groups.The value range of personnel type is as follows. This parameter supports setting multiple type values. If there are multiple types, separate them with English `,`:- 1: Regular employee- 2: Intern- 3: Outsourcing- 4: Labor services- 5: ConsultantThis parameter supports passing in the number corresponding to the custom person type. You can call the [Query employee type] interface to obtain the corresponding number (enum_value).**Note**: If the department has previously created a department group, if this parameter does not pass a value, the original department group personnel type restrictions will not be modified by default',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:department_id(Supports user-defined configuration of department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({
        department_id: z
          .string()
          .describe(
            'Department ID, ID type needs to be consistent with the value of the query parameter department_id_type. Instructions on how to obtain the ID:- After calling the [Create Department] interface, the department ID information can be obtained from the returned result.- The department API provides multiple ways to obtain the IDs of other departments, such as [Get list of sub-departments], [Get parent department information], [search department], you can choose the appropriate one API for querying',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3DepartmentUpdateDepartmentId = {
  project: 'contact',
  name: 'contact.v3.department.updateDepartmentId',
  sdkName: 'contact.v3.department.updateDepartmentId',
  path: '/open-apis/contact/v3/departments/:department_id/update_department_id',
  httpMethod: 'PATCH',
  description:
    "[Feishu/Lark]-Contacts-Department-Update DepartmentID-Call this interface to update the department's custom ID, that is, department_id",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      new_department_id: z
        .string()
        .describe(
          "The new custom department ID, which is the department's department_id.**Notice**:- Cannot start with `od-`.- Cannot be set to `0`.- Cannot be the same as the department_id of other departments that have not been deleted",
        ),
    }),
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description].**Default**: open_department_id Options:department_id(Supports user-defined configured department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({
        department_id: z
          .string()
          .describe(
            'Department ID, ID type needs to be consistent with the value of the query parameter department_id_type. Instructions on how to obtain the ID:- After calling the [Create Department] interface, the department ID information can be obtained from the returned result.- The department API provides multiple ways to obtain the IDs of other departments, such as [Get list of sub-departments], [Get parent department information], [search department], you can choose the appropriate one API for querying',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3EmployeeTypeEnumCreate = {
  project: 'contact',
  name: 'contact.v3.employeeTypeEnum.create',
  sdkName: 'contact.v3.employeeTypeEnum.create',
  path: '/open-apis/contact/v3/employee_type_enums',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Contacts-Workforce type-Add a workforce type-Call this interface to add a workforce type. Workforce type is one of the user attributes, used to flexibly mark the user's identity type",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      content: z.string().describe('Enum content of workforce type'),
      enum_type: z
        .number()
        .describe(
          'Enum type of workforce type. When adding, the fixed value is `2`. Options:1(Defualt Built-in type, read-only. This type cannot be selected when adding a new personnel type.),2(Custom Custom.)',
        ),
      enum_status: z
        .number()
        .describe(
          'Enum activation status of the workforce type. Only activated options can be used to configure user properties. Options:1(Active Activated),2(Inactive Unactivated)',
        ),
      i18n_content: z
        .array(
          z.object({
            locale: z
              .string()
              .describe('Language version. For example:- zh_cn: Chinese- en_us: English- ja_jp: Japanese')
              .optional(),
            value: z
              .string()
              .describe(
                'Content corresponding to the language version.**Data verification rules:**Length range: `1` characters ~ `100` characters',
              )
              .optional(),
          }),
        )
        .describe(
          'International configuration of enum content.**Note**: When viewing user workforce types on the Feishu client, the system will automatically display the matching enum language based on the client language environment. If the corresponding language is not included in the enum internationalization configuration, the default option content (i.e. content field) will be displayed',
        )
        .optional(),
    }),
  },
};
export const contactV3EmployeeTypeEnumDelete = {
  project: 'contact',
  name: 'contact.v3.employeeTypeEnum.delete',
  sdkName: 'contact.v3.employeeTypeEnum.delete',
  path: '/open-apis/contact/v3/employee_type_enums/:enum_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Contacts-Workforce type-Delete workforce types-Call this interface to delete the specified custom workforce type',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({
        enum_id: z
          .string()
          .describe(
            'Enum ID of the custom workforce type. You can get it from the return value when creating a new employee type, or you can call the [Query employee type] interface to get the ID of the enum',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3EmployeeTypeEnumList = {
  project: 'contact',
  name: 'contact.v3.employeeTypeEnum.list',
  sdkName: 'contact.v3.employeeTypeEnum.list',
  path: '/open-apis/contact/v3/employee_type_enums',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Workforce type-Query the workforce type-Call this interface to query all workforce type information under the current tenant, including enum ID, type, number, and content',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z
          .number()
          .describe('Paging size, used to limit the number of entries returned in one request')
          .optional(),
      })
      .optional(),
  },
};
export const contactV3EmployeeTypeEnumUpdate = {
  project: 'contact',
  name: 'contact.v3.employeeTypeEnum.update',
  sdkName: 'contact.v3.employeeTypeEnum.update',
  path: '/open-apis/contact/v3/employee_type_enums/:enum_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Contacts-Workforce type-Update the workforce type-Call this interface to update the specified custom workforce type information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      content: z.string().describe('Enum content'),
      enum_type: z
        .number()
        .describe(
          'Enum type. When updating, the fixed value is `2`. Options:1(Defualt Built-in. This type is only used in query results. This type is not supported when updating workforce types.),2(Custom Custom.)',
        ),
      enum_status: z
        .number()
        .describe(
          'The activation status of the enum. Only activated enum can be used to configure user properties. Options:1(Active Activated),2(Inactive Unactivated)',
        ),
      i18n_content: z
        .array(
          z.object({
            locale: z
              .string()
              .describe('Language version. For example:- zh_cn: Chinese- en_us: English- ja_jp: Japanese')
              .optional(),
            value: z
              .string()
              .describe(
                'Content corresponding to the language version.**Data verification rules:**Length range: `1` characters ~ `100` characters',
              )
              .optional(),
          }),
        )
        .describe(
          'International configuration of enum content.**Note**:- When viewing user workforce types on the Feishu client, the system will automatically display the matching enum language based on the client language environment. If the corresponding language is not included in the enum internationalization configuration, the default enum content (i.e. content field) will be displayed.- Not passing a value means not updating the original configuration',
        )
        .optional(),
    }),
    path: z
      .object({
        enum_id: z
          .string()
          .describe(
            'Enum ID of the custom workforce type. You can get it from the return value when creating a new employee type, or you can call the [Query employee type] interface to get the ID of the enum',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3FunctionalRoleCreate = {
  project: 'contact',
  name: 'contact.v3.functionalRole.create',
  sdkName: 'contact.v3.functionalRole.create',
  path: '/open-apis/contact/v3/functional_roles',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Contacts-role-Create role-Call this interface to create a role',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      role_name: z
        .string()
        .describe('Role name. The role name is unique in the same tenant and cannot be created repeatedly'),
    }),
  },
};
export const contactV3FunctionalRoleDelete = {
  project: 'contact',
  name: 'contact.v3.functionalRole.delete',
  sdkName: 'contact.v3.functionalRole.delete',
  path: '/open-apis/contact/v3/functional_roles/:role_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Contacts-role-Delete role-Call this interface to delete the specified role',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      role_id: z
        .string()
        .describe(
          'Role ID. How to obtain it:- You can obtain it from the returned result when creating a role.- Enterprise administrators can obtain the role ID on the right side of the role name in [Admin] > **Organization** > **Role** page',
        ),
    }),
  },
};
export const contactV3FunctionalRoleMemberBatchCreate = {
  project: 'contact',
  name: 'contact.v3.functionalRoleMember.batchCreate',
  sdkName: 'contact.v3.functionalRoleMember.batchCreate',
  path: '/open-apis/contact/v3/functional_roles/:role_id/members/batch_create',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-role member-Batch create role members-Call this interface to add one or more members to the specified role',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      members: z
        .array(z.string())
        .describe(
          'A list of user IDs to be added as role members, passed in the array format of `["xxx", "yyy"]`. The ID type must be consistent with the value of the query parameter user_id_type',
        ),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      role_id: z
        .string()
        .describe(
          'Role ID. How to obtain it:- You can obtain it from the returned result when you [create a role].- Enterprise administrators can obtain the role ID on the right side of the role name in the [Admin] > **Organization** > **Role** page',
        ),
    }),
  },
};
export const contactV3FunctionalRoleMemberBatchDelete = {
  project: 'contact',
  name: 'contact.v3.functionalRoleMember.batchDelete',
  sdkName: 'contact.v3.functionalRoleMember.batchDelete',
  path: '/open-apis/contact/v3/functional_roles/:role_id/members/batch_delete',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Contacts-role member-Delete members from roles-Call this interface to delete one or more members in the specified role',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        members: z
          .array(z.string())
          .describe(
            'A list of user IDs of the role members to be deleted, passed in the array format of `["xxx", "yyy"]`. The ID type must be consistent with the value of the query parameter user_id_type',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      role_id: z
        .string()
        .describe(
          'Role ID. How to obtain it:- You can obtain it from the returned result when you [create a role].- Enterprise administrators can obtain the role ID on the right side of the role name in the [Admin] > **Organization** > **Role** page',
        ),
    }),
  },
};
export const contactV3FunctionalRoleMemberGet = {
  project: 'contact',
  name: 'contact.v3.functionalRoleMember.get',
  sdkName: 'contact.v3.functionalRoleMember.get',
  path: '/open-apis/contact/v3/functional_roles/:role_id/members/:member_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-role member-The administrative scope of a member under a query role-Call this interface to query the management scope of a specified member within a specified role',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The department ID type in this call. For a detailed description of department IDs, see [Department ID Description]. Options:department_id(Supports user-defined department ID. When customizing the configuration, the deleted department_id can be reused, so the department_id is unique within the scope of the non-deleted department.),open_department_id(The department ID is automatically generated by the system. The ID prefix is ​​fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      role_id: z
        .string()
        .describe(
          'Role ID. How to obtain it:- You can obtain it from the returned result when you [create a role].- Enterprise administrators can obtain the role ID on the right side of the role name in the [Admin] > **Organization** > **Role** page',
        ),
      member_id: z
        .string()
        .describe(
          'The user ID of the role member. The ID type must be consistent with the value of the query parameter user_id_type',
        ),
    }),
  },
};
export const contactV3FunctionalRoleMemberList = {
  project: 'contact',
  name: 'contact.v3.functionalRoleMember.list',
  sdkName: 'contact.v3.functionalRoleMember.list',
  path: '/open-apis/contact/v3/functional_roles/:role_id/members',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Contacts-role member-Query all member information under the role-Call this interface to query all member information within the specified role, including the member's user ID and management scope",
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z
          .number()
          .describe('The paging size is used to limit the number of data entries returned in one request')
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The department ID type in this call. For a detailed description of department IDs, see [Department ID Description]. Options:department_id(Supports user-defined department ID. When customizing the configuration, the deleted department_id can be reused, so the department_id is unique within the scope of the non-deleted department.),open_department_id(The department ID is automatically generated by the system. The ID prefix is ​​fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      role_id: z
        .string()
        .describe(
          'Role ID. How to obtain it:- You can obtain it from the returned result when you [create a role].- Enterprise administrators can obtain the role ID on the right side of the role name in the [Admin] > **Organization** > **Role** page',
        ),
    }),
  },
};
export const contactV3FunctionalRoleMemberScopes = {
  project: 'contact',
  name: 'contact.v3.functionalRoleMember.scopes',
  sdkName: 'contact.v3.functionalRoleMember.scopes',
  path: '/open-apis/contact/v3/functional_roles/:role_id/members/scopes',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Contacts-role member-Batch update role members scopes-Call this interface to set the management scope for one or more role members in the specified role. The management scope refers to the range of departments that the role member can manage',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      members: z
        .array(z.string())
        .describe(
          'A list of user IDs of role members, passed in the array format of `["xxx", "yyy"]`. The ID type must be consistent with the value of the query parameter user_id_type',
        ),
      departments: z
        .array(z.string())
        .describe(
          'Set the range of departments that the role member can manage (department ID list), and pass the value in the `["xxx", "yyy"]` array format. The ID type needs to be consistent with the value of the query parameter department_id_type.The department API provides multiple ways to obtain department IDs, such as [Get child department list], [Get parent department information], [Search department]. You can choose the appropriate API to query.**Note**: It is not supported to set the management scope of the root department (department ID is 0) for role members',
        ),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The department ID type in this call. For a detailed description of department IDs, see [Department ID Description]. Options:department_id(Supports user-defined department ID. When customizing the configuration, the deleted department_id can be reused, so the department_id is unique within the scope of the non-deleted department.),open_department_id(The department ID is automatically generated by the system. The ID prefix is ​​fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      role_id: z
        .string()
        .describe(
          'Role ID. How to obtain it:- You can obtain it from the returned result when you [create a role].- Enterprise administrators can obtain the role ID on the right side of the role name in the [Admin] > **Organization** > **Role** page',
        ),
    }),
  },
};
export const contactV3FunctionalRoleUpdate = {
  project: 'contact',
  name: 'contact.v3.functionalRole.update',
  sdkName: 'contact.v3.functionalRole.update',
  path: '/open-apis/contact/v3/functional_roles/:role_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Contacts-role-Update role name-Call this interface to modify the role name of the specified role',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      role_name: z.string().describe('Role name. The role name is unique in the same tenant and cannot be repeated'),
    }),
    path: z.object({
      role_id: z
        .string()
        .describe(
          'Role ID. How to obtain it:- You can obtain it from the returned result when creating a role.- Enterprise administrators can obtain the role ID on the right side of the role name in [Admin] > **Organization** > **Role** page',
        ),
    }),
  },
};
export const contactV3GroupCreate = {
  project: 'contact',
  name: 'contact.v3.group.create',
  sdkName: 'contact.v3.group.create',
  path: '/open-apis/contact/v3/group',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-User group-Create a user group-Call this interface to create a user group. User group is one of the basic entities in Feishu Contacts. Users or department resources can be added to user groups. Various types of business permission control can be associated with user groups to achieve efficient and convenient member permission control',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z
        .string()
        .describe(
          'User group name cannot exceed 100 characters in length.**Note**: The user group name is unique within the enterprise. If it is set repeatedly, the creation will fail',
        ),
      description: z
        .string()
        .describe('User group description, cannot exceed 500 characters in length.**Default**: empty')
        .optional(),
      type: z
        .number()
        .describe(
          'Type of user group. The default value is `1`, indicating the ordinary user group. Options:1(Assign General User Group),2(Dynamic This value is not currently supported)',
        )
        .optional(),
      group_id: z
        .string()
        .describe(
          'Custom user group ID.**Data verification rules:**- Maximum length: 64 characters- Verification rules: a combination of numbers, uppercase and lowercase letters, and no spaces.**Default value**: Empty, a default ID is generated by the system',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.),department_id(Supports user-defined configuration of department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3GroupDelete = {
  project: 'contact',
  name: 'contact.v3.group.delete',
  sdkName: 'contact.v3.group.delete',
  path: '/open-apis/contact/v3/group/:group_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Contacts-User group-Delete a user group-Call this interface to delete the specified user group',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      group_id: z
        .string()
        .describe(
          'User group ID to be deleted.The user group ID can be obtained from the return value when creating the user group. You can also call the [Query User Group List] interface to obtain the user group ID',
        ),
    }),
  },
};
export const contactV3GroupGet = {
  project: 'contact',
  name: 'contact.v3.group.get',
  sdkName: 'contact.v3.group.get',
  path: '/open-apis/contact/v3/group/:group_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-User group-Query a user group-Call this interface to query the basic information of the specified user group through the user group ID, including user group name, number and type of members, etc',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.),department_id(Supports user-defined configuration of department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      group_id: z
        .string()
        .describe(
          'User group ID.The user group ID can be obtained from the return value when creating the user group. You can also call the [Query User Group List] interface to obtain the user group ID',
        ),
    }),
  },
};
export const contactV3GroupMemberBelong = {
  project: 'contact',
  name: 'contact.v3.group.memberBelong',
  sdkName: 'contact.v3.group.memberBelong',
  path: '/open-apis/contact/v3/group/member_belong',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-User group-Query the user group list to which the user belongs-Call this interface to query the list of user groups to which the specified user belongs',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      member_id: z.string().describe('Member ID. The ID type is consistent with the value of member_id_type'),
      member_id_type: z
        .enum(['open_id', 'union_id', 'user_id'])
        .describe(
          "Member id type. Options:open_id(OpenID Identifies a user's identity in an application. The same user has different Open IDs in different applications. [Learn more: How to obtain an Open ID].),union_id(UnionID Identifies a user's identity under an application developer. The Union ID of the same user in applications from the same developer is the same, but the Union IDs in applications from different developers are different. Through Union ID, application developers can associate the same user's identity in multiple applications. [Learn more: How to get a Union ID? ].),user_id(UserID Identifies a user's identity within a tenant. The User ID of the same user in tenant A and tenant B is different. Within the same tenant, a user's User ID remains consistent across all apps, including store apps. User ID is mainly used to connect user data between different applications. [Learn more: How to get a User ID? ].)",
        )
        .optional(),
      group_type: z
        .number()
        .describe('User group type. Options:1(Assign Common user group),2(Dynamic Dynamic user group)')
        .optional(),
      page_size: z
        .number()
        .describe('Paging size, used to limit the number of data entries returned in one request')
        .optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const contactV3GroupMemberAdd = {
  project: 'contact',
  name: 'contact.v3.groupMember.add',
  sdkName: 'contact.v3.groupMember.add',
  path: '/open-apis/contact/v3/group/:group_id/member/add',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-User group member-Add members to a user group-Call this interface to add members to the specified common user group',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      member_type: z
        .literal('user')
        .describe('The type of user group member. Currently, only user is supported. Options:user(user member)'),
      member_id_type: z
        .enum(['open_id', 'union_id', 'user_id'])
        .describe(
          "When `member_type` is set to `user`, this parameter is used to set the user ID type. Options:open_id(OpenID Identifies a user's identity in an application. The Open ID of the same user in different applications is different.),union_id(UnionID Identifies the identity of a user under a certain application developer. The Union ID of the same user in applications under the same developer is the same, and the Union ID of applications under different developers is different. Through the Union ID, application developers can associate the identities of the same user in multiple applications.),user_id(UserID Identifies a user's identity in a tenant. The User ID of the same user in tenant A and tenant B is different. In the same tenant, the User ID of a user remains consistent in all applications. The User ID is mainly used to connect user data between different applications.)",
        ),
      member_id: z
        .string()
        .describe(
          'The added user ID, the ID type is consistent with the value of member_id_type. For different types of ID acquisition methods, see:- [How to obtain user open_id]- [How to obtain user union_id]- [How to obtain user user_id]',
        ),
    }),
    path: z.object({
      group_id: z
        .string()
        .describe(
          'User group ID. The user group ID can be obtained from the return value when creating the user group. You can also call the [Query User Group List] interface to obtain the user group ID',
        ),
    }),
  },
};
export const contactV3GroupMemberBatchAdd = {
  project: 'contact',
  name: 'contact.v3.groupMember.batchAdd',
  sdkName: 'contact.v3.groupMember.batchAdd',
  path: '/open-apis/contact/v3/group/:group_id/member/batch_add',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-User group member-Batch add user group members-Call this interface to add one or more members to the specified common user group',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        members: z
          .array(
            z.object({
              member_id: z
                .string()
                .describe(
                  'The added user ID, the ID type is consistent with the value of member_id_type. For different types of ID acquisition methods, see:- [How to obtain user open_id]- [How to obtain user union_id]- [How to obtain user user_id]',
                ),
              member_type: z
                .string()
                .describe('The type of user group member. Currently, only user is supported, indicating the user type'),
              member_id_type: z
                .string()
                .describe(
                  'When `member_type` is set to `user`, this parameter is required and the user ID type must be set through this parameter. Including:- open_id: Identifies the identity of a user in a certain application. The Open ID of the same user in different applications is different.- union_id: Identifies the identity of a user under a certain application developer. The Union ID of the same user in applications under the same developer is the same, and the Union ID of applications under different developers is different. Through the Union ID, application developers can associate the identities of the same user in multiple applications.- user_id: Identifies the identity of a user in a certain tenant. The User ID of the same user in tenant A and tenant B is different. In the same tenant, the User ID of a user is consistent in all applications. User ID is mainly used to connect user data between different applications',
                )
                .optional(),
            }),
          )
          .describe('Member information to be added')
          .optional(),
      })
      .optional(),
    path: z.object({
      group_id: z
        .string()
        .describe(
          'User group ID. The user group ID can be obtained from the return value when creating the user group. You can also call the [Query User Group List] interface to obtain the user group ID',
        ),
    }),
  },
};
export const contactV3GroupMemberBatchRemove = {
  project: 'contact',
  name: 'contact.v3.groupMember.batchRemove',
  sdkName: 'contact.v3.groupMember.batchRemove',
  path: '/open-apis/contact/v3/group/:group_id/member/batch_remove',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-User group member-Batch remove user group members-Call this interface to remove one or more members from the specified common user group',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      members: z
        .array(
          z.object({
            member_id: z
              .string()
              .describe(
                'The ID of the user to be removed, the ID type is consistent with the value of member_id_type.You can call the [Query User Group Member List] interface to obtain the member IDs in the user group, and pass the member ID to be removed into the current parameter. Note that only members of the user type can be removed, and the same user ID type must be used, otherwise an error will be reported',
              ),
            member_type: z
              .string()
              .describe('The type of user group member. Currently, only user is supported, indicating the user type'),
            member_id_type: z
              .string()
              .describe(
                'When `member_type` is set to `user`, this parameter is required and the user ID type must be set through this parameter, including:- open_id: Identifies the identity of a user in a certain application. The Open ID of the same user in different applications is different.- union_id: Identifies the identity of a user under a certain application developer. The Union ID of the same user in applications under the same developer is the same, and the Union ID of applications under different developers is different. Through the Union ID, application developers can associate the identities of the same user in multiple applications.- user_id: Identifies the identity of a user in a certain tenant. The User ID of the same user in tenant A and tenant B is different. In the same tenant, the User ID of a user is consistent in all applications. User ID is mainly used to connect user data between different applications',
              )
              .optional(),
          }),
        )
        .describe('Member information to be removed'),
    }),
    path: z.object({
      group_id: z
        .string()
        .describe(
          'User group ID. The user group ID can be obtained from the return value when creating the user group. You can also call the [Query User Group List] interface to obtain the user group ID',
        ),
    }),
  },
};
export const contactV3GroupMemberRemove = {
  project: 'contact',
  name: 'contact.v3.groupMember.remove',
  sdkName: 'contact.v3.groupMember.remove',
  path: '/open-apis/contact/v3/group/:group_id/member/remove',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-User group member-Remove members from a user group-Call this interface to remove a member from the specified common user group',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      member_type: z
        .literal('user')
        .describe('The type of user group member. Currently, only user is supported. Options:user(user member)'),
      member_id: z
        .string()
        .describe(
          'The ID of the user to be removed, the ID type is consistent with the value of member_id_type.You can call the [Query User Group Member List] interface to obtain the member IDs in the user group, and pass the member ID to be removed into the current parameter. Note that only members of the user type can be removed, and the same user ID type must be used, otherwise an error will be reported',
        ),
      member_id_type: z
        .enum(['open_id', 'union_id', 'user_id'])
        .describe(
          "When `member_type` is set to `user`, this parameter is used to set the user ID type. Options:open_id(OpenID Identifies a user's identity in an application. The Open ID of the same user in different applications is different.),union_id(UnionID Identifies the identity of a user under a certain application developer. The Union ID of the same user in applications under the same developer is the same, and the Union ID of applications under different developers is different. Through the Union ID, application developers can associate the identities of the same user in multiple applications.),user_id(UserID Identifies a user's identity in a tenant. The User ID of the same user in tenant A and tenant B is different. In the same tenant, the User ID of a user remains consistent in all applications. The User ID is mainly used to connect user data between different applications.)",
        ),
    }),
    path: z.object({
      group_id: z
        .string()
        .describe(
          'User group ID. The user group ID can be obtained from the return value when creating the user group. You can also call the [Query User Group List] interface to obtain the user group ID',
        ),
    }),
  },
};
export const contactV3GroupMemberSimplelist = {
  project: 'contact',
  name: 'contact.v3.groupMember.simplelist',
  sdkName: 'contact.v3.groupMember.simplelist',
  path: '/open-apis/contact/v3/group/:group_id/member/simplelist',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-User group member-List user group member-Call this interface to query the member list in the specified user group. The list mainly includes member ID information',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z
          .number()
          .describe('The paging size is used to limit the maximum number of entries returned in one request')
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        member_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'department_id'])
          .describe(
            "User group member ID type.- When the value of `member_type` is `user`, this parameter indicates the user ID type, including open_id, union_id, and user_id.- When the value of `member_type` is `department`, this parameter indicates the department ID type, including department_id and open_department_id. Options:open_id(When `member_type` is `user`, it indicates the user's open_id.When `member_type` is `department`, it indicates the department's open_department_id.),union_id(When `member_type` is set to `user`, it indicates the user's union_id.),user_id(When the value of `member_type` is `user`, it indicates the user_id of the user.),department_id(When the value of `member_type` is `department`, it indicates the department_id of the department.)",
          )
          .optional(),
        member_type: z
          .enum(['user', 'department'])
          .describe(
            'User group member type. Options:user(User, which means only querying the user type members in the user group.),department(Department: Only department members in the user group are queried.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      group_id: z
        .string()
        .describe(
          'User group ID. The user group ID can be obtained from the return value when creating the user group. You can also call the [Query User Group List] interface to obtain the user group ID',
        ),
    }),
  },
};
export const contactV3GroupPatch = {
  project: 'contact',
  name: 'contact.v3.group.patch',
  sdkName: 'contact.v3.group.patch',
  path: '/open-apis/contact/v3/group/:group_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Contacts-User group-Update a user group-Call this interface to update the name or description of the specified user group',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        name: z
          .string()
          .describe(
            'User group name cannot exceed 100 characters in length.**Note**: The user group name is unique within the enterprise. If it is set repeatedly, the creation will fail.**Default value**: empty, indicating that the user group name will not be updated',
          )
          .optional(),
        description: z
          .string()
          .describe(
            'User group description, cannot exceed 500 characters in length.**Default value**: empty, indicating not to update the user group description',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:department_id(Supports user-defined configuration of department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      group_id: z
        .string()
        .describe(
          'User group ID.The user group ID can be obtained from the return value when creating the user group. You can also call the [Query User Group List] interface to obtain the user group ID',
        ),
    }),
  },
};
export const contactV3GroupSimplelist = {
  project: 'contact',
  name: 'contact.v3.group.simplelist',
  sdkName: 'contact.v3.group.simplelist',
  path: '/open-apis/contact/v3/group/simplelist',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-User group-Query the list of user groups-Call this interface to query the list of user groups under the current tenant. The list contains information such as the ID, name, number and type of members of the user group',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z
          .number()
          .describe('Paging size, used to limit the number of data entries returned in one request')
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        type: z
          .number()
          .describe('User group type. Options:1(Assign Common user group),2(Dynamic Dynamic user group)')
          .optional(),
      })
      .optional(),
  },
};
export const contactV3JobFamilyCreate = {
  project: 'contact',
  name: 'contact.v3.jobFamily.create',
  sdkName: 'contact.v3.jobFamily.create',
  path: '/open-apis/contact/v3/job_families',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Contacts-Job family-Create a job family-Call this interface to create a job family.Call this interface to create a job family. Job family is one of the user attributes, which is used to define the user's work type, such as product, R&D, operation, etc",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z
        .string()
        .describe(
          'Job family name. The value supports Chinese, English and symbols. It is unique under a tenant and cannot be created repeatedly',
        ),
      description: z
        .string()
        .describe('Job family description. The maximum character length is 5,000.**Default value**: empty')
        .optional(),
      parent_job_family_id: z
        .string()
        .describe(
          'Parent job family ID. If you need to add a sub job family to a job family, you need to pass in this parameter value. You can call the [Get tenant job family list] interface to get the job family ID.**Default value**: empty, indicating that the job family has no parent job family',
        )
        .optional(),
      status: z.boolean().describe('Whether to enable the job family.**Optional values**:- true- false'),
      i18n_name: z
        .array(
          z.object({
            locale: z
              .string()
              .describe('Language version. Optional values ​​are:- zh_cn: Chinese- en_us: English- ja_jp: Japanese')
              .optional(),
            value: z.string().describe('The value corresponding to the language version').optional(),
          }),
        )
        .describe('Multilingual job family name')
        .optional(),
      i18n_description: z
        .array(
          z.object({
            locale: z
              .string()
              .describe('Language version. Optional values ​​are:- zh_cn: Chinese- en_us: English- ja_jp: Japanese')
              .optional(),
            value: z.string().describe('The value corresponding to the language version').optional(),
          }),
        )
        .describe('Multilingual job family description')
        .optional(),
    }),
  },
};
export const contactV3JobFamilyDelete = {
  project: 'contact',
  name: 'contact.v3.jobFamily.delete',
  sdkName: 'contact.v3.jobFamily.delete',
  path: '/open-apis/contact/v3/job_families/:job_family_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Contacts-Job family-Delete a job family-Call this interface to delete the specified job family',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      job_family_id: z
        .string()
        .describe(
          'Job family ID. How to obtain:- You can obtain it from the returned result when [Create job family].- Call the [Get tenant Job family list] interface to obtain the Job family ID',
        ),
    }),
  },
};
export const contactV3JobFamilyGet = {
  project: 'contact',
  name: 'contact.v3.jobFamily.get',
  sdkName: 'contact.v3.jobFamily.get',
  path: '/open-apis/contact/v3/job_families/:job_family_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Job family-Query a job family-Call this interface to obtain the information of the specified job family, including the name, description, enabled status, and ID of the job family',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      job_family_id: z
        .string()
        .describe(
          'Job family ID. How to obtain:- You can obtain it from the returned result when [Create job family].- Call the [Get tenant Job family list] interface to obtain the Job family ID',
        ),
    }),
  },
};
export const contactV3JobFamilyList = {
  project: 'contact',
  name: 'contact.v3.jobFamily.list',
  sdkName: 'contact.v3.jobFamily.list',
  path: '/open-apis/contact/v3/job_families',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Job family-Query the list of job family-Call this interface to obtain the job family information of the current tenant, including the name, description, enabled status, and ID of the job family',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z
          .number()
          .describe('The paging size is used to limit the number of data items returned in one request')
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        name: z
          .string()
          .describe(
            'Job family name, when passing in this field, you can query the job family information corresponding to the specified job family name',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3JobFamilyUpdate = {
  project: 'contact',
  name: 'contact.v3.jobFamily.update',
  sdkName: 'contact.v3.jobFamily.update',
  path: '/open-apis/contact/v3/job_families/:job_family_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Contacts-Job family-Update job family-Call this interface to update the information of the specified job family',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        name: z
          .string()
          .describe(
            'Job family name. Unique within a tenant. Values ​​can be in Chinese, English, and symbols.**Default value**: empty, meaning no update',
          )
          .optional(),
        description: z
          .string()
          .describe(
            'Job family description. The maximum character length is 5,000.**Default value**: empty, meaning no update',
          )
          .optional(),
        parent_job_family_id: z
          .string()
          .describe(
            'Parent job family ID. You can call the [Get tenant job family list] interface to get the job family ID.**Default value**: empty, indicating no update',
          )
          .optional(),
        status: z
          .boolean()
          .describe(
            'Whether to enable the job family.**Optional values**:- true- false**Default value**: empty, indicating no update',
          )
          .optional(),
        i18n_name: z
          .array(
            z.object({
              locale: z
                .string()
                .describe('Language version. Optional values ​​are:- zh_cn: Chinese- en_us: English- ja_jp: Japanese')
                .optional(),
              value: z.string().describe('The value corresponding to the language version').optional(),
            }),
          )
          .describe('Multilingual job family name**Default value**: empty, indicating no update')
          .optional(),
        i18n_description: z
          .array(
            z.object({
              locale: z
                .string()
                .describe('Language version. Optional values ​​are:- zh_cn: Chinese- en_us: English- ja_jp: Japanese')
                .optional(),
              value: z.string().describe('The value corresponding to the language version').optional(),
            }),
          )
          .describe('Multilingual job family description**Default value**: empty, indicating no update')
          .optional(),
      })
      .optional(),
    path: z.object({
      job_family_id: z
        .string()
        .describe(
          'Job family ID. How to obtain:- You can obtain it from the returned result when [Create job family].- Call the [Get tenant Job family list] interface to obtain the Job family ID',
        ),
    }),
  },
};
export const contactV3JobLevelCreate = {
  project: 'contact',
  name: 'contact.v3.jobLevel.create',
  sdkName: 'contact.v3.jobLevel.create',
  path: '/open-apis/contact/v3/job_levels',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Contacts-Job level-Create a job level-Call this interface to create a job level. Job level is one of the user attributes, used to identify the user's position level, such as P1, P2, P3, P4",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z
        .string()
        .describe('Job level name. Common name. If no multilingual name is set, this name is displayed by default'),
      description: z
        .string()
        .describe(
          'Job level description. Maximum character length: 5,000. General description. If no multilingual description is set, this description will be displayed by default.**Default value**: empty',
        )
        .optional(),
      order: z
        .number()
        .describe(
          'Job level order. Sort in ascending order.**Default value**: empty. If this value is not passed, the default job level is ranked last in the list (that is, the order value is the maximum value in the current job level list)',
        )
        .optional(),
      status: z
        .boolean()
        .describe(
          'Whether to enable this job level.**Optional values**:- true- false**Note**: Only enabled job levels can be set as user attributes',
        ),
      i18n_name: z
        .array(
          z.object({
            locale: z
              .string()
              .describe('Language version. For example:- zh_cn: Chinese- en_us: English- ja_jp: Japanese')
              .optional(),
            value: z.string().describe('The job level name corresponding to the language version').optional(),
          }),
        )
        .describe('Multilingual name.**Default value**: Empty, indicating that no multilingual name is set')
        .optional(),
      i18n_description: z
        .array(
          z.object({
            locale: z
              .string()
              .describe('Language version. For example:- zh_cn: Chinese- en_us: English- ja_jp: Japanese')
              .optional(),
            value: z.string().describe('The job level description corresponding to the language version').optional(),
          }),
        )
        .describe(
          'Multilingual description.**Default value**: Empty, indicating that no multilingual description is set',
        )
        .optional(),
    }),
  },
};
export const contactV3JobLevelDelete = {
  project: 'contact',
  name: 'contact.v3.jobLevel.delete',
  sdkName: 'contact.v3.jobLevel.delete',
  path: '/open-apis/contact/v3/job_levels/:job_level_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Contacts-Job level-Delete a job level-Call this interface to delete the specified job level',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      job_level_id: z
        .string()
        .describe(
          'Job level ID. How to obtain it:- When creating a job level, you can obtain the job level ID from the returned result.- Call the [Get tenant job level list] interface to find the ID information of the specified job level',
        ),
    }),
  },
};
export const contactV3JobLevelGet = {
  project: 'contact',
  name: 'contact.v3.jobLevel.get',
  sdkName: 'contact.v3.jobLevel.get',
  path: '/open-apis/contact/v3/job_levels/:job_level_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Job level-Query a job level-Call this interface to obtain the information of the specified job level, including job level name, description, order, status, and multi-language',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      job_level_id: z
        .string()
        .describe(
          'Job level ID. How to obtain it:- When creating a job level, you can obtain the job level ID from the returned result.- Call the [Get tenant job level list] interface to find the ID information of the specified job level',
        ),
    }),
  },
};
export const contactV3JobLevelList = {
  project: 'contact',
  name: 'contact.v3.jobLevel.list',
  sdkName: 'contact.v3.jobLevel.list',
  path: '/open-apis/contact/v3/job_levels',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Job level-Query the list of job level-Call this interface to obtain the job level information of the current tenant, including job level name, description, order, status, and multi-language',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z
          .number()
          .describe('The paging size is used to limit the number of data items returned in one request')
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        name: z
          .string()
          .describe(
            'Job level name.- When this field is passed, the job level information corresponding to the specified job level name can be queried (fuzzy query is not supported).- When this field is not passed, the information of all job levels under the current tenant is queried',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3JobLevelUpdate = {
  project: 'contact',
  name: 'contact.v3.jobLevel.update',
  sdkName: 'contact.v3.jobLevel.update',
  path: '/open-apis/contact/v3/job_levels/:job_level_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Contacts-Job level-Update job level-Call this interface to update the information of the specified job level',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        name: z
          .string()
          .describe(
            'The generic name of the job level, if no multilingual name is set, this name will be displayed by default.**Default value**: empty, meaning no update',
          )
          .optional(),
        description: z
          .string()
          .describe(
            'The general description of the job level, if the multilingual description is not set, this description will be displayed by default.**Default value**: empty, indicating no update',
          )
          .optional(),
        order: z
          .number()
          .describe('Job level order. Sort in ascending order.**Default value**: empty, indicating no update')
          .optional(),
        status: z
          .boolean()
          .describe(
            'Whether to enable this job level.**Optional values**:- true- false**Default value**: Empty, indicating no update',
          )
          .optional(),
        i18n_name: z
          .array(
            z.object({
              locale: z
                .string()
                .describe(
                  'Language version. For example:- zh_cn: Chinese- en_us: English- ja_jp: Japanese**Default value**: Empty, meaning no update',
                )
                .optional(),
              value: z
                .string()
                .describe(
                  'The job level name corresponding to the language version.**Default value**: empty, indicating no update',
                )
                .optional(),
            }),
          )
          .describe('Multilingual name')
          .optional(),
        i18n_description: z
          .array(
            z.object({
              locale: z
                .string()
                .describe(
                  'Language version. For example:- zh_cn: Chinese- en_us: English- ja_jp: Japanese**Default value**: Empty, meaning no update',
                )
                .optional(),
              value: z.string().describe('The job level description corresponding to the language version').optional(),
            }),
          )
          .describe('Multilingual description')
          .optional(),
      })
      .optional(),
    path: z.object({
      job_level_id: z
        .string()
        .describe(
          'Job level ID. How to obtain it:- When creating a job level, you can obtain the job level ID from the returned result.- Call the [Get tenant job level list] interface to find the ID information of the specified job level',
        ),
    }),
  },
};
export const contactV3JobTitleGet = {
  project: 'contact',
  name: 'contact.v3.jobTitle.get',
  sdkName: 'contact.v3.jobTitle.get',
  path: '/open-apis/contact/v3/job_titles/:job_title_id',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Contacts-Job title-Query a job title-Call this interface to obtain the information of the specified job title, including the job title's ID, name, multi-language name, and enabled status",
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z
      .object({
        job_title_id: z
          .string()
          .describe('Job title ID. You can call the [Get tenant job title list] interface to obtain the job ID')
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const contactV3JobTitleList = {
  project: 'contact',
  name: 'contact.v3.jobTitle.list',
  sdkName: 'contact.v3.jobTitle.list',
  path: '/open-apis/contact/v3/job_titles',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Job title-Query the list of job titles-Call this interface to obtain the job title information of the current tenant, including the job title ID, name, multi-language name, and enabled status',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_size: z
          .number()
          .describe('The paging size is used to limit the number of data items returned in one request')
          .optional(),
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
export const contactV3ScopeList = {
  project: 'contact',
  name: 'contact.v3.scope.list',
  sdkName: 'contact.v3.scope.list',
  path: '/open-apis/contact/v3/scopes',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Contact Scope-Obtain the contacts permission scope-This API is used to obtain the range of contacts data that an app is authorized to access, including the department list, user list, and user group list',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Type of the returned department ID. For an introduction to types, see [General Parameters]. Options:department_id(Supports user-defined configured department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z
          .number()
          .describe(
            'Page size, used to set the length of the return value list for a call.**Notice**: When querying by page, the sum of the lengths of all resource lists returned will not be greater than the page_size value. The order of returning resources in the list is: first return user_ids, then return department_ids, and finally return group_ids',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3UnitBindDepartment = {
  project: 'contact',
  name: 'contact.v3.unit.bindDepartment',
  sdkName: 'contact.v3.unit.bindDepartment',
  path: '/open-apis/contact/v3/unit/bind_department',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-Unit-Associate a department with a unit-Call this interface to establish the binding relationship between a department and an organization. A department can only be bound to one organization at a time',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      unit_id: z
        .string()
        .describe(
          'Unit ID.When you create a unit, you can get the unit ID in the returned result. You can also call the [Get Unit List] interface to get the unit ID',
        ),
      department_id: z
        .string()
        .describe(
          'The department ID associated with the unit. The ID type is consistent with the value of department_id_type.The department API provides multiple ways to obtain department IDs, such as [Get child department list], [Get parent department information], and [Search for department]. You can choose the appropriate API to query',
        ),
      department_id_type: z
        .enum(['department_id', 'open_department_id'])
        .describe(
          'The department ID type in this call. For a detailed description of department IDs, see [Department ID Description]. Options:department_id(Supports user-defined department ID. When customizing the configuration, the deleted department_id can be reused, so the department_id is unique within the scope of the non-deleted department.),open_department_id(The department ID is automatically generated by the system. The ID prefix is ​​fixed to `od-` and is globally unique within the tenant.)',
        )
        .optional(),
    }),
  },
};
export const contactV3UnitCreate = {
  project: 'contact',
  name: 'contact.v3.unit.create',
  sdkName: 'contact.v3.unit.create',
  path: '/open-apis/contact/v3/unit',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Contacts-Unit-Create a unit-Call this interface to create a unit',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      unit_id: z
        .string()
        .describe(
          'Custom unit ID, unique within a tenant, cannot be modified after creation.**Data validation rules:** 1 to 64 characters, only letters and numbers are supported.**Default value**: Empty, if no value is passed, a default ID is automatically generated by the system',
        )
        .optional(),
      name: z
        .string()
        .describe(
          'Unit name.**Data validation rules:** 1 to 100 characters.**Note**: In a tenant, the name and unit_type passed in cannot be repeated at the same time. For example, if there is already a unit with name `A` and type `A`, creating another unit with name `A` and type `A` will fail',
        ),
      unit_type: z
        .string()
        .describe(
          'Customized unit type, cannot be modified after creation.**Data validation rules:** 1 to 100 characters.**Note**: In a tenant, the name and unit_type passed in cannot be repeated at the same time. For example, if there is already a unit with name `A` and type `A`, creating another unit with name `A` and type `A` will fail',
        ),
    }),
  },
};
export const contactV3UnitDelete = {
  project: 'contact',
  name: 'contact.v3.unit.delete',
  sdkName: 'contact.v3.unit.delete',
  path: '/open-apis/contact/v3/unit/:unit_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Contacts-Unit-Delete units-Call this interface to delete the specified unit',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      unit_id: z
        .string()
        .describe(
          'Unit ID.When you create a unit, you can get the unit ID in the returned result. You can also call the [Get Unit List] interface to get the unit ID',
        ),
    }),
  },
};
export const contactV3UnitGet = {
  project: 'contact',
  name: 'contact.v3.unit.get',
  sdkName: 'contact.v3.unit.get',
  path: '/open-apis/contact/v3/unit/:unit_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Unit-Obtain unit information-Call this interface to obtain the information of the specified unit, including unit ID, name, and type',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      unit_id: z
        .string()
        .describe(
          'Unit ID.When you create a unit, you can get the unit ID in the returned result. You can also call the [Get Unit List] interface to get the unit ID',
        ),
    }),
  },
};
export const contactV3UnitList = {
  project: 'contact',
  name: 'contact.v3.unit.list',
  sdkName: 'contact.v3.unit.list',
  path: '/open-apis/contact/v3/unit',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Unit-List units-Call this interface to obtain the unit list in the current tenant. The list mainly contains the ID, name, and type information of each unit',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z
          .number()
          .describe('The paging size is used to limit the number of data items returned in one request')
          .optional(),
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
export const contactV3UnitListDepartment = {
  project: 'contact',
  name: 'contact.v3.unit.listDepartment',
  sdkName: 'contact.v3.unit.listDepartment',
  path: '/open-apis/contact/v3/unit/list_department',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-Unit-List of departments bound to the unit-Call this interface to obtain the department list bound to the specified unit',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      unit_id: z
        .string()
        .describe(
          'Unit ID.When you create a unit, you can get the unit ID in the returned result. You can also call the [Get Unit List] interface to get the unit ID',
        ),
      department_id_type: z
        .enum(['department_id', 'open_department_id'])
        .describe(
          'The department ID type in this call. For a detailed description of department IDs, see [Department ID Description]. Options:department_id(Supports user-defined department ID. When customizing the configuration, the deleted department_id can be reused, so the department_id is unique within the scope of the non-deleted department.),open_department_id(The department ID is automatically generated by the system. The ID prefix is ​​fixed as `od-` and is globally unique within the tenant.)',
        )
        .optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z
        .number()
        .describe('The paging size is used to limit the number of data items returned in one request')
        .optional(),
    }),
  },
};
export const contactV3UnitPatch = {
  project: 'contact',
  name: 'contact.v3.unit.patch',
  sdkName: 'contact.v3.unit.patch',
  path: '/open-apis/contact/v3/unit/:unit_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Contacts-Unit-Modify unit information-Call this interface to modify the name of the specified unit',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        name: z
          .string()
          .describe(
            'Unit name.**Data validation rules**: 1 to 100 characters.**Note**: - This parameter is required when requesting, please ignore **No** in **Required** column.- Under the same unit type, the set unit name cannot be repeated',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      unit_id: z
        .string()
        .describe(
          'Unit ID.When you create a unit, you can get the unit ID in the returned result. You can also call the [Get Unit List] interface to get the unit ID',
        ),
    }),
  },
};
export const contactV3UnitUnbindDepartment = {
  project: 'contact',
  name: 'contact.v3.unit.unbindDepartment',
  sdkName: 'contact.v3.unit.unbindDepartment',
  path: '/open-apis/contact/v3/unit/unbind_department',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-Unit-Dissociate a department with a unit-Call this interface to release the binding relationship between a department and an organization',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      unit_id: z
        .string()
        .describe(
          'Unit ID.When you create a unit, you can get the unit ID in the returned result. You can also call the [Get Unit List] interface to get the unit ID',
        ),
      department_id: z
        .string()
        .describe(
          'The ID of the department to be disassociated. The ID type is consistent with the value of department_id_type.The department API provides multiple ways to obtain department IDs, such as [Get child department list], [Get parent department information], [Search department]. You can choose the appropriate API to query',
        ),
      department_id_type: z
        .enum(['department_id', 'open_department_id'])
        .describe(
          'The department ID type in this call. For a detailed description of department IDs, see [Department ID Description]. Options:department_id(Supports user-defined department ID. When customizing the configuration, the deleted department_id can be reused, so the department_id is unique within the scope of the non-deleted department.),open_department_id(The department ID is automatically generated by the system. The ID prefix is ​​fixed as `od-` and is globally unique within the tenant.)',
        )
        .optional(),
    }),
  },
};
export const contactV3UserBatch = {
  project: 'contact',
  name: 'contact.v3.user.batch',
  sdkName: 'contact.v3.user.batch',
  path: '/open-apis/contact/v3/users/batch',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Contacts-User-Obtain multiple users' information-Call this interface to obtain the information of one or more users in the address book, including user ID, name, email, mobile phone number, status, department and other information",
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      user_ids: z
        .array(z.string())
        .describe(
          'User ID. The ID type is consistent with the query parameter `user_id_type`. For how to obtain user ID, please refer to [How to obtain different user IDs].If you need to query multiple user IDs at one time, you can pass the same parameter name multiple times, and pass different parameter values each time. For example:`https://{url}?user_ids={user_id1}&user_ids={user_id2}`.**illustrate**:- The maximum number of user IDs that can be set in a single request is 50.- `user_ids` in the above example is the parameter name and can be passed multiple times. `{user_id1}` and `{user_id2}` are the parameter values passed in each time',
        ),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id'])
        .describe(
          'Specifies the type of department ID in query results. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.),department_id(Supports user-defined configured department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.)',
        )
        .optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const contactV3UserBatchGetId = {
  project: 'contact',
  name: 'contact.v3.user.batchGetId',
  sdkName: 'contact.v3.user.batchGetId',
  path: '/open-apis/contact/v3/users/batch_get_id',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-User-Obtain user ID via email or mobile number-Call this interface to obtain the ID (including user_id, open_id, union_id) and status information of one or more users through their mobile phone number or email address',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        emails: z
          .array(z.string())
          .describe(
            "Up to 50 user emails can be input to be queried.**Notice**:- Business email is not supported.- The two parameters emails and mobiles are independent of each other, that is, each user's email will return the corresponding user information, and each mobile phone number will also return the corresponding user information.- The number of user IDs returned by this interface is the sum of the number of emails and the number of mobiles.**Default**: empty",
          )
          .optional(),
        mobiles: z
          .array(z.string())
          .describe(
            'You can input up to 50 user mobile phone numbers to be queried.**Notice**:- Mobile phone numbers outside of mainland China need to add a country or region code starting with "+".- The two parameters emails and mobiles are independent of each other, that is, each user\'s email will return the corresponding user information, and each mobile phone number will also return the corresponding user information.- The number of user IDs returned by this interface is the sum of the number of emails and the number of mobiles.**Default**: empty',
          )
          .optional(),
        include_resigned: z
          .boolean()
          .describe(
            'Check whether the query results contain user information of resigned employees.**Optional values are**:- true- false',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const contactV3UserCreate = {
  project: 'contact',
  name: 'contact.v3.user.create',
  sdkName: 'contact.v3.user.create',
  path: '/open-apis/contact/v3/users',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-User-Create a user-Call this interface to create a user in the Contacts (this action can be understood as employee onboarding). After the user is successfully created, the system will send an invitation to the user in the form of a text message or email. The user can only visit the company or team after agreeing to the invitation',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z
        .string()
        .describe(
          "Custom user's user_id. Length cannot exceed 64 characters.user_id is the user's unique identifier within the current tenant. Please ensure uniqueness when customizing.**Default value**: empty, which means a user_id is randomly generated by the system",
        )
        .optional(),
      name: z.string().describe('User name. Length cannot exceed 255 characters'),
      en_name: z
        .string()
        .describe('English name. Length cannot exceed 255 characters.**Default value**: empty')
        .optional(),
      nickname: z.string().describe('Alias. Length cannot exceed 255 characters.**Default value**: empty').optional(),
      email: z
        .string()
        .describe(
          'Email address. **Notice**:- Non +86 mobile number members must also add an email address.- Email cannot be repeated.- Email address cannot be duplicated under the current tenant.**Default value**: empty',
        )
        .optional(),
      mobile: z
        .string()
        .describe(
          'Mobile number.**Notice**:- Under the current tenant, mobile phone numbers cannot be repeated.- Uncertified companies can only add mainland Chinese mobile phone numbers; companies certified by Feishu are allowed to add overseas mobile phone numbers.- The prefix of the international calling code must contain the plus sign **+**.Value examples:- Mainland China mobile phone number: 13011111111 or +8613011111111- Non-Mainland China mobile phone number: +41446681800',
        ),
      mobile_visible: z
        .boolean()
        .describe(
          "Whether the mobile number is visible.**Optional values are**:- true: visible.- false: invisible. When invisible, employees within the enterprise will not be able to view the user's mobile number.**Default value**: true",
        )
        .optional(),
      gender: z.number().describe('Gender. Options:0(unkown Unknown),1(male),2(female),3(others Other)').optional(),
      avatar_key: z
        .string()
        .describe(
          'The file key of the avatar. You can upload and obtain the avatar file Key through the [Upload Image] interface. When uploading, you need to select for setting avatar as the picture type**Default value**: empty',
        )
        .optional(),
      department_ids: z
        .array(z.string())
        .describe(
          'List of IDs of departments to which the user belongs.- A user can belong to multiple departments. Up to 50 departments can be set up.- The department ID type is consistent with the query parameter `department_id_type`.- You can call the [Search Department] interface to obtain the corresponding department ID through the department name keyword',
        ),
      leader_user_id: z
        .string()
        .describe(
          "The user ID of the user's direct supervisor, the ID type is consistent with the query parameter `user_id_type`. For how to obtain user ID, please refer to [How to obtain different user IDs].**Default value**: empty",
        )
        .optional(),
      city: z
        .string()
        .describe(
          'Work city. The maximum character length is 100.- You can call the [Get tenant work city list] interface to obtain the existing work city names in the current tenant.- If the working city name you pass in does not exist, the system will automatically generate the working city. The maximum number of enumeration values ​​for working cities is 10,000.**Default value**: empty',
        )
        .optional(),
      country: z
        .string()
        .describe(
          'Country or region code. Refer to the [list of country/region codes] for details.**Default value**: empty',
        )
        .optional(),
      work_station: z
        .string()
        .describe('Seat ID. The maximum character length is 255.**Default value**: empty')
        .optional(),
      join_time: z
        .number()
        .describe(
          'Entry Time. Second-level timestamp format, representing the number of seconds that have elapsed since January 1, 1970. If this parameter is not passed in, the time of the current request will be filled in by default',
        )
        .optional(),
      employee_no: z
        .string()
        .describe(
          'Employee ID. The maximum character length is 255.**Notice**: Under the same tenant, employee IDs cannot be repeated.**Default**: empty',
        )
        .optional(),
      employee_type: z
        .number()
        .describe(
          "Employee type. **Optional values are**:- 1: Regular- 2: Intern- 3: Outsourcing- 4: Contractor- 5: Consultant This parameter supports reading int values of custom employee types. You can obtain the number value (enum_value) of the tenant's custom employee type through the [Get Personnel Type] interface",
        ),
      orders: z
        .array(
          z.object({
            department_id: z
              .string()
              .describe(
                'The department ID corresponding to the sorting information. Indicates the department that the user is in and needs to be sorted.**Notice**:- The department ID type is consistent with the query parameter department_id_type.- The department ID passed in this parameter must be in the department ID list (department_ids parameter) to which the user belongs.- If no value is passed, the system will pass the department IDs in the department_ids parameter to the department_id parameter of order in sequence by default',
              )
              .optional(),
            user_order: z
              .number()
              .describe(
                "The user's ranking in their direct department. A larger value indicates a higher ranking.**Note**: This parameter is of int type and its value cannot exceed the maximum value of int.**Default value**: 0",
              )
              .optional(),
            department_order: z
              .number()
              .describe(
                "Ranking of the user's departments. A larger value indicates a higher ranking.**Note**: This parameter is of int type and its value cannot exceed the maximum value of int.**Default value**: 0",
              )
              .optional(),
            is_primary_dept: z
              .boolean()
              .describe(
                "Identifies the user's unique main department. The main department is the department that ranks first among the user's departments (department_order is the max).**Optional values are**:- true- false**Default value**: If the current department_id is the first data passed in department_ids, the default value is true, otherwise it is false",
              )
              .optional(),
          }),
        )
        .describe(
          'User sorted information list. This parameter is used to mark the order of personnel in the organizational structure of the address book. Personnel may exist in multiple departments and have different orders',
        )
        .optional(),
      custom_attrs: z
        .array(
          z.object({
            type: z
              .string()
              .describe(
                'Custom field type.**Optional values are**:- TEXT: Text- HREF: Webpage- ENUMERATION: Enumeration- PICTURE_ENUM: Image- GENERIC_USER: User',
              )
              .optional(),
            id: z.string().describe('Custom field ID').optional(),
            value: z
              .object({
                text: z
                  .string()
                  .describe(
                    '- When the field type is `TEXT`, this parameter defines the field value and is required.- When the field type is `HREF`, this parameter defines the webpage title and is required.Cannot exceed 100 characters in length',
                  )
                  .optional(),
                url: z
                  .string()
                  .describe(
                    'When the field type is `HREF`, this parameter defines the default URL and required, such as mobile phone jump to applet, PC jump to webpage.**Note**: Please start with http:// or https://',
                  )
                  .optional(),
                pc_url: z
                  .string()
                  .describe(
                    'When the field type is `HREF`, this parameter defines URL on the PC.**Note**: Please start with http:// or https://',
                  )
                  .optional(),
                option_id: z
                  .string()
                  .describe(
                    'This parameter is used to define the option ID when the custom field type is `ENUMERATION` or `PICTURE_ENUM`.You can call the [Get enterprise custom user fields] interface to obtain the corresponding option ID of the custom field',
                  )
                  .optional(),
                generic_user: z
                  .object({
                    id: z
                      .string()
                      .describe(
                        'The user ID of the referrer.- The ID type is consistent with the query parameter `user_id_type`.- For how to obtain the user ID, please refer to [How to obtain different user IDs]',
                      ),
                    type: z
                      .number()
                      .describe(
                        'User type.**Optional values are**:1: User**Note**: Currently only the value 1 is supported, which means user',
                      ),
                  })
                  .describe('When the field type is `GENERIC_USER`, this parameter defines the user referenced')
                  .optional(),
              })
              .describe('Custom field value')
              .optional(),
          }),
        )
        .describe(
          'Custom fields. Before setting parameters, it is recommended that you first understand [Custom field resource introduction].**Note**: This field will only take effect when the enterprise administrator configures a custom field in the management background and turns on the **Allow Open Platform API Call** function.**Default value**: empty. If no custom fields are set, there is no need to pass in a value',
        )
        .optional(),
      enterprise_email: z
        .string()
        .describe(
          'Business email. **Note**: This parameter will only take effect after the enterprise administrator enables the Feishu email service in the management background. If setting up a corporate email fails, please contact the corporate administrator to confirm whether the corresponding corporate email domain name is enabled in the management background.**Default value**: empty',
        )
        .optional(),
      job_title: z
        .string()
        .describe(
          'Job title. The maximum number of characters is 255.- You can call the [Get tenant job title list] interface to obtain the corresponding tenant name.- If the job title passed in does not exist, the system will automatically create and use the job title. The maximum number of job title enumeration values ​​is 10,000.**Default value**: empty',
        )
        .optional(),
      geo: z
        .string()
        .describe(
          'geo.**Notice**: You need to contact the service desk for technical support to activate it.**Default**: empty',
        )
        .optional(),
      job_level_id: z
        .string()
        .describe(
          'Job level. You can call the [Get tenant job level list] interface to query the corresponding job level.**Default**: empty',
        )
        .optional(),
      job_family_id: z
        .string()
        .describe(
          'Job family. You can call the [Get tenant job family list] interface to query the corresponding job family.**Default**: empty',
        )
        .optional(),
      subscription_ids: z
        .array(z.string())
        .describe(
          'List of seat IDs assigned to the user.**Precautions**:- This field requires the **Assign User Seatst** permission.- If you purchased a seat, you must assign a seat ID to the user when creating the user, otherwise the user will not be able to log in to Feishu Enterprise. For more information, please see [Administrator allocation of seats].- You can obtain the available seat ID of the current tenant through the [Get Enterprise Seat Information] interface.**Default**: empty',
        )
        .optional(),
      dotted_line_leader_user_ids: z
        .array(z.string())
        .describe(
          'List of user IDs for dotted superiors.- The ID type is consistent with the query parameter `user_id_type`.- For how to obtain the user ID, please refer to [How to obtain different user IDs].**Default**: empty',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:department_id(Supports user-defined configured department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
        client_token: z
          .string()
          .describe(
            'Used for idempotency judgment to determine whether it is the same request to avoid duplicate creation. Please refer to the parameter example value and pass in a customized client_token.**Default value**: empty, indicating no idempotency judgment',
          )
          .optional(),
      })
      .optional(),
  },
};
export const contactV3UserDelete = {
  project: 'contact',
  name: 'contact.v3.user.delete',
  sdkName: 'contact.v3.user.delete',
  path: '/open-apis/contact/v3/users/:user_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Contacts-User-Delete a user-This API is used to delete a user from Contacts when an employee is terminated. When deleting, you can set the transfer object of user data through request parameters',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        department_chat_acceptor_user_id: z
          .string()
          .describe(
            'The user ID of the department group recipient. When the deleted user is the group owner of a department group, the group owner will be transferred to the designated recipient.**Notice**:- The ID type needs to be consistent with the user_id_type type in the query parameter. For how to obtain user ID, please refer to [How to obtain different user IDs].- When this parameter is not specified, if the deleted user is the group owner of a department group, the group owner will be transferred to the first person in the group to join the group by default',
          )
          .optional(),
        external_chat_acceptor_user_id: z
          .string()
          .describe(
            'The user ID of the external group recipient. When the deleted user is the owner of an external group, the group owner will be transferred to the designated recipient.**Notice**:- The ID type needs to be consistent with the user_id_type type in the query parameter. For how to obtain user ID, please refer to [How to obtain different user IDs].- When this parameter is not specified, if the deleted user is the owner of an external group, the group owner will be transferred to the first person in the group who is in the same organization as the deleted user by default. If only the deleted user is in the group within the organization, the external group will be disbanded',
          )
          .optional(),
        docs_acceptor_user_id: z
          .string()
          .describe(
            'The user ID of the recipient of the document. When a user is deleted, the documents they own are transferred to the recipient.**Notice**:- The ID type needs to be consistent with the user_id_type type in the query parameter. For how to obtain user ID, please refer to [How to obtain different user IDs].- If no recipient is specified, it will be transferred to the immediate superior of the deleted user by default. If the deleted user has no immediate superior, the document resources will remain under the user name.- After the document is transferred, only the document owner is changed, and other permissions are not affected',
          )
          .optional(),
        calendar_acceptor_user_id: z
          .string()
          .describe(
            'The user ID of the schedule recipient. When a user is deleted, the schedules they own are transferred to the recipient.**Notice**:- The ID type needs to be consistent with the user_id_type type in the query parameter. For how to obtain user ID, please refer to [How to obtain different user IDs].- If no recipient is specified, it will be transferred to the immediate superior of the deleted user by default. If the deleted user has no immediate superior, the schedule resource will be deleted directly',
          )
          .optional(),
        application_acceptor_user_id: z
          .string()
          .describe(
            'The user ID of the recipient of the application. When a user is deleted, the applications they created are transferred to the recipient.**Notice**:- The ID type needs to be consistent with the user_id_type type in the query parameter. For how to obtain user ID, please refer to [How to obtain different user IDs].- If no recipient is specified, it will be transferred to the immediate superior of the deleted user by default. If the deleted user has no immediate superior, the application will remain under the user name, but the user will not be able to log in to the developer backend for application management. Enterprise administrators can manually transfer applications to others in the management background',
          )
          .optional(),
        minutes_acceptor_user_id: z
          .string()
          .describe(
            "Minute recipient's user ID. When a user is deleted, the Minute resources they own are transferred to the recipient.**Notice**:- The ID type needs to be consistent with the user_id_type type in the query parameter. For how to obtain user ID, please refer to [How to obtain different user IDs].- If no recipient is specified, it will be transferred to the immediate superior of the deleted user by default. If the deleted user has no immediate superior, Minute will remain under the user name.- After the Minute is transferred, only the Minute owner is changed, and the shared Minute link is not affected",
          )
          .optional(),
        survey_acceptor_user_id: z
          .string()
          .describe(
            'The user ID of the survey recipient. When a user is deleted, the Survey resources they own are transferred to the recipient.**Notice**:- The ID type needs to be consistent with the user_id_type type in the query parameter. For how to obtain user ID, please refer to [How to obtain different user IDs].- If no recipient is specified, it will be transferred to the immediate superior of the deleted user by default. If the deleted user has no immediate superior, the Survey resource will be deleted directly',
          )
          .optional(),
        email_acceptor: z
          .object({
            processing_type: z
              .enum(['1', '2', '3'])
              .describe(
                'Resource processing type. Options:1(Transfer Transfer Resource),2(Retain Retain Resource),3(Delete Delete Resource)',
              ),
            acceptor_user_id: z
              .string()
              .describe(
                'The user ID of the recipient of the mail resource. The ID type needs to be consistent with the user_id_type type in the query parameter. For how to obtain user ID, please refer to [How to obtain different user IDs].**Note**: This parameter value needs to be set only when the value of `processing_type` is `1`',
              )
              .optional(),
          })
          .describe(
            "User email resource processing method.This parameter is optional. If no value is passed, the email resources will be transferred to the deleted user's immediate superior by default. If the deleted user has no immediate superior, the email resources will be retained under the user's name",
          )
          .optional(),
        anycross_acceptor_user_id: z
          .string()
          .describe(
            "The user ID of the recipient of the user integration platform resources.** Attention: **- The ID type needs to be consistent with the user_id_type type in the query parameters. For how to obtain user ID, please refer to [How to obtain different user IDs].- If the recipient is not specified, it will be transferred to the deleted user's direct manager by default. If the deleted user does not have a direct manager, the application will remain under the user's name, but the user cannot log in to the Feishu integration platform. Enterprise administrators can manually transfer applications to others in the administrative background",
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      user_id: z
        .string()
        .describe(
          'User ID, which must match the user_id_type in the query parameter. For how to obtain user ID, please refer to [How to obtain different user IDs]',
        ),
    }),
  },
};
export const contactV3UserFindByDepartment = {
  project: 'contact',
  name: 'contact.v3.user.findByDepartment',
  sdkName: 'contact.v3.user.findByDepartment',
  path: '/open-apis/contact/v3/users/find_by_department',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Contacts-User-Obtain the list of users directly under a department-Call this interface to obtain the user information list directly under the specified department. User information includes user ID, name, email, mobile phone number, status and other information',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['department_id', 'open_department_id'])
        .describe(
          'The type of department ID used in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:department_id(Supports user-defined configured department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to `od-` and is globally unique within the tenant.)',
        )
        .optional(),
      department_id: z
        .string()
        .describe(
          'Department ID, ID type is consistent with the value of department_id_type.**Note**:- The root department has a department ID of 0.- You can call the [Search Department] interface to obtain the corresponding department ID through the department name keyword',
        ),
      page_size: z
        .number()
        .describe(
          'Paging size, that is, the maximum number of entries in the user information list returned by this request',
        )
        .optional(),
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
export const contactV3UserGet = {
  project: 'contact',
  name: 'contact.v3.user.get',
  sdkName: 'contact.v3.user.get',
  path: '/open-apis/contact/v3/users/:user_id',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Contacts-User-Obtain single user's information-Call this interface to obtain the information of a user in the address book, including user ID, name, email, mobile phone number, status, department and other information",
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Specifies the type of department ID in query results. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:department_id(Supports user-defined configured department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to od- and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      user_id: z.string().describe('User ID. The ID type is consistent with the query parameter `user_id_type`'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const contactV3UserList = {
  project: 'contact',
  name: 'contact.v3.user.list',
  sdkName: 'contact.v3.user.list',
  path: '/open-apis/contact/v3/users',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Contact-User-Get User List-Obtain the list of users directly under the department based on the department ID.[FAQs]',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Type of department ID used in this call Options:department_id(Identify the department with the custom department_id),open_department_id(Identify the department with open_department_id)',
          )
          .optional(),
        department_id: z
          .string()
          .describe('Filling in this field indicates obtaining all users under the department (optional)')
          .optional(),
        page_token: z.string().optional(),
        page_size: z.number().optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const contactV3UserPatch = {
  project: 'contact',
  name: 'contact.v3.user.patch',
  sdkName: 'contact.v3.user.patch',
  path: '/open-apis/contact/v3/users/:user_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Contacts-User-Modify user information in part-Call this interface to update the information of the specified user in the address book, including name, email, mobile phone number, department, and custom fields',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        name: z.string().describe('User name. Length cannot exceed 255 characters').optional(),
        en_name: z.string().describe('English name. Length cannot exceed 255 characters').optional(),
        nickname: z.string().describe('Alias. Length cannot exceed 255 characters').optional(),
        email: z
          .string()
          .describe(
            'Email Address. **Notice**:- When setting a mobile phone number outside of mainland China, an email address must be set at the same time.- Under the current tenant, the mailbox cannot be duplicated',
          )
          .optional(),
        mobile: z
          .string()
          .describe(
            'Phone number.**Notice**:- Under the current tenant, mobile phone numbers cannot be repeated.- Uncertified companies can only add mainland Chinese mobile phone numbers companies certified by Feishu are allowed to add overseas mobile phone numbers.- The prefix of the international calling code must contain the plus sign **+**.Value examples:- Mainland China mobile phone number: 13011111111 or +8613011111111- Non-Mainland China mobile phone number: +41446681800',
          )
          .optional(),
        mobile_visible: z
          .boolean()
          .describe(
            "Whether the mobile phone number is visible.**Optional values are**:- true: visible.- false: invisible. When invisible, employees within the enterprise will not be able to view the user's mobile phone number",
          )
          .optional(),
        gender: z.number().describe('Gender Options:0(unkown Unknown),1(male),2(female),3(others Other)').optional(),
        avatar_key: z
          .string()
          .describe(
            'The file key of the avatar. You can upload and obtain the avatar file Key through the [Upload Image] interface. When uploading, you need to select for setting avatar as the picture type',
          )
          .optional(),
        department_ids: z
          .array(z.string())
          .describe(
            'List of IDs of departments to which the user belongs.- A user can belong to multiple departments. Can belong to up to 50 departments.- The department ID type is consistent with the value of the query parameter `department_id_type`.- You can call the [Search Department] interface to obtain the corresponding department ID through the department name keyword',
          )
          .optional(),
        leader_user_id: z
          .string()
          .describe(
            "The user ID of the user's direct supervisor, the ID type is consistent with the value of the query parameter `user_id_type`. For how to obtain user ID, please refer to [How to obtain different user IDs]",
          )
          .optional(),
        city: z
          .string()
          .describe(
            'Work city. The maximum character length is 100.- Call [Get tenant work city list] to get the list of existing work cities in the current tenant.- If the work city name you pass in does not exist, the system will automatically generate the work city. The maximum number of enumeration values ​​for working cities is 10,000',
          )
          .optional(),
        country: z
          .string()
          .describe('Country or region code. Refer to the [list of country/region codes] for details')
          .optional(),
        work_station: z.string().describe('Seat ID. The maximum character length is 255').optional(),
        join_time: z.number().describe('Entry time, in timestamp format, in seconds since January 1, 1970').optional(),
        employee_no: z.string().describe('Employee ID. The maximum character length is 255').optional(),
        employee_type: z
          .number()
          .describe(
            'Employee type. Optional values are:- `1`: Regular- `2`: Intern- `3`: Outsourcing- `4`: Contractor- `5`: Consultant The int value of the custom employee type can also be read, and the name of the custom employee type for the tenant can be obtained through the API: [Obtain workforce type]',
          )
          .optional(),
        orders: z
          .array(
            z.object({
              department_id: z
                .string()
                .describe(
                  'The department ID corresponding to the sorted information. Indicates the department where the user is located and needs to be sorted.**Notice**:- The department ID passed in by this parameter must be in the list of department IDs to which the user belongs (department_ids parameter).- The department ID type is consistent with the value of the query parameter department_id_type',
                )
                .optional(),
              user_order: z
                .number()
                .describe(
                  "The user's ranking in their direct department. A larger value indicates a higher ranking.**Notice**: This parameter is of int type and its value cannot exceed the maximum value of int",
                )
                .optional(),
              department_order: z
                .number()
                .describe(
                  "Ranking of the user's departments. A larger value indicates a higher ranking.**Notice**: This parameter is of int type and its value cannot exceed the maximum value of int",
                )
                .optional(),
              is_primary_dept: z
                .boolean()
                .describe(
                  "Identifies whether it is the user's only primary department. The primary department is the first-ranked department among the departments to which the user belongs (department_order is the largest).**Optional values are**:- true: yes- false: no",
                )
                .optional(),
            }),
          )
          .describe(
            'User sorting information . Indicating the order of personnel in the organizational structure. Personnel may exist in multiple departments and have different orders',
          )
          .optional(),
        custom_attrs: z
          .array(
            z.object({
              type: z
                .string()
                .describe(
                  'Custom field type - `TEXT`: Text- `HREF`: Webpage- `ENUMERATION`: Enumeration- `PICTURE_ENUM`: Image- `GENERIC_USER`: User',
                )
                .optional(),
              id: z.string().describe('Custom field ID').optional(),
              value: z
                .object({
                  text: z
                    .string()
                    .describe(
                      '- When the field type is TEXT, this parameter defines the field value and is required.- When the field type is HREF, this parameter defines the title of the web page and is required.Cannot exceed 100 characters in length',
                    )
                    .optional(),
                  url: z
                    .string()
                    .describe(
                      'When the field type is HREF, this parameter defines the default URL. , such as mobile phone jump to applet, PC jump to webpage',
                    )
                    .optional(),
                  pc_url: z
                    .string()
                    .describe('When the field type is HREF, this parameter defines URL on the PC')
                    .optional(),
                  option_id: z
                    .string()
                    .describe(
                      'When the field type is ENUMERATION or PICTURE_ENUM, this parameter defines the option ID',
                    )
                    .optional(),
                  generic_user: z
                    .object({
                      id: z
                        .string()
                        .describe(
                          'The user ID of the referrer.- The personnel ID involved in the custom field only supports the identifier in the user_id format, and this restriction is not affected by the value of user_id_type in the query parameters. - For how to obtain the user ID, please refer to [How to obtain different user IDs]',
                        ),
                      type: z
                        .number()
                        .describe(
                          'user type.**Optional values are**:1: User**Note**: Currently only the value 1 is supported, which means user',
                        ),
                    })
                    .describe('When the field type is GENERIC_USER, this parameter defines the referencing person')
                    .optional(),
                })
                .describe('Custom field value')
                .optional(),
            }),
          )
          .describe(
            'Custom fields. Before setting parameters, it is recommended that you first understand [Custom field resource introduction].**Note**: This field will only take effect when the enterprise administrator configures a custom field in the management background and turns on the **Allow Open Platform API Call** function',
          )
          .optional(),
        enterprise_email: z
          .string()
          .describe(
            'Business email. **Note**: This parameter will only take effect after the enterprise administrator enables the Feishu email service in the management background. If setting up a corporate email fails, please contact the corporate administrator to confirm whether the corresponding corporate email domain name is enabled in the management background',
          )
          .optional(),
        job_title: z
          .string()
          .describe(
            'Job title. The maximum number of characters is 255.- You can call the [Get tenant job title list] interface to obtain the corresponding tenant name.- If the job title passed in does not exist, the system will automatically create and use the job title. The maximum number of job title enumeration values ​​is 10,000',
          )
          .optional(),
        is_frozen: z
          .boolean()
          .describe('Whether it is a suspended user.**Optional values are**:- true: yes- false: no')
          .optional(),
        job_level_id: z
          .string()
          .describe(
            'Job level ID. You can call the [Get tenant job level list] interface to query the corresponding job level ID',
          )
          .optional(),
        job_family_id: z
          .string()
          .describe(
            'Job family ID. You can call the [Get tenant job family list] interface to query the corresponding job family ID',
          )
          .optional(),
        subscription_ids: z
          .array(z.string())
          .describe(
            'List of seat IDs assigned to the user.**Precautions**:- This field requires the **Assign seat for user** permission.- You can obtain the available seat ID of the current tenant through the [Get enterprise seat information] interface',
          )
          .optional(),
        dotted_line_leader_user_ids: z
          .array(z.string())
          .describe(
            'List of user IDs for dotted superiors.- The ID type is consistent with the value of the query parameter `user_id_type`.- For how to obtain the user ID, please refer to [How to obtain different user IDs]',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:department_id(Supports user-defined configured department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to od- and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      user_id: z
        .string()
        .describe('User ID. The ID type must be consistent with the user_id_type type in the query parameter'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const contactV3UserResurrect = {
  project: 'contact',
  name: 'contact.v3.user.resurrect',
  sdkName: 'contact.v3.user.resurrect',
  path: '/open-apis/contact/v3/users/:user_id/resurrect',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Contacts-User-Restore deleted users-This interface is used to restore deleted users (resigned members)',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        departments: z
          .array(
            z.object({
              department_id: z
                .string()
                .describe(
                  'The department ID corresponding to the sorted information. Indicates the department where the user is located and needs to be sorted. The department ID type is consistent with the query parameter `department_id_type`.To learn about the different types of department IDs and how to obtain department IDs, see [Department ID Description]',
                ),
              user_order: z
                .number()
                .describe(
                  'The ranking of users within their immediate departments. The larger the value, the higher the ranking',
                )
                .optional(),
              department_order: z
                .number()
                .describe(
                  'Sorting between multiple departments to which a user belongs. The larger the value, the higher the ranking',
                )
                .optional(),
            }),
          )
          .describe(
            'User sorting information. Users may exist in multiple departments and have different sortings. This parameter is used to set the sorting of user departments.**Note**: If the departments parameter is not provided in the request, the user will be moved back to the root department',
          )
          .optional(),
        subscription_ids: z
          .array(z.string())
          .describe(
            'If the user was assigned a [seat] in normal status, this parameter can be used to specify the seat ID assigned post-recovery. For information on how to obtain the assigned seat ID, refer to the [Get Enterprise Seat Information API].**Notice**:- This field requires the **Assign seat for user** permission',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call. For a detailed introduction to department ID, please refer to [Department ID Description]. Options:department_id(Supports user-defined configured department IDs. The deleted department_id can be reused when customizing the configuration, so department_id is unique within the scope of the department that has not been deleted.),open_department_id(Department ID automatically generated by the system. The ID prefix is fixed to od- and is globally unique within the tenant.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      user_id: z
        .string()
        .describe(
          'User ID. The ID type needs to be consistent with the user_id_type type in the query parameter. For how to obtain user ID, please refer to [How to obtain different user IDs]',
        ),
    }),
  },
};
export const contactV3UserUpdate = {
  project: 'contact',
  name: 'contact.v3.user.update',
  sdkName: 'contact.v3.user.update',
  path: '/open-apis/contact/v3/users/:user_id',
  httpMethod: 'PUT',
  description:
    "[Feishu/Lark]-Deprecated Version (Not Recommended)-Contact-User-Update user information in whole-This API is used to update a user's fields in Contacts",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z.string().describe('User name'),
      en_name: z.string().describe('English name').optional(),
      nickname: z.string().describe('Alias').optional(),
      email: z
        .string()
        .describe(
          'Email Address. Note that1. non +86 mobile number members must also add an email address2. Email cannot be repeated',
        )
        .optional(),
      mobile: z
        .string()
        .describe(
          '1. The mobile number cannot be repeated within the organization. 2. Uncertified enterprises only support adding mobile numbers in mainland China. Enterprises certified by Feishu are allowed to add overseas mobile numbers. 3. The area code must contain the plus sign +.4. This mobile field is not required in the overseas version of Feishu',
        ),
      mobile_visible: z
        .boolean()
        .describe(
          "Visibility of mobile number. true: visible (default), false: invisible. If it is set to false, the employee's mobile number will be invisible to other company members",
        )
        .optional(),
      gender: z.number().describe('Gender Options:0(unkown Unknown),1(male),2(female)').optional(),
      avatar_key: z
        .string()
        .describe(
          'File key of the profile photo. You can upload an image by calling the "Upload Image" API in "Messenger > Message > Images" to obtain the file key.The document refer to [upload images]',
        )
        .optional(),
      department_ids: z
        .array(z.string())
        .describe(
          "List of IDs of the user's departments. A user can belong to multiple departments.The ID value matches the department_id_type in the query parameter.For information about different IDs, see [Department IDs]",
        ),
      leader_user_id: z
        .string()
        .describe(
          "User ID of the user's direct manager. The ID value matches the user_id_type in the query parameter.For information about different IDs, see [User-related IDs]",
        )
        .optional(),
      city: z.string().describe('work city').optional(),
      country: z
        .string()
        .describe('Country or region code. Refer to the [list of country/region codes] for details')
        .optional(),
      work_station: z.string().describe('Seat ID').optional(),
      join_time: z.number().describe('Entry time, in timestamp format, in seconds since January 1, 1970').optional(),
      employee_no: z.string().describe('Employee ID').optional(),
      employee_type: z
        .number()
        .describe(
          'Employee type. Optional values are:- `1`: Regular- `2`: Intern- `3`: Outsourcing- `4`: Contractor- `5`: Consultant The int value of the custom employee type can also be read, and the name of the custom employee type for the tenant can be obtained through the API: [Obtain workforce type]',
        ),
      orders: z
        .array(
          z.object({
            department_id: z
              .string()
              .describe(
                'Department ID for the sorting information. The ID value matches the department_id_type in the query parameter.For information about different IDs, see [Department IDs]',
              )
              .optional(),
            user_order: z
              .number()
              .describe("The user's ranking in their direct department. A larger value indicates a higher ranking")
              .optional(),
            department_order: z
              .number()
              .describe("Ranking of the user's departments. A larger value indicates a higher ranking")
              .optional(),
            is_primary_dept: z
              .boolean()
              .describe(
                "Identifies the user's unique main department. The main department is the department that ranks first among the user's departments (department_order is the max)",
              )
              .optional(),
          }),
        )
        .describe(
          'User sorting information .Indicating the order of personnel in the organizational structure. Personnel may exist in multiple departments and have different orders',
        )
        .optional(),
      custom_attrs: z
        .array(
          z.object({
            type: z
              .string()
              .describe(
                'Custom field type - `TEXT`: Text- `HREF`: Webpage- `ENUMERATION`: Enumeration- `PICTURE_ENUM`: Image- `GENERIC_USER`: User[FAQs about custom fields]',
              )
              .optional(),
            id: z.string().describe('Custom field ID').optional(),
            value: z
              .object({
                text: z
                  .string()
                  .describe(
                    'When the field type is `TEXT`, this parameter defines the field value and is required; when the field type is `HREF`, this parameter defines the webpage title and is required',
                  )
                  .optional(),
                url: z
                  .string()
                  .describe(
                    'When the field type is HREF, this parameter defines the default URL. , such as mobile phone jump to applet, PC jump to webpage',
                  )
                  .optional(),
                pc_url: z
                  .string()
                  .describe('When the field type is HREF, this parameter defines URL on the PC')
                  .optional(),
                option_id: z
                  .string()
                  .describe(
                    'When the field type is ENUMERATION or PICTURE_ENUM, this parameter defines the option value',
                  )
                  .optional(),
                generic_user: z
                  .object({ id: z.string().describe("User's user_id"), type: z.number().describe('User type 1: User') })
                  .describe('When the field type is GENERIC_USER, this parameter defines the user referenced')
                  .optional(),
              })
              .describe('Custom field value')
              .optional(),
          }),
        )
        .describe(
          'Custom field. Make sure your company administrator has enabled "Allow to invoke by Open Platform\'s Contacts API" in Admin > Organization > Member Profile > Custom Fields > Global Settings; otherwise, this field will not take effect or be returned.more detail see [FQAs]',
        )
        .optional(),
      enterprise_email: z
        .string()
        .describe(
          'Business email. Make sure that Feishu Business Mail has been enabled in Admin.When create user, the detail of enterprise email see [FQAs]',
        )
        .optional(),
      job_title: z.string().describe('Job title').optional(),
      is_frozen: z.boolean().describe('Whether to freeze the user').optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Type of department ID used in this call Options:department_id(Identify the department with the custom department_id),open_department_id(Identify the department with open_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      user_id: z.string().describe('User ID, which must match the user_id_type in the query parameter'),
    }),
  },
};
export const contactV3UserUpdateUserId = {
  project: 'contact',
  name: 'contact.v3.user.updateUserId',
  sdkName: 'contact.v3.user.updateUserId',
  path: '/open-apis/contact/v3/users/:user_id/update_user_id',
  httpMethod: 'PATCH',
  description: "[Feishu/Lark]-Contacts-User-Update UserID-Call this interface to update the user's user_id",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      new_user_id: z.string().describe('Customize new user user_id. Length cannot exceed 64 characters'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      user_id: z
        .string()
        .describe('The user ID and ID type are consistent with the value of the query parameter user_id_type'),
    }),
  },
};
export const contactV3WorkCityGet = {
  project: 'contact',
  name: 'contact.v3.workCity.get',
  sdkName: 'contact.v3.workCity.get',
  path: '/open-apis/contact/v3/work_cities/:work_city_id',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Contacts-Work city-Query a work city-Call this interface to obtain the information of a specified work city, including the work city's ID, name, multilingual name, and enabled status",
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z
      .object({
        work_city_id: z
          .string()
          .describe('Work city ID. You can call the [Get tenant work city list] interface to get the work city ID')
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const contactV3WorkCityList = {
  project: 'contact',
  name: 'contact.v3.workCity.list',
  sdkName: 'contact.v3.workCity.list',
  path: '/open-apis/contact/v3/work_cities',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Contacts-Work city-Query the list of work cities-Call this interface to obtain information about all work cities under the current tenant, including the work city's ID, name, multilingual name, and enabled status",
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_size: z
          .number()
          .describe('The paging size is used to limit the number of data items returned in one request')
          .optional(),
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
export const contactV3Tools = [
  contactV3CustomAttrList,
  contactV3DepartmentBatch,
  contactV3DepartmentChildren,
  contactV3DepartmentCreate,
  contactV3DepartmentDelete,
  contactV3DepartmentGet,
  contactV3DepartmentList,
  contactV3DepartmentParent,
  contactV3DepartmentPatch,
  contactV3DepartmentSearch,
  contactV3DepartmentUnbindDepartmentChat,
  contactV3DepartmentUpdate,
  contactV3DepartmentUpdateDepartmentId,
  contactV3EmployeeTypeEnumCreate,
  contactV3EmployeeTypeEnumDelete,
  contactV3EmployeeTypeEnumList,
  contactV3EmployeeTypeEnumUpdate,
  contactV3FunctionalRoleCreate,
  contactV3FunctionalRoleDelete,
  contactV3FunctionalRoleMemberBatchCreate,
  contactV3FunctionalRoleMemberBatchDelete,
  contactV3FunctionalRoleMemberGet,
  contactV3FunctionalRoleMemberList,
  contactV3FunctionalRoleMemberScopes,
  contactV3FunctionalRoleUpdate,
  contactV3GroupCreate,
  contactV3GroupDelete,
  contactV3GroupGet,
  contactV3GroupMemberBelong,
  contactV3GroupMemberAdd,
  contactV3GroupMemberBatchAdd,
  contactV3GroupMemberBatchRemove,
  contactV3GroupMemberRemove,
  contactV3GroupMemberSimplelist,
  contactV3GroupPatch,
  contactV3GroupSimplelist,
  contactV3JobFamilyCreate,
  contactV3JobFamilyDelete,
  contactV3JobFamilyGet,
  contactV3JobFamilyList,
  contactV3JobFamilyUpdate,
  contactV3JobLevelCreate,
  contactV3JobLevelDelete,
  contactV3JobLevelGet,
  contactV3JobLevelList,
  contactV3JobLevelUpdate,
  contactV3JobTitleGet,
  contactV3JobTitleList,
  contactV3ScopeList,
  contactV3UnitBindDepartment,
  contactV3UnitCreate,
  contactV3UnitDelete,
  contactV3UnitGet,
  contactV3UnitList,
  contactV3UnitListDepartment,
  contactV3UnitPatch,
  contactV3UnitUnbindDepartment,
  contactV3UserBatch,
  contactV3UserBatchGetId,
  contactV3UserCreate,
  contactV3UserDelete,
  contactV3UserFindByDepartment,
  contactV3UserGet,
  contactV3UserList,
  contactV3UserPatch,
  contactV3UserResurrect,
  contactV3UserUpdate,
  contactV3UserUpdateUserId,
  contactV3WorkCityGet,
  contactV3WorkCityList,
];
