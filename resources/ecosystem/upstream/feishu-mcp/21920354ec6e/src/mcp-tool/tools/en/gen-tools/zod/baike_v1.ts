import { z } from 'zod';
export type baikeV1ToolName =
  | 'baike.v1.classification.list'
  | 'baike.v1.draft.create'
  | 'baike.v1.draft.update'
  | 'baike.v1.entity.create'
  | 'baike.v1.entity.extract'
  | 'baike.v1.entity.get'
  | 'baike.v1.entity.highlight'
  | 'baike.v1.entity.list'
  | 'baike.v1.entity.match'
  | 'baike.v1.entity.search'
  | 'baike.v1.entity.update';
export const baikeV1ClassificationList = {
  project: 'baike',
  name: 'baike.v1.classification.list',
  sdkName: 'baike.v1.classification.list',
  path: '/open-apis/baike/v1/classifications',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Lingo-Classification-Classification list-Get Lingo classification data, Baike currently supports primary classification and sub-classification, temporarily does not support multi-level classification',
  accessTokens: ['tenant', 'user'],
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
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const baikeV1DraftCreate = {
  project: 'baike',
  name: 'baike.v1.draft.create',
  sdkName: 'baike.v1.draft.create',
  path: '/open-apis/baike/v1/drafts',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Lingo-Draft-Create draft-Drafts are separate definitions and are not bound to entity words. Creating drafts is not the same as creating entity words. Creating drafts may be creating entity words or updating entity words',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      id: z
        .string()
        .describe('Entry ID (fill in when you need to update a certain entry, but not if you create a new entry)')
        .optional(),
      main_keys: z
        .array(
          z.object({
            key: z.string().describe('Value of name'),
            display_status: z
              .object({
                allow_highlight: z
                  .boolean()
                  .describe('Whether the corresponding name is highlighted in the message/cloud document'),
                allow_search: z.boolean().describe('Whether the corresponding name is displayed in the search results'),
              })
              .describe('Name Display Scope'),
          }),
        )
        .describe('Entry name'),
      aliases: z
        .array(
          z.object({
            key: z.string().describe('Value of name'),
            display_status: z
              .object({
                allow_highlight: z
                  .boolean()
                  .describe('Whether the corresponding name is highlighted in the message/cloud document'),
                allow_search: z.boolean().describe('Whether the corresponding name is displayed in the search results'),
              })
              .describe('Name Display Scope'),
          }),
        )
        .describe('alias')
        .optional(),
      description: z
        .string()
        .describe(
          'Explanation of terms in plain text format. Note: There is at least one description and rich_text, otherwise an error will be reported: 1540001',
        )
        .optional(),
      related_meta: z
        .object({
          users: z
            .array(
              z.object({
                id: z.string().describe('Corresponding to the relevant information ID'),
                title: z
                  .string()
                  .describe(
                    'Description of relevant information, such as description of relevant contact person, title of relevant link',
                  )
                  .optional(),
              }),
            )
            .describe('Related contacts')
            .optional(),
          chats: z
            .array(z.object({ id: z.string().describe('Corresponding to the relevant information ID') }))
            .describe('Related public groups in related services')
            .optional(),
          docs: z
            .array(
              z.object({
                title: z
                  .string()
                  .describe(
                    'Description of relevant information, such as description of relevant contact person, title of relevant link',
                  )
                  .optional(),
                url: z.string().describe('link address').optional(),
              }),
            )
            .describe('Related Cloud Documentation')
            .optional(),
          oncalls: z
            .array(z.object({ id: z.string().describe('Corresponding to the relevant information ID') }))
            .describe('Related on-duty accounts in related services')
            .optional(),
          links: z
            .array(
              z.object({
                title: z
                  .string()
                  .describe(
                    'Description of relevant information, such as description of relevant contact person, title of relevant link',
                  )
                  .optional(),
                url: z.string().describe('link address').optional(),
              }),
            )
            .describe('Related Links')
            .optional(),
          abbreviations: z
            .array(z.object({ id: z.string().describe('Related entry ID').optional() }))
            .describe('Related terms')
            .optional(),
          classifications: z
            .array(
              z.object({
                id: z.string().describe('sub-category ID'),
                father_id: z.string().describe('Corresponding to the first-level classification ID').optional(),
              }),
            )
            .describe(
              'Category to which the current entry belongs < br >Entries can only belong to sub-categories, and only one sub-category can be selected under each first-level category',
            )
            .optional(),
          images: z
            .array(
              z.object({
                token: z
                  .string()
                  .describe('The picture token obtained after uploading the picture through the file interface'),
              }),
            )
            .describe('Uploaded image')
            .optional(),
        })
        .describe('More related information')
        .optional(),
      outer_info: z
        .object({
          provider: z.string().describe('External system (cannot contain horizontal line "-")'),
          outer_id: z
            .string()
            .describe('The unique ID corresponding to the entry in the external system (cannot contain a dash "-")'),
        })
        .describe('External System Linked Data')
        .optional(),
      rich_text: z
        .string()
        .describe(
          'Rich text format (when filling in rich text content, the description field will be invalid and may not be filled in), supported formats refer to the interpretation section in [Feishu Dictionary Guide]',
        )
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const baikeV1DraftUpdate = {
  project: 'baike',
  name: 'baike.v1.draft.update',
  sdkName: 'baike.v1.draft.update',
  path: '/open-apis/baike/v1/drafts/:draft_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Lingo-Draft-Update draft-Update draft content according to draft_id, approved drafts cannot be edited',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      id: z.string().describe('Entity word Id').optional(),
      main_keys: z
        .array(
          z.object({
            key: z.string().describe('Content'),
            display_status: z
              .object({
                allow_highlight: z.boolean().describe('Whether to allow highlighting'),
                allow_search: z.boolean().describe('Whether to allow search'),
              })
              .describe('Display status'),
          }),
        )
        .describe('Key words'),
      aliases: z
        .array(
          z.object({
            key: z.string().describe('Content'),
            display_status: z
              .object({
                allow_highlight: z.boolean().describe('Whether to allow highlighting'),
                allow_search: z.boolean().describe('Whether to allow search'),
              })
              .describe('Display status'),
          }),
        )
        .describe('Alias')
        .optional(),
      description: z
        .string()
        .describe(
          'Definition of entries in plain text format. Note: There must be at least one description and rich_text, otherwise an error will be reported: 1540001',
        )
        .optional(),
      related_meta: z
        .object({
          users: z
            .array(z.object({ id: z.string().describe('Data id'), title: z.string().describe('Title').optional() }))
            .describe('Related user information')
            .optional(),
          chats: z
            .array(z.object({ id: z.string().describe('Data id') }))
            .describe('Associated group information')
            .optional(),
          docs: z
            .array(
              z.object({
                title: z.string().describe('Title').optional(),
                url: z.string().describe('Link address').optional(),
              }),
            )
            .describe('Related Document Information')
            .optional(),
          oncalls: z
            .array(z.object({ id: z.string().describe('Data id') }))
            .describe('Associated Duty Officer Information')
            .optional(),
          links: z
            .array(
              z.object({
                title: z.string().describe('Title').optional(),
                url: z.string().describe('Link address').optional(),
              }),
            )
            .describe('Associated link information')
            .optional(),
          abbreviations: z
            .array(z.object({ id: z.string().describe('entity id').optional() }))
            .describe(
              'Entries with similar meaning or relevance can be set as related, and can be displayed as related entries in the entry',
            )
            .optional(),
          classifications: z
            .array(
              z.object({
                id: z.string().describe('Classification ID'),
                father_id: z.string().describe('The ID of the parent classification').optional(),
              }),
            )
            .describe(
              'Classification information (does not support passing in first-level classifications. Entries cannot belong to multiple sub-classifications under the same first-level classification at the same time, and sub-classifications under the first-level classification are mutually exclusive)',
            )
            .optional(),
          images: z
            .array(z.object({ token: z.string().describe('Image token uploaded through the file interface') }))
            .describe('Uploaded related images')
            .optional(),
        })
        .describe('Related data')
        .optional(),
      rich_text: z.string().describe('Description information in rich text format').optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ draft_id: z.string().describe('Draft Id') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const baikeV1EntityCreate = {
  project: 'baike',
  name: 'baike.v1.entity.create',
  sdkName: 'baike.v1.entity.create',
  path: '/open-apis/baike/v1/entities',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Lingo-Entity-Create an exemption entry-Create the existing entries through this interface, do not need Lingo a moderator review can be written directly to the thesaurus, please use carefully [tenant moderator please review carefully]',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      main_keys: z
        .array(
          z.object({
            key: z.string().describe('Content'),
            display_status: z
              .object({
                allow_highlight: z.boolean().describe('Whether to allow highlighting'),
                allow_search: z.boolean().describe('Whether to allow search'),
              })
              .describe('Display status'),
          }),
        )
        .describe('Key words'),
      aliases: z
        .array(
          z.object({
            key: z.string().describe('Content'),
            display_status: z
              .object({
                allow_highlight: z.boolean().describe('Whether to allow highlighting'),
                allow_search: z.boolean().describe('Whether to allow search'),
              })
              .describe('Display status'),
          }),
        )
        .describe('Alias')
        .optional(),
      description: z
        .string()
        .describe(
          'Definition of entries in plain text format. Note: There must be at least one description and rich_text, otherwise an error will be reported: 1540001',
        )
        .optional(),
      related_meta: z
        .object({
          users: z
            .array(z.object({ id: z.string().describe('Data id'), title: z.string().describe('Title').optional() }))
            .describe('Related user information')
            .optional(),
          chats: z
            .array(z.object({ id: z.string().describe('Data id') }))
            .describe('Associated group information')
            .optional(),
          docs: z
            .array(
              z.object({
                title: z.string().describe('Title').optional(),
                url: z.string().describe('Link address').optional(),
              }),
            )
            .describe('Related Document Information')
            .optional(),
          oncalls: z
            .array(z.object({ id: z.string().describe('Data id') }))
            .describe('Associated Duty Officer Information')
            .optional(),
          links: z
            .array(
              z.object({
                title: z.string().describe('Title').optional(),
                url: z.string().describe('Link address').optional(),
              }),
            )
            .describe('Associated link information')
            .optional(),
          abbreviations: z
            .array(z.object({ id: z.string().describe('entity id').optional() }))
            .describe(
              'Entries with similar meaning or relevance can be set as related, and can be displayed as related entries in the entry',
            )
            .optional(),
          classifications: z
            .array(
              z.object({
                id: z.string().describe('Classification ID'),
                father_id: z.string().describe('The ID of the parent classification').optional(),
              }),
            )
            .describe(
              'Classification information (does not support passing in first-level classifications. Entries cannot belong to multiple sub-classifications under the same first-level classification at the same time, and sub-classifications under the first-level classification are mutually exclusive)',
            )
            .optional(),
          images: z
            .array(z.object({ token: z.string().describe('Image token uploaded through the file interface') }))
            .describe('Uploaded related images')
            .optional(),
        })
        .describe('Related data')
        .optional(),
      outer_info: z
        .object({
          provider: z.string().describe('Data provider (can not include the horizontal line "-")'),
          outer_id: z
            .string()
            .describe('External id is unique for each entry (cannot contain the horizontal line "-")'),
        })
        .describe('External id associated data')
        .optional(),
      rich_text: z
        .string()
        .describe(
          'Description information in rich text format**Note**: The rich text format needs to contain at least one `<p>` tag, otherwise the request will report an error',
        )
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const baikeV1EntityExtract = {
  project: 'baike',
  name: 'baike.v1.entity.extract',
  sdkName: 'baike.v1.entity.extract',
  path: '/open-apis/baike/v1/entities/extract',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Lingo-Entity-Extract lingo entity words-Extract physical words in the text that could become Baike entries and recommend possible aliases (does not filter content where tenants have become Baike entries)',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        text: z
          .string()
          .describe(
            'The text that needs to be extracted for the Baike entity word (does not filter the content of the tenant that has become a Baike entry)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const baikeV1EntityGet = {
  project: 'baike',
  name: 'baike.v1.entity.get',
  sdkName: 'baike.v1.entity.get',
  path: '/open-apis/baike/v1/entities/:entity_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Lingo-Entity-Get entity-Pull the corresponding entity details through the entity id',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        provider: z.string().describe('Data provider').optional(),
        outer_id: z.string().describe('External unique id').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({ entity_id: z.string().describe('Entity word id').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const baikeV1EntityHighlight = {
  project: 'baike',
  name: 'baike.v1.entity.highlight',
  sdkName: 'baike.v1.entity.highlight',
  path: '/open-apis/baike/v1/entities/highlight',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Lingo-Entity-Highlight entity-The user passes in a sentence and returns the position and corresponding Id of the entity word, allowing the user to highlight the entity word',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      text: z
        .string()
        .describe('A sentence that requires the content of the entity word to be recognized (no more than 1000 words)'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const baikeV1EntityList = {
  project: 'baike',
  name: 'baike.v1.entity.list',
  sdkName: 'baike.v1.entity.list',
  path: '/open-apis/baike/v1/entities',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Lingo-Entity-Get entities-Paging entity word data to support all entity word pulling within the tenant',
  accessTokens: ['tenant', 'user'],
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
        provider: z.string().describe('Data provider [can be used to filter data]').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const baikeV1EntityMatch = {
  project: 'baike',
  name: 'baike.v1.entity.match',
  sdkName: 'baike.v1.entity.match',
  path: '/open-apis/baike/v1/entities/match',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Lingo-Entity-Match entity-Accurately match the keywords, full names, and alias attributes of entity words, and recall the corresponding IDs',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({ word: z.string().describe('Entity word main keyword, full name, alias full match') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const baikeV1EntitySearch = {
  project: 'baike',
  name: 'baike.v1.entity.search',
  sdkName: 'baike.v1.entity.search',
  path: '/open-apis/baike/v1/entities/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Lingo-Entity-Search entity-Passing in keywords, performing fuzzy matching to search for corresponding entity words',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        query: z.string().describe('Search keywords').optional(),
        classification_filter: z
          .object({
            include: z.array(z.string()).describe('Classification to be obtained').optional(),
            exclude: z.array(z.string()).describe('Classification to be excluded').optional(),
          })
          .describe('Classification Filter')
          .optional(),
        sources: z
          .array(z.number())
          .describe('Creation source of the entry, 1: user creation, 2: batch import, 3: official, 4: OpenAPI creation')
          .optional(),
        creators: z.array(z.string()).describe('creator').optional(),
      })
      .optional(),
    params: z
      .object({
        page_size: z.number().describe('Page size').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const baikeV1EntityUpdate = {
  project: 'baike',
  name: 'baike.v1.entity.update',
  sdkName: 'baike.v1.entity.update',
  path: '/open-apis/baike/v1/entities/:entity_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Lingo-Entity-Update the exemption entry-Update the existing entries through this interface, do not need Lingo moderator review can be written directly to the thesaurus, please use carefully [tenant moderator please review carefully]',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      main_keys: z
        .array(
          z.object({
            key: z.string().describe('Content'),
            display_status: z
              .object({
                allow_highlight: z.boolean().describe('Whether to allow highlighting'),
                allow_search: z.boolean().describe('Whether to allow search'),
              })
              .describe('Display status'),
          }),
        )
        .describe('Key words'),
      aliases: z
        .array(
          z.object({
            key: z.string().describe('Content'),
            display_status: z
              .object({
                allow_highlight: z.boolean().describe('Whether to allow highlighting'),
                allow_search: z.boolean().describe('Whether to allow search'),
              })
              .describe('Display status'),
          }),
        )
        .describe('Alias')
        .optional(),
      description: z
        .string()
        .describe(
          'Definition of entries in plain text format. Note: There must be at least one description and rich_text, otherwise an error will be reported: 1540001',
        )
        .optional(),
      related_meta: z
        .object({
          users: z
            .array(z.object({ id: z.string().describe('Data id'), title: z.string().describe('Title').optional() }))
            .describe('Related user information')
            .optional(),
          chats: z
            .array(z.object({ id: z.string().describe('Data id') }))
            .describe('Associated group information')
            .optional(),
          docs: z
            .array(
              z.object({
                title: z.string().describe('Title').optional(),
                url: z.string().describe('Link address').optional(),
              }),
            )
            .describe('Related Document Information')
            .optional(),
          oncalls: z
            .array(z.object({ id: z.string().describe('Data id') }))
            .describe('Associated Duty Officer Information')
            .optional(),
          links: z
            .array(
              z.object({
                title: z.string().describe('Title').optional(),
                url: z.string().describe('Link address').optional(),
              }),
            )
            .describe('Associated link information')
            .optional(),
          abbreviations: z
            .array(z.object({ id: z.string().describe('entity id').optional() }))
            .describe(
              'Entries with similar meaning or relevance can be set as related, and can be displayed as related entries in the entry',
            )
            .optional(),
          classifications: z
            .array(
              z.object({
                id: z.string().describe('Classification ID'),
                father_id: z.string().describe('The ID of the parent classification').optional(),
              }),
            )
            .describe(
              'Classification information (does not support passing in first-level classifications. Entries cannot belong to multiple sub-classifications under the same first-level classification at the same time, and sub-classifications under the first-level classification are mutually exclusive)',
            )
            .optional(),
          images: z
            .array(z.object({ token: z.string().describe('Image token uploaded through the file interface') }))
            .describe('Uploaded related images')
            .optional(),
        })
        .describe('Related data')
        .optional(),
      outer_info: z
        .object({
          provider: z.string().describe('Data provider (can not include the horizontal line "-")'),
          outer_id: z
            .string()
            .describe('External id is unique for each entry (cannot contain the horizontal line "-")'),
        })
        .describe('External id associated data')
        .optional(),
      rich_text: z.string().describe('Description information in rich text format').optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ entity_id: z.string().describe('Entity word ID').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const baikeV1Tools = [
  baikeV1ClassificationList,
  baikeV1DraftCreate,
  baikeV1DraftUpdate,
  baikeV1EntityCreate,
  baikeV1EntityExtract,
  baikeV1EntityGet,
  baikeV1EntityHighlight,
  baikeV1EntityList,
  baikeV1EntityMatch,
  baikeV1EntitySearch,
  baikeV1EntityUpdate,
];
