import { z } from 'zod';
export type vcV1ToolName =
  | 'vc.v1.alert.list'
  | 'vc.v1.export.get'
  | 'vc.v1.export.meetingList'
  | 'vc.v1.export.participantList'
  | 'vc.v1.export.participantQualityList'
  | 'vc.v1.export.resourceReservationList'
  | 'vc.v1.meetingList.get'
  | 'vc.v1.meeting.end'
  | 'vc.v1.meeting.get'
  | 'vc.v1.meeting.invite'
  | 'vc.v1.meeting.kickout'
  | 'vc.v1.meeting.listByNo'
  | 'vc.v1.meetingRecording.get'
  | 'vc.v1.meetingRecording.setPermission'
  | 'vc.v1.meetingRecording.start'
  | 'vc.v1.meetingRecording.stop'
  | 'vc.v1.meeting.setHost'
  | 'vc.v1.participantList.get'
  | 'vc.v1.participantQualityList.get'
  | 'vc.v1.report.getDaily'
  | 'vc.v1.report.getTopUser'
  | 'vc.v1.reserveConfigAdmin.get'
  | 'vc.v1.reserveConfigAdmin.patch'
  | 'vc.v1.reserveConfigDisableInform.get'
  | 'vc.v1.reserveConfigDisableInform.patch'
  | 'vc.v1.reserveConfigForm.get'
  | 'vc.v1.reserveConfigForm.patch'
  | 'vc.v1.reserveConfig.patch'
  | 'vc.v1.reserveConfig.reserveScope'
  | 'vc.v1.reserve.apply'
  | 'vc.v1.reserve.delete'
  | 'vc.v1.reserve.get'
  | 'vc.v1.reserve.getActiveMeeting'
  | 'vc.v1.reserve.update'
  | 'vc.v1.resourceReservationList.get'
  | 'vc.v1.roomConfig.query'
  | 'vc.v1.roomConfig.set'
  | 'vc.v1.roomConfig.setCheckboardAccessCode'
  | 'vc.v1.roomConfig.setRoomAccessCode'
  | 'vc.v1.roomLevel.create'
  | 'vc.v1.roomLevel.del'
  | 'vc.v1.roomLevel.get'
  | 'vc.v1.roomLevel.list'
  | 'vc.v1.roomLevel.mget'
  | 'vc.v1.roomLevel.patch'
  | 'vc.v1.roomLevel.search'
  | 'vc.v1.room.create'
  | 'vc.v1.room.delete'
  | 'vc.v1.room.get'
  | 'vc.v1.room.list'
  | 'vc.v1.room.mget'
  | 'vc.v1.room.patch'
  | 'vc.v1.room.search'
  | 'vc.v1.scopeConfig.create'
  | 'vc.v1.scopeConfig.get';
