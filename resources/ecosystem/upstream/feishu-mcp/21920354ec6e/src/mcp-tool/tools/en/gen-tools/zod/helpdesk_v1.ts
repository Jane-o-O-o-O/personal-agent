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
  description:
    '[Feishu/Lark]-Help Desk-Notification-Cancel approval-Call this API to cancel the review after submission',
  accessTokens: ['user'],
  schema: {
    path: z.object({ notification_id: z.string().describe('Unique ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const helpdeskV1NotificationCancelSend = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.cancelSend',
  sdkName: 'helpdesk.v1.notification.cancelSend',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id/cancel_send',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Help Desk-Notification-Cancel notification-Cancel push API. This API can be called when waiting for the scheduled sending after approval, during message sending (the message sent will be recalled), and after sending (all the messages sent will be recalled)',
  accessTokens: ['user'],
  schema: {
    data: z.object({
      is_recall: z
        .boolean()
        .describe('Whether to recall the sent message, also applicable to the message for new staff'),
    }),
    path: z.object({ notification_id: z.string().describe('Unique ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const helpdeskV1NotificationCreate = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.create',
  sdkName: 'helpdesk.v1.notification.create',
  path: '/open-apis/helpdesk/v1/notifications',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Help Desk-Notification-Create notification-The API is called to create a push, which is in draft status after being created',
  accessTokens: ['user'],
  schema: {
    data: z
      .object({
        id: z.string().describe('Optional, returned upon successful creation').optional(),
        job_name: z.string().describe('Required, task name').optional(),
        status: z.number().describe('Optional, returned upon successful creation').optional(),
        create_user: z
          .object({
            user_id: z.string().describe('Optional, user ID').optional(),
            avatar_url: z.string().describe('Optional, profile photo address').optional(),
            name: z.string().describe('Optional, user name').optional(),
          })
          .describe('Optional, creator')
          .optional(),
        created_at: z.string().describe('Optional, creation time (timestamp in ms)').optional(),
        update_user: z
          .object({
            user_id: z.string().describe('Optional, user ID').optional(),
            avatar_url: z.string().describe('Optional, profile photo address').optional(),
            name: z.string().describe('Optional, user name').optional(),
          })
          .describe('Optional, updated by')
          .optional(),
        updated_at: z.string().describe('Optional, last update (timestamp in ms)').optional(),
        target_user_count: z.number().describe('Optional, total number of target users pushed').optional(),
        sent_user_count: z.number().describe('Optional, total number of users pushed').optional(),
        read_user_count: z.number().describe('Optional, total number of users who have read').optional(),
        send_at: z.string().describe('Optional, push task trigger time (timestamp in ms)').optional(),
        push_content: z
          .string()
          .describe(
            'Required, push content. For details, visit https://open.feishu.cn/tool/cardbuilder?fromhelpdesk.v1.type.notification.prop.read_user_count.desc=$$$Optional, total number of users who have read',
          )
          .optional(),
        push_type: z
          .number()
          .describe(
            'Required,0 (Timed push: push_scope cannot be equal to 3), 1 (New staff onboarding push: push_scope must be equal to 1 or 3 new_staff_scope_type cannot be empty)',
          )
          .optional(),
        push_scope_type: z
          .number()
          .describe(
            'Required,push scope (Help Desk private message) 0: All members in the organization (user_list and department_list must be empty), 1: None of the members (user_list and department_list must be empty, and chat_list cannot be empty), 2: Specified members (user_list or department_list cannot be empty), 3: New staff. chat_list for these four scopes are relatively independent, and is only required when the push scope is 1.',
          )
          .optional(),
        new_staff_scope_type: z
          .number()
          .describe(
            'Optional,new staff enrollment scope type (effective when push_type is 1) 0: All new staff in the organization, 1: Specific department in the organization (new_staff_scope_department_list field cannot be empty)',
          )
          .optional(),
        new_staff_scope_department_list: z
          .array(
            z.object({
              department_id: z.string().describe('Department ID').optional(),
              name: z.string().describe('Optional, department name').optional(),
            }),
          )
          .describe('Optional, list of effective departments with onboarded employees')
          .optional(),
        user_list: z
          .array(
            z.object({
              user_id: z.string().describe('Optional, user ID').optional(),
              avatar_url: z.string().describe('Optional, profile photo address').optional(),
              name: z.string().describe('Optional, user name').optional(),
            }),
          )
          .describe('Optional, list of members to whom the message is pushed')
          .optional(),
        department_list: z
          .array(
            z.object({
              department_id: z.string().describe('Department ID').optional(),
              name: z.string().describe('Optional, department name').optional(),
            }),
          )
          .describe('Optional, list of departments to which the message is pushed')
          .optional(),
        chat_list: z
          .array(
            z.object({
              chat_id: z.string().describe('Optional, chat ID').optional(),
              name: z.string().describe('Optional, chat name').optional(),
            }),
          )
          .describe('Optional, list of group chats to which the message is pushed')
          .optional(),
        ext: z.string().describe('Optional, extended field reserved').optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const helpdeskV1NotificationExecuteSend = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.executeSend',
  sdkName: 'helpdesk.v1.notification.executeSend',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id/execute_send',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Help Desk-Notification-Push message-After approval, call this API to set the push time, and wait for the scheduling system to send the message',
  accessTokens: ['user'],
  schema: {
    data: z.object({ send_at: z.string().describe('Send the timestamp (in ms)') }),
    path: z.object({ notification_id: z.string().describe('The unique ID returned by the "Create push" API') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const helpdeskV1NotificationGet = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.get',
  sdkName: 'helpdesk.v1.notification.get',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Help Desk-Notification-Query notification-Query push details',
  accessTokens: ['user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ notification_id: z.string().describe('Unique ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const helpdeskV1NotificationPatch = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.patch',
  sdkName: 'helpdesk.v1.notification.patch',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Help Desk-Notification-Update notification-Update push message. This API can only be called when the message is in draft status',
  accessTokens: ['user'],
  schema: {
    data: z
      .object({
        id: z.string().describe('Optional, returned upon successful creation').optional(),
        job_name: z.string().describe('Required, task name').optional(),
        status: z.number().describe('Optional, returned upon successful creation').optional(),
        create_user: z
          .object({
            user_id: z.string().describe('Optional, user ID').optional(),
            avatar_url: z.string().describe('Optional, profile photo address').optional(),
            name: z.string().describe('Optional, user name').optional(),
          })
          .describe('Optional, creator')
          .optional(),
        created_at: z.string().describe('Optional, creation time (timestamp in ms)').optional(),
        update_user: z
          .object({
            user_id: z.string().describe('Optional, user ID').optional(),
            avatar_url: z.string().describe('Optional, profile photo address').optional(),
            name: z.string().describe('Optional, user name').optional(),
          })
          .describe('Optional, updated by')
          .optional(),
        updated_at: z.string().describe('Optional, last update (timestamp in ms)').optional(),
        target_user_count: z.number().describe('Optional, total number of target users pushed').optional(),
        sent_user_count: z.number().describe('Optional, total number of users pushed').optional(),
        read_user_count: z.number().describe('Optional, total number of users who have read').optional(),
        send_at: z.string().describe('Optional, push task trigger time (timestamp in ms)').optional(),
        push_content: z
          .string()
          .describe(
            'Required, push content. For details, visit https://open.feishu.cn/tool/cardbuilder?fromhelpdesk.v1.type.notification.prop.read_user_count.desc=$$$Optional, total number of users who have read',
          )
          .optional(),
        push_type: z
          .number()
          .describe(
            'Required,0 (Timed push: push_scope cannot be equal to 3), 1 (New staff onboarding push: push_scope must be equal to 1 or 3 new_staff_scope_type cannot be empty)',
          )
          .optional(),
        push_scope_type: z
          .number()
          .describe(
            'Required,push scope (Help Desk private message) 0: All members in the organization (user_list and department_list must be empty), 1: None of the members (user_list and department_list must be empty, and chat_list cannot be empty), 2: Specified members (user_list or department_list cannot be empty), 3: New staff. chat_list for these four scopes are relatively independent, and is only required when the push scope is 1.',
          )
          .optional(),
        new_staff_scope_type: z
          .number()
          .describe(
            'Optional,new staff enrollment scope type (effective when push_type is 1) 0: All new staff in the organization, 1: Specific department in the organization (new_staff_scope_department_list field cannot be empty)',
          )
          .optional(),
        new_staff_scope_department_list: z
          .array(
            z.object({
              department_id: z.string().describe('Department ID').optional(),
              name: z.string().describe('Optional, department name').optional(),
            }),
          )
          .describe('Optional, list of effective departments with onboarded employees')
          .optional(),
        user_list: z
          .array(
            z.object({
              user_id: z.string().describe('Optional, user ID').optional(),
              avatar_url: z.string().describe('Optional, profile photo address').optional(),
              name: z.string().describe('Optional, user name').optional(),
            }),
          )
          .describe('Optional, list of members to whom the message is pushed')
          .optional(),
        department_list: z
          .array(
            z.object({
              department_id: z.string().describe('Department ID').optional(),
              name: z.string().describe('Optional, department name').optional(),
            }),
          )
          .describe('Optional, list of departments to which the message is pushed')
          .optional(),
        chat_list: z
          .array(
            z.object({
              chat_id: z.string().describe('Optional, chat ID').optional(),
              name: z.string().describe('Optional, chat name').optional(),
            }),
          )
          .describe('Optional, list of group chats to which the message is pushed')
          .optional(),
        ext: z.string().describe('Optional, extended field reserved').optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ notification_id: z.string().describe('Push task unique ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const helpdeskV1NotificationPreview = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.preview',
  sdkName: 'helpdesk.v1.notification.preview',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id/preview',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Help Desk-Notification-Preview notification-This API can be called to preview the set push content before the push',
  accessTokens: ['user'],
  schema: {
    path: z.object({
      notification_id: z.string().describe('Unique ID returned after successful creation of the push API'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const helpdeskV1NotificationSubmitApprove = {
  project: 'helpdesk',
  name: 'helpdesk.v1.notification.submitApprove',
  sdkName: 'helpdesk.v1.notification.submitApprove',
  path: '/open-apis/helpdesk/v1/notifications/:notification_id/submit_approve',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Help Desk-Notification-Submit approval-Normally, the "Submit for review" API can be called after the "Create push" API is called. If the creator is the Help Desk owner, the push message will be automatically approved; otherwise, the Help Desk owner will be notified to review the push message',
  accessTokens: ['user'],
  schema: {
    data: z.object({ reason: z.string().describe('Submit reasons for approval') }),
    path: z.object({ notification_id: z.string().describe('The unique ID returned by the "Create push" API') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
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
