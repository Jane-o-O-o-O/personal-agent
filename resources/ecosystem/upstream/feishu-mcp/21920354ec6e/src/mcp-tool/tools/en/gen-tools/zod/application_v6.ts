import { z } from 'zod';
export type applicationV6ToolName =
  | 'application.v6.appBadge.set'
  | 'application.v6.appRecommendRule.list'
  | 'application.v6.applicationAppUsage.departmentOverview'
  | 'application.v6.applicationAppUsage.messagePushOverview'
  | 'application.v6.applicationAppUsage.overview'
  | 'application.v6.applicationAppVersion.contactsRangeSuggest'
  | 'application.v6.applicationAppVersion.get'
  | 'application.v6.applicationAppVersion.list'
  | 'application.v6.applicationAppVersion.patch'
  | 'application.v6.applicationCollaborators.get'
  | 'application.v6.applicationCollaborators.update'
  | 'application.v6.application.contactsRangeConfiguration'
  | 'application.v6.applicationContactsRange.patch'
  | 'application.v6.applicationFeedback.list'
  | 'application.v6.applicationFeedback.patch'
  | 'application.v6.application.get'
  | 'application.v6.application.list'
  | 'application.v6.applicationManagement.update'
  | 'application.v6.applicationOwner.update'
  | 'application.v6.application.patch'
  | 'application.v6.application.underauditlist'
  | 'application.v6.applicationVisibility.checkWhiteBlackList'
  | 'application.v6.applicationVisibility.patch'
  | 'application.v6.scope.apply'
  | 'application.v6.scope.list';
