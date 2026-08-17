import { z } from 'zod';
export type docsV1ToolName = 'docs.v1.content.get';
export const docsV1ContentGet = {
  project: 'docs',
  name: 'docs.v1.content.get',
  sdkName: 'docs.v1.content.get',
  path: '/open-apis/docs/v1/content',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Common-Get docs content-You can obtain the docs content. Currently, only upgraded document content in markdown format is supported',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      doc_token: z
        .string()
        .describe('The unique identification of the docs. Click [here] to learn how to get `doc_token`'),
      doc_type: z.literal('docx').describe('Docs type Options:docx(Upgraded Document)'),
      content_type: z.literal('markdown').describe('Content type Options:markdown(Markdown format)'),
      lang: z
        .enum(['zh', 'en', 'ja'])
        .describe(
          'Specifies the language of the user name when the @user element exists in the docs. Default `zh` Options:zh(Chinese),en(English),ja(Japanese)',
        )
        .optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const docsV1Tools = [docsV1ContentGet];
