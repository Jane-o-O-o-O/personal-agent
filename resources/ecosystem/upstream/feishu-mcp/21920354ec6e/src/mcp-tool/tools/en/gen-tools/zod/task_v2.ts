import { z } from 'zod';
export type taskV2ToolName =
  | 'task.v2.attachment.delete'
  | 'task.v2.attachment.get'
  | 'task.v2.attachment.list'
  | 'task.v2.comment.create'
  | 'task.v2.comment.delete'
  | 'task.v2.comment.get'
  | 'task.v2.comment.list'
  | 'task.v2.comment.patch'
  | 'task.v2.customField.add'
  | 'task.v2.customField.create'
  | 'task.v2.customField.get'
  | 'task.v2.customField.list'
  | 'task.v2.customFieldOption.create'
  | 'task.v2.customFieldOption.patch'
  | 'task.v2.customField.patch'
  | 'task.v2.customField.remove'
  | 'task.v2.section.create'
  | 'task.v2.section.delete'
  | 'task.v2.section.get'
  | 'task.v2.section.list'
  | 'task.v2.section.patch'
  | 'task.v2.section.tasks'
  | 'task.v2.task.addDependencies'
  | 'task.v2.task.addMembers'
  | 'task.v2.task.addReminders'
  | 'task.v2.task.addTasklist'
  | 'task.v2.task.create'
  | 'task.v2.task.delete'
  | 'task.v2.task.get'
  | 'task.v2.task.list'
  | 'task.v2.task.patch'
  | 'task.v2.task.removeDependencies'
  | 'task.v2.task.removeMembers'
  | 'task.v2.task.removeReminders'
  | 'task.v2.task.removeTasklist'
  | 'task.v2.taskSubtask.create'
  | 'task.v2.taskSubtask.list'
  | 'task.v2.task.tasklists'
  | 'task.v2.tasklistActivitySubscription.create'
  | 'task.v2.tasklistActivitySubscription.delete'
  | 'task.v2.tasklistActivitySubscription.get'
  | 'task.v2.tasklistActivitySubscription.list'
  | 'task.v2.tasklistActivitySubscription.patch'
  | 'task.v2.tasklist.addMembers'
  | 'task.v2.tasklist.create'
  | 'task.v2.tasklist.delete'
  | 'task.v2.tasklist.get'
  | 'task.v2.tasklist.list'
  | 'task.v2.tasklist.patch'
  | 'task.v2.tasklist.removeMembers'
  | 'task.v2.tasklist.tasks';
