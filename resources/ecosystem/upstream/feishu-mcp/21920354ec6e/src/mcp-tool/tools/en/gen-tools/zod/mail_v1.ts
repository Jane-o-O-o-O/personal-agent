import { z } from 'zod';
export type mailV1ToolName =
  | 'mail.v1.mailgroupAlias.create'
  | 'mail.v1.mailgroupAlias.delete'
  | 'mail.v1.mailgroupAlias.list'
  | 'mail.v1.mailgroup.create'
  | 'mail.v1.mailgroup.delete'
  | 'mail.v1.mailgroup.get'
  | 'mail.v1.mailgroup.list'
  | 'mail.v1.mailgroupManager.batchCreate'
  | 'mail.v1.mailgroupManager.batchDelete'
  | 'mail.v1.mailgroupManager.list'
  | 'mail.v1.mailgroupMember.batchCreate'
  | 'mail.v1.mailgroupMember.batchDelete'
  | 'mail.v1.mailgroupMember.create'
  | 'mail.v1.mailgroupMember.delete'
  | 'mail.v1.mailgroupMember.get'
  | 'mail.v1.mailgroupMember.list'
  | 'mail.v1.mailgroup.patch'
  | 'mail.v1.mailgroupPermissionMember.batchCreate'
  | 'mail.v1.mailgroupPermissionMember.batchDelete'
  | 'mail.v1.mailgroupPermissionMember.create'
  | 'mail.v1.mailgroupPermissionMember.delete'
  | 'mail.v1.mailgroupPermissionMember.get'
  | 'mail.v1.mailgroupPermissionMember.list'
  | 'mail.v1.mailgroup.update'
  | 'mail.v1.publicMailboxAlias.create'
  | 'mail.v1.publicMailboxAlias.delete'
  | 'mail.v1.publicMailboxAlias.list'
  | 'mail.v1.publicMailbox.create'
  | 'mail.v1.publicMailbox.delete'
  | 'mail.v1.publicMailbox.get'
  | 'mail.v1.publicMailbox.list'
  | 'mail.v1.publicMailboxMember.batchCreate'
  | 'mail.v1.publicMailboxMember.batchDelete'
  | 'mail.v1.publicMailboxMember.clear'
  | 'mail.v1.publicMailboxMember.create'
  | 'mail.v1.publicMailboxMember.delete'
  | 'mail.v1.publicMailboxMember.get'
  | 'mail.v1.publicMailboxMember.list'
  | 'mail.v1.publicMailbox.patch'
  | 'mail.v1.publicMailbox.removeToRecycleBin'
  | 'mail.v1.publicMailbox.update'
  | 'mail.v1.userMailboxAlias.create'
  | 'mail.v1.userMailboxAlias.delete'
  | 'mail.v1.userMailboxAlias.list'
  | 'mail.v1.userMailbox.delete'
  | 'mail.v1.userMailboxEvent.subscribe'
  | 'mail.v1.userMailboxEvent.subscription'
  | 'mail.v1.userMailboxEvent.unsubscribe'
  | 'mail.v1.userMailboxFolder.create'
  | 'mail.v1.userMailboxFolder.delete'
  | 'mail.v1.userMailboxFolder.list'
  | 'mail.v1.userMailboxFolder.patch'
  | 'mail.v1.userMailboxMailContact.create'
  | 'mail.v1.userMailboxMailContact.delete'
  | 'mail.v1.userMailboxMailContact.list'
  | 'mail.v1.userMailboxMailContact.patch'
  | 'mail.v1.userMailboxMessageAttachment.downloadUrl'
  | 'mail.v1.userMailboxMessage.get'
  | 'mail.v1.userMailboxMessage.getByCard'
  | 'mail.v1.userMailboxMessage.list'
  | 'mail.v1.userMailboxMessage.send'
  | 'mail.v1.userMailboxRule.create'
  | 'mail.v1.userMailboxRule.delete'
  | 'mail.v1.userMailboxRule.list'
  | 'mail.v1.userMailboxRule.reorder'
  | 'mail.v1.userMailboxRule.update'
  | 'mail.v1.user.query';
