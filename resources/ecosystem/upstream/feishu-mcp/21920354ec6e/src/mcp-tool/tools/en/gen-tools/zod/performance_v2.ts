import { z } from 'zod';
export type performanceV2ToolName =
  | 'performance.v2.activity.query'
  | 'performance.v2.additionalInformation.import'
  | 'performance.v2.additionalInformation.query'
  | 'performance.v2.additionalInformationsBatch.delete'
  | 'performance.v2.indicator.query'
  | 'performance.v2.metricDetail.import'
  | 'performance.v2.metricDetail.query'
  | 'performance.v2.metricField.query'
  | 'performance.v2.metricLib.query'
  | 'performance.v2.metricTag.list'
  | 'performance.v2.metricTemplate.query'
  | 'performance.v2.question.query'
  | 'performance.v2.reviewData.query'
  | 'performance.v2.reviewTemplate.query'
  | 'performance.v2.reviewee.query'
  | 'performance.v2.userGroupUserRel.write';
export const performanceV2ActivityQuery = {
  project: 'performance',
  name: 'performance.v2.activity.query',
  sdkName: 'performance.v2.activity.query',
  path: '/open-apis/performance/v2/activity/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Cycles and projects-Projects-Get information about the project-Obtain project information, such as project name, project model, etc',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        semester_ids: z
          .array(z.string())
          .describe(
            'List of evaluation period IDs, get the project ID of the specified evaluation period, semester_id can be obtained by [[Get Period]. If "activity_ids" is passed at the same time, it is preferentially queried with "activity_ids". When "semester_ids" and "activity_ids" are not passed, empty data is returned',
          )
          .optional(),
        activity_ids: z
          .array(z.string())
          .describe(
            'Item ID list. If "semester_ids" is passed at the same time, the query is preferentially "activity_ids". When "semester_ids" and "activity_ids" are not passed, empty data is returned',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const performanceV2AdditionalInformationImport = {
  project: 'performance',
  name: 'performance.v2.additionalInformation.import',
  sdkName: 'performance.v2.additionalInformation.import',
  path: '/open-apis/performance/v2/additional_informations/import',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Cycles and projects-Supplementary Information-Batch Import Supplementary Information-Supplementary information of the reviewees can be imported in batches for review reference (including both new additions and updates)',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      semester_id: z
        .string()
        .describe('The evaluation period ID can be obtained through the [Get Period List] interface'),
      additional_informations: z
        .array(
          z.object({
            item_id: z
              .string()
              .describe(
                'Supplementary Information ID< br >** Note **: If the supplementary information ID already in the system is passed in, the corresponding supplementary message data will be updated',
              )
              .optional(),
            external_id: z
              .string()
              .describe(
                'The external system supplementary information ID is used for data mapping between systems.< br >** Note **: If an external system supplementary information ID is passed in, the corresponding supplementary message data will be updated',
              )
              .optional(),
            reviewee_user_id: z
              .string()
              .describe(
                "The list of evaluee IDs, consistent with the type of imported parameter user_id_type, can be obtained through the [Get evaluee information] interface< br >** Note **: If the parameter combination of reviewee_user_id ',' item ',' time ',' detailed_description 'already has a supplementary message with the same content in the system, the corresponding supplementary message data will be updated",
              ),
            item: z
              .string()
              .describe(
                "matters< br >** Note **: If the parameter combination of reviewee_user_id ',' item ',' time ',' detailed_description 'already has a supplementary message with the same content in the system, the corresponding supplementary message data will be updated",
              ),
            time: z
              .string()
              .describe(
                "time< br >** Description **: Text content, unformatted verification< br >** Note **: If the parameter combination of reviewee_user_id ',' item ',' time ',' detailed_description 'already has a supplementary message with the same content in the system, the corresponding supplementary message data will be updated",
              ),
            detailed_description: z
              .string()
              .describe(
                "specific description< br >** Note **: If the parameter combination of reviewee_user_id ',' item ',' time ',' detailed_description 'already has a supplementary message with the same content in the system, the corresponding supplementary message data will be updated",
              ),
          }),
        )
        .describe('Supplementary information list')
        .optional(),
      import_record_name: z
        .string()
        .describe(
          'Supplementary information import record name, which can be viewed by administrators in the import record of Supplementary Information Management.< br >**Default**: "API Import"',
        )
        .optional(),
    }),
    params: z.object({
      client_token: z
        .string()
        .describe(
          'According to whether the client_token is consistent to determine whether it is the same request, multiple calls to the same request will be intercepted',
        ),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
    }),
  },
};
export const performanceV2AdditionalInformationQuery = {
  project: 'performance',
  name: 'performance.v2.additionalInformation.query',
  sdkName: 'performance.v2.additionalInformation.query',
  path: '/open-apis/performance/v2/additional_informations/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Cycles and projects-Supplementary Information-Batch Query Supplementary Information-Supplementary information of the reviewees can be queried in batches',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      semester_id: z
        .string()
        .describe('List of review cycle IDs. semester_id can be obtained through the [Obtain cycle] API'),
      item_ids: z
        .array(z.string())
        .describe(
          'List of item IDs. Obtain information of the specified item ID. When "item_ids", "external_ids", and "reviewee_user_ids" in the following request parameters are all empty, all supplementary information for the review cycle will be returned. If multiple request parameters are populated in a single request, only the first parameter with a value will be recognized in the order of [item_ids > external_ids > reviewee_user_ids]',
        )
        .optional(),
      external_ids: z
        .array(z.string())
        .describe(
          'List of external system\'s item IDs. Obtain the corresponding Feishu performance item IDs. This parameter is ineffective when the "item_ids" parameter is populated',
        )
        .optional(),
      reviewee_user_ids: z
        .array(z.string())
        .describe(
          'A list of reviewee IDs. Obtain the item information of the reviewee in the cycle. This parameter is ineffective when the "item_ids" or "external_ids" parameters are populated',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().optional(),
      })
      .optional(),
  },
};
export const performanceV2AdditionalInformationsBatchDelete = {
  project: 'performance',
  name: 'performance.v2.additionalInformationsBatch.delete',
  sdkName: 'performance.v2.additionalInformationsBatch.delete',
  path: '/open-apis/performance/v2/additional_informations/batch',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Cycles and projects-Supplementary Information-Batch Delete Supplementary Information-Supplementary information of the reviewees can be deleted in batches',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      semester_id: z
        .string()
        .describe('The evaluation period ID can be obtained through the [Get Period List] interface'),
      additional_informations: z
        .array(z.string())
        .describe(
          'The list of supplementary information IDs can be obtained through the [Batch Query Supplementary Information] interface',
        ),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const performanceV2IndicatorQuery = {
  project: 'performance',
  name: 'performance.v2.indicator.query',
  sdkName: 'performance.v2.indicator.query',
  path: '/open-apis/performance/v2/indicators/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Review templates and questions-Get the evaluation question configuration-Get scoring queations',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        indicator_ids: z
          .array(z.string())
          .describe('Evaluation item ID list, get the configuration data of the specified evaluation item')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('paging size').optional(),
      })
      .optional(),
  },
};
export const performanceV2MetricDetailImport = {
  project: 'performance',
  name: 'performance.v2.metricDetail.import',
  sdkName: 'performance.v2.metricDetail.import',
  path: '/open-apis/performance/v2/metric_details/import',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Metric data-Batch entry of key metrics details of the person being evaluated for the specified period-Batch entry of key metrics details of the person being evaluated in the specified period',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      semester_id: z.string().describe('Period ID, which can be obtained through the [Get Period] interface'),
      import_record_name: z
        .string()
        .describe('Data source input person, you can view the record name on the input record page')
        .optional(),
      imported_metrics: z
        .array(
          z.object({
            reviewee_user_id: z.string().describe('Assessor ID, the same type as imported parameter user_id_type'),
            metric_id: z
              .string()
              .describe('The indicator ID can be obtained through the [Get indicator library information] interface'),
            fields: z
              .array(
                z.object({
                  field_id: z
                    .string()
                    .describe(
                      'The indicator field ID can be obtained through the [Get indicator field list] interface',
                    ),
                  field_value: z.string().describe('field value').optional(),
                  field_value_person: z
                    .string()
                    .describe(
                      'Field value, required when the field is personnel information, the same type as imported parameter user_id_type',
                    )
                    .optional(),
                }),
              )
              .describe('Metric field information'),
          }),
        )
        .describe('indicator breakdown'),
    }),
    params: z.object({
      client_token: z
        .string()
        .describe('Determine whether the same request is based on whether the client_token are consistent'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
    }),
  },
};
export const performanceV2MetricDetailQuery = {
  project: 'performance',
  name: 'performance.v2.metricDetail.query',
  sdkName: 'performance.v2.metricDetail.query',
  path: '/open-apis/performance/v2/metric_details/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Metric data-Batch acquisition of key metric details of the person being evaluated for the specified period-Batch acquisition of key metric details of the person being evaluated in the specified period',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      semester_id: z
        .string()
        .describe(
          'Cycle ID, only 1 cycle is allowed to be queried at a time, semester_id can be obtained through the [[Get Cycle]] interface',
        ),
      reviewee_user_ids: z
        .array(z.string())
        .describe(
          'List of assessee IDs. If not passed on, return key metric details of all participating assessees for the period',
        ),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const performanceV2MetricFieldQuery = {
  project: 'performance',
  name: 'performance.v2.metricField.query',
  sdkName: 'performance.v2.metricField.query',
  path: '/open-apis/performance/v2/metric_fields/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Metric-Get indicator field information-Get the field base information of the indicator',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        field_ids: z
          .array(z.string())
          .describe(
            'The field ID of the indicator, if it is not passed, all field information will be obtained by default',
          )
          .optional(),
      })
      .optional(),
  },
};
export const performanceV2MetricLibQuery = {
  project: 'performance',
  name: 'performance.v2.metricLib.query',
  sdkName: 'performance.v2.metricLib.query',
  path: '/open-apis/performance/v2/metric_libs/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Metric-Get indicator library information-Get information on the indicator library',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        is_active: z.boolean().describe('Whether the status is enabled, not specified to get all states').optional(),
        tag_ids: z
          .array(z.string())
          .describe(
            'The label ID to which the indicator belongs can be obtained through the [[Get indicator label information] ] interface, and all labels are not specified',
          )
          .optional(),
        type_ids: z
          .array(z.string())
          .describe('The indicator type ID to which it belongs, not specified Get all types')
          .optional(),
        range_of_availability: z
          .enum(['admins_and_reviewees', 'only_admins'])
          .describe(
            'Available ranges, not specified Get all ranges Options:admins_and_reviewees(Allow administrators to issue and evaluates to choose),only_admins(Only administrators are allowed to issue)',
          )
          .optional(),
        scoring_setting_type: z
          .enum(['score_manually', 'score_by_formula'])
          .describe(
            'Rating setting type, do not specify Get all types Options:score_manually(manual grading),score_by_formula(formula scoring)',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('paging size').optional(),
      })
      .optional(),
  },
};
export const performanceV2MetricTagList = {
  project: 'performance',
  name: 'performance.v2.metricTag.list',
  sdkName: 'performance.v2.metricTag.list',
  path: '/open-apis/performance/v2/metric_tags',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Metric-Get metric tag information-Get metric tag information. Such as the name of the metric tag, the create time of metric tag',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z.number().describe('paging size**Default value**: 20').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        tag_ids: z
          .array(z.string())
          .describe('List of indicator label IDs, no longer paginated when using this parameter')
          .optional(),
      })
      .optional(),
  },
};
export const performanceV2MetricTemplateQuery = {
  project: 'performance',
  name: 'performance.v2.metricTemplate.query',
  sdkName: 'performance.v2.metricTemplate.query',
  path: '/open-apis/performance/v2/metric_templates/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Metric-Get indicator template information-Get information on the indicator template',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        metrics_template_ids: z
          .array(z.string())
          .describe(
            "The list of indicator template IDs, metrics_template_id can be obtained through the url of the background configuration details page of the indicator template, or through the return value of this interface. If you don't fill it in, all indicator templates will be returned by default",
          )
          .optional(),
        status: z
          .enum(['to_be_configured', 'to_be_activated', 'enabled', 'disabled'])
          .describe(
            'state Options:to_be_configured(Configuration to be completed),to_be_activated(To be enabled),enabled(Enabled),disabled(Deactivated)',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('paging size').optional(),
      })
      .optional(),
  },
};
export const performanceV2QuestionQuery = {
  project: 'performance',
  name: 'performance.v2.question.query',
  sdkName: 'performance.v2.question.query',
  path: '/open-apis/performance/v2/questions/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Review templates and questions-Get evaluation template configuration-Get tag-based questions',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        tag_based_question_ids: z
          .array(z.string())
          .describe(
            'Tag fill in question ID list, get the configuration data of the specified tag fill in question. If not passed, return all',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('paging size').optional(),
      })
      .optional(),
  },
};
export const performanceV2ReviewDataQuery = {
  project: 'performance',
  name: 'performance.v2.reviewData.query',
  sdkName: 'performance.v2.reviewData.query',
  path: '/open-apis/performance/v2/review_datas/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Review data-Acquire detailed performance data-Get performance details (excluding calibration)',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      semester_ids: z
        .array(z.string())
        .describe('Evaluation period ID list, semester_id can be obtained through [Acquisition Period]'),
      reviewee_user_ids: z.array(z.string()).describe('List of assessee IDs'),
      stage_types: z
        .array(
          z
            .enum([
              'summarize_key_outputs',
              'review',
              'communication_and_open_result',
              'view_result',
              'reconsideration',
              'leader_review',
            ])
            .describe(
              'Options:summarize_key_outputs(Work summary link),review(evaluation link),communication_and_open_result(Result communication link),view_result(Performance results viewing session),reconsideration(Result review session),leader_review(Final evaluation process (specifically the final performance result data))',
            ),
        )
        .describe('link type')
        .optional(),
      review_stage_roles: z
        .array(
          z
            .enum([
              'reviewee',
              'invited_reviewer',
              'solid_line_leader',
              'dotted_line_leader',
              'secondary_solid_line_leader',
              'direct_project_leader',
              'custom_review_role',
              'metric_reviewer',
            ])
            .describe(
              'Options:reviewee(Assessor),invited_reviewer(360 ° evaluator),solid_line_leader(Solid-line manager),dotted_line_leader(Dotted-line manager),secondary_solid_line_leader(Second solid-line manager),direct_project_leader(Cooperation project direct manager),custom_review_role(Custom evaluation roles),metric_reviewer(Index evaluator)',
            ),
        )
        .describe(
          'The executor role of the evaluation link, which includes all the executor roles by default. When there is an evaluation link in the passed link type, the evaluation link data of the specified executor role is returned',
        )
        .optional(),
      stage_ids: z
        .array(z.string())
        .describe(
          'Link ID. If the link ID and link type are passed at the same time, the performance data corresponding to the link ID will be returned first',
        )
        .optional(),
      need_leader_review_data_source: z
        .boolean()
        .describe(
          'When the link type of the performance data to be obtained includes the final evaluation link, you can specify whether to return the specific link source of the performance final evaluation data. If not, it will not be returned by default',
        )
        .optional(),
      updated_later_than: z
        .string()
        .describe(
          'The link update time is later than that, a timestamp accurate to milliseconds, and the link data with content submitted after this time can be screened out',
        )
        .optional(),
      stage_progresses: z
        .array(z.number())
        .describe(
          "Link status, all states are included by default if not passed. Each type of link has the following link status:View performance results link statusThe optional values are:- '0': Opened, performance results have been opened, no reconsideration has been initiated and no confirmation of results is required- '1': To be confirmed, the performance result has been opened but the evaluator has not confirmed the result, and the deadline for confirmation has not yet been reached- '2': Closed, performance results have been opened but the evaluator has not confirmed the results, and the deadline for confirmation has arrived- '3': Confirmed, performance results have been opened, and the assessed person has confirmed the results- '4': Reconsideration has been initiated, the performance results have been opened, and the person being evaluated has initiated a reconsiderationFinal evaluation link/result communication link status (all states are included by default if not transmitted)Performance results review link statusThe optional values are:- '1': To be completed, task not completed- '2': Expired, the deadline for the task has been reached, and the task has not been completed- '3': Completed, task completedOther link types other than the aboveThe optional values are:- '0': did not start, the start time of the task has not been reached- '1': To be completed, the start time of the task has arrived but the deadline has not been reached, and the task has not been completed- '2': Expired, the deadline for the task has been reached, and the task has not been completed- '3': Completed, task completed",
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const performanceV2ReviewTemplateQuery = {
  project: 'performance',
  name: 'performance.v2.reviewTemplate.query',
  sdkName: 'performance.v2.reviewTemplate.query',
  path: '/open-apis/performance/v2/review_templates/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Review templates and questions-Get label fill in question configuration-Get review templates',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        review_template_ids: z
          .array(z.string())
          .describe(
            'Evaluation template ID list, get the configuration data of the specified evaluation template. If not passed, return all',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('paging size').optional(),
      })
      .optional(),
  },
};
export const performanceV2RevieweeQuery = {
  project: 'performance',
  name: 'performance.v2.reviewee.query',
  sdkName: 'performance.v2.reviewee.query',
  path: '/open-apis/performance/v2/reviewees/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Cycles and projects-Reviewee Information-Obtain information of reviewees-Obtain information of individuals selected for projects (including uninitiated projects) during the performance cycle',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      semester_id: z
        .string()
        .describe(
          'Cycle ID, only 1 cycle is allowed to be queried at a time, semester_id can be obtained through the [[Get Cycle]] interface',
        ),
      user_ids: z
        .array(z.string())
        .describe(
          'User ID, the type needs to be consistent with the user_id_type in the query parameters. If not specified, it will by default return the information of all reviewees in this semester',
        )
        .optional(),
      activity_ids: z
        .array(z.string())
        .describe(
          'The project ID list can be obtained through [get the project list]Interface to obtain and query the information of the evaluated person under the specified project',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('paging size').optional(),
      })
      .optional(),
  },
};
export const performanceV2UserGroupUserRelWrite = {
  project: 'performance',
  name: 'performance.v2.userGroupUserRel.write',
  sdkName: 'performance.v2.userGroupUserRel.write',
  path: '/open-apis/performance/v2/user_group_user_rels/write',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Performance-Admin configuration-Cycles and projects-Individual Group-Write member scope of individual group-Write member scope of individual group',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        group_id: z.string().describe('Individual group ID').optional(),
        scope_visible_setting: z
          .number()
          .describe(
            'Individual group visibility configuration for list of individuals Options:0(not_limit No restrictions),1(backend_admin_not_visible Not visible to back-end admins)',
          )
          .optional(),
        user_ids: z
          .array(z.string())
          .describe('List of individuals. The ID type is consistent with the value of the query parameter user_id_type')
          .optional(),
      })
      .optional(),
    params: z.object({
      client_token: z
        .string()
        .describe('Determine whether the same request is based on whether the client_token are consistent'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
    }),
  },
};
export const performanceV2Tools = [
  performanceV2ActivityQuery,
  performanceV2AdditionalInformationImport,
  performanceV2AdditionalInformationQuery,
  performanceV2AdditionalInformationsBatchDelete,
  performanceV2IndicatorQuery,
  performanceV2MetricDetailImport,
  performanceV2MetricDetailQuery,
  performanceV2MetricFieldQuery,
  performanceV2MetricLibQuery,
  performanceV2MetricTagList,
  performanceV2MetricTemplateQuery,
  performanceV2QuestionQuery,
  performanceV2ReviewDataQuery,
  performanceV2ReviewTemplateQuery,
  performanceV2RevieweeQuery,
  performanceV2UserGroupUserRelWrite,
];
