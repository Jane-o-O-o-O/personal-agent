import { z } from 'zod';
export type attendanceV1ToolName =
  | 'attendance.v1.approvalInfo.process'
  | 'attendance.v1.archiveRule.delReport'
  | 'attendance.v1.archiveRule.list'
  | 'attendance.v1.archiveRule.uploadReport'
  | 'attendance.v1.archiveRule.userStatsFieldsQuery'
  | 'attendance.v1.group.create'
  | 'attendance.v1.group.delete'
  | 'attendance.v1.group.get'
  | 'attendance.v1.group.list'
  | 'attendance.v1.group.listUser'
  | 'attendance.v1.group.search'
  | 'attendance.v1.leaveAccrualRecord.patch'
  | 'attendance.v1.leaveEmployExpireRecord.get'
  | 'attendance.v1.shift.create'
  | 'attendance.v1.shift.delete'
  | 'attendance.v1.shift.get'
  | 'attendance.v1.shift.list'
  | 'attendance.v1.shift.query'
  | 'attendance.v1.userApproval.create'
  | 'attendance.v1.userApproval.query'
  | 'attendance.v1.userDailyShift.batchCreate'
  | 'attendance.v1.userDailyShift.batchCreateTemp'
  | 'attendance.v1.userDailyShift.query'
  | 'attendance.v1.userFlow.batchCreate'
  | 'attendance.v1.userFlow.batchDel'
  | 'attendance.v1.userFlow.get'
  | 'attendance.v1.userFlow.query'
  | 'attendance.v1.userSetting.modify'
  | 'attendance.v1.userSetting.query'
  | 'attendance.v1.userStatsData.query'
  | 'attendance.v1.userStatsField.query'
  | 'attendance.v1.userStatsView.query'
  | 'attendance.v1.userStatsView.update'
  | 'attendance.v1.userTaskRemedy.create'
  | 'attendance.v1.userTaskRemedy.query'
  | 'attendance.v1.userTaskRemedy.queryUserAllowedRemedys'
  | 'attendance.v1.userTask.query';
