import { z } from 'zod';
export type calendarV4ToolName =
  | 'calendar.v4.calendarAcl.create'
  | 'calendar.v4.calendarAcl.delete'
  | 'calendar.v4.calendarAcl.list'
  | 'calendar.v4.calendarAcl.subscription'
  | 'calendar.v4.calendarAcl.unsubscription'
  | 'calendar.v4.calendar.create'
  | 'calendar.v4.calendar.delete'
  | 'calendar.v4.calendarEventAttendee.batchDelete'
  | 'calendar.v4.calendarEventAttendeeChatMember.list'
  | 'calendar.v4.calendarEventAttendee.create'
  | 'calendar.v4.calendarEventAttendee.list'
  | 'calendar.v4.calendarEvent.create'
  | 'calendar.v4.calendarEvent.delete'
  | 'calendar.v4.calendarEvent.get'
  | 'calendar.v4.calendarEvent.instanceView'
  | 'calendar.v4.calendarEvent.instances'
  | 'calendar.v4.calendarEvent.list'
  | 'calendar.v4.calendarEventMeetingChat.create'
  | 'calendar.v4.calendarEventMeetingChat.delete'
  | 'calendar.v4.calendarEventMeetingMinute.create'
  | 'calendar.v4.calendarEvent.patch'
  | 'calendar.v4.calendarEvent.reply'
  | 'calendar.v4.calendarEvent.search'
  | 'calendar.v4.calendarEvent.subscription'
  | 'calendar.v4.calendarEvent.unsubscription'
  | 'calendar.v4.calendar.get'
  | 'calendar.v4.calendar.list'
  | 'calendar.v4.calendar.patch'
  | 'calendar.v4.calendar.primary'
  | 'calendar.v4.calendar.search'
  | 'calendar.v4.calendar.subscribe'
  | 'calendar.v4.calendar.subscription'
  | 'calendar.v4.calendar.unsubscribe'
  | 'calendar.v4.calendar.unsubscription'
  | 'calendar.v4.exchangeBinding.create'
  | 'calendar.v4.exchangeBinding.delete'
  | 'calendar.v4.exchangeBinding.get'
  | 'calendar.v4.freebusy.list'
  | 'calendar.v4.setting.generateCaldavConf'
  | 'calendar.v4.timeoffEvent.create'
  | 'calendar.v4.timeoffEvent.delete';
