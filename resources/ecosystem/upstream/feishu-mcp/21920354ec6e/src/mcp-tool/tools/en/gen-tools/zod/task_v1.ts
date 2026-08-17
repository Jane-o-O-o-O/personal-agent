import { z } from 'zod';
export type taskV1ToolName =
  | 'task.v1.task.batchDeleteCollaborator'
  | 'task.v1.task.batchDeleteFollower'
  | 'task.v1.taskCollaborator.create'
  | 'task.v1.taskCollaborator.delete'
  | 'task.v1.taskCollaborator.list'
  | 'task.v1.taskComment.create'
  | 'task.v1.taskComment.delete'
  | 'task.v1.taskComment.get'
  | 'task.v1.taskComment.list'
  | 'task.v1.taskComment.update'
  | 'task.v1.task.complete'
  | 'task.v1.task.create'
  | 'task.v1.task.delete'
  | 'task.v1.taskFollower.create'
  | 'task.v1.taskFollower.delete'
  | 'task.v1.taskFollower.list'
  | 'task.v1.task.get'
  | 'task.v1.task.list'
  | 'task.v1.task.patch'
  | 'task.v1.taskReminder.create'
  | 'task.v1.taskReminder.delete'
  | 'task.v1.taskReminder.list'
  | 'task.v1.task.uncomplete';