export const taskV2AttachmentDelete = {
  project: 'task',
  name: 'task.v2.attachment.delete',
  sdkName: 'task.v2.attachment.delete',
  path: '/open-apis/task/v2/attachments/:attachment_guid',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Tasks-Attachment-Delete Attachment-Providing an attachment GUID, delete the attachment. After deletion, the attachment cannot be recovered',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z
      .object({
        attachment_guid: z
          .string()
          .describe(
            'GUID of attachment to delete, which can be created by [Upload Attachment]API, or fetched by[List Attachment]API',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2AttachmentGet = {
  project: 'task',
  name: 'task.v2.attachment.get',
  sdkName: 'task.v2.attachment.get',
  path: '/open-apis/task/v2/attachments/:attachment_guid',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Attachment-Get Attachment-Providing an attachment GUID, get the detail of the attachment, including GUID, name, size, uploaded time, temporary downloadable url, etc',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({
      attachment_guid: z
        .string()
        .describe('Attachment GUID, which can be created by [Upload Attachment]API, or fetched by[List Attachment]API'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2AttachmentList = {
  project: 'task',
  name: 'task.v2.attachment.list',
  sdkName: 'task.v2.attachment.list',
  path: '/open-apis/task/v2/attachments',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Attachment-List Attachment-List all attachments of a resource. The returned attachments supports paging and are sorted by upload time.Each attachment will return a temporary url available for download.Url is available for up to 3 minutes and can only be used for up to 3 times. If the limit is exceeded, you need to obtain a new temporary url through this api',
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
      resource_type: z
        .string()
        .describe('The resource type to which the attachment belongs. Currently only "task" is supported')
        .optional(),
      resource_id: z
        .string()
        .describe(
          'The id of the attachment home resource, used with resource_type. For example, if you want to get the attachment of the task, you need to set resource_type as task, resource_id as the task GUID. To get task GUID, you can refer to [Task Features Overview]',
        ),
      user_id_type: z.string().describe('User ID type').optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CommentCreate = {
  project: 'task',
  name: 'task.v2.comment.create',
  sdkName: 'task.v2.comment.create',
  path: '/open-apis/task/v2/comments',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Comment-Create Comment-Create a comment for a task, or reply to a comment for that task.To create a reply comment, you need to set the reply_to_comment_id field at creation time. The comment being replied to and the new comment must belong to the same task',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      content: z.string().describe('Comment content. Empty is not allowed. Supports up to 3000 utf8 characters'),
      reply_to_comment_id: z
        .string()
        .describe('Reply to the comment ID of the comment. If not filled in it means creating a non-reply comment')
        .optional(),
      resource_type: z
        .string()
        .describe(
          'The resource type to which the comment belongs, currently only supports task "task", the default is "task"',
        )
        .optional(),
      resource_id: z
        .string()
        .describe(
          'The resource ID of the comment attribution. When the attributed resource type is "task", the GUID of the task should be filled in here',
        )
        .optional(),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CommentDelete = {
  project: 'task',
  name: 'task.v2.comment.delete',
  sdkName: 'task.v2.comment.delete',
  path: '/open-apis/task/v2/comments/:comment_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Tasks-Comment-Delete Comment-Delete a comment.After a comment is deleted, nothing can be done and it cannot be restored',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({ comment_id: z.string().describe('Comment id to delete') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CommentGet = {
  project: 'task',
  name: 'task.v2.comment.get',
  sdkName: 'task.v2.comment.get',
  path: '/open-apis/task/v2/comments/:comment_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Comment-Get Comment-Given the ID of a comment, return the details of the comment, including information such as content, creator, creation time and update time',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ comment_id: z.string().describe('Comment ID to get comment details') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CommentList = {
  project: 'task',
  name: 'task.v2.comment.list',
  sdkName: 'task.v2.comment.list',
  path: '/open-apis/task/v2/comments',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Comment-List Comments-Given a resource, returns a list of comments for that resource.Pagination is supported. Comments can return data in positive order (asc, oldest to newest) or reverse order (desc, oldest to newest) of creation time',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      page_size: z.number().describe('Page size, default is 50').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      resource_type: z
        .string()
        .describe(
          'To get the resource type of the comment list, only "task" is currently supported, and the default is "task"',
        )
        .optional(),
      resource_id: z
        .string()
        .describe(
          'To get the resource ID of the comment. For example, to get the comment list of the task, the globally unique ID of the task should be filled in here',
        ),
      direction: z
        .enum(['asc', 'desc'])
        .describe(
          'Returns how the data is sorted. "Asc" means return from oldest to newest order; "desc" means return from newest to oldest order. Default is "asc". Options:asc(Comments posted in ascending order),desc(Comments posted in descending order)',
        )
        .optional(),
      user_id_type: z.string().describe('User ID type').optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CommentPatch = {
  project: 'task',
  name: 'task.v2.comment.patch',
  sdkName: 'task.v2.comment.patch',
  path: '/open-apis/task/v2/comments/:comment_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Tasks-Comment-Patch Comment-Update a comment.When updating, fill in the field names of all comments to be modified in the \'update_fields \'field, and fill in the new value of the field to be modified in the\'comment\' field. For update api specification, please refer to the "About Resource Update" section in [Feature Overview] .Currently only the "conent" field for updating comments is supported',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      comment: z
        .object({
          content: z
            .string()
            .describe(
              'Comment content to update. When updating, empty content is not allowed. Supports up to 3000 utf8 characters',
            )
            .optional(),
        })
        .describe('Comment data to update'),
      update_fields: z
        .array(z.string())
        .describe(
          'Fields to update, support< Md-enum >< md-enum-item key = "content" > Comment content </md-enum-item ></Md-enum >',
        ),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ comment_id: z.string().describe('Comment ID to update') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CustomFieldAdd = {
  project: 'task',
  name: 'task.v2.customField.add',
  sdkName: 'task.v2.customField.add',
  path: '/open-apis/task/v2/custom_fields/:custom_field_guid/add',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Custom Field-Add Custom Field To Resource-Add custom fields to a resource. Currently resource types support tasklist. A custom field can be added to multiple tasklists. After adding, the tasklist can display the value of the custom fields of the task, by which functions such as filtering and grouping based on the field are available.If the settings of the custom field are updated, all resources added by the field can receive the update and display it accordingly',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      resource_type: z
        .string()
        .describe('The resource type to add custom fields to a resource. Currently only tasklist is supported'),
      resource_id: z.string().describe('The resource id to add a custom field to, currently only tasklist_guid'),
    }),
    path: z.object({
      custom_field_guid: z
        .string()
        .describe('custom field GUID, which can be created by[Create Custom Field], or queried by[List Custom Field]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CustomFieldCreate = {
  project: 'task',
  name: 'task.v2.customField.create',
  sdkName: 'task.v2.customField.create',
  path: '/open-apis/task/v2/custom_fields',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Custom Field-Create Custom Field-Create a custom field and add it to a resource (currently resources only support "tasklist"). To create a custom field, you must provide the field name, type and corresponding field settings.Currently task custom fields support several types: number, member, datetime, single_select and multi_select. Use "number_setting", "member_setting", "datetime_setting", "single_select_setting", "multi_select_setting", "text_setting" to set their setting correspondingly.For example, to create a custom field of number type and add it to the tasklist with guid "ec5ed63d-a4a9-44de-a935-7ba243471c0a", you can invoke list this:```POST /task/v2/custom_fields{ "name": "price", "type": "number", "resource_type": "tasklist", "resource_id": "ec5ed63d-a4a9-44de-a935-7ba243471c0a", "number_setting": { "format": "usd", "decimal_count": 2, "separator": "thousand" }}```which means to create a custom field named as "price" with 2 decimal palces. When displayed on the app UI, it is in USD format and displays the thousand separator.Similarly, to create a single_select custom field, you may invoke api like this:```POST /task/v2/custom_fields{ "name": "priority", "type": "single_select", "resource_type": "tasklist", "resource_id": "ec5ed63d-a4a9-44de-a935-7ba243471c0a", "single_select_setting": { "options": [ { "name": "high", "color_index": 1 }, { "name": "mid", "color_index": 11 }, { "name": "low", "color_index": 16 } ] }}```which means creating a "priority" single select custom field with 3 options: high, mid, low，with color set to each of them',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      resource_type: z.string().describe('Customize the resource type to which the field belongs, support "tasklist"'),
      resource_id: z
        .string()
        .describe(
          'The resource ID to which the custom field belongs, the GUID of the list must be filled in when the resource_type is "tasklist"',
        ),
      name: z.string().describe('Field name, up to 50 characters'),
      type: z
        .enum(['number', 'datetime', 'member', 'single_select', 'multi_select', 'text'])
        .describe(
          'custom field type Options:number(number),datetime(datetime),member(member),single_select(single select),multi_select(multiple select),text(text)',
        ),
      number_setting: z
        .object({
          format: z
            .enum(['normal', 'percentage', 'cny', 'usd', 'custom'])
            .describe(
              'number format in which number value are displayed in the app format.Note that this setting only affects the display format of field values, and does not affect the format of field values input/output in openapi. Options:normal(regular number),percentage(percentage format),cny(RMB format),usd(USD format),custom(custom symbol)',
            )
            .optional(),
          custom_symbol: z
            .string()
            .describe(
              'When\'format \'is set to "custom", set the specific custom symbol characters, supporting up to 4 characters.Note that this setting only affects the display format of field values, and does not affect the format of field values input/output in openapi',
            )
            .optional(),
          custom_symbol_position: z
            .enum(['left', 'right'])
            .describe(
              'When\'format \'is set to "custom", the display position of the custom symbol relative to the number is defined. Note that this setting only affects the display format of field values, and does not affect the format of field values input/output in openapi. Options:left(letf Custom symbols are displayed to the left of the numbers),right(Custom symbols are displayed to the right of the number)',
            )
            .optional(),
          separator: z
            .enum(['none', 'thousand'])
            .describe(
              'number separator in the integer part.Note that this setting only affects the display format of field values, and does not affect the format of field values input/output in openapi. Options:none(no separator),thousand(thousand separator)',
            )
            .optional(),
          decimal_count: z
            .number()
            .describe(
              'The number of decimal places reserved for the value of a custom field. Extra digits will be rounded.Default is 0',
            )
            .optional(),
        })
        .describe('number field setting')
        .optional(),
      member_setting: z
        .object({ multi: z.boolean().describe('Whether to support multiple selection.Defaults to false').optional() })
        .describe('member field setting')
        .optional(),
      datetime_setting: z
        .object({
          format: z
            .string()
            .describe(
              'Date time format, supported<md-enum><md-enum-item key= "yyyy-mm-dd"> Year, month and day separated by dashes, e.g. 2023-08-24</md-enum-item><md-enum-item key= "yyyy/mm/dd"> Year, month and day separated by slashes, e.g. 2023/08/04 </md-enum-item><md-enum-item key = "mm/dd/yyyy">months, days and years separated by slashes, e.g. 08/24/2023</md-enum-item><md-enum-item key = "dd/mm/yyyy">Day, month and year separated by slashes, e.g. 24/08/2023</md-enum-item></md-enum>Default is "yyyy-mm-dd".Note that this setting only affects the display format of field values, and does not affect the format of field values input/output in openapi',
            )
            .optional(),
        })
        .describe('datetime setting')
        .optional(),
      single_select_setting: z
        .object({
          options: z
            .array(
              z.object({
                name: z.string().describe('Option name, cannot be empty, supports up to 50 characters'),
                color_index: z
                  .number()
                  .describe(
                    'The color index value of the option, ranging from 0 to 54. If not filled in, it will automatically randomly select one of the unused color index values',
                  )
                  .optional(),
                is_hidden: z
                  .boolean()
                  .describe(
                    'Whether the option is hidden. The hidden option is not visible in the interface, and the field value can no longer be set to this option through openapi',
                  )
                  .optional(),
              }),
            )
            .describe('single select options')
            .optional(),
        })
        .describe('single select setting')
        .optional(),
      multi_select_setting: z
        .object({
          options: z
            .array(
              z.object({
                name: z.string().describe('Option name, cannot be empty, up to 50 characters'),
                color_index: z
                  .number()
                  .describe(
                    'The color index value of the option, which can be a number from 0 to 54. If not filled in, one will be randomly selected',
                  )
                  .optional(),
                is_hidden: z
                  .boolean()
                  .describe(
                    'Whether the option is hidden. The hidden option is not visible in the App interface, and the field value cannot be set to this option through oapi',
                  )
                  .optional(),
              }),
            )
            .describe('multi select options')
            .optional(),
        })
        .describe('multiple select setting')
        .optional(),
      text_setting: z
        .object({})
        .describe('text field setting (currently text_setting has no settable items)')
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CustomFieldGet = {
  project: 'task',
  name: 'task.v2.customField.get',
  sdkName: 'task.v2.customField.get',
  path: '/open-apis/task/v2/custom_fields/:custom_field_guid',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Custom Field-Get Custom Field-By specifying a custom field GUID, get its detailed information',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      custom_field_guid: z
        .string()
        .describe('custom field GUID, which can be created by[Create Custom Field], or queried by[List Custom Field]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CustomFieldList = {
  project: 'task',
  name: 'task.v2.customField.list',
  sdkName: 'task.v2.customField.list',
  path: '/open-apis/task/v2/custom_fields',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Custom Field-List Custom Field-Get a list of custom fields accessible to the calling identity. If the resource_type and resource_id parameters are not provided, all custom fields accessible to the calling identity are returned.If resource_type and resource_id are provided, the custom fields under that resource are returned. Currently resource_type only supports "tasklist", in which case resource_id should be a tasklist GUID.This API supports paging',
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
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        resource_type: z
          .string()
          .describe(
            'Resource types, such as provide custom fields that indicate that only specific resources are queried. Currently only "tasklist" is supported',
          )
          .optional(),
        resource_id: z.string().describe('To query the attribution resource_id of a custom field').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CustomFieldOptionCreate = {
  project: 'task',
  name: 'task.v2.customFieldOption.create',
  sdkName: 'task.v2.customFieldOption.create',
  path: '/open-apis/task/v2/custom_fields/:custom_field_guid/options',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Custom Field Option-Create Custom Field Option-Add a custom option to single/multi select fields. A single/multi select field supports up to 100 options.If the newly added option is visible(is_hidden=false) , its name cannot be duplicated with the name of a visible option',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      name: z.string().describe('option name, up to 50 characters'),
      color_index: z
        .number()
        .describe('Color index value, supports a number from 0 to 54. If not filled in, one will be randomly selected')
        .optional(),
      insert_before: z.string().describe('option_guid to put before an option').optional(),
      insert_after: z.string().describe('option_guid to put after an option').optional(),
      is_hidden: z.boolean().describe('Whether to hide').optional(),
    }),
    path: z.object({ custom_field_guid: z.string().describe('custom field GUID to create option') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CustomFieldOptionPatch = {
  project: 'task',
  name: 'task.v2.customFieldOption.patch',
  sdkName: 'task.v2.customFieldOption.patch',
  path: '/open-apis/task/v2/custom_fields/:custom_field_guid/options/:option_guid',
  httpMethod: 'PATCH',
  description:
    "[Feishu/Lark]-Tasks-Custom Field Option-Patch Custom Field Option-Update the a custom field option by specifying the field GUID and option GUID. The field to be updated must be of a single or multi-select type, and the option to be updated must belong to that custom field.When updating, fill in the `update_fields` field, and fill in the new values of the field to be updated in the `option` field. Fields supported by update_fields include:* 'name': option name* 'color_index': Color index value of option* 'is_hidden': whether to hide from the interface* 'insert_before': Put the current option in the option_guid before an option in the same field.* 'insert_after': The option_guid that puts the current option after an option in the same field",
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        option: z
          .object({
            name: z.string().describe('Option name, up to 50 characters').optional(),
            color_index: z.number().describe('Color index value, supports a number from 0 to 54').optional(),
            insert_before: z.string().describe('option_guid to put before an option').optional(),
            insert_after: z.string().describe('option_guid to put after an option').optional(),
            is_hidden: z.boolean().describe('Whether to hide').optional(),
          })
          .describe('The option data to update')
          .optional(),
        update_fields: z
          .array(z.string())
          .describe(
            "Field name to update, support* 'name': option name* 'color_index': color index value of option* 'is_hidden': whether to hide from the interface* 'insert_before': put the current option before an option in the same field.* 'insert_after': put the current option after an option in the same field",
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      custom_field_guid: z.string().describe('custom field GUID whose option is to update'),
      option_guid: z.string().describe('option GUID to be udpate'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CustomFieldPatch = {
  project: 'task',
  name: 'task.v2.customField.patch',
  sdkName: 'task.v2.customField.patch',
  path: '/open-apis/task/v2/custom_fields/:custom_field_guid',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Tasks-Custom Field-Patch Custom Field-Update the name and settings of a custom field. When updating, fill in all the task field names to be updated in the `update_fields`, and fill in the new value in the `custom_field`. Custom field type is not allowed to change. Only their settings can be modified according to the type.`update_fields` supports:* `name`: custom field name* `number_setting`: number type setting (if and only if the custom field type to update is number)* `member_setting`: member setting (if and only if the custom field type to update is member)* `datetime_setting`: datetime type setting (if and only if the custom field type to update is datetime)* `single_select_setting`: single select setting (if and only if the custom field type to update is single select)* `multi_select_setting`: multi_select type setting (if and only if the custom field type to be updated is multi_select)* `text_setting`: text type setting (currently nothing can be set)When updating a setting, if you do not fill in a field, it means that the original setting is not changed. For example, for a number, the original settings are:```json"number_setting": { "format": "normal", "decimal_count": 2, "separator": "none", "custom_symbol": "€", "custom_symbol_position": "right"}```Invoke the API with the following parameters:```PATCH /task/v2/custom_fields/:custom_field_guid{ "custom_field": { "number_setting": { "decimal_count": 4 } }, "update_fields": ["number_setting"]}```indicates that only the number of decimal places is changed from 2 to 4, and the rest of the settings \'format\', \'separator \',\' custom_symbol\', etc. are unchanged.For custom fields of single/multi_select type, the setting is a list of options. When updated, the usage is just like configure the options in App UI. Instead of passing in all the options for the field, the user only needs to provide the options that eventually want the UI to be visible (is_hidden = false). Options in the original field that do not appear in the input will be set to is_hidden = true and placed after all visible options.For an updated option, if `option_guid` is provided, it will be taken as option updating (in this case guid must exist in the current field, otherwise a 400 error will be returned); if GUID not provided, it will be regarded as creating a new option (the new option option_guid will be returned in reponse).For example, a single_select field originally had 3 options A, B, C, D. Where C is hidden. The user can update the options like this:```PATCH /task/v2/custom_fields/:custom_field_guid{ "custom_field": { "single_select_setting": { "options": [ { "name": "E", "color_index": 25 }, { "guid": "<option_guid of A>" "name": "A2" }, { "guid": "<option_guid of C>", }, ] } }, "update_fields": ["single_select_setting"]}```After calling, you finally get a new list of options E, A, C, B, D, where:* option E is created and its color_index is set to 25.* option A is updated and its name is changed to "A2". But its color_index remains the same because it is not set;* overall order of options follows the user\'s input order, that is, E, A, C, just as the direct input, and their is_hidden are set to false. Note, C was originally is_hidden = true, it will also be set to is_hidden = false.* options B and D have their is_hidden set to true because the user did not input them, and are placed after all options input in the request.If you simply want to modify the order of options visible to the user, such as changing from the original options A, B, C to C, B, A, you can invoke the API like this:```PATCH /task/v2/custom_fields/:custom_field_guid{ "custom_field": { "single_select_setting": { "options": [ { "guid": "<option_guid_of_C>" }, { "guid": "<option_guid of B>" }, { "guid": "<option_guid of A>", }, ] } }, "update_fields": ["single_select_setting"]}```If you want to directly mark all options in the field as invisible, you can invoke the API like this:```PATCH /task/v2/custom_fields/:custom_field_guid{ "custom_field": { "single_select_setting": { "options": [] } }, "update_fields": ["single_select_setting"]}```The option to update the single/multi_select field must meet the "visible option name cannot be duplicated" constraint. Otherwise, an error will be returned. Developers need to ensure that the option names entered contain on duplicated items.If you want to update only one single option, or want to set the is_hidden of an option separately, this API cannot do that. But you can use the [Update Custom Field Options] API to do it',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        custom_field: z
          .object({
            name: z.string().describe('field name, up to 50 characters').optional(),
            number_setting: z
              .object({
                format: z
                  .enum(['normal', 'percentage', 'cny', 'usd', 'custom'])
                  .describe(
                    'number display format Options:normal(regular number),percentage(percentage format),cny(RMB format),usd(USD format),custom(custom symbol format)',
                  )
                  .optional(),
                custom_symbol: z
                  .string()
                  .describe(
                    'Custom symbol charaters, supporting up to 4 characters. Only takes effect when `format` is set to "custom"',
                  )
                  .optional(),
                custom_symbol_position: z
                  .enum(['left', 'right'])
                  .describe(
                    'Customize where symbols are displayed. Options:left(letf Custom symbols are placed to the left of the numbers),right(Custom symbols are placed to the right of the number)',
                  )
                  .optional(),
                separator: z
                  .enum(['none', 'thousand'])
                  .describe('separator in the integer part Options:none(no separator),thousand(thousand separator)')
                  .optional(),
                decimal_count: z
                  .number()
                  .describe(
                    'The number of decimal places. If the entered number value has more decimal places than this setting, the extra digits will be rounded and discarded. If\'format \'is "percentage", it means the number of decimal places after becoming a percentage',
                  )
                  .optional(),
              })
              .describe('field number setting')
              .optional(),
            member_setting: z
              .object({ multi: z.boolean().describe('Whether to support multiple selection').optional() })
              .describe('member field setting')
              .optional(),
            datetime_setting: z
              .object({
                format: z
                  .string()
                  .describe(
                    'Datetime display format, which supports:<md-enum><md-enum-item key ="yyyy-mm-dd">Year, month and day separated by dashes, e.g. 2023-08-24 </md-enum-item><md-enum-item key="yyyy/mm/dd">Year, month and day separated by slashes, e.g. 2023/08/04</md-enum-item><md-enum-item key="mm/dd/yyyy">Months, days and years separated by slashes, e.g. 08/24/2023</md-enum-item><md-enum-item key="dd/mm/yyyy">Day, month and year separated by slashes, e.g. 24/08/2023</md-enum-item></md-enum>',
                  )
                  .optional(),
              })
              .describe('datetime field setting')
              .optional(),
            single_select_setting: z
              .object({
                options: z
                  .array(
                    z.object({
                      guid: z
                        .string()
                        .describe(
                          'GUID of the option. If filled in means updating the existing option if not filled in means creating a new option',
                        )
                        .optional(),
                      name: z.string().describe('Option name, maximum 50 characters').optional(),
                      color_index: z
                        .number()
                        .describe('The color index value of the option, which can be a number from 0 to 54')
                        .optional(),
                    }),
                  )
                  .describe('single_select options')
                  .optional(),
              })
              .describe('single_select setting')
              .optional(),
            multi_select_setting: z
              .object({
                options: z
                  .array(
                    z.object({
                      guid: z
                        .string()
                        .describe(
                          'GUID of the option. If filled in means updating the existing option; if not filled in means creating a new option',
                        )
                        .optional(),
                      name: z.string().describe('Option name, maximum 50 characters').optional(),
                      color_index: z
                        .number()
                        .describe('The color index value of the option, which can be a number from 0 to 54')
                        .optional(),
                    }),
                  )
                  .describe('mult_select options')
                  .optional(),
              })
              .describe('mult_select setting')
              .optional(),
            text_setting: z.object({}).describe('text field setting').optional(),
          })
          .describe('custom field data to update')
          .optional(),
        update_fields: z
          .array(z.string())
          .describe(
            'The custom field type to modify supports:* `name`: custom field name.* `number_setting`: number setting (if and only if the custom field type to update is numeric)* `member_setting`: people type setting (if and only if the custom field type to update is member)* `datetime_setting`: Date type setting (if and only if the custom field type to update is date)* `single_select_setting`: single select setting (if and only if the custom field type to update is single_select)* `multi_select_setting`: multi select type setting (if and only if the custom field type to be updated is multi_select)* `text_setting`: text type setting (currently nothing can be set)',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      custom_field_guid: z
        .string()
        .describe('custom field GUID, which can be created by[Create Custom Field], or queried by[List Custom Field]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2CustomFieldRemove = {
  project: 'task',
  name: 'task.v2.customField.remove',
  sdkName: 'task.v2.customField.remove',
  path: '/open-apis/task/v2/custom_fields/:custom_field_guid/remove',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Custom Field-Remove Custom Field From Resource-Remove a custom field from the resource. After removal, the resource will no longer be able to use the field. Currently, only resource type "tasklist" is supported.If you try to remove a custom field that does not exist in the resource, the api will return a success.Note that custom fields are authorized through tasklist. If a custom field is removed from all associated tasklists, it means that any calling identity can no longer access the that custom field',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      resource_type: z
        .string()
        .describe("The resource type to remove a custom field from a resource, currently only 'tasklist' is supported"),
      resource_id: z
        .string()
        .describe(
          'To remove the resource id of a custom field from a resource, when "tasklist" is resource_type, fill in the tasklist GUID',
        ),
    }),
    path: z.object({
      custom_field_guid: z
        .string()
        .describe('custom field GUID, which can be created by[Create Custom Field], or queried by[List Custom Field]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2SectionCreate = {
  project: 'task',
  name: 'task.v2.section.create',
  sdkName: 'task.v2.section.create',
  path: '/open-apis/task/v2/sections',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Section-Create Section-Create a section for a tasklist or "Owned Tasks". You may provide a name and optional locating parameters. If no locating parameters are specified, the new section will be placed at the end of the sections of the specified resource.When creating a section in the tasklist, you need to set `resourse_type` to "tasklist" and `resource_id` to the tasklist guid.When creating section for "Owned Tasks", you need to set `resource_type` to "my_tasks", and leave `resource_id` unset. The calling identity can only create sections in "Owned Tasks" of itself',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      name: z.string().describe('Section name. Empty is not allowed. Supports up to 100 utf8 characters'),
      resource_type: z
        .string()
        .describe('Resource type of new creation, supporting "tasklist" or "my_tasks" (Owned Tasks)'),
      resource_id: z
        .string()
        .describe(
          'Specify the resource id to which the section belongs. When `resource_type` is "tasklist", the tasklist GUID needs to be spedified here; when `resource_type` is "my_tasks", no need to fill in',
        )
        .optional(),
      insert_before: z
        .string()
        .describe(
          'The section_guid before which the new created section will be put.When neither `insert_before` nor `insert_after` is set, the new section is placed after all existing sections.If both `insert_before` and `insert_after` are set, the api will report an error',
        )
        .optional(),
      insert_after: z
        .string()
        .describe(
          'The section_guid after which the new created section will be put.When neither `insert_before` nor `insert_after` is set, the new section is placed after all existing sections.If both `insert_before` and `insert_after` are set, the api will report an error',
        )
        .optional(),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2SectionDelete = {
  project: 'task',
  name: 'task.v2.section.delete',
  sdkName: 'task.v2.section.delete',
  path: '/open-apis/task/v2/sections/:section_guid',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Tasks-Section-Delete Section-Delete a section. The tasks in the deleted section will be moved to the default section of the resource to which the deleted section belongs.Default section cannot be deleted',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({ section_guid: z.string().describe('section GUID to delete') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2SectionGet = {
  project: 'task',
  name: 'task.v2.section.get',
  sdkName: 'task.v2.section.get',
  path: '/open-apis/task/v2/sections/:section_guid',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Section-Get Section-Gets the details of a section, including name, creator, etc. If the section belongs to a tasklist, the summary of the tasklist is also returned',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ section_guid: z.string().describe('Section GUID to get') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2SectionList = {
  project: 'task',
  name: 'task.v2.section.list',
  sdkName: 'task.v2.section.list',
  path: '/open-apis/task/v2/sections',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Section-List Section-Get a list of section. Paging is supported. The returned results are sorted in the order in which the sections are placed on the UI',
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
      resource_type: z
        .string()
        .describe(
          'The resource type to which the section belongs. Supports "my_tasks" (Owned Tasks) and "tasklist". When using tasklist, you need to provide the tasklist GUID by setting `resource_id`',
        ),
      resource_id: z
        .string()
        .describe(
          'If "resource_type" is "tasklist", you need to fill in the taslist GUID of which sections is going to list',
        )
        .optional(),
      user_id_type: z.string().describe('User ID type').optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2SectionPatch = {
  project: 'task',
  name: 'task.v2.section.patch',
  sdkName: 'task.v2.section.patch',
  path: '/open-apis/task/v2/sections/:section_guid',
  httpMethod: 'PATCH',
  description:
    "[Feishu/Lark]-Tasks-Section-Patch Section-Update a section. you can update section's name and postion.When updating, fill in all the field names to be modified in the 'update_fields 'field, and fill in the new value of the field to be modified in the'section' field. For details of the calling convention, see the \"Updates to Resources\" part in [Function Overview].Section fields that currently support updates include:* 'name' - section name;* 'insert_before' - section guid before which the current section will be put.* 'insert_after' -section guid after which the current section will be put.`insert_before` and `insert_after`, if filled in, must be a valid section_guid of the same resource. Note that `insert_before` and `insert_after` cannot be set at the same time",
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      section: z
        .object({
          name: z
            .string()
            .describe('Section name. When updating, empty is not allowed. Supports up to 100 utf8 characters')
            .optional(),
          insert_before: z.string().describe('The section_guid before which current section will be put').optional(),
          insert_after: z.string().describe('The section_guid after which current section will be put').optional(),
        })
        .describe('The section data to update'),
      update_fields: z
        .array(z.string())
        .describe(
          "The field name to be updated. Currently supports:* `name`: section name;* `insert_before` - The section_guid before which current section will be put.* 'insert_after' - The section_guid after which current section will be put",
        ),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ section_guid: z.string().describe('section GUID to update') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2SectionTasks = {
  project: 'task',
  name: 'task.v2.section.tasks',
  sdkName: 'task.v2.section.tasks',
  path: '/open-apis/task/v2/sections/:section_guid/tasks',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Section-List Tasks of Section-List tasks of a section. Paging is supported. Tasks are returned in the order as "custom" order of UI. This API supports simple filtering',
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
        completed: z
          .boolean()
          .describe("Filter by task status. If you don't fill it in, it means you don't filter by completion status")
          .optional(),
        created_from: z
          .string()
          .describe(
            'Start timestamp (ms) filtered by creation time. Optional, leaving empty means the creation time of the first task',
          )
          .optional(),
        created_to: z
          .string()
          .describe(
            'The starting timestamp (ms) filtered by the creation time. Optional, leaving empty means the creation time of the first task',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ section_guid: z.string().describe('section GUID of which tasks are listed') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskAddDependencies = {
  project: 'task',
  name: 'task.v2.task.addDependencies',
  sdkName: 'task.v2.task.addDependencies',
  path: '/open-apis/task/v2/tasks/:task_guid/add_dependencies',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Task-Add Dependency-Add one or more dependencies to a task. You can add prev-dependencies or next-dependencies of tasks. If a task with dependencies is in the same tasklist, you can show its dependencies through the Gantt View of the tasklist.This API can also be used to modify the type of an existing dependency (prev to next or next to prev).Note: The `task_guid` of added dependencies cannot contain duplicated task_guid, nor can the current task be added as its own dependency. Attempts to add an existing dependency are automatically ignored and will get a successful response',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        dependencies: z
          .array(
            z.object({
              type: z
                .enum(['prev', 'next'])
                .describe('dependency type Options:prev(prev-dependency),next(next-dependency)'),
              task_guid: z.string().describe('GUIDs for dependent tasks'),
            }),
          )
          .describe('Dependencies to add')
          .optional(),
      })
      .optional(),
    path: z.object({ task_guid: z.string().describe('Task GUID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskAddMembers = {
  project: 'task',
  name: 'task.v2.task.addMembers',
  sdkName: 'task.v2.task.addMembers',
  path: '/open-apis/task/v2/tasks/:task_guid/add_members',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Task-Add members to task-Add assignees or followers to a task. Multiple members can be added at once. The list of task members after adding is returned in the `task` field of response.* For the format of member, please refer to the " How to represent members of tasks and tasklists?" section in [Feature Overview] .* Available member types: "user", "app"* Available member roles: "assigee", "follower"* If the member to be added is already in the task, it is automatically ignored',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      members: z
        .array(
          z.object({
            id: z.string().describe('Indicates the id of member'),
            type: z.string().describe('Member type, optional value as follow* user* app').optional(),
            role: z.string().describe('The role of the member, optional value as follow* assignee* follower'),
            name: z.string().describe('Member name').optional(),
          }),
        )
        .describe(
          'Members to add. Supports up to 50 members per request after de-duplication. For the format of member, please refer to the " How to represent members of tasks and tasklists?" section in [Feature Overview]',
        ),
      client_token: z
        .string()
        .describe(
          'Idempotent token. If provided, api supports idempotent invocation. Please refer to the "Idempotent Invocation" section in [Function Overview] for details',
        )
        .optional(),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ task_guid: z.string().describe('GUID of task to add members') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskAddReminders = {
  project: 'task',
  name: 'task.v2.task.addReminders',
  sdkName: 'task.v2.task.addReminders',
  path: '/open-apis/task/v2/tasks/:task_guid/add_reminders',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Task-Add reminders to task-Add a reminder for a task. A reminder is a moment calculated based on the task due time. In order to set a reminder, the task must first have a due. You can set the due when [Create Task], or by [Update Task] set a deadline.At present, a task can only set 1 reminder. But the form of the interface can be expanded to support multiple reminders for a task in the future.If the current task already has a reminder, to update the settings of the reminder, you need to call the [Remove Task Reminder] api to remove the original reminder. Then call this interface to add reminders',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      reminders: z
        .array(
          z.object({
            relative_fire_minute: z
              .number()
              .describe(
                'The number of minutes relative to the deadline. For example, 30 means 30 minutes before the due; 0 means the due time.Negative number are not supported',
              ),
          }),
        )
        .describe('Task reminder list. Currently only 1 reminder is supported per task'),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ task_guid: z.string().describe('GUID of task to add reminder') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskAddTasklist = {
  project: 'task',
  name: 'task.v2.task.addTasklist',
  sdkName: 'task.v2.task.addTasklist',
  path: '/open-apis/task/v2/tasks/:task_guid/add_tasklist',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Task-Add task to tasklist-Add a task to a tasklist. Returns the details of the task, including all tasklist information where the task belongs to.If the task is already in the manifest, the interface will return success',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      tasklist_guid: z.string().describe('Tasklist GUID to be added into'),
      section_guid: z
        .string()
        .describe('The section GUID of tasklist to add, if not filled in, default section GUID will be used')
        .optional(),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ task_guid: z.string().describe('GUID of task to add to tasklist') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskCreate = {
  project: 'task',
  name: 'task.v2.task.create',
  sdkName: 'task.v2.task.create',
  path: '/open-apis/task/v2/tasks',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Task-Create Task-This API can create a task. When creating a task, it supports filling in the basic information of the task (such as title, description, person in charge, etc.). In addition, it can also set the start time of the task, deadline reminders and other conditions. In addition, you can pass in the tasklists field to add new tasks to multiple lists.When creating a task, "assignees" and "followers" can be added by specifying `members` fields. For the format of member, please refer to the " How to represent members of tasks and tasklists?" section in [Feature Overview] .When setting task start or due time, you need to follow the specification and constraints of task time. Please refer to the "How to use start and due time?" section in [Feature Overview] .This api supports "idempotent invocation" by specifying `client_token` field. Please refer to the "Idempotent Invocation" section in [Feature Overview] .To create a subtask of a task, you need to use the [Create Subtask] API.Creating tasks allows setting custom field values at the same time. However, according to the authorization model of custom fields, only values of fields associated with tasklists can only be added to tasks. Please refer to [Custom Field Feature Overview] for details',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      summary: z.string().describe('Task summary. Empty is not allowed; supports up to 3000 utf8 characters'),
      description: z.string().describe('Task description. Supports up to 3000 utf8 characters').optional(),
      due: z
        .object({
          timestamp: z
            .string()
            .describe(
              'The timestamp of the due time/date, in milliseconds from 1970-01-01 00:00:00 UTC. If the expiration time is a date, you need to convert the date to timestamp and set is_all_day = true',
            )
            .optional(),
          is_all_day: z
            .boolean()
            .describe(
              'Whether to due on a date. If set to true, only the date part of the timestamp will be parsed and stored',
            )
            .optional(),
        })
        .describe('Task due time')
        .optional(),
      origin: z
        .object({
          platform_i18n_name: z
            .object({
              en_us: z.string().describe('English').optional(),
              zh_cn: z.string().describe('Chinese').optional(),
              zh_hk: z.string().describe('Chinese (Hong Kong)').optional(),
              zh_tw: z.string().describe('Chinese (Taiwan)').optional(),
              ja_jp: z.string().describe('Japanese').optional(),
              fr_fr: z.string().describe('French').optional(),
              it_it: z.string().describe('Italian').optional(),
              de_de: z.string().describe('German').optional(),
              ru_ru: z.string().describe('Russian').optional(),
              th_th: z.string().describe('Thai').optional(),
              es_es: z.string().describe('Spanish').optional(),
              ko_kr: z.string().describe('Korean').optional(),
            })
            .describe(
              'The name of the task import source to display on the task center details page. A multilingual version is required',
            )
            .optional(),
          href: z
            .object({
              url: z
                .string()
                .describe(
                  'The address corresponding to the source link, if filled in, must start with https://or http://.**Note**: If you need to adjust the link opening method on the PC, you can adjust it in **Settings** > **Efficiency** > **Open links** of the Lark client',
                )
                .optional(),
              title: z.string().describe('The title corresponding to the source link').optional(),
            })
            .describe('Source of task association Platform details page link')
            .optional(),
        })
        .describe(
          'The third-party platform source information associated with the task is used to display the source information in the App Task UI. Origin can only be set when task is created and not changable. Please refer to the "How to use origin?" section in [Feature Overview]',
        )
        .optional(),
      extra: z
        .string()
        .describe(
          'Any data that the caller can pass in attached to the task. It will be returned as it is when getting the task details. If it is binary data, it can be encoded with Base64',
        )
        .optional(),
      completed_at: z
        .string()
        .describe(
          'The completion time timestamp (ms) of the task. Fill in or set to 0 to create an unfinished task; fill in a specific timestamp to create a completed task',
        )
        .optional(),
      members: z
        .array(
          z.object({
            id: z.string().describe('Member ID'),
            type: z.string().describe('The type of member, which can be user or app').optional(),
            role: z.string().describe('Member roles, which can be "assignee" or "follower"'),
            name: z.string().describe('Member name').optional(),
          }),
        )
        .describe(
          'A list of task members, including assignees and followers. If not filled in, the task has no members. Support up to 50 members per request after de-duplication.Please refer to the " How to represent members of tasks and tasklists?" section in [Feature Overview]',
        )
        .optional(),
      repeat_rule: z
        .string()
        .describe(
          'Task repeat rule. If set, the task is "recurring task". Please refer to the "How to Use Recurring Tasks? " section in [Task Feature Overview]',
        )
        .optional(),
      custom_complete: z
        .object({
          pc: z
            .object({
              href: z.string().describe('Customize the completed redirect url').optional(),
              tip: z
                .object({
                  en_us: z.string().describe('English').optional(),
                  zh_cn: z.string().describe('Chinese').optional(),
                  zh_hk: z.string().describe('Chinese (Hong Kong)').optional(),
                  zh_tw: z.string().describe('Chinese (Taiwan)').optional(),
                  ja_jp: z.string().describe('Japanese').optional(),
                  fr_fr: z.string().describe('French').optional(),
                  it_it: z.string().describe('Italian').optional(),
                  de_de: z.string().describe('German').optional(),
                  ru_ru: z.string().describe('Russian').optional(),
                  th_th: z.string().describe('Thai').optional(),
                  es_es: z.string().describe('Spanish').optional(),
                  ko_kr: z.string().describe('Korean').optional(),
                })
                .describe('Custom completed pop-up prompt')
                .optional(),
            })
            .describe('pc client side custom configuration (including mac and windows)')
            .optional(),
          ios: z
            .object({
              href: z.string().describe('Customize the completed redirect url').optional(),
              tip: z
                .object({
                  en_us: z.string().describe('English').optional(),
                  zh_cn: z.string().describe('Chinese').optional(),
                  zh_hk: z.string().describe('Chinese (Hong Kong)').optional(),
                  zh_tw: z.string().describe('Chinese (Taiwan)').optional(),
                  ja_jp: z.string().describe('Japanese').optional(),
                  fr_fr: z.string().describe('French').optional(),
                  it_it: z.string().describe('Italian').optional(),
                  de_de: z.string().describe('German').optional(),
                  ru_ru: z.string().describe('Russian').optional(),
                  th_th: z.string().describe('Thai').optional(),
                  es_es: z.string().describe('Spanish').optional(),
                  ko_kr: z.string().describe('Korean').optional(),
                })
                .describe('The pop-up prompt for customization completion is')
                .optional(),
            })
            .describe('Custom completion configuration of ios')
            .optional(),
          android: z
            .object({
              href: z.string().describe('Customize the completed redirect url').optional(),
              tip: z
                .object({
                  en_us: z.string().describe('English').optional(),
                  zh_cn: z.string().describe('Chinese').optional(),
                  zh_hk: z.string().describe('Chinese (Hong Kong)').optional(),
                  zh_tw: z.string().describe('Chinese (Taiwan)').optional(),
                  ja_jp: z.string().describe('Japanese').optional(),
                  fr_fr: z.string().describe('French').optional(),
                  it_it: z.string().describe('Italian').optional(),
                  de_de: z.string().describe('German').optional(),
                  ru_ru: z.string().describe('Russian').optional(),
                  th_th: z.string().describe('Thai').optional(),
                  es_es: z.string().describe('Spanish').optional(),
                  ko_kr: z.string().describe('Korean').optional(),
                })
                .describe('The pop-up prompt for customization completion is')
                .optional(),
            })
            .describe('Custom completion configuration of android')
            .optional(),
        })
        .describe(
          'Task custom complete configuration. Please refer to the "How to use custom completion?" section in [Task Feature Overview]',
        )
        .optional(),
      tasklists: z
        .array(
          z.object({
            tasklist_guid: z
              .string()
              .describe(
                'Specifies that a task is created in a manifest that requires editable permissions to the manifest. If not filled in, the task will not be created in the manifest',
              )
              .optional(),
            section_guid: z
              .string()
              .describe(
                'The GUID of the custom group in the manifest is used to specify that the task is added to a specific group while creating the task in a manifest. If the GUID of the manifest is filled in, but the GUID of the group is not filled in, it will be automatically added to the default group of the manifest',
              )
              .optional(),
          }),
        )
        .describe('Information on the list of tasks')
        .optional(),
      client_token: z
        .string()
        .describe(
          'Idempotent token. If provided triggers the dempotent behavior. Please refer to the "Idempotent Invocation" section in [Feature Overview]',
        )
        .optional(),
      start: z
        .object({
          timestamp: z
            .string()
            .describe(
              'The timestamp of the start time/date in milliseconds from 1970-01-01 00:00:00. If the start time is a date, you need to convert the date to timestamp and set is_all_day = true.If you set both the start time and the deadline for the task, the start time must be < = deadline, and the is_all_day settings for the start/deadline must be the same',
            )
            .optional(),
          is_all_day: z
            .boolean()
            .describe(
              'Whether to start on a date. If set to true, only the date part of the timestamp will be parsed and stored',
            )
            .optional(),
        })
        .describe(
          'Task start time (ms). Please refer to the "How to use start and due time?" section in [Feature Overview]',
        )
        .optional(),
      reminders: z
        .array(
          z.object({
            relative_fire_minute: z
              .number()
              .describe(
                'The number of minutes of reminder time relative to the deadline. The value must be greater than or equal to 0 (this interface can only be used to set the reminder time before the deadline). For example, 30 means 30 minutes before the deadline; 0 means the deadline reminder',
              ),
          }),
        )
        .describe(
          'Task reminders. To set reminders, you must also set the deadline for the task. A task can only set a maximum of 1 reminder',
        )
        .optional(),
      mode: z.number().describe('Task completion mode, 1: countersign tasks; 2: or-sign tasks').optional(),
      is_milestone: z.boolean().describe('Is it a milestone task').optional(),
      custom_fields: z
        .array(
          z.object({
            guid: z.string().describe('Custom field guid'),
            number_value: z
              .string()
              .describe(
                'A custom field value of a number type, fill in the string representation of a valid number, or unset it by an empty string',
              )
              .optional(),
            member_value: z
              .array(
                z.object({
                  id: z.string().describe('Indicates the id of member').optional(),
                  type: z.string().describe('Type of member').optional(),
                  name: z.string().describe('Member name').optional(),
                }),
              )
              .describe(
                'Custom field values for member types. One or more users can be set (following the member format, only user type is supported). Only one value can be entered when the field settings is set to "multi=false"). Unset the value by an empty array',
              )
              .optional(),
            datetime_value: z
              .string()
              .describe(
                'Datetime custom field value, you can enter a timestamp (in ms) string representing the date. Unset the value by an empty string',
              )
              .optional(),
            single_select_value: z
              .string()
              .describe(
                'single select field value, fill in the option_guid of a field option. Set to empty string means to unset the value',
              )
              .optional(),
            multi_select_value: z
              .array(z.string())
              .describe(
                'multi_select type field value, you can fill in one or more option_guid of this field. Unset the value by an empty array',
              )
              .optional(),
            text_value: z
              .string()
              .describe('text custom field value, up to 3000 characters. Use empty string "" to unset the value')
              .optional(),
          }),
        )
        .describe(
          'Custom field values. One or multiple custom field values can be set at the same time as the task is created. The custom field to set the value must be associated with the tasklist to which the task is added (which is specified by `tasklist`), otherwise it cannot be set.The value needs to be set to the corresponding field according to the field type.* When `type` is "number", the `number_value` field should be used to represent the value of number custom field;* When "type" is "member", the `member_value` field should be used to represent the value of member custom field;* When `type` is "datetime", `datetime_value` field should be used to represent the value of the datetime custom field.* When `type` is "single_select", the `single_select_value` field should be used to represent the value of single_select custom field.* When `type` is "multi_select", the `multi_select_value` field should be used to represent the value of multi_select custom field',
        )
        .optional(),
      docx_source: z
        .object({
          token: z
            .string()
            .describe(
              'Token of associated document of the task. Note: if using tenant_access_token request, the requesting bot must have document edit permission; if using user_access_token, the requesting user must have document editi permission',
            ),
          block_id: z
            .string()
            .describe(
              'The block_id of the document associated with the task. The block_id must exist in the document corresponding to the token, and the block_id must not be bound to other tasks',
            ),
        })
        .describe(
          'Set this field if you want to set the task source as a document.- It is mutually exclusive with extra. An error will be reported if they are set at the same time.- It is mutually exclusive with origin. An error is reported when both are set.- It is mutually exclusive with custom_complete. An error is reported if both are set',
        )
        .optional(),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskDelete = {
  project: 'task',
  name: 'task.v2.task.delete',
  sdkName: 'task.v2.task.delete',
  path: '/open-apis/task/v2/tasks/:task_guid',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Tasks-Task-Delete Task-Delete a task.Tasks can no longer be restored after deletion',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({ task_guid: z.string().describe('GUID of task to delete') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskGet = {
  project: 'task',
  name: 'task.v2.task.get',
  sdkName: 'task.v2.task.get',
  path: '/open-apis/task/v2/tasks/:task_guid',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Task-Get Task Details-This api is used to obtain task details, including task summary, description, time, members and other information',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ task_guid: z.string().describe('GUID of task to get') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskList = {
  project: 'task',
  name: 'task.v2.task.list',
  sdkName: 'task.v2.task.list',
  path: '/open-apis/task/v2/tasks',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Task-List tasks-List all tasks of a specific type based on the calling identity. Paging is supported.Currently, only tasks of "my_tasks" are supported. The returned task data is in the order in which the tasks are list by "custom" order in the "Owned" in Task Center',
  accessTokens: ['user'],
  schema: {
    params: z
      .object({
        page_size: z.number().describe('Number of tasks per page').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        completed: z
          .boolean()
          .describe(
            'Whether or not to filter by task completion. Filling in true means only completed tasks are listed; filling in false means only uncompleted tasks are listed. Fill in means no filtering',
          )
          .optional(),
        type: z
          .string()
          .describe('The type of column task currently only supports "my_tasks", that is, "Owned" tasks')
          .optional(),
        user_id_type: z.string().describe('User ID type').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskPatch = {
  project: 'task',
  name: 'task.v2.task.patch',
  sdkName: 'task.v2.task.patch',
  path: '/open-apis/task/v2/tasks/:task_guid',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Tasks-Task-Patch Task-This api is used to update the summary, description, due, etc. of a task.To update a task, fill in all the field names to be updated in the `update_fields` field, and fill in the new value of the field to update in the `task` field. If the field name to be changed is included in the `update_fields`, but no new value is set in `task`, the field will be cleaned to empty. For update api specification, please refer to the "About Resource Update" section in [Feature Overview] .This api can be used to complete tasks by updating `completed_at` of task to a timestamp and restore tasks to uncompleted by setting `completed_at` to 0 . However, at present, regardless of whether the task itself is a countersign task or a or-sign task, the oapi can only support overall completion" of the task, and does not support individual completion. Besides, cannot complete a task that has bee completed. But a completed task can be restored to uncompleted by setting `completed_at` to "0".If you want to update the repeat_rule of a task, you must not also update the `completed_at` of the task or unset the due. See "How to use recuring rule of task?" section in [Tasklist Features Overview] .Task member/reminder/tasklist data cannot be updated by this api.* To add/remove task members, use [Add Task Member]And [Remove Task Member].* To modify the task reminder, use the [Add Task Reminder] and [Remove Task Reminder].* To change the tasklist where the task belongs to, use [Add Task to Tasklist] and [Remove Task from Tasklist]',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      task: z
        .object({
          summary: z
            .string()
            .describe('Task summary. When updating, empty is not allowed. Supports up to 3000 utf8 characters')
            .optional(),
          description: z.string().describe('Task description. Supports up to 3000 utf8 characters').optional(),
          due: z
            .object({
              timestamp: z
                .string()
                .describe(
                  'The timestamp of the due time/date in milliseconds from 1970-01-01 00:00:00. If the expiration time is a date, you need to convert the date to timestamp and set is_all_day = true',
                )
                .optional(),
              is_all_day: z
                .boolean()
                .describe(
                  'Whether to due on a date. If set to true, only the date part of the timestamp will be parsed and stored',
                )
                .optional(),
            })
            .describe(
              'Task due time. Please refer to the "How to use start and due time?" section in [Feature Overview]',
            )
            .optional(),
          extra: z
            .string()
            .describe(
              'Any data that the caller can pass in attached to the task. It will be returned as is when the task details are obtained',
            )
            .optional(),
          completed_at: z.string().describe('The completion time of the task timestamp (ms)').optional(),
          repeat_rule: z
            .string()
            .describe(
              'Task repeat rule. If set, the task is "recurring task". Please refer to the "How to Use Recurring Tasks? " section in [Task Feature Overview]',
            )
            .optional(),
          custom_complete: z
            .object({
              pc: z
                .object({
                  href: z.string().describe('Customize the completed redirect url').optional(),
                  tip: z
                    .object({
                      en_us: z.string().describe('English').optional(),
                      zh_cn: z.string().describe('Chinese').optional(),
                      zh_hk: z.string().describe('Chinese (Hong Kong)').optional(),
                      zh_tw: z.string().describe('Chinese (Taiwan)').optional(),
                      ja_jp: z.string().describe('Japanese').optional(),
                      fr_fr: z.string().describe('French').optional(),
                      it_it: z.string().describe('Italian').optional(),
                      de_de: z.string().describe('German').optional(),
                      ru_ru: z.string().describe('Russian').optional(),
                      th_th: z.string().describe('Thai').optional(),
                      es_es: z.string().describe('Spanish').optional(),
                      ko_kr: z.string().describe('Korean').optional(),
                    })
                    .describe('The pop-up prompt for customization completion is')
                    .optional(),
                })
                .describe('pc client side custom configuration (including mac and windows)')
                .optional(),
              ios: z
                .object({
                  href: z.string().describe('Customize the completed redirect url').optional(),
                  tip: z
                    .object({
                      en_us: z.string().describe('English').optional(),
                      zh_cn: z.string().describe('Chinese').optional(),
                      zh_hk: z.string().describe('Chinese (Hong Kong)').optional(),
                      zh_tw: z.string().describe('Chinese (Taiwan)').optional(),
                      ja_jp: z.string().describe('Japanese').optional(),
                      fr_fr: z.string().describe('French').optional(),
                      it_it: z.string().describe('Italian').optional(),
                      de_de: z.string().describe('German').optional(),
                      ru_ru: z.string().describe('Russian').optional(),
                      th_th: z.string().describe('Thai').optional(),
                      es_es: z.string().describe('Spanish').optional(),
                      ko_kr: z.string().describe('Korean').optional(),
                    })
                    .describe('The pop-up prompt for customization completion is')
                    .optional(),
                })
                .describe('Custom completion configuration of ios')
                .optional(),
              android: z
                .object({
                  href: z.string().describe('Customize the redirect redirect url').optional(),
                  tip: z
                    .object({
                      en_us: z.string().describe('English').optional(),
                      zh_cn: z.string().describe('Chinese').optional(),
                      zh_hk: z.string().describe('Chinese (Hong Kong)').optional(),
                      zh_tw: z.string().describe('Chinese (Taiwan)').optional(),
                      ja_jp: z.string().describe('Japanese').optional(),
                      fr_fr: z.string().describe('French').optional(),
                      it_it: z.string().describe('Italian').optional(),
                      de_de: z.string().describe('German').optional(),
                      ru_ru: z.string().describe('Russian').optional(),
                      th_th: z.string().describe('Thai').optional(),
                      es_es: z.string().describe('Spanish').optional(),
                      ko_kr: z.string().describe('Korean').optional(),
                    })
                    .describe('The pop-up prompt for customization completion is')
                    .optional(),
                })
                .describe('Custom completion configuration of android')
                .optional(),
            })
            .describe(
              'Task custom complete configuration. Please refer to the "How to use custom completion?" section in [Task Feature Overview]',
            )
            .optional(),
          start: z
            .object({
              timestamp: z
                .string()
                .describe(
                  'The timestamp of the start time/date in milliseconds from 1970-01-01 00:00:00. If the start time is a date, you need to convert the date to timestamp and set is_all_day=true',
                )
                .optional(),
              is_all_day: z
                .boolean()
                .describe(
                  'Whether to start on a date. If set to true, only the date part of the timestamp will be parsed and stored',
                )
                .optional(),
            })
            .describe(
              'Task start time. Please refer to the "How to use start and due time?" section in [Feature Overview]',
            )
            .optional(),
          mode: z.number().describe('The completion mode of the task. 1: countersign task; 2: or-sign task').optional(),
          is_milestone: z.boolean().describe('Whether is a milestone task or not').optional(),
          custom_fields: z
            .array(
              z.object({
                guid: z.string().describe('Custom field guid'),
                number_value: z
                  .string()
                  .describe(
                    'A custom field value of a number type, fill in the string representation of a valild number. Or unset the value with an empty string',
                  )
                  .optional(),
                member_value: z
                  .array(
                    z.object({
                      id: z.string().describe('Indicates the id of member').optional(),
                      type: z.string().describe('Type of member').optional(),
                      name: z.string().describe('Member name').optional(),
                    }),
                  )
                  .describe(
                    'Custom field values for member types. The one or multiple users can be added (following the member format, only user type is supported). Only one value can be passed in when the field setting is "multi=false". Value can be unset with an empty array',
                  )
                  .optional(),
                datetime_value: z
                  .string()
                  .describe(
                    'Date type Custom field value, you can enter a millisecond string representing the date. Set to empty string means set to empty',
                  )
                  .optional(),
                single_select_value: z
                  .string()
                  .describe(
                    'single_select field value, you can fill in a option_guid of the field options, or unset it with an empty string',
                  )
                  .optional(),
                multi_select_value: z
                  .array(z.string())
                  .describe(
                    'multi_select type field value, you can fill in one or more option_guid of this field, or unset it with an empty array',
                  )
                  .optional(),
                text_value: z
                  .string()
                  .describe('Text custom field value, up to 3000 characters. Use empty string "" to unset the value')
                  .optional(),
              }),
            )
            .describe(
              'Custom field values. If updted, the value needs to be set to the corresponding field according to the field type.* When `type` is "number", the `number_value` field should be used to represent the value of number custom field;* When "type" is "member", the `member_value` field should be used to represent the value of member custom field;* When `type` is "datetime", `datetime_value` field should be used to represent the value of the datetime custom field.* When `type` is "single_select", the `single_select_value` field should be used to represent the value of single_select custom field.* When `type` is "multi_select", the `multi_select_value` field should be used to represent the value of multi_select custom field.* When `type` is "text", the `text_value` field should be used to represent the value of text custom field',
            )
            .optional(),
        })
        .describe(
          'To update the task data, just set the field that appears in the `update_fields`. If update_fields sets a field name to be changed, but no new value is set in the task, the field will be cleared',
        )
        .optional(),
      update_fields: z
        .array(z.string())
        .describe(
          'Set the fields that need to be modified<md-enum><md-enum-item key="summary">Task summary</md-enum-item><md-enum-item key="description">Task description</md-enum-item><md-enum-item key="start">Task start time </md-enum-item><md-enum-item key="due">Task due time </md-enum-item><md-enum-item key = "completed_at">Task completion time</md-enum-item><md-enum-item key="extra">Task attached custom data</md-enum-item><md-enum-item key="custom_complete"> Task custom completion config</md-enum-item><md-enum-item key="repeat_rule">Task repeat rule</md-enum-item ></md-enum>',
        ),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ task_guid: z.string().describe('GUID of task to update') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskRemoveDependencies = {
  project: 'task',
  name: 'task.v2.task.removeDependencies',
  sdkName: 'task.v2.task.removeDependencies',
  path: '/open-apis/task/v2/tasks/:task_guid/remove_dependencies',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Task-Remove Dependency-Removes one or more dependencies from a task. You can remove dependencies by passing their `task_guid`.Note that if the dependency to be removed is not a dependency of the current task, it will be automatically ignored. The API will return success',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      dependencies: z
        .array(z.object({ task_guid: z.string().describe('GUIDs for dependent tasks') }))
        .describe('Dependencies to remove'),
    }),
    path: z.object({ task_guid: z.string().describe('GUID of task to remove the dependencies') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskRemoveMembers = {
  project: 'task',
  name: 'task.v2.task.removeMembers',
  sdkName: 'task.v2.task.removeMembers',
  path: '/open-apis/task/v2/tasks/:task_guid/remove_members',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Task-Remove members from task-Remove task members. Multiple members can be removed at one time. The assignees and followers of the task can be removed. When removing, if the member to be removed is not one of this task members, it will be automatically ignored. This api returns the task data after removing the member, including the list of task members after removal',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      members: z
        .array(
          z.object({
            id: z.string().describe('Member ID'),
            type: z.string().describe('Member Type').optional(),
            role: z.string().describe('Member role, support "assignee" or "follower"'),
          }),
        )
        .describe('List of members to remove'),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ task_guid: z.string().describe('GUID of task from where members are removed') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskRemoveReminders = {
  project: 'task',
  name: 'task.v2.task.removeReminders',
  sdkName: 'task.v2.task.removeReminders',
  path: '/open-apis/task/v2/tasks/:task_guid/remove_reminders',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Task-Remove task reminders-Remove a reminder from the task.If the reminder to be removed does not exist in the first place, this interface will directly return success',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({ reminder_ids: z.array(z.string()).describe('IDs of reminders to be removed') }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ task_guid: z.string().describe('GUID of task from which reminder is removed') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskRemoveTasklist = {
  project: 'task',
  name: 'task.v2.task.removeTasklist',
  sdkName: 'task.v2.task.removeTasklist',
  path: '/open-apis/task/v2/tasks/:task_guid/remove_tasklist',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Task-Remove task from tasklist-Remove a task from a tasklist. Returns task details.If the task is not in the tasklist, the api will return success',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({ tasklist_guid: z.string().describe('Tasklist guid to remove from') }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ task_guid: z.string().describe('GUID of task to remove from tasklist') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskSubtaskCreate = {
  project: 'task',
  name: 'task.v2.taskSubtask.create',
  sdkName: 'task.v2.taskSubtask.create',
  path: '/open-apis/task/v2/tasks/:task_guid/subtasks',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Subtask-Create Subtask-Create a subtask for a task.The api function is exactly the same as the [Create Task] except that the parent task GUID needs to be provided',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      summary: z.string().describe('Task summary'),
      description: z.string().describe('Task description').optional(),
      due: z
        .object({
          timestamp: z
            .string()
            .describe(
              'The timestamp of the due time/date in milliseconds from 1970-01-01 00:00:00. If the expiration time is a date, you need to convert the date to timestamp and set is_all_day = true',
            )
            .optional(),
          is_all_day: z
            .boolean()
            .describe(
              'Whether to due on a date. If set to true, only the date part of the timestamp will be parsed and stored',
            )
            .optional(),
        })
        .describe('Task due')
        .optional(),
      origin: z
        .object({
          platform_i18n_name: z
            .object({
              en_us: z.string().describe('English').optional(),
              zh_cn: z.string().describe('Chinese').optional(),
              zh_hk: z.string().describe('Chinese (Hong Kong)').optional(),
              zh_tw: z.string().describe('Chinese (Taiwan)').optional(),
              ja_jp: z.string().describe('Japanese').optional(),
              fr_fr: z.string().describe('French').optional(),
              it_it: z.string().describe('Italian').optional(),
              de_de: z.string().describe('German').optional(),
              ru_ru: z.string().describe('Russian').optional(),
              th_th: z.string().describe('Thai').optional(),
              es_es: z.string().describe('Spanish').optional(),
              ko_kr: z.string().describe('Korean').optional(),
            })
            .describe(
              'The name of the task import source to display on the task center details page. A multilingual version is required',
            )
            .optional(),
          href: z
            .object({
              url: z.string().describe('The url corresponding to the task').optional(),
              title: z.string().describe('The title corresponding to the task').optional(),
            })
            .describe('Source of task association platform details page link')
            .optional(),
        })
        .describe('Task-associated third-party platform source information. See [How to use Origin?]')
        .optional(),
      extra: z
        .string()
        .describe(
          'Any data that the caller can pass in attached to the task. It will be returned as is when the task details are obtained',
        )
        .optional(),
      completed_at: z.string().describe('The completion time of the task timestamp (ms)').optional(),
      members: z
        .array(
          z.object({
            id: z.string().describe('Indicates the id of member').optional(),
            type: z.string().describe('Type of member').optional(),
            role: z.string().describe('Member role, supporting "assignee" or "follower"').optional(),
          }),
        )
        .describe('Task member list')
        .optional(),
      repeat_rule: z
        .string()
        .describe('Task repeat_rule. Please refer to the "How to use recurring task?" section in [Feature Overview]')
        .optional(),
      custom_complete: z
        .object({
          pc: z
            .object({
              href: z.string().describe('Customize the completed redirect url').optional(),
              tip: z
                .object({
                  en_us: z.string().describe('English').optional(),
                  zh_cn: z.string().describe('Chinese').optional(),
                  zh_hk: z.string().describe('Chinese (Hong Kong)').optional(),
                  zh_tw: z.string().describe('Chinese (Taiwan)').optional(),
                  ja_jp: z.string().describe('Japanese').optional(),
                  fr_fr: z.string().describe('French').optional(),
                  it_it: z.string().describe('Italian').optional(),
                  de_de: z.string().describe('German').optional(),
                  ru_ru: z.string().describe('Russian').optional(),
                  th_th: z.string().describe('Thai').optional(),
                  es_es: z.string().describe('Spanish').optional(),
                  ko_kr: z.string().describe('Korean').optional(),
                })
                .describe('The pop-up prompt for customization completion is')
                .optional(),
            })
            .describe('pc client side custom configuration (including mac and windows)')
            .optional(),
          ios: z
            .object({
              href: z.string().describe('Customize the completed redirect url').optional(),
              tip: z
                .object({
                  en_us: z.string().describe('English').optional(),
                  zh_cn: z.string().describe('Chinese').optional(),
                  zh_hk: z.string().describe('Chinese (Hong Kong)').optional(),
                  zh_tw: z.string().describe('Chinese (Taiwan)').optional(),
                  ja_jp: z.string().describe('Japanese').optional(),
                  fr_fr: z.string().describe('French').optional(),
                  it_it: z.string().describe('Italian').optional(),
                  de_de: z.string().describe('German').optional(),
                  ru_ru: z.string().describe('Russian').optional(),
                  th_th: z.string().describe('Thai').optional(),
                  es_es: z.string().describe('Spanish').optional(),
                  ko_kr: z.string().describe('Korean').optional(),
                })
                .describe('The pop-up prompt for customization completion is')
                .optional(),
            })
            .describe('Custom completion configuration of ios client')
            .optional(),
          android: z
            .object({
              href: z.string().describe('Customize the completed redirect url').optional(),
              tip: z
                .object({
                  en_us: z.string().describe('English').optional(),
                  zh_cn: z.string().describe('Chinese').optional(),
                  zh_hk: z.string().describe('Chinese (Hong Kong)').optional(),
                  zh_tw: z.string().describe('Chinese (Taiwan)').optional(),
                  ja_jp: z.string().describe('Japanese').optional(),
                  fr_fr: z.string().describe('French').optional(),
                  it_it: z.string().describe('Italian').optional(),
                  de_de: z.string().describe('German').optional(),
                  ru_ru: z.string().describe('Russian').optional(),
                  th_th: z.string().describe('Thai').optional(),
                  es_es: z.string().describe('Spanish').optional(),
                  ko_kr: z.string().describe('Korean').optional(),
                })
                .describe('The pop-up prompt for customization completion is')
                .optional(),
            })
            .describe('Custom completion configuration of android client')
            .optional(),
        })
        .describe(
          'Task custom complete configuration. Please refer to the "How to use custom completion?" section in [Feature Overview]',
        )
        .optional(),
      tasklists: z
        .array(
          z.object({
            tasklist_guid: z.string().describe('The GUID of the tasklist to which the task is to be added').optional(),
            section_guid: z
              .string()
              .describe(
                'The section GUID of the tasklist where the task is added. If the tasklist GUID is set but section GUID is unset, the default section of the tasklist is automatically used',
              )
              .optional(),
          }),
        )
        .describe(
          'Information about the tasklist where the task is added. If set, it means that the created task will be added directly to the specified tasklist',
        )
        .optional(),
      client_token: z
        .string()
        .describe(
          'Idempotent token. If provided triggers the idempotent behavior.Please refer to the "Idempotent Invocation" section in [Feature Overview]',
        )
        .optional(),
      start: z
        .object({
          timestamp: z
            .string()
            .describe(
              'The timestamp of the start time/date in milliseconds from 1970-01-01 00:00:00. If the start time is a date, you need to convert the date to timestamp and set is_all_day = true',
            )
            .optional(),
          is_all_day: z
            .boolean()
            .describe(
              'Whether to start on a date. If set to true, only the date part of the timestamp will be parsed and stored',
            )
            .optional(),
        })
        .describe('Task start time (ms)')
        .optional(),
      reminders: z
        .array(
          z.object({
            relative_fire_minute: z
              .number()
              .describe(
                'The number of minutes of reminder time relative to the deadline. For example, 30 means 30 minutes before the deadline; 0 means the deadline reminder',
              ),
          }),
        )
        .describe('Task reminder')
        .optional(),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ task_guid: z.string().describe('Parent task GUID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskSubtaskList = {
  project: 'task',
  name: 'task.v2.taskSubtask.list',
  sdkName: 'task.v2.taskSubtask.list',
  path: '/open-apis/task/v2/tasks/:task_guid/subtasks',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Subtask-List Subtask-Get all subtasks of a task.Paging is supported, and data is returned in the order in which subtasks are placed on the Lark App UI',
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
        user_id_type: z.string().describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({ task_guid: z.string().describe('GUID of parent task').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TaskTasklists = {
  project: 'task',
  name: 'task.v2.task.tasklists',
  sdkName: 'task.v2.task.tasklists',
  path: '/open-apis/task/v2/tasks/:task_guid/tasklists',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Task-List tasklists of task-List the all lists where a task belongs to, including the tasklist GUID and section GUID.Only the tasklists that calling identity has read permission will be returned',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({ task_guid: z.string().describe('GUID of task to list tasklists') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistActivitySubscriptionCreate = {
  project: 'task',
  name: 'task.v2.tasklistActivitySubscription.create',
  sdkName: 'task.v2.tasklistActivitySubscription.create',
  path: '/open-apis/task/v2/tasklists/:tasklist_guid/activity_subscriptions',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Tasklist Activity Subscription-Create Activity Subscription-Create an activity subscription for a tasklist. Each subscription can contain multiple subscribers (currently only group chats are supported). After the subscription\'s creation, if the corresponding event occurs in the tasklist, a notification message will be sent to the subscribers defined in the subscription. Each tasklist can create up to 50 subscriptions. Each subscription supports up to 50 subscribers.A subscription can set which kinds of events (event_key) should be notified by setting `include_keys`. If the `include_keys` are empty, no events are notified. When necessary, you can create supscription by which no notification messages will be sent by setting `disabled` to "true"',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      name: z.string().describe('Subscription name, cannot be empty, up to 50 characters'),
      subscribers: z
        .array(
          z.object({
            id: z.string().describe('Indicates the id of member').optional(),
            type: z.string().describe('Type of member (currently only chat is supported)').optional(),
          }),
        )
        .describe('Subscribers list'),
      include_keys: z
        .array(z.number())
        .describe(
          "A list of subscribed event keys. Each event key is represented by an integer. Currently following event keys are supported:- 100: Adde a task to a tasklist- 101: Remove a task from a tasklist- 103: Complete a task in the tasklist- 104: Uncomplte task in the tasklist- 109: Assignee of a task in the tasklist is added- 110: Assignee of a task in the tasklist is updated- 111: Assignee of a task in the tasklist is removed- 119: Attachments are added to a task in the tasklist- 121: Create a comment of a task in the tasklist- 122: Reply a comment of a task in the tasklist- 129: Set start time of task of a task in the tasklist- 130: Set due time of task of a task in the tasklist- 131: Set both start and due time of a task in the tasklist- 132: Unset both start and due time of a task in the tasklistEmpty event keys list is allowed which means no event's notification will be sent. Duplication is not allowed",
        ),
      disabled: z.boolean().describe('whether the subscription is disabled').optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ tasklist_guid: z.string().describe('tasklist GUID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistActivitySubscriptionDelete = {
  project: 'task',
  name: 'task.v2.tasklistActivitySubscription.delete',
  sdkName: 'task.v2.tasklistActivitySubscription.delete',
  path: '/open-apis/task/v2/tasklists/:tasklist_guid/activity_subscriptions/:activity_subscription_guid',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Tasks-Tasklist Activity Subscription-Delete Activity Subscription-Delete an activity subscription by giving a tasklist GUID and its subscription GUID. The deleted subscription is not recoverable',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      tasklist_guid: z
        .string()
        .describe('tasklist GUID, which can be created by[Create Tasklist], or queried by [List Tasklist]'),
      activity_subscription_guid: z
        .string()
        .describe(
          'subscription GUID, which can be created by [Create Activity Subscription], or queried by[List Activity Subscription]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistActivitySubscriptionGet = {
  project: 'task',
  name: 'task.v2.tasklistActivitySubscription.get',
  sdkName: 'task.v2.tasklistActivitySubscription.get',
  path: '/open-apis/task/v2/tasklists/:tasklist_guid/activity_subscriptions/:activity_subscription_guid',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Tasks-Tasklist Activity Subscription-Get Activity Subscription-Providing a tasklist GUID and tasklist's subscription GUID, get the details of the subscription data, including name, subscriber, list of event keys that can be notified, etc",
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      tasklist_guid: z
        .string()
        .describe('tasklist GUID, which can be created by[Create Tasklist], or queried by [List Tasklist]'),
      activity_subscription_guid: z
        .string()
        .describe(
          'subscription GUID, which can be created by [Create Activity Subscription], or queried by[List Activity Subscription]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistActivitySubscriptionList = {
  project: 'task',
  name: 'task.v2.tasklistActivitySubscription.list',
  sdkName: 'task.v2.tasklistActivitySubscription.list',
  path: '/open-apis/task/v2/tasklists/:tasklist_guid/activity_subscriptions',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Tasklist Activity Subscription-List Activity Subscription-Given the tasklist GUID, list its all activity subscriptions. Results are sorted by subscription create time',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        limit: z.number().describe('Maximum number of results returned').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({
      tasklist_guid: z
        .string()
        .describe('Tasklist GUID, which can be created by[Create Tasklist], or queried by [List Tasklist]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistActivitySubscriptionPatch = {
  project: 'task',
  name: 'task.v2.tasklistActivitySubscription.patch',
  sdkName: 'task.v2.tasklistActivitySubscription.patch',
  path: '/open-apis/task/v2/tasklists/:tasklist_guid/activity_subscriptions/:activity_subscription_guid',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Tasks-Tasklist Activity Subscription-Patch Activity Subscription-Update an activity subscription by providing a tasklist GUID and a subscription GUID. When updating, fill in all field names to be updated in the `update_fields` field, and fill in the new value of the field in the `activity_subscription` field.`update_fields` support following fields:* `name`: the name of the subscription* `subscribers`: Subscriber list. when updated, the old subscribers list will be completely replaced with the new one. Each subscription supports up to 50 subscribers. And only chat subscribers are allowed.* `include_keys`: subscribed event keys. when updated, the old list will be completely replaced with the new one. Only supported event keys are allowed (see the field description below). Duplication is not allowed.* `disabled`: whether the subscription is disabled or not',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      activity_subscription: z
        .object({
          name: z.string().describe('subscription name, when updated, it should be 1~50 characters').optional(),
          subscribers: z
            .array(
              z.object({
                id: z.string().describe('member_id').optional(),
                type: z.string().describe("member type. only support 'chat'").optional(),
              }),
            )
            .describe('subscribers list, when updated, up to 50 subscribers are supported')
            .optional(),
          include_keys: z
            .array(z.number())
            .describe(
              "subscribed event keys. Each event key is represented by an integer. Currently following event keys are supported:- 100: Adde a task to a tasklist- 101: Remove a task from a tasklist- 103: Complete a task in the tasklist- 104: Uncomplte task in the tasklist- 109: Assignee of a task in the tasklist is added- 110: Assignee of a task in the tasklist is updated- 111: Assignee of a task in the tasklist is removed- 119: Attachments are added to a task in the tasklist- 121: Create a comment of a task in the tasklist- 122: Reply a comment of a task in the tasklist- 129: Set start time of task of a task in the tasklist- 130: Set due time of task of a task in the tasklist- 131: Set both start and due time of a task in the tasklist- 132: Unset both start and due time of a task in the tasklistEmpty event keys list is allowed which means no event's notification will be sent. Duplication is not allowed",
            )
            .optional(),
          disabled: z.boolean().describe('whether the subscription is disabled').optional(),
        })
        .describe('subscription data to update'),
      update_fields: z
        .array(
          z
            .enum(['name', 'include_keys', 'subscribers', 'disabled'])
            .describe(
              'Options:name(subscription name),include_keys(subscribed event keys),subscribers(susbscribers list),disabled(whether the subscription is disabled)',
            ),
        )
        .describe('list of fields to update'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      tasklist_guid: z
        .string()
        .describe('tasklist GUID, which can be created by[Create Tasklist], or queried by [List Tasklist]'),
      activity_subscription_guid: z
        .string()
        .describe(
          'subscription GUID, which can be created by [Create Activity Subscription], or queried by[List Activity Subscription]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistAddMembers = {
  project: 'task',
  name: 'task.v2.tasklist.addMembers',
  sdkName: 'task.v2.tasklist.addMembers',
  path: '/open-apis/task/v2/tasklists/:tasklist_guid/add_members',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Tasklist-Add Tasklist Members-Add one or more members to a tasklist. Members can be set by setting `members` fields. For the format of member, please refer to the " How to represent members of tasks and tasklists?" section in [Feature Overview] .A tasklist member can be a user, app or chat. Each member can as "editor" or "viewer" role. A chat member means that all chatters in chat automatically have the tasklist role of chat memberIf the member to be added is already a member and the role is the same as set in the request, it will be automatically ignored and the api returns success.If the member to be added is already a tasklist member, and the role is not set in the request (for example, the original role is viewer, and the request is set to editor), it is equivalent to updating its role.If the member to be added is already the tasklist owner, it is automatically ignored. In this case api returns success. The role of tasklist owner does not change.This api cannot be used to update the tasklist owner. To do it, you can use the [Update Tasklist]',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      members: z
        .array(
          z.object({
            id: z.string().describe('Member ID').optional(),
            type: z
              .string()
              .describe(
                'Member types, supported types include:<md-enum><md-enum-item key="user">Ordinary user, in this case member id should be an ID representing the user, such as open_id. The specific format depends on the user_id_type parameter</md-enum-item><md-enum-item key="chat">chat, in which case the member id shold be an Open Chat ID</md-enum-item><md-enum-item key="app">application, in this case the member ID should be an appid</md-enum-item></md-enum>',
              )
              .optional(),
            role: z
              .string()
              .describe(
                'Member roles. Supported roles includes:<md-enum ><md-enum-item key = "editor">editor</md-enum-item><md-enum-item key="viewer">viewer</md-enum-item ></md-enum>Default is "viewer".The tasklist owner role cannot be set through this field',
              )
              .optional(),
          }),
        )
        .describe(
          'Members to add. For the format of member, please refer to the " How to represent members of tasks and tasklists?" section in [Feature Overview]',
        ),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z
      .object({ tasklist_guid: z.string().describe('GUID of tasklist to which new members is added').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistCreate = {
  project: 'task',
  name: 'task.v2.tasklist.create',
  sdkName: 'task.v2.tasklist.create',
  path: '/open-apis/task/v2/tasklists',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Tasklist-Create Tasklist-Create a tasklist. Tasklist can be used to organize and manage multiple tasks belonging to the same project.When creating, the name of the tasklist must be filled in. At the same time, tasklist member can be set by specifying `members` field. For the format of member, please refer to the " How to represent members of tasks and tasklists?" section in [Feature Overview] .After the tasklist is created, the creator automatically becomes the tasklist owner. If sets the creator to editor/viewer, the user eventually becomes the tasklist owner and automatically disappears from the member list. This is because the same user can only have one role on the same tasklist',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      name: z.string().describe('Tasklist name, required. Empty is not allowed. Up to 100 characters'),
      members: z
        .array(
          z.object({
            id: z.string().describe('Member ID').optional(),
            type: z
              .string()
              .describe(
                'Types of members, supported types include:<md-enum><md-enum-item key = "user">Ordinary user, in this case the member id should be an ID representing the user, such as open_id. The specific format depends on the user_id_type parameter</md-enum-item><md-enum-item key="chat">chat, in which case the member id should be an Open Chat ID </md-enum-item><md-enum-item key="app">application, in this case the member id should be the ID of an application</md-enum-item></md-enum>',
              )
              .optional(),
            role: z
              .string()
              .describe('Member role, which can be "editor" or "viewer". Defaults to "viewer"')
              .optional(),
          }),
        )
        .describe(
          'Tasklist member list. For the format of member, please refer to the " How to represent members of tasks and tasklists?" section in [Feature Overview]',
        )
        .optional(),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistDelete = {
  project: 'task',
  name: 'task.v2.tasklist.delete',
  sdkName: 'task.v2.tasklist.delete',
  path: '/open-apis/task/v2/tasklists/:tasklist_guid',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Tasks-Tasklist-Delete Tasklist-Delete a tasklist.After a tasklist is deleted, no action can be performed on the tasklist and the tasklist can no longer be accessed. A deleted tasklist cannot be recovered',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({ tasklist_guid: z.string().describe('GUID of tasklist to delete').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistGet = {
  project: 'task',
  name: 'task.v2.tasklist.get',
  sdkName: 'task.v2.tasklist.get',
  path: '/open-apis/task/v2/tasklists/:tasklist_guid',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Tasklist-Get Tasklist Details-Get the details of a tasklist, including list name, owner, list members, etc',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ tasklist_guid: z.string().describe('Tasklist GUID').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistList = {
  project: 'task',
  name: 'task.v2.tasklist.list',
  sdkName: 'task.v2.tasklist.list',
  path: '/open-apis/task/v2/tasklists',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Tasklist-List Tasklists-List all the tasklists the calling identity has read permission',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_size: z.number().describe('Number of tasklist returned in one page').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        user_id_type: z.string().describe('User ID type').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistPatch = {
  project: 'task',
  name: 'task.v2.tasklist.patch',
  sdkName: 'task.v2.tasklist.patch',
  path: '/open-apis/task/v2/tasklists/:tasklist_guid',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Tasks-Tasklist-Patch Tasklist-Update a tasklist. You can update the name and owner of the tasklist.When updating the tasklist, fill in all the tasklist field names to be modified in the \'update_fields \'field, and fill in the new value of the field to be modified in the\'tasklist\' field. For details of update api specification, please refer to the "About Resource Update" section in [Feature Overview] .Updatable fields include:* `name`: tasklist name* `owner`: tasklist ownerWhen updating tasklist owner, if the new owner is already an "editor" or "viewer", it will be directly upgraded to the owner and automatically disappear from the member list. This is because the same user can only have one role in the same tasklist. Meanwhile, you can set the new role of original owner by setting `origin_owner_to_role` field.This api cannot be used to update members of the tasklist and add or delete tasks in the tasklist.* To add or delete members from the tasklist, you can use the [Add Tasklist Member] and [Remove Tasklist Member] api.* To add or delete tasks in the tasklist, you can use the [Add Task to Tasklist] and [Remove Task from Tasklist] api',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      tasklist: z
        .object({
          name: z.string().describe('List name. To update, cannot be set to null. Maximum 100 characters').optional(),
          owner: z
            .object({
              id: z.string().describe('Indicates the id of member').optional(),
              type: z
                .string()
                .describe('The type of member, which can be "user" or "app". The type of owner cannot be "chat"')
                .optional(),
              role: z.string().describe('Member role, which must be "owner" at this point').optional(),
            })
            .describe('Updated list owner')
            .optional(),
        })
        .describe('Data to update the manifest'),
      update_fields: z
        .array(z.string())
        .describe(
          'Field name to update, support<md-enum><md-enum-item key="name">Tasklist name </md-enum-item><md-enum-item key="owner">Tasklist owner </md-enum-item></md-enum>',
        ),
      origin_owner_to_role: z
        .enum(['editor', 'viewer', 'none'])
        .describe(
          'This field indicates that if a new owner is updated, the original owner is set to the specified collaborator role. Effective only when the manifest owner is updated. Available options are "editor", "viewer" or "none", Default option is "none".If not set of setting to "none", the original tasklist owner will not have any roles. If not auhorized through other channels (such as through chat members), the original tasklist owner will lose all permissions to the tasklist. Options:editor(Original owner becomes tasklist editor),viewer(Original owner becomes tasklist viewer),none(The original owner loses role of the tasklist)',
        )
        .optional(),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z.object({ tasklist_guid: z.string().describe('Globally unique GUID of the manifest to update') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistRemoveMembers = {
  project: 'task',
  name: 'task.v2.tasklist.removeMembers',
  sdkName: 'task.v2.tasklist.removeMembers',
  path: '/open-apis/task/v2/tasklists/:tasklist_guid/remove_members',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Tasks-Tasklist-Remove Tasklist Members-Removes one or more members of the tasklist. Members to remove can be specified by setting `members` field。For the format of member, please refer to the " How to represent members of tasks and tasklists?" section in [Feature Overview] .The "role" field does not need to be filled in for the member to be removed in the request, since the id and type of a member can determine the unique member in the tasklist.If the member to be removed is not in the tasklist, it is automatically ignored and the api returns success.This api cannot be used to remove the tasklist owner. If the member to be removed is the list owner, it will be automatically ignored. To update the tasklist owner, you need to call [Update Tasklist]',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      members: z
        .array(
          z.object({
            id: z.string().describe('Member ID').optional(),
            type: z
              .string()
              .describe(
                'Member types, supported types include:<md-enum><md-enum-item key="user">ordinary user, in this case member id should be an ID representing the user, such as open_id. The specific format depends on the user_id_type parameter</md-enum-item><md-enum-item key="chat">chat, in which case the member id shold be an Open Chat ID</md-enum-item><md-enum-item key="app">application, in this case the member ID should be an appid</md-enum-item></md-enum>',
              )
              .optional(),
            role: z.string().describe('Tasklist role. This field is not needed in this api').optional(),
          }),
        )
        .describe(
          'Members to remove. For the format of member, please refer to the " How to represent members of tasks and tasklists?" section in [Feature Overview]',
        ),
    }),
    params: z.object({ user_id_type: z.string().describe('User ID type').optional() }).optional(),
    path: z
      .object({ tasklist_guid: z.string().describe('GUID of tasklist from which members are removed').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2TasklistTasks = {
  project: 'task',
  name: 'task.v2.tasklist.tasks',
  sdkName: 'task.v2.tasklist.tasks',
  path: '/open-apis/task/v2/tasklists/:tasklist_guid/tasks',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Tasks-Tasklist-Get Tasks of Tasklist-Gets the summary of tasks belonging to a tasklist. This API supports pagination. Tasks in the tasklist are returned in the "custom" order.This API supports simple filtering by task completion status or task creation time range',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_size: z.number().describe('The number of tasks in one page').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        completed: z
          .boolean()
          .describe(
            'Only return tasks with a specific completion status. Filling in "true" means returning completed tasks; "false" means returning only uncompleted tasks; not filling in means not filtering by completion status',
          )
          .optional(),
        created_from: z
          .string()
          .describe(
            'Task creation start timestamp (ms), inclusive. Default is the timestamp of the first created task int the tasklist',
          )
          .optional(),
        created_to: z
          .string()
          .describe(
            'Task end start timestamp (ms), inclusive. Default is the timestamp of the last created task int the tasklist',
          )
          .optional(),
        user_id_type: z.string().describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({ tasklist_guid: z.string().describe('GUID of the tasklist') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV2Tools = [
  taskV2AttachmentDelete,
  taskV2AttachmentGet,
  taskV2AttachmentList,
  taskV2CommentCreate,
  taskV2CommentDelete,
  taskV2CommentGet,
  taskV2CommentList,
  taskV2CommentPatch,
  taskV2CustomFieldAdd,
  taskV2CustomFieldCreate,
  taskV2CustomFieldGet,
  taskV2CustomFieldList,
  taskV2CustomFieldOptionCreate,
  taskV2CustomFieldOptionPatch,
  taskV2CustomFieldPatch,
  taskV2CustomFieldRemove,
  taskV2SectionCreate,
  taskV2SectionDelete,
  taskV2SectionGet,
  taskV2SectionList,
  taskV2SectionPatch,
  taskV2SectionTasks,
  taskV2TaskAddDependencies,
  taskV2TaskAddMembers,
  taskV2TaskAddReminders,
  taskV2TaskAddTasklist,
  taskV2TaskCreate,
  taskV2TaskDelete,
  taskV2TaskGet,
  taskV2TaskList,
  taskV2TaskPatch,
  taskV2TaskRemoveDependencies,
  taskV2TaskRemoveMembers,
  taskV2TaskRemoveReminders,
  taskV2TaskRemoveTasklist,
  taskV2TaskSubtaskCreate,
  taskV2TaskSubtaskList,
  taskV2TaskTasklists,
  taskV2TasklistActivitySubscriptionCreate,
  taskV2TasklistActivitySubscriptionDelete,
  taskV2TasklistActivitySubscriptionGet,
  taskV2TasklistActivitySubscriptionList,
  taskV2TasklistActivitySubscriptionPatch,
  taskV2TasklistAddMembers,
  taskV2TasklistCreate,
  taskV2TasklistDelete,
  taskV2TasklistGet,
  taskV2TasklistList,
  taskV2TasklistPatch,
  taskV2TasklistRemoveMembers,
  taskV2TasklistTasks,
];
