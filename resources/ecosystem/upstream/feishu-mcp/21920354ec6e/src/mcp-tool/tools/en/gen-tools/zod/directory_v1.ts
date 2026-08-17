import { z } from 'zod';
export type directoryV1ToolName =
  | 'directory.v1.collaborationRule.create'
  | 'directory.v1.collaborationRule.delete'
  | 'directory.v1.collaborationRule.list'
  | 'directory.v1.collaborationRule.update'
  | 'directory.v1.collaborationTenant.list'
  | 'directory.v1.collborationShareEntity.list'
  | 'directory.v1.department.create'
  | 'directory.v1.department.delete'
  | 'directory.v1.department.filter'
  | 'directory.v1.department.mget'
  | 'directory.v1.department.patch'
  | 'directory.v1.department.search'
  | 'directory.v1.employee.create'
  | 'directory.v1.employee.delete'
  | 'directory.v1.employee.filter'
  | 'directory.v1.employee.mget'
  | 'directory.v1.employee.patch'
  | 'directory.v1.employee.regular'
  | 'directory.v1.employee.resurrect'
  | 'directory.v1.employee.search'
  | 'directory.v1.employee.toBeResigned';
export const directoryV1CollaborationRuleCreate = {
  project: 'directory',
  name: 'directory.v1.collaborationRule.create',
  sdkName: 'directory.v1.collaborationRule.create',
  path: '/open-apis/directory/v1/collaboration_rules',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Trust Party-Collaboration rules-Add collaboration rules-Admin perspective Added collaboration rules. Users need to have trusted party administrator role',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      subjects: z
        .object({
          open_user_ids: z
            .array(z.string())
            .describe('User open id, which can be obtained from our Contacts/organizational structure interfaces')
            .optional(),
          open_department_ids: z
            .array(z.string())
            .describe(
              'Department open id, 0 represents all members, which can be obtained from our Contacts/organizational structure interfaces',
            )
            .optional(),
          open_group_ids: z
            .array(z.string())
            .describe('The user group open id can be obtained from our Contacts/organizational structure interfaces')
            .optional(),
        })
        .describe('The sum of the number of entities needs to be less than 100'),
      objects: z
        .object({
          open_user_ids: z.array(z.string()).describe('User open id').optional(),
          open_department_ids: z.array(z.string()).describe('Department open id, 0 represents all members').optional(),
          open_group_ids: z.array(z.string()).describe('Group open id').optional(),
        })
        .describe('The sum of the number of entities needs to be less than 100'),
    }),
    params: z.object({ target_tenant_key: z.string().describe("The other tenant's tenant key") }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1CollaborationRuleDelete = {
  project: 'directory',
  name: 'directory.v1.collaborationRule.delete',
  sdkName: 'directory.v1.collaborationRule.delete',
  path: '/open-apis/directory/v1/collaboration_rules/:collaboration_rule_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Trust Party-Collaboration rules-Delete the collaboration rules-Administrator delete collaboration rules. Users need to have trusted party administrator role',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({ target_tenant_key: z.string().describe("The other tenant's tenant key") }),
    path: z.object({ collaboration_rule_id: z.string().describe('rule ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1CollaborationRuleList = {
  project: 'directory',
  name: 'directory.v1.collaborationRule.list',
  sdkName: 'directory.v1.collaborationRule.list',
  path: '/open-apis/directory/v1/collaboration_rules',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Trust Party-Collaboration rules-Query the collaboration rules-Administrator query collaboration rules. Users need to have trusted party administrator role',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      page_size: z.number().describe('paging size').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      target_tenant_key: z.string().describe("The other tenant's tenant key"),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1CollaborationRuleUpdate = {
  project: 'directory',
  name: 'directory.v1.collaborationRule.update',
  sdkName: 'directory.v1.collaborationRule.update',
  path: '/open-apis/directory/v1/collaboration_rules/:collaboration_rule_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Trust Party-Collaboration rules-Modify the collaboration rules-Administrator updates the collaboration rules. Users need to have trusted party administrator role',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      subjects: z
        .object({
          open_user_ids: z.array(z.string()).describe('User open id').optional(),
          open_department_ids: z.array(z.string()).describe('Department open id, 0 represents all members').optional(),
          open_group_ids: z.array(z.string()).describe('Group open id').optional(),
        })
        .describe('The sum of the number of entities needs to be less than 100'),
      objects: z
        .object({
          open_user_ids: z.array(z.string()).describe('User open id').optional(),
          open_department_ids: z.array(z.string()).describe('Department open id, 0 represents all members').optional(),
          open_group_ids: z.array(z.string()).describe('Group open id').optional(),
        })
        .describe('The sum of the number of entities needs to be less than 100'),
    }),
    params: z.object({ target_tenant_key: z.string().describe("The other tenant's tenant key") }),
    path: z.object({ collaboration_rule_id: z.string().describe('rule ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1CollaborationTenantList = {
  project: 'directory',
  name: 'directory.v1.collaborationTenant.list',
  sdkName: 'directory.v1.collaborationTenant.list',
  path: '/open-apis/directory/v1/collaboration_tenants',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Trust Party-Collaboraiton Organization-Query the list of trusted parties by Admin-When creating a rule, you need to know the tenant key of the other tenant, and you can get a valid tenant key through this interface. Please use the trusted party administrator role to use this function',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_size: z.number().describe('paging size').optional(),
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
export const directoryV1CollborationShareEntityList = {
  project: 'directory',
  name: 'directory.v1.collborationShareEntity.list',
  sdkName: 'directory.v1.collborationShareEntity.list',
  path: '/open-apis/directory/v1/share_entities',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Trust Party-Collaboraiton Organization-Query the sharing members between the trust party relations-When creating a rule, you need to query the openIDs of this tenant and the other tenant entities, and these entities should be within the sharing scope of the trusted party. This interface can obtain the scope shared by the subject and object tenants of the trusted parties',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      target_tenant_key: z
        .string()
        .describe(
          'The tenant key of the other party. It can be obtained through [Query the list of trusted parties by Admin]',
        ),
      target_department_id: z
        .string()
        .describe(
          "If you don't fill in this parameter, it is the sharing range of the tenant. You can fill in this field and continue to drill down to view the sub-departments + members under the designated department. Filling in 0 is divided into two cases. If the tenant shares all employees, the first-level department will be displayed, otherwise the shared department + members will be displayed",
        )
        .optional(),
      target_group_id: z
        .string()
        .describe('Get the members of the user group, fill in the value and ignore target_department_id')
        .optional(),
      is_select_subject: z
        .boolean()
        .describe('Whether the subject tenant shares the scope, the default is the sharing scope of the object tenant')
        .optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.number().describe('paging size').optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1DepartmentCreate = {
  project: 'directory',
  name: 'directory.v1.department.create',
  sdkName: 'directory.v1.department.create',
  path: '/open-apis/directory/v1/departments',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Organization-Department management-Create department-This interface is used to create a new department in the enterprise address book, supporting the setting of information such as department name, parent department, and department head.',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      department: z
        .object({
          custom_department_id: z
            .string()
            .describe(
              'Identifies a unique department within the tenant, supports customization and is automatically generated by the system when not customized. id supports modification.Notes:1. in addition to the need to meet the regular rules, at the same time can not start with od-.2. Regular checksum: ^[a-zA-Z0-9][a-zA-Z0-9_\\-@.] {0,63}$',
            )
            .optional(),
          name: z
            .object({
              default_value: z.string().describe('Default value'),
              i18n_value: z
                .object({})
                .catchall(z.any())
                .describe(
                  'Internationalization value, key is zh_cn, ja_jp, en_us, and value is the corresponding value',
                )
                .optional(),
            })
            .describe('Department name, up to 100 characters')
            .optional(),
          parent_department_id: z
            .string()
            .describe(
              'Parent department ID, consistent with the department_id_type type. if the parent department is the root department, the value of this parameter is "0"',
            )
            .optional(),
          leaders: z
            .array(
              z.object({
                leader_type: z
                  .number()
                  .describe(
                    'Department leader type Options:1(department_leader_type_directory_main main),2(department_leader_type_directory_deputy Vice)',
                  ),
                leader_id: z.string().describe('Department leader id, consistent with the employee_id_type type'),
              }),
            )
            .describe('Department leader')
            .optional(),
          order_weight: z
            .string()
            .describe(
              'The sorting weight under the superior department, with the returned results sorted in descending order by order_weight',
            )
            .optional(),
          enabled_status: z.boolean().describe('Enabled status').optional(),
          custom_field_values: z
            .array(
              z.object({
                field_type: z
                  .enum(['1', '2', '3', '4', '9', '10', '11'])
                  .describe(
                    'Custom field types Options:1(custom_field_value_type_text Text),2(custom_field_value_type_url URL),3(custom_field_value_type_enum Options),4(custom_field_value_type_generic_user Members),9(custom_field_value_type_phone ),10(custom_field_field_type_directory_multi_enum Multiple selection options),11(custom_field_field_type_directory_multi_generic_user Members list)',
                  )
                  .optional(),
                text_value: z
                  .object({
                    default_value: z.string().describe('Default value'),
                    i18n_value: z
                      .object({})
                      .catchall(z.any())
                      .describe(
                        'Internationalization value, key is zh_cn, ja_jp, en_us, and value is the corresponding value',
                      )
                      .optional(),
                  })
                  .describe('Text Field Values')
                  .optional(),
                url_value: z
                  .object({
                    link_text: z
                      .object({
                        default_value: z.string().describe('Default value'),
                        i18n_value: z
                          .object({})
                          .catchall(z.any())
                          .describe(
                            'Internationalization value, key is zh_cn, ja_jp, en_us, and value is the corresponding value',
                          )
                          .optional(),
                      })
                      .describe('Link title'),
                    url: z.string().describe('Mobile web link'),
                    pcurl: z.string().describe('Desktop web link'),
                  })
                  .describe('Web Link Field Values')
                  .optional(),
                enum_value: z
                  .object({
                    enum_ids: z.array(z.string()).describe('Enum option id'),
                    enum_type: z
                      .enum(['1', '2'])
                      .describe(
                        'Enum type Options:1(custom_field_value_enum_type_text Text),2(custom_field_value_enum_type_picture picture)',
                      ),
                  })
                  .describe('Enum field values')
                  .optional(),
                user_values: z
                  .array(
                    z.object({
                      ids: z.array(z.string()).describe('Employee IDs, consistent with the employee_id_type type'),
                    }),
                  )
                  .describe('User Field Values')
                  .optional(),
                phone_value: z.object({ phone_number: z.string(), extension_number: z.string().optional() }).optional(),
                field_key: z.string().describe('Custom field key').optional(),
              }),
            )
            .describe('Departmental custom field values')
            .optional(),
        })
        .describe('Create Department'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            'User ID categories Options:open_id(Identifies the identity of a user in an application. The same user has different Open IDs in different applications. [Learn more: How to get an Open ID]),union_id(Identifies the identity of a user under an application developer. The Union ID of the same user in an application under the same developer is the same, and the Union ID in an application under different developers is different. With Union ID, application developers can associate the identity of the same user in multiple applications. [Learn more: How to get Union ID?]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call Options:department_id(Used to identify a unique department within a tenant),open_department_id(Used to identify a department in a specific application, where the open_department_id is different for the same department in different applications.)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1DepartmentDelete = {
  project: 'directory',
  name: 'directory.v1.department.delete',
  sdkName: 'directory.v1.department.delete',
  path: '/open-apis/directory/v1/departments/:department_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Organization-Department management-Delete department-This interface is used to delete departments',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call Options:department_id(Used to identify a unique department within a tenant),open_department_id(It is used to identify a department in a specific application, and the same department has different open_department_id in different applications.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      department_id: z.string().describe('Department ID, consistent with the department_id_type type'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1DepartmentFilter = {
  project: 'directory',
  name: 'directory.v1.department.filter',
  sdkName: 'directory.v1.department.filter',
  path: '/open-apis/directory/v1/departments/filter',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Organization-Department management-List department-This interface is used to obtain the list of eligible department details in batches according to the specified conditions',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      filter: z
        .object({
          conditions: z
            .array(
              z.object({
                field: z
                  .string()
                  .describe(
                    'The lvalue of the filter criterion, which is the parameter name of the field.** Optional filters are: **- parent_department_id',
                  ),
                operator: z
                  .string()
                  .describe(
                    'Comparison operator** Optional values are: **- eq: equal to, supports any type of lvalue- in: belongs to any one, does not support parent_department_id, rvalue is an array of multiple target filter values (no more than 100)',
                  ),
                value: z
                  .string()
                  .describe(
                    'The right value of the filter condition, whose content is the corresponding value type under the combination of the left value field type and the operator. Its value type must be consistent with the value of the query parameter department_id_type, with a maximum length of 64 characters, and supports numbers and letters. When using the parent_department_id condition, the ID of the root department can be "0"',
                  ),
              }),
            )
            .describe('List of comparison expressions. Relationships between multiple expressions default to "and"'),
        })
        .describe('Query Conditions [Learn more: Query Conditions Usage]'),
      required_fields: z
        .array(z.string())
        .describe(
          'List of fields to query. Permissioned row and column data will be returned according to the passed field list. If not passed, no fields will be returned [Learn more: Field enumeration instructions]',
        ),
      page_request: z
        .object({
          page_size: z
            .number()
            .describe(
              'Maximum number of entries returned per page, maximum value is 100**Default value**：20**Minimum Value**: 0',
            )
            .optional(),
          page_token: z
            .string()
            .describe(
              'Sequential paging query, can not skip page query, support deep paging, in the need to traverse all the data scene can only use this method. The first pass empty string or not, later pass the last return value in the page_token',
            )
            .optional(),
        })
        .describe('paging information'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            "User ID categories Options:open_id(Identifies a user to an app. The same user has different Open IDs in different apps. [How to get Open ID]),union_id(Identifies a user to a tenant that acts as a developer. A user has the same Union ID in apps developed by the same developer, and has different Union IDs in apps developed by different developers. A developer can use Union ID to link the same user's identities in multiple apps.[How to get Union ID]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)",
          )
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(Used to identify a department in a specific application, the same department, the same open_department_id in different applications.),department_id(Used to identify a unique department within a tenant)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1DepartmentMget = {
  project: 'directory',
  name: 'directory.v1.department.mget',
  sdkName: 'directory.v1.department.mget',
  path: '/open-apis/directory/v1/departments/mget',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Organization-Department management-Batch get department info-This interface supports passing in multiple department IDs and returns detailed information for each department (such as name, person in charge, sub-departments, etc.).',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      department_ids: z
        .array(z.string())
        .describe(
          'Department ID, consistent with the department_id_type. The way to get the ID: you can query it through the management background',
        ),
      required_fields: z
        .array(z.string())
        .describe(
          'List of fields to query. Permissioned row and column data will be returned according to the passed field list. If not passed, no fields will be returned [Learn more: Field enumeration instructions]',
        ),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            "User ID categories Options:open_id(Identifies a user to an app. The same user has different Open IDs in different apps. [How to get Open ID]),union_id(Identifies a user to a tenant that acts as a developer. A user has the same Union ID in apps developed by the same developer, and has different Union IDs in apps developed by different developers. A developer can use Union ID to link the same user's identities in multiple apps.[How to get Union ID]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)",
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call Options:department_id(Used to identify a unique department within a tenant),open_department_id(Used to identify a department in a specific application, the same department, the same open_department_id in different applications.)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1DepartmentPatch = {
  project: 'directory',
  name: 'directory.v1.department.patch',
  sdkName: 'directory.v1.department.patch',
  path: '/open-apis/directory/v1/departments/:department_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Organization-Department management-Update department-This interface is used to update department information. Only the parts param that are explicitly passed are updated',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      department: z
        .object({
          custom_department_id: z
            .string()
            .describe(
              'Customize the department ID. Note:1. Except for the need to meet the regular rules, it cannot start with od- at the same time2. Regular check: ^ [a-zA-Z0-9] [a-zA-Z0-9 _\\-@.]{ 0,63} $**Data Validation Rules**:Length range: 1-64 characters',
            )
            .optional(),
          name: z
            .object({
              default_value: z.string().describe('default value'),
              i18n_value: z
                .object({})
                .catchall(z.any())
                .describe('Internationalized value, key is zh_cn, ja_jp, en_us, value is the corresponding value')
                .optional(),
            })
            .describe('Department name')
            .optional(),
          parent_department_id: z
            .string()
            .describe('Parent Department ID, consistent with the department_id_type type')
            .optional(),
          leaders: z
            .array(
              z.object({
                leader_type: z
                  .number()
                  .describe(
                    'Type of department head Options:1(department_leader_type_directory_main main),2(department_leader_type_directory_deputy vice)',
                  ),
                leader_id: z.string().describe('Department head ID, consistent with the employee_id_type type'),
              }),
            )
            .describe('department head')
            .optional(),
          order_weight: z
            .string()
            .describe(
              'The sorting weight under the superior department, and the returned results will be sorted in ascending order according to the value of order_weight.',
            )
            .optional(),
          enabled_status: z.boolean().describe('Whether to enable').optional(),
          custom_field_values: z
            .array(
              z.object({
                field_key: z.string().describe('Custom field key').optional(),
                field_type: z
                  .enum(['1', '2', '3', '4', '10', '11'])
                  .describe(
                    'custom field type Options:1(custom_field_value_type_text Text),2(custom_field_value_type_url URL),3(custom_field_value_type_enum Options),4(custom_field_value_type_generic_user Members),10(custom_field_field_type_directory_multi_enum Multiple selection options),11(custom_field_field_type_directory_multi_generic_user Members list)',
                  )
                  .optional(),
                text_value: z
                  .object({
                    default_value: z.string().describe('default value'),
                    i18n_value: z
                      .object({})
                      .catchall(z.any())
                      .describe('Internationalized value, key is zh_cn, ja_jp, en_us, value is the corresponding value')
                      .optional(),
                  })
                  .describe('Text field value')
                  .optional(),
                url_value: z
                  .object({
                    link_text: z
                      .object({
                        default_value: z.string().describe('default value'),
                        i18n_value: z
                          .object({})
                          .catchall(z.any())
                          .describe(
                            'Internationalized value, key is zh_cn, ja_jp, en_us, value is the corresponding value',
                          )
                          .optional(),
                      })
                      .describe('page title'),
                    url: z.string().describe('Mobile end web link'),
                    pcurl: z.string().describe('Desktop web link'),
                  })
                  .describe('Web link field value')
                  .optional(),
                enum_value: z
                  .object({
                    enum_ids: z.array(z.string()).describe('Option result ID'),
                    enum_type: z
                      .enum(['1', '2'])
                      .describe(
                        'option type Options:1(custom_field_value_enum_type_text Text),2(custom_field_value_enum_type_picture picture)',
                      ),
                  })
                  .describe('Enumerate field values')
                  .optional(),
                user_values: z
                  .array(
                    z.object({
                      ids: z.array(z.string()).describe('Person ID,consistent with the employee_id_type type'),
                      user_type: z
                        .literal('1')
                        .describe('Personnel Type Options:1(custom_field_value_user_type_employee employees)'),
                    }),
                  )
                  .describe('Person field value')
                  .optional(),
              }),
            )
            .describe('Department custom field values')
            .optional(),
        })
        .describe('Update department information'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            "User ID categories Options:open_id(Identifies a user to an app. The same user has different Open IDs in different apps. [How to get Open ID]),union_id(Identifies a user to a tenant that acts as a developer. A user has the same Union ID in apps developed by the same developer, and has different Union IDs in apps developed by different developers. A developer can use Union ID to link the same user's identities in multiple apps.[How to get Union ID]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)",
          )
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(It is used to identify a department in a specific application, and the same department has different open_department_id in different applications.),department_id(Used to identify a unique department within a tenant)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      department_id: z.string().describe('Department ID, consistent with the department_id_type type'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1DepartmentSearch = {
  project: 'directory',
  name: 'directory.v1.department.search',
  sdkName: 'directory.v1.department.search',
  path: '/open-apis/directory/v1/departments/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Organization-Department management-Search department-This interface is used to search for department information, search for department information through keywords such as department names, and return a list of departments that meet the criteria.',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      query: z
        .string()
        .describe(
          'Search for keywords. Supports searching by department name, with a maximum input of 100 characters.',
        ),
      page_request: z
        .object({
          page_size: z
            .number()
            .describe(
              'Maximum number of entries returned per page, maximum value is 100**Default value**：20**Minimum Value**: 0',
            )
            .optional(),
          page_token: z
            .string()
            .describe(
              'Sequential paging query, can not skip page query, support deep paging, in the need to traverse all the data scene can only use this method. The first pass empty string or not, later pass the last return value in the page_token',
            )
            .optional(),
        })
        .describe('paging information'),
      required_fields: z
        .array(z.string())
        .describe(
          'List of fields to be queried. Permissioned row and column data will be returned according to the passed field list. If not passed, no fields will be returned[Learn more: Field enumeration instructions]',
        ),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            "User ID categories Options:open_id(Identifies a user to an app. The same user has different Open IDs in different apps. [How to get Open ID]),union_id(Identifies a user to a tenant that acts as a developer. A user has the same Union ID in apps developed by the same developer, and has different Union IDs in apps developed by different developers. A developer can use Union ID to link the same user's identities in multiple apps.[How to get Union ID]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)",
          )
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(It is used to identify a department in a specific application, and the same department has different open_department_id in different applications.),department_id(Used to identify a unique department within a tenant)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1EmployeeCreate = {
  project: 'directory',
  name: 'directory.v1.employee.create',
  sdkName: 'directory.v1.employee.create',
  path: '/open-apis/directory/v1/employees',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Organization-Employee management-Create employee-This API is used to create an employee under the enterprise. It supports passing in information such as name and mobile phone number to generate an employee object in the active state. Employees refer to members with the identity of "Employee" in the Feishu enterprise, which is equivalent to the "User" in the address book OpenAPI.',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      employee: z
        .object({
          name: z
            .object({
              name: z
                .object({
                  default_value: z.string().describe('default valueMinimum length: 1 character'),
                  i18n_value: z
                    .object({})
                    .catchall(z.any())
                    .describe('Internationalized value, key is zh_cn, ja_jp, en_us, value is the corresponding value')
                    .optional(),
                })
                .describe('The name of the employee, up to 64 characters can be entered'),
              another_name: z.string().describe('Alias, up to 64 characters').optional(),
            })
            .describe('name')
            .optional(),
          mobile: z
            .string()
            .describe(
              "Employee's mobile phone number, enter up to 255 characters. Note:1. It cannot be repeated among current employees within the enterprise.2. Uncertified enterprises only support adding Chinese mainland mobile phone numbers, and enterprises certified by Feishu are allowed to add overseas mobile phone numbers.3. The plus sign + must be included in the international area code prefix",
            )
            .optional(),
          custom_employee_id: z
            .string()
            .describe(
              'Unique identification of active employees in the enterprise. Customization is supported, and the system automatically generates it when not customized. ID supports modification. Note:1. The ID of current employees cannot be repeated2. ID cannot contain spaces',
            )
            .optional(),
          avatar_key: z
            .string()
            .describe(
              "Employee's avatar key. To get the key of the picture, please use [Upload Image - Server Level API - Development Documentation - Feishu open platform]. when uploading, you need to select for setting avatar as the picture type",
            )
            .optional(),
          email: z
            .string()
            .describe(
              "The employee's email address at work. Note:1. It cannot be repeated among current employees within the enterprise.2. Non-Chinese mainland mobile phone number members must add email at the same time",
            )
            .optional(),
          enterprise_email: z
            .string()
            .describe(
              "Employee's enterprise mailbox. Please make sure that the Feishu mailbox service has been enabled in the management background first. The domain name of the enterprise mailbox needs to be applied and opened by the enterprise in the management background. If the enterprise does not open the enterprise mailbox of the corresponding domain name, setting the user's enterprise mailbox will fail",
            )
            .optional(),
          gender: z
            .number()
            .describe(
              'gender Options:0(gender_directory_unknown unknown),1(gender_directory_man male),2(gender_directory_woman female),3(gender_directory_other other)',
            )
            .optional(),
          employee_order_in_departments: z
            .array(
              z.object({
                department_id: z
                  .string()
                  .describe(
                    'Specify the department where the employee is located, identify a unique department within the enterprise, and keep it consistent with the department_id_type type.',
                  )
                  .optional(),
                order_weight_in_deparment: z
                  .string()
                  .describe('The ranking weight of employees within the department')
                  .optional(),
                order_weight_among_deparments: z
                  .string()
                  .describe(
                    'The ranking weight of this department among the multiple departments to which the user belongs',
                  )
                  .optional(),
                is_main_department: z
                  .boolean()
                  .describe(
                    "Whether it is the user's main department (a user can only have one main department, and the sorting weight should be the largest. If not filled in, the first department in the sorting will be used as the main department by default), optional values: true/false.",
                  )
                  .optional(),
              }),
            )
            .describe('The ranking information of employees within their department')
            .optional(),
          leader_id: z
            .string()
            .describe(
              "The ID of the employee's line manager, consistent with the employee_id_type. Note: 1. There should be no circular reporting, i.e. A reports to B and B reports to A.2. The line manager must be an active employee",
            )
            .optional(),
          dotted_line_leader_ids: z
            .array(z.string())
            .describe(
              'The dotted-line manager ID of the employee, which is consistent with the employee_id_type. Note: 1. There should be no circular reporting, i.e. A reports to B and B reports to A.2. The line manager must be an active employee',
            )
            .optional(),
          work_country_or_region: z
            .string()
            .describe('Workplace country code. To obtain the country code, please use [Paging Bulk Query Country]')
            .optional(),
          work_place_id: z.string().describe('Workplace ID').optional(),
          work_station: z
            .object({
              default_value: z.string().describe('default value'),
              i18n_value: z
                .object({})
                .catchall(z.any())
                .describe('Internationalized value, key is zh_cn, ja_jp, en_us, value is the corresponding value')
                .optional(),
            })
            .describe('Workstation')
            .optional(),
          job_number: z
            .string()
            .describe('Job number. The job number of employees in the enterprise cannot be repeated')
            .optional(),
          extension_number: z
            .string()
            .describe(
              'Extension number, up to 99 characters can be entered . The extension numbers of all employees in the enterprise cannot be repeated',
            )
            .optional(),
          join_date: z.string().describe('Onboard date').optional(),
          employment_type: z.number().describe('Employee type').optional(),
          job_title_id: z.string().describe('Job ID').optional(),
          custom_field_values: z
            .array(
              z.object({
                field_type: z
                  .enum(['1', '2', '3', '4', '9', '10', '11'])
                  .describe(
                    'Custom field type Options:1(custom_field_value_type_text Text),2(custom_field_value_type_url URL),3(custom_field_value_type_enum Options),4(custom_field_value_type_generic_user Members),9(custom_field_value_type_phone ),10(custom_field_field_type_directory_multi_enum Multiple selection options),11(custom_field_field_type_directory_multi_generic_user Members list)',
                  )
                  .optional(),
                text_value: z
                  .object({
                    default_value: z.string().describe('defaultMinimum length: 1 character'),
                    i18n_value: z
                      .object({})
                      .catchall(z.any())
                      .describe('Internationalized value, key is zh_cn, ja_jp, en_us, value is the corresponding value')
                      .optional(),
                  })
                  .describe('Text field value')
                  .optional(),
                url_value: z
                  .object({
                    link_text: z.object({
                      default_value: z.string().describe('default valueLength range: 1-40 characters'),
                      i18n_value: z
                        .object({})
                        .catchall(z.any())
                        .describe(
                          'Internationalized value, key is zh_cn, ja_jp, en_us, value is the corresponding value',
                        )
                        .optional(),
                    }),
                    url: z.string(),
                    pcurl: z.string(),
                  })
                  .optional(),
                enum_value: z
                  .object({
                    enum_ids: z.array(z.string()).describe('link title'),
                    enum_type: z
                      .enum(['1', '2'])
                      .describe(
                        'mobile web link Options:1(custom_field_value_enum_type_text text),2(custom_field_value_enum_type_picture image)',
                      ),
                  })
                  .describe('Url field value')
                  .optional(),
                user_values: z
                  .array(
                    z.object({
                      ids: z.array(z.string()).describe('employee id，consistent with the employee_id_type type.'),
                    }),
                  )
                  .describe('enum field value')
                  .optional(),
                phone_value: z
                  .object({ phone_number: z.string(), extension_number: z.string().optional() })
                  .describe('field representing employee')
                  .optional(),
                field_key: z.string().describe('Custom field key').optional(),
              }),
            )
            .describe('custom field')
            .optional(),
        })
        .describe('Create employee object'),
      options: z
        .object({
          geo_name: z
            .string()
            .describe(
              'Employee\'s Data Residency. Optional only for organizations with Multi-Geo enabled, and can only be populated for Geo\'s in the list of organization data residences.The following permissions need to be requested to write:<md-perm name="directory:employee.base.geo:write" desc="Write to Employee Data Location" support_app_types="custom" tags="">Write to Employee Data Location</ md-perm>',
            )
            .optional(),
          subscription_ids: z
            .array(z.string())
            .describe(
              'A list of seat IDs assigned to employees. The available seat IDs for this tenant can be obtained through the interface below, see [Get Seat Information]. This field is required when in hybrid license mode.Permissions are required in order to write:<md-perm name="directory:employee.base.subscription_ids:write" desc="Write employee seat information" support_app_types="custom" tags="">Write employee seat information</md-perm>',
            )
            .optional(),
        })
        .describe('api extend options')
        .optional(),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            'User ID categories Options:open_id(Identifies the identity of a user in an application. The same user has different Open IDs in different applications. [Learn more: How to get an Open ID]),union_id(Identifies the identity of a user under an application developer. The Union ID of the same user in an application under the same developer is the same, and the Union ID in an application under different developers is different. With Union ID, application developers can associate the identity of the same user in multiple applications. [Learn more: How to get Union ID?]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call Options:department_id(Used to identify a unique department within a tenant),open_department_id(It is used to identify a department in a specific application, and the same department has the same open_department_id in different applications.)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1EmployeeDelete = {
  project: 'directory',
  name: 'directory.v1.employee.delete',
  sdkName: 'directory.v1.employee.delete',
  path: '/open-apis/directory/v1/employees/:employee_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Organization-Employee management-Delete employee-This interface is for resign employees',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        options: z
          .object({
            resigned_employee_resource_receiver: z
              .object({
                department_chat_acceptor_employee_id: z
                  .string()
                  .describe(
                    'Department group receiver. The ID value corresponds to the employee_id_type in the query parameter.When the deleted user is the group owner of the department group, the group owner is transferred to the designated recipient, and if the recipient is not specified, it is transferred to the first person in the group by default',
                  )
                  .optional(),
                external_chat_acceptor_employee_id: z
                  .string()
                  .describe(
                    'External group receiver. The ID value corresponds to the employee_id_type in the query parameter.When the deleted user is an external group owner, the group owner is transferred to the designated recipient. If the recipient is not specified, it will be transferred to the first person in the group who joins the group in the same organization as the deleted user. If only the user is in the group, the external group will be disbanded',
                  )
                  .optional(),
                docs_acceptor_employee_id: z
                  .string()
                  .describe(
                    'Document recipient. The ID value corresponds to the employee_id_type in the query parameter.When a user is deleted, the documents owned by the user are transferred to the recipient. If no recipient is specified, the document resources will be retained under the user name',
                  )
                  .optional(),
                calendar_acceptor_employee_id: z
                  .string()
                  .describe(
                    'Schedule recipient. The ID value corresponds to the employee_id_type in the query parameter.When a user is deleted, the schedules owned by the user are transferred to the recipient. If no recipient is specified, the schedule resources will be retained under the user name',
                  )
                  .optional(),
                application_acceptor_employee_id: z
                  .string()
                  .describe(
                    'Apply the recipient. The ID value corresponds to the employee_id_type in the query parameter.When a user is deleted, the applications created by the user are transferred to the recipient. If the recipient is not specified, the application will be retained under the user name, but the user cannot log in to the developer backend to manage the application. The administrator can manually transfer the application to other people in the management backend',
                  )
                  .optional(),
                helpdesk_acceptor_employee_id: z
                  .string()
                  .describe(
                    "Help desk resource receiver. The ID value corresponds to the employee_id_type in the query parameter.When a user is deleted, the help desk resources they own are transferred to the recipient, and when the recipient is not specified, the help desk resources are retained under the user's name",
                  )
                  .optional(),
                approval_acceptor_employee_id: z
                  .string()
                  .describe(
                    "Approval of resource recipients. ID values correspond to employee_id_type in query parameters.When a user is deleted, the approval resources it owns are transferred to the recipient, and the approval resources are retained under the user's name when the recipient is not specified",
                  )
                  .optional(),
                email_acceptor_employee_id: z
                  .string()
                  .describe(
                    'User mail resource recipient. The ID value corresponds to the employee_id_type in the query parameter.When a user is deleted, the email resources owned by the user are transferred to the recipient. If the recipient is not specified, the email resources are retained under the user name',
                  )
                  .optional(),
                minutes_acceptor_employee_id: z
                  .string()
                  .describe(
                    'Wonder receiver. The ID value corresponds to the employee_id_type in the query parameter.When a user is deleted, the minutes resources owned by him are transferred to the receiver. If the receiver is not specified, the minutes will be retained under the user name',
                  )
                  .optional(),
                survey_acceptor_employee_id: z
                  .string()
                  .describe(
                    'Feishu Survey recipient. The ID value corresponds to the employee_id_type in the query parameters.When a user is deleted, the Feishu survey resources owned by him are transferred to the recipient. If no recipient is specified, the Feishu survey resources will be deleted directly',
                  )
                  .optional(),
                anycross_acceptor_employee_id: z.string().describe('Anycross recipient').optional(),
              })
              .describe('Resource transfer methods for departing employees')
              .optional(),
          })
          .describe('interface extension options')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            'User ID categories Options:open_id(Identifies the identity of a user in an application. The same user has different Open IDs in different applications. [Learn more: How to get an Open ID]),union_id(Identifies the identity of a user under an application developer. The Union ID of the same user in an application under the same developer is the same, and the Union ID in an application under different developers is different. With Union ID, application developers can associate the identity of the same user in multiple applications. [Learn more: How to get Union ID?]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      employee_id: z
        .string()
        .describe(
          'The ID of the employee to leave. Needs to be consistent with the employee_id_type type in the query parameter',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1EmployeeFilter = {
  project: 'directory',
  name: 'directory.v1.employee.filter',
  sdkName: 'directory.v1.employee.filter',
  path: '/open-apis/directory/v1/employees/filter',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Organization-Employee management-Get employee list in batches-This interface is used to obtain a batch list of eligible employee details according to the specified conditions.Employee refers to a member of Feishu\'s enterprise who is identified as "Employee", which is equivalent to "User" in the contact OpenAPI',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      filter: z
        .object({
          conditions: z
            .array(
              z.object({
                field: z
                  .string()
                  .describe(
                    'The lvalue of the filter condition, the value is the parameter name of the field. Optional filter conditions are:- base_info.mobile- base_info.email- base_info departments department_id- work_info staff_status',
                  ),
                operator: z
                  .string()
                  .describe(
                    'Comparison operator. Optional values are:- eq: equal to, supports any type of lvalue- in: belongs to either',
                  ),
                value: z
                  .string()
                  .describe(
                    'The rvalue of the filter condition is an escaped JSON string.- For `eq` matching strings, use `"\\"str\\""`- For `in` matching string lists, use `"[\\"str\\"]"`- For `eq` matching numbers, use `"123"`- For `in` matching number lists, use `"[123]"`',
                  ),
              }),
            )
            .describe(
              'A list of comparison expressions, such as the comparison conditions base_info.mobile eq "+ 8613000000001", and the relationship between multiple expressions is and',
            ),
        })
        .describe('Query conditions [Learn more: query condition usage]'),
      required_fields: z
        .array(z.string())
        .describe(
          'List of fields to be queried. Permissioned row and column data will be returned according to the passed field list. No fields will be returned if not passed. [Learn more: Field enumeration instructions]',
        ),
      page_request: z
        .object({
          page_size: z
            .number()
            .describe('The number of requests this time, the minimum is 0 and the maximum is 100')
            .optional(),
          page_token: z
            .string()
            .describe(
              'Sequential paging query, can not skip page query, support deep paging, in the need to traverse all the data scene can only use this method. The first pass empty string or not, after the return value of the page_token',
            )
            .optional(),
        })
        .describe('paging parameter'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            'User ID categories Options:open_id(Identifies the identity of a user in an application. The same user has different Open IDs in different applications. [Learn more: How to get an Open ID]),union_id(Identifies the identity of a user under an application developer. The Union ID of the same user in an application under the same developer is the same, and the Union ID in an application under different developers is different. With Union ID, application developers can associate the identity of the same user in multiple applications. [Learn more: How to get Union ID?]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call Options:department_id(Used to identify a unique department within a tenant),open_department_id(It is used to identify a department in a specific application, and the same department has the same open_department_id in different applications.)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1EmployeeMget = {
  project: 'directory',
  name: 'directory.v1.employee.mget',
  sdkName: 'directory.v1.employee.mget',
  path: '/open-apis/directory/v1/employees/mget',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Organization-Employee management-Obtain employee information in batches-This interface is used to query the details of employees according to their IDs in batches.Such as employee name, mobile phone number, email, department and other information.Employee refers to a member of Feishu\'s enterprise who is identified as "Employee", which is equivalent to "User" in the contact OpenAPI',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      employee_ids: z.array(z.string()).describe('Employee ID, consistent with the employee_id_type type'),
      required_fields: z.array(z.string()).describe('Field enumeration [Learn more: Field enumeration instructions]'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            "User ID categories Options:open_id(Identifies a user to an app. The same user has different Open IDs in different apps. [How to get Open ID]),union_id(Identifies a user to a tenant that acts as a developer. A user has the same Union ID in apps developed by the same developer, and has different Union IDs in apps developed by different developers. A developer can use Union ID to link the same user's identities in multiple apps.[How to get Union ID]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)",
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call Options:department_id(Used to identify a unique department within a tenant),open_department_id( open_department_id: used to identify a department in a specific application, the same department, in different applications open_department_id is not the same.)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1EmployeePatch = {
  project: 'directory',
  name: 'directory.v1.employee.patch',
  sdkName: 'directory.v1.employee.patch',
  path: '/open-apis/directory/v1/employees/:employee_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Organization-Employee management-Update employee information-This interface is used to update the information of current/former employees, freeze/restore employees. Unpassed parameters will not be updated.Employee refers to a member of Feishu\'s enterprise who is identified as "Employee", which is equivalent to "User" in the address book OpenAPI',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      employee: z
        .object({
          name: z
            .object({
              name: z
                .object({
                  default_value: z.string().describe('default valueLength range: 1 - 64 characters'),
                  i18n_value: z
                    .object({})
                    .catchall(z.any())
                    .describe('Internationalized value, key is zh_cn, ja_jp, en_us, value is the corresponding value')
                    .optional(),
                })
                .describe("Employee's name"),
              another_name: z.string().describe('Alias, up to 64 characters').optional(),
            })
            .describe('Name')
            .optional(),
          mobile: z
            .string()
            .describe(
              'The mobile phone number of the employee, up to 255 characters can be entered. . Note:1. It cannot be repeated among current employees in the enterprise2. Uncertified enterprises only support adding Chinese mainland mobile phone numbers, and enterprises certified by Feishu are allowed to add overseas mobile phone numbers3. The international area code prefix must contain the plus sign +',
            )
            .optional(),
          custom_employee_id: z
            .string()
            .describe(
              'Unique identification of active employees in the enterprise. Customization is supported, and the system automatically generates it when not customized. ID supports modification. Note:1. The ID of current employees cannot be duplicated.2. ID cannot contain spaces',
            )
            .optional(),
          avatar_key: z
            .string()
            .describe(
              "Employee's avatar key. To get the key of the picture, please use [Upload Image - Server Level API - Development Documentation - Feishu open platform]. when uploading, you need to select for setting avatar as the picture type",
            )
            .optional(),
          email: z
            .string()
            .describe(
              "The employee's email address at work. Note:1. It cannot be repeated among current employees within the enterprise.2. Non-Chinese mainland mobile phone number members must add email at the same time",
            )
            .optional(),
          enterprise_email: z
            .string()
            .describe(
              "Employee's enterprise mail address. Please make sure that the Feishu mailbox service has been enabled in the management background first. The domain name of the enterprise mail address needs to be applied and opened by the enterprise in the management background. If the enterprise does not open the enterprise mailbox of the corresponding domain name, setting the user's enterprise mail address will fail",
            )
            .optional(),
          gender: z
            .number()
            .describe(
              'gender Options:0(gender_directory_unknown unknown),1(gender_directory_man male),2(gender_directory_woman female),3(gender_directory_other other)',
            )
            .optional(),
          employee_order_in_departments: z
            .array(
              z.object({
                department_id: z
                  .string()
                  .describe('Department ID, consistent with the department_id_type type')
                  .optional(),
                order_weight_in_deparment: z
                  .string()
                  .describe('Sorting weights of employees within the department **Data verification rules:**')
                  .optional(),
                order_weight_among_deparments: z
                  .string()
                  .describe(
                    'The ranking weight of the department among the multiple departments to which the user belongs',
                  )
                  .optional(),
                is_main_department: z
                  .boolean()
                  .describe(
                    "Whether it is the user's main department (the user can only have one main department, and the ranking weight should be the largest. If you don't fill it in, the department with the first ranking will be used as the main department by default)",
                  )
                  .optional(),
              }),
            )
            .describe('Sorting information of employees within their department')
            .optional(),
          background_image_key: z
            .string()
            .describe(
              'The key of the background cover. To get the key of the image, please use [Upload Image - Server Level API - Development Documentation - Feishu open platform]. when uploading, you need to select for sending messages as the picture type',
            )
            .optional(),
          description: z.string().describe("Employee's personal signature").optional(),
          leader_id: z
            .string()
            .describe(
              "Employee's direct manager ID. Note:1. It is impossible to form a ring, that is, the superior of A is B, and the superior of B is A.2. The superior needs to be a current employee",
            )
            .optional(),
          dotted_line_leader_ids: z
            .array(z.string())
            .describe(
              "The employee's dotted-line manager ID, consistent with the employee_id_type type . Note:1. It is impossible to form a ring, that is, the superior of A is B, and the superior of B is A.2. The superior needs to be a current employee",
            )
            .optional(),
          work_country_or_region: z
            .string()
            .describe('Workplace country code. To obtain the country code, please use [Paging Bulk Query Country]')
            .optional(),
          work_place_id: z.string().describe('Workplace ID').optional(),
          work_station: z
            .object({
              default_value: z.string().describe('default value'),
              i18n_value: z
                .object({})
                .catchall(z.any())
                .describe('Internationalized value, key is zh_cn, ja_jp, en_us, value is the corresponding value')
                .optional(),
            })
            .describe('Workstation')
            .optional(),
          job_number: z
            .string()
            .describe('Job number. The job number of employees in the enterprise cannot be repeated')
            .optional(),
          extension_number: z
            .string()
            .describe(
              'Extension number, up to 99 characters can be entered.. The extension numbers of all employees in the enterprise cannot be repeated',
            )
            .optional(),
          join_date: z
            .string()
            .describe("Onboard DateThe fixed format is 'YYYY-MM-DD' and the fixed length is 10")
            .optional(),
          employment_type: z.number().describe('Employee type').optional(),
          job_title_id: z.string().describe('Job title ID').optional(),
          job_level_id: z.string().describe('Job level ID').optional(),
          job_family_id: z.string().describe('Job family ID').optional(),
          resign_date: z
            .string()
            .describe("date of separationThe fixed format is 'YYYY-MM-DD' and the fixed length is 10")
            .optional(),
          resign_reason: z
            .enum([
              '0',
              '1',
              '2',
              '3',
              '4',
              '5',
              '6',
              '7',
              '8',
              '9',
              '10',
              '11',
              '12',
              '13',
              '14',
              '15',
              '16',
              '17',
              '18',
              '19',
              '20',
              '21',
              '22',
              '23',
              '24',
              '25',
            ])
            .describe(
              'reason for leaving Options:0(resign_reason_directory_empty empty),1(resign_reason_directory_not_satisfied_with_salary Salary does not meet expectations),2(resign_reason_directory_working_pressure Working too long),3(resign_reason_directory_not_satisfied_with_work_content Dissatisfied with the job content),4(resign_reason_directory_lack_of_recognition_of_leader Do not recognize superiors or management),5(resign_reason_directory_career_development Career development opportunities are limited),6(resign_reason_directory_lack_of_recognition_of_company_culture Lack of recognition of company culture),7(resign_reason_directory_active_organize_business_adjustment Organizational restructuring (voluntary resignation)),8(resign_reason_directory_contract_not_renewed Contract expires),9(resign_reason_directory_job_hopping Job hopping),10(resign_reason_directory_change_career career change),11(resign_reason_directory_family Family reasons),12(resign_reason_directory_poor_health Poor health),13(resign_reason_directory_work_place Workplace reasons),14(resign_reason_directory_active_resignation_other_reason Other (voluntary resignation)),15(resign_reason_directory_accident accident),16(resign_reason_directory_death passed away),17(resign_reason_directory_fired dismiss),18(resign_reason_directory_failed_to_pass_probation_period Probation period not passed),19(resign_reason_directory_not_up_to_the_job Underperforming at work),20(resign_reason_directory_low_work_output Low work output),21(resign_reason_directory_passive_organize_business_adjustment Organizational restructuring (passive departure)),22(resign_reason_directory_breach_of_company_ordinance discipline violation),23(resign_reason_directory_break_the_law illegal),24(resign_reason_directory_passive_resignation_other_reason Other (passive resignation)),25(resign_reason_directory_other_reason Other)',
            )
            .optional(),
          resign_remark: z.string().describe('Resign remark').optional(),
          resign_type: z
            .enum(['0', '1', '2', '3'])
            .describe(
              'Resign type Options:0(resign_type_directory_empty empty),1(resign_type_directory_acitve active),2(resign_type_directory_passive inactive),3(resign_type_directoryy_other other)',
            )
            .optional(),
          is_frozen: z
            .boolean()
            .describe('Whether to freeze employee accounts.True to freeze, false to restore account')
            .optional(),
          custom_field_values: z
            .array(
              z.object({
                field_type: z
                  .enum(['1', '2', '3', '4', '9', '10', '11'])
                  .describe(
                    'Custom field type Options:1(custom_field_value_type_text Text),2(custom_field_value_type_url URL),3(custom_field_value_type_enum Options),4(custom_field_value_type_generic_user Members),9(custom_field_value_type_phone Phone ),10(custom_field_field_type_directory_multi_enum Multiple selection options),11(custom_field_field_type_directory_multi_generic_user Member list)',
                  )
                  .optional(),
                text_value: z
                  .object({
                    default_value: z.string().describe('default value'),
                    i18n_value: z
                      .object({})
                      .catchall(z.any())
                      .describe('Internationalized value, key is zh_cn, ja_jp, en_us, value is the corresponding value')
                      .optional(),
                  })
                  .describe('Text field value')
                  .optional(),
                url_value: z
                  .object({
                    link_text: z
                      .object({
                        default_value: z.string().describe('default value'),
                        i18n_value: z
                          .object({})
                          .catchall(z.any())
                          .describe(
                            'Internationalized value, key is zh_cn, ja_jp, en_us, value is the corresponding value',
                          )
                          .optional(),
                      })
                      .describe('page title'),
                    url: z.string().describe('Mobile end web link'),
                    pcurl: z.string().describe('Desktop web link'),
                  })
                  .describe('Web link field value')
                  .optional(),
                enum_value: z
                  .object({
                    enum_ids: z.array(z.string()).describe('Option result ID'),
                    enum_type: z
                      .enum(['1', '2'])
                      .describe(
                        'option type Options:1(custom_field_value_enum_type_text Text),2(custom_field_value_enum_type_picture picture)',
                      ),
                  })
                  .describe('enumeration')
                  .optional(),
                user_values: z
                  .array(
                    z.object({
                      ids: z.array(z.string()).describe('Person ID, consistent with the employee_id_type type'),
                    }),
                  )
                  .describe('Person field value')
                  .optional(),
                phone_value: z.object({ phone_number: z.string(), extension_number: z.string().optional() }).optional(),
                field_key: z.string().describe('Custom field key').optional(),
              }),
            )
            .describe('Custom field')
            .optional(),
        })
        .describe('Update employee object'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            'User ID categories Options:open_id(Identifies the identity of a user in an application. The same user has different Open IDs in different applications. [Learn more: How to get an Open ID]),union_id(Identifies the identity of a user under an application developer. The Union ID of the same user in an application under the same developer is the same, and the Union ID in an application under different developers is different. With Union ID, application developers can associate the identity of the same user in multiple applications. [Learn more: How to get Union ID?]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe('Department ID type Options:department_id(department_id),open_department_id(open_department_id)')
          .optional(),
      })
      .optional(),
    path: z.object({ employee_id: z.string().describe('Employee ID, consistent with the employee_id_type type.') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1EmployeeRegular = {
  project: 'directory',
  name: 'directory.v1.employee.regular',
  sdkName: 'directory.v1.employee.regular',
  path: '/open-apis/directory/v1/employees/:employee_id/regular',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Organization-Employee management-Update pre-resigned members to un-resigned employees-This interface is used to cancel the departure of the pending employee and update it to the "on-the-job" status. When canceling the departure, the departure information will be cleared.When using user_access_token, it defaults to an administrator user, and only administrators who can has "CoreHR Management" role can operate it',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            "User ID categories Options:open_id(Identifies a user to an app. The same user has different Open IDs in different apps. [How to get Open ID]),union_id(Identifies a user to a tenant that acts as a developer. A user has the same Union ID in apps developed by the same developer, and has different Union IDs in apps developed by different developers. A developer can use Union ID to link the same user's identities in multiple apps.[How to get Union ID]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)",
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Department ID type Options:department_id(Used to identify a unique department within the tenant ),open_department_id(Used to identify a department in a specific application. The same department has the same open_department_id in different applications.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ employee_id: z.string().describe('Employee ID, consistent with the employee_id_type type') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1EmployeeResurrect = {
  project: 'directory',
  name: 'directory.v1.employee.resurrect',
  sdkName: 'directory.v1.employee.resurrect',
  path: '/open-apis/directory/v1/employees/:employee_id/resurrect',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Organization-Employee management-Reinstate departed employees-This interface is used to restore the members who have left the company and restore them to the working state.',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        employee_order_in_departments: z
          .array(
            z.object({
              department_id: z
                .string()
                .describe('Department ID, consistent with the department_id_type type')
                .optional(),
              order_weight_in_deparment: z
                .string()
                .describe(
                  'The ranking weight of users within the department**Data verification rules:**Length range: 1 to 3',
                )
                .optional(),
              order_weight_among_deparments: z
                .string()
                .describe(
                  'User ranking weights across multiple departments**Data verification rules:**Length range: 1 to 3',
                )
                .optional(),
              is_main_department: z
                .boolean()
                .describe(
                  "Whether it is the user's main department (the user can only have one main department, and the ranking weight should be the largest. If you don't fill it in, the department with the first ranking will be used as the main department by default)",
                )
                .optional(),
            }),
          )
          .describe('Department information')
          .optional(),
        options: z
          .object({
            subscription_ids: z
              .array(z.string())
              .describe(
                'List of seat IDs assigned to employees. Available seat IDs for this tenant can be obtained through the interface below, see [Get seat information]. This field is required when in mixed license mode',
              )
              .optional(),
          })
          .describe('option')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            "User ID categories Options:open_id(Identifies a user's identity in an app. The same user has different Open IDs in different apps. [Learn more: How to get an Open ID]),union_id(Identifies a user's identity under an app developer. The Union ID is the same for the same user in apps under the same developer, and different for apps under different developers. With Union ID, app developers can associate the identities of the same user across multiple apps. [Read more: How do I get a Union ID?]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)",
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe('Department ID type Options:department_id(department_id),open_department_id(open_department_id)')
          .optional(),
      })
      .optional(),
    path: z.object({ employee_id: z.string().describe('Employee ID, consistent with the employee_id_type type') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1EmployeeSearch = {
  project: 'directory',
  name: 'directory.v1.employee.search',
  sdkName: 'directory.v1.employee.search',
  path: '/open-apis/directory/v1/employees/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Organization-Employee management-Search employee-This interface is used to search for employee information, such as searching for employee names, mobile phone numbers, email addresses and other information through keywords. An employee is a member of Feishu who is an "Employee", which is equivalent to a "User" in the Contacts OpenAPI',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      query: z
        .string()
        .describe(
          'Search keywords. Support the search of employee ID, employee name, employee mobile phone number, and employee mailbox. Among them, employee ID and employee mobile phone number support precise search, employee name and employee mailbox support fuzzy search, and employee name supports international name search',
        ),
      page_request: z
        .object({
          page_size: z
            .number()
            .describe(
              'The number of requests at this time, the minimum is 0 and the maximum is 100 **Default value**：20',
            )
            .optional(),
          page_token: z
            .string()
            .describe(
              'Sequential paging query, cannot skip page query, supports deep paging, and can only be used in scenarios where all data needs to be traversed.Pass the empty string for the first time or not, and then pass the page_token in the previous return value',
            )
            .optional(),
        })
        .describe('paging information'),
      required_fields: z
        .array(z.string())
        .describe(
          'List of fields to query. Permissioned row and column data will be returned according to the passed field list. If not passed, no fields will be returned [Learn more: Field enumeration instructions]',
        ),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            "User ID categories Options:open_id(Identifies a user to an app. The same user has different Open IDs in different apps. [How to get Open ID]),union_id(Identifies a user to a tenant that acts as a developer. A user has the same Union ID in apps developed by the same developer, and has different Union IDs in apps developed by different developers. A developer can use Union ID to link the same user's identities in multiple apps.[How to get Union ID]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)",
          )
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(It is used to identify a department in a specific application, and the same department has different open_department_id in different applications.),department_id(Used to identify a unique department within a tenant)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1EmployeeToBeResigned = {
  project: 'directory',
  name: 'directory.v1.employee.toBeResigned',
  sdkName: 'directory.v1.employee.toBeResigned',
  path: '/open-apis/directory/v1/employees/:employee_id/to_be_resigned',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Organization-Employee management-Update un-resigned employees to be resigned-This interface is used to handle the departure of current employees and update them to the status of "pending departure". "pending departure" employees will not automatically leave, and need to use the "delete employee" API to terminate and transfer resources.When using user_access_token, it defaults to an administrator user, and only administrators who have the "CoreHR Management" role can operate it',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      employee: z
        .object({
          resign_date: z.string().describe('date of separation'),
          resign_reason: z
            .enum([
              '1',
              '2',
              '3',
              '4',
              '5',
              '6',
              '7',
              '8',
              '9',
              '10',
              '11',
              '12',
              '13',
              '14',
              '15',
              '16',
              '17',
              '18',
              '19',
              '20',
              '21',
              '22',
              '23',
              '24',
              '25',
            ])
            .describe(
              'reason for leaving Options:1(resign_reason_directory_not_satisfied_with_salary Salary does not meet expectations),2(resign_reason_directory_working_pressure Working too long),3(resign_reason_directory_not_satisfied_with_work_content Dissatisfied with the job content),4(resign_reason_directory_lack_of_recognition_of_leader Do not recognize superiors or management),5(resign_reason_directory_career_development Career development opportunities are limited),6(resign_reason_directory_lack_of_recognition_of_company_culture Lack of recognition of company culture),7(resign_reason_directory_active_organize_business_adjustment Organizational restructuring (voluntary resignation)),8(resign_reason_directory_contract_not_renewed Contract expires),9(resign_reason_directory_job_hopping Job hopping),10(resign_reason_directory_change_career Career change),11(resign_reason_directory_family Family reasons),12(resign_reason_directory_poor_health Poor health),13(resign_reason_directory_work_place Workplace reasons),14(resign_reason_directory_active_resignation_other_reason Other (voluntary resignation)),15(resign_reason_directory_accident accident),16(resign_reason_directory_death passed away),17(resign_reason_directory_fired dismiss),18(resign_reason_directory_failed_to_pass_probation_period Probation period not passed),19(resign_reason_directory_not_up_to_the_job Underperforming at work),20(resign_reason_directory_low_work_output Low work output),21(resign_reason_directory_passive_organize_business_adjustment Organizational restructuring (passive departure)),22(resign_reason_directory_breach_of_company_ordinance discipline violation),23(resign_reason_directory_break_the_law illegal),24(resign_reason_directory_passive_resignation_other_reason Other (passive resignation)),25(resign_reason_directory_other_reason Other (other))',
            ),
          resign_type: z
            .enum(['1', '2', '3'])
            .describe(
              'type of turnover Options:1(resign_type_directory_acitve active),2(resign_type_directory_passive passive),3(resign_type_directoryy_other other)',
            ),
          resign_remark: z.string().describe('Resignation remarks').optional(),
        })
        .describe('Current employees transfer to pending departure'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            "User ID categories Options:open_id(Identifies a user to an app. The same user has different Open IDs in different apps. [How to get Open ID]),union_id(Identifies a user to a tenant that acts as a developer. A user has the same Union ID in apps developed by the same developer, and has different Union IDs in apps developed by different developers. A developer can use Union ID to link the same user's identities in multiple apps.[How to get Union ID]),employee_id(The unique identifier of an employee within the enterprise. Supports customization, the system automatically generates it if it is not customized. ID supports modification.How to get employee_id: - Enterprise administrators go to the Admin Console > Organizational Structure > Members and Departments page, click Member Details to query employee IDs - Through the interface of [Get employee list in batches], query employee ID by mobile phone number or email.)",
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Department ID type Options:department_id(Used to identify a unique department within the tenant),open_department_id(Used to identify a department in a specific application. The same department has the same open_department_id in different applications.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ employee_id: z.string().describe('Employee ID,consistent with the employee_id_type type') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const directoryV1Tools = [
  directoryV1CollaborationRuleCreate,
  directoryV1CollaborationRuleDelete,
  directoryV1CollaborationRuleList,
  directoryV1CollaborationRuleUpdate,
  directoryV1CollaborationTenantList,
  directoryV1CollborationShareEntityList,
  directoryV1DepartmentCreate,
  directoryV1DepartmentDelete,
  directoryV1DepartmentFilter,
  directoryV1DepartmentMget,
  directoryV1DepartmentPatch,
  directoryV1DepartmentSearch,
  directoryV1EmployeeCreate,
  directoryV1EmployeeDelete,
  directoryV1EmployeeFilter,
  directoryV1EmployeeMget,
  directoryV1EmployeePatch,
  directoryV1EmployeeRegular,
  directoryV1EmployeeResurrect,
  directoryV1EmployeeSearch,
  directoryV1EmployeeToBeResigned,
];
