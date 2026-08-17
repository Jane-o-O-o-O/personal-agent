import { z } from 'zod';
export type imV2ToolName =
  | 'im.v2.appFeedCardBatch.delete'
  | 'im.v2.appFeedCardBatch.update'
  | 'im.v2.appFeedCard.create'
  | 'im.v2.bizEntityTagRelation.create'
  | 'im.v2.bizEntityTagRelation.get'
  | 'im.v2.bizEntityTagRelation.update'
  | 'im.v2.chatButton.update'
  | 'im.v2.feedCard.botTimeSentive'
  | 'im.v2.feedCard.patch'
  | 'im.v2.tag.create'
  | 'im.v2.tag.patch'
  | 'im.v2.urlPreview.batchUpdate';
export const imV2AppFeedCardBatchDelete = {
  project: 'im',
  name: 'im.v2.appFeedCardBatch.delete',
  sdkName: 'im.v2.appFeedCardBatch.delete',
  path: '/open-apis/im/v2/app_feed_card/batch',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Feed-Apps-Delete app feed card-This interface is used to delete application information flow cards',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        feed_cards: z
          .array(
            z.object({
              biz_id: z.string().describe('business id'),
              user_id: z
                .string()
                .describe(
                  'user id (The ID type is consistent with the values of user_id_type. If it is a store application, user IDs of type user_id cannot be used as the permission to obtain user IDs is not supported.)',
                ),
            }),
          )
          .describe('feed cards')
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const imV2AppFeedCardBatchUpdate = {
  project: 'im',
  name: 'im.v2.appFeedCardBatch.update',
  sdkName: 'im.v2.appFeedCardBatch.update',
  path: '/open-apis/im/v2/app_feed_card/batch',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Feed-Apps-Update app feed card-This interface is used to update the avatar, title, preview, label status, button and other information of the information flow card',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        feed_cards: z
          .array(
            z.object({
              app_feed_card: z
                .object({
                  biz_id: z
                    .string()
                    .describe(
                      'business id (Optional field developers can customize the business ID for easier data management. If not provided, the API response will return a system-assigned business ID.)',
                    )
                    .optional(),
                  title: z
                    .string()
                    .describe(
                      'title (Displays a maximum of one line in the user interface, automatically truncating any overflow content; font size and color customization are not supported.)',
                    )
                    .optional(),
                  avatar_key: z.string().describe('avatar key').optional(),
                  preview: z
                    .string()
                    .describe(
                      'preview text (Displays a maximum of one line in the user interface, automatically truncating any overflow content; supports concatenation of multiple fields, special characters, and emojis; font size and color customization are not supported.)',
                    )
                    .optional(),
                  status_label: z
                    .object({
                      text: z.string().describe('label text'),
                      type: z
                        .enum(['primary', 'secondary', 'success', 'danger'])
                        .describe(
                          'label type Options:primary(primary),secondary(secondary),success(success),danger(Danger)',
                        ),
                    })
                    .describe(
                      "status label (Optional field; if this field is not selected, the default display will show the card's reach time.)",
                    )
                    .optional(),
                  buttons: z
                    .object({
                      buttons: z
                        .array(
                          z.object({
                            multi_url: z
                              .object({
                                url: z.string().describe('url').optional(),
                                android_url: z.string().describe('Android url').optional(),
                                ios_url: z.string().describe('iOS url').optional(),
                                pc_url: z.string().describe('PC url').optional(),
                              })
                              .describe('url (support https only)')
                              .optional(),
                            action_type: z
                              .enum(['url_page', 'webhook'])
                              .describe(
                                'action type (The button interaction method can be configured to redirect to a URL page or set up a webhook callback.) Options:url_page(URLPage url page),webhook(webhook)',
                              ),
                            text: z.object({ text: z.string().describe('text') }).describe('text'),
                            button_type: z
                              .enum(['default', 'primary', 'success'])
                              .describe('button type Options:default(default),primary(primary),success(success)')
                              .optional(),
                            action_map: z.object({}).catchall(z.any()).describe('action map').optional(),
                          }),
                        )
                        .describe('button'),
                    })
                    .describe(
                      'buttons (Optional field; if this field is not provided, the button will not be displayed; a maximum of 2 buttons can be shown.)',
                    )
                    .optional(),
                  link: z
                    .object({ link: z.string().describe('link (support https only)').optional() })
                    .describe('card redirect link (This parameter is required when creating)')
                    .optional(),
                  time_sensitive: z
                    .boolean()
                    .describe(
                      'Instant reminder state (Setting to true will temporarily pin the card at the top of the message list; setting to false will not pin the message card.)',
                    )
                    .optional(),
                  notify: z
                    .object({
                      close_notify: z.boolean().describe('without notify').optional(),
                      custom_sound_text: z
                        .string()
                        .describe('Customized sound notification text content (Only supports mobile devices)')
                        .optional(),
                      with_custom_sound: z
                        .boolean()
                        .describe(
                          'Whether to play custom sound (Only supports mobile devices; currently do not support switching voice packages and only support a female voice by default.)',
                        )
                        .optional(),
                    })
                    .describe('notify')
                    .optional(),
                })
                .describe('app feed card'),
              user_id: z
                .string()
                .describe(
                  'User ID (The ID type is consistent with the values of user_id_type. If it is a store application, user IDs of type user_id cannot be used as the permission to obtain user IDs is not supported.)',
                ),
              update_fields: z
                .array(
                  z
                    .enum(['1', '2', '3', '10', '11', '12', '13', '101', '102', '103'])
                    .describe(
                      'Options:1(TITLE),2(AVATAR_KEY avatar key),3(PREVIEW),10(STATUS_LABEL status label),11(BUTTONS),12(LINK),13(TIME_SENSITIVE time sensitive),101(DISPLAY_TIME_TO_CURRENT update display time to current),102(RERANK_TO_CURRENT update rank time to current),103(WITH_NOTIFY notify setting)',
                    ),
                )
                .describe('update fields'),
            }),
          )
          .describe('feed cards')
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const imV2AppFeedCardCreate = {
  project: 'im',
  name: 'im.v2.appFeedCard.create',
  sdkName: 'im.v2.appFeedCard.create',
  path: '/open-apis/im/v2/app_feed_card',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Feed-Apps-Create app feed card-The app feed card is a tool that allows applications to directly send messages within the feed list, ensuring that important messages reach users more quickly',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        app_feed_card: z
          .object({
            biz_id: z
              .string()
              .describe(
                'business id (Optional field developers can customize the business ID for easier data management. If not provided, the API response will return a system-assigned business ID.)',
              )
              .optional(),
            title: z
              .string()
              .describe(
                'title (Displays a maximum of one line in the user interface, automatically truncating any overflow content; font size and color customization are not supported.)',
              )
              .optional(),
            avatar_key: z.string().describe('avatar key').optional(),
            preview: z
              .string()
              .describe(
                'preview text (Displays a maximum of one line in the user interface, automatically truncating any overflow content; supports concatenation of multiple fields, special characters, and emojis; font size and color customization are not supported.)',
              )
              .optional(),
            status_label: z
              .object({
                text: z.string().describe('text'),
                type: z
                  .enum(['primary', 'secondary', 'success', 'danger'])
                  .describe('label type Options:primary(primary),secondary(secondary),success(success),danger(Danger)'),
              })
              .describe(
                "status label (Optional field; if this field is not selected, the default display will show the card's reach time.)",
              )
              .optional(),
            buttons: z
              .object({
                buttons: z
                  .array(
                    z.object({
                      multi_url: z
                        .object({
                          url: z.string().describe('url').optional(),
                          android_url: z.string().describe('Android url').optional(),
                          ios_url: z.string().describe('iOS url').optional(),
                          pc_url: z.string().describe('PC url').optional(),
                        })
                        .describe('url (support https only)')
                        .optional(),
                      action_type: z
                        .enum(['url_page', 'webhook'])
                        .describe(
                          'action type (The button interaction method can be configured to redirect to a URL page or set up a webhook callback.) Options:url_page(URLPage url page),webhook(webhook)',
                        ),
                      text: z.object({ text: z.string().describe('text') }).describe('text'),
                      button_type: z
                        .enum(['default', 'primary', 'success'])
                        .describe('button type Options:default(default),primary(primary),success(success)')
                        .optional(),
                      action_map: z.object({}).catchall(z.any()).describe('action map').optional(),
                    }),
                  )
                  .describe('button'),
              })
              .describe(
                'button (Optional field; if this field is not provided, the button will not be displayed; a maximum of 2 buttons can be shown.)',
              )
              .optional(),
            link: z
              .object({
                link: z
                  .string()
                  .describe(
                    'link **Note**: Only HTTPS protocol is supported, as well as Applink for web app or gadget (appid will be verified for correctness)',
                  )
                  .optional(),
              })
              .describe('card redirect link (This parameter is required when creating)')
              .optional(),
            time_sensitive: z
              .boolean()
              .describe(
                'Instant reminder state (Setting to true will temporarily pin the card at the top of the message list; setting to false will not pin the message card.)',
              )
              .optional(),
            notify: z
              .object({
                close_notify: z.boolean().describe('without notify').optional(),
                custom_sound_text: z
                  .string()
                  .describe('Customized sound notification text content (Only supports mobile devices)')
                  .optional(),
                with_custom_sound: z
                  .boolean()
                  .describe(
                    'Whether to play custom sound (Only supports mobile devices; currently do not support switching voice packages and only support a female voice by default.)',
                  )
                  .optional(),
              })
              .describe('notify')
              .optional(),
          })
          .describe('app feed card')
          .optional(),
        user_ids: z
          .array(z.string())
          .describe(
            'List of user IDs, support open_id, union_id, user_id. (The ID type is consistent with the values of user_id_type. If it is a store application, user IDs of type user_id cannot be used as the permission to obtain user IDs is not supported.)',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const imV2BizEntityTagRelationCreate = {
  project: 'im',
  name: 'im.v2.bizEntityTagRelation.create',
  sdkName: 'im.v2.bizEntityTagRelation.create',
  path: '/open-apis/im/v2/biz_entity_tag_relation',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Organization Custom Group Label-Bind tags with business entities-Bind tags with biz entity. Currently, tagging for chat is supported',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      tag_biz_type: z.literal('chat').describe('Business type Options:chat(Chat type)'),
      biz_entity_id: z.string().describe('Business entity open ID'),
      tag_ids: z.array(z.string()).describe('Tag ID').optional(),
    }),
  },
};
export const imV2BizEntityTagRelationGet = {
  project: 'im',
  name: 'im.v2.bizEntityTagRelation.get',
  sdkName: 'im.v2.bizEntityTagRelation.get',
  path: '/open-apis/im/v2/biz_entity_tag_relation',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Organization Custom Group Label-queryTagsBindOnEntity-query tags bind on entity',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      tag_biz_type: z.literal('chat').describe('Options:chat(Business type)'),
      biz_entity_id: z.string(),
    }),
  },
};
export const imV2BizEntityTagRelationUpdate = {
  project: 'im',
  name: 'im.v2.bizEntityTagRelation.update',
  sdkName: 'im.v2.bizEntityTagRelation.update',
  path: '/open-apis/im/v2/biz_entity_tag_relation',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Organization Custom Group Label-Unbind tags from a business entity-Unbind tags from biz entity',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      tag_biz_type: z.literal('chat').describe('Business type Options:chat(chat bizType)'),
      biz_entity_id: z.string().describe('Business entity open ID'),
      tag_ids: z.array(z.string()).describe('Tag ID').optional(),
    }),
  },
};
export const imV2ChatButtonUpdate = {
  project: 'im',
  name: 'im.v2.chatButton.update',
  sdkName: 'im.v2.chatButton.update',
  path: '/open-apis/im/v2/chat_button',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Feed-Groups & Bots-Update feed card button-You can add shortcut operation buttons, update buttons, or delete buttons to Groups & Bots feed card',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_ids: z
        .array(z.string())
        .describe(
          'List of user IDs (The ID type is consistent with the values of user_id_type. If it is a store application, user IDs of type user_id cannot be used as the permission to obtain user IDs is not supported.)',
        )
        .optional(),
      chat_id: z.string().describe('Chat id'),
      buttons: z
        .object({
          buttons: z
            .array(
              z.object({
                multi_url: z
                  .object({
                    url: z.string().describe('url').optional(),
                    android_url: z.string().describe('Android url').optional(),
                    ios_url: z.string().describe('iOS url').optional(),
                    pc_url: z.string().describe('PC url').optional(),
                  })
                  .describe('url (support https only)')
                  .optional(),
                action_type: z
                  .enum(['url_page', 'webhook'])
                  .describe(
                    'action type (The button interaction method can be configured to redirect to a URL page or set up a webhook callback.) Options:url_page(URLPage url page),webhook(webhook)',
                  ),
                text: z.object({ text: z.string().describe('text') }).describe('text'),
                button_type: z
                  .enum(['default', 'primary', 'success'])
                  .describe('button type Options:default(default),primary(primary),success(success)')
                  .optional(),
                action_map: z.object({}).catchall(z.any()).describe('action map').optional(),
              }),
            )
            .describe(
              'buttons, this field is a full update field, if the original value of the field is not passed in, the field data will be cleared. For example:- While maintaining the field configuration of the original button, adding a new button configuration will add a button.- If you update the field configuration of the original button, the button will be updated.- Clearing the field configuration of the original button will delete the button',
            ),
        })
        .describe(
          'button (Optional field; if this field is not provided, the button will not be displayed; a maximum of 2 buttons can be shown.)',
        )
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const imV2FeedCardBotTimeSentive = {
  project: 'im',
  name: 'im.v2.feedCard.botTimeSentive',
  sdkName: 'im.v2.feedCard.botTimeSentive',
  path: '/open-apis/im/v2/feed_cards/bot_time_sentive',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feed-Groups & Bots-Bot chat instant reminder-users can use the bot chat instant reminder capability to display robot conversations at the top of the message list. Open Feishu. Tackle important tasks right from the first page of the book',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      time_sensitive: z
        .boolean()
        .describe(
          'Instant reminder state (Setting to true will temporarily pin the card at the top of the message list; setting to false will not pin the message card.)',
        ),
      user_ids: z
        .array(z.string())
        .describe(
          'List of user IDs, support open_id, union_id, user_id. (The ID type is consistent with the values of user_id_type. If it is a store application, user IDs of type user_id cannot be used as the permission to obtain user IDs is not supported.)',
        ),
    }),
    params: z.object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type') }),
  },
};
export const imV2FeedCardPatch = {
  project: 'im',
  name: 'im.v2.feedCard.patch',
  sdkName: 'im.v2.feedCard.patch',
  path: '/open-apis/im/v2/feed_cards/:feed_card_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Feed-Groups & Bots-Instant reminder-The instant reminder capability is a strong reminder capability provided by Feishu in the message list. When there are important notifications or tasks that need to be reached in time, users can use the instant reminder capability to display group or robot conversations at the top of the message list. Open Feishu. Tackle important tasks right from the first page of the book',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      time_sensitive: z
        .boolean()
        .describe(
          'Instant reminder state (Setting to true will temporarily pin the card at the top of the message list; setting to false will not pin the message card.)',
        ),
      user_ids: z
        .array(z.string())
        .describe(
          'List of user IDs, support open_id, union_id, user_id. (The ID type is consistent with the values of user_id_type. If it is a store application, user IDs of type user_id cannot be used as the permission to obtain user IDs is not supported.)',
        ),
    }),
    params: z.object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type') }),
    path: z.object({ feed_card_id: z.string().describe('Feed card id (Currently, only group chats are supported.)') }),
  },
};
export const imV2TagCreate = {
  project: 'im',
  name: 'im.v2.tag.create',
  sdkName: 'im.v2.tag.create',
  path: '/open-apis/im/v2/tags',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Organization Custom Group Label-Create a tag-Create a tag. The tag ID will be returned',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      create_tag: z
        .object({
          tag_type: z.literal('tenant').describe('Type of the tag Options:tenant(Tenant type)'),
          name: z.string().describe('Name of the tag'),
          i18n_names: z
            .array(z.object({ locale: z.string().describe('Language'), name: z.string().describe('Name').optional() }))
            .describe("Tag's name in different languages")
            .optional(),
        })
        .describe('Create a tag'),
    }),
  },
};
export const imV2TagPatch = {
  project: 'im',
  name: 'im.v2.tag.patch',
  sdkName: 'im.v2.tag.patch',
  path: '/open-apis/im/v2/tags/:tag_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Organization Custom Group Label-Update a tag-Modify the name of the tag in different languages',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        patch_tag: z
          .object({
            id: z.string().describe('Tag ID').optional(),
            name: z.string().describe('Tag name').optional(),
            i18n_names: z
              .array(
                z.object({ locale: z.string().describe('Language'), name: z.string().describe('Name').optional() }),
              )
              .describe('Tag name in various languages')
              .optional(),
          })
          .describe('Patch a tag')
          .optional(),
      })
      .optional(),
    path: z.object({ tag_id: z.string() }),
  },
};
export const imV2UrlPreviewBatchUpdate = {
  project: 'im',
  name: 'im.v2.urlPreview.batchUpdate',
  sdkName: 'im.v2.urlPreview.batchUpdate',
  path: '/open-apis/im/v2/url_previews/batch_update',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Messaging-URL preview-Update URL preview-Actively update the [URL preview]. After the call, the client pull will be triggered again, and the callback service needs to return the updated data',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      preview_tokens: z
        .array(z.string())
        .describe(
          'List of preview_tokens for URL preview. You need to get preview_tokens through the [pull link preview data] callback.**Notice**: The update frequency of a single token is limited to 1 time/5 seconds',
        ),
      open_ids: z
        .array(z.string())
        .describe(
          'The open_id of the user who needs to update the URL preview. If not passed, it defaults to updating the members of the chat where the URL preview is located; if the user is not in the chat where the URL is located, the URL preview result seen by the user cannot be updated. For details on how to obtain an Open ID, see [How to obtain an Open ID]',
        )
        .optional(),
    }),
  },
};
export const imV2Tools = [
  imV2AppFeedCardBatchDelete,
  imV2AppFeedCardBatchUpdate,
  imV2AppFeedCardCreate,
  imV2BizEntityTagRelationCreate,
  imV2BizEntityTagRelationGet,
  imV2BizEntityTagRelationUpdate,
  imV2ChatButtonUpdate,
  imV2FeedCardBotTimeSentive,
  imV2FeedCardPatch,
  imV2TagCreate,
  imV2TagPatch,
  imV2UrlPreviewBatchUpdate,
];
