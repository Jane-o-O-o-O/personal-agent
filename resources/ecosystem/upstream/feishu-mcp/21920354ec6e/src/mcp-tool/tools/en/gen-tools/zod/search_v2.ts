import { z } from 'zod';
export type searchV2ToolName =
  | 'search.v2.app.create'
  | 'search.v2.dataSource.create'
  | 'search.v2.dataSource.delete'
  | 'search.v2.dataSource.get'
  | 'search.v2.dataSourceItem.create'
  | 'search.v2.dataSourceItem.delete'
  | 'search.v2.dataSourceItem.get'
  | 'search.v2.dataSource.list'
  | 'search.v2.dataSource.patch'
  | 'search.v2.message.create'
  | 'search.v2.schema.create'
  | 'search.v2.schema.delete'
  | 'search.v2.schema.get'
  | 'search.v2.schema.patch';
export const searchV2AppCreate = {
  project: 'search',
  name: 'search.v2.app.create',
  sdkName: 'search.v2.app.create',
  path: '/open-apis/search/v2/app',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Search-Suite Search-Search app-users can search for visible applications by keyword, and the visibility of applications is consistent with the search in the suite',
  accessTokens: ['user'],
  schema: {
    data: z.object({ query: z.string().describe('Search keywords') }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        page_size: z.number().describe('Page size').optional(),
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
export const searchV2DataSourceCreate = {
  project: 'search',
  name: 'search.v2.dataSource.create',
  sdkName: 'search.v2.dataSource.create',
  path: '/open-apis/search/v2/data_sources',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Search-Search Connector-Data source-Create data source',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z.string(),
      state: z.number().describe('Options:0(Online 已上线),1(Offline 未上线)').optional(),
      description: z.string().optional(),
      icon_url: z.string().optional(),
      template: z.string().optional(),
      searchable_fields: z.array(z.string()).optional(),
      i18n_name: z
        .object({ zh_cn: z.string().optional(), en_us: z.string().optional(), ja_jp: z.string().optional() })
        .optional(),
      i18n_description: z
        .object({ zh_cn: z.string().optional(), en_us: z.string().optional(), ja_jp: z.string().optional() })
        .optional(),
      schema_id: z.string().optional(),
      app_id: z.string().optional(),
      connect_type: z
        .number()
        .describe(
          'Options:0(Default 调用搜索请求时，使用的是飞书搜索接口),1(Callback 调用搜索请求时，使用的是自定义回调函数的Uri)',
        )
        .optional(),
      connector_param: z
        .object({
          callback_user_id_type: z
            .number()
            .describe(
              'Options:0(Unknown 不合法),1(UserID 用户在租户内的身份),2(OpenID 用户在应用内的身份),3(UnionID 用户在同一应用服务商所开发的多个应用下的统一身份)',
            )
            .optional(),
          callback_endpoint: z.string().optional(),
        })
        .optional(),
      enable_answer: z.boolean().optional(),
    }),
  },
};
export const searchV2DataSourceDelete = {
  project: 'search',
  name: 'search.v2.dataSource.delete',
  sdkName: 'search.v2.dataSource.delete',
  path: '/open-apis/search/v2/data_sources/:data_source_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Search-Search Connector-Data source-Delete data source',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ data_source_id: z.string().describe('Unique ID of the data source') }),
  },
};
export const searchV2DataSourceGet = {
  project: 'search',
  name: 'search.v2.dataSource.get',
  sdkName: 'search.v2.dataSource.get',
  path: '/open-apis/search/v2/data_sources/:data_source_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Search-Search Connector-Data source-Get data source',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ data_source_id: z.string().describe('Unique identification of the data source') }),
  },
};
export const searchV2DataSourceItemCreate = {
  project: 'search',
  name: 'search.v2.dataSourceItem.create',
  sdkName: 'search.v2.dataSourceItem.create',
  path: '/open-apis/search/v2/data_sources/:data_source_id/items',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Search-Search Connector-Data item-Index data item',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      id: z.string(),
      acl: z.array(
        z.object({
          access: z.enum(['allow', 'deny']).describe('Options:allow(允许访问),deny(禁止访问)').optional(),
          value: z.string().optional(),
          type: z
            .enum([
              'user_id',
              'open_id',
              'union_id',
              'department_id',
              'open_department_id',
              'group_id',
              'app_group_id',
              'user',
              'group',
            ])
            .describe(
              'Options:user_id(UserID 用户在租户内的身份ID，详细说明请参考：https://open.feishu.cn/document/home/user-identity-introduction/introduction),open_id(OpenID 用户在应用内的身份ID，详细说明请参考：https://open.feishu.cn/document/home/user-identity-introduction/introduction),union_id(UnionID 用户在同一应用开发商提供的多个应用间的统一身份ID，详细说明请参考：https://open.feishu.cn/document/home/user-identity-introduction/introduction),department_id(DepartmentID 部门在租户内的唯一ID，详细说明请参考：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/contact-v3/department/field-overview#23857fe0),open_department_id(OpenDepartmentID 部门在应用内的唯一ID，详细说明请参考：https://open.feishu.cn/document/uAjLw4CM/ukTMukTMukTM/reference/contact-v3/department/field-overview#23857fe0),group_id(GroupID GroupID（灰度中，对部分租户开放）),app_group_id(AppGroupID AppGroupID（灰度中，对部分租户开放）),user(同 UserID),group(同 GroupID)',
            )
            .optional(),
        }),
      ),
      metadata: z.object({
        title: z.string(),
        source_url: z.string(),
        create_time: z.number().optional(),
        update_time: z.number().optional(),
        source_url_mobile: z.string().optional(),
      }),
      structured_data: z.string(),
      content: z
        .object({
          format: z.enum(['html', 'plaintext']).describe('Options:html(),plaintext()').optional(),
          content_data: z.string().optional(),
        })
        .optional(),
    }),
    path: z.object({ data_source_id: z.string().describe('ID of the data source') }),
  },
};
export const searchV2DataSourceItemDelete = {
  project: 'search',
  name: 'search.v2.dataSourceItem.delete',
  sdkName: 'search.v2.dataSourceItem.delete',
  path: '/open-apis/search/v2/data_sources/:data_source_id/items/:item_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Search-Search Connector-Data item-Delete data item',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      data_source_id: z.string().describe('ID of the data source'),
      item_id: z.string().describe('ID of the data record'),
    }),
  },
};
export const searchV2DataSourceItemGet = {
  project: 'search',
  name: 'search.v2.dataSourceItem.get',
  sdkName: 'search.v2.dataSourceItem.get',
  path: '/open-apis/search/v2/data_sources/:data_source_id/items/:item_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Search-Search Connector-Data item-Get data item-Get a single data record',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({
        data_source_id: z.string().describe('The id of the data source').optional(),
        item_id: z
          .string()
          .describe(
            'Unique identification of data records**Notice**:- This field is case sensitive.- If the call is successful but the return result is empty data, please check whether the value passed to this field is correct',
          )
          .optional(),
      })
      .optional(),
  },
};
export const searchV2DataSourceList = {
  project: 'search',
  name: 'search.v2.dataSource.list',
  sdkName: 'search.v2.dataSource.list',
  path: '/open-apis/search/v2/data_sources',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Search-Search Connector-Data source-Batch get data sources',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        view: z
          .number()
          .describe(
            'Return packet data format, 0-full data 1-summary data.**Note**: The summary data only contains "id", "name", "state". Options:0(FULL 全量数据),1(BASIC 摘要数据)',
          )
          .optional(),
        page_size: z.number().optional(),
        page_token: z.string().optional(),
      })
      .optional(),
  },
};
export const searchV2DataSourcePatch = {
  project: 'search',
  name: 'search.v2.dataSource.patch',
  sdkName: 'search.v2.dataSource.patch',
  path: '/open-apis/search/v2/data_sources/:data_source_id',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Search-Search Connector-Data source-Modify data source',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        name: z.string().describe('The display name of the data source').optional(),
        state: z
          .number()
          .describe('Data source status, 0-online, 1-offline Options:0(Online 已上线),1(Offline 未上线)')
          .optional(),
        description: z.string().describe('Description of the data source').optional(),
        icon_url: z.string().describe('The path of the display icon of the data source on the search tab').optional(),
        i18n_name: z
          .object({ zh_cn: z.string().optional(), en_us: z.string().optional(), ja_jp: z.string().optional() })
          .describe(
            'Data source name Multilingual configuration, json format, key is language locale, value is corresponding copy, for example {"zh_cn": "Test Data Source", "en_us": "Test DataSource"}',
          )
          .optional(),
        i18n_description: z
          .object({ zh_cn: z.string().optional(), en_us: z.string().optional(), ja_jp: z.string().optional() })
          .describe(
            'Data source description Multilingual configuration, json format, key is language locale, value is corresponding copy, for example {"zh_cn": "Search test data source related data", "en_us": "Search data from Test DataSource"}',
          )
          .optional(),
        connector_param: z
          .object({
            callback_user_id_type: z
              .number()
              .describe(
                'Options:0(Unknown 不合法),1(UserID 用户在租户内的身份),2(OpenID 用户在应用内的身份),3(UnionID 用户在同一应用服务商所开发的多个应用下的统一身份)',
              )
              .optional(),
            callback_endpoint: z.string().optional(),
          })
          .optional(),
        enable_answer: z.boolean().optional(),
      })
      .optional(),
    path: z.object({ data_source_id: z.string().describe('Unique identification of the data source') }),
  },
};
export const searchV2MessageCreate = {
  project: 'search',
  name: 'search.v2.message.create',
  sdkName: 'search.v2.message.create',
  path: '/open-apis/search/v2/message',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Search-Suite Search-search message-Users can search for visible messages by keyword, and the visibility is consistent with the search in the suite',
  accessTokens: ['user'],
  schema: {
    data: z.object({
      query: z.string().describe('Search Keyword'),
      from_ids: z.array(z.string()).describe('Messages From User IDs').optional(),
      chat_ids: z.array(z.string()).describe('Messages In Chat IDs').optional(),
      message_type: z
        .enum(['file', 'image', 'media'])
        .describe('Message type(file/image/media) Options:file(file),image(image),media(media)')
        .optional(),
      at_chatter_ids: z.array(z.string()).describe('At User IDs').optional(),
      from_type: z
        .enum(['bot', 'user'])
        .describe('Messages From Type(bot/user) Options:bot(bot),user(user)')
        .optional(),
      chat_type: z
        .enum(['group_chat', 'p2p_chat'])
        .describe('Message In Chat type(group_chat/p2p_chat) Options:group_chat(group_chat),p2p_chat(p2p_chat)')
        .optional(),
      start_time: z.string().describe('Message Start Time').optional(),
      end_time: z.string().describe('Message End Time').optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        page_size: z.number().describe('Page size').optional(),
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
export const searchV2SchemaCreate = {
  project: 'search',
  name: 'search.v2.schema.create',
  sdkName: 'search.v2.schema.create',
  path: '/open-apis/search/v2/schemas',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Search-Search Connector-Data schema-Create data schema',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      properties: z.array(
        z.object({
          name: z.string(),
          type: z
            .enum(['text', 'int', 'tag', 'timestamp', 'double', 'tinytext', 'user_ids'])
            .describe(
              'Options:text(长文本类型),int(64位整数类型),tag(标签类型),timestamp(Unix 时间戳类型（单位为秒）),double(浮点数类型（小数）),tinytext(短文本类型，（utf8 编码）长度小于 140 的文本),user_ids(UserIDs 用户ID类型（数组类型）)',
            ),
          is_searchable: z.boolean().optional(),
          is_sortable: z.boolean().optional(),
          is_returnable: z.boolean().optional(),
          sort_options: z
            .object({
              priority: z
                .number()
                .describe(
                  'Options:0(Zero 最高优先级),1(One 次高优先级),2(Two 次次高优先级),3(Three 次低优先级),4(Four 最低优先级)',
                )
                .optional(),
              order: z.enum(['asc', 'desc']).describe('Options:asc(升序),desc(降序)').optional(),
            })
            .optional(),
          type_definitions: z
            .object({
              tag: z
                .array(
                  z.object({
                    name: z.string(),
                    color: z
                      .enum(['red', 'green', 'blue', 'grey', 'yellow'])
                      .describe(
                        'Options:red(含警示性、敏感性的提示信息),green(表示成功、完成、完毕的提示信息),blue(组件架构、职能等中性信息),grey(中立系统提示信息（慎重使用）),yellow(焦点信息、推广性信息)',
                      ),
                    text: z.string(),
                  }),
                )
                .optional(),
              user_ids: z
                .object({
                  id_type: z
                    .enum(['open_id', 'union_id', 'user_id'])
                    .describe(
                      'Options:open_id(OpenID 用户在应用内的身份),union_id(UnionID 用户在同一应用服务商所开发的多个应用下的统一身份),user_id(UserID 用户在租户内的身份)',
                    ),
                })
                .optional(),
            })
            .optional(),
          search_options: z
            .object({
              enable_semantic_match: z.boolean().optional(),
              enable_exact_match: z.boolean().optional(),
              enable_prefix_match: z.boolean().optional(),
              enable_number_suffix_match: z.boolean().optional(),
              enable_camel_match: z.boolean().optional(),
            })
            .optional(),
          is_filterable: z.boolean().optional(),
          filter_options: z
            .object({
              display_name: z.string(),
              i18n_display_name: z
                .object({ zh_cn: z.string().optional(), en_us: z.string().optional(), ja_jp: z.string().optional() })
                .optional(),
              option_mode: z
                .enum(['single', 'multiple'])
                .describe('Options:single(该筛选器支持单选),multiple(该筛选器支持多选)')
                .optional(),
              associated_smart_filter: z
                .enum(['from', 'date'])
                .describe('Options:from(映射到综合“来自用户”筛选器),date(映射到综合“时间”筛选器)')
                .optional(),
              filter_type: z
                .enum(['user', 'time', 'searchable', 'predefine_enum'])
                .describe(
                  'Options:user(用户筛选器),time(时间筛选器),searchable(可搜筛选器),predefine_enum(PredefineEnum 预定义枚举筛选器)',
                )
                .optional(),
              predefine_enum_values: z.array(z.object({ name: z.string(), text: z.string() })).optional(),
              enable_client_filter: z.boolean().optional(),
              reference_datasource_id: z.string().optional(),
            })
            .optional(),
          answer_option: z
            .object({ is_searchable: z.boolean().optional(), is_returnable: z.boolean().optional() })
            .optional(),
          desc: z.string().optional(),
        }),
      ),
      display: z.object({
        card_key: z.literal('search_common_card').describe('Options:search_common_card(Common 普通 common 卡片)'),
        fields_mapping: z.array(z.object({ display_field: z.string(), data_field: z.string() })).optional(),
      }),
      schema_id: z.string(),
    }),
    params: z
      .object({ validate_only: z.boolean().describe('Whether it is only used to verify the legality').optional() })
      .optional(),
  },
};
export const searchV2SchemaDelete = {
  project: 'search',
  name: 'search.v2.schema.delete',
  sdkName: 'search.v2.schema.delete',
  path: '/open-apis/search/v2/schemas/:schema_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Search-Search Connector-Data schema-Delete data schema',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ schema_id: z.string().describe('Unique identification of user-defined data schema') }),
  },
};
export const searchV2SchemaGet = {
  project: 'search',
  name: 'search.v2.schema.get',
  sdkName: 'search.v2.schema.get',
  path: '/open-apis/search/v2/schemas/:schema_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Search-Search Connector-Data schema-Get data schema',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ schema_id: z.string().describe('Unique identification of user-defined data schema') }),
  },
};
export const searchV2SchemaPatch = {
  project: 'search',
  name: 'search.v2.schema.patch',
  sdkName: 'search.v2.schema.patch',
  path: '/open-apis/search/v2/schemas/:schema_id',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Search-Search Connector-Data schema-Modify data schema',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        display: z
          .object({
            card_key: z.literal('search_common_card').describe('Options:search_common_card(Common 普通 common 卡片)'),
            fields_mapping: z.array(z.object({ display_field: z.string(), data_field: z.string() })).optional(),
          })
          .describe('Data display related configuration')
          .optional(),
        properties: z
          .array(
            z.object({
              name: z.string(),
              desc: z.string().optional(),
              answer_option: z
                .object({ is_searchable: z.boolean().optional(), is_returnable: z.boolean().optional() })
                .optional(),
            }),
          )
          .optional(),
      })
      .optional(),
    path: z.object({ schema_id: z.string().describe('Unique identification of user-defined data schema') }),
  },
};
export const searchV2Tools = [
  searchV2AppCreate,
  searchV2DataSourceCreate,
  searchV2DataSourceDelete,
  searchV2DataSourceGet,
  searchV2DataSourceItemCreate,
  searchV2DataSourceItemDelete,
  searchV2DataSourceItemGet,
  searchV2DataSourceList,
  searchV2DataSourcePatch,
  searchV2MessageCreate,
  searchV2SchemaCreate,
  searchV2SchemaDelete,
  searchV2SchemaGet,
  searchV2SchemaPatch,
];
