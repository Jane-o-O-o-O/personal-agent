import { z } from 'zod';
export type driveV1ToolName =
  | 'drive.v1.exportTask.create'
  | 'drive.v1.exportTask.get'
  | 'drive.v1.fileComment.batchQuery'
  | 'drive.v1.fileComment.create'
  | 'drive.v1.fileComment.get'
  | 'drive.v1.fileComment.list'
  | 'drive.v1.fileComment.patch'
  | 'drive.v1.fileCommentReply.delete'
  | 'drive.v1.fileCommentReply.list'
  | 'drive.v1.fileCommentReply.update'
  | 'drive.v1.file.copy'
  | 'drive.v1.file.createFolder'
  | 'drive.v1.file.createShortcut'
  | 'drive.v1.file.delete'
  | 'drive.v1.file.deleteSubscribe'
  | 'drive.v1.file.getSubscribe'
  | 'drive.v1.file.list'
  | 'drive.v1.file.move'
  | 'drive.v1.fileStatistics.get'
  | 'drive.v1.file.subscribe'
  | 'drive.v1.fileSubscription.create'
  | 'drive.v1.fileSubscription.get'
  | 'drive.v1.fileSubscription.patch'
  | 'drive.v1.file.taskCheck'
  | 'drive.v1.file.uploadFinish'
  | 'drive.v1.file.uploadPrepare'
  | 'drive.v1.fileVersion.create'
  | 'drive.v1.fileVersion.delete'
  | 'drive.v1.fileVersion.get'
  | 'drive.v1.fileVersion.list'
  | 'drive.v1.fileViewRecord.list'
  | 'drive.v1.importTask.create'
  | 'drive.v1.importTask.get'
  | 'drive.v1.media.batchGetTmpDownloadUrl'
  | 'drive.v1.media.uploadFinish'
  | 'drive.v1.media.uploadPrepare'
  | 'drive.v1.meta.batchQuery'
  | 'drive.v1.permissionMember.auth'
  | 'drive.v1.permissionMember.batchCreate'
  | 'drive.v1.permissionMember.create'
  | 'drive.v1.permissionMember.delete'
  | 'drive.v1.permissionMember.list'
  | 'drive.v1.permissionMember.transferOwner'
  | 'drive.v1.permissionMember.update'
  | 'drive.v1.permissionPublic.get'
  | 'drive.v1.permissionPublicPassword.create'
  | 'drive.v1.permissionPublicPassword.delete'
  | 'drive.v1.permissionPublicPassword.update'
  | 'drive.v1.permissionPublic.patch';
