import { z } from 'zod';
export type helpdeskV1ToolName =
  | 'helpdesk.v1.notification.cancelApprove'
  | 'helpdesk.v1.notification.cancelSend'
  | 'helpdesk.v1.notification.create'
  | 'helpdesk.v1.notification.executeSend'
  | 'helpdesk.v1.notification.get'
  | 'helpdesk.v1.notification.patch'
  | 'helpdesk.v1.notification.preview'
  | 'helpdesk.v1.notification.submitApprove';
export const helpdeskV1NotificationCancelApprove = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.cancelApprove',
  sdkName: 'helpdesk.v1.notification.cancelApprove',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id/cancel_approve',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-服务台-推送中心-取消审核-提交审核后，如果需要取消审核，则调用此接口',
  accessTokens: ['user'],
  schema: {
    path: z.object({ notification_id: z.string().describe('唯一ID') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const helpdeskV1NotificationCancelSend = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.cancelSend',
  sdkName: 'helpdesk.v1.notification.cancelSend',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id/cancel_send',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-服务台-推送中心-取消推送-取消推送接口，审核通过后待调度可以调用，发送过程中可以调用（会撤回已发送的消息），发送完成后可以需要推送（会撤回所有已发送的消息）',
  accessTokens: ['user'],
  schema: {
    data: z.object({ is_recall: z.boolean().describe('是否召回已发送的消息,新人入职消息同样适用') }),
    path: z.object({ notification_id: z.string().describe('唯一ID') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const helpdeskV1NotificationCreate = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.create',
  sdkName: 'helpdesk.v1.notification.create',
  path: '/open-apis/helpdesk/v1/notifications',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-服务台-推送中心-创建推送-调用接口创建推送，创建成功后为草稿状态',
  accessTokens: ['user'],
  schema: {
    data: z
      .object({
        id: z.string().describe('非必填，创建成功后返回').optional(),
        job_name: z.string().describe('必填，任务名称').optional(),
        status: z.number().describe('非必填，创建成功后返回').optional(),
        create_user: z
          .object({
            user_id: z.string().describe('非必填，用户id').optional(),
            avatar_url: z.string().describe('非必填，头像地址').optional(),
            name: z.string().describe('非必填，用户名称').optional(),
          })
          .describe('非必填，创建人')
          .optional(),
        created_at: z.string().describe('非必填，创建时间（毫秒时间戳）').optional(),
        update_user: z
          .object({
            user_id: z.string().describe('非必填，用户id').optional(),
            avatar_url: z.string().describe('非必填，头像地址').optional(),
            name: z.string().describe('非必填，用户名称').optional(),
          })
          .describe('非必填，更新用户')
          .optional(),
        updated_at: z.string().describe('非必填，更新时间（毫秒时间戳）').optional(),
        target_user_count: z.number().describe('非必填，目标推送用户总数').optional(),
        sent_user_count: z.number().describe('非必填，已推送用户总数').optional(),
        read_user_count: z.number().describe('非必填，已读用户总数').optional(),
        send_at: z.string().describe('非必填，推送任务触发时间（毫秒时间戳）').optional(),
        push_content: z
          .string()
          .describe('必填，推送内容，详见：https://open.feishu.cn/tool/cardbuilder?from=howtoguide')
          .optional(),
        push_type: z
          .number()
          .describe(
            '必填，0（定时推送：push_scope不能等于3） 1（新人入职推送：push_scope必须等于1或者3；new_staff_scope_type不能为空）',
          )
          .optional(),
        push_scope_type: z
          .number()
          .describe(
            '必填，推送范围（服务台私信） 0：组织内全部成员（user_list和department_list必须为空） 1：不推送任何成员（user_list和department_list必须为空，chat_list不可为空） 2：推送到部分成员（user_list或department_list不能为空） 3：入职新人 以上四种状态，chat_list都相对独立，只有在推送范围为1时，必须需要设置chat_list',
          )
          .optional(),
        new_staff_scope_type: z
          .number()
          .describe(
            '非必填，新人入职范围类型（push_type为1时生效） 0：组织内所有新人 1：组织内特定的部门（new_staff_scope_department_list 字段不能为空）',
          )
          .optional(),
        new_staff_scope_department_list: z
          .array(
            z.object({
              department_id: z.string().describe('部门ID').optional(),
              name: z.string().describe('非必填，部门名称').optional(),
            }),
          )
          .describe('非必填，新人入职生效部门列表')
          .optional(),
        user_list: z
          .array(
            z.object({
              user_id: z.string().describe('非必填，用户id').optional(),
              avatar_url: z.string().describe('非必填，头像地址').optional(),
              name: z.string().describe('非必填，用户名称').optional(),
            }),
          )
          .describe('非必填，push推送到成员列表')
          .optional(),
        department_list: z
          .array(
            z.object({
              department_id: z.string().describe('部门ID').optional(),
              name: z.string().describe('非必填，部门名称').optional(),
            }),
          )
          .describe('非必填，push推送到的部门信息列表')
          .optional(),
        chat_list: z
          .array(
            z.object({
              chat_id: z.string().describe('非必填，会话ID').optional(),
              name: z.string().describe('非必填，会话名称').optional(),
            }),
          )
          .describe('非必填，push推送到的会话列表(群)')
          .optional(),
        ext: z.string().describe('非必填，预留扩展字段').optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('用户ID类型').optional() })
      .optional(),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const helpdeskV1NotificationExecuteSend = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.executeSend',
  sdkName: 'helpdesk.v1.notification.executeSend',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id/execute_send',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-服务台-推送中心-执行推送-审核通过后调用此接口设置推送时间，等待调度系统调度，发送消息',
  accessTokens: ['user'],
  schema: {
    data: z.object({ send_at: z.string().describe('发送时间戳(毫秒)') }),
    path: z.object({ notification_id: z.string().describe('创建接口返回的唯一id') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const helpdeskV1NotificationGet = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.get',
  sdkName: 'helpdesk.v1.notification.get',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-服务台-推送中心-查询推送-查询推送详情',
  accessTokens: ['user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('用户ID类型').optional() })
      .optional(),
    path: z.object({ notification_id: z.string().describe('唯一ID') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const helpdeskV1NotificationPatch = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.patch',
  sdkName: 'helpdesk.v1.notification.patch',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-服务台-推送中心-更新推送-更新推送信息，只有在草稿状态下才可以调用此接口进行更新',
  accessTokens: ['user'],
  schema: {
    data: z
      .object({
        id: z.string().describe('非必填，创建成功后返回').optional(),
        job_name: z.string().describe('必填，任务名称').optional(),
        status: z.number().describe('非必填，创建成功后返回').optional(),
        create_user: z
          .object({
            user_id: z.string().describe('非必填，用户id').optional(),
            avatar_url: z.string().describe('非必填，头像地址').optional(),
            name: z.string().describe('非必填，用户名称').optional(),
          })
          .describe('非必填，创建人')
          .optional(),
        created_at: z.string().describe('非必填，创建时间（毫秒时间戳）').optional(),
        update_user: z
          .object({
            user_id: z.string().describe('非必填，用户id').optional(),
            avatar_url: z.string().describe('非必填，头像地址').optional(),
            name: z.string().describe('非必填，用户名称').optional(),
          })
          .describe('非必填，更新用户')
          .optional(),
        updated_at: z.string().describe('非必填，更新时间（毫秒时间戳）').optional(),
        target_user_count: z.number().describe('非必填，目标推送用户总数').optional(),
        sent_user_count: z.number().describe('非必填，已推送用户总数').optional(),
        read_user_count: z.number().describe('非必填，已读用户总数').optional(),
        send_at: z.string().describe('非必填，推送任务触发时间（毫秒时间戳）').optional(),
        push_content: z
          .string()
          .describe('必填，推送内容，详见：https://open.feishu.cn/tool/cardbuilder?from=howtoguide')
          .optional(),
        push_type: z
          .number()
          .describe(
            '必填，0（定时推送：push_scope不能等于3） 1（新人入职推送：push_scope必须等于1或者3；new_staff_scope_type不能为空）',
          )
          .optional(),
        push_scope_type: z
          .number()
          .describe(
            '必填，推送范围（服务台私信） 0：组织内全部成员（user_list和department_list必须为空） 1：不推送任何成员（user_list和department_list必须为空，chat_list不可为空） 2：推送到部分成员（user_list或department_list不能为空） 3：入职新人 以上四种状态，chat_list都相对独立，只有在推送范围为1时，必须需要设置chat_list',
          )
          .optional(),
        new_staff_scope_type: z
          .number()
          .describe(
            '非必填，新人入职范围类型（push_type为1时生效） 0：组织内所有新人 1：组织内特定的部门（new_staff_scope_department_list 字段不能为空）',
          )
          .optional(),
        new_staff_scope_department_list: z
          .array(
            z.object({
              department_id: z.string().describe('部门ID').optional(),
              name: z.string().describe('非必填，部门名称').optional(),
            }),
          )
          .describe('非必填，新人入职生效部门列表')
          .optional(),
        user_list: z
          .array(
            z.object({
              user_id: z.string().describe('非必填，用户id').optional(),
              avatar_url: z.string().describe('非必填，头像地址').optional(),
              name: z.string().describe('非必填，用户名称').optional(),
            }),
          )
          .describe('非必填，push推送到成员列表')
          .optional(),
        department_list: z
          .array(
            z.object({
              department_id: z.string().describe('部门ID').optional(),
              name: z.string().describe('非必填，部门名称').optional(),
            }),
          )
          .describe('非必填，push推送到的部门信息列表')
          .optional(),
        chat_list: z
          .array(
            z.object({
              chat_id: z.string().describe('非必填，会话ID').optional(),
              name: z.string().describe('非必填，会话名称').optional(),
            }),
          )
          .describe('非必填，push推送到的会话列表(群)')
          .optional(),
        ext: z.string().describe('非必填，预留扩展字段').optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('用户ID类型').optional() })
      .optional(),
    path: z.object({ notification_id: z.string().describe('push任务唯一id') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const helpdeskV1NotificationPreview = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.preview',
  sdkName: 'helpdesk.v1.notification.preview',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id/preview',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-服务台-推送中心-预览推送-在正式执行推送之前是可以调用此接口预览设置的推送内容',
  accessTokens: ['user'],
  schema: {
    path: z.object({ notification_id: z.string().describe('创建推送接口成功后返回的唯一id') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const helpdeskV1NotificationSubmitApprove = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.submitApprove',
  sdkName: 'helpdesk.v1.notification.submitApprove',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id/submit_approve',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-服务台-推送中心-提交审核-正常情况下调用创建推送接口后，就可以调用提交审核接口，如果创建人是服务台owner则会自动审核通过，否则会通知服务台owner审核此推送信息',
  accessTokens: ['user'],
  schema: {
    data: z.object({ reason: z.string().describe('提交审批理由') }),
    path: z.object({ notification_id: z.string().describe('创建接口返回的唯一id') }),
    useUAT: z.boolean().describe('使用用户身份请求, 否则使用应用身份').optional(),
  },
};
export const helpdeskV1Tools = [
  helpdeskV1NotificationCancelApprove,
  helpdeskV1NotificationCancelSend,
  helpdeskV1NotificationCreate,
  helpdeskV1NotificationExecuteSend,
  helpdeskV1NotificationGet,
  helpdeskV1NotificationPatch,
  helpdeskV1NotificationPreview,
  helpdeskV1NotificationSubmitApprove,
];