export const mailV1MailgroupAliasCreate = {
  project: 'mail',
  name: 'mail.v1.mailgroupAlias.create',
  sdkName: 'mail.v1.mailgroupAlias.create',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/aliases',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Alias-Create A Mailing List Alias-Creates a mailing list alias',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ email_alias: z.string().describe('Alias address').optional() }).optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional() })
      .optional(),
  },
};
export const mailV1MailgroupAliasDelete = {
  project: 'mail',
  name: 'mail.v1.mailgroupAlias.delete',
  sdkName: 'mail.v1.mailgroupAlias.delete',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/aliases/:alias_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Alias-Delete A Mailing List Alias-Deletes a mailing list alias',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({
        mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional(),
        alias_id: z.string().describe('Mailing list alias email address').optional(),
      })
      .optional(),
  },
};
export const mailV1MailgroupAliasList = {
  project: 'mail',
  name: 'mail.v1.mailgroupAlias.list',
  sdkName: 'mail.v1.mailgroupAlias.list',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/aliases',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Alias-Obtain All Mailing List Aliases-Obtains all mailing list aliases',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({ mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional() })
      .optional(),
  },
};
export const mailV1MailgroupCreate = {
  project: 'mail',
  name: 'mail.v1.mailgroup.create',
  sdkName: 'mail.v1.mailgroup.create',
  path: '/open-apis/mail/v1/mailgroups',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Email-Mail Group-Mail Group Management-Create Mail Group-Creates a mailing list',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        email: z.string().describe('Mailing list address').optional(),
        name: z.string().describe('Mailing list name').optional(),
        description: z.string().describe('Mailing list description').optional(),
        who_can_send_mail: z
          .enum(['ANYONE', 'ALL_INTERNAL_USERS', 'ALL_GROUP_MEMBERS', 'CUSTOM_MEMBERS'])
          .describe(
            'Who can send emails to this mailing list Options:ANYONE(Anyone),ALL_INTERNAL_USERS(Organization members only),ALL_GROUP_MEMBERS(Mailing list members only),CUSTOM_MEMBERS(Specified members)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const mailV1MailgroupDelete = {
  project: 'mail',
  name: 'mail.v1.mailgroup.delete',
  sdkName: 'mail.v1.mailgroup.delete',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Email-Mail Group-Mail Group Management-Delete Mail Group-Deletes a mailing list',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({ mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional() })
      .optional(),
  },
};
export const mailV1MailgroupGet = {
  project: 'mail',
  name: 'mail.v1.mailgroup.get',
  sdkName: 'mail.v1.mailgroup.get',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Management-Query The Specified Mail Group-Obtains the information of a mailing list',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({ mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional() })
      .optional(),
  },
};
export const mailV1MailgroupList = {
  project: 'mail',
  name: 'mail.v1.mailgroup.list',
  sdkName: 'mail.v1.mailgroup.list',
  path: '/open-apis/mail/v1/mailgroups',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Management-Obtain Mailing Lists In Batch-Obtains mailing lists by pages',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        manager_user_id: z
          .string()
          .describe(
            'User ID of the mailing list administrator, which is used to obtain the mailing lists for which the user has the management permission',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().optional(),
      })
      .optional(),
  },
};
export const mailV1MailgroupManagerBatchCreate = {
  project: 'mail',
  name: 'mail.v1.mailgroupManager.batchCreate',
  sdkName: 'mail.v1.mailgroupManager.batchCreate',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/managers/batch_create',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Manager-Create Mailing List Managers In Batch-Adds managers to a mailing list',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        mailgroup_manager_list: z
          .array(z.object({ user_id: z.string().describe('Manager User ID').optional() }))
          .describe('Mail Group Manager List')
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional() })
      .optional(),
  },
};
export const mailV1MailgroupManagerBatchDelete = {
  project: 'mail',
  name: 'mail.v1.mailgroupManager.batchDelete',
  sdkName: 'mail.v1.mailgroupManager.batchDelete',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/managers/batch_delete',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Manager-Batch Delete Mail Group Managers-Batch delete mail group managers',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        mailgroup_manager_list: z
          .array(z.object({ user_id: z.string().describe('Manager User ID').optional() }))
          .describe('Mail Group Manager List')
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional() })
      .optional(),
  },
};
export const mailV1MailgroupManagerList = {
  project: 'mail',
  name: 'mail.v1.mailgroupManager.list',
  sdkName: 'mail.v1.mailgroupManager.list',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/managers',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Manager-Obtain Mailing List Managers In Batch-Obtains the list of mailing list managers by pages',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z.number().optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional() })
      .optional(),
  },
};
export const mailV1MailgroupMemberBatchCreate = {
  project: 'mail',
  name: 'mail.v1.mailgroupMember.batchCreate',
  sdkName: 'mail.v1.mailgroupMember.batchCreate',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/members/batch_create',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Member-Batch Create Mail Group Members-You can add multiple members to a mail group at a time',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        items: z
          .array(
            z.object({
              member_id: z
                .string()
                .describe(
                  'Unique identifier of the member in the mailing list（This is not required in the request body）',
                )
                .optional(),
              email: z
                .string()
                .describe(
                  "Member's email address (this field has a value when member type is EXTERNAL_USER/MAIL_GROUP/OTHER_MEMBER)",
                )
                .optional(),
              user_id: z
                .string()
                .describe(
                  'Unique identifier of the user in the tenant (this field has a value when member type is USER)',
                )
                .optional(),
              department_id: z
                .string()
                .describe(
                  'Unique identifier of the department in the tenant (this field has a value when member type is DEPARTMENT)',
                )
                .optional(),
              type: z
                .enum([
                  'USER',
                  'DEPARTMENT',
                  'COMPANY',
                  'EXTERNAL_USER',
                  'MAIL_GROUP',
                  'PUBLIC_MAILBOX',
                  'OTHER_MEMBER',
                ])
                .describe(
                  'Member type Options:USER(Internal user),DEPARTMENT(Department),COMPANY(All staff),EXTERNAL_USER(External user),MAIL_GROUP(Mailing list),PUBLIC_MAILBOX(Public Mailbox),OTHER_MEMBER(Internal member)',
                )
                .optional(),
            }),
          )
          .describe('List of mailing group members added this time')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call Options:department_id(Identify departments with custom department_id),open_department_id(Identify departments by open_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('The unique ID or email address of a mail group').optional() })
      .optional(),
  },
};
export const mailV1MailgroupMemberBatchDelete = {
  project: 'mail',
  name: 'mail.v1.mailgroupMember.batchDelete',
  sdkName: 'mail.v1.mailgroupMember.batchDelete',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/members/batch_delete',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Member-Batch Delete Mail Group Members-Multiple members of a mail group can be deleted in one request',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({ member_id_list: z.array(z.string()).describe('List of member IDs deleted by this call').optional() })
      .optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('The unique ID or email address of a mail group').optional() })
      .optional(),
  },
};
export const mailV1MailgroupMemberCreate = {
  project: 'mail',
  name: 'mail.v1.mailgroupMember.create',
  sdkName: 'mail.v1.mailgroupMember.create',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/members',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Member-Create A Mailing List Member-Adds a member to a mailing list',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        email: z
          .string()
          .describe(
            "Member's email address (this field has a value when member type is EXTERNAL_USER/MAIL_GROUP/OTHER_MEMBER)",
          )
          .optional(),
        user_id: z
          .string()
          .describe('Unique identifier of the user in the tenant (this field has a value when member type is USER)')
          .optional(),
        department_id: z
          .string()
          .describe(
            'Unique identifier of the department in the tenant (this field has a value when member type is DEPARTMENT)',
          )
          .optional(),
        type: z
          .enum(['USER', 'DEPARTMENT', 'COMPANY', 'EXTERNAL_USER', 'MAIL_GROUP', 'PUBLIC_MAILBOX', 'OTHER_MEMBER'])
          .describe(
            'Member type Options:USER(Internal user),DEPARTMENT(Department),COMPANY(All staff),EXTERNAL_USER(External user),MAIL_GROUP(Mailing list),PUBLIC_MAILBOX(Public Mailbox),OTHER_MEMBER(Internal member)',
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
            'Type of department ID used in this call Options:department_id(Identify the department with the custom department_id),open_department_id(Identify the department with open_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional() })
      .optional(),
  },
};
export const mailV1MailgroupMemberDelete = {
  project: 'mail',
  name: 'mail.v1.mailgroupMember.delete',
  sdkName: 'mail.v1.mailgroupMember.delete',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/members/:member_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Member-Delete A Mailing List Member-Deletes a mailing list member',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({
        mailgroup_id: z.string().describe('The unique ID or email address of a mail group').optional(),
        member_id: z.string().describe('The unique ID of a member in this mail group').optional(),
      })
      .optional(),
  },
};
export const mailV1MailgroupMemberGet = {
  project: 'mail',
  name: 'mail.v1.mailgroupMember.get',
  sdkName: 'mail.v1.mailgroupMember.get',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/members/:member_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Member-Obtain Mailing List Member Information-Obtains the information of a mailing list member',
  accessTokens: ['tenant'],
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
      })
      .optional(),
    path: z
      .object({
        mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional(),
        member_id: z.string().describe('Unique identifier of the member in the mailing list').optional(),
      })
      .optional(),
  },
};
export const mailV1MailgroupMemberList = {
  project: 'mail',
  name: 'mail.v1.mailgroupMember.list',
  sdkName: 'mail.v1.mailgroupMember.list',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/members',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Member-Obtain Mailing List Members In Batch-Obtains the list of mailing list members by pages',
  accessTokens: ['tenant'],
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
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().optional(),
      })
      .optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('The unique ID or email address of a mail group').optional() })
      .optional(),
  },
};
export const mailV1MailgroupPatch = {
  project: 'mail',
  name: 'mail.v1.mailgroup.patch',
  sdkName: 'mail.v1.mailgroup.patch',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Management-Modify Some Information Of Mail Group-Updates some fields of a mailing list. The fields not specified are not updated',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        email: z.string().describe('Mailing list address').optional(),
        name: z.string().describe('Mailing list name').optional(),
        description: z.string().describe('Mailing list description').optional(),
        who_can_send_mail: z
          .enum(['ANYONE', 'ALL_INTERNAL_USERS', 'ALL_GROUP_MEMBERS', 'CUSTOM_MEMBERS'])
          .describe(
            'Who can send emails to this mailing list Options:ANYONE(Anyone),ALL_INTERNAL_USERS(Organization members only),ALL_GROUP_MEMBERS(Mailing list members only),CUSTOM_MEMBERS(Specified members)',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional() })
      .optional(),
  },
};
export const mailV1MailgroupPermissionMemberBatchCreate = {
  project: 'mail',
  name: 'mail.v1.mailgroupPermissionMember.batchCreate',
  sdkName: 'mail.v1.mailgroupPermissionMember.batchCreate',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/permission_members/batch_create',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Permission Member-Batch Create Mail Group Permission Members-A single request can add multiple permission members to a mail group',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        items: z
          .array(
            z.object({
              permission_member_id: z
                .string()
                .describe(
                  'The unique identity of the member in the permission group (do not need to be filled in in the request body)',
                )
                .optional(),
              user_id: z
                .string()
                .describe(
                  'Unique identifier of the user in the tenant (this field has a value when member type is USER)',
                )
                .optional(),
              department_id: z
                .string()
                .describe(
                  'Unique identifier of the department in the tenant (this field has a value when member type is DEPARTMENT)',
                )
                .optional(),
              email: z
                .string()
                .describe(
                  "The member's email address ( this field has a value when member type is MAIL_GROUP/PUBLIC_MAILBOX)",
                )
                .optional(),
              type: z
                .enum(['USER', 'DEPARTMENT', 'MAIL_GROUP', 'PUBLIC_MAILBOX'])
                .describe(
                  'Member type Options:USER(Internal user),DEPARTMENT(Department),MAIL_GROUP(Mail Group),PUBLIC_MAILBOX(Public MailBox)',
                )
                .optional(),
            }),
          )
          .describe('List of mail group permission members added this time')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of department ID used in this call Options:department_id(Identify departments with custom department_id),open_department_id(Identify departments by open_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('The unique ID or email address of a mail group').optional() })
      .optional(),
  },
};
export const mailV1MailgroupPermissionMemberBatchDelete = {
  project: 'mail',
  name: 'mail.v1.mailgroupPermissionMember.batchDelete',
  sdkName: 'mail.v1.mailgroupPermissionMember.batchDelete',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/permission_members/batch_delete',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Permission Member-Batch Delete Mail Group Permission Members-A single request can delete multiple permission members in a mail group',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      permission_member_id_list: z.array(z.string()).describe('List of permission member IDs deleted by this call'),
    }),
    path: z
      .object({ mailgroup_id: z.string().describe('The unique ID or email address of a mail group').optional() })
      .optional(),
  },
};
export const mailV1MailgroupPermissionMemberCreate = {
  project: 'mail',
  name: 'mail.v1.mailgroupPermissionMember.create',
  sdkName: 'mail.v1.mailgroupPermissionMember.create',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/permission_members',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Permission Member-Create A Mail Group Permission Member-Adds a member with custom permission to the mailing list, who will then be able to send emails to this mailing list',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_id: z
          .string()
          .describe('Unique identifier of the user in the tenant (this field has a value when member type is USER)')
          .optional(),
        department_id: z
          .string()
          .describe(
            'Unique identifier of the department in the tenant (this field has a value when member type is DEPARTMENT)',
          )
          .optional(),
        email: z
          .string()
          .describe(
            "The member's email address ( this field has a value when member type is MAIL_GROUP/PUBLIC_MAILBOX)",
          )
          .optional(),
        type: z
          .enum(['USER', 'DEPARTMENT', 'MAIL_GROUP', 'PUBLIC_MAILBOX'])
          .describe(
            'Member type Options:USER(Internal user),DEPARTMENT(Department),MAIL_GROUP(Mail Group),PUBLIC_MAILBOX(Public MailBox)',
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
            'Type of department ID used in this call Options:department_id(Identify the department with the custom department_id),open_department_id(Identify the department with open_department_id)',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional() })
      .optional(),
  },
};
export const mailV1MailgroupPermissionMemberDelete = {
  project: 'mail',
  name: 'mail.v1.mailgroupPermissionMember.delete',
  sdkName: 'mail.v1.mailgroupPermissionMember.delete',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/permission_members/:permission_member_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Permission Member-Delete A Mail Group Permission Member-Deletes a member with custom permission, who will then be unable to send emails to this mailing list',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({
        mailgroup_id: z.string().describe('The unique ID or email address of a mail group').optional(),
        permission_member_id: z.string().describe('The unique ID of a member in this permission group').optional(),
      })
      .optional(),
  },
};
export const mailV1MailgroupPermissionMemberGet = {
  project: 'mail',
  name: 'mail.v1.mailgroupPermissionMember.get',
  sdkName: 'mail.v1.mailgroupPermissionMember.get',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/permission_members/:permission_member_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Permission Member-Get A Mail Group Permission Member-Obtains the information of a member who can send emails to mailing list addresses',
  accessTokens: ['tenant'],
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
      })
      .optional(),
    path: z
      .object({
        mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional(),
        permission_member_id: z
          .string()
          .describe('Unique identifier of the member in the permissions group')
          .optional(),
      })
      .optional(),
  },
};
export const mailV1MailgroupPermissionMemberList = {
  project: 'mail',
  name: 'mail.v1.mailgroupPermissionMember.list',
  sdkName: 'mail.v1.mailgroupPermissionMember.list',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id/permission_members',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Permission Member-List Permission Members Of A Mail Group-Obtains the list of members who can send emails to mailing list addresses by pages',
  accessTokens: ['tenant'],
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
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().optional(),
      })
      .optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional() })
      .optional(),
  },
};
export const mailV1MailgroupUpdate = {
  project: 'mail',
  name: 'mail.v1.mailgroup.update',
  sdkName: 'mail.v1.mailgroup.update',
  path: '/open-apis/mail/v1/mailgroups/:mailgroup_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Email-Mail Group-Mail Group Management-Modify All Information Of Mail Group-Updates all information of a mailing list',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        email: z.string().describe('Mailing list address').optional(),
        name: z.string().describe('Mailing list name').optional(),
        description: z.string().describe('Mailing list description').optional(),
        who_can_send_mail: z
          .enum(['ANYONE', 'ALL_INTERNAL_USERS', 'ALL_GROUP_MEMBERS', 'CUSTOM_MEMBERS'])
          .describe(
            'Who can send emails to this mailing list Options:ANYONE(Anyone),ALL_INTERNAL_USERS(Organization members only),ALL_GROUP_MEMBERS(Mailing list members only),CUSTOM_MEMBERS(Specified members)',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({ mailgroup_id: z.string().describe('Mailing list ID or mailing list address').optional() })
      .optional(),
  },
};
export const mailV1PublicMailboxAliasCreate = {
  project: 'mail',
  name: 'mail.v1.publicMailboxAlias.create',
  sdkName: 'mail.v1.publicMailboxAlias.create',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id/aliases',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Alias-Create A Public Mailbox Alias-Creates a public mailbox alias',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ email_alias: z.string().describe('Alias address').optional() }).optional(),
    path: z
      .object({ public_mailbox_id: z.string().describe('Public mailbox ID or public mailbox address').optional() })
      .optional(),
  },
};
export const mailV1PublicMailboxAliasDelete = {
  project: 'mail',
  name: 'mail.v1.publicMailboxAlias.delete',
  sdkName: 'mail.v1.publicMailboxAlias.delete',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id/aliases/:alias_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Alias-Delete A Public Mailbox Alias-Deletes a public mailbox alias',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({
        public_mailbox_id: z.string().describe('Public mailbox ID or public mailbox address').optional(),
        alias_id: z.string().describe('Public mailbox alias').optional(),
      })
      .optional(),
  },
};
export const mailV1PublicMailboxAliasList = {
  project: 'mail',
  name: 'mail.v1.publicMailboxAlias.list',
  sdkName: 'mail.v1.publicMailboxAlias.list',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id/aliases',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Alias-Obtain All Public Mailbox Aliases-Obtains all public mailbox aliases',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({ public_mailbox_id: z.string().describe('Public mailbox ID or public mailbox address').optional() })
      .optional(),
  },
};
export const mailV1PublicMailboxCreate = {
  project: 'mail',
  name: 'mail.v1.publicMailbox.create',
  sdkName: 'mail.v1.publicMailbox.create',
  path: '/open-apis/mail/v1/public_mailboxes',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Management-Create A Public Mailbox-Creates a public mailbox',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        email: z.string().describe('Public mailbox address').optional(),
        name: z.string().describe('Public mailbox name').optional(),
        geo: z.string().describe('geo location of public mailbox').optional(),
      })
      .optional(),
  },
};
export const mailV1PublicMailboxDelete = {
  project: 'mail',
  name: 'mail.v1.publicMailbox.delete',
  sdkName: 'mail.v1.publicMailbox.delete',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Management-Permanently Delete Public Mailbox Address-Releases a public mailbox address from the email recycle bin. This deletes a public mailbox address forever, which means the mailbox address cannot be recovered once deleted',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ public_mailbox_id: z.string().describe('Public mailbox address to be released') }),
  },
};
export const mailV1PublicMailboxGet = {
  project: 'mail',
  name: 'mail.v1.publicMailbox.get',
  sdkName: 'mail.v1.publicMailbox.get',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Management-Query The Specified Public Mailbox-Obtains public mailbox information',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({
        public_mailbox_id: z
          .string()
          .describe('Unique identifier of a public mailbox or the public mailbox address')
          .optional(),
      })
      .optional(),
  },
};
export const mailV1PublicMailboxList = {
  project: 'mail',
  name: 'mail.v1.publicMailbox.list',
  sdkName: 'mail.v1.publicMailbox.list',
  path: '/open-apis/mail/v1/public_mailboxes',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Management-Check All Public Mailboxes-Obtains the list of public mailboxes by pages',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1PublicMailboxMemberBatchCreate = {
  project: 'mail',
  name: 'mail.v1.publicMailboxMember.batchCreate',
  sdkName: 'mail.v1.publicMailboxMember.batchCreate',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id/members/batch_create',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Member-Batch Create Public Mailbox Members-A single request can add multiple members to a public mailbox',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      items: z
        .array(
          z.object({
            member_id: z
              .string()
              .describe('The unique identity of the member in the public mailbox (no need to fill in the request body)')
              .optional(),
            user_id: z
              .string()
              .describe('Unique identifier of the user in the tenant (this field has a value when member type is USER)')
              .optional(),
            type: z.literal('USER').describe('Member type Options:USER(Internal user)').optional(),
          }),
        )
        .describe('List of public mailbox members added by this call'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ public_mailbox_id: z.string().describe('The unique ID or email address of a public mailbox') }),
  },
};
export const mailV1PublicMailboxMemberBatchDelete = {
  project: 'mail',
  name: 'mail.v1.publicMailboxMember.batchDelete',
  sdkName: 'mail.v1.publicMailboxMember.batchDelete',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id/members/batch_delete',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Member-Batch Delete Public Mailbox Members-A single request can delete multiple members of a public mailbox',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      member_id_list: z.array(z.string()).describe('List of public mailbox member IDs deleted by this call'),
    }),
    path: z
      .object({
        public_mailbox_id: z.string().describe('The unique ID or email address of a public mailbox').optional(),
      })
      .optional(),
  },
};
export const mailV1PublicMailboxMemberClear = {
  project: 'mail',
  name: 'mail.v1.publicMailboxMember.clear',
  sdkName: 'mail.v1.publicMailboxMember.clear',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id/members/clear',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Member-Clear Public Mailbox Members-Deletes all members of a public mailbox',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({
        public_mailbox_id: z
          .string()
          .describe('Unique identifier of a public mailbox or the public mailbox address')
          .optional(),
      })
      .optional(),
  },
};
export const mailV1PublicMailboxMemberCreate = {
  project: 'mail',
  name: 'mail.v1.publicMailboxMember.create',
  sdkName: 'mail.v1.publicMailboxMember.create',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id/members',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Member-Create A Public Mailbox Member-Adds a member to a public mailbox',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_id: z
          .string()
          .describe('Unique identifier of the user in the tenant (this field has a value when member type is USER)')
          .optional(),
        type: z.literal('USER').describe('Member type Options:USER(Internal user)').optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z
      .object({
        public_mailbox_id: z
          .string()
          .describe('Unique identifier of a public mailbox or the public mailbox address')
          .optional(),
      })
      .optional(),
  },
};
export const mailV1PublicMailboxMemberDelete = {
  project: 'mail',
  name: 'mail.v1.publicMailboxMember.delete',
  sdkName: 'mail.v1.publicMailboxMember.delete',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id/members/:member_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Member-Delete A Public Mailbox Member-Deletes a member of a public mailbox',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({
        public_mailbox_id: z
          .string()
          .describe('Unique identifier of a public mailbox or the public mailbox address')
          .optional(),
        member_id: z.string().describe('Unique identifier of the member in the public mailbox').optional(),
      })
      .optional(),
  },
};
export const mailV1PublicMailboxMemberGet = {
  project: 'mail',
  name: 'mail.v1.publicMailboxMember.get',
  sdkName: 'mail.v1.publicMailboxMember.get',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id/members/:member_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Member-Get A Public Mailbox Member-Obtains the information of a public mailbox member',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z
      .object({
        public_mailbox_id: z
          .string()
          .describe('Unique identifier of a public mailbox or the public mailbox address')
          .optional(),
        member_id: z.string().describe('Unique identifier of the member in the public mailbox').optional(),
      })
      .optional(),
  },
};
export const mailV1PublicMailboxMemberList = {
  project: 'mail',
  name: 'mail.v1.publicMailboxMember.list',
  sdkName: 'mail.v1.publicMailboxMember.list',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id/members',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Member-List Public Mailbox Members-Obtains the list of public mailbox members by pages',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().optional(),
      })
      .optional(),
    path: z
      .object({
        public_mailbox_id: z.string().describe('The unique ID or email address of a public mailbox').optional(),
      })
      .optional(),
  },
};
export const mailV1PublicMailboxPatch = {
  project: 'mail',
  name: 'mail.v1.publicMailbox.patch',
  sdkName: 'mail.v1.publicMailbox.patch',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Management-Modify Some Information Of Public Mailbox-Updates some fields of a public mailbox. The fields not specified are not updated',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        email: z.string().describe('Public mailbox address').optional(),
        name: z.string().describe('Public mailbox name').optional(),
      })
      .optional(),
    path: z
      .object({
        public_mailbox_id: z
          .string()
          .describe('Unique identifier of a public mailbox or the public mailbox address')
          .optional(),
      })
      .optional(),
  },
};
export const mailV1PublicMailboxRemoveToRecycleBin = {
  project: 'mail',
  name: 'mail.v1.publicMailbox.removeToRecycleBin',
  sdkName: 'mail.v1.publicMailbox.removeToRecycleBin',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id/remove_to_recycle_bin',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Management-Move Public Mailbox To The Recycle Bin-Move Public Mailbox To The Recycle Bin',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        to_mail_address: z
          .string()
          .describe(
            'Please provide the email address to receive the deleted emails. If left blank, the emails of the public mailbox will be deleted without being forwarded',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ public_mailbox_id: z.string().describe('Public email address') }),
  },
};
export const mailV1PublicMailboxUpdate = {
  project: 'mail',
  name: 'mail.v1.publicMailbox.update',
  sdkName: 'mail.v1.publicMailbox.update',
  path: '/open-apis/mail/v1/public_mailboxes/:public_mailbox_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Email-Public Mailbox-Public Mailbox Management-Modify All Information Of Public Mailbox-Updates all information of a public mailbox',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        email: z.string().describe('Public mailbox address').optional(),
        name: z.string().describe('Public mailbox name').optional(),
      })
      .optional(),
    path: z
      .object({
        public_mailbox_id: z
          .string()
          .describe('Unique identifier of a public mailbox or the public mailbox address')
          .optional(),
      })
      .optional(),
  },
};
export const mailV1UserMailboxAliasCreate = {
  project: 'mail',
  name: 'mail.v1.userMailboxAlias.create',
  sdkName: 'mail.v1.userMailboxAlias.create',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/aliases',
  httpMethod: 'POST',
  description: "[Feishu/Lark]-Email-User Mailbox-Create A Member's Email Alias-Creates a member's email alias",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ email_alias: z.string().describe('Alias address').optional() }).optional(),
    path: z.object({ user_mailbox_id: z.string().describe("Member's email address").optional() }).optional(),
  },
};
export const mailV1UserMailboxAliasDelete = {
  project: 'mail',
  name: 'mail.v1.userMailboxAlias.delete',
  sdkName: 'mail.v1.userMailboxAlias.delete',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/aliases/:alias_id',
  httpMethod: 'DELETE',
  description: "[Feishu/Lark]-Email-User Mailbox-Delete A Member's Email Alias-Deletes a member's email alias",
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({
        user_mailbox_id: z.string().describe("Member's email address").optional(),
        alias_id: z.string().describe('Alias email address').optional(),
      })
      .optional(),
  },
};
export const mailV1UserMailboxAliasList = {
  project: 'mail',
  name: 'mail.v1.userMailboxAlias.list',
  sdkName: 'mail.v1.userMailboxAlias.list',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/aliases',
  httpMethod: 'GET',
  description: "[Feishu/Lark]-Email-User Mailbox-Obtain All Member's Email Aliases-Obtains all member's email aliases",
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
        page_size: z.number().optional(),
      })
      .optional(),
    path: z.object({ user_mailbox_id: z.string().describe("Member's email address").optional() }).optional(),
  },
};
export const mailV1UserMailboxDelete = {
  project: 'mail',
  name: 'mail.v1.userMailbox.delete',
  sdkName: 'mail.v1.userMailbox.delete',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id',
  httpMethod: 'DELETE',
  description:
    "[Feishu/Lark]-Email-User Mailbox-Release Address From Recycle Bin-Deletes a member's email address from the email recycle bin. This deletes a member's email address forever, which means the email address cannot be recovered once deleted. This API also allows you to transfer emails from the mailbox to be released to another mailbox",
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        transfer_mailbox: z.string().describe('The email address that receives the transferred emails').optional(),
      })
      .optional(),
    path: z.object({ user_mailbox_id: z.string().describe('The email address to be released') }),
  },
};
export const mailV1UserMailboxEventSubscribe = {
  project: 'mail',
  name: 'mail.v1.userMailboxEvent.subscribe',
  sdkName: 'mail.v1.userMailboxEvent.subscribe',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/event/subscribe',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Email-Event-Subscribe Event-Subscribe Event',
  accessTokens: ['user'],
  schema: {
    data: z.object({ event_type: z.number().describe('Event type Options:1(Message Mail message related events)') }),
    path: z.object({ user_mailbox_id: z.string().describe('User email address, use me when using user_access_token') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxEventSubscription = {
  project: 'mail',
  name: 'mail.v1.userMailboxEvent.subscription',
  sdkName: 'mail.v1.userMailboxEvent.subscription',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/event/subscription',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Email-Event-Get Subscription Status-Get Subscription Status',
  accessTokens: ['user'],
  schema: {
    path: z.object({ user_mailbox_id: z.string().describe('User email address, use me when using user_access_token') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxEventUnsubscribe = {
  project: 'mail',
  name: 'mail.v1.userMailboxEvent.unsubscribe',
  sdkName: 'mail.v1.userMailboxEvent.unsubscribe',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/event/unsubscribe',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Email-Event-Cancel Subscribe-Cancel Subscribe',
  accessTokens: ['user'],
  schema: {
    data: z.object({ event_type: z.number().describe('Event type Options:1(Message Mail message related events)') }),
    path: z.object({ user_mailbox_id: z.string().describe('User email address, use me when using user_access_token') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxFolderCreate = {
  project: 'mail',
  name: 'mail.v1.userMailboxFolder.create',
  sdkName: 'mail.v1.userMailboxFolder.create',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/folders',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Email-Mail Folder-Create Email Folder-Create Email Folder',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      name: z.string().describe('Name'),
      parent_folder_id: z
        .string()
        .describe(
          'Parent folder ID, where a value of 0 indicates the root folder. The method for obtaining ID is shown in [List Email Folders]',
        ),
    }),
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address, or enter me to represent the current calling interface user'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxFolderDelete = {
  project: 'mail',
  name: 'mail.v1.userMailboxFolder.delete',
  sdkName: 'mail.v1.userMailboxFolder.delete',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/folders/:folder_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Email-Mail Folder-Delete Email Folder-Delete Email Folder',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address, or enter me to represent the current calling interface user'),
      folder_id: z.string().describe('Folder ID. The method for obtaining ID is shown in [List Email Folders]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxFolderList = {
  project: 'mail',
  name: 'mail.v1.userMailboxFolder.list',
  sdkName: 'mail.v1.userMailboxFolder.list',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/folders',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Email-Mail Folder-List Email Folders-List Email Folders',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        folder_type: z.number().describe('Folder type Options:1(System System Folder),2(User User folder)').optional(),
      })
      .optional(),
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address, or enter me to represent the current calling interface user'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxFolderPatch = {
  project: 'mail',
  name: 'mail.v1.userMailboxFolder.patch',
  sdkName: 'mail.v1.userMailboxFolder.patch',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/folders/:folder_id',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Email-Mail Folder-Update Email Folder-Update Email Folder',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        name: z.string().describe('Name').optional(),
        parent_folder_id: z
          .string()
          .describe(
            'Parent folder ID, where a value of 0 indicates the root folder. The method for obtaining ID is shown in [List Email Folders]',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address, or enter me to represent the current calling interface user'),
      folder_id: z.string().describe('Folder ID. The method for obtaining ID is shown in [List Email Folders]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxMailContactCreate = {
  project: 'mail',
  name: 'mail.v1.userMailboxMailContact.create',
  sdkName: 'mail.v1.userMailboxMailContact.create',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/mail_contacts',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Email-Email Contact-Create Email Contact-Create A Email Contact',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      name: z.string().describe("Email Contact's Name"),
      company: z.string().describe("Email Contact's Company").optional(),
      phone: z.string().describe("Email Contact's Phone Number").optional(),
      mail_address: z.string().describe("Email Contact's Mail Address").optional(),
      tag: z.string().describe("Email Contact's Tag").optional(),
      remark: z.string().describe("Email Contact's Remark").optional(),
      position: z.string().describe("Email Contact's Position").optional(),
    }),
    path: z.object({ user_mailbox_id: z.string() }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxMailContactDelete = {
  project: 'mail',
  name: 'mail.v1.userMailboxMailContact.delete',
  sdkName: 'mail.v1.userMailboxMailContact.delete',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/mail_contacts/:mail_contact_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Email-Email Contact-Delete Email Contact-Delete An Email Contact',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address or enter "me" to represent the current user making the API call'),
      mail_contact_id: z.string().describe("Email Contact's ID. For the acquisition method, see [List Email Contacts]"),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxMailContactList = {
  project: 'mail',
  name: 'mail.v1.userMailboxMailContact.list',
  sdkName: 'mail.v1.userMailboxMailContact.list',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/mail_contacts',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Email-Email Contact-List Email Contacts-List Email Contacts',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      page_size: z.number().describe('paging size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address, or enter me to represent the current calling interface user'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxMailContactPatch = {
  project: 'mail',
  name: 'mail.v1.userMailboxMailContact.patch',
  sdkName: 'mail.v1.userMailboxMailContact.patch',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/mail_contacts/:mail_contact_id',
  httpMethod: 'PATCH',
  description:
    "[Feishu/Lark]-Email-Email Contact-Modify Email Contact's Info-When using the tenant_access_token, it is necessary to apply for data permissions for accessing email contacts resources",
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      name: z.string().describe("Email Contact's Name"),
      company: z.string().describe("Email Contact's Company").optional(),
      phone: z.string().describe("Email Contact's Phone Number").optional(),
      mail_address: z.string().describe("Email Contact's Mail Address").optional(),
      tag: z.string().describe("Email Contact's Tag").optional(),
      remark: z.string().describe("Email Contact's Remark").optional(),
      position: z.string().describe("Email Contact's Position").optional(),
    }),
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address or enter "me" to represent the current user making the API call'),
      mail_contact_id: z.string().describe("Email Contact's ID. For the acquisition method, see [List Email Contacts]"),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxMessageAttachmentDownloadUrl = {
  project: 'mail',
  name: 'mail.v1.userMailboxMessageAttachment.downloadUrl',
  sdkName: 'mail.v1.userMailboxMessageAttachment.downloadUrl',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/:message_id/attachments/download_url',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Email-User Message-Attachment-Get Attachment Download Links-Get Attachment Download Links',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({ attachment_ids: z.array(z.string()).describe('Attachment ID list') }),
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address, or enter me to represent the current calling interface user'),
      message_id: z.string().describe('Message ID, the method for obtaining ID is shown in [List Emails]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxMessageGet = {
  project: 'mail',
  name: 'mail.v1.userMailboxMessage.get',
  sdkName: 'mail.v1.userMailboxMessage.get',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/:message_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Email-User Message-Get Email Details-Get Email Details',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address, or enter me to represent the current calling interface user'),
      message_id: z.string().describe('Message ID, the method for obtaining ID is shown in [List Emails]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxMessageGetByCard = {
  project: 'mail',
  name: 'mail.v1.userMailboxMessage.getByCard',
  sdkName: 'mail.v1.userMailboxMessage.getByCard',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/get_by_card',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Email-User Message-list mail of card-list mail of mail card',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      card_id: z.string().describe('Mail card ID, available via [Receive message] events'),
      owner_id: z
        .string()
        .describe('Mail card OwnerID, available via [Receive message] events (independent of `user_id_type`)'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address, or enter me to represent the current calling interface user'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxMessageList = {
  project: 'mail',
  name: 'mail.v1.userMailboxMessage.list',
  sdkName: 'mail.v1.userMailboxMessage.list',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Email-User Message-List Emails-List Emails',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      page_size: z.number().describe('page size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      folder_id: z.string().describe('Folder ID. The method for obtaining ID is shown in [List Email Folders]'),
      only_unread: z.boolean().describe('Only query unread emails').optional(),
    }),
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address, or enter me to represent the current calling interface user'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxMessageSend = {
  project: 'mail',
  name: 'mail.v1.userMailboxMessage.send',
  sdkName: 'mail.v1.userMailboxMessage.send',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/messages/send',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Email-User Message-Send Message-Send Message',
  accessTokens: ['user'],
  schema: {
    data: z
      .object({
        subject: z.string().describe('Subject').optional(),
        to: z
          .array(
            z.object({
              mail_address: z.string().describe('Mail address'),
              name: z.string().describe('Name').optional(),
            }),
          )
          .describe('Recipient')
          .optional(),
        cc: z
          .array(
            z.object({
              mail_address: z.string().describe('Mail address'),
              name: z.string().describe('Name').optional(),
            }),
          )
          .describe('CC')
          .optional(),
        bcc: z
          .array(
            z.object({
              mail_address: z.string().describe('Mail address'),
              name: z.string().describe('Name').optional(),
            }),
          )
          .describe('CC')
          .optional(),
        head_from: z
          .object({ name: z.string().describe('Name').optional() })
          .describe('Sender')
          .optional(),
        body_html: z.string().describe('Body').optional(),
        body_plain_text: z.string().describe('Body plain text').optional(),
        attachments: z
          .array(
            z.object({
              body: z
                .string()
                .describe('The body of the attachment, encoded in base64url (maximum 37MB of supported files)'),
              filename: z.string().describe('Attachment file name'),
            }),
          )
          .describe('Mail Attachment List')
          .optional(),
      })
      .optional(),
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address, or enter me to represent the current calling interface user'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxRuleCreate = {
  project: 'mail',
  name: 'mail.v1.userMailboxRule.create',
  sdkName: 'mail.v1.userMailboxRule.create',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/rules',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Email-Auto Filter-Create Auto FIlter-Create Auto Filter',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      condition: z
        .object({
          match_type: z
            .number()
            .describe('Match type Options:1(MatchAll Meet all conditions),2(MatchAny Meet any condition)'),
          items: z
            .array(
              z.object({
                type: z
                  .number()
                  .describe(
                    'Match condition left value Options:1(From Sender),2(To Recipient),3(Cc CC recipient),4(ToOrCc To or Cc recipient),6(Subject),7(Body),8(AttachmentName Attachment name),9(AttachmentType Attachment type),10(AnyAddress Any recipient),12(MatchAllMessage All mails),13(IsExternal Mail Is external),14(IsSpam Mail is spam),15(IsNotSpam Mail is not spam),16(HasAttachment Mail has attachment)',
                  ),
                operator: z
                  .number()
                  .describe(
                    'Match condition operator Options:1(Contains),2(DoesNotContains Does not contains),3(StartsWith Starts with),4(EndsWith Ends with),5(Is),6(IsNot Is not),7(IncludesMe Include me),10(IsEmpty Is empty)',
                  ),
                input: z.string().describe('Match condition right value').optional(),
              }),
            )
            .describe('Match rule list'),
        })
        .describe('Match condition'),
      action: z
        .object({
          items: z
            .array(
              z.object({
                type: z
                  .number()
                  .describe(
                    'Operation type Options:1(ArchiveMessage Archive),2(DeleteMessage Delete it),3(MarkAsRead Mark as read),4(MarkAsSpam Mark as spam),5(NeverMarkAsSpam Never mark as spam),8(ApplyLabel Label as (not support now)),9(Flag),10(NeverPushNotification No notification),11(MoveToFolder Move to user folder),12(AutoTransfer Automatically forward (not support now)),13(SendToChat Share to chat (not support now))',
                  ),
                input: z
                  .string()
                  .describe('When the type is "Move to folder," fill this field with the ID of the folder')
                  .optional(),
              }),
            )
            .describe('List of actions after matching rules'),
        })
        .describe('Action after match hit'),
      ignore_the_rest_of_rules: z.boolean().describe('Is terminal filter'),
      name: z.string().describe('Name'),
      is_enable: z.boolean().describe('Is enable'),
    }),
    path: z.object({ user_mailbox_id: z.string().describe('User email address, use me when using user_access_token') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxRuleDelete = {
  project: 'mail',
  name: 'mail.v1.userMailboxRule.delete',
  sdkName: 'mail.v1.userMailboxRule.delete',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/rules/:rule_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Email-Auto Filter-Delete Auto Filter-Delete Auto Filter',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      user_mailbox_id: z.string(),
      rule_id: z.string().describe('Rule ID. The method for obtaining ID is shown in [List Auto Filters]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxRuleList = {
  project: 'mail',
  name: 'mail.v1.userMailboxRule.list',
  sdkName: 'mail.v1.userMailboxRule.list',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/rules',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Email-Auto Filter-List Auto FIlters-List Auto Filters',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address, or enter me to represent the current calling interface user'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxRuleReorder = {
  project: 'mail',
  name: 'mail.v1.userMailboxRule.reorder',
  sdkName: 'mail.v1.userMailboxRule.reorder',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/rules/reorder',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Email-Auto Filter-Reorder Auto Filters-Reorder Auto Filters',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      rule_ids: z
        .array(z.string())
        .describe('Auto filter ID list. The method for obtaining ID is shown in [List Auto Filters]'),
    }),
    path: z.object({ user_mailbox_id: z.string() }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserMailboxRuleUpdate = {
  project: 'mail',
  name: 'mail.v1.userMailboxRule.update',
  sdkName: 'mail.v1.userMailboxRule.update',
  path: '/open-apis/mail/v1/user_mailboxes/:user_mailbox_id/rules/:rule_id',
  httpMethod: 'PUT',
  description: '[Feishu/Lark]-Email-Auto Filter-Update Auto FIlter-Update Auto Filter',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      condition: z
        .object({
          match_type: z
            .number()
            .describe('Match type Options:1(MatchAll Meet all conditions),2(MatchAny Meet any condition)'),
          items: z
            .array(
              z.object({
                type: z
                  .number()
                  .describe(
                    'Match condition left value Options:1(From Sender),2(To Recipient),3(Cc CC recipient),4(ToOrCc To or CC recipient),6(Subject),7(Body),8(AttachmentName Attachment name),9(AttachmentType Attachment type),10(AnyAddress Any recipient),12(MatchAllMessage All mails),13(IsExternal Mail is external),14(IsSpam Mail is spam),15(IsNotSpam Mail is not spam),16(HasAttachment Mail has attachment)',
                  ),
                operator: z
                  .number()
                  .describe(
                    'Match condition operator Options:1(Contains),2(DoesNotContains Does not contains),3(StartsWith Starts with),4(EndsWith Ends with),5(Is),6(IsNot Is not),7(IncludesMe Include me),10(IsEmpty Is empty)',
                  ),
                input: z.string().describe('Match condition right value').optional(),
              }),
            )
            .describe('Match rule list'),
        })
        .describe('Match condition'),
      action: z
        .object({
          items: z
            .array(
              z.object({
                type: z
                  .number()
                  .describe(
                    'Operation type Options:1(ArchiveMessage Archive),2(DeleteMessage Delete it),3(MarkAsRead Mark as read),4(MarkAsSpam Mark as spam),5(NeverMarkAsSpam Never mark as spam),8(ApplyLabel Label as (not support now)),9(Flag),10(NeverPushNotification No notification),11(MoveToFolder Move to user folder),12(AutoTransfer Automatically forward (not support now)),13(SendToChat Share to chat (not support now))',
                  ),
                input: z
                  .string()
                  .describe('When the type is "Move to folder," fill this field with the ID of the folder')
                  .optional(),
              }),
            )
            .describe('List of actions after matching rules'),
        })
        .describe('Action after match hit'),
      ignore_the_rest_of_rules: z.boolean().describe('Is terminal filter'),
      name: z.string().describe('Name'),
      is_enable: z.boolean().describe('Is enable'),
    }),
    path: z.object({
      user_mailbox_id: z
        .string()
        .describe('User email address, or enter me to represent the current calling interface user'),
      rule_id: z.string().describe('Rule ID. The method for obtaining ID is shown in [List Auto Filters]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const mailV1UserQuery = {
  project: 'mail',
  name: 'mail.v1.user.query',
  sdkName: 'mail.v1.user.query',
  path: '/open-apis/mail/v1/users/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Email-Email Address-Email Address Query-Using the query API, you can enter an email address to query the type and status corresponding to the email address',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ email_list: z.array(z.string()).describe('email list for query') }),
  },
};
export const mailV1Tools = [
  mailV1MailgroupAliasCreate,
  mailV1MailgroupAliasDelete,
  mailV1MailgroupAliasList,
  mailV1MailgroupCreate,
  mailV1MailgroupDelete,
  mailV1MailgroupGet,
  mailV1MailgroupList,
  mailV1MailgroupManagerBatchCreate,
  mailV1MailgroupManagerBatchDelete,
  mailV1MailgroupManagerList,
  mailV1MailgroupMemberBatchCreate,
  mailV1MailgroupMemberBatchDelete,
  mailV1MailgroupMemberCreate,
  mailV1MailgroupMemberDelete,
  mailV1MailgroupMemberGet,
  mailV1MailgroupMemberList,
  mailV1MailgroupPatch,
  mailV1MailgroupPermissionMemberBatchCreate,
  mailV1MailgroupPermissionMemberBatchDelete,
  mailV1MailgroupPermissionMemberCreate,
  mailV1MailgroupPermissionMemberDelete,
  mailV1MailgroupPermissionMemberGet,
  mailV1MailgroupPermissionMemberList,
  mailV1MailgroupUpdate,
  mailV1PublicMailboxAliasCreate,
  mailV1PublicMailboxAliasDelete,
  mailV1PublicMailboxAliasList,
  mailV1PublicMailboxCreate,
  mailV1PublicMailboxDelete,
  mailV1PublicMailboxGet,
  mailV1PublicMailboxList,
  mailV1PublicMailboxMemberBatchCreate,
  mailV1PublicMailboxMemberBatchDelete,
  mailV1PublicMailboxMemberClear,
  mailV1PublicMailboxMemberCreate,
  mailV1PublicMailboxMemberDelete,
  mailV1PublicMailboxMemberGet,
  mailV1PublicMailboxMemberList,
  mailV1PublicMailboxPatch,
  mailV1PublicMailboxRemoveToRecycleBin,
  mailV1PublicMailboxUpdate,
  mailV1UserMailboxAliasCreate,
  mailV1UserMailboxAliasDelete,
  mailV1UserMailboxAliasList,
  mailV1UserMailboxDelete,
  mailV1UserMailboxEventSubscribe,
  mailV1UserMailboxEventSubscription,
  mailV1UserMailboxEventUnsubscribe,
  mailV1UserMailboxFolderCreate,
  mailV1UserMailboxFolderDelete,
  mailV1UserMailboxFolderList,
  mailV1UserMailboxFolderPatch,
  mailV1UserMailboxMailContactCreate,
  mailV1UserMailboxMailContactDelete,
  mailV1UserMailboxMailContactList,
  mailV1UserMailboxMailContactPatch,
  mailV1UserMailboxMessageAttachmentDownloadUrl,
  mailV1UserMailboxMessageGet,
  mailV1UserMailboxMessageGetByCard,
  mailV1UserMailboxMessageList,
  mailV1UserMailboxMessageSend,
  mailV1UserMailboxRuleCreate,
  mailV1UserMailboxRuleDelete,
  mailV1UserMailboxRuleList,
  mailV1UserMailboxRuleReorder,
  mailV1UserMailboxRuleUpdate,
  mailV1UserQuery,
];