export const driveV1ExportTaskCreate = {
  project: 'drive',
  name: 'drive.v1.exportTask.create',
  sdkName: 'drive.v1.exportTask.create',
  path: '/open-apis/drive/v1/export_tasks',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Space-File-Export docs-Create an export task-This interface is used to create an export file task and returns the export task ID. The export file refers to exporting Feishu documents, spreadsheets, and multidimensional spreadsheets to local files, including formats such as Word, Excel, PDF, and CSV. This interface is asynchronous, requiring a subsequent call to the [Query Export Task Result] interface to obtain the export result. For a complete understanding of the export steps, refer to the [Export docs overview]',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      file_extension: z
        .enum(['docx', 'pdf', 'xlsx', 'csv'])
        .describe(
          'The file extension of the local file after exporting the cloud document. To understand the file formats supported for exporting various cloud documents, refer to the [Export docs overview]. Options:docx(Microsoft Word (DOCX) format),pdf(PDF format),xlsx(Microsoft Excel (XLSX) format),csv(CSV format)',
        ),
      token: z.string().describe('The token of the cloud document. For details, see [How to get document token]'),
      type: z
        .enum(['doc', 'sheet', 'bitable', 'docx'])
        .describe(
          'The cloud document type to be exported. It can be judged by the link to the cloud document. Options:doc(Depracated Feishu cloud document type, supports export to docx, pdf format),sheet(Feishu spreadsheet type, support export to xlsx, csv format),bitable(Bitable type, support export to xlsx, csv format),docx(The new version of Feishu cloud document type supports exporting to docx, pdf formats)',
        ),
      sub_id: z
        .string()
        .describe(
          'When exporting spreadsheets or Base to CSV files, you need to pass the ID of the spreadsheet worksheet or the ID of the Base data table:- For spreadsheets, you can call the [Get Worksheet] API to obtain the returned value of `sheet_id` as the value of this parameter.- For Base apps, you can call the [List Data Tables] API to obtain the returned value of `table_id` as the value of this parameter',
        )
        .optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1ExportTaskGet = {
  project: 'drive',
  name: 'drive.v1.exportTask.get',
  sdkName: 'drive.v1.exportTask.get',
  path: '/open-apis/drive/v1/export_tasks/:ticket',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Space-File-Export docs-Query export task results-According to the export task ID (ticket) returned by the [Create Export Task] interface, poll the export task result and return the token of the export file. You can use this token to call the [Download Export File] interface to download the exported file to your local device. For a complete understanding of the export file steps, refer to the [Export docs overview]',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      token: z.string().describe('The token of the cloud document. For details, see [How to get document token]'),
    }),
    path: z.object({ ticket: z.string().describe('Export task ID, call [Create export task] to get the ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileCommentBatchQuery = {
  project: 'drive',
  name: 'drive.v1.fileComment.batchQuery',
  sdkName: 'drive.v1.fileComment.batchQuery',
  path: '/open-apis/drive/v1/files/:file_token/comments/batch_query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Comment-Batch Query Comments-This API is used to obtain cloud document comment information in batches according to comment ID list, including comment and reply ID, reply content, user ID of reviewer and reply person, etc. Supports returning global comments as well as local comments (which can be distinguished by the "is_whole" field)',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({ comment_ids: z.array(z.string()).describe('Comment ID list') }),
    params: z.object({
      file_type: z
        .enum(['doc', 'docx', 'sheet', 'file', 'slides'])
        .describe(
          'Document type Options:doc(docsheetdocxfile),docx(Upgraded Docs),sheet(Form),file(File),slides(Slides)',
        ),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({ file_token: z.string().describe('Document token').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileCommentCreate = {
  project: 'drive',
  name: 'drive.v1.fileComment.create',
  sdkName: 'drive.v1.fileComment.create',
  path: '/open-apis/drive/v1/files/:file_token/comments',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Docs-Comment-Add a Global Comment-Adds a global comment to Docs',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        reply_list: z
          .object({
            replies: z
              .array(
                z.object({
                  content: z
                    .object({
                      elements: z
                        .array(
                          z.object({
                            type: z
                              .enum(['text_run', 'docs_link', 'person'])
                              .describe(
                                'Content elements of the reply Options:text_run(Plain text),docs_link(Link to @mentioning a document in Docs),person(Contact to @mention)',
                              ),
                            text_run: z
                              .object({ text: z.string().describe('Reply with plain text') })
                              .describe('Text content')
                              .optional(),
                            docs_link: z
                              .object({ url: z.string().describe('@mentioned document in a reply') })
                              .describe('Text content')
                              .optional(),
                            person: z
                              .object({ user_id: z.string().describe('@mentioned contact in a reply') })
                              .describe('Text content')
                              .optional(),
                          }),
                        )
                        .describe('Reply content'),
                    })
                    .describe('Reply content'),
                }),
              )
              .describe('Reply list'),
          })
          .describe('List of replies in the comment')
          .optional(),
      })
      .optional(),
    params: z.object({
      file_type: z.enum(['doc', 'docx']).describe('Type of the document Options:doc(Doc),docx(New Doc)'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({ file_token: z.string().describe('Token of the document') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileCommentGet = {
  project: 'drive',
  name: 'drive.v1.fileComment.get',
  sdkName: 'drive.v1.fileComment.get',
  path: '/open-apis/drive/v1/files/:file_token/comments/:comment_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Comment-Get a whole comment-Obtains a specified global comment in Docs. Local comments are not supported yet',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      file_type: z
        .enum(['doc', 'sheet', 'file', 'docx'])
        .describe('Type of the document Options:doc(Doc),sheet(Sheet),file(File),docx(New Doc)'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      file_token: z.string().describe('Token of the document'),
      comment_id: z.string().describe('Comment ID'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileCommentList = {
  project: 'drive',
  name: 'drive.v1.fileComment.list',
  sdkName: 'drive.v1.fileComment.list',
  path: '/open-apis/drive/v1/files/:file_token/comments',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Comment-Get Document Comments in Pages-The API is used to obtain all the comment information of the document according to the cloud document Token, including comment and reply ID, reply content, user ID of the reviewer and reply person, etc. The API supports returning global comments as well as local comments (which can be distinguished by the "is_whole" field). The default is 50 comments per page',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      file_type: z
        .enum(['doc', 'docx', 'sheet', 'file', 'slides'])
        .describe(
          'Type of the document Options:doc(Doc),docx(Upgraded Docs),sheet(Sheet),file(File in My Space),slides(Slides)',
        ),
      is_whole: z.boolean().describe('Whether whole comment').optional(),
      is_solved: z.boolean().describe('Specifies whether the comment is solved. This field is optional').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.number().optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({ file_token: z.string().describe('Token of the document') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileCommentPatch = {
  project: 'drive',
  name: 'drive.v1.fileComment.patch',
  sdkName: 'drive.v1.fileComment.patch',
  path: '/open-apis/drive/v1/files/:file_token/comments/:comment_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Docs-Comment-Solve or Restore a Comment-Solves or restores a comment on a document in Docs',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({ is_solved: z.boolean().describe('Icon that indicates whether the comment is solved') }),
    params: z.object({
      file_type: z
        .enum(['doc', 'docx', 'sheet', 'file', 'slides'])
        .describe('Type of the document Options:doc(Doc),docx(Upgraded Docs),sheet(Sheet),file(File),slides(Slides)'),
    }),
    path: z.object({
      file_token: z.string().describe('Token of the document'),
      comment_id: z.string().describe('Comment ID'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileCommentReplyDelete = {
  project: 'drive',
  name: 'drive.v1.fileCommentReply.delete',
  sdkName: 'drive.v1.fileCommentReply.delete',
  path: '/open-apis/drive/v1/files/:file_token/comments/:comment_id/replies/:reply_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Docs-Comment-Delete Reply-Deletes a reply to a document in Docs',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      file_type: z
        .enum(['doc', 'docx', 'sheet', 'file', 'slides'])
        .describe('Type of the document Options:doc(Doc),docx(New Doc),sheet(Sheet),file(File),slides(Slides)'),
    }),
    path: z.object({
      file_token: z.string().describe('Token of the document'),
      comment_id: z.string().describe('Comment ID'),
      reply_id: z.string().describe('Reply ID'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileCommentReplyList = {
  project: 'drive',
  name: 'drive.v1.fileCommentReply.list',
  sdkName: 'drive.v1.fileCommentReply.list',
  path: '/open-apis/drive/v1/files/:file_token/comments/:comment_id/replies',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Comment-Get Replies List-This interface is used to obtain replies according to the comment ID and pagination parameters',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      page_size: z.number().optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      file_type: z
        .enum(['doc', 'docx', 'sheet', 'file', 'slides'])
        .describe('Document type Options:doc(Documentation),docx(Upgraded Docs),sheet(Form),file(File),slides(Slides)'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      file_token: z.string().describe('Document Token'),
      comment_id: z.string().describe('Comment ID'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileCommentReplyUpdate = {
  project: 'drive',
  name: 'drive.v1.fileCommentReply.update',
  sdkName: 'drive.v1.fileCommentReply.update',
  path: '/open-apis/drive/v1/files/:file_token/comments/:comment_id/replies/:reply_id',
  httpMethod: 'PUT',
  description: '[Feishu/Lark]-Docs-Comment-Update Reply-Updates a reply to a document in Docs',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      content: z
        .object({
          elements: z
            .array(
              z.object({
                type: z
                  .enum(['text_run', 'docs_link', 'person'])
                  .describe(
                    'Content elements of the reply Options:text_run(Plain text),docs_link(Link to @mentioning a document in Docs),person(Contact to @mention)',
                  ),
                text_run: z
                  .object({ text: z.string().describe('Reply with plain text') })
                  .describe('Text content')
                  .optional(),
                docs_link: z
                  .object({ url: z.string().describe('@mentioned document in a reply') })
                  .describe('Text content')
                  .optional(),
                person: z
                  .object({ user_id: z.string().describe('@mentioned contact in a reply') })
                  .describe('Text content')
                  .optional(),
              }),
            )
            .describe('Reply content'),
        })
        .describe('Reply content'),
    }),
    params: z.object({
      file_type: z
        .enum(['doc', 'docx', 'sheet', 'file', 'slides'])
        .describe('Type of the document Options:doc(Doc),docx(Upgraded Docs),sheet(Sheet),file(File),slides(Slides)'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      file_token: z.string().describe('Token of the document'),
      comment_id: z.string().describe('Comment ID'),
      reply_id: z.string().describe('Reply ID'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileCopy = {
  project: 'drive',
  name: 'drive.v1.file.copy',
  sdkName: 'drive.v1.file.copy',
  path: '/open-apis/drive/v1/files/:file_token/copy',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Docs-Space-File-Copy File-Copy a file to a different folder in the user's Space. Folders cannot be copied. This interface is asynchronous",
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      name: z.string().describe('The new name of the copied file.**Data validation rules**: Maximum length: 256 bytes'),
      type: z
        .enum(['file', 'doc', 'sheet', 'bitable', 'docx', 'mindnote', 'slides'])
        .describe(
          'File type that need to be copied. This parameter is required. If the value is empty or does not match the actual file type, the interface will return failure. Options:file(Common file type),doc(Cloud document type of docs),sheet(Cloud document type of sheet),bitable(Cloud document type of bitable),docx(Cloud document type of upgraded docs),mindnote(Cloud document type of mindnote),slides(Cloud document type of slide)',
        )
        .optional(),
      folder_token: z
        .string()
        .describe(
          'The target folder token to which the file is copied. Learn how to get the folder token, see [Folder overview]',
        ),
      extra: z
        .array(
          z.object({
            key: z.string().describe('Custom property key'),
            value: z.string().describe('Custom property value'),
          }),
        )
        .describe('Additional parameters for special replication semantics')
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z
      .object({
        file_token: z
          .string()
          .describe('File token that needs to be copied. Learn how to get the file token, see [File overview]')
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileCreateFolder = {
  project: 'drive',
  name: 'drive.v1.file.createFolder',
  sdkName: 'drive.v1.file.createFolder',
  path: '/open-apis/drive/v1/files/create_folder',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Docs-Space-Folder-Create Folder-Creates a new empty folder within the specified parent folder in the user's Space",
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      name: z.string().describe('The name of the folder you wish to create.**Length limit**: 1~256 bytes'),
      folder_token: z
        .string()
        .describe(
          'Parent folder token. This parameter can be an empty string, which means the folder will be created in the root folder. You can refer to [List items in folder] to get other level folder. For details, see [Folder overview]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileCreateShortcut = {
  project: 'drive',
  name: 'drive.v1.file.createShortcut',
  sdkName: 'drive.v1.file.createShortcut',
  path: '/open-apis/drive/v1/files/create_shortcut',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Space-File-Create file shortcut-Create shortcut to specified Docs in other folders in Space',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      parent_token: z
        .string()
        .describe(
          'The token of the target folder into which the file is copied. For how to get the folder token, see [Folder overview]',
        ),
      refer_entity: z
        .object({
          refer_token: z
            .string()
            .describe(
              'The token of the file that needs to be copied. For how to get the file token, see [File overview]',
            ),
          refer_type: z
            .enum(['file', 'docx', 'bitable', 'doc', 'sheet', 'mindnote', 'slides'])
            .describe(
              'File type that need to be copied. If the value is empty or does not match the actual file type, the interface will return failure. Options:file(File),docx(Upgraded Docs),bitable(Bitable),doc(Docs),sheet(Sheets),mindnote(MindNotes),slides(Slides)',
            ),
        })
        .describe('source file information'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileDelete = {
  project: 'drive',
  name: 'drive.v1.file.delete',
  sdkName: 'drive.v1.file.delete',
  path: '/open-apis/drive/v1/files/:file_token',
  httpMethod: 'DELETE',
  description:
    "[Feishu/Lark]-Docs-Space-File-Delete file or folder-Delete a file or folder from user's Space. After the file or folder is deleted, it will go to the user's recycle bin",
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      type: z
        .enum(['file', 'docx', 'bitable', 'folder', 'doc', 'sheet', 'mindnote', 'shortcut', 'slides'])
        .describe(
          'File type that need to be deleted. Options:file(Common file type),docx(Cloud document type of upgraded docs),bitable(Cloud document type of bitable),folder(Folder type),doc(Cloud document type of docs),sheet(Cloud document type of sheet),mindnote(Cloud document type of mindnote),shortcut(Shortcut type),slides(Cloud document type of slide)',
        ),
    }),
    path: z
      .object({
        file_token: z
          .string()
          .describe(
            "File's or folder's token that needs to be moved.To learn how to get the file token, see [File overview].To learn how to get the folder token, see [Folder overview]",
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileDeleteSubscribe = {
  project: 'drive',
  name: 'drive.v1.file.deleteSubscribe',
  sdkName: 'drive.v1.file.deleteSubscribe',
  path: '/open-apis/drive/v1/files/:file_token/delete_subscribe',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Docs-Space-Event-Unsubscribe Docs events-This interface is used to unsubscribe from notification events of cloud documents. To understand the configuration process and usage scenarios for event subscriptions, refer to [Event Overview]. To learn about the types of events supported by cloud documents, refer to [Event List]',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      file_type: z
        .enum(['doc', 'docx', 'sheet', 'bitable', 'file', 'folder', 'slides'])
        .describe(
          'Document type Options:doc(Depracated version of document),docx(Upgraded Docs),sheet(Spreadsheet),bitable(Bitable),file(File),folder(Folder),slides(Slides)',
        ),
      event_type: z
        .string()
        .describe(
          'Event type, required when subscribing to the folder type and required to be `file.created_in_folder_v1`',
        )
        .optional(),
    }),
    path: z.object({ file_token: z.string().describe('Document token. For details, see [FAQs]') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileGetSubscribe = {
  project: 'drive',
  name: 'drive.v1.file.getSubscribe',
  sdkName: 'drive.v1.file.getSubscribe',
  path: '/open-apis/drive/v1/files/:file_token/get_subscribe',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Space-Event-Get Docs events subscription status-This interface is used to query the subscription status of cloud documents. To understand the configuration process and usage scenarios for event subscriptions, refer to [Event Overview]. To learn about the types of events supported by cloud documents, refer to [Event List]',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      file_type: z
        .enum(['doc', 'docx', 'sheet', 'bitable', 'file', 'folder', 'slides'])
        .describe(
          'Document type Options:doc(Depracated version of document),docx(Upgraded Docs),sheet(Spreadsheet),bitable(Bitable),file(File),folder(Folder),slides(Slides)',
        ),
      event_type: z
        .string()
        .describe(
          'Event type, required when subscribing to the folder type and required to be `file.created_in_folder_v1`',
        )
        .optional(),
    }),
    path: z.object({ file_token: z.string().describe('Document token. For details, see [FAQs]') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileList = {
  project: 'drive',
  name: 'drive.v1.file.list',
  sdkName: 'drive.v1.file.list',
  path: '/open-apis/drive/v1/files',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Docs-Space-Folder-List items in folder-Get the list of files under the specified folder in the user's cloud space. List item types include files, various online documents (doc, sheet, bitable, mindnote), and folders",
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
        folder_token: z
          .string()
          .describe(
            "Folder's token. (If this parameter is not provided or an empty string is provided, then return the list of the user's cloud space)",
          )
          .optional(),
        order_by: z
          .enum(['EditedTime', 'CreatedTime'])
          .describe('Options:EditedTime(Order by edited time),CreatedTime(Order by created time)')
          .optional(),
        direction: z.enum(['ASC', 'DESC']).describe('Options:ASC(Ascending order),DESC(Descending order)').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileMove = {
  project: 'drive',
  name: 'drive.v1.file.move',
  sdkName: 'drive.v1.file.move',
  path: '/open-apis/drive/v1/files/:file_token/move',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Docs-Space-File-Move a file or folder-Move a file or folder to a different location in the user's Space",
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        type: z
          .enum(['file', 'docx', 'bitable', 'doc', 'sheet', 'mindnote', 'folder', 'slides'])
          .describe(
            'File type. If the value is empty or does not match the actual file type, the interface will return failure. Options:file(Common file type),docx(Cloud document type of upgraded docs),bitable(Cloud document type of bitable),doc(Cloud document type of docs),sheet(Cloud document type of sheet),mindnote(Cloud document type of mindnote),folder(Folder type),slides(Cloud document type of slide)',
          )
          .optional(),
        folder_token: z
          .string()
          .describe('Target folder token. To learn how to get the folder token, see [Folder overview]')
          .optional(),
      })
      .optional(),
    path: z.object({
      file_token: z
        .string()
        .describe(
          "File's or folder's token that needs to be moved.To learn how to get the file token, see [File overview].To learn how to get the folder token, see [Folder overview]",
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileStatisticsGet = {
  project: 'drive',
  name: 'drive.v1.fileStatistics.get',
  sdkName: 'drive.v1.fileStatistics.get',
  path: '/open-apis/drive/v1/files/:file_token/statistics',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Docs-Space-File-Obtain file's statistics-This API is used to obtain file's statistics, including the number of unique visitors (UVs), the number of page views (PVs), and the number of likes",
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      file_type: z
        .enum(['doc', 'sheet', 'mindnote', 'bitable', 'wiki', 'file', 'docx'])
        .describe(
          'File type Options:doc(Docs),sheet(Sheet),mindnote(MindNotes),bitable(Bitable),wiki(Wiki),file(File),docx(Upgraded Docs)',
        ),
    }),
    path: z
      .object({ file_token: z.string().describe('File token. For details, see [File overview]').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileSubscribe = {
  project: 'drive',
  name: 'drive.v1.file.subscribe',
  sdkName: 'drive.v1.file.subscribe',
  path: '/open-apis/drive/v1/files/:file_token/subscribe',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Space-Event-Subscribe Docs events-This interface is used to subscribe to various notification events of cloud documents. To understand the configuration process and usage scenarios for event subscriptions, refer to [Event Overview]. To learn about the types of events supported by cloud documents, refer to [Event List]',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      file_type: z
        .enum(['doc', 'docx', 'sheet', 'bitable', 'file', 'folder', 'slides'])
        .describe(
          'Document type Options:doc(Depracated version of document.),docx(Upgraded Docs),sheet(Spreadsheet),bitable(Bitable),file(File),folder(Folder),slides(Slides)',
        ),
      event_type: z
        .string()
        .describe(
          'Event type.- If `file_type` is `folder`, this field must be filled in and set to `file.created_in_folder_v1`, indicating the subscription to the [file created in folder] event.- If `file_type` is not `folder`, do not fill in this field. For cloud document types such as Docs, Sheets, and Base, only subscribing to all related cloud document events is currently supported. Subscribing to specific events under a particular cloud document type is not yet supported',
        )
        .optional(),
    }),
    path: z.object({ file_token: z.string().describe('Document token. For details, see [FAQs]') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileSubscriptionCreate = {
  project: 'drive',
  name: 'drive.v1.fileSubscription.create',
  sdkName: 'drive.v1.fileSubscription.create',
  path: '/open-apis/drive/v1/files/:file_token/subscriptions',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Docs Assistant-Subscription-Create Subscription-Subscribe to change events in the document, currently supporting document comment subscriptions',
  accessTokens: ['user'],
  schema: {
    data: z.object({
      subscription_id: z.string().describe('subsription id').optional(),
      subscription_type: z
        .literal('comment_update')
        .describe('subscription type Options:comment_update(subscribe comment)'),
      is_subcribe: z.boolean().describe('Whether to subscribe').optional(),
      file_type: z
        .enum(['doc', 'docx', 'wiki'])
        .describe('document type Options:doc(Doc),docx(Upgraded Docs),wiki(Wiki)'),
    }),
    path: z.object({ file_token: z.string().describe('file token') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileSubscriptionGet = {
  project: 'drive',
  name: 'drive.v1.fileSubscription.get',
  sdkName: 'drive.v1.fileSubscription.get',
  path: '/open-apis/drive/v1/files/:file_token/subscriptions/:subscription_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Docs Assistant-Subscription-Get subscription status-Get the status of the subscription based on the subscription ID',
  accessTokens: ['user'],
  schema: {
    data: z.object({
      file_type: z.enum(['doc', 'docx', 'wiki']).describe('file type Options:doc(Docs),docx(Upgraded Docs),wiki(Wiki)'),
    }),
    path: z
      .object({
        file_token: z.string().describe('file token').optional(),
        subscription_id: z.string().describe('Subscription ID').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileSubscriptionPatch = {
  project: 'drive',
  name: 'drive.v1.fileSubscription.patch',
  sdkName: 'drive.v1.fileSubscription.patch',
  path: '/open-apis/drive/v1/files/:file_token/subscriptions/:subscription_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Docs-Docs Assistant-Subscription-update subscription status-Update subscription status based on subscription ID',
  accessTokens: ['user'],
  schema: {
    data: z.object({
      is_subscribe: z.boolean().describe('Whether to subscribe'),
      file_type: z.enum(['doc', 'docx', 'wiki']).describe('file type Options:doc(Doc),docx(Upgraded Docs),wiki(Wiki)'),
    }),
    path: z
      .object({
        file_token: z.string().describe('File token').optional(),
        subscription_id: z.string().describe('Subscription ID').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileTaskCheck = {
  project: 'drive',
  name: 'drive.v1.file.taskCheck',
  sdkName: 'drive.v1.file.taskCheck',
  path: '/open-apis/drive/v1/files/task_check',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Space-Folder-Query Task Status-Query the status information of asynchronous tasks. Currently supports moving and deleting folder tasks',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      task_id: z
        .string()
        .describe('File-related asynchronous `task_id`. See [Delete a folder] or [Move a folder] to get the `task_id`'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileUploadFinish = {
  project: 'drive',
  name: 'drive.v1.file.uploadFinish',
  sdkName: 'drive.v1.file.uploadFinish',
  path: '/open-apis/drive/v1/files/upload_finish',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Space-File-Upload files-Multipart Upload-Upload a file in blocks-Completing-Completes an upload task',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      upload_id: z
        .string()
        .describe(
          'ID of the block upload transaction. You can call the [Upload a file in blocks-Pre­uploading] to get the upload ID',
        ),
      block_num: z
        .number()
        .describe(
          'Number of blocks. You can call the [Upload a file in blocks-Pre­uploading] to get the number of blocks',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileUploadPrepare = {
  project: 'drive',
  name: 'drive.v1.file.uploadPrepare',
  sdkName: 'drive.v1.file.uploadPrepare',
  path: '/open-apis/drive/v1/files/upload_prepare',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Space-File-Upload files-Multipart Upload-Upload a file in blocks-Pre­uploading-Send an initialization request to obtain the upload ID and split strategy, preparing for [Uploading blocks]. The platform consistently chunks files into 4MB segments. To understand the complete file upload process, refer to [File Upload Overview]',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      file_name: z.string().describe('File name'),
      parent_type: z
        .literal('explorer')
        .describe(
          'Type of the upload point. Fixed as "explorer", which means to upload files into the cloud space. Options:explorer(My Space.)',
        ),
      parent_node: z.string().describe('Token of the folder. For details, see [Cloud space overview]'),
      size: z.number().describe('File size. The units are in bytes'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileVersionCreate = {
  project: 'drive',
  name: 'drive.v1.fileVersion.create',
  sdkName: 'drive.v1.fileVersion.create',
  path: '/open-apis/drive/v1/files/:file_token/versions',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Space-Document Version-Create document version-Create a document version based on the existing document. The document supports Feishu document and spreadsheet. This interface is asynchronous',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        name: z
          .string()
          .describe(
            'The title of the new version of the document. The maximum length is 1024 Unicode code points. Generally, one English or Chinese character corresponds to one code point, but some special symbols may correspond to multiple code points. For example, the family combo "👨‍👩‍👧" this emoji corresponds to 5 code points.**Note**:This parameter is required, please ignore the "No" displayed in the required column on the left',
          )
          .optional(),
        obj_type: z
          .enum(['docx', 'sheet'])
          .describe(
            'Document version type. **Note**:This parameter is required, please ignore the "No" displayed in the required column on the left. Options:docx(Upgraded Docs),sheet(Spreadsheet)',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      file_token: z
        .string()
        .describe('Document token. For how to get the document token, see [How to get the token of docs resources]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileVersionDelete = {
  project: 'drive',
  name: 'drive.v1.fileVersion.delete',
  sdkName: 'drive.v1.fileVersion.delete',
  path: '/open-apis/drive/v1/files/:file_token/versions/:version_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Docs-Space-Document Version-Delete document version-Delete document version. The document supports Feishu document and spreadsheet',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      obj_type: z
        .enum(['docx', 'sheet'])
        .describe('document version type Options:docx(Upgraded Docs),sheet(Spreadsheet)'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      file_token: z
        .string()
        .describe('Document token. For how to get the document token, see [How to get the token of docs resources]'),
      version_id: z.string().describe('document version ID'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileVersionGet = {
  project: 'drive',
  name: 'drive.v1.fileVersion.get',
  sdkName: 'drive.v1.fileVersion.get',
  path: '/open-apis/drive/v1/files/:file_token/versions/:version_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Space-Document Version-Get document version-Get document version. The document can be Feishu document or spreadsheet. The version information includes the version title, version ID, version creator, create time, and more',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      obj_type: z
        .enum(['docx', 'sheet'])
        .describe('document version type Options:docx(Upgraded Docs),sheet(Spreadsheet)'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      file_token: z.string().describe('document token. For how to get the document token, see [Docs overview]'),
      version_id: z.string().describe('document version ID'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileVersionList = {
  project: 'drive',
  name: 'drive.v1.fileVersion.list',
  sdkName: 'drive.v1.fileVersion.list',
  path: '/open-apis/drive/v1/files/:file_token/versions',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Space-Document Version-List document version-Get all versions of the document. The document can be Feishu document or spreadsheet',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      page_size: z.number(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      obj_type: z.enum(['docx', 'sheet']).describe('document type Options:docx(Upgraded Docs),sheet(Spreadsheet)'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      file_token: z
        .string()
        .describe(
          'parent document token. For how to get the document token. see [How to get the token of docs resources]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1FileViewRecordList = {
  project: 'drive',
  name: 'drive.v1.fileViewRecord.list',
  sdkName: 'drive.v1.fileViewRecord.list',
  path: '/open-apis/drive/v1/files/:file_token/view_records',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Space-File-Obtain document view records-Obtain the view records of files, including document, sheet, base, wiki, and more. The view records contains the ID, profile, and last view time of the viewers',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      page_size: z.number().describe('Page size'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      file_type: z
        .enum(['doc', 'docx', 'sheet', 'bitable', 'mindnote', 'wiki', 'file'])
        .describe(
          'File type Options:doc(Doc),docx(Upgraded Docs),sheet(Sheet),bitable(Bitable),mindnote(Mindnote),wiki(Wiki),file(File)',
        ),
      viewer_id_type: z
        .enum(['user_id', 'union_id', 'open_id'])
        .describe(
          'Type of viewer ID used in this call**When the value is `user_id`, the following field scopes are required**：<md-perm name="contact:user.employee_id:readonly" desc="Obtain user ID" support_app_types="custom" tags="">Obtain user ID</md-perm> Options:user_id(Identifies a user to a tenant. The same user has different User IDs in different tenants. In one single tenant, a user has the same User ID in all apps （including store apps）. User ID is usually used to communicate user data between different apps.[How to get User ID]),union_id(Identifies a user to a tenant that acts as a developer. A user has the same Union ID in apps developed by the same developer, and has different Union IDs in apps developed by different developers. A developer can use Union ID to link the same user\'s identities in multiple apps.[How to get Union ID]),open_id(Identifies a user to an app. The same user has different Open IDs in different apps.[How to get Open ID])',
        )
        .optional(),
    }),
    path: z.object({ file_token: z.string().describe('File token. For how to get tokens, see [File overview]') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1ImportTaskCreate = {
  project: 'drive',
  name: 'drive.v1.importTask.create',
  sdkName: 'drive.v1.importTask.create',
  path: '/open-apis/drive/v1/import_tasks',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Space-File-Import files-Create an import task-This interface is used to create a task for importing a file and return the import task ID. Importing files involves transferring local files such as Word, TXT, Markdown, Excel, etc., into various cloud document formats such as online documents, spreadsheets, base, etc., and storing them in a specified directory in the cloud. This interface is asynchronous, you need to continue to call the [query import task result] interface to get the result of the import. For details, refer to [Import file overview]',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      file_extension: z
        .string()
        .describe(
          'The extension of the file to be imported. To learn about supported file formats, refer to [Import File Overview].**Note**: The file extensions filled in here need to be strictly consistent with the suffixes of the actual files. Please be careful to distinguish Markdown files with suffixes ‘markdown’, ‘md’, ‘mark’, and keep the suffixes consistent when you fill in the relevant parameters. Otherwise, an error code 1069910 will be returned. Otherwise, 1069910 error code will be returned',
        ),
      file_token: z
        .string()
        .describe(
          'To import a file token, you need to call the [upload material] or [upload file] to get the token of the source file before creating an import task. To learn more, refer to [Import file overview]',
        ),
      type: z
        .string()
        .describe(
          'Target cloud document format. Different files support different cloud document formats. Refer to [Import File Overview] for details. The optional values are shown below:- `docx`: new version of document- `sheet`: spreadsheet- `bitable`: multidimensional table',
        ),
      file_name: z
        .string()
        .describe('The name of the imported online cloud document. If empty, the name of the local file is used')
        .optional(),
      point: z
        .object({
          mount_type: z
            .number()
            .describe(
              'Mount type. A fixed value of 1 means that the cloud document is mounted under the cloud space. Options:1(Space Mount to My Space)',
            ),
          mount_key: z
            .string()
            .describe(
              'The token of the folder where the cloud document is mounted, i.e., the token of the folder under the cloud space. empty indicates the cloud space root directory. To learn how to get folder tokens, refer to [folder-overview]',
            ),
        })
        .describe('Mount point (the location of the imported cloud document)'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1ImportTaskGet = {
  project: 'drive',
  name: 'drive.v1.importTask.get',
  sdkName: 'drive.v1.importTask.get',
  path: '/open-apis/drive/v1/import_tasks/:ticket',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Space-File-Import files-Query import task result-Polling the import results based on the `ticket` returned from [Create import task]. For details, see [Import file overview]',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({ ticket: z.string().describe('ID of the import task. Call [Create import task] to get the ID') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1MediaBatchGetTmpDownloadUrl = {
  project: 'drive',
  name: 'drive.v1.media.batchGetTmpDownloadUrl',
  sdkName: 'drive.v1.media.batchGetTmpDownloadUrl',
  path: '/open-apis/drive/v1/medias/batch_get_tmp_download_url',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Space-Media-Get Temporary Download URL of Media-Obtain the temporary download URL of a material based on a `file_tokens`. The URL is valid for 24 hours',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      file_tokens: z
        .array(z.string())
        .describe(
          'The token of the media file. The methods to obtain it are as follows:* New Document: Obtain the token of a specified File Block or Image Block through the [List All Blocks in a Document] interface. This token is the media token.* Spreadsheet: Obtain the `fileToken` of a specified attachment through the [Read Multiple Ranges] interface. This token is the media token.* Multi-dimensional Table: Obtain the `file_token` of a specified attachment through the [List Records] interface. This token is the media token.If you need to query multiple file tokens at once, you can do so by passing the same parameter name multiple times and passing a different parameter value each time, e.g. for download links for two file tokens at once: https://{url}?file_tokens={token1}&file_tokens={token2}Where:- `file_tokens` is the parameter name, which can be passed multiple times- `token1` and `token2` are the parameter values- You can obtain download links for up to five media files at a time, but the API explorer only supports one token at a time',
        ),
      extra: z
        .string()
        .describe(
          'Extended information: When downloading media from a Base table with advanced permissions, you need to add additional extended information as URL query parameters for authentication. For details, refer to the [extra parameter description]. Failure to correctly fill in this parameter will result in the interface returning a 403 HTTP status code',
        )
        .optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1MediaUploadFinish = {
  project: 'drive',
  name: 'drive.v1.media.uploadFinish',
  sdkName: 'drive.v1.media.uploadFinish',
  path: '/open-apis/drive/v1/medias/upload_finish',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Space-Media-Upload media-Upload media in blocks-Completing-After calling the [Uploading] interface to upload all the shards, you need to call this interface to trigger the completion of the upload. For a complete understanding of the shard upload process, refer to [Media overview]',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      upload_id: z
        .string()
        .describe('The ID of the block upload transaction. Obtain this by calling the [Preupload] interface'),
      block_num: z.number().describe('The number of blocks. Obtain this by calling the [Preupload media] interface'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1MediaUploadPrepare = {
  project: 'drive',
  name: 'drive.v1.media.uploadPrepare',
  sdkName: 'drive.v1.media.uploadPrepare',
  path: '/open-apis/drive/v1/medias/upload_prepare',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Space-Media-Upload media-Upload media in blocks-Pre­uploading-Send an initialization request to obtain the upload transaction ID and shard strategy, in preparation for [Uploading media]. The platform segments media into fixed 4MB shards. For a complete understanding of the shard upload process, refer to [Media overview]',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      file_name: z.string().describe('File name'),
      parent_type: z
        .enum([
          'doc_image',
          'docx_image',
          'sheet_image',
          'doc_file',
          'docx_file',
          'sheet_file',
          'vc_virtual_background',
          'bitable_image',
          'bitable_file',
          'moments',
          'ccm_import_open',
        ])
        .describe(
          'Type of upload point. You can determine the type of upload point based on the file type and the type of cloud document. For example, to insert an image into a new document (file type `docx`), specify the upload point as `docx_image`; to upload an attachment to a new document, specify the upload point as `docx_file`. Options:doc_image(Image of a document.),docx_image(Upgraded docs image.),sheet_image(Image of a sheet.),doc_file(Doc file.),docx_file(Upgraded docs file.),sheet_file(Sheet file.),vc_virtual_background(VC virtual background (This feature is under canary release).),bitable_image(Image of a bitable.),bitable_file(Bitable file.),moments(Moments (This feature is under canary release).),ccm_import_open(File to import into Docs.)',
        ),
      parent_node: z
        .string()
        .describe(
          'The token of the upload point, which is the token of the cloud document to be uploaded, used to specify the cloud document or location where the media will be uploaded. Refer to [Media Overview] to understand the relationship between the upload point type and the upload point token',
        ),
      size: z.number().describe('The size of the file, in bytes'),
      extra: z
        .string()
        .describe(
          'The upload points in the following scenarios need to pass the token of the cloud document where the material is located through this parameter. The format of the extra parameter is `"{\\"drive_route_token\\":\\"token of the cloud document where the material is located\\"}"`. For details, refer to [Material Overview]',
        )
        .optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1MetaBatchQuery = {
  project: 'drive',
  name: 'drive.v1.meta.batchQuery',
  sdkName: 'drive.v1.meta.batchQuery',
  path: '/open-apis/drive/v1/metas/batch_query',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Docs-Space-File-Obtain Metadata-Get metadata of various Docs based on file's token, including the title, owner, create time, and more",
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      request_docs: z
        .array(
          z.object({
            doc_token: z
              .string()
              .describe('Token of the file. For more information about how to obtain the token, see [File overview]'),
            doc_type: z
              .enum(['doc', 'sheet', 'bitable', 'mindnote', 'file', 'wiki', 'docx', 'folder', 'synced_block'])
              .describe(
                'Type of the file Options:doc(Feishu Docs),sheet(Feishu Sheets),bitable(Feishu Bitable),mindnote(Feishu MindNotes),file(Feishu file),wiki(Feishu wiki),docx(Feishu Upgraded Docs),folder(Feishu folder),synced_block(SyncedBlock Feishu Synced Block (Not fully supported yet))',
              ),
          }),
        )
        .describe('The tokens and types of the request files. Up to 200 files are supported at a time'),
      with_url: z.boolean().describe("Whether to get File's URL").optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1PermissionMemberAuth = {
  project: 'drive',
  name: 'drive.v1.permissionMember.auth',
  sdkName: 'drive.v1.permissionMember.auth',
  path: '/open-apis/drive/v1/permissions/:token/members/auth',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Permission-Member-Check whether the current user has a specific permission-This API is used to check whether the current login user has a specific permission on a document based on a filetoken',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides'])
        .describe(
          'File type, which needs to match the token of the file Options:doc(Doc),sheet(Sheet),file(File in My Space),wiki(Wiki node),bitable(Bitable),docx(Upgraded Docs),mindnote(Thinking Notes),minutes(Minutes),slides(Slides)',
        ),
      action: z
        .enum(['view', 'edit', 'share', 'comment', 'export', 'copy', 'print', 'manage_public'])
        .describe(
          'Permission to check Options:view(view),edit(edit),share(share),comment(comment),export(export),copy(copy),print(print),manage_public(ManagePublic manage permission settings)',
        ),
    }),
    path: z.object({
      token: z
        .string()
        .describe(
          'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1PermissionMemberBatchCreate = {
  project: 'drive',
  name: 'drive.v1.permissionMember.batchCreate',
  sdkName: 'drive.v1.permissionMember.batchCreate',
  path: '/open-apis/drive/v1/permissions/:token/members/batch_create',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Permission-Member-Batch create members-This interface is used to add permissions on a document for some users based on a cloud document token',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      members: z
        .array(
          z.object({
            member_type: z
              .enum(['email', 'openid', 'unionid', 'openchat', 'opendepartmentid', 'userid', 'groupid', 'wikispaceid'])
              .describe(
                'Collaborator ID Type Options:email(Email),openid(open_id Open platform ID),unionid(union_id Open platform unionID),openchat(open_chat Open platform chat ID),opendepartmentid(open_department_id Open platform department ID),userid(user_id User customized ID),groupid(group_id Custom user group ID),wikispaceid(wiki_space_id Wiki space ID - **NOTE**: This parameter is only supported by the wiki document, and it is required when you need to operate the "wiki space member" type collaborator in the wiki document)',
              ),
            member_id: z.string().describe('Collaborator ID, which needs to correspond to the collaborator ID type'),
            perm: z
              .enum(['view', 'edit', 'full_access'])
              .describe(
                'Permission roles that need to be added Options:view(Readable role),edit(Editable role),full_access(Manageable role)',
              ),
            perm_type: z
              .enum(['container', 'single_page'])
              .describe(
                "Collaborator's permission role type Options:container(Current page and its sub-pages),single_page(Current page only)",
              )
              .optional(),
            type: z
              .enum([
                'user',
                'chat',
                'department',
                'group',
                'wiki_space_member',
                'wiki_space_viewer',
                'wiki_space_editor',
              ])
              .describe(
                'Type of collaborator**NOTE**: This parameter is required when the `member_type` parameter is `wikispaceid`**Default value**: "" Options:user(User),chat(Chat),department(Organizational structure),group(User group),wiki_space_member(Wiki space member - **NOTE**: This parameter is not supported after the wiki space has member grouping enabled),wiki_space_viewer(Wiki space viewer - **NOTE**: This parameter is only supported if the wiki space has member grouping enabled),wiki_space_editor(Wiki space editor - **NOTE**: This parameter is only supported if the wiki space has member grouping enabled)',
              )
              .optional(),
          }),
        )
        .describe('List of collaborators who want to increase permissions this time'),
    }),
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'folder', 'mindnote', 'minutes', 'slides'])
        .describe(
          'Types of cloud documents Options:doc(Legacy document),sheet(Spreadsheet),file(Cloud space file),wiki(Wiki node),bitable(Bitable),docx(New version of the document),folder(Folder - **NOTE**: When called with <md-tag mode="inline" type="token-tenant">tenant_access_token</md-tag>, only folders owned by the app are supported),mindnote(Mindnote),minutes(Minutes - **NOTE**: Currently minutes does not support the `full_access` permission role),slides(Slides)',
        ),
      need_notification: z
        .boolean()
        .describe(
          'Specifies whether to notify the user after the permissions are added for the user.**Note:** When you use `tenant_access_token` to access the API, you cannot use this parameter',
        )
        .optional(),
    }),
    path: z.object({ token: z.string().describe('Token for cloud documents') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1PermissionMemberCreate = {
  project: 'drive',
  name: 'drive.v1.permissionMember.create',
  sdkName: 'drive.v1.permissionMember.create',
  path: '/open-apis/drive/v1/permissions/:token/members',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Permission-Member-Add permissions-Add collaborators to the specified cloud document. Collaborators can be users, groups, departments, user groups, etc',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      member_type: z
        .enum(['email', 'openid', 'unionid', 'openchat', 'opendepartmentid', 'userid', 'groupid', 'wikispaceid'])
        .describe(
          'Collaborator type, which needs to match the collaborator id Options:email(Email),openid(open_id The Open ID of the application or user. - To get the application OpenID, refer to [How to get the application open_id] - Get user OpenID, refer to [How to get different user IDs]),unionid(union_id Open platform unionID),openchat(open_chat Open platform chat ID),opendepartmentid(open_department_id Open platform department ID),userid(user_id User customized ID),groupid(group_id Custom user group ID),wikispaceid(wiki_space_id Wiki space ID - **NOTE**: This parameter is only supported by the wiki document, and it is required when you need to operate the "wiki space member" type collaborator in the wiki document)',
        ),
      member_id: z.string().describe('Collaborator ID, which needs to match the collaborator type'),
      perm: z
        .enum(['view', 'edit', 'full_access'])
        .describe(
          'Permission role of the collaborator Options:view(Readable role),edit(Editable role),full_access(Manageable role)',
        ),
      perm_type: z
        .enum(['container', 'single_page'])
        .describe(
          "Collaborator's permission role type Options:container(Current page and its sub-pages),single_page(Current page only)",
        )
        .optional(),
      type: z
        .enum(['user', 'chat', 'department', 'group', 'wiki_space_member', 'wiki_space_viewer', 'wiki_space_editor'])
        .describe(
          'Type of collaborator**NOTE**: This parameter is required when the `member_type` parameter is `wikispaceid`**Default value**: "" Options:user(User),chat(Chat),department(Organizational structure),group(User group),wiki_space_member(Wiki space member - **NOTE**: This parameter is not supported after the wiki space has member grouping enabled),wiki_space_viewer(Wiki space viewer - **NOTE**: This parameter is only supported if the wiki space has member grouping enabled),wiki_space_editor(Wiki space editor - **NOTE**: This parameter is only supported if the wiki space has member grouping enabled)',
        )
        .optional(),
    }),
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'folder', 'mindnote', 'minutes', 'slides'])
        .describe(
          'File type, which needs to match the token of the file Options:doc(Documentation),sheet(Spreadsheet),file(Cloud space file),wiki(Wiki node),bitable(Bitable),docx(Upgraded docs),folder(Folders (not supported for `tenant_access_token`)),mindnote(Mindnote),minutes(Minutes),slides(Slides)',
        ),
      need_notification: z
        .boolean()
        .describe(
          'Specifies whether to notify the user after the permissions are added for the user.**Note:** When you use `tenant_access_token` to access the API, you cannot use this parameter',
        )
        .optional(),
    }),
    path: z.object({
      token: z
        .string()
        .describe(
          'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1PermissionMemberDelete = {
  project: 'drive',
  name: 'drive.v1.permissionMember.delete',
  sdkName: 'drive.v1.permissionMember.delete',
  path: '/open-apis/drive/v1/permissions/:token/members/:member_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Docs-Permission-Member-DeletePermissionMember-This API is used to delete permissions of a document collaborator based on a filetoken',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        type: z
          .enum(['user', 'chat', 'department', 'group', 'wiki_space_member', 'wiki_space_viewer', 'wiki_space_editor'])
          .describe(
            'Type of collaborator**NOTE**: This parameter is required when the `member_type` parameter is `wikispaceid`**Default value**: "" Options:user(User),chat(Chat),department(Organizational structure),group(User group),wiki_space_member(Wiki space member - **NOTE**: This parameter is not supported after the wiki space has member grouping enabled),wiki_space_viewer(Wiki space viewer - **NOTE**: This parameter is only supported if the wiki space has member grouping enabled),wiki_space_editor(Wiki space editor - **NOTE**: This parameter is only supported if the wiki space has member grouping enabled)',
          )
          .optional(),
        perm_type: z
          .enum(['container', 'single_page'])
          .describe(
            "Collaborator's permission role type Options:container(Current page and its sub-pages),single_page(Current page only)",
          )
          .optional(),
      })
      .optional(),
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'folder', 'mindnote', 'minutes', 'slides'])
        .describe(
          'File type, which needs to match the token of the file Options:doc(Documentation),sheet(Spreadsheet),file(Cloud space file),wiki(Wiki node),bitable(Bitable),docx(Upgraded Docs),folder(Folders (to be supported soon)),mindnote(Mindnote),minutes(Minutes),slides(Slides)',
        ),
      member_type: z
        .enum(['email', 'openid', 'openchat', 'opendepartmentid', 'userid', 'unionid', 'groupid', 'wikispaceid'])
        .describe(
          'Collaborator ID type Options:email(Email),openid(Open platform ID),openchat(OpenChatID Open platform chat ID),opendepartmentid(Open platform department ID),userid(User customized ID),unionid(Open platform unionID),groupid(Custom user group ID),wikispaceid(Wiki space ID - **NOTE**: This parameter is only supported by the wiki document, and it is required when you need to operate the "wiki space member" type collaborator in the wiki document)',
        ),
    }),
    path: z.object({
      token: z
        .string()
        .describe(
          'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
        ),
      member_id: z.string().describe('Collaborator id, which needs to match the collaborator type'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1PermissionMemberList = {
  project: 'drive',
  name: 'drive.v1.permissionMember.list',
  sdkName: 'drive.v1.permissionMember.list',
  path: '/open-apis/drive/v1/permissions/:token/members',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Permission-Member-Obtain a collaborator list（New version）-This API is used to query collaborators based on a filetoken',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides'])
        .describe(
          'File type, which needs to match the token of the file Options:doc(Doc),sheet(Sheet),file(File in My Space),wiki(Wiki node),bitable(Bitable),docx(Upgraded Docs),mindnote(Thinking Notes),minutes(Minutes),slides(Slides)',
        ),
      fields: z
        .string()
        .describe(
          'Specify the returned collaborator field information, if not specified, it will not be returned by default**Optional values are:** - `name`: collaborator name - `type`: collaborator type - `avatar`: profile photo - `external_label`: external labels **Note:** - You can use the special value `*` to specify to return all currently supported fields - You can use `,` to separate several fields you want to specify to return, such as: `name, avatar` - Specify the return field interface on demand for better performance',
        )
        .optional(),
      perm_type: z
        .enum(['container', 'single_page'])
        .describe(
          'Options:container(Current page and its sub-pages),single_page(Current page only. This parameter is only valid for wiki.)',
        )
        .optional(),
    }),
    path: z.object({
      token: z
        .string()
        .describe(
          'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1PermissionMemberTransferOwner = {
  project: 'drive',
  name: 'drive.v1.permissionMember.transferOwner',
  sdkName: 'drive.v1.permissionMember.transferOwner',
  path: '/open-apis/drive/v1/permissions/:token/members/transfer_owner',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Permission-Member-Transfer owner-This API is used to transfer a document owner based on file token and user information',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      member_type: z
        .enum(['email', 'openid', 'userid'])
        .describe(
          'Collaborator type, which needs to match the collaborator id Options:email(email),openid(open_id openid),userid(user_id userid)',
        ),
      member_id: z.string().describe('Collaborator id, which needs to match the collaborator type'),
    }),
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides', 'folder'])
        .describe(
          'File type, which needs to match the token of the file Options:doc(Doc),sheet(Sheet),file(File in My Space),wiki(Wiki node),bitable(Bitable),docx(Upgraded Docs),mindnote(Thinking Notes),minutes(Minutes),slides(slides),folder(Folder)',
        ),
      need_notification: z
        .boolean()
        .describe('If the value is true, the new owner is not notified. The default value is true')
        .optional(),
      remove_old_owner: z
        .boolean()
        .describe(
          'If the value is true, the permissions of the previous owner are deleted after the owner is transferred. The default value is false',
        )
        .optional(),
      stay_put: z
        .boolean()
        .describe(
          "This parameter will only take effect if the file is in a personal folder. If set to false, the system will move the content to the new owner's space. If set to true, it stays in place",
        )
        .optional(),
      old_owner_perm: z
        .string()
        .describe(
          'This parameter takes effect only when remove_old_owner = false, retaining the permissions role specified by the original file owner',
        )
        .optional(),
    }),
    path: z.object({
      token: z
        .string()
        .describe(
          'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1PermissionMemberUpdate = {
  project: 'drive',
  name: 'drive.v1.permissionMember.update',
  sdkName: 'drive.v1.permissionMember.update',
  path: '/open-apis/drive/v1/permissions/:token/members/:member_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Docs-Permission-Member-UpdatePermissionMember-This API is used to update permissions of a document collaborator based on a filetoken',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      member_type: z
        .enum(['email', 'openid', 'unionid', 'openchat', 'opendepartmentid', 'userid', 'groupid', 'wikispaceid'])
        .describe(
          'Collaborator ID Type Options:email(Email),openid(open_id Open platform ID),unionid(union_id Open platform unionID),openchat(open_chat Open platform chat ID),opendepartmentid(open_department_id Open platform department ID),userid(user_id User customized ID),groupid(group_id Custom user group ID),wikispaceid(wiki_space_id Wiki space ID - **NOTE**: This parameter is only supported by the wiki document, and it is required when you need to operate the "wiki space member" type collaborator in the wiki document)',
        ),
      perm: z
        .enum(['view', 'edit', 'full_access'])
        .describe(
          'Permission role of the collaborator Options:view(Readable role),edit(Editable role),full_access(Manageable role)',
        ),
      perm_type: z
        .enum(['container', 'single_page'])
        .describe(
          "Collaborator's permission role type Options:container(Current page and its sub-pages),single_page(Current page only)",
        )
        .optional(),
      type: z
        .enum(['user', 'chat', 'department', 'group', 'wiki_space_member', 'wiki_space_viewer', 'wiki_space_editor'])
        .describe(
          'Type of collaborator**NOTE**: This parameter is required when the `member_type` parameter is `wikispaceid`**Default value**: "" Options:user(User),chat(Chat),department(Organizational structure),group(User group),wiki_space_member(Wiki space member - **NOTE**: This parameter is not supported after the wiki space has member grouping enabled),wiki_space_viewer(Wiki space viewer - **NOTE**: This parameter is only supported if the wiki space has member grouping enabled),wiki_space_editor(Wiki space editor - **NOTE**: This parameter is only supported if the wiki space has member grouping enabled)',
        )
        .optional(),
    }),
    params: z.object({
      need_notification: z
        .boolean()
        .describe(
          'Specifies whether to notify the user after the permissions of the user are updated.**Note:** When you use `tenant_access_token` to access the API, you cannot use this parameter',
        )
        .optional(),
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides'])
        .describe(
          'File type, which needs to match the token of the file Options:doc(Doc),sheet(Sheet),file(File in My Space),wiki(Wiki node),bitable(Bitable),docx(Upgraded Docs),mindnote(Thinking Notes),minutes(Minutes),slides(Slides)',
        ),
    }),
    path: z.object({
      token: z
        .string()
        .describe(
          'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
        ),
      member_id: z.string().describe('Collaborator ID'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1PermissionPublicGet = {
  project: 'drive',
  name: 'drive.v1.permissionPublic.get',
  sdkName: 'drive.v1.permissionPublic.get',
  path: '/open-apis/drive/v1/permissions/:token/public',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Docs-Permission Setting v1-GetPermissionPublic-This interface is used to obtain permission settings for cloud documents according to filetoken',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides'])
        .describe(
          'File type, which needs to match the token of the file Options:doc(Doc),sheet(Sheet),file(File in My Space),wiki(Wiki node),bitable(Bitable),docx(Upgraded Docs),mindnote(Mindnote),minutes(Minutes),slides(slides)',
        ),
    }),
    path: z.object({
      token: z
        .string()
        .describe(
          'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1PermissionPublicPasswordCreate = {
  project: 'drive',
  name: 'drive.v1.permissionPublicPassword.create',
  sdkName: 'drive.v1.permissionPublicPassword.create',
  path: '/open-apis/drive/v1/permissions/:token/public/password',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Docs-Permission-password-Open password-This interface is used to enable the password of the cloud document according to the filetoken',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides'])
        .describe(
          'File type Options:doc(Doc),sheet(Sheet),file(File in My Space),wiki(Wiki node),bitable(Bitable),docx(Upgraded Docs),mindnote(Mindnote),minutes(Minutes(not supported)),slides(slides)',
        ),
    }),
    path: z
      .object({
        token: z
          .string()
          .describe(
            'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1PermissionPublicPasswordDelete = {
  project: 'drive',
  name: 'drive.v1.permissionPublicPassword.delete',
  sdkName: 'drive.v1.permissionPublicPassword.delete',
  path: '/open-apis/drive/v1/permissions/:token/public/password',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Docs-Permission-password-Close password-This interface is used to disable the password of cloud doc more filetoken',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides'])
        .describe(
          'File type Options:doc(Doc),sheet(Sheet),file(File in My Space),wiki(Wiki node),bitable(Bitable),docx(Upgraded Docs),mindnote(Mindnote),minutes(Minutes(not supported)),slides(slides)',
        ),
    }),
    path: z
      .object({
        token: z
          .string()
          .describe(
            'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1PermissionPublicPasswordUpdate = {
  project: 'drive',
  name: 'drive.v1.permissionPublicPassword.update',
  sdkName: 'drive.v1.permissionPublicPassword.update',
  path: '/open-apis/drive/v1/permissions/:token/public/password',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Docs-Permission-password-Refresh password-This interface is used to refresh the password of cloud doc more filetoken',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides'])
        .describe(
          'File type Options:doc(Doc),sheet(Sheet),file(File in My Space),wiki(Wiki node),bitable(Bitable),docx(Upgraded Docs),mindnote(Mindnote),minutes(Minutes(not supported)),slides(slides)',
        ),
    }),
    path: z
      .object({
        token: z
          .string()
          .describe(
            'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1PermissionPublicPatch = {
  project: 'drive',
  name: 'drive.v1.permissionPublic.patch',
  sdkName: 'drive.v1.permissionPublic.patch',
  path: '/open-apis/drive/v1/permissions/:token/public',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Docs-Permission Setting v1-Update document sharing settings-This API is used to update the common settings of a document based on a filetoken',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        external_access: z.boolean().describe('Indicates whether sharing out of the tenant is allowed').optional(),
        security_entity: z
          .enum(['anyone_can_view', 'anyone_can_edit', 'only_full_access'])
          .describe(
            'Settings of the permission to make a copy of, print, export, and copy the document. Options:anyone_can_view(AnyoneCanView All users who can access this document.),anyone_can_edit(AnyoneCanEdit Users with the edit permission.),only_full_access(OnlyFullAccess Users with manageable privileges (including me))',
          )
          .optional(),
        comment_entity: z
          .enum(['anyone_can_view', 'anyone_can_edit'])
          .describe(
            'Settings of the permission to comment on the document. Options:anyone_can_view(AnyoneCanView All users who can access this document.),anyone_can_edit(AnyoneCanEdit Users with the edit permission.)',
          )
          .optional(),
        share_entity: z
          .enum(['anyone', 'same_tenant', 'only_full_access'])
          .describe(
            'Indicates who can add and manage collaborators. Options:anyone(All users who can read or edit this document.),same_tenant(SameTenant All users who can read or edit this document in the organization.),only_full_access(OnlyFullAccess Only users with full access.)',
          )
          .optional(),
        link_share_entity: z
          .enum(['tenant_readable', 'tenant_editable', 'anyone_readable', 'anyone_editable', 'closed'])
          .describe(
            'Link sharing Options:tenant_readable(TenantReadable Users who obtain the link in the organization can read the document.),tenant_editable(TenantEditable Users who obtain the link in the organization can edit the document.),anyone_readable(AnyoneReadable All users who obtain the link can read the document. (This option is valid only when `external_access`)),anyone_editable(AnyoneEditable All users who obtain the link can edit the document. (This option is valid only when `external_access`)),closed(Closed share link.)',
          )
          .optional(),
        invite_external: z
          .boolean()
          .describe(
            'Specifies whether users without full access and non-owners are allowed to invite external participants',
          )
          .optional(),
      })
      .optional(),
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides'])
        .describe(
          'File type, which needs to match the token of the file Options:doc(Doc),sheet(Sheet),file(File in My Space),wiki(Wiki node),bitable(Bitable),docx(Upgraded Docs),mindnote(Mindnote),minutes(Minutes),slides(slides)',
        ),
    }),
    path: z.object({
      token: z
        .string()
        .describe(
          'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV1Tools = [
  driveV1ExportTaskCreate,
  driveV1ExportTaskGet,
  driveV1FileCommentBatchQuery,
  driveV1FileCommentCreate,
  driveV1FileCommentGet,
  driveV1FileCommentList,
  driveV1FileCommentPatch,
  driveV1FileCommentReplyDelete,
  driveV1FileCommentReplyList,
  driveV1FileCommentReplyUpdate,
  driveV1FileCopy,
  driveV1FileCreateFolder,
  driveV1FileCreateShortcut,
  driveV1FileDelete,
  driveV1FileDeleteSubscribe,
  driveV1FileGetSubscribe,
  driveV1FileList,
  driveV1FileMove,
  driveV1FileStatisticsGet,
  driveV1FileSubscribe,
  driveV1FileSubscriptionCreate,
  driveV1FileSubscriptionGet,
  driveV1FileSubscriptionPatch,
  driveV1FileTaskCheck,
  driveV1FileUploadFinish,
  driveV1FileUploadPrepare,
  driveV1FileVersionCreate,
  driveV1FileVersionDelete,
  driveV1FileVersionGet,
  driveV1FileVersionList,
  driveV1FileViewRecordList,
  driveV1ImportTaskCreate,
  driveV1ImportTaskGet,
  driveV1MediaBatchGetTmpDownloadUrl,
  driveV1MediaUploadFinish,
  driveV1MediaUploadPrepare,
  driveV1MetaBatchQuery,
  driveV1PermissionMemberAuth,
  driveV1PermissionMemberBatchCreate,
  driveV1PermissionMemberCreate,
  driveV1PermissionMemberDelete,
  driveV1PermissionMemberList,
  driveV1PermissionMemberTransferOwner,
  driveV1PermissionMemberUpdate,
  driveV1PermissionPublicGet,
  driveV1PermissionPublicPasswordCreate,
  driveV1PermissionPublicPasswordDelete,
  driveV1PermissionPublicPasswordUpdate,
  driveV1PermissionPublicPatch,
];
