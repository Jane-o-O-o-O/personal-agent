import { z } from 'zod';
export type okrV1ToolName =
  | 'okr.v1.okr.batchGet'
  | 'okr.v1.periodRule.list'
  | 'okr.v1.period.create'
  | 'okr.v1.period.list'
  | 'okr.v1.period.patch'
  | 'okr.v1.progressRecord.create'
  | 'okr.v1.progressRecord.delete'
  | 'okr.v1.progressRecord.get'
  | 'okr.v1.progressRecord.update'
  | 'okr.v1.review.query'
  | 'okr.v1.userOkr.list';
export const okrV1OkrBatchGet = {
  project: 'okr',
  name: 'okr.v1.okr.batchGet',
  sdkName: 'okr.v1.okr.batchGet',
  path: '/open-apis/okr/v1/okrs/batch_get',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-OKR-OKR content-Get OKR in bulk-Get OKR in batches based on OKR id',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      okr_ids: z.array(z.string()).describe('OKR ID list, up to 10'),
      lang: z
        .string()
        .describe("Request the language version of OKR (such as @'s name), lang = en_us/zh_cn, request Query")
        .optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const okrV1PeriodRuleList = {
  project: 'okr',
  name: 'okr.v1.periodRule.list',
  sdkName: 'okr.v1.periodRule.list',
  path: '/open-apis/okr/v1/period_rules',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-OKR-Period rule-Get OKR period rules-Get a list of periodic rules for your tenant',
  accessTokens: ['tenant'],
  schema: {},
};
export const okrV1PeriodCreate = {
  project: 'okr',
  name: 'okr.v1.period.create',
  sdkName: 'okr.v1.period.create',
  path: '/open-apis/okr/v1/periods',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-OKR-OKR Period-Create OKR period-Creare a OKR period according to given period rule',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      period_rule_id: z.string().describe('Period rule id'),
      start_month: z.string().describe('Period start year month'),
    }),
  },
};
export const okrV1PeriodList = {
  project: 'okr',
  name: 'okr.v1.period.list',
  sdkName: 'okr.v1.period.list',
  path: '/open-apis/okr/v1/periods',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-OKR-OKR Period-Get the OKR cycle list-Get the OKR cycle list',
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
        page_size: z.number().describe('Page size, default 10').optional(),
      })
      .optional(),
  },
};
export const okrV1PeriodPatch = {
  project: 'okr',
  name: 'okr.v1.period.patch',
  sdkName: 'okr.v1.period.patch',
  path: '/open-apis/okr/v1/periods/:period_id',
  httpMethod: 'PATCH',
  description:
    "[Feishu/Lark]-OKR-OKR Period-Modify OKR period status-Modify a OKR period's status to 'Normal', 'Invalid' or 'Hidden'. This apply on every user in your tenant, please take caution",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      status: z
        .number()
        .describe(
          'Period display status Options:1(normal_status Normal state),2(mark_invalid Mark failure),3(hidden_period Hidden period)',
        ),
    }),
    path: z.object({ period_id: z.string().describe('Period id') }),
  },
};
export const okrV1ProgressRecordCreate = {
  project: 'okr',
  name: 'okr.v1.progressRecord.create',
  sdkName: 'okr.v1.progressRecord.create',
  path: '/open-apis/okr/v1/progress_records',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-OKR-Progress record-Create OKR progress record-Create OKR progress record',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      source_title: z.string().describe('Sources of progress'),
      source_url: z.string().describe('Progress Source Link'),
      target_id: z.string().describe('Target id, corresponding to target_type'),
      target_type: z.number().describe('Target type Options:2(objective),3(key_result Key Result)'),
      content: z
        .object({
          blocks: z
            .array(
              z.object({
                type: z
                  .enum(['paragraph', 'gallery'])
                  .describe('Document element type Options:paragraph(Text paragraph),gallery(Picture)')
                  .optional(),
                paragraph: z
                  .object({
                    style: z
                      .object({
                        list: z
                          .object({
                            type: z
                              .enum(['number', 'bullet', 'checkBox', 'checkedBox', 'indent'])
                              .describe(
                                'List type Options:number(Numbered list),bullet(Unordered list),checkBox(Task list),checkedBox(List of completed tasks),indent(Tab indentation)',
                              )
                              .optional(),
                            indentLevel: z
                              .number()
                              .describe(
                                'The indentation level of the list, support to specify the indentation of a line, except for the code block list support to set the indentation, support 1-16 indentation, the value range: [1,16]',
                              )
                              .optional(),
                            number: z
                              .number()
                              .describe(
                                'The line number used to specify the list, which is only effective for numbered list and code blocks. If indentation is set for numbered list, the line number may appear as letters or Roman numerals',
                              )
                              .optional(),
                          })
                          .describe('Numbered list/unordered list/task list')
                          .optional(),
                      })
                      .describe('Paragraph style')
                      .optional(),
                    elements: z
                      .array(
                        z.object({
                          type: z
                            .enum(['textRun', 'docsLink', 'person'])
                            .describe(
                              'Element type Options:textRun(Text element),docsLink(Document link element),person(@User type element)',
                            )
                            .optional(),
                          textRun: z
                            .object({
                              text: z.string().describe('Specific text content').optional(),
                              style: z
                                .object({
                                  bold: z.boolean().describe('Bold or not').optional(),
                                  strikeThrough: z.boolean().describe('Whether to delete').optional(),
                                  backColor: z
                                    .object({
                                      red: z.number().describe('Red, value range [0,255]').optional(),
                                      green: z.number().describe('Green, value range [0,255]').optional(),
                                      blue: z.number().describe('Blue, value range [0,255]').optional(),
                                      alpha: z.number().describe('Transparency, value range [0,1]').optional(),
                                    })
                                    .describe('Background color')
                                    .optional(),
                                  textColor: z
                                    .object({
                                      red: z.number().describe('Red, value range [0,255]').optional(),
                                      green: z.number().describe('Green, value range [0,255]').optional(),
                                      blue: z.number().describe('Blue, value range [0,255]').optional(),
                                      alpha: z.number().describe('Transparency, value range [0,1]').optional(),
                                    })
                                    .describe('Font color')
                                    .optional(),
                                  link: z
                                    .object({ url: z.string().describe('Link address').optional() })
                                    .describe('Link address')
                                    .optional(),
                                })
                                .describe('Styling of text content, support for BIUS, colors, etc')
                                .optional(),
                            })
                            .describe('Text')
                            .optional(),
                          docsLink: z
                            .object({
                              url: z.string().describe('Feishu cloud document link address').optional(),
                              title: z.string().describe('Feishu Cloud Document Title').optional(),
                            })
                            .describe('Feishu Cloud Document')
                            .optional(),
                          person: z
                            .object({ openId: z.string().describe('Employee OpenID').optional() })
                            .describe('@User')
                            .optional(),
                        }),
                      )
                      .describe('Paragraph elements form a paragraph')
                      .optional(),
                  })
                  .describe('Text paragraph')
                  .optional(),
                gallery: z
                  .object({
                    imageList: z
                      .array(
                        z.object({
                          fileToken: z
                            .string()
                            .describe('Image token, obtained through the upload image interface')
                            .optional(),
                          src: z.string().describe('src').optional(),
                          width: z.number().describe('Picture width in px').optional(),
                          height: z.number().describe('Picture height, unit px').optional(),
                        }),
                      )
                      .describe('Picture elements')
                      .optional(),
                  })
                  .describe('Picture')
                  .optional(),
              }),
            )
            .describe('The document structure is arranged in rows, each row of content is a Block')
            .optional(),
        })
        .describe('Details of progress, in rich text format'),
      source_url_pc: z.string().describe('{}').optional(),
      source_url_mobile: z.string().describe('{}').optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const okrV1ProgressRecordDelete = {
  project: 'okr',
  name: 'okr.v1.progressRecord.delete',
  sdkName: 'okr.v1.progressRecord.delete',
  path: '/open-apis/okr/v1/progress_records/:progress_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-OKR-Progress record-Delete OKR progress-Delete OKR progress',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({ progress_id: z.string().describe('progress id') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const okrV1ProgressRecordGet = {
  project: 'okr',
  name: 'okr.v1.progressRecord.get',
  sdkName: 'okr.v1.progressRecord.get',
  path: '/open-apis/okr/v1/progress_records/:progress_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-OKR-Progress record-Get OKR progress records-Obtain OKR progress record details according to ID',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ progress_id: z.string().describe('OKR progress record ID to be queried').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const okrV1ProgressRecordUpdate = {
  project: 'okr',
  name: 'okr.v1.progressRecord.update',
  sdkName: 'okr.v1.progressRecord.update',
  path: '/open-apis/okr/v1/progress_records/:progress_id',
  httpMethod: 'PUT',
  description: '[Feishu/Lark]-OKR-Progress record-Update OKR progress-Update OKR progress',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      content: z
        .object({
          blocks: z
            .array(
              z.object({
                type: z
                  .enum(['paragraph', 'gallery'])
                  .describe('Document element type Options:paragraph(Text paragraph),gallery(Picture)')
                  .optional(),
                paragraph: z
                  .object({
                    style: z
                      .object({
                        list: z
                          .object({
                            type: z
                              .enum(['number', 'bullet', 'checkBox', 'checkedBox', 'indent'])
                              .describe(
                                'List type Options:number(Numbered list),bullet(Unordered list),checkBox(Task list),checkedBox(List of completed tasks),indent(Tab indentation)',
                              )
                              .optional(),
                            indentLevel: z
                              .number()
                              .describe(
                                'The indentation level of the list, support to specify the indentation of a line, except for the code block list support to set the indentation, support 1-16 indentation, the value range: [1,16]',
                              )
                              .optional(),
                            number: z
                              .number()
                              .describe(
                                'The line number used to specify the list, which is only effective for numbered list and code blocks. If indentation is set for numbered list, the line number may appear as letters or Roman numerals',
                              )
                              .optional(),
                          })
                          .describe('Numbered list/unordered list/task list')
                          .optional(),
                      })
                      .describe('Paragraph style')
                      .optional(),
                    elements: z
                      .array(
                        z.object({
                          type: z
                            .enum(['textRun', 'docsLink', 'person'])
                            .describe(
                              'Element type Options:textRun(Text element),docsLink(Document link element),person(@User type element)',
                            )
                            .optional(),
                          textRun: z
                            .object({
                              text: z.string().describe('Specific text content').optional(),
                              style: z
                                .object({
                                  bold: z.boolean().describe('Bold or not').optional(),
                                  strikeThrough: z.boolean().describe('Whether to delete').optional(),
                                  backColor: z
                                    .object({
                                      red: z.number().describe('Red, value range [0,255]').optional(),
                                      green: z.number().describe('Green, value range [0,255]').optional(),
                                      blue: z.number().describe('Blue, value range [0,255]').optional(),
                                      alpha: z.number().describe('Transparency, value range [0,1]').optional(),
                                    })
                                    .describe('Background color')
                                    .optional(),
                                  textColor: z
                                    .object({
                                      red: z.number().describe('Red, value range [0,255]').optional(),
                                      green: z.number().describe('Green, value range [0,255]').optional(),
                                      blue: z.number().describe('Blue, value range [0,255]').optional(),
                                      alpha: z.number().describe('Transparency, value range [0,1]').optional(),
                                    })
                                    .describe('Font color')
                                    .optional(),
                                  link: z
                                    .object({ url: z.string().describe('Link address').optional() })
                                    .describe('Link address')
                                    .optional(),
                                })
                                .describe('Styling of text content, support for BIUS, colors, etc')
                                .optional(),
                            })
                            .describe('Text')
                            .optional(),
                          docsLink: z
                            .object({
                              url: z.string().describe('Feishu cloud document link address').optional(),
                              title: z.string().describe('Feishu Cloud Document Title').optional(),
                            })
                            .describe('Feishu Cloud Document')
                            .optional(),
                          person: z
                            .object({ openId: z.string().describe('Employee OpenID').optional() })
                            .describe('@User')
                            .optional(),
                        }),
                      )
                      .describe('Paragraph elements form a paragraph')
                      .optional(),
                  })
                  .describe('Text paragraph')
                  .optional(),
                gallery: z
                  .object({
                    imageList: z
                      .array(
                        z.object({
                          fileToken: z
                            .string()
                            .describe('Image token, obtained through the upload image interface')
                            .optional(),
                          src: z.string().describe('src').optional(),
                          width: z.number().describe('Picture width in px').optional(),
                          height: z.number().describe('Picture height, unit px').optional(),
                        }),
                      )
                      .describe('Picture elements')
                      .optional(),
                  })
                  .describe('Picture')
                  .optional(),
              }),
            )
            .describe('The document structure is arranged in rows, each row of content is a Block')
            .optional(),
        })
        .describe('Details of progress, in rich text format'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ progress_id: z.string().describe('progress id') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const okrV1ReviewQuery = {
  project: 'okr',
  name: 'okr.v1.review.query',
  sdkName: 'okr.v1.review.query',
  path: '/open-apis/okr/v1/reviews/query',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-OKR-Review-Query review information-According to the cycle and user query review information',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      user_ids: z.array(z.string()).describe('Target user id list, up to 5'),
      period_ids: z.array(z.string()).describe('period_id list, up to 5'),
    }),
  },
};
export const okrV1UserOkrList = {
  project: 'okr',
  name: 'okr.v1.userOkr.list',
  sdkName: 'okr.v1.userOkr.list',
  path: '/open-apis/okr/v1/users/:user_id/okrs',
  httpMethod: 'GET',
  description: "[Feishu/Lark]-OKR-OKR content-Get the user's OKR list-Get OKR list based on user id",
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      offset: z
        .string()
        .describe(
          'The offset of the request list (corresponding to the okr_list field of the response body), offset>=0',
        ),
      limit: z.string().describe('The length of the request list, 0 < limit < = 10, in the request Query'),
      lang: z
        .string()
        .describe("Request the language version of OKR (such as @'s name), lang = en_us/zh_cn, request Query")
        .optional(),
      period_ids: z.array(z.string()).describe('period_id list, up to 10').optional(),
    }),
    path: z.object({ user_id: z.string().describe('Target user id').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const okrV1Tools = [
  okrV1OkrBatchGet,
  okrV1PeriodRuleList,
  okrV1PeriodCreate,
  okrV1PeriodList,
  okrV1PeriodPatch,
  okrV1ProgressRecordCreate,
  okrV1ProgressRecordDelete,
  okrV1ProgressRecordGet,
  okrV1ProgressRecordUpdate,
  okrV1ReviewQuery,
  okrV1UserOkrList,
];