export const applicationV6AppBadgeSet = {
  project: 'application',
  name: 'application.v6.appBadge.set',
  sdkName: 'application.v6.appBadge.set',
  path: '/open-apis/application/v6/app_badge/set',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-App Information-App Badge-Update app badge-Update app badge in workplace',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z.string().describe('user ID'),
      version: z.string().describe('Badge data version number'),
      extra: z.string().describe('Badge extra information').optional(),
      pc: z
        .object({
          web_app: z.number().describe('Number of badges for H5 capabilities').optional(),
          gadget: z.number().describe('Number of Mini Program Ability badges').optional(),
        })
        .describe('Number of PC badges')
        .optional(),
      mobile: z
        .object({
          web_app: z.number().describe('Number of badges for H5 capabilities').optional(),
          gadget: z.number().describe('Number of Mini Program Ability badges').optional(),
        })
        .describe('Number of mobile end badges')
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const applicationV6AppRecommendRuleList = {
  project: 'application',
  name: 'application.v6.appRecommendRule.list',
  sdkName: 'application.v6.appRecommendRule.list',
  path: '/open-apis/application/v6/app_recommend_rules',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Workplace-My favorite-Obtain the list of currently set recommend app rules',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number(),
      page_token: z.string().optional(),
      user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('User ID type').optional(),
    }),
  },
};
export const applicationV6ApplicationAppUsageDepartmentOverview = {
  project: 'application',
  name: 'application.v6.applicationAppUsage.departmentOverview',
  sdkName: 'application.v6.applicationAppUsage.departmentOverview',
  path: '/open-apis/application/v6/applications/:app_id/app_usage/department_overview',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-App Information-App Usage-Get an overview of multi-department application usage-Displays app usage data for a specific day, week, or month. You can filter data by sub-department level',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      date: z
        .string()
        .describe(
          'Queried date, in the format of yyyy-mm-dd. If cycle_type is 1, date can be any calendar day; if cycle_type is 2, date must be a Monday; if cycle_type is 3, date must be the first day of a month',
        ),
      cycle_type: z
        .number()
        .describe(
          'Statistical type of active period Options:1(Day Daily active users. Data for the queried calendar day is returned.),2(Week Weekly active users. Data for the calendar week that contains the queried date is returned. If the week has not ended, data for the period from Monday to the day before the current date is returned. For example, if data for the week of July 5, 2021 is queried on July 15, 2021, data from July 5, 2021 to July 11, 2021 is returned. If data for the week of July 5, 2021 is queried on July 8, 2021, data from July 5, 2021 to July 7, 2021 is returned.),3(Month Monthly active users. Data for the calendar month that contains the queried date is returned. If the month has not ended, data for the period from the 1st of the month to the day before the current date is returned. For example, if data for July is queried on August 15, 2021, data from July 1, 2021 to July 31, 2021 is returned. If data for August is queried on August 15, 2021, data from August 1, 2021 to August 14, 2021 is returned.)',
        ),
      department_id: z
        .string()
        .describe(
          'Queried department ID. For how to obtain it, see [Department ID overview].- If the department ID is empty, usage data for the current tenant is returned. If a department ID is specified, usage data for the current department (including sub-department users) and for multiple levels of sub-departments is returned.- If department_id_type in the path parameter is empty or is the open_department_id, this field should be the open_department_id of the department. If department_id_type in the path parameter is the department_id, this field should be the department_id of the department.- If this is not specified, data for the tenant is returned',
        )
        .optional(),
      recursion: z
        .number()
        .describe(
          'Whether to query the data of sub-departments under the department. When this is not set or is set to 0, only the department with the department_id is queried. When this is set to n, the data of the department with the department_id and its n levels of sub-departments is queried. This parameter is only valid when department_id is specified. The max value is 4',
        )
        .optional(),
      page_size: z.number().describe('Page size, in the range of 1-20').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Type of department ID used in the call Options:department_id(DepartmentId Identify the department with the custom department_id),open_department_id(OpenDepartmentId Identify the department with open_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ app_id: z.string().describe('App ID') }),
  },
};
export const applicationV6ApplicationAppUsageMessagePushOverview = {
  project: 'application',
  name: 'application.v6.applicationAppUsage.messagePushOverview',
  sdkName: 'application.v6.applicationAppUsage.messagePushOverview',
  path: '/open-apis/application/v6/applications/:app_id/app_usage/message_push_overview',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-App Information-App Usage-Get a message push overview-Displays bot message push data for a specific day, week, or month. You can filter data by department',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      date: z
        .string()
        .describe(
          'Queried date. If cycle_type is week, date must be a Monday. If cycle_type is month, date must be the first day of a month',
        ),
      cycle_type: z
        .number()
        .describe(
          'Enum values: day, week, month. week returns data for the calendar week that contains the queried date, or for the period from Monday to the day before the current date if the week has not ended. month returns data for the calendar month that contains the queried date. Options:1(Day Daily active users. Data for the queried calendar day is returned.),2(Week Weekly active users. Data for the calendar week that contains the queried date is returned. If the week has not ended, data for the period from Monday to the day before the current date is returned. For example, if data for the week of July 5, 2021 is queried on July 15, 2021, data from July 5, 2021 to July 11, 2021 is returned. If data for the week of July 5, 2021 is queried on July 8, 2021, data from July 5, 2021 to July 7, 2021 is returned.),3(Month Monthly active users. Data for the calendar month that contains the queried date is returned. If the month has not ended, data for the period from the 1st of the month to the day before the current date is returned. For example, if data for July is queried on August 15, 2021, data from July 1, 2021 to July 31, 2021 is returned. If data for August is queried on August 15, 2021, data from August 1, 2021 to August 14, 2021 is returned.)',
        ),
      department_id: z
        .string()
        .describe(
          'Department ID to be queried. For how to obtain it, see [Department ID overview].- If the department ID is empty, usage data for the current tenant is returned. If a department ID is specified, usage data for the current department (including sub-department users) is returned. - If department_id_type in the path parameter is empty or is the open_department_id, this field should be the open_department_id of the department. If department_id_type in the path parameter is the department_id, this field should be the department_id of the department. If no department is specified, usage data for the current tenant is returned',
        )
        .optional(),
    }),
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Type of department ID used in the call Options:department_id(DepartmentId Identify the department with the custom department_id),open_department_id(OpenDepartmentId Identify the department with open_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ app_id: z.string().describe('App ID. Custom apps are supported') }),
  },
};
export const applicationV6ApplicationAppUsageOverview = {
  project: 'application',
  name: 'application.v6.applicationAppUsage.overview',
  sdkName: 'application.v6.applicationAppUsage.overview',
  path: '/open-apis/application/v6/applications/:app_id/app_usage/overview',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-App Information-App Usage-Get App Usage Overview-Displays app usage data for a specific day, week, or month. You can view the app usage for the tenant or for a specific department',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      date: z
        .string()
        .describe(
          'Queried date, in the format of yyyy-mm-dd. If cycle_type is 1, date can be any calendar day; if cycle_type is 2, date must be a Monday; if cycle_type is 3, date must be the first day of a month',
        ),
      cycle_type: z
        .number()
        .describe(
          'Statistical type of active period Options:1(Day Daily active users. Data for the queried calendar day is returned.),2(Week Weekly active users. Data for the calendar week that contains the queried date is returned. If the week has not ended, data for the period from Monday to the day before the current date is returned. For example, if data for the week of July 5, 2021 is queried on July 15, 2021, data from July 5, 2021 to July 11, 2021 is returned. If data for the week of July 5, 2021 is queried on July 8, 2021, data from July 5, 2021 to July 7, 2021 is returned.),3(Month Monthly active users. Data for the calendar month that contains the queried date is returned. If the month has not ended, data for the period from the 1st of the month to the day before the current date is returned. For example, if data for July is queried on August 15, 2021, data from July 1, 2021 to July 31, 2021 is returned. If data for August is queried on August 15, 2021, data from August 1, 2021 to August 14, 2021 is returned.)',
        ),
      department_id: z
        .string()
        .describe(
          'Queried department ID. For how to obtain it, see [Department ID overview].- If the department ID is empty, usage data for the current tenant is returned. If a department ID is specified, usage data for the current department (including sub-department users) is returned. - If department_id_type in the path parameter is empty or is the open_department_id, this field should be the open_department_id of the department. If department_id_type in the path parameter is the department_id, this field should be the department_id of the department',
        )
        .optional(),
      ability: z
        .enum(['app', 'mp', 'h5', 'bot'])
        .describe(
          'Capability type. You can filter data by capability type to return corresponding activity data. Options:app(Returns overall app usage. Metric values include: uv: Active users; total_users: Cumulative users; new_users: New users; pv: page views in the app (gadget or web app); lifecycle: number of times the app (gadget or web app) is opened.),mp(Returns gadget data. Metric values include: uv (active users of the gadget), pv (page views by users in the gadget), lifecycle (number of times the gadget was opened).),h5(Returns web app data. Metric values include: uv (active users of web app), pv (page views in the web app), lifecycle (number of times the web app is opened).),bot(Returns bot data. Metric values include: uv (active users of bot).)',
        ),
    }),
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Type of department ID used in the call Options:department_id(DepartmentId Identify the department with the custom department_id),open_department_id(OpenDepartmentId Identify the department with open_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ app_id: z.string().describe('App ID') }),
  },
};
export const applicationV6ApplicationAppVersionContactsRangeSuggest = {
  project: 'application',
  name: 'application.v6.applicationAppVersion.contactsRangeSuggest',
  sdkName: 'application.v6.applicationAppVersion.contactsRangeSuggest',
  path: '/open-apis/application/v6/applications/:app_id/app_versions/:version_id/contacts_range_suggest',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-App Information-Application-Get the Range of Contacts Data to Access in an App's Version Release Request-This interface is used to obtain the permission scope of the contact of a certain version of the enterprise's self-built application according to the application's App ID and version ID",
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Type of the returned department ID Options:department_id(Identify the department with the custom department_id),open_department_id(Identify the department with open_department_id)',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({
      app_id: z
        .string()
        .describe(
          'App\'s app_id, get it from[Developer Console] > Credentials & Basic Info.To query the version information of other apps, you must request the<md-perm name="application:application.app_version:readonly" desc="Obtain app version information" support_app_types="custom" tags="">Obtain app version information</md-perm> scope. To only query the version information of this app, enter "me" or the app_id',
        ),
      version_id: z
        .string()
        .describe('ID that uniquely identifies the app version, get it from[Obtain app version list]'),
    }),
  },
};
export const applicationV6ApplicationAppVersionGet = {
  project: 'application',
  name: 'application.v6.applicationAppVersion.get',
  sdkName: 'application.v6.applicationAppVersion.get',
  path: '/open-apis/application/v6/applications/:app_id/app_versions/:version_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-App Information-Application-Get App Version Information-Obtains the version information of an app based on app_id and version_id',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      lang: z
        .enum(['zh_cn', 'en_us', 'ja_jp'])
        .describe('Language of app information Options:zh_cn(Chinese),en_us(English),ja_jp(Japanese)'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      app_id: z
        .string()
        .describe(
          'App\'s app_id. To query the version information of other apps, you must request the [Obtain app version information] scope. To only query the version information of this app, enter "me" or the app_id',
        ),
      version_id: z.string().describe('ID that uniquely identifies the app version'),
    }),
  },
};
export const applicationV6ApplicationAppVersionList = {
  project: 'application',
  name: 'application.v6.applicationAppVersion.list',
  sdkName: 'application.v6.applicationAppVersion.list',
  path: '/open-apis/application/v6/applications/:app_id/app_versions',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-App Information-Application-Obtain App Version List-Obtains the version list of an app based on app_id',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      lang: z
        .enum(['zh_cn', 'en_us', 'ja_jp'])
        .describe('Language of app information Options:zh_cn(Chinese),en_us(English),ja_jp(Japanese)'),
      page_size: z.number().optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      order: z
        .number()
        .describe('0：Sort by creation time from large to small. 1：Sort by creation time from small to large')
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      app_id: z
        .string()
        .describe(
          'App\'s app_id. To query the version information of other apps, you must request the [Obtain app version information] scope. To only query the version information of this app, enter "me" or the app_id',
        ),
    }),
  },
};
export const applicationV6ApplicationAppVersionPatch = {
  project: 'application',
  name: 'application.v6.applicationAppVersion.patch',
  sdkName: 'application.v6.applicationAppVersion.patch',
  path: '/open-apis/application/v6/applications/:app_id/app_versions/:version_id',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-App Information-Admin-Update version information-Updates the app version review status',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        status: z
          .number()
          .describe(
            'Version status Options:0(unknown Unknown status),1(audited Approved),2(reject Rejected),3(under_audit In review),4(unaudit Not submitted for review)',
          )
          .optional(),
      })
      .optional(),
    params: z.object({
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type'),
      operator_id: z.string().describe("Operator's open_id"),
      reject_reason: z
        .string()
        .describe('This field is required when you want to change the version status to "Rejected"')
        .optional(),
    }),
    path: z.object({
      app_id: z.string().describe('App ID'),
      version_id: z.string().describe('ID that uniquely identifies the app version'),
    }),
  },
};
export const applicationV6ApplicationCollaboratorsGet = {
  project: 'application',
  name: 'application.v6.applicationCollaborators.get',
  sdkName: 'application.v6.applicationCollaborators.get',
  path: '/open-apis/application/v6/applications/:app_id/collaborators',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-App Information-Application-Get a list of app collaborators-Get the collaborator information of the application (including the custom application and the store application) according to the app_id, including the owner, administrator, developer, operator of the application',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      app_id: z.string().describe('App ID, for more information on obtaining it, please refer to [app_id]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const applicationV6ApplicationCollaboratorsUpdate = {
  project: 'application',
  name: 'application.v6.applicationCollaborators.update',
  sdkName: 'application.v6.applicationCollaborators.update',
  path: '/open-apis/application/v6/applications/:app_id/collaborators',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-App Information-Application-Update application collaborators-Add/remove an app collaborator from an app (including self-built apps and store apps), and the collaborator will receive an add notification after adding it',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        adds: z
          .array(
            z.object({
              type: z
                .enum(['administrator', 'developer', 'operator'])
                .describe('Personnel type Options:administrator(administrator),developer(developer),operator(operate)'),
              user_id: z.string().describe('User ID, the ID type is consistent with the query parameter user_id_type'),
            }),
          )
          .describe('Add People')
          .optional(),
        removes: z.array(z.string()).describe('remove personnel').optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      app_id: z.string().describe('App ID, for more information on obtaining it, please refer to [app_id]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const applicationV6ApplicationContactsRangeConfiguration = {
  project: 'application',
  name: 'application.v6.application.contactsRangeConfiguration',
  sdkName: 'application.v6.application.contactsRangeConfiguration',
  path: '/open-apis/application/v6/applications/:app_id/contacts_range_configuration',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-App Information-Admin-Get the Range of Contacts Data an App Can Access-Get the contacts permissions configuration that is actually effective online for a self-built application in the current enterprise',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z.number().describe('Page size').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'Type of the returned department ID Options:department_id(Identify the department with the custom department_id),open_department_id(Identify the department with open_department_id)',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({
      app_id: z.string().describe("App's app_id, get it from [Developer Console] > Credentials & Basic Info"),
    }),
  },
};
export const applicationV6ApplicationContactsRangePatch = {
  project: 'application',
  name: 'application.v6.applicationContactsRange.patch',
  sdkName: 'application.v6.applicationContactsRange.patch',
  path: '/open-apis/application/v6/applications/:app_id/contacts_range',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-App Information-Admin-Update the contacts permission scope an app can access-Update the contacts permission scope of the custom app or store app in the enterprise, This API is only available to custom apps. The update takes effect immediately online',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      contacts_range_type: z
        .enum(['equal_to_availability', 'some', 'all'])
        .describe(
          'indicates the way how to update Options:equal_to_availability(the permission range of contacts will keep consistent with the range of App availability),some(the permission range of contacts will be partial, parameter "add_visible_list/del_visible_list" will take effect and do incremental updates),all(All contacts data can be accessed)',
        ),
      add_visible_list: z
        .object({
          user_ids: z
            .array(z.string())
            .describe('ID list of members, the category of ID is indicated by query parameter "user_id_type"')
            .optional(),
          department_ids: z
            .array(z.string())
            .describe('ID list of departments, the category of ID is indicated by query parameter "department_id_type"')
            .optional(),
          group_ids: z.array(z.string()).describe('ID list of groups').optional(),
        })
        .describe(
          'indicate some list which will add to visible list，The infomation of members within visible list can be accessed by appThis parameter take effect only if "contacts_range_type" is set to be "some"',
        )
        .optional(),
      del_visible_list: z
        .object({
          user_ids: z
            .array(z.string())
            .describe('ID list of members, the category of ID is indicated by query parameter "user_id_type"')
            .optional(),
          department_ids: z
            .array(z.string())
            .describe('ID list of departments, the category of ID is indicated by query parameter "department_id_type"')
            .optional(),
          group_ids: z.array(z.string()).describe('ID list of groups').optional(),
        })
        .describe(
          'indicate some list which will be deleted from visible listThis parameter take effect only if "contacts_range_type" is set to be "some"',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'Department ID categories Options:open_department_id(Identify the department with open_department_id),department_id(Identify the department with the custom department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      app_id: z.string().describe("App's app_id, get it from [Developer Console] > Credentials & Basic Info"),
    }),
  },
};
export const applicationV6ApplicationFeedbackList = {
  project: 'application',
  name: 'application.v6.applicationFeedback.list',
  sdkName: 'application.v6.applicationFeedback.list',
  path: '/open-apis/application/v6/applications/:app_id/feedbacks',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-App Information-app feedback-Get the app feedback list-Query application feedback data',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        from_date: z
          .string()
          .describe(
            'The end date of the query is in the format YYYY-MM-DD. Default is the current date.You can query only the data within 180 days',
          )
          .optional(),
        to_date: z
          .string()
          .describe(
            'The end date of the query in the format yyyy-mm-dd. Do not fill in the default is the current date',
          )
          .optional(),
        feedback_type: z
          .number()
          .describe(
            'Feedback type, do not fill in means that all feedback types are queried. Options:1(Fault Fault feedback),2(Advice Product Suggestions)',
          )
          .optional(),
        status: z
          .number()
          .describe(
            'Feedback processing status, do not fill in the query indicates that all processing types. Options:0(Unmarked Feedback not processed),1(Marked Feedback processed),2(Processing Feedback processing),3(Closed Feedback is closed)',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('Maximum number of feedback lists in this pull').optional(),
      })
      .optional(),
    path: z.object({ app_id: z.string().describe('Target Application ID (all applications created by this tenant)') }),
  },
};
export const applicationV6ApplicationFeedbackPatch = {
  project: 'application',
  name: 'application.v6.applicationFeedback.patch',
  sdkName: 'application.v6.applicationFeedback.patch',
  path: '/open-apis/application/v6/applications/:app_id/feedbacks/:feedback_id',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-App Information-app feedback-Update app feedback-Update application feedback data',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      status: z
        .number()
        .describe(
          'Feedback processing state Options:0(Unmarked Feedback not processed),1(Marked Feedback processed),2(Processing Feedback processing),3(Closed Feedback is closed)',
        ),
      operator_id: z
        .string()
        .describe(
          'Feedback handler id, the unique identifier of the user within the tenant, and the ID value corresponds to the user_id_type in the query parameter',
        ),
    }),
    path: z.object({
      app_id: z.string().describe('Target Application ID (all applications created by this tenant)'),
      feedback_id: z.string().describe('Application feedback record id'),
    }),
  },
};
export const applicationV6ApplicationGet = {
  project: 'application',
  name: 'application.v6.application.get',
  sdkName: 'application.v6.application.get',
  path: '/open-apis/application/v6/applications/:app_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-App Information-Application-Get Application Information-Obtains basic information of an app based on the app_id',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      lang: z
        .enum(['zh_cn', 'en_us', 'ja_jp'])
        .describe(
          'Specifies the language in which the app information is obtained Options:zh_cn(Chinese),en_us(English),ja_jp(Japanese)',
        ),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      app_id: z
        .string()
        .describe(
          'App\'s app_id. To query the information of other apps, you must request the [Obtain apps information] scope. To only query the information of this app, enter "me" or the app_id',
        ),
    }),
  },
};
export const applicationV6ApplicationList = {
  project: 'application',
  name: 'application.v6.application.list',
  sdkName: 'application.v6.application.list',
  path: '/open-apis/application/v6/applications',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-App Information-Admin-Obtain Applications Installed by an Organization-This interface is used to query the list of applications installed by the company, and can only be called by the self-built applications',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.string().describe('User ID type').optional(),
      lang: z.string(),
      status: z
        .number()
        .describe(
          'Options:0(AvailabilityStopped stopped),1(AvailabilityActivated enabled),2(AvailabilityUnactivated not enabled)',
        )
        .optional(),
      payment_type: z.number().describe('Options:0(Free),1(Paid)').optional(),
      owner_type: z
        .number()
        .describe(
          'Options:0(FeishuTechnology Feishu Technology),1(FeishuThirdParty Feishu partner),2(EnterpriseMember Members within the company)',
        )
        .optional(),
    }),
  },
};
export const applicationV6ApplicationManagementUpdate = {
  project: 'application',
  name: 'application.v6.applicationManagement.update',
  sdkName: 'application.v6.applicationManagement.update',
  path: '/open-apis/application/v6/applications/:app_id/management',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-App Information-Admin-Enable or disable application-You can deactivate or enable self-built apps and store apps that have been installed in the enterprise',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({ enable: z.boolean().describe('Enable/Deactivate Apps').optional() }).optional(),
    path: z.object({ app_id: z.string().describe('App ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const applicationV6ApplicationOwnerUpdate = {
  project: 'application',
  name: 'application.v6.applicationOwner.update',
  sdkName: 'application.v6.applicationOwner.update',
  path: '/open-apis/application/v6/applications/:app_id/owner',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-App Information-Application-Transfer application owner-Transfer the owner of a custom app to another person',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      owner_id: z.string().describe('New owner user ID, type determined by user_id_type in query parameters'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      app_id: z.string().describe('App ID, for more information on obtaining it, please refer to [app_id]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const applicationV6ApplicationPatch = {
  project: 'application',
  name: 'application.v6.application.patch',
  sdkName: 'application.v6.application.patch',
  path: '/open-apis/application/v6/applications/:app_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-App Information-Admin-Update application information-Updates app category information (Category changes can affect app sorting in Workplace, so proceed with caution)',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        common_categories: z.array(z.string()).describe('Internationalized description of categories').optional(),
      })
      .optional(),
    params: z.object({
      lang: z
        .enum(['zh_cn', 'en_us', 'ja_jp'])
        .describe('Specifies the language of returned results Options:zh_cn(Chinese),en_us(English),ja_jp(Japanese)'),
    }),
    path: z.object({ app_id: z.string().describe('App ID') }),
  },
};
export const applicationV6ApplicationUnderauditlist = {
  project: 'application',
  name: 'application.v6.application.underauditlist',
  sdkName: 'application.v6.application.underauditlist',
  path: '/open-apis/application/v6/applications/underauditlist',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-App Information-Admin-Get Application Release Request List-Displays the list of all custom apps pending review for this company',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      lang: z
        .enum(['zh_cn', 'en_us', 'ja_jp'])
        .describe('Specifies the language of returned results Options:zh_cn(Chinese),en_us(English),ja_jp(Japanese)'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.number().describe('paging size').optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
  },
};
export const applicationV6ApplicationVisibilityCheckWhiteBlackList = {
  project: 'application',
  name: 'application.v6.applicationVisibility.checkWhiteBlackList',
  sdkName: 'application.v6.applicationVisibility.checkWhiteBlackList',
  path: '/open-apis/application/v6/applications/:app_id/visibility/check_white_black_list',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-App Information-Admin-Obtain whether user in app visility white or black list-This api is used to query whether the user, department, or user group is in the white or black list of the application',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_ids: z
          .array(z.string())
          .describe(
            'The id list of the user you want to query, entered according to user_id_type, up to 100.You can call the [Obtain the list of users directly under a department] interface to obtain',
          )
          .optional(),
        department_ids: z
          .array(z.string())
          .describe(
            'The id list of the department you want to query, up to 100.You can call the [Obtain the list of sub-departments] interface to obtain',
          )
          .optional(),
        group_ids: z
          .array(z.string())
          .describe(
            'the id list of the user group you want to query, up to 100.You can call the [Query the list of user groups] interface to obtain it',
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
            'Department id categories Options:department_id(Identifies a department with a custom department_id),open_department_id(Identifies a department with open_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      app_id: z
        .string()
        .describe(
          'The AppID of the application can be viewed on the Developer Console > Credentials & Basic Info.When you need to query other application information, you must apply for <md-perm name="admin:app.info:readonly" desc="Obtain application information" support_app_types="custom" tags="">Get application information</md-perm> Permissions, when only querying the information of this application, you can fill the AppID of the application itself.Example value: "cli_xxxxx"',
        ),
    }),
  },
};
export const applicationV6ApplicationVisibilityPatch = {
  project: 'application',
  name: 'application.v6.applicationVisibility.patch',
  sdkName: 'application.v6.applicationVisibility.patch',
  path: '/open-apis/application/v6/applications/:app_id/visibility',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-App Information-Admin-Update app availability-Call this interface to update the available scope of the specified application. It supports updating the available scope of the current enterprise-built application or the available scope of the installed store application, including available personnel and disabled personnel. After the available scope is updated, it will take effect online immediately',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        add_visible_list: z
          .object({
            user_ids: z
              .array(z.string())
              .describe('ID list of members, the category of ID is indicated by query parameter "user_id_type"')
              .optional(),
            department_ids: z
              .array(z.string())
              .describe(
                'ID list of departments, the category of ID is indicated by query parameter "department_id_type"',
              )
              .optional(),
            group_ids: z.array(z.string()).describe('ID list of groups').optional(),
          })
          .describe(
            'indicate some list which will add to the white list, members within white list can see and use the Appthis parameter will not take effect If the parameter "is_visible_to_all" is not specified and the current range of App avaliablity is all members OR If the parameter "is_visible_to_all" is set to be "true"',
          )
          .optional(),
        del_visible_list: z
          .object({
            user_ids: z
              .array(z.string())
              .describe('ID list of members, the category of ID is indicated by query parameter "user_id_type"')
              .optional(),
            department_ids: z
              .array(z.string())
              .describe(
                'ID list of departments, the category of ID is indicated by query parameter "department_id_type"',
              )
              .optional(),
            group_ids: z.array(z.string()).describe('ID list of groups').optional(),
          })
          .describe(
            'indicate some list which will be deleted from the white listthis parameter will not take effect If the parameter "is_visible_to_all" is not specified and the current range of App avaliablity is all members OR If the parameter "is_visible_to_all" is set to be "true"',
          )
          .optional(),
        add_invisible_list: z
          .object({
            user_ids: z
              .array(z.string())
              .describe(
                'ID list of members, the category of ID is indicated by query parameter "user_id_type"Same members (user_id) can not be added to the block list again within 30 seconds, otherwise it will cause Api call failed',
              )
              .optional(),
            department_ids: z
              .array(z.string())
              .describe(
                'ID list of departments, the category of ID is indicated by query parameter "department_id_type"',
              )
              .optional(),
            group_ids: z.array(z.string()).describe('ID list of groups').optional(),
          })
          .describe(
            'indicate some list which will add to the block list, members within block list can not see or use the App',
          )
          .optional(),
        del_invisible_list: z
          .object({
            user_ids: z
              .array(z.string())
              .describe('ID list of members, the category of ID is indicated by query parameter "user_id_type"')
              .optional(),
            department_ids: z
              .array(z.string())
              .describe(
                'ID list of departments, the category of ID is indicated by query parameter "department_id_type"',
              )
              .optional(),
            group_ids: z.array(z.string()).describe('ID list of groups').optional(),
          })
          .describe('indicate some list which will be deleted from the block list')
          .optional(),
        is_visible_to_all: z
          .boolean()
          .describe(
            'whether the App is available to all members in enterprise true: Yes false: No; not specified: Maintain current statusparameter "add_visible_list/del_visible_list" will not take effect If this parameter is not specified and the current range of App avaliablity is all members OR If this parameter is set to be "true"',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'Department ID categories Options:open_department_id(Identify the department with open_department_id),department_id(Identify the department with the custom department_id)',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({
      app_id: z.string().describe("App's app_id, get it from [Developer Console] > Credentials & Basic Info"),
    }),
  },
};
export const applicationV6ScopeApply = {
  project: 'application',
  name: 'application.v6.scope.apply',
  sdkName: 'application.v6.scope.apply',
  path: '/open-apis/application/v6/scopes/apply',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-App Information-Permissions & Scopes-Apply for scopes from the admin-Call this interface to apply to the tenant administrator for the API permissions that need to be reviewed within the application as an application',
  accessTokens: ['tenant'],
  schema: {},
};
export const applicationV6ScopeList = {
  project: 'application',
  name: 'application.v6.scope.list',
  sdkName: 'application.v6.scope.list',
  path: '/open-apis/application/v6/scopes',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-App Information-Permissions & Scopes-Query tenant authorization status-Call this interface to query the status of the current app applying for authorization from the tenant',
  accessTokens: ['tenant'],
  schema: {},
};
export const applicationV6Tools = [
  applicationV6AppBadgeSet,
  applicationV6AppRecommendRuleList,
  applicationV6ApplicationAppUsageDepartmentOverview,
  applicationV6ApplicationAppUsageMessagePushOverview,
  applicationV6ApplicationAppUsageOverview,
  applicationV6ApplicationAppVersionContactsRangeSuggest,
  applicationV6ApplicationAppVersionGet,
  applicationV6ApplicationAppVersionList,
  applicationV6ApplicationAppVersionPatch,
  applicationV6ApplicationCollaboratorsGet,
  applicationV6ApplicationCollaboratorsUpdate,
  applicationV6ApplicationContactsRangeConfiguration,
  applicationV6ApplicationContactsRangePatch,
  applicationV6ApplicationFeedbackList,
  applicationV6ApplicationFeedbackPatch,
  applicationV6ApplicationGet,
  applicationV6ApplicationList,
  applicationV6ApplicationManagementUpdate,
  applicationV6ApplicationOwnerUpdate,
  applicationV6ApplicationPatch,
  applicationV6ApplicationUnderauditlist,
  applicationV6ApplicationVisibilityCheckWhiteBlackList,
  applicationV6ApplicationVisibilityPatch,
  applicationV6ScopeApply,
  applicationV6ScopeList,
];