export const vcV1AlertList = {
  project: 'vc',
  name: 'vc.v1.alert.list',
  sdkName: 'vc.v1.alert.list',
  path: '/open-apis/vc/v1/alerts',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Video Conferencing-Alert center-Get alert center history-Get tenant's equipment warning record under specific conditions",
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      start_time: z.string().describe('Start time (UNIX time, unit SEC)'),
      end_time: z.string().describe('End time (UNIX time, unit SEC)'),
      query_type: z.number().describe('Query object type Options:1(room Rooms),2(erc),3(sip)').optional(),
      query_value: z.string().describe('Query object ID').optional(),
      page_size: z.number().optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
  },
};
export const vcV1ExportGet = {
  project: 'vc',
  name: 'vc.v1.export.get',
  sdkName: 'vc.v1.export.get',
  path: '/open-apis/vc/v1/exports/:task_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Export-Query export task results-View the progress of asynchronous export',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z.object({ task_id: z.string().describe('Task id').optional() }).optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1ExportMeetingList = {
  project: 'vc',
  name: 'vc.v1.export.meetingList',
  sdkName: 'vc.v1.export.meetingList',
  path: '/open-apis/vc/v1/exports/meeting_list',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Video Conferencing-Export-Export meeting details-Export meeting details. For specific permission requirements, please refer to "Resource introduction"',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      start_time: z.string().describe('Query start time (unix time, unit sec)'),
      end_time: z.string().describe('Query end time (unix time, unit sec)'),
      meeting_status: z
        .number()
        .describe(
          'Meeting status (defaults to ended meeting if not passed on) Options:1(ongoing in progress),2(past It has ended.),3(future to be held)',
        )
        .optional(),
      meeting_no: z.string().describe('Filter by 9-digit meeting number (up to one filter)').optional(),
      user_id: z.string().describe('Filter by participating Lark users (up to one filter)').optional(),
      room_id: z.string().describe('Filter by Rooms (maximum one filter)').optional(),
      meeting_type: z
        .number()
        .describe(
          'Filter by meeting type (up to one filter) Options:1(all All types (default)),2(meeting video conferencing),3(share_screen share screen)',
        )
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1ExportParticipantList = {
  project: 'vc',
  name: 'vc.v1.export.participantList',
  sdkName: 'vc.v1.export.participantList',
  path: '/open-apis/vc/v1/exports/participant_list',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Video Conferencing-Export-Export participant details-Export a list of participant details for a conference.For specific permission requirements, please refer to "Resource introduction"',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      meeting_start_time: z.string().describe('Meeting start time (unix time,unit second)'),
      meeting_end_time: z
        .string()
        .describe(
          'Meeting end time (Unix time, unit sec, if the meeting is in progress, fill in the current time, otherwise fill in the accurate meeting end time)',
        ),
      meeting_status: z
        .number()
        .describe(
          'Meeting status (defaults to ended meeting if not passed on) Options:1(ongoing in progress),2(past It has ended.),3(future to be held)',
        )
        .optional(),
      meeting_no: z.string().describe('9-Digit conference number'),
      user_id: z.string().describe('Filter by participating Lark users (up to one filter)').optional(),
      room_id: z.string().describe('Filter by Rooms (maximum one filter)').optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1ExportParticipantQualityList = {
  project: 'vc',
  name: 'vc.v1.export.participantQualityList',
  sdkName: 'vc.v1.export.participantQualityList',
  path: '/open-apis/vc/v1/exports/participant_quality_list',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Video Conferencing-Export-Export participant meeting quality data-Export audio and video & share quality data of a participant in a conference,(Only supports ended meetings.) please refer to "Resource introduction" for specific permission requirements',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      meeting_start_time: z
        .string()
        .describe('Meeting start time (need to be accurate to the minute,unix time,unit second)'),
      meeting_end_time: z.string().describe('Meeting end time (unix time, unit sec)'),
      meeting_no: z.string().describe('9-Digit conference number'),
      join_time: z
        .string()
        .describe(
          'Entry time of participants (unix time, unit sec).It can be obtained from the results returned by "Participant Details"',
        ),
      user_id: z
        .string()
        .describe('Fill in when the participant is a Lark user, and room_id and user_id must be filled in only one')
        .optional(),
      room_id: z
        .string()
        .describe('Fill in when the participant is a Room, and room_id and user_id must be filled in only one')
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1ExportResourceReservationList = {
  project: 'vc',
  name: 'vc.v1.export.resourceReservationList',
  sdkName: 'vc.v1.export.resourceReservationList',
  path: '/open-apis/vc/v1/exports/resource_reservation_list',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Video Conferencing-Export-Export meeting room reservation data-Export meeting room reservation data. For specific permission requirements, please refer to "Resource introduction"',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      room_level_id: z.string().describe('room level id'),
      need_topic: z.boolean().describe('Whether to show the conference theme').optional(),
      start_time: z.string().describe('Query start time (unix time, unit sec)'),
      end_time: z.string().describe('Query end time (unix time, unit sec)'),
      room_ids: z.array(z.string()).describe('List of meeting room ids to filter').optional(),
      is_exclude: z
        .boolean()
        .describe(
          'If true, it means that the conference room outside the scope of the export room_ids, the default is false',
        )
        .optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1MeetingListGet = {
  project: 'vc',
  name: 'vc.v1.meetingList.get',
  sdkName: 'vc.v1.meetingList.get',
  path: '/open-apis/vc/v1/meeting_list',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting data-Get meeting details-Get meeting details.For specific permission requirements, please refer to "Resource introduction"',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      start_time: z.string().describe('Start time (unix time, in sec)'),
      end_time: z.string().describe('End time (unix time, in sec)'),
      meeting_status: z
        .number()
        .describe(
          'meeting status(defaults to ended meeting if not passed on) Options:1(ongoing in progress),2(past It has ended.),3(future to be held. This enumeration value is read-only and does not support selection during request.)',
        )
        .optional(),
      meeting_no: z.string().describe('Filter by 9-digit meeting number (at most one filter)').optional(),
      user_id: z.string().describe('Filter by participating Lark users (at most one filter)').optional(),
      room_id: z.string().describe('Filter by Participating Rooms (at most one filter)').optional(),
      meeting_type: z
        .number()
        .describe(
          'Filter by meeting type (up to one filter) Options:1(all All types (default)),2(meeting video conferencing),3(share_screen share screen)',
        )
        .optional(),
      page_size: z.number().describe('paging size').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1MeetingEnd = {
  project: 'vc',
  name: 'vc.v1.meeting.end',
  sdkName: 'vc.v1.meeting.end',
  path: '/open-apis/vc/v1/meetings/:meeting_id/end',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Video Conferencing-Meeting management-End a meeting-Ends an ongoing meeting',
  accessTokens: ['user'],
  schema: {
    path: z
      .object({
        meeting_id: z
          .string()
          .describe('Meeting ID (Unique identifier of a video conference, generated after the conference is started)')
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1MeetingGet = {
  project: 'vc',
  name: 'vc.v1.meeting.get',
  sdkName: 'vc.v1.meeting.get',
  path: '/open-apis/vc/v1/meetings/:meeting_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting management-Obtain meeting details-Obtains the detailed data of a meeting',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        with_participants: z.boolean().describe('Indicates whether the participant list is required').optional(),
        with_meeting_ability: z
          .boolean()
          .describe('Indicates whether individual statistics is required in the meeting (only for tenant_access_token)')
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z
      .object({
        meeting_id: z
          .string()
          .describe('Meeting ID (Unique identifier of a video conference, generated after the conference is started)')
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1MeetingInvite = {
  project: 'vc',
  name: 'vc.v1.meeting.invite',
  sdkName: 'vc.v1.meeting.invite',
  path: '/open-apis/vc/v1/meetings/:meeting_id/invite',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting management-Invite participants-Invites participants to a meeting',
  accessTokens: ['user'],
  schema: {
    data: z.object({
      invitees: z
        .array(
          z.object({
            id: z.string().describe('User ID').optional(),
            user_type: z
              .number()
              .describe(
                'User type Options:1(lark_user Lark user),2(room_user Rooms user),3(doc_user Docs user),4(neo_user neo Feishu Meetings user),5(neo_guest_user neo Feishu Meetings guest),6(pstn_user PSTN user),7(sip_user SIP user)',
              )
              .optional(),
          }),
        )
        .describe('List of invited users [Up to 10 people can be invited at one time]'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z
      .object({
        meeting_id: z
          .string()
          .describe('Meeting ID (Unique identifier of a video conference, generated after the conference is started)')
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1MeetingKickout = {
  project: 'vc',
  name: 'vc.v1.meeting.kickout',
  sdkName: 'vc.v1.meeting.kickout',
  path: '/open-apis/vc/v1/meetings/:meeting_id/kickout',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting management-Remove participants-Removes participants from a meeting',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      kickout_users: z
        .array(
          z.object({
            id: z.string().describe('User ID').optional(),
            user_type: z
              .number()
              .describe(
                'User type Options:1(lark_user Lark user),2(room_user Rooms user),3(doc_user Docs user),4(neo_user neo Feishu Meetings user),5(neo_guest_user neo Feishu Meetings guest),6(pstn_user PSTN user),7(sip_user SIP user)',
              )
              .optional(),
          }),
        )
        .describe('List of users to be removed'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ meeting_id: z.string().describe('Meeting ID').optional() }).optional(),
  },
};
export const vcV1MeetingListByNo = {
  project: 'vc',
  name: 'vc.v1.meeting.listByNo',
  sdkName: 'vc.v1.meeting.listByNo',
  path: '/open-apis/vc/v1/meetings/list_by_no',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting management-List meetings of same meeting number-Obtains the meeting brief list associated with the meeting number for a specified time period (within 90 days)',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      meeting_no: z.string().describe('9-digit meeting number'),
      start_time: z.string().describe('Query start time (unix time in sec)'),
      end_time: z.string().describe('Query end time (unix time in sec)'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.number().optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1MeetingRecordingGet = {
  project: 'vc',
  name: 'vc.v1.meetingRecording.get',
  sdkName: 'vc.v1.meetingRecording.get',
  path: '/open-apis/vc/v1/meetings/:meeting_id/recording',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting record-Obtain recording files-Obtain recording files of a meeting.',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z
      .object({
        meeting_id: z
          .string()
          .describe('Meeting ID (Unique identifier of a video conference, generated after the conference is started)')
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1MeetingRecordingSetPermission = {
  project: 'vc',
  name: 'vc.v1.meetingRecording.setPermission',
  sdkName: 'vc.v1.meetingRecording.setPermission',
  path: '/open-apis/vc/v1/meetings/:meeting_id/recording/set_permission',
  httpMethod: 'PATCH',
  description:
    "[Feishu/Lark]-Video Conferencing-Meeting record-Authorize recording files-Authorizes a meeting's recording files to an organization/user or makes them public to the public network",
  accessTokens: ['user'],
  schema: {
    data: z.object({
      permission_objects: z
        .array(
          z.object({
            id: z.string().describe('Authorization object ID').optional(),
            type: z
              .number()
              .describe(
                'Authorization object type Options:1(User User authorization (fill in the user ID in the id field)),2(Group Group authorization (fill in the group open_chat_id in the id field)),3(Tenant In-tenant authorization (id field not filled in)),4(Public Public network authorization (id field is not filled in))',
              ),
            permission: z.number().describe('permission Options:1(View)'),
          }),
        )
        .describe('List of authorized objects'),
      action_type: z
        .number()
        .describe(
          'Authorize or cancel authorization, default authorization Options:0(authorize authorization),1(revoke Cancel authorization)',
        )
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z
      .object({
        meeting_id: z
          .string()
          .describe(
            'Meeting ID (unique identifier of the video conference, which will not be generated until the video conference starts)',
          )
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1MeetingRecordingStart = {
  project: 'vc',
  name: 'vc.v1.meetingRecording.start',
  sdkName: 'vc.v1.meetingRecording.start',
  path: '/open-apis/vc/v1/meetings/:meeting_id/recording/start',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Video Conferencing-Meeting record-Start recording-Start recording in a meeting.',
  accessTokens: ['user'],
  schema: {
    data: z
      .object({
        timezone: z.number().describe('Time zone used for displaying the file recording time [-12,12]').optional(),
      })
      .optional(),
    path: z
      .object({
        meeting_id: z
          .string()
          .describe('Meeting ID (Unique identifier of video conference, generated after the conference is started)')
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1MeetingRecordingStop = {
  project: 'vc',
  name: 'vc.v1.meetingRecording.stop',
  sdkName: 'vc.v1.meetingRecording.stop',
  path: '/open-apis/vc/v1/meetings/:meeting_id/recording/stop',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Video Conferencing-Meeting record-Stop recording-Stop recording in the meeting.',
  accessTokens: ['user'],
  schema: {
    path: z
      .object({
        meeting_id: z
          .string()
          .describe('Meeting ID (Unique identifier of a video conference, generated after the conference is started)')
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1MeetingSetHost = {
  project: 'vc',
  name: 'vc.v1.meeting.setHost',
  sdkName: 'vc.v1.meeting.setHost',
  path: '/open-apis/vc/v1/meetings/:meeting_id/set_host',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Video Conferencing-Meeting management-Set meeting host-Sets a host for a meeting',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      host_user: z
        .object({
          id: z.string().describe('User ID').optional(),
          user_type: z
            .number()
            .describe(
              'User type Options:1(lark_user Lark user),2(room_user Rooms user),3(doc_user Docs user),4(neo_user neo Feishu Meetings user),5(neo_guest_user neo Feishu Meetings guest),6(pstn_user PSTN user),7(sip_user SIP user)',
            )
            .optional(),
        })
        .describe('The user to be set as the host'),
      old_host_user: z
        .object({
          id: z.string().describe('User ID').optional(),
          user_type: z
            .number()
            .describe(
              'User type Options:1(lark_user Lark user),2(room_user Rooms user),3(doc_user Docs user),4(neo_user neo Feishu Meetings user),5(neo_guest_user neo Feishu Meetings guest),6(pstn_user PSTN user),7(sip_user SIP user)',
            )
            .optional(),
        })
        .describe(
          'Current host (CAS concurrency security: If this field is inconsistent with the current host in the meeting, the setting will fail. Try again by using the latest returned data.)',
        )
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z
      .object({
        meeting_id: z
          .string()
          .describe('Meeting ID (Unique identifier of a video conference, generated after the conference is started)')
          .optional(),
      })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1ParticipantListGet = {
  project: 'vc',
  name: 'vc.v1.participantList.get',
  sdkName: 'vc.v1.participantList.get',
  path: '/open-apis/vc/v1/participant_list',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting data-Get participant details-Get participant details. For specific permission requirements, please refer to "Resource introduction"',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      meeting_start_time: z.string().describe('Meeting start time(unix time,unit second)'),
      meeting_end_time: z
        .string()
        .describe(
          'Meeting end time (Unix time, unit sec, if the meeting is in progress, fill in the current time, otherwise fill in the accurate meeting end time)',
        ),
      meeting_status: z
        .number()
        .describe(
          'Meeting status (defaults to ended meeting if not passed on) Options:1(ongoing in progress),2(past It has ended.),3(future to be held)',
        )
        .optional(),
      meeting_no: z.string().describe('Meeting number'),
      user_id: z.string().describe('User ID').optional(),
      room_id: z.string().describe('Room ID').optional(),
      page_size: z.number().describe('paging size').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1ParticipantQualityListGet = {
  project: 'vc',
  name: 'vc.v1.participantQualityList.get',
  sdkName: 'vc.v1.participantQualityList.get',
  path: '/open-apis/vc/v1/participant_quality_list',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting data-Get participant meeting quality data-Get participant meeting quality data.(Only supports ended meetings) For specific permission requirements, please refer to "Resource introduction"',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      meeting_start_time: z
        .string()
        .describe('Meeting start time(need to be accurate to the minute,unix time,unit second)'),
      meeting_end_time: z.string().describe('Meeting end time'),
      meeting_no: z.string().describe('Meeting number'),
      join_time: z
        .string()
        .describe('Time of joining the meeting.It can be obtained from the results returned by "Participant Details"'),
      user_id: z
        .string()
        .describe(
          'User ID.Fill in when the participant is a Lark user, and room_id and user_id must be filled in only one',
        )
        .optional(),
      room_id: z
        .string()
        .describe('Room ID.Fill in when the participant is a Room, and room_id and user_id must be filled in only one')
        .optional(),
      page_size: z.number().optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1ReportGetDaily = {
  project: 'vc',
  name: 'vc.v1.report.getDaily',
  sdkName: 'vc.v1.report.getDaily',
  path: '/open-apis/vc/v1/reports/get_daily',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Video Conferencing-Meeting report-Obtain meeting reports-Obtains an organizations' daily meeting usage reports for a period of time",
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      start_time: z.string().describe('Start time (unix time in sec)'),
      end_time: z.string().describe('End time (unix time in sec)'),
      unit: z
        .number()
        .describe(
          'Data residency (the premise of parameter transfer is that the tenant has multiple residency data and the query function is enabled) Options:0(CN Chinese mainland),1(VA United States),2(SG Singapore),3(JP Japan)',
        )
        .optional(),
    }),
  },
};
export const vcV1ReportGetTopUser = {
  project: 'vc',
  name: 'vc.v1.report.getTopUser',
  sdkName: 'vc.v1.report.getTopUser',
  path: '/open-apis/vc/v1/reports/get_top_user',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting report-Get top user list-Obtains the list of top users who use the Meetings feature most in an organization for a period of time',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      start_time: z.string().describe('Start time (unix time in sec)'),
      end_time: z.string().describe('End time (unix time in sec)'),
      limit: z.number().describe('Number of users to be obtained'),
      order_by: z
        .number()
        .describe(
          'Sorting criteria (descending) Options:1(meeting_count Number of meetings),2(meeting_duration Meeting duration)',
        ),
      unit: z
        .number()
        .describe(
          'Data residency (the premise of parameter transfer is that the tenant has multiple residency data and the query function is enabled) Options:0(CN Chinese mainland),1(VA United States),2(SG Singapore),3(JP Japan)',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
  },
};
export const vcV1ReserveConfigAdminGet = {
  project: 'vc',
  name: 'vc.v1.reserveConfigAdmin.get',
  sdkName: 'vc.v1.reserveConfigAdmin.get',
  path: '/open-apis/vc/v1/reserve_configs/:reserve_config_id/admin',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Video Conferencing-Meeting room configuration-Get reserve admin-Get reserve admin',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      scope_type: z.number().describe('1 means room level, 2 means room'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({ reserve_config_id: z.string().describe('Room ID or room level ID').optional() }).optional(),
  },
};
export const vcV1ReserveConfigAdminPatch = {
  project: 'vc',
  name: 'vc.v1.reserveConfigAdmin.patch',
  sdkName: 'vc.v1.reserveConfigAdmin.patch',
  path: '/open-apis/vc/v1/reserve_configs/:reserve_config_id/admin',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Video Conferencing-Meeting room configuration-Update reserve admin-Update reserve admin',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      scope_type: z.number().describe('1 means room level, 2 means room'),
      reserve_admin_config: z
        .object({
          depts: z
            .array(z.object({ department_id: z.string().describe('Reserve admin department ID') }))
            .describe('Reserve admin departments')
            .optional(),
          users: z
            .array(z.object({ user_id: z.string().describe('Reserve admin user ID') }))
            .describe('Reserve admin users')
            .optional(),
        })
        .describe('Reserve admin configuration'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ reserve_config_id: z.string().describe('Room level ID or Room ID').optional() }).optional(),
  },
};
export const vcV1ReserveConfigDisableInformGet = {
  project: 'vc',
  name: 'vc.v1.reserveConfigDisableInform.get',
  sdkName: 'vc.v1.reserveConfigDisableInform.get',
  path: '/open-apis/vc/v1/reserve_configs/:reserve_config_id/disable_inform',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room configuration-Get disable status change notifications-Get disable status change notifications',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      scope_type: z.number().describe('1 means level, 2 means room'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      reserve_config_id: z
        .string()
        .describe('Room or level ID which can be obtained by room or level related query interface'),
    }),
  },
};
export const vcV1ReserveConfigDisableInformPatch = {
  project: 'vc',
  name: 'vc.v1.reserveConfigDisableInform.patch',
  sdkName: 'vc.v1.reserveConfigDisableInform.patch',
  path: '/open-apis/vc/v1/reserve_configs/:reserve_config_id/disable_inform',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room configuration-Update disable status change notifications-Update disable status change notifications',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      scope_type: z.number().describe('1 means room level, 2 means room'),
      disable_inform: z
        .object({
          if_cover_child_scope: z.boolean().describe('Whether to cover sub-levels and meeting rooms').optional(),
          if_inform: z.boolean().describe('Disable status change notification switch'),
          informed_users: z
            .array(z.object({ user_id: z.string().describe('Reserve admin user ID') }))
            .describe('Notify member list')
            .optional(),
          informed_depts: z
            .array(z.object({ department_id: z.string().describe('Reserve admin department ID') }))
            .describe('Notification departments list')
            .optional(),
        })
        .describe('Configuration for disable status change notifications'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ reserve_config_id: z.string().describe('Room or level ID') }),
  },
};
export const vcV1ReserveConfigFormGet = {
  project: 'vc',
  name: 'vc.v1.reserveConfigForm.get',
  sdkName: 'vc.v1.reserveConfigForm.get',
  path: '/open-apis/vc/v1/reserve_configs/:reserve_config_id/form',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Video Conferencing-Meeting room configuration-Get reserve form-Get reserve form',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      scope_type: z.number().describe('1 means room level, 2 means room'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({ reserve_config_id: z.string().describe('room or room level ID').optional() }).optional(),
  },
};
export const vcV1ReserveConfigFormPatch = {
  project: 'vc',
  name: 'vc.v1.reserveConfigForm.patch',
  sdkName: 'vc.v1.reserveConfigForm.patch',
  path: '/open-apis/vc/v1/reserve_configs/:reserve_config_id/form',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Video Conferencing-Meeting room configuration-Update reserve form-Update reserve form',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      scope_type: z.number().describe('1 means room level, 2 means room'),
      reserve_form_config: z
        .object({
          if_cover_child_scope: z.boolean().describe('need cover child scope').optional(),
          reserve_form: z.boolean().describe('Reserve form switch, true means open, false means close'),
          notified_users: z
            .array(z.object({ user_id: z.string().describe('Reserve admin user ID') }))
            .describe('List of notifiers')
            .optional(),
          notified_time: z
            .number()
            .describe(
              'notified_time that no later than the start of the meeting when receiving the notification (unit: minute/hour/day)',
            )
            .optional(),
          time_unit: z.number().describe('Time unit, 1 is minute; 2 is hour; 3 is day, default is day').optional(),
        })
        .describe('Reserve form configuration'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ reserve_config_id: z.string().describe('Room ID or room level ID').optional() }).optional(),
  },
};
export const vcV1ReserveConfigPatch = {
  project: 'vc',
  name: 'vc.v1.reserveConfig.patch',
  sdkName: 'vc.v1.reserveConfig.patch',
  path: '/open-apis/vc/v1/reserve_configs/:reserve_config_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room configuration-Update reserve limitation-Update reserve limitation',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      scope_type: z.string().describe('1 means level, 2 means room'),
      approval_config: z
        .object({
          approval_switch: z
            .number()
            .describe(
              'approval_switch: 0 means closed, 1 means open.<b>Note</b>: 1. If the value is not set, the value of the original switch will not be updated, but the approval_condition is required at this time2. When the value is set to 1, approval_condition is required3. When the value is set to 0, other fields of the entire approval_config can be omitted',
            )
            .optional(),
          approval_condition: z
            .number()
            .describe(
              'approval_condition: 0 means that all reservations require approval, 1 means that approval is required for those that meet the conditions<b>Note</b>: meeting_duration is required when approval_condition is 1',
            )
            .optional(),
          meeting_duration: z
            .number()
            .describe(
              'bookings exceeding meeting_duration need to be approved (unit: hour, value range [0.1-99])<b>Note</b>: 1. When the approval_condition is 0, if the value is not set when updating, the default update is 99.2. If the incoming value exceeds 2 decimal places, it will be automatically rounded to the nearest 2 digits',
            )
            .optional(),
          approvers: z
            .array(z.object({ user_id: z.string().describe('Reserve admin user ID') }))
            .describe('Approvers list, when the approval_switch is 1, at least one approver needs to be set')
            .optional(),
        })
        .describe('reservation approval settings')
        .optional(),
      time_config: z
        .object({
          if_cover_child_scope: z.boolean().describe('Whether to cover sub-levels and meeting rooms').optional(),
          time_switch: z.number().describe('reservation time switch: 0 for off, 1 for on'),
          days_in_advance: z
            .number()
            .describe(
              'the earliest time when the conference room can be reserved in advance (unit: day, value range [1-730])<b>Note</b>: When not filled in, the default update is 365',
            )
            .optional(),
          opening_hour: z
            .string()
            .describe(
              'You can start booking from opening_hour on the opening day (unit: second, value range [0,86400])<b>Note</b>: 1. If not filled in, it will be updated to 28800 by default2. If the filled value is not a multiple of 60, it will be automatically updated to the nearest integer multiple of 60',
            )
            .optional(),
          start_time: z
            .string()
            .describe(
              'The start time of the daily scheduled time range (unit: second, value range [0,86400])<b>Note</b>: 1. When not filled in, it will be updated to 0 by default, and the end_time filled in at this time must not be less than 30.2. When both start_time and end_time are filled in, end_time should be at least 30 times longer than start_time.3. If the filled value is not a multiple of 60, it will be automatically updated to the nearest integer multiple of 60',
            )
            .optional(),
          end_time: z
            .string()
            .describe(
              'End time of daily pre-determinable time range (unit: second, value range [0,86400])<b>Note</b>: 1. When not filled in, the default update is 86400, and the start_time filled in at this time must not be greater than or equal to 86370.2. When both start_time and end_time are filled in, end_time must be at least 30 longer than start_time.3. If the filled value is not a multiple of 60, it will be automatically updated to the nearest integer multiple of 60',
            )
            .optional(),
          max_duration: z
            .number()
            .describe(
              'The upper limit of the duration of a single conference room reservation (unit: hour, value range [1,99])<b>Note</b>: The default update is 2 when not filled in',
            )
            .optional(),
        })
        .describe('reservation time settings')
        .optional(),
      reserve_scope_config: z
        .object({
          if_cover_child_scope: z.boolean().describe('Whether to cover sub-levels and meeting rooms').optional(),
          allow_all_users: z
            .number()
            .describe(
              'The range of members that can book conference: 0 for some members, 1 for all members.<b>Note</b>: 1. This value is required.2. When set to 0, at least 1 reservation department or reservation person is required',
            )
            .optional(),
          allow_users: z
            .array(z.object({ user_id: z.string().describe('Reserve admin user ID') }))
            .describe('List of available members')
            .optional(),
          allow_depts: z
            .array(z.object({ department_id: z.string().describe('Reserve admin department ID') }))
            .describe('List of available departments')
            .optional(),
        })
        .describe('reservation range settings')
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ reserve_config_id: z.string().describe('room id or room level id') }),
  },
};
export const vcV1ReserveConfigReserveScope = {
  project: 'vc',
  name: 'vc.v1.reserveConfig.reserveScope',
  sdkName: 'vc.v1.reserveConfig.reserveScope',
  path: '/open-apis/vc/v1/reserve_configs/reserve_scope',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room configuration-Get reserve limitation-Get reserve limitation',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      scope_id: z.string().describe('room id or room level id'),
      scope_type: z.string().describe('1 means room level, 2 means room'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
  },
};
export const vcV1ReserveApply = {
  project: 'vc',
  name: 'vc.v1.reserve.apply',
  sdkName: 'vc.v1.reserve.apply',
  path: '/open-apis/vc/v1/reserves/apply',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Video Conferencing-Meeting reservation-Schedule a meeting-Creates a meeting scheduling',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      end_time: z
        .string()
        .describe('Expiration time (Unix time in seconds), which is required for multi-person meetings')
        .optional(),
      owner_id: z
        .string()
        .describe(
          'Assign meeting owner (Only take effect when using tenant_access_token. Will not take effect when using user_access_token). Must assign user with the same tenant',
        )
        .optional(),
      meeting_settings: z
        .object({
          topic: z.string().describe('Meeting topic').optional(),
          action_permissions: z
            .array(
              z.object({
                permission: z
                  .number()
                  .describe(
                    'Permission options Options:1(can_be_host Whether a participant can be a host),2(can_invite Whether a participant can invite other participants),3(can_join Whether a participant can join a meeting)',
                  ),
                permission_checkers: z
                  .array(
                    z.object({
                      check_field: z
                        .number()
                        .describe(
                          'Type of the fields to be checked Options:1(user_id User ID (check_list fill in the user ID)),2(user_type User type (check_list optional values are"1": lark user,"2": rooms users,"6": pstn users,"7": sip user)),3(tenant_id Tenant ID (check_list fill in the tenant_key))',
                        ),
                      check_mode: z
                        .number()
                        .describe(
                          'Check method Options:1(within Being in the check_list indicates that the participant has the permission (allowlist)),2(without Not being in the check_list indicates that the participant has the permission (blocklist))',
                        ),
                      check_list: z
                        .array(z.string())
                        .describe(
                          'Check the list of fields (fill in the corresponding content according to the type of check_field)',
                        ),
                    }),
                  )
                  .describe(
                    'List of permission checkers. The relationship between permission checkers is "Logical OR" (that is, the permission is obtained if any one of them is true)',
                  ),
              }),
            )
            .describe(
              'List of permission configurations for a meeting. If the same configuration option exists, the relationship between them is "Logical OR" (that is, the permission is obtained if any one of them is true)',
            )
            .optional(),
          meeting_initial_type: z
            .number()
            .describe(
              'Initial type of meeting Options:1(group_meeting Multi-person meeting),2(call 1v1 calling(Only support PSTN))',
            )
            .optional(),
          meeting_connect: z
            .boolean()
            .describe(
              'Whether the meeting supports interoperability and does not support updates (Note: This field is in closed beta)',
            )
            .optional(),
          call_setting: z
            .object({
              callee: z
                .object({
                  id: z.string().describe('User ID').optional(),
                  user_type: z
                    .number()
                    .describe(
                      'User type. Only user type 6 (PSTN user) is supported. Options:1(lark_user Lark user),2(room_user Rooms user),3(doc_user Docs user),4(neo_user neo Feishu Meetings user),5(neo_guest_user neo Feishu Meetings guest),6(pstn_user PSTN user),7(sip_user SIP user)',
                    ),
                  pstn_sip_info: z
                    .object({
                      nickname: z.string().describe('Temporary nickname set for a PSTN/SIP user').optional(),
                      main_address: z
                        .string()
                        .describe(
                          'PSTN/SIP host number, in the format of [International Access Code]-[Area Code][Phone Number]. Only domestic mobile numbers and fixed-line telephone numbers are supported',
                        ),
                    })
                    .describe('PSTN/SIP information')
                    .optional(),
                })
                .describe('User being called'),
            })
            .describe('1v1 calling related parameters')
            .optional(),
          auto_record: z
            .boolean()
            .describe('Whether to enable automatic recording when using Feishu video conference, the default is false')
            .optional(),
          assign_host_list: z
            .array(
              z.object({
                user_type: z.number().describe('User type Options:1(lark_user Lark user)').optional(),
                id: z.string().describe('User ID').optional(),
              }),
            )
            .describe('Assign host list params')
            .optional(),
          password: z
            .string()
            .describe(
              "Set the meeting password. If you don't pass it, it will decide whether to use the password and assign a random password according to your personal settings. If you pass it empty, it will not use the password. If you pass 4-9 digits, it will set the password",
            )
            .optional(),
        })
        .describe('Meeting settings'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1ReserveDelete = {
  project: 'vc',
  name: 'vc.v1.reserve.delete',
  sdkName: 'vc.v1.reserve.delete',
  path: '/open-apis/vc/v1/reserves/:reserve_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Video Conferencing-Meeting reservation-Delete a schedule-Deletes a schedule',
  accessTokens: ['tenant', 'user'],
  schema: {
    path: z
      .object({ reserve_id: z.string().describe('Schedule ID (unique identifier for a schedule)').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1ReserveGet = {
  project: 'vc',
  name: 'vc.v1.reserve.get',
  sdkName: 'vc.v1.reserve.get',
  path: '/open-apis/vc/v1/reserves/:reserve_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting reservation-Obtain a schedule-Obtains details about a schedule',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z
      .object({ reserve_id: z.string().describe('Schedule ID (unique identifier of a schedule)').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1ReserveGetActiveMeeting = {
  project: 'vc',
  name: 'vc.v1.reserve.getActiveMeeting',
  sdkName: 'vc.v1.reserve.getActiveMeeting',
  path: '/open-apis/vc/v1/reserves/:reserve_id/get_active_meeting',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting reservation-Obtain an active meeting-Obtains a scheduled meeting that is currently active',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        with_participants: z
          .boolean()
          .describe('Whether the participant list is required. The default value is false')
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z
      .object({ reserve_id: z.string().describe('Schedule ID (unique identifier for a schedule)').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1ReserveUpdate = {
  project: 'vc',
  name: 'vc.v1.reserve.update',
  sdkName: 'vc.v1.reserve.update',
  path: '/open-apis/vc/v1/reserves/:reserve_id',
  httpMethod: 'PUT',
  description: '[Feishu/Lark]-Video Conferencing-Meeting reservation-Update a schedule-Updates a schedule',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        end_time: z.string().describe('Expiration time (Unix time in seconds)').optional(),
        meeting_settings: z
          .object({
            topic: z.string().describe('Meeting topic').optional(),
            action_permissions: z
              .array(
                z.object({
                  permission: z
                    .number()
                    .describe(
                      'Permission options Options:1(can_be_host Whether a participant can be a host),2(can_invite Whether a participant can invite other participants),3(can_join Whether a participant can join a meeting)',
                    ),
                  permission_checkers: z
                    .array(
                      z.object({
                        check_field: z
                          .number()
                          .describe(
                            'Type of the fields to be checked Options:1(user_id User ID (check_list fill in the user ID)),2(user_type User type (check_list optional values are"1": lark user,"2": rooms users,"6": pstn users,"7": sip user)),3(tenant_id Tenant ID (check_list fill in the tenant_key))',
                          ),
                        check_mode: z
                          .number()
                          .describe(
                            'Check method Options:1(within Being in the check_list indicates that the participant has the permission (allowlist)),2(without Not being in the check_list indicates that the participant has the permission (blocklist))',
                          ),
                        check_list: z
                          .array(z.string())
                          .describe(
                            'Check the list of fields (fill in the corresponding content according to the type of check_field)',
                          ),
                      }),
                    )
                    .describe(
                      'List of permission checkers. The relationship between permission checkers is "Logical OR" (that is, the permission is obtained if any one of them is true)',
                    ),
                }),
              )
              .describe(
                'List of permission configurations for a meeting. If the same configuration option exists, the relationship between them is "Logical OR" (that is, the permission is obtained if any one of them is true)',
              )
              .optional(),
            meeting_initial_type: z
              .number()
              .describe('Initial type of meeting Options:1(group_meeting Multi-person meeting),2(call 1v1 calling)')
              .optional(),
            meeting_connect: z
              .boolean()
              .describe(
                'Whether the meeting supports interoperability and does not support updates (Note: This field is in closed beta)',
              )
              .optional(),
            call_setting: z
              .object({
                callee: z
                  .object({
                    id: z.string().describe('User ID').optional(),
                    user_type: z
                      .number()
                      .describe(
                        'User type. Only user type 6 (PSTN user) is supported. Options:1(lark_user Lark user),2(room_user Rooms user),3(doc_user Docs user),4(neo_user neo Feishu Meetings user),5(neo_guest_user neo Feishu Meetings guest),6(pstn_user PSTN user),7(sip_user SIP user)',
                      ),
                    pstn_sip_info: z
                      .object({
                        nickname: z.string().describe('Temporary nickname set for a PSTN/SIP user').optional(),
                        main_address: z
                          .string()
                          .describe(
                            'PSTN/SIP host number, in the format of [International Access Code]-[Area Code][Phone Number]. Only domestic mobile numbers and fixed-line telephone numbers are supported',
                          ),
                      })
                      .describe('PSTN/SIP information')
                      .optional(),
                  })
                  .describe('User being called'),
              })
              .describe('1v1 calling related parameters')
              .optional(),
            auto_record: z
              .boolean()
              .describe(
                'Whether to enable automatic recording when using Feishu video conference, the default is false',
              )
              .optional(),
            assign_host_list: z
              .array(
                z.object({
                  user_type: z.number().describe('User type Options:1(lark_user Lark user)').optional(),
                  id: z.string().describe('User ID').optional(),
                }),
              )
              .describe('Assign host list params')
              .optional(),
            password: z
              .string()
              .describe(
                "Set the meeting password. If you don't pass it, it will decide whether to use the password and assign a random password according to your personal settings. If you pass it empty, it will not use the password. If you pass 4-9 digits, it will set the password",
              )
              .optional(),
          })
          .describe('Meeting settings')
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z
      .object({ reserve_id: z.string().describe('Schedule ID (unique identifier of a schedule)').optional() })
      .optional(),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1ResourceReservationListGet = {
  project: 'vc',
  name: 'vc.v1.resourceReservationList.get',
  sdkName: 'vc.v1.resourceReservationList.get',
  path: '/open-apis/vc/v1/resource_reservation_list',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting data-Get meeting room reservation data-Get meeting room reservation data. For specific permission requirements, please refer to "Resource introduction"',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      room_level_id: z
        .string()
        .describe(
          'Room level ID, if pass an exception ID that is not prefixed with omb, the tenant level will be used by default for evasion',
        ),
      need_topic: z.boolean().describe('Whether the response returns meeting topic').optional(),
      start_time: z.string().describe('Start time'),
      end_time: z.string().describe('End time'),
      room_ids: z
        .array(z.string())
        .describe(
          'List of meeting room IDs. list. If multiple conference room IDs need to be passed, they need to be passed in the form of room_ids=aaaa&room_ids=bbbb&room_ids=cccc',
        ),
      is_exclude: z
        .boolean()
        .describe(
          'Whether exclude the list of meeting room IDs, the default is false; if it is false, the room list reservation data passed in the room_ids field is obtained; if it is true, the room list under the level is obtained based on the room_level_id field, and the rooms in the room_ids range are filtered out to obtain the remaining rooms schedule data',
        )
        .optional(),
      page_size: z.number().optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const vcV1RoomConfigQuery = {
  project: 'vc',
  name: 'vc.v1.roomConfig.query',
  sdkName: 'vc.v1.roomConfig.query',
  path: '/open-apis/vc/v1/room_configs/query',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Rooms-Rooms configuration-Query meeting room configuration-Queries room configurations within a scope',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      scope: z
        .number()
        .describe('Query node scope Options:1(tenant ),2(country_district ),3(city ),4(building ),5(floor ),6(room )'),
      country_id: z
        .string()
        .describe('The parameter is required when the country/region ID scope is 2 or 3')
        .optional(),
      district_id: z.string().describe('The parameter is required when the city ID scope is 3').optional(),
      building_id: z.string().describe('The parameter is required when the building ID scope is 4 or 5').optional(),
      floor_name: z.string().describe('The parameter is required when the floor scope is 5').optional(),
      room_id: z.string().describe('The parameter is required when the room ID scope is 6').optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
  },
};
export const vcV1RoomConfigSet = {
  project: 'vc',
  name: 'vc.v1.roomConfig.set',
  sdkName: 'vc.v1.roomConfig.set',
  path: '/open-apis/vc/v1/room_configs/set',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Rooms-Rooms configuration-Set up meeting room configuration-Sets room configurations within a scope',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      scope: z
        .number()
        .describe(
          'Set node scope Options:1(tenant),2(country_district Country/region),3(city),4(building),5(floor),6(room)',
        ),
      country_id: z
        .string()
        .describe('The parameter is required when the country/region ID scope is 2 or 3')
        .optional(),
      district_id: z.string().describe('The parameter is required when the city ID scope is 3').optional(),
      building_id: z.string().describe('The parameter is required when the building ID scope is 4 or 5').optional(),
      floor_name: z.string().describe('The parameter is required when the floor scope is 5').optional(),
      room_id: z.string().describe('The parameter is required when the room ID scope is 6').optional(),
      room_config: z
        .object({
          room_background: z.string().describe('Feishu room background').optional(),
          display_background: z.string().describe('Feishu sign board background').optional(),
          digital_signage: z
            .object({
              enable: z.boolean().describe('Enable digital label function or not').optional(),
              mute: z.boolean().describe('Whether to mute the video').optional(),
              start_display: z
                .number()
                .describe(
                  'Start playing n min after the meeting ends，should be between 1~720.(Only available for Feishu room digital labels)',
                )
                .optional(),
              stop_display: z
                .number()
                .describe(
                  'End playing n min before the meeting starts, should be between 1~720.(Only available for Feishu room digital labels)',
                )
                .optional(),
              materials: z
                .array(
                  z.object({
                    id: z
                      .string()
                      .describe('Material ID. When uploading a new material, the material ID needs to be set to empty')
                      .optional(),
                    name: z.string().describe('Material name').optional(),
                    material_type: z.number().describe('Material type Options:1(pic Image),2(video),3(gif)').optional(),
                    url: z.string().describe('Material URL').optional(),
                    duration: z.number().describe('Play duration (in sec), should be between 1~43200').optional(),
                    cover: z.string().describe('Material cover URL').optional(),
                    md5: z.string().describe('Material file md5').optional(),
                    vid: z.string().describe('Material file vid').optional(),
                    size: z.string().describe('Material desc').optional(),
                  }),
                )
                .describe('Material list')
                .optional(),
            })
            .describe('Feishu room digital labels')
            .optional(),
          room_box_digital_signage: z
            .object({
              enable: z.boolean().describe('Enable digital label function or not').optional(),
              mute: z.boolean().describe('Whether to mute the video').optional(),
              start_display: z
                .number()
                .describe(
                  'Start playing n min after the meeting ends，should be between 1~720.(Only available for Feishu room digital labels)',
                )
                .optional(),
              stop_display: z
                .number()
                .describe(
                  'End playing n min before the meeting starts, should be between 1~720.(Only available for Feishu room digital labels)',
                )
                .optional(),
              materials: z
                .array(
                  z.object({
                    id: z
                      .string()
                      .describe('Material ID. When uploading a new material, the material ID needs to be set to empty')
                      .optional(),
                    name: z.string().describe('Material name').optional(),
                    material_type: z.number().describe('Material type Options:1(pic Image),2(video),3(gif)').optional(),
                    url: z.string().describe('Material URL').optional(),
                    duration: z.number().describe('Play duration (in sec), should be between 1~43200').optional(),
                    cover: z.string().describe('Material cover URL').optional(),
                    md5: z.string().describe('Material file md5').optional(),
                    vid: z.string().describe('Material file vid').optional(),
                    size: z.string().describe('Material desc').optional(),
                  }),
                )
                .describe('Material list')
                .optional(),
            })
            .describe('Feishu room box digital signage')
            .optional(),
          room_status: z
            .object({
              status: z.boolean().describe('Available status of room'),
              disable_start_time: z.string().describe('Room disable start time').optional(),
              disable_end_time: z.string().describe('Room disable end time').optional(),
              disable_reason: z.string().describe('Room disable reason').optional(),
              contact_ids: z.array(z.string()).describe('Contact user ID').optional(),
              disable_notice: z.boolean().describe('Notice content sent to users when room disabled').optional(),
              resume_notice: z.boolean().describe('Notice content sent to contact users when room resumed').optional(),
            })
            .describe('Room status')
            .optional(),
        })
        .describe('Room settings'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const vcV1RoomConfigSetCheckboardAccessCode = {
  project: 'vc',
  name: 'vc.v1.roomConfig.setCheckboardAccessCode',
  sdkName: 'vc.v1.roomConfig.setCheckboardAccessCode',
  path: '/open-apis/vc/v1/room_configs/set_checkboard_access_code',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Rooms-Rooms configuration-set_checkboard_access_code-Create a scoped checkboard access code',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      scope: z
        .number()
        .describe(
          'set node scope Options:1(tenant),2(country_district Country/region),3(city),4(building),5(floor),6(room)',
        ),
      country_id: z.string().describe('This parameter is required when country ID scope is 2, 3').optional(),
      district_id: z.string().describe('This parameter is required when the city ID scope is 3').optional(),
      building_id: z.string().describe('This parameter is required when the building ID scope is 4 and 5').optional(),
      floor_name: z.string().describe('This parameter is required when the floor scope is 5').optional(),
      room_id: z.string().describe('This parameter is required when the meeting room ID scope is 6').optional(),
      valid_day: z.number().describe('valid date Options:1(day 1 day),7(week 7 days),30(month 30 days)'),
    }),
  },
};
export const vcV1RoomConfigSetRoomAccessCode = {
  project: 'vc',
  name: 'vc.v1.roomConfig.setRoomAccessCode',
  sdkName: 'vc.v1.roomConfig.setRoomAccessCode',
  path: '/open-apis/vc/v1/room_configs/set_room_access_code',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Rooms-Rooms configuration-set_room_access_code-Create a range of meeting room access codes',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      scope: z
        .number()
        .describe(
          'Set node range Options:1(tenant),2(country_district Country/region),3(city),4(building),5(floor),6(room)',
        ),
      country_id: z.string().describe('This parameter is required when the country ID scope is 2, 3').optional(),
      district_id: z.string().describe('This parameter is required when the city ID scope is 3').optional(),
      building_id: z.string().describe('This parameter is required when the building ID scope is 4, 5').optional(),
      floor_name: z.string().describe('This parameter is required when the floor scope is 5').optional(),
      room_id: z.string().describe('This parameter is required when the conference room ID scope is 6').optional(),
      valid_day: z.number().describe('Effective days Options:1(day 1 day),7(week 7 days),30(month 30 days)'),
    }),
  },
};
export const vcV1RoomLevelCreate = {
  project: 'vc',
  name: 'vc.v1.roomLevel.create',
  sdkName: 'vc.v1.roomLevel.create',
  path: '/open-apis/vc/v1/room_levels',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room level-Create room level-This API is used to create meeting room level',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z.string().describe('Room level name'),
      parent_id: z
        .string()
        .describe(
          'Parent room level ID**Note**: If you need to create a meeting room level at the tenant level (i.e. the root level), you can first call the [Query room level details] interface and pass the path parameter `room_level_id` to `0` for query. The `room_level_id` value in the returned result is the root level ID',
        ),
      custom_group_id: z.string().describe('Custom room level ID').optional(),
    }),
  },
};
export const vcV1RoomLevelDel = {
  project: 'vc',
  name: 'vc.v1.roomLevel.del',
  sdkName: 'vc.v1.roomLevel.del',
  path: '/open-apis/vc/v1/room_levels/del',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room level-Delete room level-This API is used to delete a specified meeting room level',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      room_level_id: z.string().describe('Room level ID'),
      delete_child: z.boolean().describe('Whether delete child room levels').optional(),
    }),
  },
};
export const vcV1RoomLevelGet = {
  project: 'vc',
  name: 'vc.v1.roomLevel.get',
  sdkName: 'vc.v1.roomLevel.get',
  path: '/open-apis/vc/v1/room_levels/:room_level_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room level-Query room level details-This API is used to query a specified meeting room level details by room level ID',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ room_level_id: z.string().describe('Queries the ID of specifed meeting room level') }),
  },
};
export const vcV1RoomLevelList = {
  project: 'vc',
  name: 'vc.v1.roomLevel.list',
  sdkName: 'vc.v1.roomLevel.list',
  path: '/open-apis/vc/v1/room_levels',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room level-Query room level list-This API is used to query meeting room level list at a specified meeting room level',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        room_level_id: z.string().describe('Queries the ID of specifed meeting room level').optional(),
        page_size: z.number().optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
      })
      .optional(),
  },
};
export const vcV1RoomLevelMget = {
  project: 'vc',
  name: 'vc.v1.roomLevel.mget',
  sdkName: 'vc.v1.roomLevel.mget',
  path: '/open-apis/vc/v1/room_levels/mget',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room level-Batch query room level details-This API is used to query multi specified meeting room level details by room level IDs',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ level_ids: z.array(z.string()).describe('Room level IDs') }),
  },
};
export const vcV1RoomLevelPatch = {
  project: 'vc',
  name: 'vc.v1.roomLevel.patch',
  sdkName: 'vc.v1.roomLevel.patch',
  path: '/open-apis/vc/v1/room_levels/:room_level_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room level-Update room level-This API is used to update a specified meeting room level details',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z.string().describe('Room level name'),
      parent_id: z.string().describe('Parent room level ID'),
      custom_group_id: z.string().describe('Custom room level ID').optional(),
    }),
    path: z.object({ room_level_id: z.string().describe('Room level ID') }),
  },
};
export const vcV1RoomLevelSearch = {
  project: 'vc',
  name: 'vc.v1.roomLevel.search',
  sdkName: 'vc.v1.roomLevel.search',
  path: '/open-apis/vc/v1/room_levels/search',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room level-Search room level-This API is used to search meeting room level. Support custom room level ID to search',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({ custom_level_ids: z.string().describe('Custom room level IDs') }),
  },
};
export const vcV1RoomCreate = {
  project: 'vc',
  name: 'vc.v1.room.create',
  sdkName: 'vc.v1.room.create',
  path: '/open-apis/vc/v1/rooms',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room management-Create meeting room-This API is used to create meeting room',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z.string().describe('Room name'),
      capacity: z.number().describe('Room capacity'),
      description: z.string().describe('Room description').optional(),
      custom_room_id: z.string().describe('Custom room ID').optional(),
      room_level_id: z.string().describe('Parent room level ID'),
      room_status: z
        .object({
          status: z.boolean().describe('Available status of room'),
          schedule_status: z
            .boolean()
            .describe(
              'Future available status of room(Please ignore, this field is used to query the return value of the interface)',
            )
            .optional(),
          disable_start_time: z.string().describe('Room disable start time').optional(),
          disable_end_time: z.string().describe('Room disable end time').optional(),
          disable_reason: z.string().describe('Room disable reason').optional(),
          contact_ids: z.array(z.string()).describe('Contact user ID').optional(),
          disable_notice: z.boolean().describe('Notice content sent to users when room disabled').optional(),
          resume_notice: z.boolean().describe('Notice content sent to contact users when room resumed').optional(),
        })
        .describe('Room status')
        .optional(),
      device: z
        .array(z.object({ name: z.string().describe('device name') }))
        .describe('device information')
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const vcV1RoomDelete = {
  project: 'vc',
  name: 'vc.v1.room.delete',
  sdkName: 'vc.v1.room.delete',
  path: '/open-apis/vc/v1/rooms/:room_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room management-Delete meeting room-This API is used to delete a specified meeting room',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ room_id: z.string().describe('Room ID') }),
  },
};
export const vcV1RoomGet = {
  project: 'vc',
  name: 'vc.v1.room.get',
  sdkName: 'vc.v1.room.get',
  path: '/open-apis/vc/v1/rooms/:room_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room management-Query meeting room details-This API is used to query a specified meeting room details by room ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ room_id: z.string().describe('Room ID') }),
  },
};
export const vcV1RoomList = {
  project: 'vc',
  name: 'vc.v1.room.list',
  sdkName: 'vc.v1.room.list',
  path: '/open-apis/vc/v1/rooms',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room management-Query meeting room list-This API is used to query meeting room list at a specified meeting room level',
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
        room_level_id: z.string().describe('Queries the ID of specifed meeting room level').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const vcV1RoomMget = {
  project: 'vc',
  name: 'vc.v1.room.mget',
  sdkName: 'vc.v1.room.mget',
  path: '/open-apis/vc/v1/rooms/mget',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room management-Batch query meeting room details-This API is used to query multi specified meeting room details by room IDs',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ room_ids: z.array(z.string()).describe('Room IDs') }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const vcV1RoomPatch = {
  project: 'vc',
  name: 'vc.v1.room.patch',
  sdkName: 'vc.v1.room.patch',
  path: '/open-apis/vc/v1/rooms/:room_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room management-Update meeting room-This API is used to update a specified meeting room details',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        name: z.string().describe('Room name').optional(),
        capacity: z.number().describe('Room capacity').optional(),
        description: z.string().describe('Room description').optional(),
        custom_room_id: z.string().describe('Custom room ID').optional(),
        room_level_id: z.string().describe('Parent room level ID').optional(),
        room_status: z
          .object({
            status: z.boolean().describe('Available status of room'),
            schedule_status: z
              .boolean()
              .describe(
                'Future available status of room(Please ignore, this field is used to query the return value of the interface)',
              )
              .optional(),
            disable_start_time: z.string().describe('Room disable start time').optional(),
            disable_end_time: z.string().describe('Room disable end time').optional(),
            disable_reason: z.string().describe('Room disable reason').optional(),
            contact_ids: z.array(z.string()).describe('Contact user ID').optional(),
            disable_notice: z.boolean().describe('Notice content sent to users when room disabled').optional(),
            resume_notice: z.boolean().describe('Notice content sent to contact users when room resumed').optional(),
          })
          .describe('Room status')
          .optional(),
        device: z
          .array(z.object({ name: z.string().describe('device name') }))
          .describe('device information')
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ room_id: z.string().describe('Room ID') }),
  },
};
export const vcV1RoomSearch = {
  project: 'vc',
  name: 'vc.v1.room.search',
  sdkName: 'vc.v1.room.search',
  path: '/open-apis/vc/v1/rooms/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room management-Search meeting room-This API is used to search meeting room. Support keyword or custom room ID to search. This API only returned meeting rooms that user has reserve permission',
  accessTokens: ['user'],
  schema: {
    data: z
      .object({
        custom_room_ids: z.array(z.string()).describe('Custom room ID').optional(),
        keyword: z.string().describe('Search keyword(Used when custom room ID is empty)').optional(),
        room_level_id: z
          .string()
          .describe('Search room at this room level(Used when custom room ID is empty)')
          .optional(),
        search_level_name: z
          .boolean()
          .describe(
            'Search room that include room level name(Use keyword Parameter to search when custom room ID is empty）',
          )
          .optional(),
        page_size: z.number().describe('Page size(Used when custom room ID is empty)').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
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
export const vcV1ScopeConfigCreate = {
  project: 'vc',
  name: 'vc.v1.scopeConfig.create',
  sdkName: 'vc.v1.scopeConfig.create',
  path: '/open-apis/vc/v1/scope_config',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room configuration-Set room configuration-This API is used to set a scope of room level or a room configuration',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      scope_type: z.number().describe('Scope type Options:1(RoomLevel Room level),2(Room)'),
      scope_id: z.string().describe('Scope ID'),
      scope_config: z
        .object({
          room_background: z.string().describe('Feishu room background').optional(),
          display_background: z.string().describe('Feishu sign board background').optional(),
          digital_signage: z
            .object({
              if_cover_child_scope: z.boolean().describe('Whether to cover sub-levels and meeting rooms').optional(),
              enable: z.boolean().describe('Enable digital label function or not').optional(),
              mute: z.boolean().describe('Whether to mute the video').optional(),
              start_display: z
                .number()
                .describe(
                  'Start playing n min after the meeting ends，should be between 1~720.(Only available for Feishu room digital labels)',
                )
                .optional(),
              stop_display: z
                .number()
                .describe(
                  'End playing n min before the meeting starts, should be between 1~720.(Only available for Feishu room digital labels)',
                )
                .optional(),
              materials: z
                .array(
                  z.object({
                    id: z
                      .string()
                      .describe('Material ID. When uploading a new material, the material ID needs to be set to empty')
                      .optional(),
                    name: z.string().describe('Material name').optional(),
                    material_type: z.number().describe('Material type Options:1(pic Image),2(video),3(gif)').optional(),
                    url: z.string().describe('Material URL').optional(),
                    duration: z.number().describe('Play duration (in sec), should be between 1~43200').optional(),
                    cover: z.string().describe('Material cover URL').optional(),
                    md5: z.string().describe('Material file md5').optional(),
                    vid: z.string().describe('Material file vid').optional(),
                    size: z.string().describe('Material desc').optional(),
                  }),
                )
                .describe('Material list')
                .optional(),
            })
            .describe('Feishu room digital labels')
            .optional(),
          room_box_digital_signage: z
            .object({
              if_cover_child_scope: z.boolean().describe('Whether to cover sub-levels and meeting rooms').optional(),
              enable: z.boolean().describe('Enable digital label function or not').optional(),
              mute: z.boolean().describe('Whether to mute the video').optional(),
              start_display: z
                .number()
                .describe(
                  'Start playing n min after the meeting ends，should be between 1~720.(Only available for Feishu room digital labels)',
                )
                .optional(),
              stop_display: z
                .number()
                .describe(
                  'End playing n min before the meeting starts, should be between 1~720.(Only available for Feishu room digital labels)',
                )
                .optional(),
              materials: z
                .array(
                  z.object({
                    id: z
                      .string()
                      .describe('Material ID. When uploading a new material, the material ID needs to be set to empty')
                      .optional(),
                    name: z.string().describe('Material name').optional(),
                    material_type: z.number().describe('Material type Options:1(pic Image),2(video),3(gif)').optional(),
                    url: z.string().describe('Material URL').optional(),
                    duration: z.number().describe('Play duration (in sec), should be between 1~43200').optional(),
                    cover: z.string().describe('Material cover URL').optional(),
                    md5: z.string().describe('Material file md5').optional(),
                    vid: z.string().describe('Material file vid').optional(),
                    size: z.string().describe('Material desc').optional(),
                  }),
                )
                .describe('Material list')
                .optional(),
            })
            .describe('Feishu room box digital signage')
            .optional(),
          room_status: z
            .object({
              status: z.boolean().describe('Available status of room'),
              schedule_status: z
                .boolean()
                .describe(
                  'Future available status of room(Please ignore, this field is used to query the return value of the interface)',
                )
                .optional(),
              disable_start_time: z.string().describe('Room disable start time').optional(),
              disable_end_time: z.string().describe('Room disable end time').optional(),
              disable_reason: z.string().describe('Room disable reason').optional(),
              contact_ids: z.array(z.string()).describe('Contact user ID').optional(),
              disable_notice: z.boolean().describe('Notice content sent to users when room disabled').optional(),
              resume_notice: z.boolean().describe('Notice content sent to contact users when room resumed').optional(),
            })
            .describe('Room status')
            .optional(),
        })
        .describe('Room configuration of a scope')
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const vcV1ScopeConfigGet = {
  project: 'vc',
  name: 'vc.v1.scopeConfig.get',
  sdkName: 'vc.v1.scopeConfig.get',
  path: '/open-apis/vc/v1/scope_config',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Video Conferencing-Meeting room configuration-Query room configuration-This API is used to query a scope of room level or a room configuration',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      scope_type: z.number().describe('Scope type Options:1(RoomLevel Room level),2(Room)'),
      scope_id: z.string().describe('Scope ID'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
  },
};
export const vcV1Tools = [
  vcV1AlertList,
  vcV1ExportGet,
  vcV1ExportMeetingList,
  vcV1ExportParticipantList,
  vcV1ExportParticipantQualityList,
  vcV1ExportResourceReservationList,
  vcV1MeetingListGet,
  vcV1MeetingEnd,
  vcV1MeetingGet,
  vcV1MeetingInvite,
  vcV1MeetingKickout,
  vcV1MeetingListByNo,
  vcV1MeetingRecordingGet,
  vcV1MeetingRecordingSetPermission,
  vcV1MeetingRecordingStart,
  vcV1MeetingRecordingStop,
  vcV1MeetingSetHost,
  vcV1ParticipantListGet,
  vcV1ParticipantQualityListGet,
  vcV1ReportGetDaily,
  vcV1ReportGetTopUser,
  vcV1ReserveConfigAdminGet,
  vcV1ReserveConfigAdminPatch,
  vcV1ReserveConfigDisableInformGet,
  vcV1ReserveConfigDisableInformPatch,
  vcV1ReserveConfigFormGet,
  vcV1ReserveConfigFormPatch,
  vcV1ReserveConfigPatch,
  vcV1ReserveConfigReserveScope,
  vcV1ReserveApply,
  vcV1ReserveDelete,
  vcV1ReserveGet,
  vcV1ReserveGetActiveMeeting,
  vcV1ReserveUpdate,
  vcV1ResourceReservationListGet,
  vcV1RoomConfigQuery,
  vcV1RoomConfigSet,
  vcV1RoomConfigSetCheckboardAccessCode,
  vcV1RoomConfigSetRoomAccessCode,
  vcV1RoomLevelCreate,
  vcV1RoomLevelDel,
  vcV1RoomLevelGet,
  vcV1RoomLevelList,
  vcV1RoomLevelMget,
  vcV1RoomLevelPatch,
  vcV1RoomLevelSearch,
  vcV1RoomCreate,
  vcV1RoomDelete,
  vcV1RoomGet,
  vcV1RoomList,
  vcV1RoomMget,
  vcV1RoomPatch,
  vcV1RoomSearch,
  vcV1ScopeConfigCreate,
  vcV1ScopeConfigGet,
];