export const taskV1TaskBatchDeleteCollaborator = {
  project: 'task',
  name: 'task.v1.task.batchDeleteCollaborator',
  sdkName: 'task.v1.task.batchDeleteCollaborator',
  path: '/open-apis/task/v1/tasks/:task_id/batch_delete_collaborator',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Collaborator-Batch delete collaborator-This API is to delete multiple collaborators from a task',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        id_list: z
          .array(z.string())
          .describe(
            'List of collaborator ids added when creating the task. The value passed in is user_id or open_id, determined by user_id_type. For details, see: [How to get ID]',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ task_id: z.string().describe('Task ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskBatchDeleteFollower = {
  project: 'task',
  name: 'task.v1.task.batchDeleteFollower',
  sdkName: 'task.v1.task.batchDeleteFollower',
  path: '/open-apis/task/v1/tasks/:task_id/batch_delete_follower',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Follower-Batch delete followers-This API is to delete multiple followers from a task',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({ id_list: z.array(z.string()).describe('Multiple follower ids to be deleted').optional() })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ task_id: z.string().describe('Task ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskCollaboratorCreate = {
  project: 'task',
  name: 'task.v1.taskCollaborator.create',
  sdkName: 'task.v1.taskCollaborator.create',
  path: '/open-apis/task/v1/tasks/:task_id/collaborators',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Collaborator-Add collaborators-This API is used to add collaborators for a task. Multiple collaborators can be added by one request. Only the creator and collaborator of the task can add executors, and followers do not have permission to add them',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        id: z
          .string()
          .describe(
            'The ID of the task collaborator. The value passed in is user_id or open_id, determined by user_id_type. For details, see: [How to get ID]<md-alert>Deprecated, reserved for forward compatibility in the early days when only one person was added at a time, but it is no longer recommended, it is recommended to use the id_list field</md-alert>',
          )
          .optional(),
        id_list: z
          .array(z.string())
          .describe(
            'List of collaborator ids added when creating the task. The value passed in is user_id or open_id, determined by user_id_type. For details, see: [How to get ID]',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      task_id: z
        .string()
        .describe(
          'The task ID, which can be obtained from the id field in the response body [when the task is created]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskCollaboratorDelete = {
  project: 'task',
  name: 'task.v1.taskCollaborator.delete',
  sdkName: 'task.v1.taskCollaborator.delete',
  path: '/open-apis/task/v1/tasks/:task_id/collaborators/:collaborator_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Collaborator-Delete a collaborator-This API is used to delete a task collaborator',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      task_id: z.string().describe('Task ID'),
      collaborator_id: z.string().describe('Open ID or User ID of the task collaborator(specified by user_id_type)'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskCollaboratorList = {
  project: 'task',
  name: 'task.v1.taskCollaborator.list',
  sdkName: 'task.v1.taskCollaborator.list',
  path: '/open-apis/task/v1/tasks/:task_id/collaborators',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Collaborator-Obtain a collaborator list-This API is used to obtain a task list. The result can be displayed by pages. A maximum of 50 entries are supported',
  accessTokens: ['tenant', 'user'],
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
    path: z.object({ task_id: z.string().describe('Task ID').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskCommentCreate = {
  project: 'task',
  name: 'task.v1.taskComment.create',
  sdkName: 'task.v1.taskComment.create',
  path: '/open-apis/task/v1/tasks/:task_id/comments',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Comment-Create a comment-This API is used to create and reply to a task comment. When the value of the parent_id field is 0, this API is used to create a comment. When the value of the parent_id field is not 0, this API is used to reply to a comment',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        content: z
          .string()
          .describe(
            'Content of the comment<md-alert>If specify `content` and `rich_content` simutaneously, only rich_content will be used.</md-alert>',
          )
          .optional(),
        parent_id: z
          .string()
          .describe(
            'Parent ID of the comment. If this field is specified when a comment is created, the comment is a reply to a comment. If this field is not specified when a comment is created, the comment is not a reply, but is a comment',
          )
          .optional(),
        create_milli_time: z
          .string()
          .describe(
            'Timestamp when the comment was created, in milliseconds, for display, do not need to be filled in when it is created',
          )
          .optional(),
        rich_content: z.string().describe('Rich text comment content. See [Markdown module]').optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ task_id: z.string().describe('Task ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskCommentDelete = {
  project: 'task',
  name: 'task.v1.taskComment.delete',
  sdkName: 'task.v1.taskComment.delete',
  path: '/open-apis/task/v1/tasks/:task_id/comments/:comment_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Comment-Delete a comment-This API is used to delete a comment based on a comment ID',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({ task_id: z.string().describe('Task ID'), comment_id: z.string().describe('Comment ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskCommentGet = {
  project: 'task',
  name: 'task.v1.taskComment.get',
  sdkName: 'task.v1.taskComment.get',
  path: '/open-apis/task/v1/tasks/:task_id/comments/:comment_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Comment-Obtain comment details-This API is used to obtain the details about a comment based on a comment ID',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ task_id: z.string().describe('Task ID'), comment_id: z.string().describe('Comment ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskCommentList = {
  project: 'task',
  name: 'task.v1.taskComment.list',
  sdkName: 'task.v1.taskComment.list',
  path: '/open-apis/task/v1/tasks/:task_id/comments',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Comment-Get comment list-This API is used to query the task comment list, supports paging, and the maximum value is 100',
  accessTokens: ['tenant', 'user'],
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
        list_direction: z
          .number()
          .describe(
            'Comment sorting mark, which can be queried according to the comment time. If left blank, sort in desending order defaultly. Options:0(Down Sort by comment time in ascending order),1(Up Sort by comment time in descending order)',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({ task_id: z.string().describe('Task id').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskCommentUpdate = {
  project: 'task',
  name: 'task.v1.taskComment.update',
  sdkName: 'task.v1.taskComment.update',
  path: '/open-apis/task/v1/tasks/:task_id/comments/:comment_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Comment-Update a comment-This API is used to update the content of a comment',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        content: z.string().describe('New comment content').optional(),
        rich_content: z.string().describe('New rich text review content (preferred)').optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ task_id: z.string().describe('Task ID'), comment_id: z.string().describe('Comment ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskComplete = {
  project: 'task',
  name: 'task.v1.task.complete',
  sdkName: 'task.v1.task.complete',
  path: '/open-apis/task/v1/tasks/:task_id/complete',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Task management-Complete a task-This interface is used to modify the task status to "completed". Completing the task means that the entire task is completed, and the executors are not supported to complete the task separately. After the task is successfully executed, the task becomes completed for all associated users',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      task_id: z
        .string()
        .describe(
          'The task ID, which can be obtained from the id field in the response body [when the task is created]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskCreate = {
  project: 'task',
  name: 'task.v1.task.create',
  sdkName: 'task.v1.task.create',
  path: '/open-apis/task/v1/tasks',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Task management-Create a task-This interface can create a task and support filling in the basic information of the task, including the title, description and collaborators of the task. On this basis, you can set deadlines and repeat rules when creating tasks, and set tasks as recurring tasks that are executed on a regular basis. By adding collaborators, other users can collaborate on the task. In addition, the interface also provides some fields that support custom content, and the caller can implement custom effects, such as jumping to the specified web page after completing the task',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      summary: z
        .string()
        .describe(
          'The title of the task, as a text string. Use the rich_summary field if you want to insert a URL or @ user in the task summary. When creating a task, the task summary (summary field) and task rich text summary (rich_summary field) cannot be empty at the same time, and at least one of them needs to be filled in.<md-alert>When both the task summary and the task rich-text summary exist, only the rich text title is used.</md-alert>',
        )
        .optional(),
      description: z
        .string()
        .describe(
          'The description of the task, as a text string. Use the rich_description field if you want to insert a URL or @ user in the task description.<md-alert>When both task description and task rich-text description exist, only rich-text description are used.</md-alert>',
        )
        .optional(),
      extra: z
        .string()
        .describe(
          'Affiliate Information. Users can pass in base64 encoded custom data. If the user needs to remark information about the current task, but it is not displayed externally, this field can be used to store it. This data will be returned to the user when the task details are obtained',
        )
        .optional(),
      due: z
        .object({
          time: z.string().describe('Unix timestamp (in seconds) representing the deadline').optional(),
          timezone: z
            .string()
            .describe(
              'The time zone corresponding to the deadline. The incoming value needs to conform to the IANA Time Zone Database standard, see the specification：[https://www.iana.org/time-zones]',
            )
            .optional(),
          is_all_day: z
            .boolean()
            .describe(
              'Whether the marked task is an all-day task includes the following values:- true: Indicates that it is an all-day task, and the deadline for the all-day task is 0:00 UTC on the current day.- false: Indicates that it is not an all-day task',
            )
            .optional(),
        })
        .describe('Due time of the task')
        .optional(),
      origin: z
        .object({
          platform_i18n_name: z
            .string()
            .describe(
              'The name of the task source. Used to display on the task center details page. A dictionary is required to support multiple language name mappings. When the application uses a different language, the import source will also display the corresponding content. For details, see: [Supplementary directions of task fields]',
            ),
          href: z
            .object({
              url: z
                .string()
                .describe(
                  'Specific link address. URL only supports parsing http, https. For details, see: [Supplementary directions of task fields]',
                )
                .optional(),
              title: z.string().describe('Title that corresponds to the URL').optional(),
            })
            .describe('URL of the details page of the source platform associated with the task')
            .optional(),
        })
        .describe('Source information of the third-party platform associated with the task'),
      can_edit: z
        .boolean()
        .describe(
          'This field is used to control whether the task can be edited in Feishu task center, the default is false.<md-alert>Obsolete, forward compatibility so still retained, but deprecated</md-alert>',
        )
        .optional(),
      custom: z
        .string()
        .describe(
          'Customize complete configuration. This field is used to set a page jump when completing a task, or to display a prompt message. For details, see: [Supplementary directions of task fields]',
        )
        .optional(),
      collaborator_ids: z
        .array(z.string())
        .describe(
          'List of collaborator ids added when creating the task. The value passed in is user_id or open_id , determined by user_id_type. For details, see: [How to get ID]',
        )
        .optional(),
      follower_ids: z
        .array(z.string())
        .describe(
          'A list of follower ids added when creating a task. The value passed in is user_id or open_id , determined by user_id_type. For details, see: [How to get ID]',
        )
        .optional(),
      repeat_rule: z
        .string()
        .describe(
          'Regular expression for repeating tasks. For the syntax format, see [RRule Syntax Specification] section 4.3.10',
        )
        .optional(),
      rich_summary: z
        .string()
        .describe(
          'Rich-text task summary. For syntax format see: [Markdown module]When creating a task, the task summary (summary field) and task rich text summary (rich_summary field) cannot be empty at the same time, and at least one of them needs to be filled in',
        )
        .optional(),
      rich_description: z
        .string()
        .describe('Rich-text task description. For syntax format see: [Markdown module]')
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskDelete = {
  project: 'task',
  name: 'task.v1.task.delete',
  sdkName: 'task.v1.task.delete',
  path: '/open-apis/task/v1/tasks/:task_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Task management-Delete a task-This API is used to delete a task',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({ task_id: z.string().describe('Task ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskFollowerCreate = {
  project: 'task',
  name: 'task.v1.taskFollower.create',
  sdkName: 'task.v1.taskFollower.create',
  path: '/open-apis/task/v1/tasks/:task_id/followers',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Follower-Add followers to a task-This API is used to add followers for a task. Multiple followers can be added in one request. The followers specified in the request must be the IDs that represent users',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        id: z.string().describe('ID of the task follower (to be deprecated, use id_list)').optional(),
        id_list: z.array(z.string()).describe('Multiple follower ids to be deleted').optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ task_id: z.string().describe('Task ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskFollowerDelete = {
  project: 'task',
  name: 'task.v1.taskFollower.delete',
  sdkName: 'task.v1.taskFollower.delete',
  path: '/open-apis/task/v1/tasks/:task_id/followers/:follower_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Follower-Delete a follower-This API is used to delete a follower from a task',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      task_id: z.string().describe('Task ID'),
      follower_id: z.string().describe('Open ID or User ID of the task follower(specified by user_id_type)'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskFollowerList = {
  project: 'task',
  name: 'task.v1.taskFollower.list',
  sdkName: 'task.v1.taskFollower.list',
  path: '/open-apis/task/v1/tasks/:task_id/followers',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Follower-Obtain a follower list',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_size: z.number().optional(),
        page_token: z.string().optional(),
        user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({ task_id: z.string().describe('Task ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskGet = {
  project: 'task',
  name: 'task.v1.task.get',
  sdkName: 'task.v1.task.get',
  path: '/open-apis/task/v1/tasks/:task_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Task management-Obtain task details-This API is used to obtain task details, including the title, description, time, source, and other information of a task',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ task_id: z.string().describe('Task ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskList = {
  project: 'task',
  name: 'task.v1.task.list',
  sdkName: 'task.v1.task.list',
  path: '/open-apis/task/v1/tasks',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Task management-Get task list-The interface obtains all tasks related to the user by parsing the user_access_token in the header. And supports filtering tasks by task creation time and task completion status',
  accessTokens: ['tenant', 'user'],
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
        start_create_time: z
          .string()
          .describe(
            'The start time of the query. If left blank, the default start time is the creation time of the first task',
          )
          .optional(),
        end_create_time: z
          .string()
          .describe(
            'The end time of the query. If left blank, the default end time is the creation time of the last task',
          )
          .optional(),
        task_completed: z
          .boolean()
          .describe(
            'Used to filter task completion status when querying. True indicates that only completed tasks are returned, and false indicates that only uncompleted tasks are returned. When left blank, it means tasks of both status shall be returned',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskPatch = {
  project: 'task',
  name: 'task.v1.task.patch',
  sdkName: 'task.v1.task.patch',
  path: '/open-apis/task/v1/tasks/:task_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Task management-Update a task-This API is used to modify the title, description, time, source, and other information of a task',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      task: z
        .object({
          summary: z
            .string()
            .describe(
              'The title of the task, as a text string. Use the rich_summary field if you want to insert a URL or @ user in the task summary. When creating a task, the task summary (summary field) and task rich text summary (rich_summary field) cannot be empty at the same time, and at least one of them needs to be filled in.<md-alert>When both the task summary and the task rich-text summary exist, only the rich text title is used.</md-alert>',
            )
            .optional(),
          description: z
            .string()
            .describe(
              'The description of the task, as a text string. Use the rich_description field if you want to insert a URL or @ user in the task description.<md-alert>When both task description and task rich-text description exist, only rich-text description are used.</md-alert>',
            )
            .optional(),
          extra: z
            .string()
            .describe(
              'Affiliate Information. Users can pass in base64 encoded custom data. If the user needs to remark information about the current task, but it is not displayed externally, this field can be used to store it. This data will be returned to the user when the task details are obtained',
            )
            .optional(),
          due: z
            .object({
              time: z.string().describe('Unix timestamp (in seconds) representing the deadline').optional(),
              timezone: z
                .string()
                .describe(
                  'The time zone corresponding to the deadline. The incoming value needs to conform to the IANA Time Zone Database standard, see the specification：[https://www.iana.org/time-zones]',
                )
                .optional(),
              is_all_day: z
                .boolean()
                .describe(
                  'Whether the marked task is an all-day task includes the following values:- true: Indicates that it is an all-day task, and the deadline for the all-day task is 0:00 UTC on the current day.- false: Indicates that it is not an all-day task',
                )
                .optional(),
            })
            .describe('Due time of the task')
            .optional(),
          origin: z
            .object({
              platform_i18n_name: z
                .string()
                .describe(
                  'The name of the task source. Used to display on the task center details page. A dictionary is required to support multiple language name mappings. When the application uses a different language, the import source will also display the corresponding content. For details, see: [Supplementary directions of task fields]',
                ),
              href: z
                .object({
                  url: z
                    .string()
                    .describe(
                      'Specific link address. URL only supports parsing http, https. For details, see: [Supplementary directions of task fields]',
                    )
                    .optional(),
                  title: z.string().describe('Title that corresponds to the URL').optional(),
                })
                .describe('URL of the details page of the source platform associated with the task')
                .optional(),
            })
            .describe('Source information of the third-party platform associated with the task')
            .optional(),
          can_edit: z
            .boolean()
            .describe(
              'This field is used to control whether the task can be edited in Feishu task center, the default is false.<md-alert>Obsolete, forward compatibility so still retained, but deprecated</md-alert>',
            )
            .optional(),
          custom: z
            .string()
            .describe(
              'Customize complete configuration. This field is used to set a page jump when completing a task, or to display a prompt message. For details, see: [Supplementary directions of task fields]',
            )
            .optional(),
          followers: z
            .array(
              z.object({
                id: z.string().describe('ID of the task follower (to be deprecated, use id_list)').optional(),
                id_list: z.array(z.string()).describe('Multiple follower ids to be deleted').optional(),
              }),
            )
            .describe('Followers of the task')
            .optional(),
          collaborators: z
            .array(
              z.object({
                id: z
                  .string()
                  .describe(
                    'The ID of the task collaborator. The value passed in is user_id or open_id, determined by user_id_type. For details, see: [How to get ID]<md-alert>Deprecated, reserved for forward compatibility in the early days when only one person was added at a time, but it is no longer recommended, it is recommended to use the id_list field</md-alert>',
                  )
                  .optional(),
                id_list: z
                  .array(z.string())
                  .describe(
                    'List of collaborator ids added when creating the task. The value passed in is user_id or open_id, determined by user_id_type. For details, see: [How to get ID]',
                  )
                  .optional(),
              }),
            )
            .describe('Collaborators of the task')
            .optional(),
          collaborator_ids: z
            .array(z.string())
            .describe(
              'List of collaborator ids added when creating the task. The value passed in is user_id or open_id , determined by user_id_type. For details, see: [How to get ID]',
            )
            .optional(),
          follower_ids: z
            .array(z.string())
            .describe(
              'A list of follower ids added when creating a task. The value passed in is user_id or open_id , determined by user_id_type. For details, see: [How to get ID]',
            )
            .optional(),
          repeat_rule: z
            .string()
            .describe(
              'Regular expression for repeating tasks. For the syntax format, see [RRule Syntax Specification] section 4.3.10',
            )
            .optional(),
          rich_summary: z
            .string()
            .describe(
              'Rich-text task summary. For syntax format see: [Markdown module]When creating a task, the task summary (summary field) and task rich text summary (rich_summary field) cannot be empty at the same time, and at least one of them needs to be filled in',
            )
            .optional(),
          rich_description: z
            .string()
            .describe('Rich-text task description. For syntax format see: [Markdown module]')
            .optional(),
        })
        .describe('Basic information of the updated task entity'),
      update_fields: z
        .array(z.string())
        .describe(
          'Specifies the field that needs to be updated. Fields that can be updated are:<md-enum><md-enum-item key="summary" >task summary(plain text)</md-enum-item><md-enum-item key="rich_summary" >task summary(rich content)</md-enum-item><md-enum-item key="description" >task description(plain text)</md-enum-item><md-enum-item key="rich_description" >task description(rich content)</md-enum-item><md-enum-item key="due" >task due time</md-enum-item><md-enum-item key="extra" >task extra info</md-enum-item><md-enum-item key="custom" >task customize complete rule</md-enum-item><md-enum-item key="follower_ids" >task follower id list</md-enum-item><md-enum-item key="collaborator_ids" >task collaborator id list</md-enum-item><md-enum-item key="repeat_rule" >task repeat rule</md-enum-item></md-enum>',
        ),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ task_id: z.string().describe('Task ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskReminderCreate = {
  project: 'task',
  name: 'task.v1.taskReminder.create',
  sdkName: 'task.v1.taskReminder.create',
  path: '/open-apis/task/v1/tasks/:task_id/reminders',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Remind-Add reminder time-This API is used to add reminder time for a task. The reminder time is an offset relative to the due time. The offset result cannot be earlier than the current time',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      relative_fire_minute: z
        .number()
        .describe(
          'Reminder time relative to the due time. For example, if the reminder time is 30 minutes in advance or 30 minutes after the due time, the value is –30',
        ),
    }),
    path: z.object({ task_id: z.string().describe('Task ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskReminderDelete = {
  project: 'task',
  name: 'task.v1.taskReminder.delete',
  sdkName: 'task.v1.taskReminder.delete',
  path: '/open-apis/task/v1/tasks/:task_id/reminders/:reminder_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Remind-Delete reminder time-Deletes reminder time and returns the result',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      task_id: z.string().describe('Task ID'),
      reminder_id: z.string().describe('ID of the task reminder time. This ID is the same as the reminder.id field'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskReminderList = {
  project: 'task',
  name: 'task.v1.taskReminder.list',
  sdkName: 'task.v1.taskReminder.list',
  path: '/open-apis/task/v1/tasks/:task_id/reminders',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Remind-Query reminder time list-Returns a reminder time list. The result can be displayed by pages. A maximum of 50 entries are supported',
  accessTokens: ['tenant', 'user'],
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
      })
      .optional(),
    path: z.object({ task_id: z.string().describe('Task ID').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1TaskUncomplete = {
  project: 'task',
  name: 'task.v1.task.uncomplete',
  sdkName: 'task.v1.task.uncomplete',
  path: '/open-apis/task/v1/tasks/:task_id/uncomplete',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Tasks-Task management-Cancel completing a task-This API is used to cancel the "Completed" status of a task',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({ task_id: z.string().describe('Task ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const taskV1Tools = [
  taskV1TaskBatchDeleteCollaborator,
  taskV1TaskBatchDeleteFollower,
  taskV1TaskCollaboratorCreate,
  taskV1TaskCollaboratorDelete,
  taskV1TaskCollaboratorList,
  taskV1TaskCommentCreate,
  taskV1TaskCommentDelete,
  taskV1TaskCommentGet,
  taskV1TaskCommentList,
  taskV1TaskCommentUpdate,
  taskV1TaskComplete,
  taskV1TaskCreate,
  taskV1TaskDelete,
  taskV1TaskFollowerCreate,
  taskV1TaskFollowerDelete,
  taskV1TaskFollowerList,
  taskV1TaskGet,
  taskV1TaskList,
  taskV1TaskPatch,
  taskV1TaskReminderCreate,
  taskV1TaskReminderDelete,
  taskV1TaskReminderList,
  taskV1TaskUncomplete,
];
