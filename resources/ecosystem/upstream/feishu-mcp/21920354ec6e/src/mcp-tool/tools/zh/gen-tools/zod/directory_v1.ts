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
    '[Feishu/Lark]-关联组织-可搜可见规则-新增可搜可见规则-管理员视角新增可搜可见规则。用户需具备关联组织管理员权限',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      subjects: z
        .object({
          open_user_ids: z.array(z.string()).describe('用户 open id，可以从我方通讯录/组织架构接口中获得').optional(),
          open_department_ids: z
            .array(z.string())
            .describe('部门 open id，0代表全部成员，可以从我方通讯录/组织架构接口中获得')
            .optional(),
          open_group_ids: z
            .array(z.string())
            .describe('用户组 open id，可以从我方通讯录/组织架构接口中获得')
            .optional(),
        })
        .describe('实体数量之和需要小于100'),
      objects: z
        .object({
          open_user_ids: z
            .array(z.string())
            .describe(
              '用户 open id，可以使用[获取关联组织双方共享成员范围]和[获取关联组织的部门和成员信息]来组合获取我方想要设置的关联组织部门/用户组和人员',
            )
            .optional(),
          open_department_ids: z
            .array(z.string())
            .describe(
              '部门 open id，0代表全部成员；可以使用[获取关联组织双方共享成员范围]和[获取关联组织的部门和成员信息]来组合获取我方想要设置的关联组织部门/用户组和人员',
            )
            .optional(),
          open_group_ids: z
            .array(z.string())
            .describe(
              '用户组 open id；可以使用[获取关联组织双方共享成员范围]和[获取关联组织的部门和成员信息]来组合获取我方想要设置的关联组织部门/用户组和人员',
            )
            .optional(),
        })
        .describe('实体数量之和需要小于100'),
    }),
    params: z.object({
      target_tenant_key: z.string().describe('对方组织的tenant key，可通过[管理员获取所有关联组织列表]获取'),
    }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1CollaborationRuleDelete = {
  project: 'directory',
  name: 'directory.v1.collaborationRule.delete',
  sdkName: 'directory.v1.collaborationRule.delete',
  path: '/open-apis/directory/v1/collaboration_rules/:collaboration_rule_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-关联组织-可搜可见规则-删除可搜可见规则-管理员视角删除可搜可见规则。用户需具备关联组织管理员权限',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      target_tenant_key: z.string().describe('对方组织的tenant key，可通过[管理员获取所有关联组织列表]获取'),
    }),
    path: z.object({ collaboration_rule_id: z.string().describe('规则ID，可通过[查询可搜可见规则]获得') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1CollaborationRuleList = {
  project: 'directory',
  name: 'directory.v1.collaborationRule.list',
  sdkName: 'directory.v1.collaborationRule.list',
  path: '/open-apis/directory/v1/collaboration_rules',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-关联组织-可搜可见规则-查询可搜可见规则-管理员视角查询可搜可见规则。用户需具备关联组织管理员权限',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      page_size: z.number().describe('分页大小').optional(),
      page_token: z
        .string()
        .describe(
          '分页标记，第一次请求不填，表示从头开始遍历；分页查询结果还有更多项时会同时返回新的 page_token，下次遍历可采用该 page_token 获取查询结果',
        )
        .optional(),
      target_tenant_key: z.string().describe('对方组织的tenant key，可通过[管理员获取所有关联组织列表]获取'),
    }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1CollaborationRuleUpdate = {
  project: 'directory',
  name: 'directory.v1.collaborationRule.update',
  sdkName: 'directory.v1.collaborationRule.update',
  path: '/open-apis/directory/v1/collaboration_rules/:collaboration_rule_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-关联组织-可搜可见规则-更新可搜可见规则-管理员视角更新可搜可见规则。用户需具备关联组织管理员权限',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      subjects: z
        .object({
          open_user_ids: z.array(z.string()).describe('用户 open id，可以使用通讯录/组织架构接口获取我方ID').optional(),
          open_department_ids: z
            .array(z.string())
            .describe('部门 open id，0代表全部成员。可以使用通讯录/组织架构接口获取我方ID')
            .optional(),
          open_group_ids: z
            .array(z.string())
            .describe('用户组 open id，可以使用通讯录/组织架构接口获取我方ID')
            .optional(),
        })
        .describe('实体数量之和需要小于100'),
      objects: z
        .object({
          open_user_ids: z
            .array(z.string())
            .describe(
              '用户 open id，可以使用[获取关联组织双方共享成员范围]和[获取关联组织的部门和成员信息]来组合获取我方想要设置的关联组织部门/用户组和人员',
            )
            .optional(),
          open_department_ids: z
            .array(z.string())
            .describe(
              '部门 open id，0代表全部成员；可以使用[获取关联组织双方共享成员范围]和[获取关联组织的部门和成员信息]来组合获取我方想要设置的关联组织部门/用户组和人员',
            )
            .optional(),
          open_group_ids: z
            .array(z.string())
            .describe(
              '用户组 open id，可以使用[获取关联组织双方共享成员范围]和[获取关联组织的部门和成员信息]来组合获取我方想要设置的关联组织部门/用户组和人员',
            )
            .optional(),
        })
        .describe('实体数量之和需要小于100'),
    }),
    params: z.object({
      target_tenant_key: z.string().describe('对方组织的tenant key，可通过[管理员获取所有关联组织列表]获取'),
    }),
    path: z.object({ collaboration_rule_id: z.string().describe('规则ID，可通过[查询可搜可见规则]获得') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1CollaborationTenantList = {
  project: 'directory',
  name: 'directory.v1.collaborationTenant.list',
  sdkName: 'directory.v1.collaborationTenant.list',
  path: '/open-apis/directory/v1/collaboration_tenants',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-关联组织-关联组织-管理员获取所有关联组织列表-在创建规则时，需要知道对方组织的tenant key，可通过该接口获取有效的tenant key。只允许关联组织管理员权限调用',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_size: z.number().describe('分页大小').optional(),
        page_token: z
          .string()
          .describe(
            '分页标记，第一次请求不填，表示从头开始遍历；分页查询结果还有更多项时会同时返回新的 page_token，下次遍历可采用该 page_token 获取查询结果',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1CollborationShareEntityList = {
  project: 'directory',
  name: 'directory.v1.collborationShareEntity.list',
  sdkName: 'directory.v1.collborationShareEntity.list',
  path: '/open-apis/directory/v1/share_entities',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-关联组织-关联组织-获取关联组织双方共享成员范围-在创建规则时，需要获取本组织以及对方组织人员、部门和用户组的ID，且这些实体都应该在关联组织的共享范围内。本接口可获取关联组织双方的共享范围下的人员、部门和用户组',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      target_tenant_key: z.string().describe('对方组织的tenant key，可通过[管理员获取所有关联组织列表]获取'),
      target_department_id: z
        .string()
        .describe(
          '不填写该参数时，查询整个组织的分享范围，可填写该字段继续下钻查看指定部门下的子部门+成员。填写0分为两种情况，若组织分享的为全员则展示一级部门，否则展示分享的部门+成员；可以递归使用该接口实现整个分享范围的下钻查询',
        )
        .optional(),
      target_group_id: z
        .string()
        .describe(
          '获取用户组下的成员，填写该值后忽略target_department_id；可以通过本接口参数返回的用户组ID继续本接口查询',
        )
        .optional(),
      is_select_subject: z.boolean().describe('是否主体组织分享范围，默认是客体组织的分享范围').optional(),
      page_token: z
        .string()
        .describe(
          '分页标记，第一次请求不填，表示从头开始遍历；分页查询结果还有更多项时会同时返回新的 page_token，下次遍历可采用该 page_token 获取查询结果',
        )
        .optional(),
      page_size: z.number().describe('分页大小').optional(),
    }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1DepartmentCreate = {
  project: 'directory',
  name: 'directory.v1.department.create',
  sdkName: 'directory.v1.department.create',
  path: '/open-apis/directory/v1/departments',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-组织架构-部门管理-创建部门-本接口用于用于在企业通讯录中创建新部门，支持设置部门名称、父部门、负责人等信息',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      department: z
        .object({
          custom_department_id: z
            .string()
            .describe(
              '标识租户内一个唯一的部门，支持自定义，未自定义时系统自动生成。ID支持修改。注意：1. 除需要满足正则规则外，同时不能以od-开头2. 正则校验：^[a-zA-Z0-9][a-zA-Z0-9_\\-@.]{0,63}$',
            )
            .optional(),
          name: z
            .object({
              default_value: z.string().describe('默认值'),
              i18n_value: z
                .object({})
                .catchall(z.any())
                .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                .optional(),
            })
            .describe('部门名称，最多可输入 100 字')
            .optional(),
          parent_department_id: z
            .string()
            .describe('父部门ID，与department_id_type类型保持一致。如果父部门为根部门，该参数值为 “0”')
            .optional(),
          leaders: z
            .array(
              z.object({
                leader_type: z
                  .number()
                  .describe(
                    '部门负责人类型 Options:1(department_leader_type_directory_main 主),2(department_leader_type_directory_deputy 副)',
                  ),
                leader_id: z.string().describe('部门负责人ID，与employee_id_type类型保持一致'),
              }),
            )
            .describe('部门负责人')
            .optional(),
          order_weight: z.string().describe('在上级部门下的排序权重，返回结果按order_weight降序排列').optional(),
          enabled_status: z.boolean().describe('是否启用').optional(),
          custom_field_values: z
            .array(
              z.object({
                field_type: z
                  .enum(['1', '2', '3', '4', '9', '10', '11'])
                  .describe(
                    '自定义字段类型 Options:1(custom_field_value_type_text 多行文本),2(custom_field_value_type_url 网页链接),3(custom_field_value_type_enum 枚举选项),4(custom_field_value_type_generic_user 人员),9(custom_field_value_type_phone 电话),10(custom_field_field_type_directory_multi_enum 多选枚举类型(目前仅支持文本类型)),11(custom_field_field_type_directory_multi_generic_user 人员列表)',
                  )
                  .optional(),
                text_value: z
                  .object({
                    default_value: z.string().describe('默认值'),
                    i18n_value: z
                      .object({})
                      .catchall(z.any())
                      .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                      .optional(),
                  })
                  .describe('文本字段值')
                  .optional(),
                url_value: z
                  .object({
                    link_text: z
                      .object({
                        default_value: z.string().describe('默认值'),
                        i18n_value: z
                          .object({})
                          .catchall(z.any())
                          .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                          .optional(),
                      })
                      .describe('网页标题'),
                    url: z.string().describe('移动端网页链接'),
                    pcurl: z.string().describe('桌面端网页链接'),
                  })
                  .describe('网页链接字段值')
                  .optional(),
                enum_value: z
                  .object({
                    enum_ids: z.array(z.string()).describe('选项结果ID'),
                    enum_type: z
                      .enum(['1', '2'])
                      .describe(
                        '选项类型 Options:1(custom_field_value_enum_type_text 文本),2(custom_field_value_enum_type_picture 图片)',
                      ),
                  })
                  .describe('枚举字段值')
                  .optional(),
                user_values: z
                  .array(z.object({ ids: z.array(z.string()).describe('人员ID，与employee_id_type类型保持一致') }))
                  .describe('人员字段值')
                  .optional(),
                phone_value: z
                  .object({
                    phone_number: z.string().describe('电话号'),
                    extension_number: z.string().describe('分机号').optional(),
                  })
                  .describe('电话字段值')
                  .optional(),
                field_key: z.string().describe('自定义字段key').optional(),
              }),
            )
            .describe('部门自定义字段值')
            .optional(),
        })
        .describe('创建部门'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            '此次调用中使用的部门ID的类型 Options:department_id(用来标识租户内一个唯一的部门),open_department_id(用来在具体某个应用中标识一个部门，同一个部门 在不同应用中的 open_department_id 不相同。)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1DepartmentDelete = {
  project: 'directory',
  name: 'directory.v1.department.delete',
  sdkName: 'directory.v1.department.delete',
  path: '/open-apis/directory/v1/departments/:department_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-组织架构-部门管理-删除部门-本接口用于删除部门',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            '此次调用中使用的部门ID的类型 Options:department_id(用来标识租户内一个唯一的部门),open_department_id(用来在具体某个应用中标识一个部门，同一个部门 在不同应用中的 open_department_id 不相同。)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ department_id: z.string().describe('部门ID，与department_id_type类型保持一致') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1DepartmentFilter = {
  project: 'directory',
  name: 'directory.v1.department.filter',
  sdkName: 'directory.v1.department.filter',
  path: '/open-apis/directory/v1/departments/filter',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-组织架构-部门管理-获取部门列表-本接口用于依据指定条件，批量获取符合条件的部门详情列表',
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
                  .describe('筛选条件的左值，值为字段的参数名称。**可选的筛选条件有：**- parent_department_id'),
                operator: z
                  .string()
                  .describe(
                    '比较操作符**可选值有：**- eq：等于，支持任何类型的左值- in：属于任一，不支持parent_department_id，右值为多个目标筛选值构成的数组（不得超过100个）',
                  ),
                value: z
                  .string()
                  .describe(
                    '筛选条件的右值，内容为左值字段类型及操作符组合下，对应的值类型。其取值类型需与查询参数department_id_type的取值一致，最大长度为64字符，支持数字和字母。使用parent_department_id条件时，根部门的ID可使用"0"',
                  ),
              }),
            )
            .describe('比较表达式列表。多个表达式之间的关系默认为“and”'),
        })
        .describe('查询条件[了解更多：查询条件用法]'),
      required_fields: z
        .array(z.string())
        .describe(
          '需要查询的字段列表。将按照传递的字段列表返回有权限的行、列数据。不传则不会返回任何字段[了解更多：字段枚举说明]',
        ),
      page_request: z
        .object({
          page_size: z.number().describe('本次请求条数，最大100条**默认值**：20**最小值**：0').optional(),
          page_token: z
            .string()
            .describe(
              '顺序分页查询，不能跳页查询，支持深分页，在需要遍历全部数据的场景只能使用该方式。第一次传空字符串或者不传，后面传上一次的返回值中的page_token',
            )
            .optional(),
        })
        .describe('分页信息'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            '此次调用中使用的部门ID的类型 Options:open_department_id(用来在具体某个应用中标识一个部门，同一个部门 在不同应用中的 open_department_id 相同。),department_id(用来标识租户内一个唯一的部门)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1DepartmentMget = {
  project: 'directory',
  name: 'directory.v1.department.mget',
  sdkName: 'directory.v1.department.mget',
  path: '/open-apis/directory/v1/departments/mget',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-组织架构-部门管理-批量获取部门信息-该接口支持传入多个部门ID，返回每个部门的详细信息（如名称、负责人、子部门等）',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      department_ids: z
        .array(z.string())
        .describe('部门ID，与department_id_type类型保持一致。id获取方式：可通过管理后台查询'),
      required_fields: z
        .array(z.string())
        .describe(
          '需要查询的字段列表。将按照传递的字段列表返回有权限的行、列数据。不传则不会返回任何字段[了解更多：字段枚举说明]',
        ),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            '此次调用中使用的部门ID的类型 Options:department_id(用来标识租户内一个唯一的部门),open_department_id(用来在具体某个应用中标识一个部门，同一个部门 在不同应用中的 open_department_id 相同。)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1DepartmentPatch = {
  project: 'directory',
  name: 'directory.v1.department.patch',
  sdkName: 'directory.v1.department.patch',
  path: '/open-apis/directory/v1/departments/:department_id',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-组织架构-部门管理-更新部门-本接口用于更新部门信息。仅更新显式传参的部分',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      department: z
        .object({
          custom_department_id: z
            .string()
            .describe(
              '自定义部门ID。注意：1. 除需要满足正则规则外，同时不能以od-开头2. 正则校验：^[a-zA-Z0-9][a-zA-Z0-9_\\-@.]{0,63}$**数据校验规则**：长度范围：1-64字符',
            )
            .optional(),
          name: z
            .object({
              default_value: z.string().describe('默认值'),
              i18n_value: z
                .object({})
                .catchall(z.any())
                .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                .optional(),
            })
            .describe('部门名称')
            .optional(),
          parent_department_id: z.string().describe('父部门ID,与department_id_type类型保持一致').optional(),
          leaders: z
            .array(
              z.object({
                leader_type: z
                  .number()
                  .describe(
                    '部门负责人类型 Options:1(department_leader_type_directory_main 主),2(department_leader_type_directory_deputy 副)',
                  ),
                leader_id: z.string().describe('部门负责人ID,与employee_id_type类型保持一致'),
              }),
            )
            .describe('部门负责人')
            .optional(),
          order_weight: z
            .string()
            .describe('在上级部门下的排序权重，返回结果将按照order_weight的值进行升序排列')
            .optional(),
          enabled_status: z.boolean().describe('是否启用').optional(),
          custom_field_values: z
            .array(
              z.object({
                field_type: z
                  .enum(['1', '2', '3', '4', '9', '10', '11'])
                  .describe(
                    '自定义字段类型 Options:1(custom_field_value_type_text 多行文本),2(custom_field_value_type_url 网页链接),3(custom_field_value_type_enum 枚举选项),4(custom_field_value_type_generic_user 人员),9(custom_field_value_type_phone 电话),10(custom_field_field_type_directory_multi_enum 多选枚举类型(目前仅支持文本类型)),11(custom_field_field_type_directory_multi_generic_user 人员列表)',
                  )
                  .optional(),
                text_value: z
                  .object({
                    default_value: z.string().describe('默认值'),
                    i18n_value: z
                      .object({})
                      .catchall(z.any())
                      .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                      .optional(),
                  })
                  .describe('文本字段值')
                  .optional(),
                url_value: z
                  .object({
                    link_text: z
                      .object({
                        default_value: z.string().describe('默认值'),
                        i18n_value: z
                          .object({})
                          .catchall(z.any())
                          .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                          .optional(),
                      })
                      .describe('网页标题'),
                    url: z.string().describe('移动端网页链接'),
                    pcurl: z.string().describe('桌面端网页链接'),
                  })
                  .describe('网页链接字段值')
                  .optional(),
                enum_value: z
                  .object({
                    enum_ids: z.array(z.string()).describe('选项结果ID'),
                    enum_type: z
                      .enum(['1', '2'])
                      .describe(
                        '选项类型 Options:1(custom_field_value_enum_type_text 文本),2(custom_field_value_enum_type_picture 图片)',
                      ),
                  })
                  .describe('枚举字段值')
                  .optional(),
                user_values: z
                  .array(z.object({ ids: z.array(z.string()).describe('人员ID，与employee_id_type类型保持一致') }))
                  .describe('人员字段值')
                  .optional(),
                phone_value: z
                  .object({
                    phone_number: z.string().describe('电话号'),
                    extension_number: z.string().describe('分机号长度范围：0-99字符').optional(),
                  })
                  .describe('电话字段值')
                  .optional(),
                field_key: z.string().describe('自定义字段key').optional(),
              }),
            )
            .describe('部门自定义字段值')
            .optional(),
        })
        .describe('更新部门信息'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            '此次调用中使用的部门ID的类型 Options:open_department_id(用来在具体某个应用中标识一个部门，同一个部门 在不同应用中的 open_department_id 不相同。),department_id(用来标识租户内一个唯一的部门)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ department_id: z.string().describe('部门ID，与department_id_type类型保持一致') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1DepartmentSearch = {
  project: 'directory',
  name: 'directory.v1.department.search',
  sdkName: 'directory.v1.department.search',
  path: '/open-apis/directory/v1/departments/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-组织架构-部门管理-搜索部门-本接口用于搜索部门信息，通过部门名称等关键词搜索部门信息，返回符合条件的部门列表',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      query: z.string().describe('搜索关键词。支持部门名称的搜索，最多可输入 100 字'),
      page_request: z
        .object({
          page_size: z.number().describe('本次请求条数，最大100条**默认值**：20**最小值**：0').optional(),
          page_token: z
            .string()
            .describe(
              '顺序分页查询，不能跳页查询，支持深分页，在需要遍历全部数据的场景只能使用该方式。第一次传空字符串或者不传，后面传上一次的返回值中的page_token',
            )
            .optional(),
        })
        .describe('分页信息'),
      required_fields: z
        .array(z.string())
        .describe(
          '需要查询的字段列表。将按照传递的字段列表返回有权限的行、列数据。不传则不会返回任何字段[了解更多：字段枚举说明]',
        ),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            '此次调用中使用的部门ID的类型 Options:open_department_id(用来在具体某个应用中标识一个部门，同一个部门 在不同应用中的 open_department_id 不相同。),department_id(用来标识租户内一个唯一的部门)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1EmployeeCreate = {
  project: 'directory',
  name: 'directory.v1.employee.create',
  sdkName: 'directory.v1.employee.create',
  path: '/open-apis/directory/v1/employees',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-组织架构-员工管理-创建员工-本接口用于在企业下创建员工。支持传入姓名、手机号等信息，生成在职状态的员工对象。员工指飞书企业内身份为「Employee」的成员，等同于通讯录OpenAPI中的「User」',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      employee: z
        .object({
          name: z
            .object({
              name: z
                .object({
                  default_value: z.string().describe('默认值最小长度：1字符'),
                  i18n_value: z
                    .object({})
                    .catchall(z.any())
                    .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                    .optional(),
                })
                .describe('员工的姓名，最多可输入 64 字'),
              another_name: z.string().describe('别名，最多可输入 64 字').optional(),
            })
            .describe('姓名')
            .optional(),
          mobile: z
            .string()
            .describe(
              '员工的手机号，最多可输入 255 字。注意：1. 在企业内的在职员工中不可重复。2. 未认证企业仅支持添加中国大陆手机号，通过飞书认证的企业允许添加海外手机号。3. 国际电话区号前缀中必须包含加号 +',
            )
            .optional(),
          custom_employee_id: z
            .string()
            .describe(
              '企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。注意：1. 在职员工的ID不可重复2. ID不能包含空格',
            )
            .optional(),
          avatar_key: z
            .string()
            .describe(
              '员工的头像key。获取图片的key请使用 [上传图片 - 服务端 API - 开发文档 - 飞书开放平台]，上传时图片类型需要选择 用于设置头像',
            )
            .optional(),
          email: z
            .string()
            .describe(
              '员工在工作中的邮箱。注意：1. 在企业内的在职员工中不可重复。2. 非中国大陆手机号成员必须同时添加邮箱',
            )
            .optional(),
          enterprise_email: z
            .string()
            .describe(
              '员工的企业邮箱。请先确保已在管理后台启用飞书邮箱服务。企业邮箱的域名需要企业在管理后台申请并开启。如果企业没有开启对应域名的企业邮箱，设置用户的企业邮箱会操作失败',
            )
            .optional(),
          gender: z
            .number()
            .describe(
              '性别 Options:0(gender_directory_unknown 未知),1(gender_directory_man 男),2(gender_directory_woman 女),3(gender_directory_other 其他)',
            )
            .optional(),
          employee_order_in_departments: z
            .array(
              z.object({
                department_id: z
                  .string()
                  .describe('指定员工所在的部门，标识企业内一个唯一的部门，与department_id_type类型保持一致')
                  .optional(),
                order_weight_in_deparment: z.string().describe('员工在部门内的排序权重').optional(),
                order_weight_among_deparments: z.string().describe('该部门在用户所属的多个部门间的排序权重').optional(),
                is_main_department: z
                  .boolean()
                  .describe(
                    '是否为用户的主部门（用户只能有一个主部门，且排序权重应最大，不填则默认使用排序第一的部门作为主部门),可选值:true/false',
                  )
                  .optional(),
              }),
            )
            .describe('员工在所属部门内的排序信息')
            .optional(),
          leader_id: z
            .string()
            .describe(
              '员工的直属上级ID，与employee_id_type类型保持一致。注意：1. 不可成环，即A的上级是B，B的上级是A。2. 上级需要是一个在职的员工',
            )
            .optional(),
          dotted_line_leader_ids: z
            .array(z.string())
            .describe(
              '员工的虚线上级ID，与employee_id_type类型保持一致。注意：1. 不可成环，即A的上级是B，B的上级是A。2. 上级需要是一个在职的员工',
            )
            .optional(),
          work_country_or_region: z
            .string()
            .describe('工作地国家/地区码。获取国家/地区的编码请使用 [分页批量查询国家/地区]')
            .optional(),
          work_place_id: z.string().describe('工作地点ID').optional(),
          work_station: z
            .object({
              default_value: z.string().describe('默认值'),
              i18n_value: z
                .object({})
                .catchall(z.any())
                .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                .optional(),
            })
            .describe('工位')
            .optional(),
          job_number: z.string().describe('工号。企业内在职员工的工号不可重复').optional(),
          extension_number: z.string().describe('分机号，最多可输入 99 字。企业内所有员工的分机号不可重复').optional(),
          join_date: z.string().describe('入职日期').optional(),
          employment_type: z.number().describe('员工类型').optional(),
          job_title_id: z.string().describe('职务ID').optional(),
          custom_field_values: z
            .array(
              z.object({
                field_type: z
                  .enum(['1', '2', '3', '4', '9', '10', '11'])
                  .describe(
                    '自定义字段类型 Options:1(custom_field_value_type_text 多行文本),2(custom_field_value_type_url 网页链接),3(custom_field_value_type_enum 枚举选项),4(custom_field_value_type_generic_user 人员),9(custom_field_value_type_phone 电话),10(custom_field_field_type_directory_multi_enum 多选枚举类型),11(custom_field_field_type_directory_multi_generic_user 人员列表)',
                  )
                  .optional(),
                text_value: z
                  .object({
                    default_value: z.string().describe('默认值最小长度：1字符'),
                    i18n_value: z
                      .object({})
                      .catchall(z.any())
                      .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                      .optional(),
                  })
                  .describe('文本字段值')
                  .optional(),
                url_value: z
                  .object({
                    link_text: z
                      .object({
                        default_value: z.string().describe('默认值长度范围：1-40字符'),
                        i18n_value: z
                          .object({})
                          .catchall(z.any())
                          .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                          .optional(),
                      })
                      .describe('网页标题'),
                    url: z.string().describe('移动端网页链接'),
                    pcurl: z.string().describe('桌面端网页链接'),
                  })
                  .describe('网页链接字段值')
                  .optional(),
                enum_value: z
                  .object({
                    enum_ids: z.array(z.string()).describe('选项结果ID'),
                    enum_type: z
                      .enum(['1', '2'])
                      .describe(
                        '选项类型 Options:1(custom_field_value_enum_type_text 文本),2(custom_field_value_enum_type_picture 图片)',
                      ),
                  })
                  .describe('枚举字段值')
                  .optional(),
                user_values: z
                  .array(z.object({ ids: z.array(z.string()).describe('人员ID，与employee_id_type类型保持一致') }))
                  .describe('人员字段值')
                  .optional(),
                phone_value: z
                  .object({
                    phone_number: z.string().describe('电话号'),
                    extension_number: z.string().describe('分机号').optional(),
                  })
                  .describe('电话字段值')
                  .optional(),
                field_key: z.string().describe('自定义字段key').optional(),
              }),
            )
            .describe('自定义字段')
            .optional(),
        })
        .describe('创建员工对象'),
      options: z
        .object({
          geo_name: z
            .string()
            .describe(
              '员工的数据驻留地。仅限开通了Multi-Geo的企业可选填，且仅能填入企业数据驻留地列表中的Geo。需要申请以下权限才能写入：<md-perm name="directory:employee.base.geo:write" desc="写入员工数据所在地" support_app_types="custom" tags="">写入员工数据所在地</md-perm>',
            )
            .optional(),
          subscription_ids: z
            .array(z.string())
            .describe(
              '分配给员工的席位ID列表。可通过下方接口获取到该租户的可用席位ID，参见[获取席位信息]。当在混合license模式下，此字段为必填。需要申请以下权限才能写入：<md-perm name="directory:employee.base.subscription_ids:write" desc="写入员工席位信息" support_app_types="custom" tags="">写入员工席位信息</md-perm>',
            )
            .optional(),
        })
        .describe('接口拓展选项')
        .optional(),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            '此次调用中使用的部门ID的类型 Options:department_id(用来标识租户内一个唯一的部门),open_department_id(用来在具体某个应用中标识一个部门，同一个部门 在不同应用中的 open_department_id 相同。)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1EmployeeDelete = {
  project: 'directory',
  name: 'directory.v1.employee.delete',
  sdkName: 'directory.v1.employee.delete',
  path: '/open-apis/directory/v1/employees/:employee_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-组织架构-员工管理-离职员工-本接口用于离职员工',
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
                    '部门群接收者。ID值与查询参数中的employee_id_type 对应。被删除用户为部门群群主时，转让群主给指定接收者，不指定接收者则默认转让给群内第一个入群的人',
                  )
                  .optional(),
                external_chat_acceptor_employee_id: z
                  .string()
                  .describe(
                    '外部群接收者。ID值与查询参数中的employee_id_type 对应。被删除用户为外部群群主时，转让群主给指定接收者，不指定接收者则默认转让给群内与被删除用户在同一组织的第一个入群的人，如果组织内只有该用户在群里，则解散外部群',
                  )
                  .optional(),
                docs_acceptor_employee_id: z
                  .string()
                  .describe(
                    '文档接收者。ID值与查询参数中的employee_id_type 对应。用户被删除时，其拥有的文档转让给接收者。不指定接收者则将文档资源保留在该用户名下',
                  )
                  .optional(),
                calendar_acceptor_employee_id: z
                  .string()
                  .describe(
                    '日程接收者。ID值与查询参数中的employee_id_type 对应。用户被删除时，其拥有的日程转让给接收者。不指定接收者则将日程资源保留在该用户名下',
                  )
                  .optional(),
                application_acceptor_employee_id: z
                  .string()
                  .describe(
                    '应用接受者。ID值与查询参数中的employee_id_type 对应。用户被删除时，其创建的应用转让给接收者，不指定接收者则保留应用在该用户名下，但该用户无法登录开发者后台进行应用管理，管理员可以在管理后台手动转移应用给其他人',
                  )
                  .optional(),
                helpdesk_acceptor_employee_id: z
                  .string()
                  .describe(
                    '服务台资源接收者。ID值与查询参数中的employee_id_type 对应。用户被删除时，其拥有的服务台资源转让给接收者，不指定接收者时保留服务台资源在该用户名下',
                  )
                  .optional(),
                approval_acceptor_employee_id: z
                  .string()
                  .describe(
                    '审批资源接收者。ID值与查询参数中的employee_id_type 对应。用户被删除时，其拥有的审批资源转让给接收者，不指定接收者时保留审批资源在该用户名下',
                  )
                  .optional(),
                email_acceptor_employee_id: z
                  .string()
                  .describe(
                    '用户邮件资源接收者。ID值与查询参数中的employee_id_type 对应。用户被删除时，其拥有的邮件资源转让给接收者，不指定接受者则保留邮件资源在该用户名下',
                  )
                  .optional(),
                minutes_acceptor_employee_id: z
                  .string()
                  .describe(
                    '妙记接收者。ID值与查询参数中的employee_id_type 对应。用户被删除时，其拥有的妙记资源转让给接收者。如果不指定接收者则将妙记保留在该用户名下',
                  )
                  .optional(),
                survey_acceptor_employee_id: z
                  .string()
                  .describe(
                    '飞书问卷接收者。ID值与查询参数中的employee_id_type 对应。用户被删除时，其拥有的飞书问卷资源转让给接收者，不指定接收者则直接删除飞书问卷资源',
                  )
                  .optional(),
                anycross_acceptor_employee_id: z.string().describe('集成平台资源Owner').optional(),
              })
              .describe('离职员工的资源转移方式')
              .optional(),
          })
          .describe('接口拓展选项')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      employee_id: z.string().describe('要离职的员工的ID。需要与查询参数中的employee_id_type类型保持一致'),
    }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1EmployeeFilter = {
  project: 'directory',
  name: 'directory.v1.employee.filter',
  sdkName: 'directory.v1.employee.filter',
  path: '/open-apis/directory/v1/employees/filter',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-组织架构-员工管理-批量获取员工列表-本接口用于依据指定条件，批量获取符合条件的员工详情列表。员工指飞书企业内身份为「Employee」的成员，等同于通讯录OpenAPI中的「User」',
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
                    '筛选条件的左值，值为字段的参数名称。可选的筛选条件有：- base_info.mobile- base_info.email- base_info.departments.department_id和work_info.staff_status（需同时指定）- work_info.job_number',
                  ),
                operator: z
                  .string()
                  .describe(
                    '比较操作符。可选值有：- eq：等于，支持任何类型的左值- in：属于任一各个字段支持的操作符可能不同，具体见[了解更多：查询条件用法]',
                  ),
                value: z
                  .string()
                  .describe(
                    '筛选条件的右值，为转义后的json字符串。- eq匹配字符串，使用 `"\\"str\\""`- in匹配字符串列表，使用 `"[\\"str\\"]"`- eq匹配数字，使用 `"123"`- in匹配数字列表，使用 `"[123]"`',
                  ),
              }),
            )
            .describe(
              '比较表达式列表，内容如 base_info.mobile eq `"\\"+8613000000001\\""`的比较条件，多个表达式之间的关系为且',
            ),
        })
        .describe('查询条件[了解更多：查询条件用法]'),
      required_fields: z
        .array(z.string())
        .describe(
          '需要查询的字段列表。将按照传递的字段列表返回有权限的行、列数据。不传则不会返回任何字段。[了解更多：字段枚举说明]',
        ),
      page_request: z
        .object({
          page_size: z.number().describe('本次请求条数，最小0条，最大100条').optional(),
          page_token: z
            .string()
            .describe(
              '顺序分页查询，不能跳页查询，支持深分页，在需要遍历全部数据的场景只能使用该方式。第一次传空字符串或者不传，后面传上一次的返回值中的page_token',
            )
            .optional(),
        })
        .describe('分页参数'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            '此次调用中使用的部门ID的类型 Options:department_id(用来标识租户内一个唯一的部门),open_department_id(用来在具体某个应用中标识一个部门，同一个部门 在不同应用中的 open_department_id 相同。)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1EmployeeMget = {
  project: 'directory',
  name: 'directory.v1.employee.mget',
  sdkName: 'directory.v1.employee.mget',
  path: '/open-apis/directory/v1/employees/mget',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-组织架构-员工管理-批量获取员工信息-本接口用于批量根据员工的ID查询员工的详情，比如员工姓名，手机号，邮箱，部门等信息。员工指飞书企业内身份为「Employee」的成员，等同于通讯录OpenAPI中的「User」',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      employee_ids: z.array(z.string()).describe('员工ID，与employee_id_type类型保持一致'),
      required_fields: z
        .array(z.string())
        .describe(
          '需要查询的字段列表。将按照传递的字段列表返回有权限的行、列数据。不传则不会返回任何字段。[了解更多：字段枚举说明]',
        ),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            '此次调用中使用的部门ID的类型 Options:department_id(用来标识租户内一个唯一的部门),open_department_id(用来在具体某个应用中标识一个部门，同一个部门 在不同应用中的 open_department_id 不相同。)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1EmployeePatch = {
  project: 'directory',
  name: 'directory.v1.employee.patch',
  sdkName: 'directory.v1.employee.patch',
  path: '/open-apis/directory/v1/employees/:employee_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-组织架构-员工管理-更新员工信息-本接口用于更新在职/离职员工的信息、冻结/恢复员工。未传递的参数不会进行更新。员工指飞书企业内身份为「Employee」的成员，等同于通讯录OpenAPI中的「User」',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      employee: z
        .object({
          name: z
            .object({
              name: z
                .object({
                  default_value: z.string().describe('默认值长度范围：1- 64 字符'),
                  i18n_value: z
                    .object({})
                    .catchall(z.any())
                    .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                    .optional(),
                })
                .describe('员工的姓名'),
              another_name: z.string().describe('别名，最多可输入 64 字').optional(),
            })
            .describe('姓名')
            .optional(),
          mobile: z
            .string()
            .describe(
              '员工的手机号，最多可输入 255 字。注意：1. 在企业内的在职员工中不可重复2. 未认证企业仅支持添加中国大陆手机号，通过飞书认证的企业允许添加海外手机号3. 国际电话区号前缀中必须包含加号 +',
            )
            .optional(),
          custom_employee_id: z
            .string()
            .describe(
              '企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。注意：1. 在职员工的ID不可重复。2. ID不能包含空格',
            )
            .optional(),
          avatar_key: z
            .string()
            .describe(
              '员工的头像key。获取图片的key请使用 [上传图片 - 服务端 API - 开发文档 - 飞书开放平台]，上传时图片类型需要选择 用于设置头像',
            )
            .optional(),
          email: z
            .string()
            .describe(
              '员工在工作中的邮箱。注意：1. 在企业内的在职员工中不可重复。2. 非中国大陆手机号成员必须同时添加邮箱',
            )
            .optional(),
          enterprise_email: z
            .string()
            .describe(
              '员工的企业邮箱。请先确保已在管理后台启用飞书邮箱服务。企业邮箱的域名需要企业在管理后台申请并开启。如果企业没有开启对应域名的企业邮箱，设置用户的企业邮箱会操作失败',
            )
            .optional(),
          gender: z
            .number()
            .describe(
              '性别 Options:0(gender_directory_unknown 未知),1(gender_directory_man 男),2(gender_directory_woman 女),3(gender_directory_other 其他)',
            )
            .optional(),
          employee_order_in_departments: z
            .array(
              z.object({
                department_id: z.string().describe('部门id，与department_id_type类型保持一致').optional(),
                order_weight_in_deparment: z.string().describe('员工在部门内的排序权重**数据校验规则：**').optional(),
                order_weight_among_deparments: z.string().describe('该部门在用户所属的多个部门间的排序权重').optional(),
                is_main_department: z
                  .boolean()
                  .describe(
                    '是否为用户的主部门（用户只能有一个主部门，且排序权重应最大，不填则默认使用排序第一的部门作为主部门)',
                  )
                  .optional(),
              }),
            )
            .describe('员工在所属部门内的排序信息')
            .optional(),
          background_image_key: z
            .string()
            .describe(
              '背景图的key。获取图片的key请使用 [上传图片 - 服务端 API - 开发文档 - 飞书开放平台]，上传时图片类型需要选择 用于发送消息',
            )
            .optional(),
          description: z.string().describe('员工的个性签名').optional(),
          leader_id: z
            .string()
            .describe('员工的直属上级ID。注意：1. 不可成环，即A的上级是B，B的上级是A。2. 上级需要是一个在职的员工')
            .optional(),
          dotted_line_leader_ids: z
            .array(z.string())
            .describe(
              '员工的虚线上级ID，与employee_id_type类型保持一致。注意：1. 不可成环，即A的上级是B，B的上级是A。2. 上级需要是一个在职的员工',
            )
            .optional(),
          work_country_or_region: z
            .string()
            .describe('工作地国家/地区码。获取国家/地区的编码请使用 [分页批量查询国家/地区]')
            .optional(),
          work_place_id: z.string().describe('工作地点ID').optional(),
          work_station: z
            .object({
              default_value: z.string().describe('默认值'),
              i18n_value: z
                .object({})
                .catchall(z.any())
                .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                .optional(),
            })
            .describe('工位')
            .optional(),
          job_number: z.string().describe('工号。企业内在职员工的工号不可重复').optional(),
          extension_number: z.string().describe('分机号，最多可输入 99 字。企业内所有员工的分机号不可重复').optional(),
          join_date: z.string().describe("入职日期固定格式为：'YYYY-MM-DD' , 固定长度为：10").optional(),
          employment_type: z.number().describe('员工类型').optional(),
          job_title_id: z.string().describe('职务ID').optional(),
          job_level_id: z.string().describe('职级ID').optional(),
          job_family_id: z.string().describe('序列ID').optional(),
          resign_date: z.string().describe("离职日期固定格式为：'YYYY-MM-DD' , 固定长度为：10").optional(),
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
              '离职原因 Options:0(resign_reason_directory_empty 置空),1(resign_reason_directory_not_satisfied_with_salary 薪酬不符合预期),2(resign_reason_directory_working_pressure 工作时间过长),3(resign_reason_directory_not_satisfied_with_work_content 不满意工作内容),4(resign_reason_directory_lack_of_recognition_of_leader 不认可上级或管理层),5(resign_reason_directory_career_development 职业发展机会有限),6(resign_reason_directory_lack_of_recognition_of_company_culture 对公司文化缺乏认同),7(resign_reason_directory_active_organize_business_adjustment 组织架构调整（主动离职）),8(resign_reason_directory_contract_not_renewed 合同到期),9(resign_reason_directory_job_hopping 跳槽),10(resign_reason_directory_change_career 转行),11(resign_reason_directory_family 家庭原因),12(resign_reason_directory_poor_health 健康状况不佳),13(resign_reason_directory_work_place 工作地点原因),14(resign_reason_directory_active_resignation_other_reason 其他(主动离职)),15(resign_reason_directory_accident 意外),16(resign_reason_directory_death 身故),17(resign_reason_directory_fired 解雇),18(resign_reason_directory_failed_to_pass_probation_period 试用期不通过),19(resign_reason_directory_not_up_to_the_job 工作表现不佳),20(resign_reason_directory_low_work_output 工作产出低),21(resign_reason_directory_passive_organize_business_adjustment 组织架构调整（被动离职）),22(resign_reason_directory_breach_of_company_ordinance 违纪),23(resign_reason_directory_break_the_law 违法),24(resign_reason_directory_passive_resignation_other_reason 其他（被动离职）),25(resign_reason_directory_other_reason 其他（其他）)',
            )
            .optional(),
          resign_remark: z.string().describe('离职备注信息').optional(),
          resign_type: z
            .enum(['0', '1', '2', '3'])
            .describe(
              '离职类型 Options:0(resign_type_directory_empty 置空),1(resign_type_directory_acitve 主动),2(resign_type_directory_passive 被动),3(resign_type_directoryy_other 其他)',
            )
            .optional(),
          is_frozen: z.boolean().describe('是否冻结员工账号。true为冻结，false为恢复账号').optional(),
          custom_field_values: z
            .array(
              z.object({
                field_type: z
                  .enum(['1', '2', '3', '4', '9', '10', '11'])
                  .describe(
                    '自定义字段类型 Options:1(custom_field_value_type_text 多行文本),2(custom_field_value_type_url 网页链接),3(custom_field_value_type_enum 枚举选项),4(custom_field_value_type_generic_user 人员),9(custom_field_value_type_phone 电话),10(custom_field_field_type_directory_multi_enum 多选枚举类型(目前仅支持文本类型)),11(custom_field_field_type_directory_multi_generic_user 人员列表)',
                  )
                  .optional(),
                text_value: z
                  .object({
                    default_value: z.string().describe('默认值'),
                    i18n_value: z
                      .object({})
                      .catchall(z.any())
                      .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                      .optional(),
                  })
                  .describe('文本字段值')
                  .optional(),
                url_value: z
                  .object({
                    link_text: z
                      .object({
                        default_value: z.string().describe('默认值'),
                        i18n_value: z
                          .object({})
                          .catchall(z.any())
                          .describe('国际化值，key为zh_cn, ja_jp, en_us, value为对应的值')
                          .optional(),
                      })
                      .describe('网页标题'),
                    url: z.string().describe('移动端网页链接'),
                    pcurl: z.string().describe('桌面端网页链接'),
                  })
                  .describe('网页链接字段值')
                  .optional(),
                enum_value: z
                  .object({
                    enum_ids: z.array(z.string()).describe('选项结果ID'),
                    enum_type: z
                      .enum(['1', '2'])
                      .describe(
                        '选项类型 Options:1(custom_field_value_enum_type_text 文本),2(custom_field_value_enum_type_picture 图片)',
                      ),
                  })
                  .describe('枚举')
                  .optional(),
                user_values: z
                  .array(z.object({ ids: z.array(z.string()).describe('人员ID，与employee_id_type类型保持一致') }))
                  .describe('人员字段值')
                  .optional(),
                phone_value: z
                  .object({
                    phone_number: z.string().describe('电话号'),
                    extension_number: z.string().describe('分机号').optional(),
                  })
                  .describe('电话字段值')
                  .optional(),
                field_key: z.string().describe('自定义字段key').optional(),
              }),
            )
            .describe('自定义字段')
            .optional(),
        })
        .describe('更新员工对象'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe('部门ID类型 Options:department_id(department_id),open_department_id(open_department_id)')
          .optional(),
      })
      .optional(),
    path: z.object({ employee_id: z.string().describe('员工ID，与employee_id_type类型保持一致') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1EmployeeRegular = {
  project: 'directory',
  name: 'directory.v1.employee.regular',
  sdkName: 'directory.v1.employee.regular',
  path: '/open-apis/directory/v1/employees/:employee_id/regular',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-组织架构-员工管理-更新待离职成员为在职-本接口用于为待离职员工取消离职，将其更新为「在职」状态。取消离职时会清空离职信息。使用user_access_token时默认为管理员用户，仅可操作「人事管理模式」的管理员可操作',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            '部门ID类型 Options:department_id(用来标识租户内一个唯一的部门),open_department_id(用来在具体某个应用中标识一个部门，同一个部门 在不同应用中的 open_department_id 相同。)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ employee_id: z.string().describe('员工ID，与employee_id_type类型保持一致') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1EmployeeResurrect = {
  project: 'directory',
  name: 'directory.v1.employee.resurrect',
  sdkName: 'directory.v1.employee.resurrect',
  path: '/open-apis/directory/v1/employees/:employee_id/resurrect',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-组织架构-员工管理-恢复离职员工-该接口用于恢复已离职的成员，恢复已离职成员至在职状态',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        employee_order_in_departments: z
          .array(
            z.object({
              department_id: z.string().describe('部门id，与department_id_type类型保持一致').optional(),
              order_weight_in_deparment: z
                .string()
                .describe('用户在部门内的排序权重**数据校验规则：**长度范围：1～ 3')
                .optional(),
              order_weight_among_deparments: z
                .string()
                .describe('用户多个部门间的排序权重**数据校验规则：**长度范围：1～ 3')
                .optional(),
              is_main_department: z
                .boolean()
                .describe(
                  '是否为用户的主部门（用户只能有一个主部门，且排序权重应最大，不填则默认使用排序第一的部门作为主部门)',
                )
                .optional(),
            }),
          )
          .describe('部门信息')
          .optional(),
        options: z
          .object({
            subscription_ids: z
              .array(z.string())
              .describe(
                '分配给员工的席位ID列表。可通过下方接口获取到该租户的可用席位ID，参见[获取席位信息]。当在混合license模式下，此字段为必填',
              )
              .optional(),
          })
          .describe('选项')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe('部门ID类型 Options:department_id(department_id),open_department_id(open_department_id)')
          .optional(),
      })
      .optional(),
    path: z.object({ employee_id: z.string().describe('员工ID，与employee_id_type类型保持一致') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1EmployeeSearch = {
  project: 'directory',
  name: 'directory.v1.employee.search',
  sdkName: 'directory.v1.employee.search',
  path: '/open-apis/directory/v1/employees/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-组织架构-员工管理-搜索员工信息-本接口用于搜索员工信息，如通过关键词搜索员工的名称、手机号、邮箱等信息。员工指飞书企业内身份为「Employee」的成员，等同于通讯录OpenAPI中的「User」',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      query: z
        .string()
        .describe(
          '搜索关键词。支持员工ID、员工名称、员工手机号、员工邮箱的搜索。其中员工ID、员工手机号支持精确搜索，员工名称、员工邮箱支持模糊搜索，员工名称支持国际化名称的搜索',
        ),
      page_request: z
        .object({
          page_size: z.number().describe('本次请求条数，最小是0条，最大100条**默认值**：20').optional(),
          page_token: z
            .string()
            .describe(
              '顺序分页查询，不能跳页查询，支持深分页，在需要遍历全部数据的场景只能使用该方式。第一次传空字符串或者不传，后面传上一次的返回值中的page_token',
            )
            .optional(),
        })
        .describe('分页信息'),
      required_fields: z
        .array(z.string())
        .describe(
          '需要查询的字段列表。将按照传递的字段列表返回有权限的行、列数据。不传则不会返回任何字段[了解更多：字段枚举说明]',
        ),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            '此次调用中使用的部门ID的类型 Options:open_department_id(用来在具体某个应用中标识一个部门，同一个部门 在不同应用中的 open_department_id 不相同。),department_id(用来标识租户内一个唯一的部门)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const directoryV1EmployeeToBeResigned = {
  project: 'directory',
  name: 'directory.v1.employee.toBeResigned',
  sdkName: 'directory.v1.employee.toBeResigned',
  path: '/open-apis/directory/v1/employees/:employee_id/to_be_resigned',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-组织架构-员工管理-更新在职员工为待离职-本接口用于为在职员工办理离职，将其更新为「待离职」状态。「待离职」员工不会自动离职，需要使用「离职员工」API操作离职和资源转交。使用user_access_token时默认为管理员用户，仅「人事管理模式」的管理员可操作',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      employee: z
        .object({
          resign_date: z.string().describe('离职日期'),
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
              '离职原因 Options:1(resign_reason_directory_not_satisfied_with_salary 薪酬不符合预期),2(resign_reason_directory_working_pressure 工作时间过长),3(resign_reason_directory_not_satisfied_with_work_content 不满意工作内容),4(resign_reason_directory_lack_of_recognition_of_leader 不认可上级或管理层),5(resign_reason_directory_career_development 职业发展机会有限),6(resign_reason_directory_lack_of_recognition_of_company_culture 对公司文化缺乏认同),7(resign_reason_directory_active_organize_business_adjustment 组织架构调整（主动离职）),8(resign_reason_directory_contract_not_renewed 合同到期),9(resign_reason_directory_job_hopping 跳槽),10(resign_reason_directory_change_career 转行),11(resign_reason_directory_family 家庭原因),12(resign_reason_directory_poor_health 健康状况不佳),13(resign_reason_directory_work_place 工作地点原因),14(resign_reason_directory_active_resignation_other_reason 其他(主动离职)),15(resign_reason_directory_accident 意外),16(resign_reason_directory_death 身故),17(resign_reason_directory_fired 解雇),18(resign_reason_directory_failed_to_pass_probation_period 试用期不通过),19(resign_reason_directory_not_up_to_the_job 工作表现不佳),20(resign_reason_directory_low_work_output 工作产出低),21(resign_reason_directory_passive_organize_business_adjustment 组织架构调整（被动离职）),22(resign_reason_directory_breach_of_company_ordinance 违纪),23(resign_reason_directory_break_the_law 违法),24(resign_reason_directory_passive_resignation_other_reason 其他（被动离职）),25(resign_reason_directory_other_reason 其他（其他）)',
            ),
          resign_type: z
            .enum(['1', '2', '3'])
            .describe(
              '离职类型 Options:1(resign_type_directory_acitve 主动),2(resign_type_directory_passive 被动),3(resign_type_directoryy_other 其他)',
            ),
          resign_remark: z.string().describe('离职备注').optional(),
        })
        .describe('在职员工流转到待离职'),
    }),
    params: z
      .object({
        employee_id_type: z
          .enum(['open_id', 'union_id', 'employee_id'])
          .describe(
            '用户 ID 类型 Options:open_id(标识一个用户在某个应用中的身份。同一个用户在不同应用中的 Open ID 不同。[了解更多：如何获取 Open ID]),union_id(标识一个用户在某个应用开发商下的身份。同一用户在同一开发商下的应用中的 Union ID 是相同的，在不同开发商下的应用中的 Union ID 是不同的。通过 Union ID，应用开发商可以把同个用户在多个应用中的身份关联起来。[了解更多：如何获取 Union ID？]),employee_id(企业内在职员工的唯一标识。支持自定义，未自定义时系统自动生成。ID支持修改。获取employee_id的方式： - 企业管理员在 管理后台 > 组织架构 > 成员与部门 页面，点击 成员详情，查询员工ID - 通过 [批量获取员工列表] 的接口，通过手机号或邮箱查询员工ID。)',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            '部门ID类型 Options:department_id(用来标识租户内一个唯一的部门),open_department_id(用来在具体某个应用中标识一个部门，同一个部门 在不同应用中的 open_department_id 相同。)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ employee_id: z.string().describe('员工ID，与employee_id_type类型保持一致') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
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
