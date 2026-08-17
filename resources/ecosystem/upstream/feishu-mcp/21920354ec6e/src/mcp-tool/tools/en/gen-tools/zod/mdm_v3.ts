import { z } from 'zod';
export type mdmV3ToolName = 'mdm.v3.batchCountryRegion.get' | 'mdm.v3.countryRegion.list';
export const mdmV3BatchCountryRegionGet = {
  project: 'mdm',
  name: 'mdm.v3.batchCountryRegion.get',
  sdkName: 'mdm.v3.batchCountryRegion.get',
  path: '/open-apis/mdm/v3/batch_country_region',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu Master Data Management-Common Data-country region-batch get major by id-Batch Get Country Region By ID',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      fields: z.array(z.string()).describe('Required query field set'),
      ids: z.array(z.string()).describe('Master Data CodeSet'),
      languages: z
        .array(z.string())
        .describe(
          'The language type you want to return, the supported format is as follows:-Chinese: zh-CN-English: en-US-Japanese: ja-JPFor multilingual text fields, if a specific language is passed in, the corresponding language text will be returned',
        ),
    }),
  },
};
export const mdmV3CountryRegionList = {
  project: 'mdm',
  name: 'mdm.v3.countryRegion.list',
  sdkName: 'mdm.v3.countryRegion.list',
  path: '/open-apis/mdm/v3/country_regions',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Feishu Master Data Management-Common Data-country region-Pagination Batch Query Country Region-Paging batch query country region',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        filter: z
          .object({
            logic: z
              .string()
              .describe(
                'LogicMultiple expressions at the same level are determined by the logic parameter using "and/or" conditions.0=and, 1=or',
              ),
            expressions: z
              .array(
                z.object({
                  field: z.string().describe('field name'),
                  operator: z
                    .string()
                    .describe(
                      'Operator0=equal, 1=not equal, 2=greater than, 3=greater than or equal to, 4=less than, 5=less than or equal to, 6=any, 7=not any, 8=match, 9=prefix match, 10=suffix Match, 11=null, 12=not null',
                    ),
                  value: z
                    .object({
                      string_value: z.string().describe('string value').optional(),
                      bool_value: z.boolean().describe('Boolean').optional(),
                      int_value: z.string().describe('shaping value').optional(),
                      string_list_value: z.array(z.string()).describe('String list value').optional(),
                      int_list_value: z.array(z.string()).describe('integer list value').optional(),
                    })
                    .describe('field value'),
                }),
              )
              .describe('filter condition')
              .optional(),
          })
          .describe('Filter parameters')
          .optional(),
        common: z.object({}).describe('This parameter can be ignored').optional(),
      })
      .optional(),
    params: z.object({
      languages: z
        .array(z.string())
        .describe(
          'The language type you want to return, the supported format is as follows:-Chinese: zh-CN-English: en-US-Japanese: ja-JPFor multilingual text fields, if a specific language is passed in, the corresponding language text will be returned',
        ),
      fields: z.array(z.string()).describe('Required query field set'),
      limit: z.number().describe('query page size').optional(),
      offset: z.number().describe('query start location').optional(),
      return_count: z.boolean().describe('Whether to return the total').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const mdmV3Tools = [mdmV3BatchCountryRegionGet, mdmV3CountryRegionList];