export const calendarV4CalendarAclCreate = {
  project: 'calendar',
  name: 'calendar.v4.calendarAcl.create',
  sdkName: 'calendar.v4.calendarAcl.create',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/acls',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Calendar access control-Create ACL-Call this interface to add access control to the specified calendar in your current identity (application or user), that is, calendar member permissions',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      role: z
        .enum(['unknown', 'free_busy_reader', 'reader', 'writer', 'owner'])
        .describe(
          'Access to the calendar. Options:unknown(Unkonwn Unknown permission. unknown is one of the enumerated values of the role parameter, but when role is used as a request parameter, it does not support the input of unknown.),free_busy_reader(FreeBusyReader Guest. A guest can only view availability information.),reader(Subscriber. A subscriber can view all event details.),writer(Editor. An editor can create and modify events.),owner(Administrator. An administrator can manage calendars and share settings.)',
        ),
      scope: z
        .object({
          type: z
            .literal('user')
            .describe(
              "The type of the scope where the permission takes effect.**Note**: Currently, only user is supported. When `type=user`, the user_id needs to be consistent with the type of user_id_type. For example, when `user_id_type=open_id`, the user_id needs to be the user's open_id. Options:user(User)",
            ),
          user_id: z
            .string()
            .describe('User ID, for more information, you can refer to the [Concept of User-Related ID]')
            .optional(),
        })
        .describe("The scope of the permission's effectiveness"),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'The calendar ID for which access control needs to be added.The calendar ID is returned when a shared calendar is created. You can also call the following interfaces to obtain the ID of a calendar.- [Query primary calendar information]- [Query calendar list]- [Search calendars]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarAclDelete = {
  project: 'calendar',
  name: 'calendar.v4.calendarAcl.delete',
  sdkName: 'calendar.v4.calendarAcl.delete',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/acls/:acl_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Calendar-Calendar access control-Delete ACL-Call this interface to delete a certain access control in the specified calendar with the current identity (application or user), i.e., member permissions',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'The ID of the calendar for which access control needs to be deleted is required.The calendar ID is returned when a shared calendar is created. You can also call the following interfaces to obtain the ID of a calendar.- [Query primary calendar information]- [Query calendar list]- [Search calendars]',
        ),
      acl_id: z
        .string()
        .describe(
          'Access control ID.The access control ID is returned when access control is created for the calendar. You can also call the [get access control list] interface to get the access control information within the specified calendar',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarAclList = {
  project: 'calendar',
  name: 'calendar.v4.calendarAcl.list',
  sdkName: 'calendar.v4.calendarAcl.list',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/acls',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Calendar-Calendar access control-Obtain the ACL-Call this interface to get the access control list of the specified calendar as the current identity (application or user)',
  accessTokens: ['tenant', 'user'],
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
        page_size: z
          .number()
          .describe(
            'Page size, that is, the maximum number of items returned by one request.**Note**: The minimum value is 10, that is, when the value is less than 10, it is uniformly processed as 10',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'Calendar ID.The calendar ID is returned when creating a shared calendar. You can also call the following interfaces to obtain the ID of a calendar.- [Query Primary Calendar Information]- [Query Calendar List]- [Search Calendar]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarAclSubscription = {
  project: 'calendar',
  name: 'calendar.v4.calendarAcl.subscription',
  sdkName: 'calendar.v4.calendarAcl.subscription',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/acls/subscription',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Calendar access control-Subscribe ACL Event-Call this interface in the identity of the user to subscribe to access control change events under the specified calendar',
  accessTokens: ['user'],
  schema: {
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'Calendar ID. The calendar ID is returned when a shared calendar is created. You can also call the following interfaces to obtain the ID of a calendar.- [Query primary calendar information]- [Query calendar list]- [Search calendars]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarAclUnsubscription = {
  project: 'calendar',
  name: 'calendar.v4.calendarAcl.unsubscription',
  sdkName: 'calendar.v4.calendarAcl.unsubscription',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/acls/unsubscription',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Calendar-Calendar access control-Unsubscribe ACL Event-Invoke this interface in the user's identity to unsubscribe from access control change events under the specified calendar",
  accessTokens: ['user'],
  schema: {
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'Calendar ID. The calendar ID is returned when a shared calendar is created. You can also call the following interfaces to obtain the ID of a calendar.- [Query primary calendar information]- [Query calendar list]- [Search calendars]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarCreate = {
  project: 'calendar',
  name: 'calendar.v4.calendar.create',
  sdkName: 'calendar.v4.calendar.create',
  path: '/open-apis/calendar/v4/calendars',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Calendar management-Create a shared calendar-Call this interface to create a shared calendar for the current identity (app or user)',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        summary: z.string().describe('Calendar title.**Default value**: Empty').optional(),
        description: z.string().describe('Calendar description.**Default value**: Empty').optional(),
        permissions: z
          .enum(['private', 'show_only_free_busy', 'public'])
          .describe(
            'Calendar visibility range.**Default value**: show_only_free_busy Options:private(Private.),show_only_free_busy(ShowOnlyFreeBusy Only availability information is displayed.),public(Public. Event details are visible to other people.)',
          )
          .optional(),
        color: z
          .number()
          .describe(
            'Calendar color, the value is represented by the int32 of the RGB color value, where, 24 ~ 31 bits are transparency, 16 ~ 23 bits are red, 8 ~ 15 bits are green, 0 ~ 7 bits are blue. For example, -11034625 represents the RGB value (87, 159, 255).**Note**:- The value range is -2^31 ~ 2^31-1- The color of the calendar will be mapped to the closest color on the Feishu client palette for display.- This color only applies to the current identity.**Default value**: -14513409',
          )
          .optional(),
        summary_alias: z
          .string()
          .describe(
            'Calendar alias, setting this field (including subsequent modification of this field) only takes effect for the current identity.**Default value**: Empty',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarDelete = {
  project: 'calendar',
  name: 'calendar.v4.calendar.delete',
  sdkName: 'calendar.v4.calendar.delete',
  path: '/open-apis/calendar/v4/calendars/:calendar_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Calendar-Calendar management-Delete shared calendar-Call this interface to delete a specified shared calendar under the current identity (application or user)',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'Calendar ID.When creating a shared calendar, the calendar ID will be returned. You can also call the following interfaces to get the ID of a calendar.- [Query Primary Calendar Information]- [Query Calendar List]- [Search Calendars]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventAttendeeBatchDelete = {
  project: 'calendar',
  name: 'calendar.v4.calendarEventAttendee.batchDelete',
  sdkName: 'calendar.v4.calendarEventAttendee.batchDelete',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees/batch_delete',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Event attendee (Including meeting room)-Delete event invitees-Call this interface to delete one or more invitees of the specified event with the current identity (app or user)',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        attendee_ids: z
          .array(z.string())
          .describe(
            'List of invitee IDs that need to be deleted.When adding a event invitee, the invitee ID (attendee_id) will be returned. You can also call [Get event invitee list] Interface to query the invitee ID of the specified event.- Up to 500 attendees can be deleted at a time (counted together with delete_ids)',
          )
          .optional(),
        delete_ids: z
          .array(
            z.object({
              type: z
                .enum(['user', 'chat', 'resource', 'third_party'])
                .describe('Invitee type. Options:user(User),chat(Group),resource(Room),third_party(ThirdParty Email)')
                .optional(),
              user_id: z
                .string()
                .describe(
                  "Event invitee's user ID, which depends on the returned user_id_type parameter. When is_external is true, this field returns the open_id or union_id. For more information, see [User-related IDs]",
                )
                .optional(),
              chat_id: z
                .string()
                .describe('The group chat_id of a chat-type event invitee. For details, see [Group ID description]')
                .optional(),
              room_id: z.string().describe('The room_id of a resource-type event invitee').optional(),
              third_party_email: z.string().describe('Email of a third_party type event invitee').optional(),
            }),
          )
          .describe(
            'The ID corresponding to the invitee type, which is a supplementary field to the attendee_ids field.- Up to 500 attendees can be deleted at a time (counted together with attendee_ids)',
          )
          .optional(),
        need_notification: z
          .boolean()
          .describe(
            'Whether to send Bot notifications to invitees when deleting event invitees.**Optional values are**:- true (default): send- false: do not send',
          )
          .optional(),
        instance_start_time_admin: z
          .string()
          .describe(
            'When accessing as an administrator, the instance to be modified (only used to modify one instance of a recurring event, this field does not need to be filled in for non-recurring events)',
          )
          .optional(),
        is_enable_admin: z
          .boolean()
          .describe(
            'Whether to enable the meeting room administrator identity (you need to set someone as the meeting room administrator in the management background first).**Optional values are**:- true: enable- false (default): disable',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      calendar_id: z.string().describe('Calendar ID. For details, see [Calendar-related IDs]'),
      event_id: z
        .string()
        .describe(
          'Event ID.The event ID is returned when creating a event. You can also call the following interface to obtain the ID of a certain calendar.- [Get event list]- [Search event]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventAttendeeChatMemberList = {
  project: 'calendar',
  name: 'calendar.v4.calendarEventAttendeeChatMember.list',
  sdkName: 'calendar.v4.calendarEventAttendeeChatMember.list',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees/:attendee_id/chat_members',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Calendar-Event attendee (Including meeting room)-Obtain the list of members of group invitees of an event-Call this interface with the current identity (app or user) to get the group member list of the group type invitees in the event',
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
        page_size: z.number().describe('The maximum number of group members returned in one request').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({
      calendar_id: z.string().describe('Calendar ID. For details, see [Calendar-related IDs]'),
      event_id: z
        .string()
        .describe(
          'Event ID.The event ID is returned when creating a event. You can also call the following interface to obtain the ID of a certain calendar.- [Get event list]- [Search event]',
        ),
      attendee_id: z
        .string()
        .describe(
          'Group type invitee ID.When adding a event invitee, the invitee ID (attendee_id) will be returned. You can also call [Get event invitee list] Interface to query the invitee ID of the specified event',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventAttendeeCreate = {
  project: 'calendar',
  name: 'calendar.v4.calendarEventAttendee.create',
  sdkName: 'calendar.v4.calendarEventAttendee.create',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Event attendee (Including meeting room)-Create event invitees-Use this interface to add one or more invitees to a specified event with the current identity (app or user). Invitee types include users, groups, meeting rooms, and emails',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        attendees: z
          .array(
            z.object({
              type: z
                .enum(['user', 'chat', 'resource', 'third_party'])
                .describe(
                  'Event invitee type Options:user(User),chat(Group),resource(Room),third_party(ThirdParty Email)',
                )
                .optional(),
              is_optional: z
                .boolean()
                .describe(
                  'Whether the invitee is optional.**Optional values are**:- true- false**Note**: This field cannot be edited for room type invitees',
                )
                .optional(),
              user_id: z
                .string()
                .describe(
                  'User ID. When selecting a user type invitee (the value of type is user), this parameter needs to be passed in. The user ID type passed in needs to be consistent with the value of user_id_type. For information about user IDs, see [User-related ID concepts]',
                )
                .optional(),
              chat_id: z
                .string()
                .describe(
                  'Group ID. When selecting group type invitees (type value is chat), this parameter needs to be passed in. For details about group ID, please refer to [Group ID Description]',
                )
                .optional(),
              room_id: z
                .string()
                .describe(
                  'Meeting room ID. When selecting meeting room type invitees (type value is resource), this parameter needs to be passed in.You can obtain the specified meeting room ID through the following interface:- [Query meeting room list]- [Search meeting room]',
                )
                .optional(),
              third_party_email: z
                .string()
                .describe(
                  'Email address. When selecting an external mailbox type invitee (type value is third_party), this parameter needs to be passed in',
                )
                .optional(),
              operate_id: z
                .string()
                .describe(
                  'Meeting room contact ID. The user ID type passed in needs to be consistent with the value of user_id_type. For information about user IDs, see [User-related ID concepts].**Note**: If the current schedule is created based on the application identity, when adding a meeting room type invitee, you need to specify the contact person of the meeting room through this parameter, and the contact will be displayed in the schedule meeting room information.**Default**: empty',
                )
                .optional(),
              resource_customization: z
                .array(
                  z.object({
                    index_key: z.string().describe('Unique ID of each configuration'),
                    input_content: z
                      .string()
                      .describe('This parameter is required when the type field is left empty')
                      .optional(),
                    options: z
                      .array(
                        z.object({
                          option_key: z.string().describe('Unique ID of each option').optional(),
                          others_content: z
                            .string()
                            .describe('This parameter is required when the type field is set to other options')
                            .optional(),
                        }),
                      )
                      .describe('Options of each configuration')
                      .optional(),
                  }),
                )
                .describe(
                  'Personalized configuration of meeting rooms.- When selecting meeting room type invitees, if the meeting room has a reservation form, you can configure the form information through this parameter.- When the currently added invitee does not involve the personalized configuration of the meeting room, there is no need to set this parameter',
                )
                .optional(),
              approval_reason: z
                .string()
                .describe(
                  'The reason for requesting reservation approval for the meeting room. Parameter configuration description:- This field takes effect only when booking an approved meeting room using user identity (user_access_token).- For the scenario of applying for reservation and approval of a meeting room, if this value is not passed, the reservation will directly fail.- If you use the application identity (tenant_access_token) to reserve an approval meeting room, it will directly fail.**Default**: empty',
                )
                .optional(),
            }),
          )
          .describe(
            'Add a new invitee list.**Notice**:- The maximum number of invitees (including meeting rooms) that can be set in a single request is 1,000.- The maximum number of meeting rooms that can be set up in a single request is 100',
          )
          .optional(),
        need_notification: z
          .boolean()
          .describe(
            'Whether to send bot notifications to invitees.**Optional values are**:- true (default): send- false: do not send',
          )
          .optional(),
        instance_start_time_admin: z
          .string()
          .describe(
            'The instance to be modified when accessing as an administrator.**Note**:- This parameter is only used to modify a event instance in a repeating event. This field does not need to be filled in for non-repeating events.- You can call the [Get repeating event instance] interface to obtain the event_id of a event instance in the repeating event. The value of this parameter is the timestamp suffix of event_id. For example, the queried event instance ID is `2cf525f0-1e67-4b04-ad4d-30b7f003903c_1713168000`, then the current `instance_start_time_admin` value is `1713168000`.**Default**: empty',
          )
          .optional(),
        is_enable_admin: z
          .boolean()
          .describe(
            'Whether to enable the meeting room administrator status (you need to set a member as the meeting room administrator in the management background first).**Optional values are**:- true: enable- false (default): disable**Note**: After it is turned on, this request will only process meeting room data, and the operations of other invitees will not take effect',
          )
          .optional(),
        add_operator_to_attendee: z
          .boolean()
          .describe(
            'Whether to add the meeting room contact (operate_id) to the schedule invitees.**Optional values are**:- true (default): enabled- false: disable',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      calendar_id: z
        .string()
        .describe('The calendar ID corresponding to the event. To learn more, see [Calendar ID Introduction]'),
      event_id: z
        .string()
        .describe(
          'Event ID.The event ID is returned when creating a event. You can also call the following interface to obtain the ID of a certain calendar.- [Get event list]- [Search event]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventAttendeeList = {
  project: 'calendar',
  name: 'calendar.v4.calendarEventAttendee.list',
  sdkName: 'calendar.v4.calendarEventAttendee.list',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/attendees',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Calendar-Event attendee (Including meeting room)-Obtain event invitee list-Call this interface to retrieve the list of invitees for a event with the current identity (app or user)',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        need_resource_customization: z
          .boolean()
          .describe(
            'Whether meeting room form information is required.**Optional values are**:- true: required- false (default): not required**Note**: The current identity needs to have the editing rights of the event to return the meeting room form information, that is, the current identity needs to be the organizer of the event, or a invitee of the event and the event is set to **Invitees can edit the event** permissions. You can call the [Get event] interface to obtain the invitee permissions (attendee_ability) of the event',
          )
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z
          .number()
          .describe(
            'The maximum number of event invitees returned in one request. The minimum value is 10. If a value less than 10 is passed in, it will default to 10',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      calendar_id: z.string().describe('Calendar ID. For details, see [Calendar-related IDs]'),
      event_id: z
        .string()
        .describe(
          'Evnet ID.The evnet ID is returned when creating a evnet. You can also call the following interface to obtain the ID of a certain calendar.- [Get evnet list]- [Search evnet]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventCreate = {
  project: 'calendar',
  name: 'calendar.v4.calendarEvent.create',
  sdkName: 'calendar.v4.calendarEvent.create',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Event management-Create event-Call this interface to create a event on the specified calendar with the current identity (application or user)',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      summary: z.string().describe('Event title').optional(),
      description: z
        .string()
        .describe(
          'Event description. Supports parsing HTML tags.**Note**: While HTML tags can be used to achieve some rich text formatting, the rich text formatting generated by the client is not implemented using HTML tags. If you update the description through the API after generating rich text formatting on the client side, it may result in the loss of the original rich text formatting applied by the client',
        )
        .optional(),
      need_notification: z
        .boolean()
        .describe(
          'Whether to send Bot notifications to event participants when updating the event.**Optional values are**:- true: send notification- false: Do not send notifications**Default value**: true',
        )
        .optional(),
      start_time: z
        .object({
          date: z
            .string()
            .describe(
              'Start time, only use this field for all-day events, [RFC 3339] format, for example, 2018-09-01.**Note**: This parameter cannot be specified at the same time as `timestamp`',
            )
            .optional(),
          timestamp: z
            .string()
            .describe(
              'Second-level timestamp, used to set a specific start time. For example, 1602504000 means 2020/10/12 20:00:00 (UTC +8 time zone).**Note**: This parameter cannot be specified at the same time as `date`',
            )
            .optional(),
          timezone: z
            .string()
            .describe(
              'Time zone. Use IANA Time Zone Database standards such as Asia/Shanghai.- The all-day event time zone is fixed to UTC +0- The default time zone for non-all-day events is Asia/Shanghai',
            )
            .optional(),
        })
        .describe('Event start time'),
      end_time: z
        .object({
          date: z
            .string()
            .describe(
              'End time, only use this field for all-day events, [RFC 3339] format, for example, 2018-09-01.**Note**: This parameter cannot be specified at the same time as `timestamp`',
            )
            .optional(),
          timestamp: z
            .string()
            .describe(
              'Second-level timestamp, used to set a specific end time. For example, 1602504000 means 2020/10/12 20:00:00 (UTC +8 time zone).**Note**: This parameter cannot be specified at the same time as `date`',
            )
            .optional(),
          timezone: z
            .string()
            .describe(
              'Time zone. Use IANA Time Zone Database standards such as Asia/Shanghai.- The all-day event time zone is fixed to UTC +0- The default time zone for non-all-day events is Asia/Shanghai',
            )
            .optional(),
        })
        .describe('Event end time'),
      vchat: z
        .object({
          vc_type: z
            .enum(['vc', 'third_party', 'no_meeting', 'lark_live', 'unknown'])
            .describe(
              'Video conferencing type. If video conferencing is not required, `no_meeting` must be passed.**Default value**: empty, which means the Feishu video conference URL will be automatically generated when a event participant is added for the first time. Options:vc(Feishu video conferencing. When this type is selected, other fields in vchat are invalid.),third_party(ThirdParty Third-party linked video conferencing. When this type is selected, only the icon_type, description, and meeting_url fields in vchat will take effect.),no_meeting(NoMeeting No video conferencing. When this type is selected, other fields in vchat are invalid.),lark_live(LarkLive Feishu Live. Read-only enumeration value, used only on the client side, not supported through API calls.),unknown(Unknown type. Read-only enumeration value, only used for client compatibility, does not support API calls.)',
            )
            .optional(),
          icon_type: z
            .enum(['vc', 'live', 'default'])
            .describe(
              'The icon type for third-party video conferencing.**Default**: default Options:vc(Feishu Video Conference icon.),live(Livestream video conference icon.),default(Default icon.)',
            )
            .optional(),
          description: z
            .string()
            .describe(
              'Third-party video conferencing copywriting.**Default value**: empty. If empty, the default copy will be displayed',
            )
            .optional(),
          meeting_url: z.string().describe('Video conference URL').optional(),
          meeting_settings: z
            .object({
              owner_id: z
                .string()
                .describe(
                  'Set the user ID of the conference owner, the ID type needs to be the same as user_id_type remains consistent.This parameter must meet all of the following conditions to take effect:- Apply identity (tenant_access_token) request and operate event on the application calendar.- The owner can only be set when the event is set to a VC meeting for the first time.- owner cannot be a non-user identity.- owner cannot be an external tenant user identity',
                )
                .optional(),
              join_meeting_permission: z
                .enum(['anyone_can_join', 'only_organization_employees', 'only_event_attendees'])
                .describe(
                  'Set the membership range.**Default**: anyone_can_join Options:anyone_can_join(AnyOne Any user can join the meeting),only_organization_employees(OnlySameOrganization Only users that from the same organization can join the meeting),only_event_attendees(OnlyEventAttendees Only event attendees can join the meeting)',
                )
                .optional(),
              assign_hosts: z
                .array(z.string())
                .describe(
                  'Specify the moderator by user ID, the ID type needs to be the same as user_id_type remains consistent.**Notice**:- Only event organizers can designate hosts.- Moderator cannot be a non-user.- The host cannot be an external tenant user identity.- When operating events on the app calendar, specifying a host is not allowed',
                )
                .optional(),
              auto_record: z
                .boolean()
                .describe(
                  'Whether to enable automatic recording.**Optional values are**:- true: enable- false (default value): disable',
                )
                .optional(),
              open_lobby: z
                .boolean()
                .describe(
                  'Whether to enable the waiting room.**Optional values are**:- true (default value): enabled- false: disable',
                )
                .optional(),
              allow_attendees_start: z
                .boolean()
                .describe(
                  'Whether to allow event participants to initiate meetings.**Optional values are**:- true (default): allow- false: not allowed**Note**: When operating event on the application calendar, this field must be true, otherwise no one can initiate a meeting',
                )
                .optional(),
            })
            .describe(
              'Pre-conference settings for video conference. The following conditions need to be met (all must be met):- It takes effect when vc_type is vc.- Requires edit permission for the event',
            )
            .optional(),
        })
        .describe('Video conference information')
        .optional(),
      visibility: z
        .enum(['default', 'public', 'private'])
        .describe(
          'Event visibility. The value is Default for new events by default. This is valid for all invitees only when an event is created. Any changes to the property are valid only for the current identity. Options:default(Default range, which depends on the calendar visibility. Only the availability status is visible to other people by default.),public(Public. Event details are displayed.),private(Private. Details are visible only to the current identity.)',
        )
        .optional(),
      attendee_ability: z
        .enum(['none', 'can_see_others', 'can_invite_others', 'can_modify_event'])
        .describe(
          "Event invitees' scopes.**Default**: none Options:none(Cannot edit events, cannot invite others, and cannot view event invitee list),can_see_others(CanSeeOthers Cannot edit events, cannot invite others, and can view event invitee list),can_invite_others(CanInviteOthers Cannot edit events, can invite others, and can view event invitee list),can_modify_event(CanModifyEvent Can edit events, can invite others, and can view event invitee list)",
        )
        .optional(),
      free_busy_status: z
        .enum(['busy', 'free'])
        .describe(
          'Event availability. The value is Busy for new events by default. This is valid for all invitees only when an event is created. Any changes to the property are valid only for the current identity. Options:busy(Busy),free(Free)',
        )
        .optional(),
      location: z
        .object({
          name: z.string().describe('Name of the location').optional(),
          address: z.string().describe('Address of the location').optional(),
          latitude: z
            .number()
            .describe(
              'Latitude coordinate of the location. Locations within China Mainland should comply with the GCJ-02 standard, and locations outside China Mainland should comply with the WGS84 standard',
            )
            .optional(),
          longitude: z
            .number()
            .describe(
              'Longitude coordinate of the location. Locations within China Mainland should comply with the GCJ-02 standard, and locations outside China Mainland should comply with the WGS84 standard',
            )
            .optional(),
        })
        .describe('Event location. If no value is passed, it will be empty by default')
        .optional(),
      color: z
        .number()
        .describe(
          'Event color, the value is represented by an int32 color RGB value.**Notice**:- This parameter only takes effect for the current identity.- When displayed on the client, it will be mapped to the closest color on the color palette.- When the value is 0 or -1, the calendar color will be followed by default',
        )
        .optional(),
      reminders: z
        .array(
          z.object({
            minutes: z
              .number()
              .describe(
                'Offset of the event reminder time. A positive value means the reminder is triggered X minutes before the event starts, and a negative value means the reminder is triggered X minutes after the event starts.This field is specified when an event is created or updated, and only valid for the current identity, not for other invitees in the event',
              )
              .optional(),
          }),
        )
        .describe('Event reminder list. If no value is passed, it defaults to empty')
        .optional(),
      recurrence: z
        .string()
        .describe(
          'Recurrence rule for recurring events. For details, see [RFC 5545].**Default value**: empty, indicating that the current event is not a repeating event.**Note**:- COUNT and UNTIL cannot coexist;- The length of a scheduled recurring event in a room cannot exceed two years',
        )
        .optional(),
      schemas: z
        .array(
          z.object({
            ui_name: z
              .string()
              .describe(
                'UI name. Valid values: - ForwardIcon: Event forwarding button - MeetingChatIcon: Meeting group chat button - MeetingMinutesIcon: Meeting minutes button - MeetingVideo: Video conference area - RSVP: Accept/decline/pending area - Attendee: Event invitees area - OrganizerOrCreator: Organizer/creator area',
              )
              .optional(),
            ui_status: z
              .enum(['hide', 'readonly', 'editable', 'unknown'])
              .describe(
                'Custom status of UI items. Only "hide" is supported. Options:hide(Hidden),readonly(Read-only),editable(Editable),unknown(Unknown UI item custom state. This parameter is only for read-time compatibility and does not support passing in as a request parameter value.)',
              )
              .optional(),
            app_link: z
              .string()
              .describe(
                'Link that is redirected to after the button is tapped/clicked.**Note**: The compatibility parameter is read-only, so passing in this request parameter is not supported yet',
              )
              .optional(),
          }),
        )
        .describe('Custom information of the event. This field controls the UI display on the event details page')
        .optional(),
      attachments: z
        .array(
          z.object({
            file_token: z
              .string()
              .describe(
                'Attachment token. Call the [Upload Material] interface to obtain the file_token of the attachment. When calling the upload material interface, please note:- `parent_type` needs to pass in a fixed value `calendar`.- `parent_node` needs to pass in a calendar ID that is consistent with the current interface.**Attachment verification rule**: The total size of the attachment does not exceed 25 MB',
              )
              .optional(),
          }),
        )
        .describe('Event attachment')
        .optional(),
      event_check_in: z
        .object({
          enable_check_in: z.boolean().describe('Whether to enable event check-in'),
          check_in_start_time: z
            .object({
              time_type: z
                .enum(['before_event_start', 'after_event_start', 'after_event_end'])
                .describe(
                  'Check-in time type, duration calculates the final time according to it. Options:before_event_start(BeforeEventStart Before the start of event),after_event_start(AfterEventStart After the start of event),after_event_end(AfterEventEnd After the end of event)',
                ),
              duration: z
                .number()
                .describe(
                  'The offset (in minutes) relative to the beginning or end of the event.- Currently, the value can only be one of the lists [0, 5, 15, 30, 60], where 0 indicates immediate start.- When time_type is before_event_start, duration cannot be set to 0',
                ),
            })
            .describe(
              'Event check-in start time.**Note**: The check-in start time cannot be greater than or equal to the check-in end time',
            )
            .optional(),
          check_in_end_time: z
            .object({
              time_type: z
                .enum(['before_event_start', 'after_event_start', 'after_event_end'])
                .describe(
                  'Check-in time type, duration calculates the final time according to it. Options:before_event_start(BeforeEventStart Before the start of event),after_event_start(AfterEventStart After the start of event),after_event_end(AfterEventEnd After the end of event)',
                ),
              duration: z
                .number()
                .describe(
                  'The offset (in minutes) relative to the beginning or end of the event.- Currently, the value can only be one of the lists [0, 5, 15, 30, 60], where 0 indicates immediate start.- When time_type is before_event_start, duration cannot be set to 0',
                ),
            })
            .describe(
              'Event check-in end time.**Note**: The check-in start time cannot be greater than or equal to the check-in end time',
            )
            .optional(),
          need_notify_attendees: z
            .boolean()
            .describe(
              'Whether a check-in notification is automatically sent to the participant at the start of the check-in',
            )
            .optional(),
        })
        .describe('Event check-in settings. If this parameter is empty, check-in Settings are not performed')
        .optional(),
    }),
    params: z
      .object({
        idempotency_key: z
          .string()
          .describe(
            'Create an idempotent key for the event. This key is unique under the application and calendar dimensions and is used to avoid repeated creation of resources. It is recommended to follow the format of the example value',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'Calendar ID.The calendar ID is returned when creating a shared calendar. You can also call the following interface to obtain the ID of a certain calendar.- [Query primary calendar information]- [Query calendar list]- [Search calendar]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventDelete = {
  project: 'calendar',
  name: 'calendar.v4.calendarEvent.delete',
  sdkName: 'calendar.v4.calendarEvent.delete',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Calendar-Event management-Delete Event-Call this interface to delete an event on the specified calendar with the current identity (application or user)',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        need_notification: z
          .enum(['true', 'false'])
          .describe(
            'Whether to send Bot notifications to event participants when deleting a event.**Default value**: true Options:true(Send),false(Do not send)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      calendar_id: z.string().describe('The calendar ID where the event is located. See [Calendar ID Description]'),
      event_id: z
        .string()
        .describe(
          'Event ID. How to get it:- [Create a event] will return the event ID- [Get a event list]- [Search for a event]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventGet = {
  project: 'calendar',
  name: 'calendar.v4.calendarEvent.get',
  sdkName: 'calendar.v4.calendarEvent.get',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Calendar-Event management-Get Event-Call this interface with the current identity (app or user) to obtain the event information within a specified calendar, including the title of the event, time period, video conference information, public scope, and invitee rights, etc',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        need_meeting_settings: z
          .boolean()
          .describe(
            'Do you need to return to the pre-meeting settings of Feishu Video Conferencing (VC)? The following conditions must be met to obtain the returned results:- The meeting type (vc_type) of the event needs to be vc.- Requires editing permissions for event.**Optional values are**:- true- false (default)',
          )
          .optional(),
        need_attendee: z
          .boolean()
          .describe('Do you need to return invitee information?**Optional values are**:- true- false (default)')
          .optional(),
        max_attendee_num: z
          .number()
          .describe(
            'The maximum number of invitees returned. Call [Get event invitee list] to get complete invitee information of the event',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'The calendar ID where the event is located. For information about calendar ID, please refer to [Calendar ID Description]',
        ),
      event_id: z
        .string()
        .describe(
          'Event ID.The event ID is returned when creating a event. You can also call the following interface to obtain the ID of a certain calendar.- [Get event list]- [Search event]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventInstanceView = {
  project: 'calendar',
  name: 'calendar.v4.calendarEvent.instanceView',
  sdkName: 'calendar.v4.calendarEvent.instanceView',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/instance_view',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Calendar-Event management-Query event view-Call this interface with user identity to query the event view under a specified calendar. Unlike [Getting event list], the current interface will expand into multiple event instances according to the repetitiveness rules of the recurring event, and return the corresponding event instance information according to the queried time interval',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      start_time: z
        .string()
        .describe(
          'Start time, Unix timestamp in seconds. This parameter and end_time are used to set the time range of the query.**Note**: The time interval between start_time and end_time needs to be less than 40 days',
        ),
      end_time: z
        .string()
        .describe(
          'End time, Unix timestamp in seconds. This parameter is used with start_time to set the time range of the query.**Note**: The time interval between start_time and end_time needs to be less than 40 days',
        ),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      calendar_id: z
        .string()
        .describe('Calendar ID. For information about calendar ID, please refer to [Calendar ID Description]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventInstances = {
  project: 'calendar',
  name: 'calendar.v4.calendarEvent.instances',
  sdkName: 'calendar.v4.calendarEvent.instances',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/instances',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Calendar-Event management-Get Event instances-Call this interface with the current identity (app or user) to obtain information about a specific recurring event in a specified calendar',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      start_time: z
        .string()
        .describe(
          'Start time, Unix timestamp in seconds. This parameter and end_time are used to set the time range, that is, the query interval for repeated events is (start_time, end_time)**Note**: The time interval between start_time and end_time cannot exceed 2 years',
        ),
      end_time: z
        .string()
        .describe(
          'End time, Unix timestamp in seconds. This parameter and start_time are used to set the time range, that is, the query interval for repeated events is (start_time, end_time)**Note**: The time interval between start_time and end_time cannot exceed 2 years',
        ),
      page_size: z.number().describe('The maximum number of events returned in one call').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
    path: z.object({
      calendar_id: z
        .string()
        .describe('Calendar ID. For information about calendar ID, please refer to [Calendar ID Description]'),
      event_id: z
        .string()
        .describe(
          'Event ID.The event ID is returned when creating a event. You can also call the following interface to obtain the ID of a certain calendar.- [Get event list]- [Search event]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventList = {
  project: 'calendar',
  name: 'calendar.v4.calendarEvent.list',
  sdkName: 'calendar.v4.calendarEvent.list',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Calendar-Event management-Get Event List-Call this interface with the current identity (app or user) to obtain the event list under a specified calendar',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_size: z
          .number()
          .describe(
            'The maximum number of entries to be returned for one request. The actual number of returned entries may be less than this value, or it may be empty, and you can determine if there are more entries based on the has_more field in the response body',
          )
          .optional(),
        anchor_time: z
          .string()
          .describe(
            'A time anchor represented by a Unix timestamp (in seconds). It is used to set a specific point in time for pulling events, thereby avoiding the need to pull all events. You can use page_token or sync_token for pagination or incremental retrieval of all events after the specified anchor_time.**Instructions**:- For single events, you will receive event information where **the end time of the event is >= anchor_time**.- For recurring events, after setting the anchor_time, all recurring events will be retrieved including those with past occurrences before the anchor_time.- For exceptional events, you will receive event information where **the original_time is >= anchor_time** as well as **the end time of the event is >= anchor_time**. The original_time is extracted from the exceptional event ID, which is structured as `{uid}_{original_time}`.**Notice**: It can not be used together with start_time and end_time.**Default**: empty',
          )
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        sync_token: z
          .string()
          .describe(
            'Incremental synchronization mark, not filled in for the first request. When the paging query ends (page_token return value is empty), the interface will return the sync_token field, and the sync_token can be used to incrementally obtain calendar change data in the next call.**Default**: empty',
          )
          .optional(),
        start_time: z
          .string()
          .describe(
            'start_time is the start point of a time range, represented by a Unix timestamp (in seconds). It is used in conjunction with end_time to pull events within a specified time range.**Notice**:- This method can only return data once and cannot be paginated. The size of the data returned in a single request is limited by page_size, and any data exceeding this limit will be truncated.- When using start_time and end_time, they cannot be used together with page_token or sync_token.- When using start_time and end_time, it cannot be used with anchor_time.**Default**: empty',
          )
          .optional(),
        end_time: z
          .string()
          .describe(
            'end_time is the end point of a time range, represented by a Unix timestamp (in seconds). It is used in conjunction with start_time to pull events within a specified time range.**Notice**:- This method can only return data once and cannot be paginated. The size of the data returned in a single request is limited by page_size, and any data exceeding this limit will be truncated.- When using start_time and end_time, they cannot be used together with page_token or sync_token.- When using start_time and end_time, it cannot be used with anchor_time.**Default**: empty',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({ calendar_id: z.string().describe('Calendar ID. For details, see [Calendar-related IDs]') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventMeetingChatCreate = {
  project: 'calendar',
  name: 'calendar.v4.calendarEventMeetingChat.create',
  sdkName: 'calendar.v4.calendarEventMeetingChat.create',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/meeting_chat',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Meeting Chat-Create meeting chat-Call this interface in the current identity (app or user) to create a meeting group for a specific event',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      calendar_id: z
        .string()
        .describe('The calendar ID where the event is located. To learn more, see [Calendar ID Introduction]'),
      event_id: z
        .string()
        .describe(
          'event ID.The event ID is returned when creating a event. You can also call the following interface to obtain the ID of a certain calendar.- [Get event list]- [Search event]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventMeetingChatDelete = {
  project: 'calendar',
  name: 'calendar.v4.calendarEventMeetingChat.delete',
  sdkName: 'calendar.v4.calendarEventMeetingChat.delete',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/meeting_chat',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Calendar-Meeting Chat-Unbind meeting chat-Call this interface in the current identity (app or user) to unbind the created meeting group for the event',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      meeting_chat_id: z.string().describe('Meeting group ID. The group ID is returned when the group is created'),
    }),
    path: z.object({
      calendar_id: z.string().describe('The calendar ID where the event is located'),
      event_id: z.string().describe('Event ID'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventMeetingMinuteCreate = {
  project: 'calendar',
  name: 'calendar.v4.calendarEventMeetingMinute.create',
  sdkName: 'calendar.v4.calendarEventMeetingMinute.create',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/meeting_minute',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Meeting Minute-Create meeting minute-Call this interface to create meeting minutes for the specified schedule. The minutes are displayed in the form of documents, and the minutes document URL will be returned after successful creation',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'Calendar ID. Call the [query primary calendar information] interface to obtain the primary calendar ID of the current identity',
        ),
      event_id: z
        .string()
        .describe(
          'Event ID. Call the [Search event] interface to search for event in the specified calendar and obtain the event ID',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventPatch = {
  project: 'calendar',
  name: 'calendar.v4.calendarEvent.patch',
  sdkName: 'calendar.v4.calendarEvent.patch',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Calendar-Event management-Update Event-Call this interface with the current identity (app or user) to update a event on a specific calendar, including information such as the event title, description, start and end time, video conference, and event location',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        summary: z
          .string()
          .describe('Event title.**Default value**: empty, indicating that the field will not be updated')
          .optional(),
        description: z
          .string()
          .describe(
            'Event description.**Note**: The current API method does not support editing rich text descriptions. If the event description is edited as rich text content via the client, updating the description using the API will cause the rich text formatting to be lost.**Default value**: empty, indicating that the field will not be updated',
          )
          .optional(),
        need_notification: z
          .boolean()
          .describe(
            'Whether to send Bot notifications to event invitees when updating the event.**Default value**: empty, indicating that the field will not be updated**Optional values are**:- true: send notification- false: Do not send notifications',
          )
          .optional(),
        start_time: z
          .object({
            date: z
              .string()
              .describe(
                'Start time, only use this field for all-day events, [RFC 3339] format, for example, 2018-09-01.**Note**: This parameter cannot be specified at the same time as `timestamp`',
              )
              .optional(),
            timestamp: z
              .string()
              .describe(
                'Second-level timestamp, used to set a specific start time. For example, 1602504000 means 2020/10/12 20:00:00 (UTC +8 time zone).**Note**: This parameter cannot be specified at the same time as `date`',
              )
              .optional(),
            timezone: z
              .string()
              .describe(
                'Time zone. Use IANA Time Zone Database standards such as Asia/Shanghai.- The all-day event time zone is fixed to UTC +0- The default time zone for non-all-day events is Asia/Shanghai',
              )
              .optional(),
          })
          .describe('Event start time. It will take effect only when it has a value at the same time as end_time')
          .optional(),
        end_time: z
          .object({
            date: z
              .string()
              .describe(
                'End time, only use this field for all-day events, [RFC 3339] format, for example, 2018-09-01.**Note**: This parameter cannot be specified at the same time as `timestamp`',
              )
              .optional(),
            timestamp: z
              .string()
              .describe(
                'Second-level timestamp, used to set a specific end time. For example, 1602504000 means 2020/10/12 20:00:00 (UTC +8 time zone).**Note**: This parameter cannot be specified at the same time as `date`',
              )
              .optional(),
            timezone: z
              .string()
              .describe(
                'Time zone. Use IANA Time Zone Database standards such as Asia/Shanghai.- The all-day event time zone is fixed to UTC +0- The default time zone for non-all-day events is Asia/Shanghai',
              )
              .optional(),
          })
          .describe('Event end time. It will take effect only when it has a value at the same time as start_time')
          .optional(),
        vchat: z
          .object({
            vc_type: z
              .enum(['vc', 'third_party', 'no_meeting', 'lark_live', 'unknown'])
              .describe(
                'Video conferencing type. If video conferencing is not required, `no_meeting` must be passed. Options:vc(Feishu video conferencing. When this type is selected, other fields in vchat are invalid.),third_party(ThirdParty Third-party linked video conferencing. When this type is selected, only the icon_type, description, and meeting_url fields in vchat will take effect.),no_meeting(NoMeeting No video conferencing. When this type is selected, other fields in vchat are invalid.),lark_live(LarkLive Feishu Live. This value is for client use, does not support calls via API, and is read-only.),unknown(Unknown type. This value is used for client compatibility, does not support API calls, and is read-only.)',
              )
              .optional(),
            icon_type: z
              .enum(['vc', 'live', 'default'])
              .describe(
                'The icon type for third-party video conferencing.**Default value**: empty, indicating that the field will not be updated Options:vc(Feishu Video Conference icon),live(Livestream video conference icon),default(Default icon)',
              )
              .optional(),
            description: z
              .string()
              .describe(
                'Third-party video conferencing copywriting.**Default value**: empty, indicating that the field will not be updated',
              )
              .optional(),
            meeting_url: z
              .string()
              .describe(
                'Video conferencing URL.**Default value**: empty, indicating that the field will not be updated',
              )
              .optional(),
            meeting_settings: z
              .object({
                owner_id: z
                  .string()
                  .describe(
                    'Set the user ID of the conference owner. The ID type must be consistent with user_id_type.This parameter must meet all of the following conditions to take effect:- Apply identity (tenant_access_token) request and operate event on the application calendar.- The owner can only be set when the event is set to a VC meeting for the first time.- owner cannot be a non-user identity.- owner cannot be an external tenant user identity',
                  )
                  .optional(),
                join_meeting_permission: z
                  .enum(['anyone_can_join', 'only_organization_employees', 'only_event_attendees'])
                  .describe(
                    'Determine who can join the meeting. Options:anyone_can_join(AnyOne Any user can join the meeting),only_organization_employees(OnlySameOrganization Only users that from the same organization can join the meeting),only_event_attendees(OnlyEventAttendees Only event attendees can join the meeting)',
                  )
                  .optional(),
                assign_hosts: z
                  .array(z.string())
                  .describe(
                    'Specify the moderator by user ID, the ID type needs to be the same as user_id_type remains consistent.**Note**:- Only the event organizer can designate a host.- Moderator cannot be a non-user.- The host cannot be an external tenant user identity.- When operating events on the app calendar, specifying a host is not allowed',
                  )
                  .optional(),
                auto_record: z
                  .boolean()
                  .describe(
                    'Whether to enable automatic recording.**Optional values are**:- true: enable- false: disable**Default value**: empty, indicating that the field will not be updated',
                  )
                  .optional(),
                open_lobby: z
                  .boolean()
                  .describe(
                    'Whether to enable the waiting room.**Optional values are**:- true: enable- false: disable**Default value**: empty, indicating that the field will not be updated',
                  )
                  .optional(),
                allow_attendees_start: z
                  .boolean()
                  .describe(
                    'Whether to allow event invitees to initiate meetings.**Note**: When operating event on the application calendar, this field must be true, otherwise no one can initiate a meeting.**Optional values are**:- true: allow- false: not allowed**Default value**: empty, indicating that the field will not be updated',
                  )
                  .optional(),
              })
              .describe(
                'The pre-meeting settings of Feishu Video Conference (VC) must meet all the following conditions:- Valid when `vc_type` is `vc`.- Requires editing permissions for event.Not passing a value means that the field will not be updated',
              )
              .optional(),
          })
          .describe('Video conferencing information. Not passing a value means that the field will not be updated')
          .optional(),
        visibility: z
          .enum(['default', 'public', 'private'])
          .describe(
            'Event visibility.**Note**: If the parameter value is modified when updating the event, it will only take effect for the current identity.**Default value**: empty, indicating that the field will not be updated Options:default(Default range, which depends on the calendar visibility. Only the availability status is visible to other people by default.),public(Public. Event details are displayed.),private(Private. Details are visible only to the current identity.)',
          )
          .optional(),
        attendee_ability: z
          .enum(['none', 'can_see_others', 'can_invite_others', 'can_modify_event'])
          .describe(
            'Invitee permissions.**Default value**: empty, indicating that the field will not be updated Options:none(Cannot edit events, cannot invite others, and cannot view event invitee list),can_see_others(CanSeeOthers Cannot edit events, cannot invite others, and can view event invitee list),can_invite_others(CanInviteOthers Cannot edit events, can invite others, and can view event invitee list),can_modify_event(CanModifyEvent Can edit events, can invite others, and can view event invitee list)',
          )
          .optional(),
        free_busy_status: z
          .enum(['busy', 'free'])
          .describe(
            'Busy status occupied by the event. The default for new events is `busy`.**Note**: If the parameter value is modified when updating the event, it will only take effect for the current identity.**Default value**: empty, indicating that the field will not be updated Options:busy(Busy),free(Free)',
          )
          .optional(),
        location: z
          .object({
            name: z.string().describe('Name of the location').optional(),
            address: z.string().describe('Address of the location').optional(),
            latitude: z
              .number()
              .describe(
                'Latitude coordinate of the location. Locations within China Mainland should comply with the GCJ-02 standard, and locations outside China Mainland should comply with the WGS84 standard',
              )
              .optional(),
            longitude: z
              .number()
              .describe(
                'Longitude coordinate of the location. Locations within China Mainland should comply with the GCJ-02 standard, and locations outside China Mainland should comply with the WGS84 standard',
              )
              .optional(),
          })
          .describe('Event location. Not passing a value means that the field will not be updated')
          .optional(),
        color: z
          .number()
          .describe(
            'Event color, the value is represented by an int32 color RGB value.**Notice**:- This parameter only takes effect for the current identity.- When displayed on the client, it will be mapped to the closest color on the color palette.- When the value is 0 or -1, the calendar color will be followed by default.**Default value**: empty, indicating that the field will not be updated',
          )
          .optional(),
        reminders: z
          .array(
            z.object({
              minutes: z
                .number()
                .describe(
                  'Offset of the event reminder time. A positive value means the reminder is triggered X minutes before the event starts, and a negative value means the reminder is triggered X minutes after the event starts.This field is specified when an event is created or updated, and only valid for the current identity, not for other invitees in the event',
                )
                .optional(),
            }),
          )
          .describe('Event reminder list. Not passing a value means that the field will not be updated')
          .optional(),
        recurrence: z
          .string()
          .describe(
            'Recurrence rule for recurring events. For details, see [RFC 5545].**Note**:- COUNT and UNTIL cannot coexist- The length of a scheduled recurring event in a room cannot exceed two years.**Default value**: empty, indicating that the field will not be updated',
          )
          .optional(),
        schemas: z
          .array(
            z.object({
              ui_name: z
                .string()
                .describe(
                  'UI name. **Valid values**: - ForwardIcon: Event forwarding button - MeetingChatIcon: Meeting group chat button - MeetingMinutesIcon: Meeting minutes button - MeetingVideo: Video conference area - RSVP: Accept/decline/pending area - Attendee: Event invitees area - OrganizerOrCreator: Organizer/creator area',
                )
                .optional(),
              ui_status: z
                .enum(['hide', 'readonly', 'editable', 'unknown'])
                .describe(
                  'Custom status of UI items. Only "hide" is supported. Options:hide(Hidden),readonly(Read-only),editable(Editable),unknown(Unknown. This is only used for compatibility in reading.)',
                )
                .optional(),
              app_link: z
                .string()
                .describe(
                  'The link that jumps after clicking the button.**Note**: The compatibility parameter is read-only, so passing in this request parameter is not supported yet',
                )
                .optional(),
            }),
          )
          .describe(
            'Event custom information controls the UI display of the event details page. Not passing a value means that the field will not be updated',
          )
          .optional(),
        attachments: z
          .array(
            z.object({
              file_token: z
                .string()
                .describe(
                  'Attachment token. Call the [Upload Material] interface to obtain the file_token of the attachment. When calling the upload material interface, please note:- `parent_type` needs to pass in a fixed value `calender`.- `parent_node` needs to pass in a calendar ID that is consistent with the current interface.**Attachment verification rule**: The total size of the attachment does not exceed 25 MB',
                )
                .optional(),
              is_deleted: z
                .boolean()
                .describe('Whether to delete the attachment.**Optional values**:- true- false**Default value**: false')
                .optional(),
            }),
          )
          .describe('Event attachment')
          .optional(),
        event_check_in: z
          .object({
            enable_check_in: z.boolean().describe('Whether to enable event check-in'),
            check_in_start_time: z
              .object({
                time_type: z
                  .enum(['before_event_start', 'after_event_start', 'after_event_end'])
                  .describe(
                    'Check-in time type, duration calculates the final time according to it. Options:before_event_start(BeforeEventStart Before the start of event),after_event_start(AfterEventStart After the start of event),after_event_end(AfterEventEnd After the end of event)',
                  ),
                duration: z
                  .number()
                  .describe(
                    'The offset (in minutes) relative to the beginning or end of the event.- Currently, the value can only be one of the lists [0, 5, 15, 30, 60], where 0 indicates immediate start.- When time_type is before_event_start, duration cannot be set to 0',
                  ),
              })
              .describe(
                'Event check-in start time.**Note**: The check-in start time cannot be greater than or equal to the check-in end time',
              )
              .optional(),
            check_in_end_time: z
              .object({
                time_type: z
                  .enum(['before_event_start', 'after_event_start', 'after_event_end'])
                  .describe(
                    'Check-in time type, duration calculates the final time according to it. Options:before_event_start(BeforeEventStart Before the start of event),after_event_start(AfterEventStart After the start of event),after_event_end(AfterEventEnd After the end of event)',
                  ),
                duration: z
                  .number()
                  .describe(
                    'The offset (in minutes) relative to the beginning or end of the event.- Currently, the value can only be one of the lists [0, 5, 15, 30, 60], where 0 indicates immediate start.- When time_type is before_event_start, duration cannot be set to 0',
                  ),
              })
              .describe(
                'Event check-in end time.**Note**: The check-in start time cannot be greater than or equal to the check-in end time',
              )
              .optional(),
            need_notify_attendees: z
              .boolean()
              .describe(
                'Whether a check-in notification is automatically sent to the participant at the start of the check-in',
              )
              .optional(),
          })
          .describe('Event check-in settings. If this parameter is empty, check-in Settings are not performed')
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      calendar_id: z.string().describe('Calendar ID. For details, see [Calendar-related IDs]'),
      event_id: z
        .string()
        .describe(
          'Event ID.The event ID is returned when creating a event. You can also call the following interface to obtain the ID of a certain calendar.- [Get event list]- [Search event]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventReply = {
  project: 'calendar',
  name: 'calendar.v4.calendarEvent.reply',
  sdkName: 'calendar.v4.calendarEvent.reply',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/:event_id/reply',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Event management-Reply Event-Call this interface to reply to the event with the current identity (app or user)',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      rsvp_status: z
        .enum(['accept', 'decline', 'tentative'])
        .describe(
          'Event invitee RSVP status, that is, event reply status. Options:accept(accept),decline(refuse),tentative(To be determined)',
        ),
    }),
    path: z.object({
      calendar_id: z
        .string()
        .describe('The calendar ID where the event is located. To learn more, see [Calendar ID Introduction]'),
      event_id: z
        .string()
        .describe(
          'Event ID.The event ID is returned when creating a event. You can also call the following interface to obtain the ID of a certain calendar.- [Get event list]- [Search event]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventSearch = {
  project: 'calendar',
  name: 'calendar.v4.calendarEvent.search',
  sdkName: 'calendar.v4.calendarEvent.search',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Event management-Search Event-Call this interface to search for relevant events under the specified calendar, supporting keyword search and filter condition search',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      query: z
        .string()
        .describe(
          'Search for the keyword. Used to fuzzy query event name.**Notice**: If the event name contains an underscore (_), you must search for it accurately. This scene fuzzy search may not search for the event',
        ),
      filter: z
        .object({
          start_time: z
            .object({
              date: z
                .string()
                .describe(
                  'Specify the start time in days, in [RFC 3339] format, for example, 2018-09-01.**Note**: This parameter cannot be specified at the same time as `timestamp`',
                )
                .optional(),
              timestamp: z
                .string()
                .describe(
                  'Second-level timestamp refers to the specific start time. For example, 1602504000 means 2020/10/12 20:00:00 (UTC +8 time zone).**Note**: This parameter cannot be specified at the same time as `date`',
                )
                .optional(),
              timezone: z
                .string()
                .describe(
                  'Time zone. Use IANA Time Zone Database standards such as Asia/Shanghai.- The time zone is fixed to UTC +0 throughout the day- The non-all-day time zone defaults to Asia/Shanghai',
                )
                .optional(),
            })
            .describe(
              'Search filter items, start time of event search interval. **Notice**: If start_time and end_time are not passed, the default search is for events within the past month',
            )
            .optional(),
          end_time: z
            .object({
              date: z
                .string()
                .describe(
                  'Specify the end time in days, in [RFC 3339] format, for example, 2018-09-01.**Note**: This parameter cannot be specified at the same time as `timestamp`',
                )
                .optional(),
              timestamp: z
                .string()
                .describe(
                  'Second-level timestamp refers to the specific end time. For example, 1602504000 means 2020/10/12 20:00:00 (UTC +8 time zone).**Note**: This parameter cannot be specified at the same time as `date`',
                )
                .optional(),
              timezone: z
                .string()
                .describe(
                  'Time zone. Use IANA Time Zone Database standards such as Asia/Shanghai.- The time zone is fixed to UTC +0 throughout the day- The non-all-day time zone defaults to Asia/Shanghai',
                )
                .optional(),
            })
            .describe(
              'Search filter items, end time of event search interval. **Notice**: If start_time and end_time are not passed, the default search is for events within the past month',
            )
            .optional(),
          user_ids: z
            .array(z.string())
            .describe(
              'Search filter item, list of user IDs of event invitees. After setting this field, the searched event contains at least one of the invitees.**Note**: The user ID type is consistent with the value of user_id_type. For user ID, please refer to [User-related ID concepts].**Default value**: empty, indicating that the filter item is not set',
            )
            .optional(),
          room_ids: z
            .array(z.string())
            .describe(
              'Search filter items, meeting room ID list. After setting this field, the searched event contains at least one of the meeting rooms.**Default value**: empty, indicating that the filter item is not set',
            )
            .optional(),
          chat_ids: z
            .array(z.string())
            .describe(
              'Search filter items, group ID list. After setting this field, the searched event contains at least one of these groups. For details about group ID, please refer to [Group ID Description].**Default value**: empty, indicating that the filter item is not set',
            )
            .optional(),
        })
        .describe('Search filter')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z
          .number()
          .describe(
            'The maximum number of events returned in one call. The minimum value is 10, and if fewer than 10, defaults to 10',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ calendar_id: z.string().describe('Calendar ID. For details, see [Calendar-related IDs]') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventSubscription = {
  project: 'calendar',
  name: 'calendar.v4.calendarEvent.subscription',
  sdkName: 'calendar.v4.calendarEvent.subscription',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/subscription',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Event management-Subscribe Event Changes-Call this interface with user identity to subscribe to event change events under a specified calendar',
  accessTokens: ['user'],
  schema: {
    path: z.object({ calendar_id: z.string().describe('Calendar ID. For details, see [Calendar-related IDs]') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarEventUnsubscription = {
  project: 'calendar',
  name: 'calendar.v4.calendarEvent.unsubscription',
  sdkName: 'calendar.v4.calendarEvent.unsubscription',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/events/unsubscription',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Event management-Unsubscribe Event Changes-Call this interface to unsubscribe from event change events in the specified calendar as a user',
  accessTokens: ['user'],
  schema: {
    path: z.object({ calendar_id: z.string().describe('Calendar ID. For details, see [Calendar-related IDs]') }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarGet = {
  project: 'calendar',
  name: 'calendar.v4.calendar.get',
  sdkName: 'calendar.v4.calendar.get',
  path: '/open-apis/calendar/v4/calendars/:calendar_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Calendar-Calendar management-Query calendar information-Call this interface to query the information of a specified calendar with the current identity (application or user)',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'Calendar ID. When creating a shared calendar, the calendar ID will be returned. You can also call the following interfaces to get the ID of a calendar.- [Query Primary Calendar Information]- [Query Calendar List]- [Search Calendars]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarList = {
  project: 'calendar',
  name: 'calendar.v4.calendar.list',
  sdkName: 'calendar.v4.calendar.list',
  path: '/open-apis/calendar/v4/calendars',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Calendar-Calendar management-Query the calendar list-Call this interface to page through and query the calendar list of the current identity (application or user)',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_size: z
          .number()
          .describe(
            'The maximum number of calendars to be returned for one request. The actual number of calendars returned may be less than this value, or it may be empty, and you can determine if there are more calendars based on the has_more field in the response body',
          )
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        sync_token: z
          .string()
          .describe(
            'Incremental synchronization mark, no need to fill in for the first request. When the page query ends (the returned value of page_token is empty), the interface will return the sync_token field. The next call can use this sync_token to incrementally obtain calendar change data',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarPatch = {
  project: 'calendar',
  name: 'calendar.v4.calendar.patch',
  sdkName: 'calendar.v4.calendar.patch',
  path: '/open-apis/calendar/v4/calendars/:calendar_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Calendar-Calendar management-Update calendar information-Call this interface with the current identity (application or user) to modify the title, description, public range, and other information of the specified calendar',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        summary: z
          .string()
          .describe('Calendar title.- Not providing this field means it will not be updated')
          .optional(),
        description: z
          .string()
          .describe('Calendar description.- Not providing this field means it will not be updated')
          .optional(),
        permissions: z
          .enum(['private', 'show_only_free_busy', 'public'])
          .describe(
            'Calendar visibility range.- Not providing this field means it will not be updated. Options:private(Private),show_only_free_busy(ShowOnlyFreeBusy Only availability information is displayed.),public(Public. Event details are visible to other people)',
          )
          .optional(),
        color: z
          .number()
          .describe(
            'Calendar color, the value is represented by the int32 of the RGB color value, where, 24 ~ 31 bits are transparency, 16 ~ 23 bits are red, 8 ~ 15 bits are green, 0 ~ 7 bits are blue. For example, -11034625 represents the RGB value (87, 159, 255).- Not providing this field means it will not be updated.**Note**:- The value range is -2^31 ~ 2^31-1- The color of the calendar will be mapped to the closest color on the Feishu client palette for display.- This color only applies to the current identity',
          )
          .optional(),
        summary_alias: z
          .string()
          .describe(
            'Calendar alias, setting this field (including subsequent modification of this field) only takes effect for the current identity.- Not providing this field means it will not be updated',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'Calendar ID. When creating a shared calendar, the calendar ID will be returned. You can also call the following interfaces to get the ID of a calendar.- [Query Primary Calendar Information]- [Query Calendar List]- [Search Calendars]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarPrimary = {
  project: 'calendar',
  name: 'calendar.v4.calendar.primary',
  sdkName: 'calendar.v4.calendar.primary',
  path: '/open-apis/calendar/v4/calendars/primary',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Calendar management-Query primary calendar information-Call this interface to get the main calendar information of the current identity (application or user)',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarSearch = {
  project: 'calendar',
  name: 'calendar.v4.calendar.search',
  sdkName: 'calendar.v4.calendar.search',
  path: '/open-apis/calendar/v4/calendars/search',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Calendar-Calendar management-Search Calendar-Invoke this interface to search the calendar by keyword. The search results will be public calendars or the user's main calendar where the title or description contains the keyword",
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      query: z
        .string()
        .describe(
          "Search keyword. The interface will search public calendars or the user's main calendar where the title or description contains this keyword",
        ),
    }),
    params: z
      .object({
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('The maximum number of calendars returned in a single request').optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarSubscribe = {
  project: 'calendar',
  name: 'calendar.v4.calendar.subscribe',
  sdkName: 'calendar.v4.calendar.subscribe',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/subscribe',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Calendar management-Subscribe Calendar-Call this interface to subscribe to the specified calendar with the current identity (application or user)',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'Calendar ID.The calendar ID will be returned when creating a shared calendar. You also can call the following interfaces to get the ID of a certain calendar.- [Query Primary Calendar Information]- [Query Calendar List]- [Search Calendar]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarSubscription = {
  project: 'calendar',
  name: 'calendar.v4.calendar.subscription',
  sdkName: 'calendar.v4.calendar.subscription',
  path: '/open-apis/calendar/v4/calendars/subscription',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Calendar management-Subscribe Calendar Changes -Call this interface to subscribe the current user identity to the [Calendar Change Event]',
  accessTokens: ['user'],
  schema: {
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarUnsubscribe = {
  project: 'calendar',
  name: 'calendar.v4.calendar.unsubscribe',
  sdkName: 'calendar.v4.calendar.unsubscribe',
  path: '/open-apis/calendar/v4/calendars/:calendar_id/unsubscribe',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Calendar management-Unsubscribe Calendar-Call this interface with the current identity (application or user) to unsubscribe from the specified calendar',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({
      calendar_id: z
        .string()
        .describe(
          'Calendar ID.You can call the following interfaces to get the ID of a calendar.- [Query primary calendar information]- [Query calendar list]- [Search calendar]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4CalendarUnsubscription = {
  project: 'calendar',
  name: 'calendar.v4.calendar.unsubscription',
  sdkName: 'calendar.v4.calendar.unsubscription',
  path: '/open-apis/calendar/v4/calendars/unsubscription',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Calendar management-Unsubscribe Calendar Changes-Call this interface to unsubscribe the current user identity from the [Calendar Change Event]',
  accessTokens: ['user'],
  schema: {
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4ExchangeBindingCreate = {
  project: 'calendar',
  name: 'calendar.v4.exchangeBinding.create',
  sdkName: 'calendar.v4.exchangeBinding.create',
  path: '/open-apis/calendar/v4/exchange_bindings',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Synchronize Exchange calendar information-Bind Exchange account to Feishu account-Call this interface to bind the Exchange account to the Feishu account, thereby supporting the import of the Exchange calendar',
  accessTokens: ['user'],
  schema: {
    data: z
      .object({
        admin_account: z.string().describe('The admin account of Exchange').optional(),
        exchange_account: z.string().describe('The Exchange account that needs to be bound').optional(),
        user_id: z
          .string()
          .describe(
            'User ID, that is, the Feishu account ID bound to the Exchange account. For more information, see [User-related IDs]',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4ExchangeBindingDelete = {
  project: 'calendar',
  name: 'calendar.v4.exchangeBinding.delete',
  sdkName: 'calendar.v4.exchangeBinding.delete',
  path: '/open-apis/calendar/v4/exchange_bindings/:exchange_binding_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Calendar-Synchronize Exchange calendar information-Unbind the Exchange account-Call this interface to unbind the relationship between the Exchange account and the Feishu account. After the Exchange account is unbound, it can continue to bind with other Feishu accounts',
  accessTokens: ['user'],
  schema: {
    path: z.object({
      exchange_binding_id: z
        .string()
        .describe(
          'The unique identification ID bound to Exchange. When calling [Bind Exchange Account to Feishu Account], the exchange_binding_id can be obtained from the returned result',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4ExchangeBindingGet = {
  project: 'calendar',
  name: 'calendar.v4.exchangeBinding.get',
  sdkName: 'calendar.v4.exchangeBinding.get',
  path: '/open-apis/calendar/v4/exchange_bindings/:exchange_binding_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Calendar-Synchronize Exchange calendar information-Query the binding status of the Exchange account-Call this interface to obtain the binding status of the Exchange account, including the synchronization status of the Exchange calendar',
  accessTokens: ['user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      exchange_binding_id: z
        .string()
        .describe(
          'The unique identification ID bound to Exchange. When calling [Bind Exchange Account to Feishu Account], the exchange_binding_id can be obtained from the returned result',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4FreebusyList = {
  project: 'calendar',
  name: 'calendar.v4.freebusy.list',
  sdkName: 'calendar.v4.freebusy.list',
  path: '/open-apis/calendar/v4/freebusy/list',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Calendar-Calendar management-Query availability of the primary calendar-Call this interface to query the busy/free information of the specified user's primary calendar, or to query the busy/free information of the specified meeting room",
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      time_min: z
        .string()
        .describe(
          'The start time of the query period, in [RFC 3339] date_time format.**Note**: The time interval between time_min and time_max cannot be more than 90 days',
        ),
      time_max: z
        .string()
        .describe(
          'The end time of the query period, in [RFC 3339] date_time format.**Note**: The time interval between time_min and time_max cannot be more than 90 days',
        ),
      user_id: z
        .string()
        .describe(
          "User ID, you need to input an id that matches the query parameter user_id_type. For example, when user_id_type=open_id, you need to input the user's open_id. Refer to [User-related ID concepts] for understanding user IDs.**Note**: Either user_id or room_id needs to be entered. If both are entered at the same time, only user_id will take effect",
        )
        .optional(),
      room_id: z
        .string()
        .describe(
          "Meeting room room_id. You can call the [Query Meeting Room List] interface or the [Search for Meeting Room] interface to get the corresponding meeting room's room_id.**Note**: Either user_id or room_id needs to be entered. If both are entered at the same time, only user_id will take effect",
        )
        .optional(),
      include_external_calendar: z
        .boolean()
        .describe(
          'Whether to include the schedule in the bound third-party calendar.**Values**：- true (default value): Include- false: Do not include',
        )
        .optional(),
      only_busy: z
        .boolean()
        .describe(
          'Whether to only query busy schedule information. **Value**:- true (default): Yes, the query results do not include free schedules.- false: No, the query results include free schedules',
        )
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4SettingGenerateCaldavConf = {
  project: 'calendar',
  name: 'calendar.v4.setting.generateCaldavConf',
  sdkName: 'calendar.v4.setting.generateCaldavConf',
  path: '/open-apis/calendar/v4/settings/generate_caldav_conf',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Calendar-Sync to local calendar-Generate CalDAV configuration-Call this interface to generate a CalDAV account password for the current user, which is used to synchronize Feishu calendar information to the local device calendar',
  accessTokens: ['user'],
  schema: {
    data: z
      .object({
        device_name: z
          .string()
          .describe(
            'The name of the device that needs to synchronize the calendar, which is used for display in the calendar.**Default**: empty',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const calendarV4TimeoffEventCreate = {
  project: 'calendar',
  name: 'calendar.v4.timeoffEvent.create',
  sdkName: 'calendar.v4.timeoffEvent.create',
  path: '/open-apis/calendar/v4/timeoff_events',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Calendar-Timeoff-Create Timeoff Event-Call this interface to create a leave event for a specified user. Leave events are divided into regular events and all-day events. After creating a leave event, the user's personal signature page will display leave information during the leave time",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z
        .string()
        .describe(
          'User ID. The ID type needs to be consistent with the value of user_id_type. For information about user IDs, see [User-related ID concepts]',
        ),
      timezone: z.string().describe('Time zone'),
      start_time: z
        .string()
        .describe(
          'Leave start time. Any of the following formats are supported:- Second-level timestamp: The leave event set through the timestamp is a normal event, that is, leave is requested by the hour. Value example `1609430400`- Date format: The leave event set by date is a full-day event. Value example `2021-01-01`**Note**: The time format selected for start_time and end_time must be consistent, otherwise it will be invalid',
        ),
      end_time: z
        .string()
        .describe(
          'Leave end time. Any of the following formats are supported:- Second-level timestamp: The leave event set through the timestamp is a normal event, that is, leave is requested by the hour. Value example `1609430400`- Date format: The leave event set by date is a full-day event. Value example `2021-01-01`**Note**: The time format selected for start_time and end_time must be consistent, otherwise it will be invalid',
        ),
      title: z.string().describe('Customize the leave event title.**Default**: empty, use default title').optional(),
      description: z
        .string()
        .describe('Customize leave event description.**Default**: empty, use default description')
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const calendarV4TimeoffEventDelete = {
  project: 'calendar',
  name: 'calendar.v4.timeoffEvent.delete',
  sdkName: 'calendar.v4.timeoffEvent.delete',
  path: '/open-apis/calendar/v4/timeoff_events/:timeoff_event_id',
  httpMethod: 'DELETE',
  description:
    "[Feishu/Lark]-Calendar-Timeoff-Delete Timeoff Event-Call this interface to delete a specified leave event. After the leave event is deleted, the leave information on the user's personal signature page will also disappear",
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      timeoff_event_id: z
        .string()
        .describe('Leave event ID, obtained from the returned results when creating a leave event'),
    }),
  },
};
export const calendarV4Tools = [
  calendarV4CalendarAclCreate,
  calendarV4CalendarAclDelete,
  calendarV4CalendarAclList,
  calendarV4CalendarAclSubscription,
  calendarV4CalendarAclUnsubscription,
  calendarV4CalendarCreate,
  calendarV4CalendarDelete,
  calendarV4CalendarEventAttendeeBatchDelete,
  calendarV4CalendarEventAttendeeChatMemberList,
  calendarV4CalendarEventAttendeeCreate,
  calendarV4CalendarEventAttendeeList,
  calendarV4CalendarEventCreate,
  calendarV4CalendarEventDelete,
  calendarV4CalendarEventGet,
  calendarV4CalendarEventInstanceView,
  calendarV4CalendarEventInstances,
  calendarV4CalendarEventList,
  calendarV4CalendarEventMeetingChatCreate,
  calendarV4CalendarEventMeetingChatDelete,
  calendarV4CalendarEventMeetingMinuteCreate,
  calendarV4CalendarEventPatch,
  calendarV4CalendarEventReply,
  calendarV4CalendarEventSearch,
  calendarV4CalendarEventSubscription,
  calendarV4CalendarEventUnsubscription,
  calendarV4CalendarGet,
  calendarV4CalendarList,
  calendarV4CalendarPatch,
  calendarV4CalendarPrimary,
  calendarV4CalendarSearch,
  calendarV4CalendarSubscribe,
  calendarV4CalendarSubscription,
  calendarV4CalendarUnsubscribe,
  calendarV4CalendarUnsubscription,
  calendarV4ExchangeBindingCreate,
  calendarV4ExchangeBindingDelete,
  calendarV4ExchangeBindingGet,
  calendarV4FreebusyList,
  calendarV4SettingGenerateCaldavConf,
  calendarV4TimeoffEventCreate,
  calendarV4TimeoffEventDelete,
];