export const attendanceV1ApprovalInfoProcess = {
  project: 'attendance',
  name: 'attendance.v1.approvalInfo.process',
  sdkName: 'attendance.v1.approvalInfo.process',
  path: '/open-apis/attendance/v1/approval_infos/process',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance approval-Notify approval status update-For enterprises that only use Feishu Attendance but not Feishu Approval, through this interface, the approval status of the third-party system written in the Feishu Attendance can be updated such as leave, overtime, out of office, business trip, correction, etc. and the approval status including approve, reject, revoke, etc',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      approval_id: z
        .string()
        .describe(
          'Approval sample ID. How to access: 1) [Get Granted Approval Data] 2) [Write Approval Result] 3) [Notify of Correction Request Submission (in the case of correction)]',
        ),
      approval_type: z
        .string()
        .describe(
          "Approval type- 'leave': ask for leave- 'out': go out- 'Overtime': overtime- 'trip': business trip- 'remedy': replenish the card",
        ),
      status: z
        .number()
        .describe(
          'Approval status - `1`: rejected- `2`: approved- `4`: revoked**Notice**- **leave, out, overtime, and trip** only supports **revoked**- **remedy** supports **approved, rejected and revoked**',
        ),
    }),
  },
};
export const attendanceV1ArchiveRuleDelReport = {
  project: 'attendance',
  name: 'attendance.v1.archiveRule.delReport',
  sdkName: 'attendance.v1.archiveRule.delReport',
  path: '/open-apis/attendance/v1/archive_rule/del_report',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-archive_report-Delete archived report row data-Delete archived report row data directly by month, user, and archive rule ID',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      month: z.string().describe('Month, format yyyyMM'),
      operator_id: z.string().describe('Operator ID, corresponding employee_type'),
      archive_rule_id: z
        .string()
        .describe('Archive rule id, which can be obtained according to [Query all archive rules]'),
      user_ids: z.array(z.string()).describe('User ID, corresponding to employee_type').optional(),
    }),
    params: z.object({
      employee_type: z
        .string()
        .describe(
          "The user_ids in the request body and the employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email]* employee_id: employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details* employee_no: employee job number, that is, job number in [Feishu management background] > organizational structure > members and departments > member details",
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const attendanceV1ArchiveRuleList = {
  project: 'attendance',
  name: 'attendance.v1.archiveRule.list',
  sdkName: 'attendance.v1.archiveRule.list',
  path: '/open-apis/attendance/v1/archive_rule',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Attendance-archive_report-Query all archived reports-Query all archiving rules, corresponding to the background fake attendance management - attendance statistics - reports - [archived reports] function',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z
      .object({
        page_size: z.number().describe('Page size, required parameters').optional(),
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
export const attendanceV1ArchiveRuleUploadReport = {
  project: 'attendance',
  name: 'attendance.v1.archiveRule.uploadReport',
  sdkName: 'attendance.v1.archiveRule.uploadReport',
  path: '/open-apis/attendance/v1/archive_rule/upload_report',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-archive_report-Write archived report results-Write the results of the archived report, corresponding to the fake attendance management - attendance statistics - report - [archived report tab], click the import function after the report name is entered. You can directly write the data to the archived report',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      month: z.string().describe('Month in the format yyyyMM'),
      operator_id: z.string().describe('Operator ID, corresponding employee_type'),
      archive_report_datas: z
        .array(
          z.object({
            member_id: z.string().describe('User ID, corresponding employee_type'),
            start_time: z.string().describe('Attendance start time in the format yyyMMdd'),
            end_time: z.string().describe('Attendance end time in the format yyyMMdd'),
            field_datas: z
              .array(
                z.object({
                  code: z
                    .string()
                    .describe('Field code, which can be obtained according to [Query Archive Report Header]'),
                  value: z.string().describe('field result value').optional(),
                }),
              )
              .describe('Field results (no more than 200)')
              .optional(),
          }),
        )
        .describe('Archive report content (no more than 50)')
        .optional(),
      archive_rule_id: z
        .string()
        .describe('Archive rule id, which can be obtained according to [Query all archive rules]'),
    }),
    params: z.object({
      employee_type: z
        .string()
        .describe(
          "The user_ids in the request body and the employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email]* `employee_id`: employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details* `employee_no`: employee job number, that is, job number in [Feishu management background] > organizational structure > members and departments > member details",
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const attendanceV1ArchiveRuleUserStatsFieldsQuery = {
  project: 'attendance',
  name: 'attendance.v1.archiveRule.userStatsFieldsQuery',
  sdkName: 'attendance.v1.archiveRule.userStatsFieldsQuery',
  path: '/open-apis/attendance/v1/archive_rule/user_stats_fields_query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-archive_report-Query archived report header-Query the header of the archived report, corresponding to the background fake attendance management - attendance statistics - report - [archived report]. The archived report supports the reference system report, which can set the archived time and data archiving period, and supports the selection of personnel according to the department/personnel, country/region, personnel type, work location, rank, sequence, and position',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      locale: z
        .string()
        .describe('Language type. Default is zh.Optional values are:* `en`: English* `ja`: Japanese* `zh`: Chinese')
        .optional(),
      month: z.string().describe('Month, date format is yyyyMM'),
      archive_rule_id: z
        .string()
        .describe('Archive rule id, which can be obtained according to [Query all archive rules]'),
      operator_id: z.string().describe('Operator id, corresponding to employee_type'),
    }),
    params: z.object({
      employee_type: z
        .string()
        .describe(
          "The user_ids in the request body and the employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email]* `employee_id`: employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details* `employee_no`: employee job number, that is, job number in [Feishu management background] > organizational structure > members and departments > member details",
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const attendanceV1GroupCreate = {
  project: 'attendance',
  name: 'attendance.v1.group.create',
  sdkName: 'attendance.v1.group.create',
  path: '/open-apis/attendance/v1/groups',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance group-Create or modify attendance groups-The attendance team is a rule setting for the attendance of departments or employees in a specific place and within a specific time period (including commuting, arriving late, leaving early, sick leave, marriage leave, bereavement leave, public holidays, working hours, overtime, etc.).By setting the attendance group, you can set attendance methods, attendance time, attendance location and other attendance rules from the two dimensions of departments and employees.The corresponding function is the same as the settings - fake attendance settings - "new" function of [attendance group]',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      group: z
        .object({
          group_id: z
            .string()
            .describe(
              'Attendance group ID (only provided when modifying), you need to query the attendance group by name from [query attendance groups by name] or [query all attendance groups] Get groupId in the interface. If not, a new attendance group will be created',
            )
            .optional(),
          group_name: z.string().describe('attendance team name'),
          time_zone: z.string().describe('Time Zone'),
          bind_dept_ids: z
            .array(z.string())
            .describe(
              'The bound department ID (when used with need_punch_members, the current field shall prevail). Corresponds to dept_type',
            )
            .optional(),
          except_dept_ids: z.array(z.string()).describe('Excluded department ID (this field is offline)').optional(),
          bind_user_ids: z
            .array(z.string())
            .describe(
              'The bound user ID (when used with "need_punch_members", the current field shall prevail), corresponding to employee_type',
            )
            .optional(),
          except_user_ids: z.array(z.string()).describe('Excluded user ID (this field is offline)').optional(),
          group_leader_ids: z
            .array(z.string())
            .describe(
              'ID list of the main person in charge of attendance, required field (at least the administrator authority of the attendance group is required), corresponding to employee_type',
            ),
          sub_group_leader_ids: z
            .array(z.string())
            .describe('Attendance sub-responsible person ID list, corresponding to employee_type')
            .optional(),
          allow_out_punch: z
            .boolean()
            .describe('Whether to allow the clock in the field, the default is empty')
            .optional(),
          out_punch_need_approval: z
            .boolean()
            .describe(
              'The clock in the field needs to be approved (you need to allow the clock in the field to be set to take effect), the default is empty',
            )
            .optional(),
          out_punch_need_post_approval: z
            .boolean()
            .describe(
              'The clock in the field needs to be approved, and the clock in is approved first (you need to allow the clock in the field to be set to take effect)',
            )
            .optional(),
          out_punch_need_remark: z
            .boolean()
            .describe(
              'The field clock in needs to fill in the remarks (you need to allow the field clock in order to set it to take effect), the default is empty',
            )
            .optional(),
          out_punch_need_photo: z
            .boolean()
            .describe(
              'The clock in the field needs to be photographed (you need to allow the clock in the field to be set to take effect), the default is empty',
            )
            .optional(),
          out_punch_allowed_hide_addr: z
            .boolean()
            .describe(
              'Field clock in allows employees to hide detailed addresses (you need to allow field clock in to set it to take effect), the default is empty',
            )
            .optional(),
          out_punch_allowed_adjust_addr: z
            .boolean()
            .describe(
              'The field clock in allows fine-tuning of the address (you need to allow the field clock in order to set it to take effect)',
            )
            .optional(),
          adjust_range: z.number().describe('Fine-tuning range, default is 50 meters').optional(),
          allow_pc_punch: z.boolean().describe('Whether to allow the clock in the PC, the default is empty').optional(),
          allow_remedy: z.boolean().describe('Whether to limit replenishment cards, the default is empty').optional(),
          remedy_limit: z
            .boolean()
            .describe('Whether to limit the number of replenishment cards, the default is empty')
            .optional(),
          remedy_limit_count: z.number().describe('Number of replenishment cards, the default is empty').optional(),
          remedy_date_limit: z
            .boolean()
            .describe('Whether to limit the correction time, the default is empty')
            .optional(),
          remedy_date_num: z
            .number()
            .describe('Correction time, replenish the card within a few days, the default is empty')
            .optional(),
          allow_remedy_type_lack: z
            .boolean()
            .describe(
              'Allow missing card replenishment (you need to allow replenishment card to take effect), the default is empty',
            )
            .optional(),
          allow_remedy_type_late: z
            .boolean()
            .describe('Allow late replenishment (you need to allow replenishment to take effect), the default is empty')
            .optional(),
          allow_remedy_type_early: z
            .boolean()
            .describe(
              'Allow early refund and replenishment (you need to allow replenishment to take effect), the default is empty',
            )
            .optional(),
          allow_remedy_type_normal: z
            .boolean()
            .describe(
              'Allow normal replenishment (you need to allow replenishment to take effect), the default is empty',
            )
            .optional(),
          show_cumulative_time: z
            .boolean()
            .describe('Whether to display the accumulated time, the default is empty')
            .optional(),
          show_over_time: z.boolean().describe('Whether to show the overtime hours, the default is empty').optional(),
          hide_staff_punch_time: z
            .boolean()
            .describe('Whether to hide employee clock in detail, default to empty')
            .optional(),
          hide_clock_in_rule: z.boolean().describe('Hide the clock in action').optional(),
          face_punch: z
            .boolean()
            .describe('Whether to turn on the facial recognition clock in, the default is empty')
            .optional(),
          face_punch_cfg: z
            .number()
            .describe(
              'Facial recognition clock in rule, default to empty** Optional values are: *** 1: Need facial recognition in every clock* 2: Need facial recognition when clock in suspected cheating',
            )
            .optional(),
          face_live_need_action: z
            .boolean()
            .describe(
              'Face clock in rule, default is empty** Optional values are: *** false: indicates live verification is enabled* true: indicates action validation, only valid when face_punch_cfg = 1',
            )
            .optional(),
          face_downgrade: z
            .boolean()
            .describe('Whether to allow ordinary camera clock in facial recognition failure, the default is empty')
            .optional(),
          replace_basic_pic: z
            .boolean()
            .describe(
              'Whether to allow replacement of the base picture when facial recognition fails, the default is empty',
            )
            .optional(),
          anti_cheat_punch_config: z
            .object({
              intercept_suspected_cheat_punch: z
                .boolean()
                .describe(
                  'Whether to intercept the suspected cheating clock in, turn it off/not update by default when not passing in; when it is closed, the rest of the anti-cheating switches will be turned off',
                ),
              check_cheat_software_punch: z
                .boolean()
                .describe(
                  'Whether to check the clock in the suspected cheating software, and close/not update by default when not passing in',
                )
                .optional(),
              check_buddy_punch: z
                .boolean()
                .describe(
                  'Whether to check whether it is suspected that someone else clocked in on behalf of others, it will be closed/not updated by default when not passing in',
                )
                .optional(),
              check_simulate_wifi_punch: z
                .boolean()
                .describe(
                  'Whether to check the suspected simulated WI-FI clock in, turn off/not update by default when not passing in (only valid for grey release tenants, please contact technical support if you need to use it.)',
                )
                .optional(),
              check_change_device_punch: z
                .boolean()
                .describe(
                  'Whether to check the replacement device clock in, turn off/not update by default when not passing in',
                )
                .optional(),
              allow_change_device_num: z
                .number()
                .describe(
                  'The same member of the attendance team can bind up to the upper limit of the number of clocks in the device, and it is required to fill in the replacement device clock in the verification',
                )
                .optional(),
              suspected_cheat_handle_method: z
                .number()
                .describe(
                  'The processing method when the clock in suspected cheating is turned on. Required when the clock in suspected cheating is turned on Options:1(use_face_punch The clock in facial recognition),2(only_record_cheat_info Only record suspected cheating information)',
                )
                .optional(),
            })
            .describe(
              'Anti-cheat clock in configuration, off/not updated by default when not passing in (only valid for grey release tenants, please contact technical support if you need to use it.)',
            )
            .optional(),
          machines: z
            .array(
              z.object({
                machine_sn: z.string().describe('Attendance machine serial number'),
                machine_name: z.string().describe('attendance machine name'),
              }),
            )
            .describe('attendance machine list')
            .optional(),
          gps_range: z.number().describe('Valid range in GPS clock (history invalid field)').optional(),
          locations: z
            .array(
              z.object({
                location_name: z.string().describe('Address name'),
                location_type: z.number().describe('address type** Optional values are: *** 1: GPS* 2: Wi-Fi* 8: IP'),
                latitude: z.number().describe('address latitude').optional(),
                longitude: z.number().describe('Address longitude').optional(),
                ssid: z.string().describe('Wi-Fi name').optional(),
                bssid: z.string().describe('Wi-Fi MAC address').optional(),
                map_type: z.number().describe('Map Type, 1: Autonavi, 2: Google').optional(),
                address: z.string().describe('Address name').optional(),
                ip: z.string().describe('IP address').optional(),
                feature: z.string().describe('Additional information, such as carrier information').optional(),
                gps_range: z.number().describe('Valid range in GPS clock (history invalid field)').optional(),
              }),
            )
            .describe('Address list (appended only, does not overwrite the previous list)')
            .optional(),
          group_type: z
            .number()
            .describe('Attendance types** Optional values are: *** 1: Fixed shift* 2: scheduled shifts* 3: Free shift'),
          punch_day_shift_ids: z
            .array(z.string())
            .describe(
              'The fixed shift schedule must be filled in, and 7 must be filled in (from Monday to Sunday). Shift IDs can be obtained by [Query all shifts] and [Query shifts by name]',
            ),
          free_punch_cfg: z
            .object({
              free_start_time: z
                .string()
                .describe(
                  'The start time of the clock in the free shift system is x: 00 x: 00. Note that if the hour is less than 10:00, there is no need to add zeros',
                ),
              free_end_time: z
                .string()
                .describe(
                  'The end time of the clock in the free shift system is x: 00 x: 00. Note that if the hour is less than 10:00, there is no need to make up zero',
                ),
              punch_day: z
                .number()
                .describe(
                  'The time in the clock is 7 digits, each digit represents Monday to Sunday, 0 is not working, 1 is working',
                ),
              work_day_no_punch_as_lack: z
                .boolean()
                .describe(
                  'Whether the card is not punched on working days is recorded as a missing card, the default is empty',
                )
                .optional(),
              work_hours_demand: z
                .boolean()
                .describe(
                  'Whether the attendance on working days needs to meet the time requirements, the default is empty',
                )
                .optional(),
              work_hours: z.number().describe('Daily working hours (minutes), range [0,1440]').optional(),
            })
            .describe('Configuration free shift')
            .optional(),
          calendar_id: z
            .number()
            .describe(
              'National Calendar ID** Optional values are: *** 0: No holidays according to the national calendar* 1: Chinese mainland* 2: United States* 3: Japan* 4: India* 5: Singapore',
            ),
          need_punch_special_days: z
            .array(
              z.object({
                punch_day: z.number().describe('Clock in the format yyyMMdd'),
                shift_id: z
                  .string()
                  .describe('Shift ID, you can check all shifts according to [query]And [query shift by name] get'),
              }),
            )
            .describe('Special dates must be clocked in')
            .optional(),
          no_need_punch_special_days: z
            .array(
              z.object({
                punch_day: z.number().describe('Clock in the format yyyMMdd'),
                shift_id: z
                  .string()
                  .describe('Shift ID, you can check all shifts according to [query]And [query shift by name] get'),
              }),
            )
            .describe('No special dates in the clock')
            .optional(),
          work_day_no_punch_as_lack: z
            .boolean()
            .describe(
              'Whether the card is not punched on working days under the free shift system is recorded as a missing card, the default is empty',
            )
            .optional(),
          effect_now: z.boolean().describe('Whether it takes effect immediately, the default is false').optional(),
          remedy_period_type: z.number().describe('Refill card cycle type* 1: Monthly* 2: Customize').optional(),
          remedy_period_custom_date: z
            .number()
            .describe('Supplement card custom cycle start date, range 0-28')
            .optional(),
          punch_type: z
            .number()
            .describe(
              'Clock in type.Bit arithmetic, that is, if you need to set two clocks in 1 and 2, you need to pass in the addition value 3.** Optional value **:* 1: GPS clock in* 2: Wi-Fi clock in* 4: The clock in the attendance machine* 8: IP clock in',
            )
            .optional(),
          rest_clockIn_need_approval: z
            .boolean()
            .describe(
              'Rest day clock in requires approval. When setting rest_clockIn_need_approval = true, the start time of the rest day will be reset to 4:00. Default is empty',
            )
            .optional(),
          clockIn_need_photo: z.boolean().describe('Take a photo in each clock, the default is empty').optional(),
          member_status_change: z
            .object({
              onboarding_on_no_need_punch: z
                .boolean()
                .describe('Whether there is no need to clock in on the entry day, the default is empty')
                .optional(),
              onboarding_off_no_need_punch: z
                .boolean()
                .describe(
                  'Whether there is no need to clock in after get off work on the entry day, the default is empty',
                )
                .optional(),
              offboarding_on_no_need_punch: z
                .boolean()
                .describe('Whether the departure day does not need to be clocked in, the default is empty')
                .optional(),
              offboarding_off_no_need_punch: z
                .boolean()
                .describe('Whether the departure day does not need to be clocked in, the default is empty')
                .optional(),
            })
            .describe('Personnel clock in setup')
            .optional(),
          leave_need_punch: z
            .boolean()
            .describe('Whether you need to clock in for leave or return to work, the default is empty')
            .optional(),
          leave_need_punch_cfg: z
            .object({
              late_minutes_as_late: z
                .number()
                .describe('Arriving late for more than how long is recorded as late')
                .optional(),
              late_minutes_as_lack: z
                .number()
                .describe('More than how long is late will be recorded as a missing card')
                .optional(),
              early_minutes_as_early: z
                .number()
                .describe('If you leave early for longer than that, it will be recorded as leaving early')
                .optional(),
              early_minutes_as_lack: z
                .number()
                .describe('If you leave early for more than a long time, it will be recorded as a missing card')
                .optional(),
              not_during_shift: z
                .boolean()
                .describe(
                  'Leave in the middle of the shift, no need to clock in before leaving or after returning (only valid for grey release tenants, please contact technical support if you need to use it)',
                )
                .optional(),
            })
            .describe('Leave or return clock in minutes')
            .optional(),
          go_out_need_punch: z
            .number()
            .describe('Whether you need to clock in during going out, the default is empty')
            .optional(),
          go_out_need_punch_cfg: z
            .object({
              late_minutes_as_late: z
                .number()
                .describe('Arriving late for more than how long is recorded as late')
                .optional(),
              late_minutes_as_lack: z
                .number()
                .describe('More than how long is late will be recorded as a missing card')
                .optional(),
              early_minutes_as_early: z
                .number()
                .describe('If you leave early for longer than that, it will be recorded as leaving early')
                .optional(),
              early_minutes_as_lack: z
                .number()
                .describe('If you leave early for more than a long time, it will be recorded as a missing card')
                .optional(),
              not_during_shift: z
                .boolean()
                .describe(
                  'Out in the middle of the shift, no need to clock in before leaving or after returning (only valid for grey release tenants, please contact technical support if you need to use it)',
                )
                .optional(),
            })
            .describe('Whether the clock is required during the business trip, the default is empty')
            .optional(),
          travel_need_punch: z.number().describe('Rules of the clock in minutes during business trips').optional(),
          travel_need_punch_cfg: z
            .object({
              late_minutes_as_late: z
                .number()
                .describe('Arriving late for more than how long is recorded as late')
                .optional(),
              late_minutes_as_lack: z
                .number()
                .describe('More than how long is late will be recorded as a missing card')
                .optional(),
              early_minutes_as_early: z
                .number()
                .describe('If you leave early for longer than that, it will be recorded as leaving early')
                .optional(),
              early_minutes_as_lack: z
                .number()
                .describe(
                  'If you leave early for more than a long time, it will be recorded as a missing card, in minutes',
                )
                .optional(),
              not_during_shift: z
                .boolean()
                .describe(
                  'There is no need to clock in before leaving or after returning from business trips (business trips are not valid)',
                )
                .optional(),
            })
            .describe('Rules of the clock in minutes during business trips')
            .optional(),
          need_punch_members: z
            .array(
              z.object({
                rule_scope_type: z.number().describe("Circle method:* '0': none* '1': all* '2': custom").optional(),
                scope_group_list: z
                  .object({
                    scope_value_type: z
                      .number()
                      .describe(
                        '**Types**: * 1: Department* 2: Member * 3: Country or region* 4: Employee type* 5: Work base* 6: Job level* 7: Job family* 8: Position (CoreHR, Business Edition)* 9: Work schedule (CoreHR, Business Edition)* 100: Customized field (CoreHR, Business Edition)',
                      )
                      .optional(),
                    operation_type: z
                      .number()
                      .describe(
                        'Range type (whether it is included or not)* 1: Included* 2: Not included* 3: equal* 4: less than or equal to* 5: greater than or equal to* 6: greater than* 7: less than* 8: Not equal',
                      )
                      .optional(),
                    right: z
                      .array(
                        z.object({
                          key: z.string().describe('Identification Key').optional(),
                          name: z.string().describe('name').optional(),
                        }),
                      )
                      .describe('If it is a person/department type, this field is not required')
                      .optional(),
                    member_ids: z
                      .array(z.string())
                      .describe('List of department/person IDs (as determined by scope_value_type)')
                      .optional(),
                    custom_field_ID: z
                      .string()
                      .describe(
                        'Enterprise version custom field unique key ID, which needs to be obtained from Feishu personnel',
                      )
                      .optional(),
                    custom_field_obj_type: z
                      .string()
                      .describe(
                        'Enterprise Edition Custom Field Object Type* "Employment": master data object, employee employment information* "Person": master data object, individual',
                      )
                      .optional(),
                  })
                  .describe('List of circle rules')
                  .optional(),
              }),
            )
            .describe(
              'The set of people who need clock in (this field is only used if bind_dept_ids and bind_user_ids are not passed)',
            )
            .optional(),
          no_need_punch_members: z
            .array(
              z.object({
                rule_scope_type: z.number().describe("Circle method:* '0': none* '1': all* '2': custom").optional(),
                scope_group_list: z
                  .object({
                    scope_value_type: z
                      .number()
                      .describe(
                        '**Types**: * 1: Department* 2: Member * 3: Country or region* 4: Employee type* 5: Work base* 6: Job level* 7: Job family* 8: Position (CoreHR, Business Edition)* 9: Work schedule (CoreHR, Business Edition)* 100: Customized field (CoreHR, Business Edition)',
                      )
                      .optional(),
                    operation_type: z
                      .number()
                      .describe(
                        'Range type (whether it is included or not)* 1: Included* 2: Not included* 3: equal* 4: less than or equal to* 5: greater than or equal to* 6: greater than* 7: less than* 8: Not equal',
                      )
                      .optional(),
                    right: z
                      .array(
                        z.object({
                          key: z.string().describe('Identification Key').optional(),
                          name: z.string().describe('name').optional(),
                        }),
                      )
                      .describe('If it is a person/department type, this field is not required')
                      .optional(),
                    member_ids: z
                      .array(z.string())
                      .describe('List of department/person IDs (as determined by scope_value_type)')
                      .optional(),
                    custom_field_ID: z
                      .string()
                      .describe(
                        'Enterprise version custom field unique key ID, which needs to be obtained from Feishu personnel',
                      )
                      .optional(),
                    custom_field_obj_type: z
                      .string()
                      .describe(
                        'Enterprise Edition Custom Field Object Type* "Employment": master data object, employee employment information* "Person": master data object, individual',
                      )
                      .optional(),
                  })
                  .describe('List of circle rules')
                  .optional(),
              }),
            )
            .describe(
              'A collection of people without clock in (this field is only used if bind_default_dept_ids and bind_default_user_ids are not passed)',
            )
            .optional(),
          save_auto_changes: z
            .boolean()
            .describe(
              'Whether to allow the attendance group with conflicting personnel to be saved. If true, the conflicting personnel will be automatically pulled into the currently set attendance group and removed from the original attendance group; if false, the conflicting personnel need to be manually adjusted. Default is false',
            )
            .optional(),
          org_change_auto_adjust: z
            .boolean()
            .describe(
              'When a new employee is hired or personnel change, whether the eligible personnel will automatically join the attendance group. Default is empty',
            )
            .optional(),
          bind_default_dept_ids: z
            .array(z.string())
            .describe(
              'Participate in the list of department IDs that do not require clock in (when used with "no_need_punch_members", the current field shall prevail), corresponding to dept_type',
            )
            .optional(),
          bind_default_user_ids: z
            .array(z.string())
            .describe(
              'Participate in the list of person IDs without clock in (when used with "no_need_punch_members", the current field shall prevail), corresponding to employee_type',
            )
            .optional(),
          overtime_clock_cfg: z
            .object({
              allow_punch_approval: z
                .boolean()
                .describe(
                  'Whether to allow applications to clock in non-clocking hours (only valid for grey release tenants, please contact technical support if you need to use it.)',
                )
                .optional(),
              need_clock_over_time_start_and_end: z
                .boolean()
                .describe(
                  'Overtime starts and ends clocked in (only valid for grey release tenants, please contact technical support if you need to use it.)',
                )
                .optional(),
            })
            .describe('The clock in overtime')
            .optional(),
          new_calendar_id: z
            .string()
            .describe(
              'Holiday id, (if the attendance group uses a custom holiday, use this parameter to pass in the holiday id, you can get it from the Settings-Holiday Module page path)',
            )
            .optional(),
          allow_apply_punch: z
            .boolean()
            .describe('The positioning is not on time, is the application clock in allowed?')
            .optional(),
          clock_in_abnormal_settings: z
            .object({
              ignore_until_latest_clockout: z
                .boolean()
                .describe(
                  'Ignore exception cards before the latest clock in time (only valid for grey release tenants, please contact technical support if you need to use it.)',
                )
                .optional(),
            })
            .describe('Abnormal card exemption configuration')
            .optional(),
        })
        .describe('Attendance Team Information'),
      operator_id: z
        .string()
        .describe(
          'Operator uid, corresponding to employee_type, if you do not operate [backstage for attendance management "API access" process], this field is required field',
        )
        .optional(),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, that is the user ID in [Feishu Admin] > Organization > Member and Department > Member Details),employee_no(Employee number, that is the employee ID in [Feishu Admin] > Organization > Member and Department > Member Details)",
        ),
      dept_type: z
        .literal('open_id')
        .describe(
          'Type of department ID Options:open_id(For the time being, only the openid of the department is supported. For specific concepts, please refer to the open_department_id in [Department Resource Introduction])',
        ),
    }),
  },
};
export const attendanceV1GroupDelete = {
  project: 'attendance',
  name: 'attendance.v1.group.delete',
  sdkName: 'attendance.v1.group.delete',
  path: '/open-apis/attendance/v1/groups/:group_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Attendance-Attendance group-Delete attendance group-Delete the attendance group through the attendance group ID. Corresponding Settings - False Attendance Settings - Delete Function of [Attendance Group] Operation Columns',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      group_id: z
        .string()
        .describe(
          'Attendance group ID is obtained as follows: 1) [Create or modify attendance groups] 2) [Query attendance group by name] 3) [Obtain attendance results]',
        ),
    }),
  },
};
export const attendanceV1GroupGet = {
  project: 'attendance',
  name: 'attendance.v1.group.get',
  sdkName: 'attendance.v1.group.get',
  path: '/open-apis/attendance/v1/groups/:group_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Attendance-Attendance group-Query attendance group by ID-Get the attendance group details through the attendance group ID. Including basic information, attendance shifts, attendance methods, and attendance setting information',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "user_id and creator_id employee id types in the request body and response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details),employee_no(Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
        ),
      dept_type: z
        .literal('open_id')
        .describe(
          'Department ID type Options:open_id(For the time being, only the openid of the department is supported. For specific concepts, please refer to the open_department_id in [Department Resource Introduction])',
        ),
    }),
    path: z.object({
      group_id: z
        .string()
        .describe(
          'Attendance group ID is obtained as follows: 1) [Create or modify attendance groups] 2) [Query attendance group by name] 3) [Obtain attendance results]',
        ),
    }),
  },
};
export const attendanceV1GroupList = {
  project: 'attendance',
  name: 'attendance.v1.group.list',
  sdkName: 'attendance.v1.group.list',
  path: '/open-apis/attendance/v1/groups',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Attendance-Attendance group-Query all attendance groups-Turn the page to get a list of all attendance groups. Include attendance group name and attendance group id',
  accessTokens: ['tenant'],
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
      })
      .optional(),
  },
};
export const attendanceV1GroupListUser = {
  project: 'attendance',
  name: 'attendance.v1.group.listUser',
  sdkName: 'attendance.v1.group.listUser',
  path: '/open-apis/attendance/v1/groups/:group_id/list_user',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Attendance-Attendance group-Query all members in the attendance group-Query all members in the specified attendance group',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      employee_type: z
        .string()
        .describe(
          'Response body user_id employee ID type. If you do not have backend management permissions, you can use [Get user ID by mobile phone number or email]<b>Optional values are</b>:1. employee_id: Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member detailsDetails2. employee_no: Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details',
        ),
      dept_type: z
        .string()
        .describe(
          'Response body department_ids type of department ID.<b>Optional values are</b>:1. open_id: For the time being, only the openid of the department is supported. For specific concepts, please refer to the open_department_id in [Department Resource Introduction]',
        ),
      page_size: z.number().describe('Page size').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      member_clock_type: z
        .number()
        .describe(
          'Query clock-in type for attendance group members.<b>Optional values are</b>:<ul><li>0: All clock-in types</li><li>1: Required clock-in types</li><li>2: Not required clock-in types</li></ul>',
        ),
    }),
    path: z.object({
      group_id: z
        .string()
        .describe(
          'Attendance group ID is obtained as follows: 1) [Create or modify attendance groups] 2) [Query attendance group by name] 3) [Obtain attendance results]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const attendanceV1GroupSearch = {
  project: 'attendance',
  name: 'attendance.v1.group.search',
  sdkName: 'attendance.v1.group.search',
  path: '/open-apis/attendance/v1/groups/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance group-Query attendance group by name-Query the summary information of the attendance group by the name of the attendance group. The query conditions support two methods: exact matching and fuzzy matching of the name. The query results are sorted by the modification time of the attendance group desc, and the maximum number of records is 10. Corresponding page settings - fake attendance settings - [attendance group] name search function',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ group_name: z.string().describe('Attendance group name') }),
  },
};
export const attendanceV1LeaveAccrualRecordPatch = {
  project: 'attendance',
  name: 'attendance.v1.leaveAccrualRecord.patch',
  sdkName: 'attendance.v1.leaveAccrualRecord.patch',
  path: '/open-apis/attendance/v1/leave_accrual_record/:leave_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Attendance-Leave Grant Records-Modify Grant Record-Update the number and expiration date of issuance records, corresponding to leave management - leave management - [issuance records]',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      leave_granting_record_id: z
        .string()
        .describe('The unique ID of the issuance record, which can be created by [Create a holiday issuance record]'),
      employment_id: z.string().describe('Employee ID, type corresponding user_id_type'),
      leave_type_id: z.string().describe('The holiday type ID can be obtained by [Get a list of holiday types]'),
      reason: z
        .array(
          z.object({
            lang: z.string().describe('language code'),
            value: z.string().describe('Text corresponding to language code'),
          }),
        )
        .describe('Modify the grant record Reason'),
      time_offset: z.number().describe('Time offset East Eighth District: 480 8 * 60').optional(),
      expiration_date: z.string().describe('Expiration date, format "2020-01-01"').optional(),
      quantity: z.string().describe('Modify the number of releases').optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z
      .object({
        leave_id: z
          .string()
          .describe('The holiday type ID can be obtained by [Get a list of holiday types]')
          .optional(),
      })
      .optional(),
  },
};
export const attendanceV1LeaveEmployExpireRecordGet = {
  project: 'attendance',
  name: 'attendance.v1.leaveEmployExpireRecord.get',
  sdkName: 'attendance.v1.leaveEmployExpireRecord.get',
  path: '/open-apis/attendance/v1/leave_employ_expire_records/:leave_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Attendance-Leave Get Expired Grant Record-Get grant record by expiration time-Only grant records that expired in the corresponding time period can be obtained',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      employment_id: z.string().describe('Employee ID, consistent with user_id_type'),
      leave_type_id: z.string().describe('The holiday type ID can be obtained by [Get a list of holiday types]'),
      start_expiration_date: z.string().describe('The earliest expiration date in the format yyyy-MM-dd'),
      end_expiration_date: z.string().describe('The latest expiration date in the format yyyy-MM-dd'),
      time_offset: z
        .number()
        .describe(
          'Time offset, East Eighth District: 480 8 * 60, if there is no such parameter, the default East Eighth District',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z
          .enum(['open_id', 'union_id', 'user_id', 'people_corehr_id'])
          .describe('User ID type')
          .optional(),
      })
      .optional(),
    path: z
      .object({
        leave_id: z
          .string()
          .describe('The holiday type ID can be obtained by [Get a list of holiday types]')
          .optional(),
      })
      .optional(),
  },
};
export const attendanceV1ShiftCreate = {
  project: 'attendance',
  name: 'attendance.v1.shift.create',
  sdkName: 'attendance.v1.shift.create',
  path: '/open-apis/attendance/v1/shifts',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance shift-Create Attendance Shift-Shift is a general term that describes the time rules of an attendance task, such as how many times a day to play the card, the commute time of each card, how long is late, how long is late, and how long is missing the card. Click on the shift name in the fake work settings - [shift settings] to view the shift details. If the shift id is passed into the imported parameter, then the ability to edit the shift is supported',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      shift_name: z.string().describe('Shift name, non-repeatable'),
      punch_times: z
        .number()
        .describe('Number of clock in (history field, no longer useful, subject to punch_time_rule)'),
      sub_shift_leader_ids: z
        .array(z.string())
        .describe('Shift leader, corresponding to employee_type type')
        .optional(),
      is_flexible: z.boolean().describe('Whether flexible clock in, default to false, not on').optional(),
      flexible_minutes: z
        .number()
        .describe(
          'Flexible clock in time, unit: minutes, set the time of [Up to late for work] and [Up to early for work]. This parameter takes effect only when the flexible_rule parameter is not set. If the flexible_rule parameter is set, this parameter does not take effect',
        )
        .optional(),
      flexible_rule: z
        .array(
          z.object({
            flexible_early_minutes: z
              .number()
              .describe(
                'You can leave early at most after get off work, unit: minutes (arrive a few minutes early at work, and leave a few minutes early after get off work)',
              ),
            flexible_late_minutes: z
              .number()
              .describe(
                'You can arrive late at work at most, unit: minutes (arrive a few minutes late for work, and walk a few minutes late after get off work)',
              ),
          }),
        )
        .describe('Time setting in flexible clock')
        .optional(),
      no_need_off: z
        .boolean()
        .describe(
          "True is that you don't need to hit the off-duty card. The default is false, and you need to get off work clock in",
        )
        .optional(),
      punch_time_rule: z
        .array(
          z.object({
            on_time: z.string().describe('On time'),
            off_time: z
              .string()
              .describe(
                'Off-duty time. If off-duty time spans days, you need to accumulate time on a 24-hour basis. For example, the value of 2 am the next day is 26:00',
              ),
            late_minutes_as_late: z.number().describe('How late you arrive is recorded as late. unit: minutes'),
            late_minutes_as_lack: z
              .number()
              .describe('How late you arrive is recorded as a missing card. Unit: minutes'),
            on_advance_minutes: z
              .number()
              .describe('How early can I hit my work card? The maximum value is 720. Unit: minute'),
            early_minutes_as_early: z
              .number()
              .describe('How long to leave early is recorded as leaving early. Unit: minutes'),
            early_minutes_as_lack: z
              .number()
              .describe('How long to leave early is recorded as missing card. Unit: minutes'),
            off_delay_minutes: z
              .number()
              .describe('How long is the latest time to get off work? The maximum value is 960. Unit: minute'),
            late_minutes_as_serious_late: z
              .number()
              .describe('How late is recorded as severe lateness. Unit: minutes')
              .optional(),
            no_need_on: z
              .boolean()
              .describe(
                "True means that you don't need to hit the work card. Special attention should be paid here. The clock in the first section must be false. You can configure it on demand later",
              )
              .optional(),
            no_need_off: z
              .boolean()
              .describe(
                "True means that you don't need to hit the off-duty card. The default is false, and you need to get off work clock in (the priority is higher than data.shift. no_need_off)",
              )
              .optional(),
          }),
        )
        .describe('Attendance policy'),
      late_off_late_on_rule: z
        .array(
          z.object({
            late_off_minutes: z.number().describe('How late are you walking? Unit: minutes'),
            late_on_minutes: z.number().describe('How late are you? Unit: minute'),
          }),
        )
        .describe('Late departure and late arrival rules (only available in Feishu Personnel Enterprise Edition)')
        .optional(),
      rest_time_rule: z
        .array(
          z.object({
            rest_begin_time: z.string().describe('Break starts'),
            rest_end_time: z.string().describe('End of break'),
          }),
        )
        .describe('Break rule')
        .optional(),
      overtime_rule: z
        .array(
          z.object({ on_overtime: z.string().describe('start time'), off_overtime: z.string().describe('end time') }),
        )
        .describe('Overtime hours (only available in Feishu Personnel Enterprise Edition)')
        .optional(),
      day_type: z
        .number()
        .describe(
          'Date type, when [flexible clock in = ture], cannot be set as "rest day" Optional value: 1: working day 2: rest day. Default value: 1',
        )
        .optional(),
      overtime_rest_time_rule: z
        .array(
          z.object({
            rest_begin_time: z.string().describe('Rest begins'),
            rest_end_time: z.string().describe('Break is over'),
          }),
        )
        .describe('Out-of-class break rules')
        .optional(),
      late_minutes_as_serious_late: z
        .number()
        .describe(
          'How late is recorded as a serious late. unit: minutes (priority is higher than data.shift. punch_time_rule late_minutes_as_serious_late)',
        )
        .optional(),
      shift_middle_time_rule: z
        .object({
          middle_time_type: z
            .number()
            .describe(
              'Half-day split type Options:0(DefaultWithRest Split by the midpoint of the full-day shift duration (including breaks)),1(DefaultWithoutRest Split by the midpoint of the full-day shift duration (excluding breaks)),2(BaseInRest Split by break time),3(BaseInFixed Split by fixed point in time)',
            )
            .optional(),
          fixed_middle_time: z.string().describe('Fixed split time point (effective middle_time_type 3)').optional(),
        })
        .describe('Half-day split rules (available only in Feishu Personnel Enterprise Edition)')
        .optional(),
      shift_attendance_time_config: z
        .object({
          attendance_time: z.number().describe('due time').optional(),
          on_attendance_time: z.number().describe('Duration of attendance in the first half of the day').optional(),
          off_attendance_time: z.number().describe('Duration of attendance in the second half of the day').optional(),
        })
        .describe('Required attendance configuration (grey release, not yet open)')
        .optional(),
      late_off_late_on_setting: z
        .object({
          late_off_base_on_time_type: z
            .number()
            .describe(
              'Rules for calculating the departure time of the same day Options:0(FlexibleType Elastic rule),1(FixedType fixed rule)',
            )
            .optional(),
          late_on_base_on_time_type: z
            .number()
            .describe(
              'Next day late arrival time calculation rules Options:0(FixedType fixed rule),1(FlexibleType Elastic rule)',
            )
            .optional(),
        })
        .describe('Late departure, late arrival the next day, configuration rules')
        .optional(),
      id: z
        .string()
        .describe('Shift id (need to pass when updating shift), get method: 1) [query shift by name] 2) [create shift]')
        .optional(),
    }),
    params: z
      .object({
        employee_type: z
          .enum(['employee_id', 'employee_no'])
          .describe(
            "The user_ids in the request body and the employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details,you can also get from [Get user ID by mobile phone number or email]),employee_no(Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
          )
          .optional(),
      })
      .optional(),
  },
};
export const attendanceV1ShiftDelete = {
  project: 'attendance',
  name: 'attendance.v1.shift.delete',
  sdkName: 'attendance.v1.shift.delete',
  path: '/open-apis/attendance/v1/shifts/:shift_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Attendance-Attendance shift-Delete Attendance Shift-Delete the shift by the shift ID. The corresponding function is the Delete button in the operation bar in the shift list of false attendance settings - [shift settings]',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      shift_id: z
        .string()
        .describe('Shift ID, which can be obtained as follows: 1) [Search shift by name] 2) [Create a shift]'),
    }),
  },
};
export const attendanceV1ShiftGet = {
  project: 'attendance',
  name: 'attendance.v1.shift.get',
  sdkName: 'attendance.v1.shift.get',
  path: '/open-apis/attendance/v1/shifts/:shift_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Attendance-Attendance shift-Query shifts by ID-Get the shift details through the shift ID. The corresponding function is fake duty settings - [shift settings] The specific shift in the shift list, the shift information can be viewed by clicking the shift name',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      shift_id: z
        .string()
        .describe('Shift ID, which can be obtained as follows: 1) [Search shift by name] 2) [Create a shift]'),
    }),
  },
};
export const attendanceV1ShiftList = {
  project: 'attendance',
  name: 'attendance.v1.shift.list',
  sdkName: 'attendance.v1.shift.list',
  path: '/open-apis/attendance/v1/shifts',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Attendance-Attendance shift-Query all shifts-Fake duty settings in Feishu personnel management background - [Shift configuration] page turn query all shift functions, showing shift name, clock in rules, flexible shift rules, rest rules, etc',
  accessTokens: ['tenant'],
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
      })
      .optional(),
  },
};
export const attendanceV1ShiftQuery = {
  project: 'attendance',
  name: 'attendance.v1.shift.query',
  sdkName: 'attendance.v1.shift.query',
  path: '/open-apis/attendance/v1/shifts/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance shift-Query Attendance Shift by Name-Feishu personnel management background fake work settings - [shift configuration] in the search shift name function, showing shift name, clock in rules, flexible shift rules, rest rules, etc',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({ shift_name: z.string().describe('Shift name, support fuzzy matching') }),
  },
};
export const attendanceV1UserApprovalCreate = {
  project: 'attendance',
  name: 'attendance.v1.userApproval.create',
  sdkName: 'attendance.v1.userApproval.create',
  path: '/open-apis/attendance/v1/user_approvals',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Attendance-Attendance approval-Add approval result-Since some companies may use their own approval system instead of Feishu Approval, employees' leave and overtime data cannot flow into the Feishu Attendance. As a result, employees still receive check-in reminders during the leave period and are recorded as No Record.For these companies that only use the Feishu Attendance, but not the Feishu Approval, they can import 3rd party approval data to Feishu Attendance using this attendance API",
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_approval: z
          .object({
            user_id: z
              .string()
              .describe('Approval Submitter ID. The incoming ID type needs to match the value of the employee_type'),
            date: z.string().describe('Approval date in the format yyyMMdd'),
            outs: z
              .array(
                z.object({
                  uniq_id: z
                    .string()
                    .describe(
                      'Outgoing type unique ID, representing an outgoing type, with a length less than 14* How to get it? You can choose to fill in the outgoing type id of the three parties. Such as the id of going out in the city and going out outside the city',
                    ),
                  unit: z
                    .number()
                    .describe(
                      'Unit of time spent away Options:1(Day),2(Hour),3(HalfDay Half day),4(HalfHour Half hour)',
                    ),
                  interval: z
                    .number()
                    .describe(
                      'The time for the associated approval form to go out, the unit is seconds, and it has nothing to do with the unit',
                    ),
                  start_time: z.string().describe('Start time, time format is yyyy-MM-dd HH:mm:ss'),
                  end_time: z.string().describe('End time, time format is yyyy-MM-dd HH:mm:ss'),
                  i18n_names: z
                    .object({
                      ch: z.string().describe('Chinese description').optional(),
                      en: z.string().describe('English description').optional(),
                      ja: z.string().describe('Japanese description').optional(),
                    })
                    .describe(
                      'Out of office multi-language present, with the format is map, and the key is ["ch", "en", "ja"], where ch stands for Chinese, en stands for English, ja stands for Japanese',
                    ),
                  default_locale: z
                    .string()
                    .describe(
                      'Default language type. Since Chinese, English, and Japanese are available on Feishu apps, when user switches language, if there is no corresponding language name, it will use the name of default language',
                    ),
                  reason: z.string().describe('Out of office reason'),
                  idempotent_id: z
                    .string()
                    .describe(
                      'The unique idempotent key of the outgoing record, which is used to avoid repeated creation of the outgoing record. You can fill in the outgoing record id of the three parties',
                    )
                    .optional(),
                  correct_process_id: z
                    .array(z.string())
                    .describe(
                      'Correct process instance ID.This field is automatically generated by the system and should not be included when submitting approval results',
                    )
                    .optional(),
                  cancel_process_id: z
                    .array(z.string())
                    .describe(
                      'Revoke process instance ID.This field is automatically generated by the system and should not be included when submitting approval results',
                    )
                    .optional(),
                  process_id: z
                    .array(z.string())
                    .describe(
                      'initiating process instance ID.This field is automatically generated by the system and should not be included when submitting approval results',
                    )
                    .optional(),
                }),
              )
              .describe('Out of office info')
              .optional(),
            leaves: z
              .array(
                z.object({
                  uniq_id: z
                    .string()
                    .describe(
                      'Vacation type unique ID, representing a vacation type, less than 14 in length* This ID corresponds to the holiday type (ie: i18n_names), so it needs to be guaranteed to be unique. You can get [Get Holiday Type]',
                    )
                    .optional(),
                  unit: z
                    .number()
                    .describe('Holiday duration unit Options:1(Day),2(Hour),3(HalfDay Half day),4(HalfHour Half hour)'),
                  interval: z
                    .number()
                    .describe(
                      'The holiday duration of the associated approval order is seconds, which has nothing to do with unit',
                    ),
                  start_time: z.string().describe('Start time, time format is yyyy-MM-dd HH:mm:ss'),
                  end_time: z.string().describe('End time, time format is yyyy-MM-dd HH:mm:ss'),
                  i18n_names: z
                    .object({
                      ch: z.string().describe('Chinese description').optional(),
                      en: z.string().describe('English description').optional(),
                      ja: z.string().describe('Japanese description').optional(),
                    })
                    .describe(
                      'Leave multi-language present, with the format is map, and the key is ["ch", "en", "ja"], where ch stands for Chinese, en stands for English, ja stands for Japanese',
                    ),
                  default_locale: z
                    .enum(['ch', 'en', 'ja'])
                    .describe(
                      'Default language type. Since Chinese, English, and Japanese are available on Feishu apps, when user switches language, if there is no corresponding language name, it will use the name of default language Options:ch(Chinese description),en(English description),ja(Japanese description)',
                    ),
                  reason: z.string().describe('Leave reason'),
                  idempotent_id: z
                    .string()
                    .describe(
                      'The unique idempotent key of the leave record, which is used to avoid repeated creation of leave records. You can fill in the leave record id of the three parties',
                    )
                    .optional(),
                }),
              )
              .describe('Leave info')
              .optional(),
            overtime_works: z
              .array(
                z.object({
                  duration: z
                    .number()
                    .describe(
                      'If you need to use this field to calculate overtime hours, please contact [Technical Support] to open. start_time and end_time calculation are used by default',
                    ),
                  unit: z
                    .number()
                    .describe(
                      'Overtime duration unit Options:1(Day),2(Hour),3(HalfDay Half day),4(HalfHour Half hour)',
                    ),
                  category: z
                    .number()
                    .describe('Overtime date type Options:1(Workday Working day),2(Weekend Rest day),3(Holiday)'),
                  type: z
                    .number()
                    .describe(
                      'Overtime rule type Options:0(None record only),1(DaysOff Counted as compensatory leave),2(Fee Counted as overtime pay),3(Bind [This optional value has been deprecated])',
                    ),
                  start_time: z.string().describe('Start time, time format is yyyy-MM-dd HH:mm:ss'),
                  end_time: z.string().describe('End time, time format is yyyy-MM-dd HH:mm:ss'),
                  reason: z.string().describe('overwork reason').optional(),
                  idempotent_id: z
                    .string()
                    .describe(
                      'The unique idempotent key for overtime records, which is used to avoid repeated creation of overtime records. You can fill in the overtime record id of the three parties',
                    )
                    .optional(),
                  correct_process_id: z
                    .array(z.string())
                    .describe(
                      'Correct process instance ID.This field is automatically generated by the system and should not be included when submitting approval results',
                    )
                    .optional(),
                  cancel_process_id: z
                    .array(z.string())
                    .describe(
                      'Revoke process instance ID.This field is automatically generated by the system and should not be included when submitting approval results',
                    )
                    .optional(),
                  process_id: z
                    .array(z.string())
                    .describe(
                      'initiating process instance ID.This field is automatically generated by the system and should not be included when submitting approval results',
                    )
                    .optional(),
                }),
              )
              .describe('Overtime info')
              .optional(),
            trips: z
              .array(
                z.object({
                  start_time: z.string().describe('Start time, time format is yyyy-MM-dd HH:mm:ss'),
                  end_time: z.string().describe('End time, time format is yyyy-MM-dd HH:mm:ss'),
                  reason: z.string().describe('Business trip reason'),
                  approve_pass_time: z.string().describe('Approved time, time format is yyyy-MM-dd HH:mm:ss'),
                  approve_apply_time: z.string().describe('Application time, time format is yyyy-MM-dd HH:mm:ss'),
                  idempotent_id: z
                    .string()
                    .describe(
                      'The unique idempotent key of the business trip record, which is used to avoid repeated creation of business trip records. You can fill in the business trip record id of the three parties',
                    )
                    .optional(),
                  correct_process_id: z
                    .array(z.string())
                    .describe(
                      'Correct process instance ID.This field is automatically generated by the system and should not be included when submitting approval results',
                    )
                    .optional(),
                  cancel_process_id: z
                    .array(z.string())
                    .describe(
                      'Revoke process instance ID.This field is automatically generated by the system and should not be included when submitting approval results',
                    )
                    .optional(),
                  process_id: z
                    .array(z.string())
                    .describe(
                      'initiating process instance ID.This field is automatically generated by the system and should not be included when submitting approval results',
                    )
                    .optional(),
                  departure: z
                    .object({
                      region_level: z
                        .string()
                        .describe(
                          'Geographical level (country | province | city | district)l1: Countryl2: Provincel3: Cityl4: District/County',
                        )
                        .optional(),
                      region_id: z
                        .string()
                        .describe(
                          'Geographic ID, it can be obtained by [querying district/county information] or [querying city information] (only supported by Feishu People Enterprise)',
                        )
                        .optional(),
                    })
                    .describe('Departure point (only one)')
                    .optional(),
                  destinations: z
                    .array(
                      z.object({
                        region_level: z
                          .string()
                          .describe(
                            'Geographical level (country | province | city | district)l1: Countryl2: Provincel3: Cityl4: District/County',
                          )
                          .optional(),
                        region_id: z
                          .string()
                          .describe(
                            'Geographic ID, it can be obtained by [querying district/county information] or [querying city information] (only supported by Feishu People Enterprise)',
                          )
                          .optional(),
                      }),
                    )
                    .describe('Destination (multiple can be written)')
                    .optional(),
                  transportation: z
                    .array(z.number())
                    .describe('Transportation (1 plane, 2 trains, 3 cars, 4 high-speed trains, 5 boats, 6 others)')
                    .optional(),
                  trip_type: z.number().describe('Business trip type (1: one way 2: round trip)').optional(),
                  remarks: z.string().describe('Business trip remarks').optional(),
                }),
              )
              .describe(
                'Travel information.Currently only full-day travel is supported (less than full days are counted as full days). If you need to support half-day travel, please consult [Technical Support]',
              )
              .optional(),
            time_zone: z
              .string()
              .describe(
                'This field is no longer used, subject to the time zone of the attendance group matched by the user',
              )
              .optional(),
          })
          .describe('Approval info')
          .optional(),
      })
      .optional(),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no', 'open_id'])
        .describe(
          "The employee ID type of the user_id in the request body and the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu Admin] > Organization > Member and Department > Member Details),employee_no(Employee No., which is the Employee ID in [Feishu Admin] > Organization > Member and Department > Member Details),open_id(For the identity of the user in an application, you can refer to [How to get different user IDs])",
        ),
    }),
  },
};
export const attendanceV1UserApprovalQuery = {
  project: 'attendance',
  name: 'attendance.v1.userApproval.query',
  sdkName: 'attendance.v1.userApproval.query',
  path: '/open-apis/attendance/v1/user_approvals/query',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Attendance-Attendance approval-Get approval data-This interface is used to get granted approval data of employees' leave, overtime, out of office and business trip over a certain period of time",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_ids: z
        .array(z.string())
        .describe(
          'employee_no or employee_id list. The ID type passed in needs to match the value of the employee_type',
        ),
      check_date_from: z
        .number()
        .describe(
          'The start date of the query. Format yyyyMMdd**Note**: The date passed in cannot exceed the current day + 1 day. For example, if the current day is 20241010, then passing in 20241011 will support query, but passing in 20241012 will result in an error',
        ),
      check_date_to: z
        .number()
        .describe('The end date of the query, no more than 30 days apart from the check_date_from. Format yyyyMMdd'),
      check_date_type: z
        .enum(['PeriodTime', 'CreateTime', 'UpdateTime'])
        .describe(
          'The time type of the query basis (do not fill in the default basis PeriodTime) Options:PeriodTime(Document duration (i.e. remedy_time)),CreateTime(Document creation time),UpdateTime(Document status update time (grey release, not yet open))',
        )
        .optional(),
      status: z
        .number()
        .describe(
          'Query status (no default query passed status)Leave and overtime: Only support Approved and Revoked statusesOuting and business trip: Support querying all statuses Options:0(Todo Pending),1(Rejected),2(Approved),3(Canceled Cancelled),4(Reverted Revoked)',
        )
        .optional(),
      check_time_from: z
        .string()
        .describe('The start time of the query, accurate to the second timestamp (in grayscale)')
        .optional(),
      check_time_to: z
        .string()
        .describe('The end time of the query, accurate to the second timestamp (in grayscale)')
        .optional(),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no', 'open_id'])
        .describe(
          "The user_ids in the request body and the employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu Admin] > Organization > Member and Department > Member Details),employee_no(Employee No., which is the Employee ID in [Feishu Admin] > Organization > Member and Department > Member Details),open_id(Open ID., which is the Open ID in [Feishu Admin])",
        ),
    }),
  },
};
export const attendanceV1UserDailyShiftBatchCreate = {
  project: 'attendance',
  name: 'attendance.v1.userDailyShift.batchCreate',
  sdkName: 'attendance.v1.userDailyShift.batchCreate',
  path: '/open-apis/attendance/v1/user_daily_shifts/batch_create',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Attendance-Attendance schedule-Create or modify schedule-The schedule is used to describe which shift the personnel in the attendance group go to work every day. Currently, the schedule supports scheduling one or more personnel by x month y day. It will be created when the user's schedule data does not exist, and will be modified according to the imported parameter information when the user's schedule data exists. Note: Each person can only be in one attendance group per day",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_daily_shifts: z
        .array(
          z.object({
            group_id: z
              .string()
              .describe(
                'Attendance group ID is obtained as follows: 1) [Create or modify attendance groups] 2) [Query attendance group by name] 3) [Obtain attendance results]',
              ),
            shift_id: z
              .string()
              .describe(
                'Shift ID, which can be obtained as follows: 1) [Search shift by name] 2) [Create a shift].Passing in 0 represents rest',
              ),
            month: z.number().describe('Month, format yyyyMM'),
            user_id: z.string().describe('User ID, corresponding to employee_type'),
            day_no: z.number().describe('Date'),
            is_clear_schedule: z
              .boolean()
              .describe(
                'Whether to clear the shift (this field takes precedence over shift_id, if true, shift_id will be invalid)',
              )
              .optional(),
          }),
        )
        .describe('Schedule information list (quantity limit within 50)'),
      operator_id: z
        .string()
        .describe(
          'Operator uid, corresponding to employee_type. If you do not operate [backstage for attendance management "API access" process], this field is required',
        )
        .optional(),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The employee ID type of the user_id in the request body and the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee's employee ID, that is the user ID in [Feishu Admin] > Organization > Member and Department > Member Details,you can also get from [Get user ID by mobile phone number or email]),employee_no(Employee ID, that is the employee ID in [Feishu Admin] > Organization > Member and Department > Member Details)",
        ),
    }),
  },
};
export const attendanceV1UserDailyShiftBatchCreateTemp = {
  project: 'attendance',
  name: 'attendance.v1.userDailyShift.batchCreateTemp',
  sdkName: 'attendance.v1.userDailyShift.batchCreateTemp',
  path: '/open-apis/attendance/v1/user_daily_shifts/batch_create_temp',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance schedule-Create or modify temporary schedule-Temporary shifts can be created or modified on the schedule and used for scheduling. Temporary shifts are currently supported for one or more people by date. Temporary shifts are paid features, please contact your account manager to use them',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z.object({
      user_tmp_daily_shifts: z
        .array(
          z.object({
            group_id: z
              .string()
              .describe(
                'Attendance group ID is obtained as follows: 1) [Create or modify attendance groups] 2) [Query attendance group by name] 3) [Obtain attendance results]',
              ),
            user_id: z.string().describe('User ID, corresponding to employee_type'),
            date: z.number().describe('date'),
            shift_name: z.string().describe('shift name'),
            punch_time_simple_rules: z
              .array(
                z.object({
                  on_time: z.string().describe('On-duty time, format HH: MM'),
                  off_time: z
                    .string()
                    .describe('Off-duty time, format HH: MM. To indicate 2 o\'clock the next day, fill in "26:00"'),
                }),
              )
              .describe('Rules in clock'),
          }),
        )
        .describe('Temporary schedule information list (quantity limit within 50)'),
      operator_id: z
        .string()
        .describe(
          'Operator uid, corresponding to employee_type. If you do not operate the backstage for attendance management "API access" process, this field is required',
        )
        .optional(),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The employee ID type of the user_id in the request body and the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(EmployeeID Employee's employee ID, that is the user ID in [Feishu Admin] > Organization > Member and Department > Member Details,you can also get from [Get user ID by mobile phone number or email]),employee_no(EmployeeNo Employee ID, that is the employee ID in [Feishu Admin] > Organization > Member and Department > Member Details)",
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const attendanceV1UserDailyShiftQuery = {
  project: 'attendance',
  name: 'attendance.v1.userDailyShift.query',
  sdkName: 'attendance.v1.userDailyShift.query',
  path: '/open-apis/attendance/v1/user_daily_shifts/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance schedule-Query schedule information-Support querying the scheduling of multiple users. Note that this interface returns the scheduling results of the user dimension, which does not correspond to the page function. You can query the attendance group [query the attendance group by ID] through the group_id in the return result, shift_id query the shift [query the shift by ID]. The time span of the query cannot exceed 30 days',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_ids: z
        .array(z.string())
        .describe('employee_no or employee_id lists, corresponding to employee_type. Up to 50 people'),
      check_date_from: z.number().describe('The starting working day of the query, in the format yyyMMdd'),
      check_date_to: z.number().describe('The closing working day of the query, in the format yyyMMdd'),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The user_ids in the request body and the employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details,you can also get from [Get user ID by mobile phone number or email]),employee_no(Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
        ),
    }),
  },
};
export const attendanceV1UserFlowBatchCreate = {
  project: 'attendance',
  name: 'attendance.v1.userFlow.batchCreate',
  sdkName: 'attendance.v1.userFlow.batchCreate',
  path: '/open-apis/attendance/v1/user_flows/batch_create',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Attendance-Attendance records-Import attendance record-Import the employee's attendance details. After importing, the final clock in status and result will be calculated according to the shift rules of the employee's attendance team. You can check in clock in management - [clock in records]",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      flow_records: z
        .array(
          z.object({
            user_id: z.string().describe('User ID. Corresponds to employee_type'),
            creator_id: z.string().describe('Record creator ID. Corresponds to employee_type'),
            location_name: z.string().describe('Attendance location name information'),
            check_time: z
              .string()
              .describe(
                'Clock in time, timestamp accurate to seconds (only data with clock in time after January 1, 2022 is supported)',
              ),
            comment: z.string().describe('Attendance note'),
            record_id: z.string().describe('Attendance record ID').optional(),
            ssid: z.string().describe('SSID of attendance Wi-Fi').optional(),
            bssid: z.string().describe('MAC address of attendance Wi-Fi').optional(),
            is_field: z
              .boolean()
              .describe('Whether to clock in field. Default is false, clock in non-field')
              .optional(),
            is_wifi: z
              .boolean()
              .describe('Whether it is a Wi-Fi clock in. Default is false, not a Wi-Fi clock in')
              .optional(),
            type: z
              .number()
              .describe(
                'Record generation method. For example: type=0 represents the "User attendance" flow of "Open Platform"; type=1 represents the "Administrator modification" flow of "Open Platform". If type is not set, the default is 0. Options:0(Self User attendance),1(ManagerModification Administrator modification),2(Remedy User correction),3(System Automatically generated by the system),4(Free Clock-out is not required),5(Machine Attendance machine),6(Quick Express attendance),7(import Imports to attendance open platform)',
              )
              .optional(),
            photo_urls: z
              .array(z.string())
              .describe('Attendance image list(This field is not supported at the moment.)')
              .optional(),
            device_id: z
              .string()
              .describe('Clock in device ID, (only supports Mini Program clock in, invalid when importing)')
              .optional(),
            check_result: z
              .enum([
                'NoNeedCheck',
                'SystemCheck',
                'Normal',
                'Early',
                'Late',
                'SeriousLate',
                'Lack',
                'Invalid',
                'None',
                'Todo',
              ])
              .describe(
                'Clock in effect as an imported parameter Options:NoNeedCheck(No clock in),SystemCheck(System clock in),Normal(Normal),Early(Leave early),Late(Late),SeriousLate(Seriously late),Lack(Missing card),Invalid(Invalid),None(Stateless),Todo(Not clocked in yet)',
              )
              .optional(),
            external_id: z
              .string()
              .describe(
                "The record ID of the external clock in the user's import is used for comparison with the external data. If it is not passed, it is inconvenient to distinguish when querying",
              )
              .optional(),
            idempotent_id: z
              .string()
              .describe('Unique idempotent key, if not passed, idempotent processing cannot be achieved')
              .optional(),
          }),
        )
        .describe('Attendance flow record list（limit 50）'),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "user_id and creator_id employee id types in the request body and response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details,you can also get from [Get user ID by mobile phone number or email]),employee_no(Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
        ),
    }),
  },
};
export const attendanceV1UserFlowBatchDel = {
  project: 'attendance',
  name: 'attendance.v1.userFlow.batchDel',
  sdkName: 'attendance.v1.userFlow.batchDel',
  path: '/open-apis/attendance/v1/user_flows/batch_del',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance records-delete attendance record-Delete the clock in record imported by the employee from the open platform. After deletion, the clock in record will be recalculated corresponding to the attendance task result',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      record_ids: z
        .array(z.string())
        .describe(
          'Attendance flow record ID, which is obtained as follows: 1) [Batch query of attendance flow record] 2) [Obtain attendance results] 3) [Import attendance flow record]',
        ),
    }),
  },
};
export const attendanceV1UserFlowGet = {
  project: 'attendance',
  name: 'attendance.v1.userFlow.get',
  sdkName: 'attendance.v1.userFlow.get',
  path: '/open-apis/attendance/v1/user_flows/:user_flow_id',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Attendance-Attendance records-Obtain attendance record-Obtain the user's attendance details record through the record ID of the clock. The return information mainly includes:* User ID and creator ID* Record information* clock in position information, time information* Information in clock mode* GPS clock in: location_name (location address information)* Wi-Fi clock in: ssid (wifi name), bssid (mac address)* Attendance machine clock in: device_id (attendance machine device id)Corresponding page function clock in management - [clock in record]",
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      employee_type: z
        .enum(['open_id', 'employee_id', 'employee_no'])
        .describe(
          "The user_id and creator_id employee ID type in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:open_id(-),employee_id(Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details),employee_no(Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
        ),
    }),
    path: z.object({
      user_flow_id: z
        .string()
        .describe(
          'Attendance flow record ID, which is obtained as follows: 1) [Batch query of attendance flow record] 2) [Obtain attendance results] 3) [Import attendance flow record]',
        ),
    }),
  },
};
export const attendanceV1UserFlowQuery = {
  project: 'attendance',
  name: 'attendance.v1.userFlow.query',
  sdkName: 'attendance.v1.userFlow.query',
  path: '/open-apis/attendance/v1/user_flows/query',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Attendance-Attendance records-Batch query attendance record-Get the user's attendance details through the user ID. The return information mainly includes:* User ID and creator ID* Record information* clock in position information, time information* Information in clock mode* GPS clock in: location_name (location address information)* Wi-Fi clock in: ssid (wifi name), bssid (mac address)* Attendance machine clock in: device_id (attendance machine device id)Corresponding page function clock in management - [clock in record]",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_ids: z.array(z.string()).describe('employee_no or employee_id list, with length of no more than 50'),
      check_time_from: z.string().describe('The start time of the query, in seconds timestamp'),
      check_time_to: z.string().describe('Query end time, second timestamp'),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The user_ids in the request body and the employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details),employee_no(Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
        ),
      include_terminated_user: z
        .boolean()
        .describe(
          'Since new employees can reuse the employee_no/employee_id of resigned employees, if true, the data of all employee users in service and resigned employees corresponding to employee_no/employee_id is returned. If false, only the data of the employees who are in service or have recently resigned corresponding to employee_no/employee_id is returned',
        )
        .optional(),
    }),
  },
};
export const attendanceV1UserSettingModify = {
  project: 'attendance',
  name: 'attendance.v1.userSetting.modify',
  sdkName: 'attendance.v1.userSetting.modify',
  path: '/open-apis/attendance/v1/user_settings/modify',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Attendance-Attendance user management-Modify user face recognition information-Modify the user settings information of the employee within the authorization, including the face photo file ID. Modifying the user's facial recognition information currently only supports API modification, and the management background cannot be modified",
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_setting: z
          .object({
            user_id: z.string().describe('User ID'),
            face_key: z.string().describe('Face photo file ID, get method: [Upload user facial recognition photo]'),
            face_key_update_time: z
              .string()
              .describe('Time of face photo updates, with the timestamp accurate to seconds')
              .optional(),
          })
          .describe('User settings')
          .optional(),
      })
      .optional(),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The user_ids in the request body and the employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details),employee_no(Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
        ),
    }),
  },
};
export const attendanceV1UserSettingQuery = {
  project: 'attendance',
  name: 'attendance.v1.userSetting.query',
  sdkName: 'attendance.v1.userSetting.query',
  path: '/open-apis/attendance/v1/user_settings/query',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Attendance-Attendance user management-Query user face recognition information in batches-Batch query the user setting information of employees within the authorization, including face photo file ID and face photo update time. Corresponding page fake attendance settings - [facial recognition]. According to the returned face_key, you can download face information [Download user facial recognition photos]',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_ids: z.array(z.string()).describe('employee_no or employee_id list, corresponding to employee_type'),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The user_ids in the request body and the employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(EmployeeId Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details),employee_no(EmployeeNo Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
        ),
    }),
  },
};
export const attendanceV1UserStatsDataQuery = {
  project: 'attendance',
  name: 'attendance.v1.userStatsData.query',
  sdkName: 'attendance.v1.userStatsData.query',
  path: '/open-apis/attendance/v1/user_stats_datas/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance statistics-Query statistical data-Query statistics for daily or monthly statistics. Fields contain basic information, attendance group information, attendance statistics, exception statistics, leave statistics, overtime statistics, clock in time, attendance results, and custom fields. Specific reports can be found in Attendance Statistics - [Reports]',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      locale: z.enum(['en', 'ja', 'zh']).describe('Language Options:en(English),ja(Japanese),zh(Chinese)'),
      stats_type: z
        .enum(['daily', 'month'])
        .describe('Statistics type Options:daily(Daily statistics),month(Monthly statistics)'),
      start_date: z.number().describe('Start time, format yyyyMMdd'),
      end_date: z.number().describe('End time, format yyyyMMdd(The time interval does not exceed 31 days)'),
      user_ids: z
        .array(z.string())
        .describe(
          'List of queried user IDs, corresponding to employee_type(No more than 200 users)* Required fields (all have been upgraded to the new system, new system requirements are required)',
        )
        .optional(),
      need_history: z
        .boolean()
        .describe(
          'Whether to include departing personnel and transferring personnel, the default is false and not included',
        )
        .optional(),
      current_group_only: z
        .boolean()
        .describe(
          "* 'true': only show the attendance group data to which the employee currently belongs* 'false': Show all employee attendance group data < br > Default value: false",
        )
        .optional(),
      user_id: z
        .string()
        .describe(
          "Operator's user_id. Corresponds to employee_type* Each report of different operators (administrators) may have different field settings, and the system will query the statistics of the specified report according to the user_id.Required field (all have been upgraded to the new system, and the new system requires this field to be filled in)",
        )
        .optional(),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The user_ids in the request body and the employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, that is the user ID in [Feishu Admin] > Organization > Member and Department > Member Details),employee_no(Employee number, that is the employee ID in [Feishu Admin] > Organization > Member and Department > Member Details)",
        ),
    }),
  },
};
export const attendanceV1UserStatsFieldQuery = {
  project: 'attendance',
  name: 'attendance.v1.userStatsField.query',
  sdkName: 'attendance.v1.userStatsField.query',
  path: '/open-apis/attendance/v1/user_stats_fields/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance statistics-Query statistics headers-Query the statistical header of the daily statistics or monthly statistics supported by the attendance statistics. The header information of the report can be queried in the attendance statistics - [report] to find the specific report information. This interface is specially used to query the header data',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      locale: z.enum(['en', 'ja', 'zh']).describe('Language Options:en(English),ja(Japanese),zh(Chinese)'),
      stats_type: z
        .enum(['daily', 'month'])
        .describe('Statistics type Options:daily(Daily statistics),month(Monthly statistics)'),
      start_date: z.number().describe('Start time in the format yyyMMdd'),
      end_date: z.number().describe('End time in the format yyyMMdd (no more than 40 days apart)'),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details),employee_no(Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
        ),
    }),
  },
};
export const attendanceV1UserStatsViewQuery = {
  project: 'attendance',
  name: 'attendance.v1.userStatsView.query',
  sdkName: 'attendance.v1.userStatsView.query',
  path: '/open-apis/attendance/v1/user_stats_views/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance statistics-Query statistics settings-Query the statistical header of the daily statistics or monthly statistics supported by the attendance statistics. The header information of the report can be queried in the attendance statistics - [report]. This interface is specially used to query the header data. Note that this interface is basically the same as the [Query statistics headers]. The difference is that it is compatible with the historical statistics view model (the historical statistics model can be set by user ID, and the subsequent statistics are upgraded to support only the tenant dimension)',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      locale: z.enum(['en', 'ja', 'zh']).describe('Language Options:en(English),ja(Japanese),zh(Chinese)'),
      stats_type: z
        .enum(['daily', 'month'])
        .describe('Statistics type Options:daily(Daily statistics),month(Monthly statistics)'),
      user_id: z
        .string()
        .describe(
          'User ID of the operator, corresponding to employee_type* Required fields (required for new system requirements after system upgrade)',
        )
        .optional(),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details),employee_no(Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
        ),
    }),
  },
};
export const attendanceV1UserStatsViewUpdate = {
  project: 'attendance',
  name: 'attendance.v1.userStatsView.update',
  sdkName: 'attendance.v1.userStatsView.update',
  path: '/open-apis/attendance/v1/user_stats_views/:user_stats_view_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Attendance-Attendance statistics-Update statistics settings-Update the statistical report header setting information customized by the developer for daily statistics or monthly statistics. The header information of the report can be found in the attendance statistics - [report]. This interface is specially used to update the header information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      view: z
        .object({
          view_id: z.string().describe('View ID'),
          stats_type: z
            .enum(['daily', 'month'])
            .describe('View type Options:daily(Daily statistics),month(Monthly statistics)'),
          user_id: z.string().describe('User ID of the operator, corresponding to employee_type'),
          items: z
            .array(
              z.object({
                code: z.string().describe('Title number'),
                child_items: z
                  .array(
                    z.object({
                      code: z.string().describe('Subtitle number'),
                      value: z.string().describe('Switch field, 0: off, 1: on'),
                    }),
                  )
                  .describe('Subtitle')
                  .optional(),
              }),
            )
            .describe('User settings field')
            .optional(),
        })
        .describe('Statistics settings'),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details),employee_no(Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
        ),
    }),
    path: z.object({
      user_stats_view_id: z.string().describe('User view ID is obtained as follows: 1) [Query statistics settings]'),
    }),
  },
};
export const attendanceV1UserTaskRemedyCreate = {
  project: 'attendance',
  name: 'attendance.v1.userTaskRemedy.create',
  sdkName: 'attendance.v1.userTaskRemedy.create',
  path: '/open-apis/attendance/v1/user_task_remedys',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance correction-Notify correction approval initiation-For enterprises that only use Fishu attendance system but not Fishu approval system, you can use this interface to write the replacement card approval data initiated in the three-party approval system to Fishu attendance system with the status of approval in progress. The status can be updated by [notify approval status update] after writing in',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z.string(),
      remedy_date: z.number().describe('Replenishment date, date format yyyyMMdd'),
      punch_no: z
        .number()
        .describe(
          'The punch in/off No., 0: the first punch in/off, 1: the second punch in/off, 2: the third punch in/off, and fill in 0 for free shift',
        ),
      work_type: z.number().describe('On duty/off duty, 1: on duty, 2: off duty, and fill in 0 for free shift'),
      remedy_time: z.string().describe('Correction time in the format of yyyy-MM-dd HH:mm'),
      reason: z.string().describe('Correction reason'),
      time: z.string().describe('Field is invalid').optional(),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details),employee_no(Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
        ),
    }),
  },
};
export const attendanceV1UserTaskRemedyQuery = {
  project: 'attendance',
  name: 'attendance.v1.userTaskRemedy.query',
  sdkName: 'attendance.v1.userTaskRemedy.query',
  path: '/open-apis/attendance/v1/user_task_remedys/query',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Attendance-Attendance correction-Obtain correction record-Supplementary card: The user adds a clock in record within the time frame of a certain commute/get off work by means of approval to correct the user's attendance result. This interface is dedicated to obtaining the supplementary card records of employees (no page function corresponds)",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_ids: z
        .array(z.string())
        .describe(
          'employee_no or employee_id list. The ID type passed in needs to match the value of the employee_type. Up to 50 are supported',
        ),
      check_time_from: z.string().describe('The start time of the check, with the timestamp accurate to seconds'),
      check_time_to: z.string().describe('The end time of the check, with the timestamp accurate to seconds'),
      check_date_type: z
        .enum(['PeriodTime', 'CreateTime', 'UpdateTime'])
        .describe(
          'The time type of the query basis (do not fill in the default basis PeriodTime) Options:PeriodTime(Document duration (i.e. remedy_time)),CreateTime(Document creation time),UpdateTime(Document status update time (new fields, effective for specific tenants))',
        )
        .optional(),
      status: z
        .number()
        .describe(
          'Query status (no default query passed status) Options:0(Pending),1(Rejected),2(Pass),3(Cancel),4(Withdraw)',
        )
        .optional(),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The user_ids in the request body and the employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee's employee ID, that is the user ID in Feishu Admin > Organization > Member and Department > Member Details),employee_no(Employee ID, that is the employee ID in Feishu Admin > Organization > Member and Department > Member Details)",
        ),
    }),
  },
};
export const attendanceV1UserTaskRemedyQueryUserAllowedRemedys = {
  project: 'attendance',
  name: 'attendance.v1.userTaskRemedy.queryUserAllowedRemedys',
  sdkName: 'attendance.v1.userTaskRemedy.queryUserAllowedRemedys',
  path: '/open-apis/attendance/v1/user_task_remedys/query_user_allowed_remedys',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Attendance-Attendance correction-Obtain the time allowing for user's correction-Obtains the number of punch in/off the user can correct for a given day",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z.string().describe('User ID, corresponding employee_type'),
      remedy_date: z.number().describe('Replenishment date in yyyyMMdd format'),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "The employee ID type of the user_id in the response body. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee ID, which is the user ID in [Feishu admin background] > organizational structure > members and departments > member details),employee_no(Employee job number, that is, the job number in [Feishu management background] > organizational structure > members and departments > member details)",
        ),
    }),
  },
};
export const attendanceV1UserTaskQuery = {
  project: 'attendance',
  name: 'attendance.v1.userTask.query',
  sdkName: 'attendance.v1.userTask.query',
  path: '/open-apis/attendance/v1/user_tasks/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Attendance-Attendance records-Obtain attendance result-Get the results of the actual clock in the enterprise, including:* clock in task list* ID in clock* User information* Attendance Team ID* shift id* Attendance records* Work record* Off-duty records* Results in work clock* Results in clock* Results added in work clock* Results added in clock* Work clock in time* Time in clockList of invalid user IDs* List of user IDs without permission',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_ids: z
        .array(z.string())
        .describe('employee_no or employee_id list, corresponding to employee_type, not more than 50 in length'),
      check_date_from: z.number().describe('The starting working day of the query, in the format yyyMMdd'),
      check_date_to: z.number().describe('The closing working day of the query, in the format yyyMMdd'),
      need_overtime_result: z
        .boolean()
        .describe(
          'Whether you need the overtime shift clock in result; when need_overtime_result = true, the overtime shift will be returned. The overtime shift is marked by task_shift_type = 1, and there will be shared record_id when the overtime shift is connected to the normal shift. For example: 9-18 is the normal shift, 18-19 is the overtime shift, and the clock in result records two segments, 9-18, 18-19 and the two segments record_id the same (check_in_record_id and check_out_record_id are the same). Non-connected overtime shifts are returned in normal segments. When need_overtime_result = false, only the normal shift is returned and task_shift_type = 0',
        )
        .optional(),
    }),
    params: z.object({
      employee_type: z
        .enum(['employee_id', 'employee_no'])
        .describe(
          "Employee ID type. If you don't have background administrative privileges, you can use [Get user ID by mobile phone number or email] Options:employee_id(Employee's employee ID, that is the user ID in [Feishu Admin] > Organization > Member and Department > Member Details),employee_no(Employee ID, that is the employee ID in [Feishu Admin] > Organization > Member and Department > Member Details)",
        ),
      ignore_invalid_users: z
        .boolean()
        .describe(
          'Whether to ignore invalid and no permissions users, the corresponding employee_type. If true, return the information of the valid user and inform the invalid and no permissions user; if false, and there are invalid or no permissions in the user_ids, return an error',
        )
        .optional(),
      include_terminated_user: z
        .boolean()
        .describe(
          'Since the new employee can reuse the employee_no/employee_id of the departed employee, corresponding to employee_type. If true, return the data of all current + departing employees corresponding to employee_no/employee_id; if false, only return the data of the current or most recent employee corresponding to employee_no/employee_id',
        )
        .optional(),
    }),
  },
};
export const attendanceV1Tools = [
  attendanceV1ApprovalInfoProcess,
  attendanceV1ArchiveRuleDelReport,
  attendanceV1ArchiveRuleList,
  attendanceV1ArchiveRuleUploadReport,
  attendanceV1ArchiveRuleUserStatsFieldsQuery,
  attendanceV1GroupCreate,
  attendanceV1GroupDelete,
  attendanceV1GroupGet,
  attendanceV1GroupList,
  attendanceV1GroupListUser,
  attendanceV1GroupSearch,
  attendanceV1LeaveAccrualRecordPatch,
  attendanceV1LeaveEmployExpireRecordGet,
  attendanceV1ShiftCreate,
  attendanceV1ShiftDelete,
  attendanceV1ShiftGet,
  attendanceV1ShiftList,
  attendanceV1ShiftQuery,
  attendanceV1UserApprovalCreate,
  attendanceV1UserApprovalQuery,
  attendanceV1UserDailyShiftBatchCreate,
  attendanceV1UserDailyShiftBatchCreateTemp,
  attendanceV1UserDailyShiftQuery,
  attendanceV1UserFlowBatchCreate,
  attendanceV1UserFlowBatchDel,
  attendanceV1UserFlowGet,
  attendanceV1UserFlowQuery,
  attendanceV1UserSettingModify,
  attendanceV1UserSettingQuery,
  attendanceV1UserStatsDataQuery,
  attendanceV1UserStatsFieldQuery,
  attendanceV1UserStatsViewQuery,
  attendanceV1UserStatsViewUpdate,
  attendanceV1UserTaskRemedyCreate,
  attendanceV1UserTaskRemedyQuery,
  attendanceV1UserTaskRemedyQueryUserAllowedRemedys,
  attendanceV1UserTaskQuery,
];
