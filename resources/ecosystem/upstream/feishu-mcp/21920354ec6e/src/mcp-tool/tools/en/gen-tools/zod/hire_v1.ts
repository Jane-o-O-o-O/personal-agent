import { z } from 'zod';
export type hireV1ToolName =
  | 'hire.v1.advertisement.publish'
  | 'hire.v1.agency.batchQuery'
  | 'hire.v1.agency.get'
  | 'hire.v1.agency.getAgencyAccount'
  | 'hire.v1.agency.operateAgencyAccount'
  | 'hire.v1.agency.protect'
  | 'hire.v1.agency.protectSearch'
  | 'hire.v1.agency.query'
  | 'hire.v1.application.cancelOnboard'
  | 'hire.v1.application.create'
  | 'hire.v1.application.get'
  | 'hire.v1.application.getDetail'
  | 'hire.v1.applicationInterview.list'
  | 'hire.v1.application.list'
  | 'hire.v1.application.offer'
  | 'hire.v1.application.recover'
  | 'hire.v1.application.terminate'
  | 'hire.v1.application.transferOnboard'
  | 'hire.v1.application.transferStage'
  | 'hire.v1.attachment.get'
  | 'hire.v1.attachment.preview'
  | 'hire.v1.backgroundCheckOrder.list'
  | 'hire.v1.diversityInclusion.search'
  | 'hire.v1.ecoAccountCustomField.batchDelete'
  | 'hire.v1.ecoAccountCustomField.batchUpdate'
  | 'hire.v1.ecoAccountCustomField.create'
  | 'hire.v1.ecoBackgroundCheckCustomField.batchDelete'
  | 'hire.v1.ecoBackgroundCheckCustomField.batchUpdate'
  | 'hire.v1.ecoBackgroundCheckCustomField.create'
  | 'hire.v1.ecoBackgroundCheckPackage.batchDelete'
  | 'hire.v1.ecoBackgroundCheckPackage.batchUpdate'
  | 'hire.v1.ecoBackgroundCheckPackage.create'
  | 'hire.v1.ecoBackgroundCheck.cancel'
  | 'hire.v1.ecoBackgroundCheck.updateProgress'
  | 'hire.v1.ecoBackgroundCheck.updateResult'
  | 'hire.v1.ecoExamPaper.batchDelete'
  | 'hire.v1.ecoExamPaper.batchUpdate'
  | 'hire.v1.ecoExamPaper.create'
  | 'hire.v1.ecoExam.loginInfo'
  | 'hire.v1.ecoExam.updateResult'
  | 'hire.v1.ehrImportTask.patch'
  | 'hire.v1.employee.get'
  | 'hire.v1.employee.getByApplication'
  | 'hire.v1.employee.patch'
  | 'hire.v1.evaluationTask.list'
  | 'hire.v1.evaluation.list'
  | 'hire.v1.examMarkingTask.list'
  | 'hire.v1.exam.create'
  | 'hire.v1.externalApplication.create'
  | 'hire.v1.externalApplication.delete'
  | 'hire.v1.externalApplication.list'
  | 'hire.v1.externalApplication.update'
  | 'hire.v1.externalBackgroundCheck.batchQuery'
  | 'hire.v1.externalBackgroundCheck.create'
  | 'hire.v1.externalBackgroundCheck.delete'
  | 'hire.v1.externalBackgroundCheck.update'
  | 'hire.v1.externalInterviewAssessment.create'
  | 'hire.v1.externalInterviewAssessment.patch'
  | 'hire.v1.externalInterview.batchQuery'
  | 'hire.v1.externalInterview.create'
  | 'hire.v1.externalInterview.delete'
  | 'hire.v1.externalInterview.update'
  | 'hire.v1.externalOffer.batchQuery'
  | 'hire.v1.externalOffer.create'
  | 'hire.v1.externalOffer.delete'
  | 'hire.v1.externalOffer.update'
  | 'hire.v1.externalReferralReward.create'
  | 'hire.v1.externalReferralReward.delete'
  | 'hire.v1.interviewFeedbackForm.list'
  | 'hire.v1.interviewRecordAttachment.get'
  | 'hire.v1.interviewRecord.get'
  | 'hire.v1.interviewRecord.list'
  | 'hire.v1.interviewRegistrationSchema.list'
  | 'hire.v1.interviewRoundType.list'
  | 'hire.v1.interviewTask.list'
  | 'hire.v1.interview.getByTalent'
  | 'hire.v1.interview.list'
  | 'hire.v1.interviewer.list'
  | 'hire.v1.interviewer.patch'
  | 'hire.v1.jobFunction.list'
  | 'hire.v1.jobProcess.list'
  | 'hire.v1.jobPublishRecord.search'
  | 'hire.v1.jobRequirementSchema.list'
  | 'hire.v1.jobRequirement.create'
  | 'hire.v1.jobRequirement.delete'
  | 'hire.v1.jobRequirement.list'
  | 'hire.v1.jobRequirement.listById'
  | 'hire.v1.jobRequirement.update'
  | 'hire.v1.jobSchema.list'
  | 'hire.v1.jobType.list'
  | 'hire.v1.job.close'
  | 'hire.v1.job.combinedCreate'
  | 'hire.v1.job.combinedUpdate'
  | 'hire.v1.job.config'
  | 'hire.v1.job.get'
  | 'hire.v1.job.getDetail'
  | 'hire.v1.job.list'
  | 'hire.v1.jobManager.batchUpdate'
  | 'hire.v1.jobManager.get'
  | 'hire.v1.job.open'
  | 'hire.v1.job.recruiter'
  | 'hire.v1.job.updateConfig'
  | 'hire.v1.location.list'
  | 'hire.v1.location.query'
  | 'hire.v1.minutes.get'
  | 'hire.v1.note.create'
  | 'hire.v1.note.delete'
  | 'hire.v1.note.get'
  | 'hire.v1.note.list'
  | 'hire.v1.note.patch'
  | 'hire.v1.offerApplicationForm.get'
  | 'hire.v1.offerApplicationForm.list'
  | 'hire.v1.offerCustomField.update'
  | 'hire.v1.offerSchema.get'
  | 'hire.v1.offer.create'
  | 'hire.v1.offer.get'
  | 'hire.v1.offer.internOfferStatus'
  | 'hire.v1.offer.list'
  | 'hire.v1.offer.offerStatus'
  | 'hire.v1.offer.update'
  | 'hire.v1.questionnaire.list'
  | 'hire.v1.referralAccount.create'
  | 'hire.v1.referralAccount.deactivate'
  | 'hire.v1.referralAccount.enable'
  | 'hire.v1.referralAccount.getAccountAssets'
  | 'hire.v1.referralAccount.reconciliation'
  | 'hire.v1.referralAccount.withdraw'
  | 'hire.v1.referralWebsiteJobPost.get'
  | 'hire.v1.referralWebsiteJobPost.list'
  | 'hire.v1.referral.getByApplication'
  | 'hire.v1.referral.search'
  | 'hire.v1.registrationSchema.list'
  | 'hire.v1.resumeSource.list'
  | 'hire.v1.role.get'
  | 'hire.v1.role.list'
  | 'hire.v1.subject.list'
  | 'hire.v1.talentBlocklist.changeTalentBlock'
  | 'hire.v1.talentFolder.list'
  | 'hire.v1.talentObject.query'
  | 'hire.v1.talentOperationLog.search'
  | 'hire.v1.talentPool.batchChangeTalentPool'
  | 'hire.v1.talentPool.moveTalent'
  | 'hire.v1.talentPool.search'
  | 'hire.v1.talentTag.list'
  | 'hire.v1.talent.addToFolder'
  | 'hire.v1.talent.batchGetId'
  | 'hire.v1.talent.combinedCreate'
  | 'hire.v1.talent.combinedUpdate'
  | 'hire.v1.talentExternalInfo.create'
  | 'hire.v1.talentExternalInfo.update'
  | 'hire.v1.talent.get'
  | 'hire.v1.talent.list'
  | 'hire.v1.talent.onboardStatus'
  | 'hire.v1.talent.removeToFolder'
  | 'hire.v1.talent.tag'
  | 'hire.v1.terminationReason.list'
  | 'hire.v1.test.search'
  | 'hire.v1.todo.list'
  | 'hire.v1.tripartiteAgreement.create'
  | 'hire.v1.tripartiteAgreement.delete'
  | 'hire.v1.tripartiteAgreement.list'
  | 'hire.v1.tripartiteAgreement.update'
  | 'hire.v1.userRole.list'
  | 'hire.v1.websiteChannel.create'
  | 'hire.v1.websiteChannel.delete'
  | 'hire.v1.websiteChannel.list'
  | 'hire.v1.websiteChannel.update'
  | 'hire.v1.websiteDeliveryTask.get'
  | 'hire.v1.websiteDelivery.createByAttachment'
  | 'hire.v1.websiteDelivery.createByResume'
  | 'hire.v1.websiteJobPost.get'
  | 'hire.v1.websiteJobPost.list'
  | 'hire.v1.websiteJobPost.search'
  | 'hire.v1.website.list'
  | 'hire.v1.websiteSiteUser.create';
export const hireV1AdvertisementPublish = {
  project: 'hire',
  name: 'hire.v1.advertisement.publish',
  sdkName: 'hire.v1.advertisement.publish',
  path: '/open-apis/hire/v1/advertisements/:advertisement_id/publish',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Publish job post-Publish advertisement',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ job_channel_id: z.string().describe('Job channel ID').optional() }).optional(),
    path: z.object({ advertisement_id: z.string().describe('Job ID') }),
  },
};
export const hireV1AgencyBatchQuery = {
  project: 'hire',
  name: 'hire.v1.agency.batchQuery',
  sdkName: 'hire.v1.agency.batchQuery',
  path: '/open-apis/hire/v1/agencies/batch_query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Agency-Search supplier list-Supplier information can be queried according to headhunting supplier ID list or keywords and filters',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        agency_supplier_id_list: z
          .array(z.string())
          .describe(
            'Headhunting supplier ID list, when passing this value, this value shall prevail, and the rest of the query fields shall be invalid',
          )
          .optional(),
        keyword: z.string().describe('Search for keywords, you can pass in a name or email address').optional(),
        filter_list: z
          .array(
            z.object({
              key: z.string().describe('Filter key'),
              value_type: z
                .number()
                .describe(
                  'filter value type Options:1(Value filtering, populating value_list fields),2(Range filtering, populating range_filter fields)',
                ),
              value_list: z.array(z.string()).describe('list of filter values').optional(),
              range_filter: z
                .object({
                  from: z.string().describe('starting value').optional(),
                  to: z.string().describe('stop value').optional(),
                })
                .describe('range filter')
                .optional(),
            }),
          )
          .describe(
            'Filter items, the same Key can only be passed once, and the field value can be viewed in the "Filter Field Description" section of this article',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('number of records fetched per page').optional(),
      })
      .optional(),
  },
};
export const hireV1AgencyGet = {
  project: 'hire',
  name: 'hire.v1.agency.get',
  sdkName: 'hire.v1.agency.get',
  path: '/open-apis/hire/v1/agencies/:agency_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Get candidates-Agency-Get agency information-Get agency information by ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({ agency_id: z.string().describe('Agency Supplier ID').optional() }).optional(),
  },
};
export const hireV1AgencyGetAgencyAccount = {
  project: 'hire',
  name: 'hire.v1.agency.getAgencyAccount',
  sdkName: 'hire.v1.agency.getAgencyAccount',
  path: '/open-apis/hire/v1/agencies/get_agency_account',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Agency-Query the headhunting list of suppliers-Query the headhunting list according to the headhunting supplier ID',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      supplier_id: z
        .string()
        .describe(
          'The headhunting supplier ID can be obtained through the [Search headhunting supplier list] interface',
        ),
      status: z
        .number()
        .describe(
          'headhunting status Options:0(Normal),1(Enabled disabled),2(DisabledBySupplier Deactivated by headhunters)',
        )
        .optional(),
      role: z.number().describe('role Options:0(Manager administrator),1(Consultant)').optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id']).describe('User ID type').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('number of records fetched per page').optional(),
      })
      .optional(),
  },
};
export const hireV1AgencyOperateAgencyAccount = {
  project: 'hire',
  name: 'hire.v1.agency.operateAgencyAccount',
  sdkName: 'hire.v1.agency.operateAgencyAccount',
  path: '/open-apis/hire/v1/agencies/operate_agency_account',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Agency-Disable/undisable headhunting under headhunting supplier-The headhunter can be disabled/undisabled according to the headhunter ID',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      option: z.number().describe('operation type Options:1(Add disable),2(Remove cancel the ban)'),
      id: z
        .string()
        .describe(
          'The headhunting ID can be obtained through the [Query the headhunting list under the headhunting supplier] interface',
        ),
      reason: z.string().describe("Disable reason, required only if'option 'is'disabled'").optional(),
    }),
  },
};
export const hireV1AgencyProtect = {
  project: 'hire',
  name: 'hire.v1.agency.protect',
  sdkName: 'hire.v1.agency.protect',
  path: '/open-apis/hire/v1/agencies/protect',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Hire-Get candidates-Agency-Set agency protection period-Set agency protection period',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      talent_id: z.string().describe('Talent ID'),
      supplier_id: z.string().describe('Supplier ID'),
      consultant_id: z.string().describe('Agency Consultant ID'),
      protect_create_time: z.number().describe('Protection period creation time'),
      protect_expire_time: z.number().describe('Protection expiration time'),
      comment: z.string().describe('Recommendation').optional(),
      current_salary: z.string().describe('Current salary').optional(),
      expected_salary: z.string().describe('Expected salary').optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1AgencyProtectSearch = {
  project: 'hire',
  name: 'hire.v1.agency.protectSearch',
  sdkName: 'hire.v1.agency.protectSearch',
  path: '/open-apis/hire/v1/agencies/protection_period/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Agency-Query agency protection period information-Query agency protection period information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ talent_id: z.string().describe('Talent ID, [「Get talent ID by mobile or email」]') }),
  },
};
export const hireV1AgencyQuery = {
  project: 'hire',
  name: 'hire.v1.agency.query',
  sdkName: 'hire.v1.agency.query',
  path: '/open-apis/hire/v1/agencies/query',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Get candidates-Agency-Query agency information-Query agency information by name',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      name: z.string().describe('Agency Name'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
  },
};
export const hireV1ApplicationCancelOnboard = {
  project: 'hire',
  name: 'hire.v1.application.cancelOnboard',
  sdkName: 'hire.v1.application.cancelOnboard',
  path: '/open-apis/hire/v1/applications/:application_id/cancel_onboard',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Onboard-Cancel candidate enrollment-The operation candidate cancels the entry, which is applicable to cancel the entry in the waiting stage',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      termination_type: z
        .number()
        .describe(
          'Termination type Options:1(我们拒绝了候选人 We rejected the candidate),22(候选人拒绝了我们 The candidate rejected us),27(其他 Other)',
        ),
      termination_reason_id_list: z
        .array(z.string())
        .describe(
          'The id list of the specific reason for termination, please refer to [Get the reason for termination of application]',
        )
        .optional(),
      termination_reason_notes: z.string().describe('Remarks').optional(),
    }),
    path: z.object({ application_id: z.string().describe('Delivery ID') }),
  },
};
export const hireV1ApplicationCreate = {
  project: 'hire',
  name: 'hire.v1.application.create',
  sdkName: 'hire.v1.application.create',
  path: '/open-apis/hire/v1/applications',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Delivery management-Create application-Create application by job ID and talent ID',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      talent_id: z.string().describe('12312312312'),
      job_id: z.string().describe('Job ID'),
      user_id: z
        .string()
        .describe(
          'User ID，this field needs to be entered only when the delivery source is "employee transfer" or "intern transfer". After the verification data is correct, it will become a talent and employee relationship record maintained by the recruiter; when creating delivery from other sources, personnel and talents will not be bound',
        )
        .optional(),
      resume_source_id: z
        .string()
        .describe(
          'The resume source ID can be queried through the interface of 「obtaining the resume source list」. If the source type of resume belongs to "employee transfer" or "intern transfer", the talent must be in the on-the-job status',
        )
        .optional(),
      application_preferred_city_code_list: z
        .array(z.string())
        .describe(
          'The list of intended delivery cities can be obtained from the list of work locations returned by "Get Job Information"',
        )
        .optional(),
      delivery_type: z
        .number()
        .describe('Application method Options:1(HR_visit Sourced by HR),2(candidate_delivery Talent applied)')
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const hireV1ApplicationGet = {
  project: 'hire',
  name: 'hire.v1.application.get',
  sdkName: 'hire.v1.application.get',
  path: '/open-apis/hire/v1/applications/:application_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Delivery management-Get application information-Get application by application ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        options: z
          .array(
            z
              .literal('get_latest_application_on_chain')
              .describe(
                'Options:get_latest_application_on_chain(GetLatestApplicationOnChain Only effective for virtual job applications. - If the application is not assigned, the virtual job application is considered the latest application. The information of the specified virtual job application in the request will be returned. - If the application is assigned, it will return the information of the latest real job application on the assignment chain, not the specified application in the request.)',
              ),
          )
          .describe(
            'Request control parameters to control the interface response logic.If you need to query multiple user IDs at once, you can pass the same parameter name multiple times, each time with a different parameter value. For example: https://{url}?options={option1}&options={option2}',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ application_id: z.string().describe('Application ID') }),
  },
};
export const hireV1ApplicationGetDetail = {
  project: 'hire',
  name: 'hire.v1.application.getDetail',
  sdkName: 'hire.v1.application.getDetail',
  path: '/open-apis/hire/v1/applications/:application_id/get_detail',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Delivery management-Get application detail-Call the interface to obtain the application information and other entity information related to the delivery according to the delivery ID. The information of which related entities can be obtained on demand through the options parameter',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The department ID type used in this call Options:open_department_id(Identify the department by open_department_id, and get it through the [batch acquisition department information] interface),department_id(Identify the department by department_id, and get it through the [batch acquisition department information] interface)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "rank ID" used in this call Options:people_admin_job_level_id("HR system management background" applicable rank ID. HR system management background is gradually offline, it is recommended not to continue to use this ID.),job_level_id(The rank ID applicable to "Feishu Management Background" is obtained through the [Get Tenant Rank List] interface)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "sequence ID" used in this call Options:people_admin_job_category_id("HR system management background" applicable serial ID. HR system management background is gradually offline, it is recommended not to continue to use this ID.),job_family_id(The sequence ID applicable to "Feishu Management Background" is obtained through the [Get Tenant Sequence List] interface)',
          )
          .optional(),
        employee_type_id_type: z
          .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
          .describe(
            'The type of "person type ID" used in this call Options:people_admin_employee_type_id("HR system management background" applicable personnel type ID. HR system management background is gradually offline, it is recommended not to continue to use this ID.),employee_type_enum_id(The person type ID applicable to "Feishu Management Background" is obtained through the [Query Person Type] interface)',
          )
          .optional(),
        options: z
          .array(
            z
              .enum([
                'with_job',
                'with_talent',
                'with_interview',
                'with_offer',
                'with_evaluation',
                'with_employee',
                'with_agency',
                'with_referral',
                'with_portal',
              ])
              .describe(
                'Options:with_job(Return to job entity information),with_talent(Return to talent entity information),with_interview(Return to Interview Aggregate Entity Information),with_offer(Return Offer Entity Information),with_evaluation(Return to evaluation entity information),with_employee(Return to employee entity information),with_agency(Return to headhunter entity information),with_referral(Return referral entity information),with_portal(Return to the official website entity information)',
              ),
          )
          .describe(
            'The associated entity information acquisition parameter is used to specify which associated entity information to obtain. When not transmitted, only the delivery information is returned by default. If you need to query multiple entity information at one time, you can pass the same parameter name multiple times and pass different parameter values each time.For example: https://{url}? options = {option1} & options = {option2}',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({
        application_id: z
          .string()
          .describe('Delivery ID, which can be obtained through the [Get Delivery List] interface')
          .optional(),
      })
      .optional(),
  },
};
export const hireV1ApplicationInterviewList = {
  project: 'hire',
  name: 'hire.v1.applicationInterview.list',
  sdkName: 'hire.v1.applicationInterview.list',
  path: '/open-apis/hire/v1/applications/:application_id/interviews',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Deprecated Version (Not Recommended)-Hire-Interview-Get Interview List',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().describe('Page size'),
      page_token: z
        .string()
        .describe(
          'Pagination mark, the first request is not filled in, indicating the traversal from scratch; the paged query result will return a new page_token at the same time when there are more items, the next traversal can use this page_token to obtain the query result',
        )
        .optional(),
      user_id_type: z.enum(['user_id', 'union_id', 'open_id', 'people_admin_id']).describe('User ID type').optional(),
      job_level_id_type: z
        .enum(['people_admin_job_level_id', 'job_level_id'])
        .describe(
          'Options:people_admin_job_level_id(「人力系统管理后台」适用的职级 ID。人力系统管理后台逐步下线中，建议不继续使用此 ID。),job_level_id(「飞书管理后台」适用的职级 ID，通过「获取租户职级列表」接口获取)',
        )
        .optional(),
    }),
    path: z.object({ application_id: z.string().describe('Application ID') }),
  },
};
export const hireV1ApplicationList = {
  project: 'hire',
  name: 'hire.v1.application.list',
  sdkName: 'hire.v1.application.list',
  path: '/open-apis/hire/v1/applications',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Delivery management-Get application list-Get application list by query condition',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        process_id: z.string().describe('Filter by process').optional(),
        stage_id: z.string().describe('Filter by stage').optional(),
        talent_id: z.string().describe('Filter by talent').optional(),
        active_status: z
          .string()
          .describe('Filter by active status 1 = active application, 2 = inactive application, 3 = all,')
          .optional(),
        job_id: z.string().describe('Job ID').optional(),
        lock_status: z
          .array(z.number().describe('Options:1(Not locked),2(Locking in other jobs),3(Locking in the current job)'))
          .describe('Locking status')
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('Page size').optional(),
        update_start_time: z.string().describe('The earliest update time, millisecond timestamp').optional(),
        update_end_time: z.string().describe('Latest update time, millisecond timestamp').optional(),
      })
      .optional(),
  },
};
export const hireV1ApplicationOffer = {
  project: 'hire',
  name: 'hire.v1.application.offer',
  sdkName: 'hire.v1.application.offer',
  path: '/open-apis/hire/v1/applications/:application_id/offer',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Offer-Get offer information-Get offer information application ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The Type Of Department ID Used In This Call Options:open_department_id(Identify Departments By open_department_id),department_id(Identify Departments By department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "rank ID" used in this call Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
        employee_type_id_type: z
          .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
          .describe(
            'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ application_id: z.string().describe('Application ID,please refer to: [Get application list]') }),
  },
};
export const hireV1ApplicationRecover = {
  project: 'hire',
  name: 'hire.v1.application.recover',
  sdkName: 'hire.v1.application.recover',
  path: '/open-apis/hire/v1/applications/:application_id/recover',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Delivery management-Recover Application-Recover "terminated" deliveries according to the application ID',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ application_id: z.string().describe('Application ID, please refer to: [Get application list]') }),
  },
};
export const hireV1ApplicationTerminate = {
  project: 'hire',
  name: 'hire.v1.application.terminate',
  sdkName: 'hire.v1.application.terminate',
  path: '/open-apis/hire/v1/applications/:application_id/terminate',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Delivery management-Terminate application-Modify the application status to "terminated" according to the application ID',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      termination_type: z
        .number()
        .describe(
          'Type of termination reason Options:1(我们拒绝了候选人 We rejected the candidate),22(候选人拒绝了我们 The candidate rejected us),27(其他 Other)',
        ),
      termination_reason_list: z
        .array(z.string())
        .describe(
          'The id list of the specific reason for termination, please refer to [Get the termination reason for application]',
        )
        .optional(),
      termination_reason_note: z.string().describe('Termination remarks').optional(),
    }),
    path: z.object({ application_id: z.string().describe('Application ID, please refer to [Get Application List]') }),
  },
};
export const hireV1ApplicationTransferOnboard = {
  project: 'hire',
  name: 'hire.v1.application.transferOnboard',
  sdkName: 'hire.v1.application.transferOnboard',
  path: '/open-apis/hire/v1/applications/:application_id/transfer_onboard',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Onboard-Transfer talent to onboarding-Manage candidate onboarding and create employees according to the delivery ID. The delivery must be in the "Prehire" stage, and the delivery status can be changed through the "Transfer Stage" interface',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        actual_onboard_time: z.number().describe('Actual onboard time').optional(),
        expected_conversion_time: z.number().describe('Expected confirmation time').optional(),
        job_requirement_id: z
          .string()
          .describe(
            'Job requirement ID. It can be obtained through the interface [Get job requirement list]. Whether it must be entered depends on the configuration of "Recruitment request association settings" by the admin in the system backend. After onboarding is completed, the "Onboarded" number for the recruitment request will increase by 1',
          )
          .optional(),
        operator_id: z
          .string()
          .describe('Operator UserID，Consistent with the type of the entry `user_id_type`')
          .optional(),
        onboard_city_code: z.string().describe('Office location').optional(),
        department: z.string().describe('Entry Department').optional(),
        leader: z.string().describe('Direct manager，Consistent with the type of the entry `user_id_type`').optional(),
        sequence: z.string().describe('Sequence').optional(),
        level: z.string().describe('Rank').optional(),
        employee_type: z
          .string()
          .describe(
            'Candidate entry type ID, which can be obtained through the interface human resource planning platform "Get Employee Type List", which will be used for candidate referral award rule judgment',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_admin_department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id),people_admin_department_id(Identify departments by people_admin_department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
        employee_type_id_type: z
          .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
          .describe(
            'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ application_id: z.string().describe('Application ID') }),
  },
};
export const hireV1ApplicationTransferStage = {
  project: 'hire',
  name: 'hire.v1.application.transferStage',
  sdkName: 'hire.v1.application.transferStage',
  path: '/open-apis/hire/v1/applications/:application_id/transfer_stage',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Delivery management-Transfer delivery stage-Transfer delivery stage. When "All positions require offer approval" is turned on, the offer will be transferred to the waiting stage that requires approval',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      stage_id: z
        .string()
        .describe(
          'The stage ID to transfer to, you can get the stage ID enumeration through the "Get Recruitment Process Information" interface',
        ),
    }),
    path: z.object({ application_id: z.string().describe('Delivery ID') }),
  },
};
export const hireV1AttachmentGet = {
  project: 'hire',
  name: 'hire.v1.attachment.get',
  sdkName: 'hire.v1.attachment.get',
  path: '/open-apis/hire/v1/attachments/:attachment_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Attachment-Get attachment information-Obtain the meta-information of the attachment in the recruitment system according to the ID of the talent resume attachment, such as file name, creation time, file URL, etc., The resume attachment of the talent can be obtained through the [Access Talent Information] Interface',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        type: z
          .number()
          .describe(
            'Attachment type Options:1(附件简历 Attachment Resume),2(候选人作品 Candidate works),3(自定义附件 Custom attachments)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ attachment_id: z.string().describe('Attachment id') }),
  },
};
export const hireV1AttachmentPreview = {
  project: 'hire',
  name: 'hire.v1.attachment.preview',
  sdkName: 'hire.v1.attachment.preview',
  path: '/open-apis/hire/v1/attachments/:attachment_id/preview',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Attachment-Get attachment PDF download link-Obtain the attachment preview information according to the ID of the talent resume attachment, and obtain the resume attachment of the talent through the [Get talent] api',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ attachment_id: z.string().describe('Attachment id, please refer to [Get talent]') }),
  },
};
export const hireV1BackgroundCheckOrderList = {
  project: 'hire',
  name: 'hire.v1.backgroundCheckOrder.list',
  sdkName: 'hire.v1.backgroundCheckOrder.list',
  path: '/open-apis/hire/v1/background_check_orders',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Background check-Get background check info list-Get the background check order information in batches according to the application ID or background check update time',
  accessTokens: ['tenant'],
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
        page_size: z.number().describe('Page size').optional(),
        application_id: z.string().describe('Delivery ID').optional(),
        update_start_time: z.string().describe('The earliest update time, millisecond timestamp').optional(),
        update_end_time: z.string().describe('Latest update time, millisecond timestamp').optional(),
      })
      .optional(),
  },
};
export const hireV1DiversityInclusionSearch = {
  project: 'hire',
  name: 'hire.v1.diversityInclusion.search',
  sdkName: 'hire.v1.diversityInclusion.search',
  path: '/open-apis/hire/v1/applications/diversity_inclusions/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Delivery management-Get Additional Info in Application Form-Get application form additional information of candidates. You can query by Application ID or Talent ID',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        talent_ids: z
          .array(z.string())
          .describe(
            'List of talent IDs that need to query DI data, please refer to [Get talent list] to get talent IDs',
          )
          .optional(),
        application_ids: z
          .array(z.string())
          .describe(
            'List of application IDs that need to query DI data, please refer to[Get application list] to get application IDs',
          )
          .optional(),
      })
      .optional(),
  },
};
export const hireV1EcoAccountCustomFieldBatchDelete = {
  project: 'hire',
  name: 'hire.v1.ecoAccountCustomField.batchDelete',
  sdkName: 'hire.v1.ecoAccountCustomField.batchDelete',
  path: '/open-apis/hire/v1/eco_account_custom_fields/batch_delete',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Hire-Ecological docking-account-Delete account customized fields-Feishu Hire's back check or written test service provider can delete account customization fields (such as the customer's tenant ID, account ID, etc.) at the service provider through this interface",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      scope: z.number().describe('scope Options:1(背调 Background Check),2(笔试 Exam)'),
      custom_field_key_list: z.array(z.string()).describe('List of keys for custom fields to delete').optional(),
    }),
  },
};
export const hireV1EcoAccountCustomFieldBatchUpdate = {
  project: 'hire',
  name: 'hire.v1.ecoAccountCustomField.batchUpdate',
  sdkName: 'hire.v1.ecoAccountCustomField.batchUpdate',
  path: '/open-apis/hire/v1/eco_account_custom_fields/batch_update',
  httpMethod: 'PATCH',
  description:
    "[Feishu/Lark]-Hire-Ecological docking-account-Update account customized fields-Feishu Hire's back-end or written test service provider can update the name and description of account customization fields (such as the customer's tenant ID at the service provider, account ID, etc.) through this interface",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      scope: z.number().describe('Account Custom Field Scope Options:1(背调 Background Check),2(笔试 Exam)'),
      custom_field_list: z
        .array(
          z.object({
            key: z.string().describe('The identity of a custom field that already exists under the current `scope`'),
            name: z
              .object({
                zh_cn: z.string().describe('Custom field Chinese name').optional(),
                en_us: z.string().describe('Custom field English name').optional(),
              })
              .describe(
                'The name of the custom field. The title of the form control that users see when adding an account under "Feishu Hire" - "Settings" - "Ecological Docking" - "Written Test/Background Check"',
              ),
            is_required: z
              .boolean()
              .describe(
                'Is it required?**Optional values are**:* `true`: required* `false`: not required**NOTE**: This field is not valid in the current interface',
              ),
            description: z
              .object({
                zh_cn: z.string().describe('Chinese name').optional(),
                en_us: z.string().describe('English name').optional(),
              })
              .describe('Description')
              .optional(),
          }),
        )
        .describe('Custom Field List'),
    }),
  },
};
export const hireV1EcoAccountCustomFieldCreate = {
  project: 'hire',
  name: 'hire.v1.ecoAccountCustomField.create',
  sdkName: 'hire.v1.ecoAccountCustomField.create',
  path: '/open-apis/hire/v1/eco_account_custom_fields',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Hire-Ecological docking-account-Create account customized field-Feishu Hire's back check or written test service provider can create account customization fields through this interface to identify the identity of Feishu Hire customers at the service provider (such as the customer's tenant ID, account ID, etc.)",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      scope: z.number().describe('Account Custom Field Scope Options:1(背调 Background Check),2(笔试 Exam)'),
      custom_field_list: z
        .array(
          z.object({
            key: z.string().describe('The identity of the custom field. It must be unique within the same `scope`'),
            name: z
              .object({
                zh_cn: z.string().describe('Custom field Chinese name').optional(),
                en_us: z.string().describe('Custom field English name').optional(),
              })
              .describe('Name'),
            is_required: z
              .boolean()
              .describe('Is it required?**Optional values are**:* `true`: required* `false`: not required'),
            description: z
              .object({
                zh_cn: z.string().describe('Chinese name').optional(),
                en_us: z.string().describe('English name').optional(),
              })
              .describe('Description')
              .optional(),
          }),
        )
        .describe('Custom Field List'),
    }),
  },
};
export const hireV1EcoBackgroundCheckCustomFieldBatchDelete = {
  project: 'hire',
  name: 'hire.v1.ecoBackgroundCheckCustomField.batchDelete',
  sdkName: 'hire.v1.ecoBackgroundCheckCustomField.batchDelete',
  path: '/open-apis/hire/v1/eco_background_check_custom_fields/batch_delete',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Ecological docking-background check-Delete background check customized fields-Delete the form custom fields that the user displays when initiating a back call',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      account_id: z.string().describe('The account ID can be obtained through the [account binding] event'),
    }),
  },
};
export const hireV1EcoBackgroundCheckCustomFieldBatchUpdate = {
  project: 'hire',
  name: 'hire.v1.ecoBackgroundCheckCustomField.batchUpdate',
  sdkName: 'hire.v1.ecoBackgroundCheckCustomField.batchUpdate',
  path: '/open-apis/hire/v1/eco_background_check_custom_fields/batch_update',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Hire-Ecological docking-background check-Update background check customized fields-Updates the form custom field names and descriptions that the user displays when initiating a back call',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      account_id: z.string().describe('The account ID can be obtained through the [account binding] event'),
      custom_field_list: z
        .array(
          z.object({
            type: z
              .enum(['text', 'textarea', 'number', 'boolean', 'select', 'multiselect', 'date', 'file', 'resume'])
              .describe(
                'Custom Field Data Options:text(Single line of text, up to 100 Chinese characters),textarea(MultiText Multi-line text, up to 200 Chinese characters),number(number),boolean(Boolean),select(Choice radio),multiselect(MultiChoice multiple choice),date(date),file(Attachment Annex),resume(Candidate resume)',
              ),
            key: z.string().describe('The identity of a custom field, unique within the same account'),
            name: z
              .object({
                zh_cn: z.string().describe('Chinese name').optional(),
                en_us: z.string().describe('English name').optional(),
              })
              .describe('Name'),
            is_required: z.boolean().describe('Is Reuqired'),
            description: z
              .object({
                zh_cn: z.string().describe('Chinese description').optional(),
                en_us: z.string().describe('English description').optional(),
              })
              .describe('Description')
              .optional(),
            options: z
              .array(
                z.object({
                  key: z.string().describe('Unique identifier of the option'),
                  name: z
                    .object({
                      zh_cn: z.string().describe('Chinese name').optional(),
                      en_us: z.string().describe('English name').optional(),
                    })
                    .describe('Name'),
                }),
              )
              .describe('Options')
              .optional(),
          }),
        )
        .describe(
          'Custom field list. **Note**: The list length must be the same as the one passed in when [Create Backtone Custom Field]',
        ),
    }),
  },
};
export const hireV1EcoBackgroundCheckCustomFieldCreate = {
  project: 'hire',
  name: 'hire.v1.ecoBackgroundCheckCustomField.create',
  sdkName: 'hire.v1.ecoBackgroundCheckCustomField.create',
  path: '/open-apis/hire/v1/eco_background_check_custom_fields',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Ecological docking-background check-Push background check customzied fields-Customize the form fields that the user displays when launching the background check. The field can be set to required or non-required',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      account_id: z.string().describe('Account ID'),
      custom_field_list: z
        .array(
          z.object({
            type: z
              .enum(['text', 'textarea', 'number', 'boolean', 'select', 'multiselect', 'date', 'file', 'resume'])
              .describe(
                'Custom Field Data Options:text(Single line of text, up to 100 Chinese characters),textarea(MultiText Multi-line text, up to 200 Chinese characters),number(number),boolean(Boolean),select(Choice radio),multiselect(MultiChoice multiple choice),date(date),file(Attachment Annex),resume(Candidate resume)',
              ),
            key: z.string().describe('Key'),
            name: z
              .object({
                zh_cn: z.string().describe('Chinese').optional(),
                en_us: z.string().describe('English').optional(),
              })
              .describe('Name'),
            is_required: z.boolean().describe('Is Reuqired'),
            description: z
              .object({
                zh_cn: z.string().describe('Chinese').optional(),
                en_us: z.string().describe('English').optional(),
              })
              .describe('Description')
              .optional(),
            options: z
              .array(
                z.object({
                  key: z.string().describe('Key'),
                  name: z
                    .object({
                      zh_cn: z.string().describe('Chinese').optional(),
                      en_us: z.string().describe('English').optional(),
                    })
                    .describe('Name'),
                }),
              )
              .describe('Options')
              .optional(),
          }),
        )
        .describe('Custom Field List'),
    }),
  },
};
export const hireV1EcoBackgroundCheckPackageBatchDelete = {
  project: 'hire',
  name: 'hire.v1.ecoBackgroundCheckPackage.batchDelete',
  sdkName: 'hire.v1.ecoBackgroundCheckPackage.batchDelete',
  path: '/open-apis/hire/v1/eco_background_check_packages/batch_delete',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Ecological docking-background check-Delete background check package-Delete the backup plan and additional survey item information under the backup account. The deletion operation will not affect the created backup',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      account_id: z.string().describe('The account ID can be obtained through the [account binding] event'),
      package_id_list: z
        .array(z.string())
        .describe('List of package IDs to delete. Deleting a package does not affect scheduled backups')
        .optional(),
      additional_item_id_list: z
        .array(z.string())
        .describe(
          'List of additional survey item IDs to delete. Deleting an additional survey item does not affect scheduled backcalls',
        )
        .optional(),
    }),
  },
};
export const hireV1EcoBackgroundCheckPackageBatchUpdate = {
  project: 'hire',
  name: 'hire.v1.ecoBackgroundCheckPackage.batchUpdate',
  sdkName: 'hire.v1.ecoBackgroundCheckPackage.batchUpdate',
  path: '/open-apis/hire/v1/eco_background_check_packages/batch_update',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Hire-Ecological docking-background check-Update background check package-Update the background adjustment package and additional survey item information under the specified background adjustment account. If you need to add a background adjustment package and additional survey items, please use [Create a background adjustment package and additional survey items] to add',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      account_id: z.string().describe('Account ID'),
      package_list: z
        .array(
          z.object({
            id: z.string().describe('The existing package ID under the account'),
            name: z.string().describe('Package Name'),
            description: z.string().describe('Package Description').optional(),
          }),
        )
        .describe('Package List'),
      additional_item_list: z
        .array(
          z.object({
            id: z.string().describe('Additional survey item IDs already under the account'),
            name: z.string().describe('Addition Item Name'),
            description: z.string().describe('Package Additional Item Description').optional(),
          }),
        )
        .describe('Package Additional Items')
        .optional(),
    }),
  },
};
export const hireV1EcoBackgroundCheckPackageCreate = {
  project: 'hire',
  name: 'hire.v1.ecoBackgroundCheckPackage.create',
  sdkName: 'hire.v1.ecoBackgroundCheckPackage.create',
  path: '/open-apis/hire/v1/eco_background_check_packages',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Ecological docking-background check-Create background check package-Creates a list of available backtune packages and a list of additional survey item information under the specified backtune account. The interface is created incrementally, and each call is added to the original package list and the list of additional survey items',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      account_id: z.string().describe('The account ID can be obtained through the [account binding] event'),
      package_list: z
        .array(
          z.object({
            id: z.string().describe('Package ID. Customized by the caller'),
            name: z.string().describe('Package Name'),
            description: z.string().describe('Package Description').optional(),
          }),
        )
        .describe('Package List'),
      additional_item_list: z
        .array(
          z.object({
            id: z.string().describe('Attachment survey item ID. Customized by the caller'),
            name: z.string().describe('Addition Item Name'),
            description: z.string().describe('Package Additional Item Description').optional(),
          }),
        )
        .describe('Package Additional Items')
        .optional(),
    }),
  },
};
export const hireV1EcoBackgroundCheckCancel = {
  project: 'hire',
  name: 'hire.v1.ecoBackgroundCheck.cancel',
  sdkName: 'hire.v1.ecoBackgroundCheck.cancel',
  path: '/open-apis/hire/v1/eco_background_checks/cancel',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Ecological docking-background check-Cancel background check order-Calling this interface will change the status of the back-up order to terminated, and the terminated order will not be able to update the order progress to "terminated" through the [Update Back-up Order Progress] and [Return the final result of the back-up order]. Before calling this interface, it is recommended to call the [Update Back-up Order Progress] interface to update the order progress to" terminated "',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      background_check_id: z.string().describe('Backtone ID. Can be obtained by the [Create Backtone] event'),
    }),
  },
};
export const hireV1EcoBackgroundCheckUpdateProgress = {
  project: 'hire',
  name: 'hire.v1.ecoBackgroundCheck.updateProgress',
  sdkName: 'hire.v1.ecoBackgroundCheck.updateProgress',
  path: '/open-apis/hire/v1/eco_background_checks/update_progress',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Ecological docking-background check-Update background check order process-Update the progress information and stage report of the specified back adjustment. The progress information will be displayed on the back adjustment card to push the back adjustment progress and stage report, inform users of the current circulation status of system orders',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      background_check_id: z.string().describe('Backtone ID. Can be obtained by the [Create Backtone] event'),
      stage_id: z
        .string()
        .describe('Stage ID. This ID cannot be repeated for the same back order and is customized by the caller'),
      stage_en_name: z.string().describe('Dorsal stage English name').optional(),
      stage_name: z.string().describe('Stage Name'),
      stage_time: z
        .string()
        .describe(
          'Stage progress update time. Millisecond timestamp, this field should be strictly incremented each time it is called',
        ),
      result: z
        .string()
        .describe(
          'Background results (progress background results). Note: To return this field, report_file_list required',
        )
        .optional(),
      report_file_list: z
        .array(
          z.object({
            report_name: z.string().describe('Report Name'),
            report_url: z
              .string()
              .describe(
                'Report address; when report_url_type is empty or 1, it must be a link to download pdf; when it is 2, it is a preview link',
              ),
            report_url_type: z
              .number()
              .describe(
                'Report address type; enumeration values 1 or empty are downloadable pdf links, 2 are preview links Options:1(DownloadLink Downloadable link),2(ExternalLink external link)',
              )
              .optional(),
          }),
        )
        .describe('Report List')
        .optional(),
    }),
  },
};
export const hireV1EcoBackgroundCheckUpdateResult = {
  project: 'hire',
  name: 'hire.v1.ecoBackgroundCheck.updateResult',
  sdkName: 'hire.v1.ecoBackgroundCheck.updateResult',
  path: '/open-apis/hire/v1/eco_background_checks/update_result',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Ecological docking-background check-Update background check order result-Return the final result and final report of the back call. After the back call, if the tenant does not enable the back call report approval function, the back call order status will directly change to "Completed". If the back call report approval function is enabled, the order status will flow to "Completed" after the administrator approval is approved',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      background_check_id: z.string().describe('Backtone ID. Can be obtained by the [Create Backtone] event'),
      result: z.string().describe('Result'),
      result_time: z.string().describe('Result Time. Millisecond timestamp'),
      report_file_list: z
        .array(
          z.object({
            report_name: z.string().describe('Report Name'),
            report_url: z
              .string()
              .describe(
                'Report address; when report_url_type is empty or 1, it must be a link to download pdf; when it is 2, it is a preview link',
              ),
            report_url_type: z
              .number()
              .describe(
                'Report address type; enumeration values is empty or 1 are downloadable pdf links, 2 are preview links Options:1(DownloadLink Downloadable link),2(ExternalLink external link)',
              )
              .optional(),
          }),
        )
        .describe('Report FIle List')
        .optional(),
    }),
  },
};
export const hireV1EcoExamPaperBatchDelete = {
  project: 'hire',
  name: 'hire.v1.ecoExamPaper.batchDelete',
  sdkName: 'hire.v1.ecoExamPaper.batchDelete',
  path: '/open-apis/hire/v1/eco_exam_papers/batch_delete',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Hire-Ecological docking-exam-Delete exam paper list-Feishu Hire's written test service provider can delete the list of test papers under the customer's written test account through this interface. The deletion operation does not affect the scheduled written test, and there will be no error when deleting non-existent test papers",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      account_id: z
        .string()
        .describe('The account ID of the written test can be obtained through the [account binding] event'),
      paper_id_list: z.array(z.string()).describe('List of paper IDs. The ID passed in by [Create Paper List]'),
    }),
  },
};
export const hireV1EcoExamPaperBatchUpdate = {
  project: 'hire',
  name: 'hire.v1.ecoExamPaper.batchUpdate',
  sdkName: 'hire.v1.ecoExamPaper.batchUpdate',
  path: '/open-apis/hire/v1/eco_exam_papers/batch_update',
  httpMethod: 'PATCH',
  description:
    "[Feishu/Lark]-Hire-Ecological docking-exam-Update exam paper-Feishu Hire's written test service provider can update the list of test papers under the customer's written test account through this interface",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      account_id: z
        .string()
        .describe('The account ID of the written test can be obtained through the [account binding] event'),
      paper_list: z
        .array(
          z.object({
            id: z.string().describe('Paper ID, which is the ID passed in through [Create Paper List]'),
            name: z
              .string()
              .describe(
                'Paper name**Note**: The length of the test paper name should not exceed `255` characters, and the excess will be truncated',
              ),
            duration: z.number().describe('Duration').optional(),
            question_count: z.number().describe('Paper Question Count').optional(),
            start_time: z
              .string()
              .describe(
                'Exam start time, millisecond timestamp. Leave blank or not pass to indicate an unlimited start time.**Note**: If the value is passed and the end_time is not empty, the start time must be less than the end time',
              )
              .optional(),
            end_time: z
              .string()
              .describe(
                'Exam end time, millisecond timestamp. Leave blank or not pass to indicate unlimited end time**Note**: If the value is passed and the start_time is not empty, the end time must be greater than the start time',
              )
              .optional(),
          }),
        )
        .describe('Papers'),
    }),
  },
};
export const hireV1EcoExamPaperCreate = {
  project: 'hire',
  name: 'hire.v1.ecoExamPaper.create',
  sdkName: 'hire.v1.ecoExamPaper.create',
  path: '/open-apis/hire/v1/eco_exam_papers',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Ecological docking-exam-Create exam paper-Feishu Hire\'s written test service provider can create a list of test papers under the customer\'s written test account through this interface after completing [Account Binding]. If the customer\'s written test account is "not activated" or "disabled", after the test paper is created successfully, the customer\'s account will become "normal" and the written test can be arranged normally',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      account_id: z
        .string()
        .describe('The account ID of the written test can be obtained through the [account binding] event'),
      paper_list: z
        .array(
          z.object({
            id: z
              .string()
              .describe(
                'Paper ID. Customized by caller **Note**: The length of the test paper ID should not exceed `255` characters, and the excess will be truncated',
              ),
            name: z
              .string()
              .describe(
                'Paper name**Note**: The length of the test paper name should not exceed `255` characters, and the excess will be truncated',
              ),
            duration: z.number().describe('Duration').optional(),
            question_count: z.number().describe('Paper Question Count').optional(),
            start_time: z
              .string()
              .describe(
                'Exam start time, millisecond timestamp. Leave blank or not pass to indicate an unlimited start time. **Note**: If the value is passed and the end_time is not empty, the start time must be less than the end time',
              )
              .optional(),
            end_time: z
              .string()
              .describe(
                'Exam end time, millisecond timestamp. Leave blank or not pass to indicate unlimited end time **NOTE**: If the value is passed and the start_time is not empty, the end time must be greater than the start time',
              )
              .optional(),
          }),
        )
        .describe('Papers'),
    }),
  },
};
export const hireV1EcoExamLoginInfo = {
  project: 'hire',
  name: 'hire.v1.ecoExam.loginInfo',
  sdkName: 'hire.v1.ecoExam.loginInfo',
  path: '/open-apis/hire/v1/eco_exams/:exam_id/login_info',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Ecological docking-exam-Post exam login info-The written test service provider of Feishu Hire, after receiving the [Create Written Test] event and arranging the written test, should go through this interfaceReturn the result of the written test arrangement. If the arrangement is successful, the written test link must be returned; if the written test link requires login authentication, the login certificate(`username`, `password`) must be returned',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      result: z
        .number()
        .describe('Status code. * 0: Success* Non-0: Failure error code within the service provider')
        .optional(),
      msg: z.string().describe('Msg').optional(),
      exam_login_info: z
        .object({
          exam_url: z
            .string()
            .describe(
              'Written test link. If the returned link is already accompanied by the unique identity of the candidate and does not require login authentication, you can only return this link',
            ),
          username: z
            .string()
            .describe(
              'Login username.**Note**: If the written test link requires login authentication, this login certificate must be returned',
            )
            .optional(),
          password: z
            .string()
            .describe(
              'Login password.**Note**: If the written test link requires login authentication, this login certificate must be returned',
            )
            .optional(),
        })
        .describe('Login Info'),
    }),
    path: z.object({
      exam_id: z.string().describe('Written test ID. Can be obtained by the [Create Written Test] event'),
    }),
  },
};
export const hireV1EcoExamUpdateResult = {
  project: 'hire',
  name: 'hire.v1.ecoExam.updateResult',
  sdkName: 'hire.v1.ecoExam.updateResult',
  path: '/open-apis/hire/v1/eco_exams/:exam_id/update_result',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Hire-Ecological docking-exam-Post exam result-Feishu Hire's written test service provider can send back the candidate's written test results through this interface. After returning the written test results, the candidate's written test status in Feishu Hire will change to \"Answered\"",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      result: z
        .string()
        .describe(
          'Written test results. Indicates the written test results of the candidates for the written test. It is recommended to pass numbers (string format) of "0" - "100", such as "60", "90", etc',
        ),
      result_time: z.string().describe('Time').optional(),
      report_list: z
        .array(
          z.object({
            name: z.string().describe('Report'),
            url: z.string().describe('Report link'),
            answer_time: z.string().describe('Answer completion time, millisecond timestamp').optional(),
          }),
        )
        .describe('Report List')
        .optional(),
      detail_list: z
        .array(
          z.object({
            id: z.string().describe('Evaluation item ID, customized by the caller').optional(),
            name: z
              .string()
              .describe(
                'Evaluation item name, customized by the caller. A single call supports multiple identical evaluation item names, and the results will be displayed side by side in "Feishu Hire" - "Candidate Details" - "Written Test Card"',
              ),
            result: z.string().describe('Evaluation results, customized by the caller'),
          }),
        )
        .describe('Detail List')
        .optional(),
    }),
    path: z.object({
      exam_id: z.string().describe('Written test ID, which can be obtained by the [Create Written Test] event'),
    }),
  },
};
export const hireV1EhrImportTaskPatch = {
  project: 'hire',
  name: 'hire.v1.ehrImportTask.patch',
  sdkName: 'hire.v1.ehrImportTask.patch',
  path: '/open-apis/hire/v1/ehr_import_tasks/:ehr_import_task_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Onboard-Update e-HR importing task-Update e-HR importing task',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      fail_reason: z.string().describe('Reason for failure').optional(),
      redirect_url: z
        .string()
        .describe(
          'Jump link. To return to the jump link, please go to "Settings - ecological docking - e-HR / OA office system - Import e-HR" function settings "of flybook recruitment and turn on the" return to external link of e-HR / OA system supporting docking "switch',
        )
        .optional(),
      state: z.number().describe('Status Options:1(导入成功 Import successful),2(导入失败 Import failed)'),
    }),
    path: z.object({
      ehr_import_task_id: z
        .string()
        .describe(
          'Import the task ID, the task ID comes from the task_id in the import e-HR event, refer to [Import e-HR]',
        ),
    }),
  },
};
export const hireV1EmployeeGet = {
  project: 'hire',
  name: 'hire.v1.employee.get',
  sdkName: 'hire.v1.employee.get',
  path: '/open-apis/hire/v1/employees/:employee_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Onboard-Get onboard information by employee ID-Get employee info by employee ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_admin_department_id'])
          .describe(
            'The Type Of Department ID Used In This Call Options:open_department_id(Identify Departments By open_department_id),department_id(Identify departments by department_id),people_admin_department_id(Identify Departments By people_admin_department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
        employee_type_id_type: z
          .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
          .describe(
            'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      employee_id: z.string().describe('Employee ID,please refer to:[Get onboard information by application ID]'),
    }),
  },
};
export const hireV1EmployeeGetByApplication = {
  project: 'hire',
  name: 'hire.v1.employee.getByApplication',
  sdkName: 'hire.v1.employee.getByApplication',
  path: '/open-apis/hire/v1/employees/get_by_application',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Onboard-Get onboard information by application ID-Get employee info by application ID',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      application_id: z.string().describe('Application ID, please refer to: [Get application list]'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      department_id_type: z
        .enum(['open_department_id', 'department_id', 'people_admin_department_id'])
        .describe(
          'The Type Of Department ID Used In This Call Options:open_department_id(Identify Departments By open_department_id),department_id(Identify Departments By department_id),people_admin_department_id(Identify Departments By people_admin_department_id)',
        )
        .optional(),
      job_level_id_type: z
        .enum(['people_admin_job_level_id', 'job_level_id'])
        .describe(
          'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
        )
        .optional(),
      job_family_id_type: z
        .enum(['people_admin_job_category_id', 'job_family_id'])
        .describe(
          'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
        )
        .optional(),
      employee_type_id_type: z
        .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
        .describe(
          'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
        )
        .optional(),
    }),
  },
};
export const hireV1EmployeePatch = {
  project: 'hire',
  name: 'hire.v1.employee.patch',
  sdkName: 'hire.v1.employee.patch',
  path: '/open-apis/hire/v1/employees/:employee_id',
  httpMethod: 'PATCH',
  description:
    "[Feishu/Lark]-Hire-Candidate management-Delivery process-Onboard-Update talent onboarding status-Update employee's employment status and resignation status by employee ID",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      operation: z
        .number()
        .describe(
          'Operation Options:1(Convert),2(Overboard),3(Cancel Restore to "To be onboarded"),4(WithdrawOverboard Withdraw overboard (Restore to "Onboarded")),5(WithdrawConversion Withdraw conversion (Restore to "Pending conversion"))',
        ),
      conversion_info: z
        .object({ actual_conversion_time: z.number().describe('Actual conversion time').optional() })
        .describe('Conversion info，Required when operating employees become regular employees')
        .optional(),
      overboard_info: z
        .object({
          actual_overboard_time: z.number().describe('Actual overboard time').optional(),
          overboard_note: z.string().describe('Overboard note').optional(),
        })
        .describe('Overboard info，Required when operating employees Overboard')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id', 'people_admin_department_id'])
          .describe(
            'The Type Of Department ID Used In This Call Options:open_department_id(Identify Departments By open_department_id),department_id(Identify Departments By department_id),people_admin_department_id(Identify Departments By people_admin_department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
        employee_type_id_type: z
          .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
          .describe(
            'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ employee_id: z.string().describe('Employee id') }),
  },
};
export const hireV1EvaluationTaskList = {
  project: 'hire',
  name: 'hire.v1.evaluationTask.list',
  sdkName: 'hire.v1.evaluationTask.list',
  path: '/open-apis/hire/v1/evaluation_tasks',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Recruitment process follow-up-Get employee evaluation tasks-Get employee evaluation tasks',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id: z.string().describe('User ID'),
      activity_status: z
        .number()
        .describe('Task status Options:1(待评估 To be assessed),2(已评估 Evaluated),3(无需评估 No evaluation required)')
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
    }),
  },
};
export const hireV1EvaluationList = {
  project: 'hire',
  name: 'hire.v1.evaluation.list',
  sdkName: 'hire.v1.evaluation.list',
  path: '/open-apis/hire/v1/evaluations',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Evaluation-Get resume evaluation information list-Batch get resume evaluation information',
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
        page_size: z.number().optional(),
        application_id: z.string().describe('Delivery ID').optional(),
        update_start_time: z.string().describe('The earliest update time, millisecond timestamp').optional(),
        update_end_time: z.string().describe('Latest update time, millisecond timestamp').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1ExamMarkingTaskList = {
  project: 'hire',
  name: 'hire.v1.examMarkingTask.list',
  sdkName: 'hire.v1.examMarkingTask.list',
  path: '/open-apis/hire/v1/exam_marking_tasks',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Recruitment process follow-up-Get user exam marking tasks-Get employee written examination marking tasks',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id: z.string().describe('User ID'),
      activity_status: z.number().describe('Task status Options:1(待阅卷 Pending marking),2(已阅卷 Marked)').optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
    }),
  },
};
export const hireV1ExamCreate = {
  project: 'hire',
  name: 'hire.v1.exam.create',
  sdkName: 'hire.v1.exam.create',
  path: '/open-apis/hire/v1/exams',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Exam-Add written test results-Add the written test result under the delivery according to the delivery ID',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      application_id: z.string().describe('Delivery ID'),
      exam_resource_name: z.string().describe('Paper name'),
      score: z.number().describe('Written test score'),
      uuid: z
        .string()
        .describe(
          'Report attachment, use [Create attachment] upload, get attachment ID, supported file formats: JPG, JPEG, PNG, PDF, not more than 100MB',
        )
        .optional(),
      operator_id: z.string().describe('Add person ID'),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1ExternalApplicationCreate = {
  project: 'hire',
  name: 'hire.v1.externalApplication.create',
  sdkName: 'hire.v1.externalApplication.create',
  path: '/open-apis/hire/v1/external_applications',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External application info-Create external application-Create external application',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      external_id: z.string().describe('External System Application Primary Key (idempotent only)').optional(),
      job_recruitment_type: z
        .number()
        .describe('Job Type Options:1(social_recruitment social recruitment),2(campus_recruitment Campus recruitment)')
        .optional(),
      job_title: z.string().describe('Job title').optional(),
      resume_source: z.string().describe('Resume source').optional(),
      stage: z.string().describe('Stage').optional(),
      talent_id: z.string().describe('Talent ID'),
      termination_reason: z.string().describe('Reason for termination').optional(),
      delivery_type: z
        .number()
        .describe(
          'Delivery Type Options:1(HR_visit HR search),2(candidate_delivery Candidate unsolicited delivery),3(talent_recommend Talent recommendation),4(others other)',
        )
        .optional(),
      modify_time: z.number().describe('Termination time in the external system for the application').optional(),
      create_time: z.number().describe('Creation time in the external system for the application').optional(),
      termination_type: z.string().describe('Termination type').optional(),
    }),
  },
};
export const hireV1ExternalApplicationDelete = {
  project: 'hire',
  name: 'hire.v1.externalApplication.delete',
  sdkName: 'hire.v1.externalApplication.delete',
  path: '/open-apis/hire/v1/external_applications/:external_application_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External application info-Delete External Application-Delete external delivery',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({ talent_id: z.string().describe('Talent ID').optional() }).optional(),
    path: z.object({ external_application_id: z.string().describe('External delivery id').optional() }).optional(),
  },
};
export const hireV1ExternalApplicationList = {
  project: 'hire',
  name: 'hire.v1.externalApplication.list',
  sdkName: 'hire.v1.externalApplication.list',
  path: '/open-apis/hire/v1/external_applications',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External application info-Get External Application Info list-Obtain external delivery information of talents according to talent ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        talent_id: z.string().describe('Talent ID').optional(),
        page_size: z.number().describe('page size').optional(),
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
export const hireV1ExternalApplicationUpdate = {
  project: 'hire',
  name: 'hire.v1.externalApplication.update',
  sdkName: 'hire.v1.externalApplication.update',
  path: '/open-apis/hire/v1/external_applications/:external_application_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External application info-Update External Application Info-Update external delivery, overwrite and update the fields of external delivery',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        job_recruitment_type: z
          .number()
          .describe(
            'Job recruitment type Options:1(social_recruitment Social recruitment),2(campus_recruitment Campus recruitment)',
          )
          .optional(),
        job_title: z.string().describe('Job title').optional(),
        resume_source: z.string().describe('Resume source').optional(),
        stage: z.string().describe('Stage').optional(),
        termination_reason: z.string().describe('Reason for termination').optional(),
        delivery_type: z
          .number()
          .describe(
            'Delivery Type Options:1(HR_visit HR search),2(candidate_delivery Candidate unsolicited delivery),3(talent_recommend Talent recommendation),4(others Other)',
          )
          .optional(),
        modify_time: z.number().describe('Termination time in the external system for the application').optional(),
        create_time: z.number().describe('Creation time in the external system for the application').optional(),
        termination_type: z.string().describe('Termination type').optional(),
      })
      .optional(),
    path: z.object({ external_application_id: z.string().describe('External delivery id').optional() }).optional(),
  },
};
export const hireV1ExternalBackgroundCheckBatchQuery = {
  project: 'hire',
  name: 'hire.v1.externalBackgroundCheck.batchQuery',
  sdkName: 'hire.v1.externalBackgroundCheck.batchQuery',
  path: '/open-apis/hire/v1/external_background_checks/batch_query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External background info-Query external background-According to the external delivery ID or external backtone ID list, query the external backtone information',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        external_background_check_id_list: z
          .array(z.string())
          .describe('External backtone ID list, when this value is passed, this value shall prevail')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        external_application_id: z
          .string()
          .describe(
            'External delivery ID, which can be obtained through the [Get External Delivery Information] interface',
          )
          .optional(),
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
export const hireV1ExternalBackgroundCheckCreate = {
  project: 'hire',
  name: 'hire.v1.externalBackgroundCheck.create',
  sdkName: 'hire.v1.externalBackgroundCheck.create',
  path: '/open-apis/hire/v1/external_background_checks',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External background info-Create external background check-Create external background check',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      external_id: z.string().describe('External System Backtone Primary Key (idempotent only)').optional(),
      external_application_id: z.string().describe('External Delivery ID'),
      date: z.number().describe('Back date').optional(),
      name: z.string().describe('Recite name').optional(),
      result: z.string().describe('Backtone result').optional(),
      attachment_id_list: z.array(z.string()).describe('Back tone accessory ID list').optional(),
    }),
  },
};
export const hireV1ExternalBackgroundCheckDelete = {
  project: 'hire',
  name: 'hire.v1.externalBackgroundCheck.delete',
  sdkName: 'hire.v1.externalBackgroundCheck.delete',
  path: '/open-apis/hire/v1/external_background_checks/:external_background_check_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External background info-Delete external background-Delete external accent',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      external_background_check_id: z
        .string()
        .describe('External backtone ID, which can be obtained through the [Query External Backtone] interface'),
    }),
  },
};
export const hireV1ExternalBackgroundCheckUpdate = {
  project: 'hire',
  name: 'hire.v1.externalBackgroundCheck.update',
  sdkName: 'hire.v1.externalBackgroundCheck.update',
  path: '/open-apis/hire/v1/external_background_checks/:external_background_check_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External background info-Update external background-Update the external backtune, overwrite and update the fields of the external backtune',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      external_application_id: z
        .string()
        .describe(
          'External delivery ID, which can be obtained through the [Get External Delivery Information] interface',
        ),
      date: z.number().describe('Back date, millisecond timestamp').optional(),
      name: z.string().describe('backtone name').optional(),
      result: z.string().describe('backtune result').optional(),
      attachment_id_list: z
        .array(z.string())
        .describe('The list of attachment IDs can be returned through the [Create Attachment] interface')
        .optional(),
    }),
    path: z.object({
      external_background_check_id: z
        .string()
        .describe('External backtone ID, which can be obtained through the [Query External Backtone] interface'),
    }),
  },
};
export const hireV1ExternalInterviewAssessmentCreate = {
  project: 'hire',
  name: 'hire.v1.externalInterviewAssessment.create',
  sdkName: 'hire.v1.externalInterviewAssessment.create',
  path: '/open-apis/hire/v1/external_interview_assessments',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External interview info-Create external interview assessment-Create external interview assessment',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      external_id: z.string().describe('External system surface evaluation primary key (idempotent only)').optional(),
      username: z.string().describe('Interviewer name').optional(),
      conclusion: z
        .number()
        .describe('Interview results Options:1(不通过 No pass),2(通过 Pass),3(待定 To be determined)')
        .optional(),
      assessment_dimension_list: z
        .array(
          z.object({
            score: z
              .number()
              .describe('Scoring question score (used when the question type is "scoring question")')
              .optional(),
            option: z.string().describe('Radio option (used when the topic type is "single choice")').optional(),
            options: z
              .array(z.string())
              .describe('Multiple choice option (used when the question type is "multiple choice question")')
              .optional(),
            content: z
              .string()
              .describe('Description content (used when the topic type is "description topic")')
              .optional(),
            assessment_type: z
              .number()
              .describe(
                'Topic Type Options:1(打分题 Scoring questions),2(单选题 Single Topic),3(描述题 Description),4(多选题 Multiple choice questions)',
              )
              .optional(),
            title: z.string().describe('Title Title').optional(),
            description: z.string().describe('Title Description').optional(),
          }),
        )
        .describe('List of evaluation dimensions')
        .optional(),
      content: z.string().describe('Comprehensive record').optional(),
      external_interview_id: z.string().describe('External Interview ID'),
    }),
  },
};
export const hireV1ExternalInterviewAssessmentPatch = {
  project: 'hire',
  name: 'hire.v1.externalInterviewAssessment.patch',
  sdkName: 'hire.v1.externalInterviewAssessment.patch',
  path: '/open-apis/hire/v1/external_interview_assessments/:external_interview_assessment_id',
  httpMethod: 'PATCH',
  description:
    "[Feishu/Lark]-Hire-Get candidates-External system information-External interview info-Update the external review-Update the external review fields. Fields left empty won't be updated",
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        username: z.string().describe('Interviewer name').optional(),
        conclusion: z
          .number()
          .describe('Interview results Options:1(Fail No pass),2(Pass passed),3(toBeDetermined To be determined)')
          .optional(),
        assessment_dimension_list: z
          .array(
            z.object({
              score: z
                .number()
                .describe('Scoring question score (used when the question type is "scoring question")')
                .optional(),
              option: z
                .string()
                .describe('Radio option (used when the question type is "Multiple Choice Question")')
                .optional(),
              options: z
                .array(z.string())
                .describe('Multiple-select option (used when the question type is "multiple-select question")')
                .optional(),
              content: z
                .string()
                .describe('Description content (used when the question type is "Description Question")')
                .optional(),
              assessment_type: z
                .number()
                .describe(
                  'Topic type Options:1(Score Scoring questions),2(singleChoice Single Topic),3(text Description),4(multiChoice Multiple choice questions)',
                )
                .optional(),
              title: z.string().describe('Topic Title').optional(),
              description: z.string().describe('Topic description').optional(),
            }),
          )
          .describe('List of evaluation dimensions')
          .optional(),
        content: z.string().describe('Comprehensive record').optional(),
      })
      .optional(),
    path: z.object({ external_interview_assessment_id: z.string().describe('External Review ID') }),
  },
};
export const hireV1ExternalInterviewBatchQuery = {
  project: 'hire',
  name: 'hire.v1.externalInterview.batchQuery',
  sdkName: 'hire.v1.externalInterview.batchQuery',
  path: '/open-apis/hire/v1/external_interviews/batch_query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External interview info-Query external interview-Query the external interview information based on the list of external delivery IDs or external interview IDs',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        external_interview_id_list: z
          .array(z.string())
          .describe('List of external interview IDs, when this value is passed, this value shall prevail')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        external_application_id: z
          .string()
          .describe(
            'External delivery ID, which can be obtained through the [Get External Delivery Information] interface',
          )
          .optional(),
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
export const hireV1ExternalInterviewCreate = {
  project: 'hire',
  name: 'hire.v1.externalInterview.create',
  sdkName: 'hire.v1.externalInterview.create',
  path: '/open-apis/hire/v1/external_interviews',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External interview info-Create external interview-Create external interview',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      external_id: z.string().describe('External System Interview Primary Key (idempotent only)').optional(),
      external_application_id: z.string().describe('External Delivery ID'),
      participate_status: z
        .number()
        .describe(
          'Participation status Options:1(NotStart did not participate),2(Participated participate),3(NotPaticipated miss the appointment)',
        )
        .optional(),
      begin_time: z.number().describe('Start time').optional(),
      end_time: z.number().describe('End time').optional(),
      interview_assessments: z
        .array(
          z.object({
            username: z.string().describe("Interviewer's name").optional(),
            conclusion: z
              .number()
              .describe('Interview conclusion Options:1(Fail),2(Pass passed),3(toBeDetermined to be determined)')
              .optional(),
            assessment_dimension_list: z
              .array(
                z.object({
                  score: z.number().describe('Scores (used when the type of question is "Scores")').optional(),
                  option: z
                    .string()
                    .describe('Radio option (used when the question type is "radio choice")')
                    .optional(),
                  options: z
                    .array(z.string())
                    .describe('Multiple-select option (used when the question type is "multiple-select question")')
                    .optional(),
                  content: z
                    .string()
                    .describe('Description content (used when the question type is "Description")')
                    .optional(),
                  assessment_type: z
                    .number()
                    .describe(
                      'Topic type Options:1(Score scoring question),2(singleChoice multiple choice question),3(text Description question),4(multiChoice multiple-select question)',
                    )
                    .optional(),
                  title: z.string().describe('Title').optional(),
                  description: z.string().describe('title description').optional(),
                }),
              )
              .describe('evaluation dimension list')
              .optional(),
            content: z.string().describe('comprehensive record').optional(),
          }),
        )
        .describe('Interview feedback list')
        .optional(),
    }),
  },
};
export const hireV1ExternalInterviewDelete = {
  project: 'hire',
  name: 'hire.v1.externalInterview.delete',
  sdkName: 'hire.v1.externalInterview.delete',
  path: '/open-apis/hire/v1/external_interviews/:external_interview_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External interview info-Delete external interview-Delete the external interview',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      external_interview_id: z
        .string()
        .describe('The external interview ID can be obtained through the [query external interview] interface'),
    }),
  },
};
export const hireV1ExternalInterviewUpdate = {
  project: 'hire',
  name: 'hire.v1.externalInterview.update',
  sdkName: 'hire.v1.externalInterview.update',
  path: '/open-apis/hire/v1/external_interviews/:external_interview_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External interview info-Update external interview-Update the external interview to overwrite the fields for the external interview',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      external_application_id: z
        .string()
        .describe(
          'External delivery ID, which can be obtained through the [Get External Delivery Information] interface',
        ),
      participate_status: z
        .number()
        .describe(
          'Participation status Options:1(NotStart did not participate),2(Participated participate),3(NotPaticipated miss the appointment)',
        )
        .optional(),
      begin_time: z.number().describe('Start time, millisecond timestamp (field type: int64)').optional(),
      end_time: z.number().describe('End time, millisecond timestamp (field type: int64)').optional(),
      interview_assessments: z
        .array(
          z.object({
            username: z.string().describe("Interviewer's name").optional(),
            conclusion: z
              .number()
              .describe('Interview results Options:1(Fail),2(Pass passed),3(toBeDetermined to be determined)')
              .optional(),
            assessment_dimension_list: z
              .array(
                z.object({
                  score: z.number().describe('Scores (used when the type of question is "Scores")').optional(),
                  option: z
                    .string()
                    .describe('Radio option (used when the question type is "radio choice")')
                    .optional(),
                  options: z
                    .array(z.string())
                    .describe('Multiple-select option (used when the question type is "multiple-select question")')
                    .optional(),
                  content: z
                    .string()
                    .describe('Description content (used when the question type is "Description")')
                    .optional(),
                  assessment_type: z
                    .number()
                    .describe(
                      'Topic type Options:1(Score scoring question),2(singleChoice multiple choice question),3(text Description question),4(multiChoice multiple-select question)',
                    )
                    .optional(),
                  title: z.string().describe('Title').optional(),
                  description: z.string().describe('title description').optional(),
                }),
              )
              .describe('evaluation dimension list')
              .optional(),
            content: z.string().describe('comprehensive record').optional(),
          }),
        )
        .describe('Interview feedback list')
        .optional(),
    }),
    path: z.object({
      external_interview_id: z
        .string()
        .describe('The external interview ID can be obtained through the [query external interview] interface'),
    }),
  },
};
export const hireV1ExternalOfferBatchQuery = {
  project: 'hire',
  name: 'hire.v1.externalOffer.batchQuery',
  sdkName: 'hire.v1.externalOffer.batchQuery',
  path: '/open-apis/hire/v1/external_offers/batch_query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External offer info-Query external offer list-According to the external delivery ID or the external Offer ID list, query the external Offer information',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        external_offer_id_list: z
          .array(z.string())
          .describe('List of external Offer IDs, which, when passed, shall prevail')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        external_application_id: z
          .string()
          .describe(
            'External delivery ID, which can be obtained through the [Get External Delivery Information] interface',
          )
          .optional(),
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
export const hireV1ExternalOfferCreate = {
  project: 'hire',
  name: 'hire.v1.externalOffer.create',
  sdkName: 'hire.v1.externalOffer.create',
  path: '/open-apis/hire/v1/external_offers',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External offer info-Create external Offer-Import offer information from other systems and create it as an external offer',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      external_id: z.string().describe('External system Offer primary key (idempotent only)').optional(),
      external_application_id: z
        .string()
        .describe(
          'External delivery ID, which can be obtained through the [Get External Delivery Information] interface',
        ),
      biz_create_time: z.string().describe('Offer creation time, millisecond timestamp').optional(),
      owner: z.string().describe('Offer Manager').optional(),
      offer_status: z.string().describe('Offer Status').optional(),
      attachment_id_list: z
        .array(z.string())
        .describe('Offer details A list of attachment IDs, which can be created by [Create Attachment]interface back')
        .optional(),
    }),
  },
};
export const hireV1ExternalOfferDelete = {
  project: 'hire',
  name: 'hire.v1.externalOffer.delete',
  sdkName: 'hire.v1.externalOffer.delete',
  path: '/open-apis/hire/v1/external_offers/:external_offer_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External offer info-Delete external offer-Remove External Offer',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({
        external_offer_id: z
          .string()
          .describe('External Offer ID, which can be obtained through the [Query External Offer] interface')
          .optional(),
      })
      .optional(),
  },
};
export const hireV1ExternalOfferUpdate = {
  project: 'hire',
  name: 'hire.v1.externalOffer.update',
  sdkName: 'hire.v1.externalOffer.update',
  path: '/open-apis/hire/v1/external_offers/:external_offer_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External offer info-Update external offer-Update the external Offer to overwrite the fields of the external Offer',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      external_application_id: z
        .string()
        .describe(
          'External delivery ID, which can be obtained through the [Get External Delivery Information] interface',
        ),
      biz_create_time: z.string().describe('Offer creation time, millisecond timestamp').optional(),
      owner: z.string().describe('Offer Manager').optional(),
      offer_status: z.string().describe('Offer Status').optional(),
      attachment_id_list: z
        .array(z.string())
        .describe('Offer details A list of attachment IDs, which can be returned by the [Create Attachment] interface')
        .optional(),
    }),
    path: z
      .object({
        external_offer_id: z
          .string()
          .describe('External Offer ID, which can be obtained through the [Query External Offer] interface')
          .optional(),
      })
      .optional(),
  },
};
export const hireV1ExternalReferralRewardCreate = {
  project: 'hire',
  name: 'hire.v1.externalReferralReward.create',
  sdkName: 'hire.v1.externalReferralReward.create',
  path: '/open-apis/hire/v1/external_referral_rewards',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External referral reward info-Import external referral rewards-Supports the import of external referral rewards (credit/cash) into the referral account',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      referral_user_id: z
        .string()
        .describe("Referrer's IDThe unique identifier of the referrer, obtained from [Get User Information]"),
      create_user_id: z
        .string()
        .describe(
          'Reward\'s creator The reward creator is visible to the administrator and referral person. If it is not passed on, it defaults to "External system"',
        )
        .optional(),
      confirm_user_id: z
        .string()
        .describe(
          'Confirmation personIt can be input if the "Status of imported referral rewards" is "Confirmed". If not input, it defaults to "External system"',
        )
        .optional(),
      pay_user_id: z
        .string()
        .describe(
          'Issuance personIt can be input if the "Status of imported referral rewards" is "Issued". If not input, it defaults to "External system"',
        )
        .optional(),
      external_id: z.string().describe('External system rewards unique id (idempotent only)'),
      application_id: z
        .string()
        .describe(
          'Referred candidate\'s application IDIt is recommended to input the application ID in Feishu Hire.If there is no application ID, you can input the "Referred candidate\'s talent ID". If the "Referred candidate\'s talent ID" is provided, this parameter is optional<md-alert type="warn"> If the application ID is not provided, the current referral reward can\'t be associated with the application,The system will not display the corresponding "Job", "Recruiter" "Offer manager". These fields will be shown as "--".The referrer can see the reward record, but the recruiter and offer manager cannot</md-alert>The methods to query the application ID:1. [Obtain the talent ID via phone number or email]2. [Query the referral application ID via the talent ID]',
        )
        .optional(),
      talent_id: z
        .string()
        .describe(
          'Referred candidate\'s talent IDThis parameter is required if the "Referred candidate\'s application ID" is not inputIf the "Referred candidate\'s application ID" is input, this parameter is optional and will default to the "Referred candidate\'s application ID"',
        )
        .optional(),
      job_id: z
        .string()
        .describe(
          'Referral job IDThe job ID in Feishu Hire. If not input, it will be displayed as -- to admins and referrers.If the "Referred candidate\'s application ID" is input, this parameter is optional, and the job ID will automatically correspond to the "Job ID" associated with the "Application ID"<md-alert type = "warn">If the "Referral job ID" is not input, and the "Referred candidate\'s application ID" is not input, the current referral reward can\'t be associated with a job."Individuals with job-related permissions" (such as campus hire / experienced hire admins, recruiters, coordinators, hiring managers, etc.) won\'t be able to see this referral record</md-alert >',
        )
        .optional(),
      reason: z
        .string()
        .describe(
          'Reward reason, if not passed on, is "--"It will be displayed in the referral reward details and is visible to admins and referrers.To align with the referral reward reasons determined by Feishu Hire for ease of statistics, refer to the following instructions for input.If the "Reward rule type" is "Process reward", it is recommended to input the following reasons:- If the "Reward rule type" is "Process reward", it is recommended to input the following reasons: - referral reward - Enter the {phase name} - phase Candidate in-person reward- If the "Reward rule type" is "Onboarding reward", it is recommended to input the following reasons: - Onboarding - Turn positive- If the "Reward rule type" is "Event reward", it is recommended to input the following reasons: - Referred n candidates in total {reason} - Referred n candidates- If the "Reward rule type" is "First-intro reward", it is recommended to input the following reasons: - Onboarding | Open Source - Turn positive | Open source',
        )
        .optional(),
      rule_type: z
        .number()
        .describe(
          "Imported reward rule typeIt will be displayed in the referral reward details and is visible to admins and referrers.To align with the reward reasons within Feishu Hire for unified statistics, refer to the following instructions for input Options:1(Onboard Onboarding rewards, reward generated when the candidate joins or becomes a regular employee),2(Processe Progress reward, Apart from onboarding rewards, the referrer is also eligible for corresponding rewards if the candidate makes substantial progress),3(Active Event reward, additional rewards for supporting referral event with fixed cycle),4(OpenSource First-intro reward, If the referred candidate is added to the talent pool for the first time and is onboarded to any job listed in the rule within a period of time after referral, the referrer will receive a first-intro reward),5(Other Other rewards, rewards that can't be covered by the above types.)",
        ),
      bonus: z
        .object({
          bonus_type: z.number().describe('Reward issuance form Options:1(Point Credit),2(Cash)'),
          point_bonus: z
            .number()
            .describe('Import credit amount, required if the reward issuance form is cash.Example value: 100')
            .optional(),
          cash: z
            .object({
              currency_type: z
                .string()
                .describe(
                  'Import the cash currency, required if the reward issuance form is cash. The currency parameters can be queried in [Introduction to Enumeration Constants]',
                ),
              amount: z
                .number()
                .describe(
                  'Import cash amount, required if the reward issuance form is credit.Only non-negative numbers can be input',
                ),
            })
            .describe('Cash reward')
            .optional(),
        })
        .describe('Reward amount'),
      stage: z
        .number()
        .describe(
          'Status of imported referral rewards (required)Optional values: Options:1(ToBeConfirmed To be confirmed, it is recommended to import details of rewards that require manual review.After import, an admin must manually review and confirm in "Referral Reward Management" - "To Be Confirmed" before they are displayed to the referrer),2(Confirmed Confirmed, it is recommended to import details of rewards that have passed manual review but haven\'t been issued.After import, they will be displayed to both admins and referrers, with the reward status shown as "Confirmed" (not issued)),3(paid Issued, it is recommended to import details of rewards that have been issued.After import, they will be displayed to both admins and referrers, with the reward status shown as "Issued")',
        ),
      create_time: z
        .string()
        .describe(
          'Confirmation timeTimestamp. It can be input if the "Status of imported referral rewards" is "Confirmed". If not input, the time of API call will be used',
        )
        .optional(),
      confirm_time: z
        .string()
        .describe(
          'Confirmation timeTimestamp. It can be input if the "Status of imported referral rewards" is "Confirmed". If not input, the time of API call will be used',
        )
        .optional(),
      pay_time: z
        .string()
        .describe(
          'Issuance timeTimestamp. It can be input if the "Status of imported referral rewards" is "Confirmed". If not input, the time of API call will be used',
        )
        .optional(),
      onboard_time: z
        .string()
        .describe(
          'Onboarding timeTimestamp visible to both admins and referrers. It is recommended to input this parameter when the "Reward rule type" is "Onboarding reward"',
        )
        .optional(),
      conversion_time: z
        .string()
        .describe(
          'turnaround timeTimestamp, visible to administrators and referrals, when the "reward rule type" is "onboarding reward", it is recommended to pass this parameter',
        )
        .optional(),
      comment: z
        .string()
        .describe(
          'Operation notesDescription: Visible to both admins and referrers. If empty, the reward reason will be displayed',
        )
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const hireV1ExternalReferralRewardDelete = {
  project: 'hire',
  name: 'hire.v1.externalReferralReward.delete',
  sdkName: 'hire.v1.externalReferralReward.delete',
  path: '/open-apis/hire/v1/external_referral_rewards/:external_referral_reward_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External referral reward info-Delete External Referral Reward-- Support to delete the imported referral reward in "Import External Rewards" by ID. After deletion, the corresponding details in "Referral Rewards Management" in the recruitment system will disappear- If you delete the "confirmed" and "issued" rewards, the referral will disappear in the "My Rewards" details, please pay attention to communicating with the referrals involved in advance',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ external_referral_reward_id: z.string().describe('Referral Reward ID').optional() }).optional(),
  },
};
export const hireV1InterviewFeedbackFormList = {
  project: 'hire',
  name: 'hire.v1.interviewFeedbackForm.list',
  sdkName: 'hire.v1.interviewFeedbackForm.list',
  path: '/open-apis/hire/v1/interview_feedback_forms',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Interview settings-Get Interview Feedback Form Details-Retrieve detailed information of the interview feedback form by ID, including question descriptions, question options, etc',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        interview_feedback_form_ids: z
          .array(z.string())
          .describe('Interview feedback form ID list, other parameters are ignored if this field is used')
          .optional(),
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
export const hireV1InterviewRecordAttachmentGet = {
  project: 'hire',
  name: 'hire.v1.interviewRecordAttachment.get',
  sdkName: 'hire.v1.interviewRecordAttachment.get',
  path: '/open-apis/hire/v1/interview_records/attachments',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Interview-Get interview feedback attachment-Get the interview feedback attachment in PDF format',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      application_id: z.string().describe('Delivery ID'),
      interview_record_id: z.string().describe('Interview Record ID').optional(),
      language: z.number().describe('Interview Record Language Options:1(zh Chinese),2(en English)').optional(),
    }),
  },
};
export const hireV1InterviewRecordGet = {
  project: 'hire',
  name: 'hire.v1.interviewRecord.get',
  sdkName: 'hire.v1.interviewRecord.get',
  path: '/open-apis/hire/v1/interview_records/:interview_record_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Interview-Get interview evaluation details-Get interview evaluation details',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ interview_record_id: z.string().describe('Record ID') }),
  },
};
export const hireV1InterviewRecordList = {
  project: 'hire',
  name: 'hire.v1.interviewRecord.list',
  sdkName: 'hire.v1.interviewRecord.list',
  path: '/open-apis/hire/v1/interview_records',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Interview-List interview assessment-Obtain interview evaluation details in batches. The returned results are sorted by ID by default',
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
        ids: z
          .array(z.string())
          .describe('List of interview feedback IDs, not paginated when using this filter')
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1InterviewRegistrationSchemaList = {
  project: 'hire',
  name: 'hire.v1.interviewRegistrationSchema.list',
  sdkName: 'hire.v1.interviewRegistrationSchema.list',
  path: '/open-apis/hire/v1/interview_registration_schemas',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Interview settings-Get interview registration schema list-Get interview registration schema list',
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
        page_size: z.number().describe('Number of records fetched per page, up to 10').optional(),
      })
      .optional(),
  },
};
export const hireV1InterviewRoundTypeList = {
  project: 'hire',
  name: 'hire.v1.interviewRoundType.list',
  sdkName: 'hire.v1.interviewRoundType.list',
  path: '/open-apis/hire/v1/interview_round_types',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Interview settings-Get a list of interview rounds-Get a list of interview rounds',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        process_type: z
          .number()
          .describe(
            'Job Process Type Options:1(社招流程 Social recruitment process),2(校招流程 School recruitment process)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const hireV1InterviewTaskList = {
  project: 'hire',
  name: 'hire.v1.interviewTask.list',
  sdkName: 'hire.v1.interviewTask.list',
  path: '/open-apis/hire/v1/interview_tasks',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Recruitment process follow-up-Get employee interview tasks-Get employee interview tasks',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id: z.string().describe('User ID'),
      activity_status: z
        .number()
        .describe(
          'Task status Options:1(未开始 Not started),2(未评价 Not evaluated),3(已评价 Evaluated),5(已终止 Terminated)',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
    }),
  },
};
export const hireV1InterviewGetByTalent = {
  project: 'hire',
  name: 'hire.v1.interview.getByTalent',
  sdkName: 'hire.v1.interview.getByTalent',
  path: '/open-apis/hire/v1/interviews/get_by_talent',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Interview-Get talent interview information-Get talent interview information',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      talent_id: z.string().describe('Talent ID'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      job_level_id_type: z
        .enum(['people_admin_job_level_id', 'job_level_id'])
        .describe(
          'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
        )
        .optional(),
    }),
  },
};
export const hireV1InterviewList = {
  project: 'hire',
  name: 'hire.v1.interview.list',
  sdkName: 'hire.v1.interview.list',
  path: '/open-apis/hire/v1/interviews',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Interview-Get interview information-Obtain interview information based on delivery ID or interview time',
  accessTokens: ['tenant'],
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
        application_id: z
          .string()
          .describe(
            "Application ID, which can be obtained through the [Obtain Application Information API] (application_id, interview_id, start_time, and end_time can't all be empty at the same time)",
          )
          .optional(),
        interview_id: z
          .string()
          .describe(
            "Interview ID, which can be obtained through the [Obtain Application Information API] (application_id, interview_id, start_time, and end_time can't all be empty at the same time)",
          )
          .optional(),
        start_time: z
          .string()
          .describe(
            "Earliest start time (in milliseconds), which must be greater than 0 (application_id, interview_id, start_time, and end_time can't all be empty at the same time)",
          )
          .optional(),
        end_time: z
          .string()
          .describe(
            "Latest start time (in milliseconds), which must be greater than 0 (application_id, interview_id, start_time, and end_time can't all be empty at the same time)",
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1InterviewerList = {
  project: 'hire',
  name: 'hire.v1.interviewer.list',
  sdkName: 'hire.v1.interviewer.list',
  path: '/open-apis/hire/v1/interviewers',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Interview settings-面试官管理-List Interviewer Info-Paged to query the list of interviewers, the interface will only return the data of the user who has performed "Update Interviewer Information", and the data that cannot be queried through the interface will default to "Uncertified" interviewers. The interface will be pulled sequentially by default according to the update time, user_id order',
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
        user_ids: z.array(z.string()).describe('Interviewer userID list').optional(),
        verify_status: z
          .number()
          .describe('authentication status Options:1(NotVarified not certified),2(Varified Verified)')
          .optional(),
        earliest_update_time: z.string().describe('Earliest update time, millisecond timestamp').optional(),
        latest_update_time: z.string().describe('Latest update time, millisecond timestamp').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1InterviewerPatch = {
  project: 'hire',
  name: 'hire.v1.interviewer.patch',
  sdkName: 'hire.v1.interviewer.patch',
  path: '/open-apis/hire/v1/interviewers/:interviewer_id',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Interview settings-面试官管理-Update Interviewer Info-For updating interviewer certification information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      interviewer: z
        .object({
          verify_status: z
            .number()
            .describe('authentication status Options:1(NotVarified not certified),2(Varified Verified)')
            .optional(),
        })
        .describe('Interviewer information'),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ interviewer_id: z.string().describe('Interviewer userID').optional() }).optional(),
  },
};
export const hireV1JobFunctionList = {
  project: 'hire',
  name: 'hire.v1.jobFunction.list',
  sdkName: 'hire.v1.jobFunction.list',
  path: '/open-apis/hire/v1/job_functions',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Get a list of functional categories-Get a list of functional categories',
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
      })
      .optional(),
  },
};
export const hireV1JobProcessList = {
  project: 'hire',
  name: 'hire.v1.jobProcess.list',
  sdkName: 'hire.v1.jobProcess.list',
  path: '/open-apis/hire/v1/job_processes',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Recruitment Process-Get recruitment process information-Obtain all recruitment process information. Such as "Process Name", "Process Type" and "Stage Name", "Stage Type" and other information under the process',
  accessTokens: ['tenant'],
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
  },
};
export const hireV1JobPublishRecordSearch = {
  project: 'hire',
  name: 'hire.v1.jobPublishRecord.search',
  sdkName: 'hire.v1.jobPublishRecord.search',
  path: '/open-apis/hire/v1/job_publish_records/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Get job advertisement posting records-Get job advertisement posting records',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ job_channel_id: z.string().describe('Channel ID') }),
    params: z
      .object({
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('Page size').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(By open_department_id),department_id(By department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const hireV1JobRequirementSchemaList = {
  project: 'hire',
  name: 'hire.v1.jobRequirementSchema.list',
  sdkName: 'hire.v1.jobRequirementSchema.list',
  path: '/open-apis/hire/v1/job_requirement_schemas',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job requirement-Get job requirement template-Get the recruitment requirements template',
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
        page_size: z.number().describe('Page size').optional(),
      })
      .optional(),
  },
};
export const hireV1JobRequirementCreate = {
  project: 'hire',
  name: 'hire.v1.jobRequirement.create',
  sdkName: 'hire.v1.jobRequirement.create',
  path: '/open-apis/hire/v1/job_requirements',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job requirement-Create job requirement-Create a recruitment requirement, except that the recruitment requirement number is required, whether other fields are required is consistent with the settings in Feishu Recruitment "Recruitment Requirements Field Management"',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      short_code: z.string().describe('Recruitment requirement number'),
      name: z.string().describe('Requirement name'),
      display_progress: z
        .number()
        .describe(
          'Demand state Options:1(WaitingStart To be started),2(OnGoing In progress),3(Canceled Cancelled),4(Suspended),5(Completed),6(Expired)',
        ),
      head_count: z.number().describe('Number of people required'),
      recruitment_type_id: z
        .string()
        .describe(
          'Job recruitment type id, you can view the emuneration value in the "Recruitment Enumeration Constants" document. It will be offline soon. Please switch to the "employee_type_id" field as soon as possible.Either one of "recruitment_type_id" and "employee_type" are required',
        )
        .optional(),
      employee_type_id: z
        .string()
        .describe('employee type IDFor enumeration details, see the "Query parameter" section of this documentation')
        .optional(),
      max_level_id: z
        .string()
        .describe(
          'Highest job level IDFor enumeration details, see the "Query parameter" section of this documentation',
        )
        .optional(),
      min_level_id: z
        .string()
        .describe(
          'Minimum job level IDFor enumeration details, see the "Query parameter" section of this documentation',
        )
        .optional(),
      sequence_id: z
        .string()
        .describe('Job Sequence IDFor enumeration details, see the "Query parameter" section of this documentation')
        .optional(),
      category: z.number().describe('Type of requirement Options:1(Addition New),2(Replacement Replace)').optional(),
      department_id: z.string().describe('Demand department ID').optional(),
      recruiter_id_list: z.array(z.string()).describe('Requirement owner ID list').optional(),
      jr_hiring_manager_id_list: z.array(z.string()).describe('Required Employer Manager ID List').optional(),
      direct_leader_id_list: z.array(z.string()).describe('Directly superior ID').optional(),
      start_time: z.string().describe('Start date, millisecond timestamp').optional(),
      deadline: z.string().describe('Estimated completion date, millisecond timestamp').optional(),
      priority: z.number().describe('Recruitment priority Options:1(High),2(Medium Middle),3(Low)').optional(),
      required_degree: z
        .number()
        .describe(
          'Academic requirements Options:1(PrimaryEducation Primary school and above),2(JuniorMiddleSchoolEducation Junior high school and above),3(Secondary Full-time and above),4(SeniorSchoolGraduates High school and above),5(Associate College and above),6(Bachelor Bachelor degree and above),7(Master Master and above),8(Phd Doctor and above),20(NoLimit unlimited)',
        )
        .optional(),
      max_salary: z.string().describe('Maximum salary').optional(),
      min_salary: z.string().describe('Minimum wage').optional(),
      address_id: z.string().describe('Workplace ID').optional(),
      description: z.string().describe('Requirements description').optional(),
      customized_data_list: z
        .array(
          z.object({
            object_id: z.string().describe('Custom field ID').optional(),
            value: z.string().describe('Custom field values').optional(),
          }),
        )
        .describe('Custom fields')
        .optional(),
      process_type: z
        .number()
        .describe(
          'Recruitment type, whether it is required or not is subject to the field restrictions in "Obtain Recruitment Demand Template". When creating a new position through the recruitment demand, the position recruitment type will be backfilled according to this field Options:1(Social social recruitment),2(Campus Campus recruitment)',
        )
        .optional(),
      job_type_id: z
        .string()
        .describe(
          'Job type, the enumeration value is obtained through the "Get Job Type List" interface. Whether it is required or not is subject to the field restrictions in the "Get Recruitment Demand Template". When creating a new job through recruitment requirements, the job type will be backfilled according to this field',
        )
        .optional(),
      job_id_list: z.array(z.string()).describe('List of associated job IDs').optional(),
      employment_job_id: z.string().describe('Employement Job ID').optional(),
      position_id: z
        .string()
        .describe(
          'Position ID, which can be obtained through [Query Position Information] (only for Feishu personnel tenants)',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'department id type Options:open_department_id(od-5cefe25147a103456cf21a63b1132ad),department_id(od-5cefe25147a103456cf21a63b1132ad)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
        employee_type_id_type: z
          .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
          .describe(
            'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const hireV1JobRequirementDelete = {
  project: 'hire',
  name: 'hire.v1.jobRequirement.delete',
  sdkName: 'hire.v1.jobRequirement.delete',
  path: '/open-apis/hire/v1/job_requirements/:job_requirement_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job requirement-Delete recruitment requirements-Delete recruitment requirements',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ job_requirement_id: z.string().describe('Recruitment Requirements ID') }),
  },
};
export const hireV1JobRequirementList = {
  project: 'hire',
  name: 'hire.v1.jobRequirement.list',
  sdkName: 'hire.v1.jobRequirement.list',
  path: '/open-apis/hire/v1/job_requirements',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job requirement-Get job requirement list-Get recruitment requirements by job ID',
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
        page_size: z.number().describe('Page size').optional(),
        job_id: z.string().describe('Job ID,please refer to:[Get job list]').optional(),
        create_time_begin: z.string().describe('Start creation time, pass in millisecond timestamp').optional(),
        create_time_end: z
          .string()
          .describe('At the end of the creation time, pass in the millisecond timestamp')
          .optional(),
        update_time_begin: z.string().describe('Start update time, pass in millisecond timestamp').optional(),
        update_time_end: z.string().describe('Deadline update time, pass in millisecond timestamp').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
        employee_type_id_type: z
          .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
          .describe(
            'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const hireV1JobRequirementListById = {
  project: 'hire',
  name: 'hire.v1.jobRequirement.listById',
  sdkName: 'hire.v1.jobRequirement.listById',
  path: '/open-apis/hire/v1/job_requirements/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job requirement-Search Job Requirement Info-Obtain recruitment demand information according to "Recruitment Demand ID", support batch inquiry',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        id_list: z
          .array(z.string())
          .describe(
            'Recruitment Requirements ID List,please refer to:[Get job requirement list],and limit to 100 entries at a time. If not passed, empty will be returned',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
        employee_type_id_type: z
          .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
          .describe(
            'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const hireV1JobRequirementUpdate = {
  project: 'hire',
  name: 'hire.v1.jobRequirement.update',
  sdkName: 'hire.v1.jobRequirement.update',
  path: '/open-apis/hire/v1/job_requirements/:job_requirement_id',
  httpMethod: 'PUT',
  description:
    "[Feishu/Lark]-Hire-Recruitment related configuration-Job requirement-Update job requirement-Update the information of the specified recruitment request, including its name, status, requested headcount, etc. (Pending recruitment requests can't be updated.)",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z.string().describe('Requirement name'),
      display_progress: z
        .number()
        .describe(
          'Demand state Options:1(WaitingStart To be started),2(OnGoing In progress),3(Canceled Cancelled),4(Suspended),5(Completed),6(Expired)',
        ),
      head_count: z.number().describe('Number of people required'),
      recruitment_type_id: z
        .string()
        .describe(
          'Job recruitment type id, you can view the emuneration value in the "Recruitment Enumeration Constants" document. It will be offline soon. Please switch to the "employee_type_id" field as soon as possible.Either one of "recruitment_type_id" and "employee_type" are required',
        )
        .optional(),
      employee_type_id: z
        .string()
        .describe('employee typeFor enumeration details, see the "Query parameter" section of this documentation')
        .optional(),
      max_level_id: z
        .string()
        .describe(
          'Highest Job Level IDFor enumeration details, see the "Query parameter" section of this documentation',
        )
        .optional(),
      min_level_id: z
        .string()
        .describe(
          'Minimum Job Level IDFor enumeration details, see the "Query parameter" section of this documentation',
        )
        .optional(),
      sequence_id: z
        .string()
        .describe('Job Sequence IDFor enumeration details, see the "Query parameter" section of this documentation')
        .optional(),
      category: z.number().describe('Type of requirement Options:1(Addition New),2(Replacement Replace)').optional(),
      department_id: z.string().describe('Demand department ID').optional(),
      recruiter_id_list: z.array(z.string()).describe('Requirement owner ID list').optional(),
      jr_hiring_manager_id_list: z.array(z.string()).describe('Required Employer Manager ID List').optional(),
      direct_leader_id_list: z.array(z.string()).describe('Directly superior ID').optional(),
      start_time: z.string().describe('Start date, millisecond timestamp').optional(),
      deadline: z.string().describe('Estimated completion date, millisecond timestamp').optional(),
      priority: z.number().describe('Recruitment priority Options:1(High),2(Medium Middle),3(Low)').optional(),
      required_degree: z
        .number()
        .describe(
          'Academic requirements Options:1(PrimaryEducation Primary school and above),2(JuniorMiddleSchoolEducation Junior high school and above),3(Secondary Full-time and above),4(SeniorSchoolGraduates High school and above),5(Associate College and above),6(Bachelor Bachelor degree and above),7(Master Master and above),8(Phd Doctor and above),20(NoLimit Unlimited)',
        )
        .optional(),
      max_salary: z.string().describe('Maximum salary').optional(),
      min_salary: z.string().describe('Minimum wage').optional(),
      address_id: z.string().describe('Workplace ID').optional(),
      description: z.string().describe('Requirements description').optional(),
      customized_data_list: z
        .array(
          z.object({
            object_id: z.string().describe('Custom field ID').optional(),
            value: z.string().describe('Custom field values').optional(),
          }),
        )
        .describe('Custom fields')
        .optional(),
      process_type: z
        .number()
        .describe(
          'Recruitment type, whether it is required or not is subject to the field restrictions in "Obtain Recruitment Demand Template". When creating a new position through the recruitment demand, the position recruitment type will be backfilled according to this field Options:1(Social social recruitment),2(Campus Campus recruitment)',
        )
        .optional(),
      job_type_id: z
        .string()
        .describe(
          'Job type, the enumeration value is obtained through the "Get Job Type List" interface. Whether it is required or not is subject to the field restrictions in the "Get Recruitment Demand Template". When creating a new job through recruitment requirements, the job type will be backfilled according to this field',
        )
        .optional(),
      job_id_list: z
        .array(z.string())
        .describe('List of associated job IDs, this field is invalid, do not use')
        .optional(),
      employment_job_id: z.string().describe('Employment Job ID').optional(),
      position_id: z
        .string()
        .describe(
          'Position ID, which can be obtained through [Query Position Information] (only for Feishu personnel tenants)',
        )
        .optional(),
      update_option: z
        .object({
          need_update_related_job: z.boolean().describe('Do you need to modify the associated job title?').optional(),
        })
        .describe('Recruitment request modification confirmation control')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(By open_department_id),department_id(By department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
        employee_type_id_type: z
          .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
          .describe(
            'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ job_requirement_id: z.string().describe('Recruitment Requirements ID') }),
  },
};
export const hireV1JobSchemaList = {
  project: 'hire',
  name: 'hire.v1.jobSchema.list',
  sdkName: 'hire.v1.jobSchema.list',
  path: '/open-apis/hire/v1/job_schemas',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Get job templates-Get the job fields in the social recruitment and campus recruitment job templates. The returned results include system default fields and custom fields. Recruitment administrators can modify the job template in "Feishu Hire" - "Settings" - "Job Management" - "Job Field Management"',
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
        page_size: z
          .number()
          .describe('Page size **Default value**: 10 **Data validation rules**: * Maximum value: 100')
          .optional(),
        scenario: z
          .number()
          .describe('Job Template Type Options:1(社招 Social Recruitment),2(校招 Campus Recruitment)')
          .optional(),
      })
      .optional(),
  },
};
export const hireV1JobTypeList = {
  project: 'hire',
  name: 'hire.v1.jobType.list',
  sdkName: 'hire.v1.jobType.list',
  path: '/open-apis/hire/v1/job_types',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job-List job type-Obtain a list of job categories preset by the recruitment system, which can be used to operate positions (such as [New Job]), and backfill job category fields when operating recruitment requirements (such as [Create Job Requirement]. The return list is sorted in ascending order by creation time by default, and contains the hierarchical relationship of nodes (the parent node ID of the node). You can build their own job category tree after obtaining the full amount of data',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z.number().describe('Page size **Default value**: 10').optional(),
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
export const hireV1JobClose = {
  project: 'hire',
  name: 'hire.v1.job.close',
  sdkName: 'hire.v1.job.close',
  path: '/open-apis/hire/v1/jobs/:job_id/close',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Close job-It supports closing positions. After closing, positions will be synchronized offline from the official website, internal push and headhunting channels',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ job_id: z.string().describe('Job ID') }),
  },
};
export const hireV1JobCombinedCreate = {
  project: 'hire',
  name: 'hire.v1.job.combinedCreate',
  sdkName: 'hire.v1.job.combinedCreate',
  path: '/open-apis/hire/v1/jobs/combined_create',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Create job-Whether the new job field is required or not is subject to the settings in the "Job Field Management" in the system',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      code: z.string().describe('Job No').optional(),
      experience: z
        .number()
        .describe(
          'Working years Options:1(NoLimit No Limit),2(Graduate),3(UnderOneYear Under One Year),4(OneToThreeYear One To Three Year),5(ThreeToFiveYear Three To Five Year),6(FiveToSevenYear Five To Seven Year),7(SevenToTenYear Seven To Ten Year),8(OverTenYear Over Ten year)',
        )
        .optional(),
      expiry_time: z
        .number()
        .describe(
          'The millisecond timestamp of the expiration date. If the "Long-term Valid" field is set to true, the value of this field will not be actually used, and the position is long-term valid',
        )
        .optional(),
      customized_data_list: z
        .array(
          z.object({
            object_id: z.string().describe('Structure ID').optional(),
            value: z.string().describe('Structure value').optional(),
          }),
        )
        .describe('custom data list')
        .optional(),
      min_level_id: z.string().describe('Minimum rank').optional(),
      min_salary: z.number().describe('Minimum wage').optional(),
      title: z.string().describe('Job title'),
      job_managers: z
        .object({
          id: z.string().describe('Job ID').optional(),
          recruiter_id: z.string().describe('Recruitment Manager ID'),
          hiring_manager_id_list: z.array(z.string()).describe('List of Employer Manager IDs'),
          assistant_id_list: z.array(z.string()).describe('Assistant ID List').optional(),
        })
        .describe('Position-related person in charge'),
      job_process_id: z.string().describe('Recruitment Process'),
      process_type: z
        .number()
        .describe('Job Process Type Options:1(SocialProcess Social Process),2(CampusProcess Campus Porcess)'),
      subject_id: z.string().describe('Project').optional(),
      job_function_id: z
        .string()
        .describe('Function classification, obtained through "Acquisition Function Classification"')
        .optional(),
      department_id: z
        .string()
        .describe(
          'Department ID, must be passed in open_department_id in the format "od-xxxx". Available through the "Get Department Information List"',
        ),
      head_count: z.number().describe('Number of recruits').optional(),
      is_never_expired: z.boolean().describe('Is it effective for a long time'),
      max_salary: z.number().describe('Highest salary').optional(),
      requirement: z.string().describe('Job Requirements').optional(),
      description: z.string().describe('Job Description').optional(),
      highlight_list: z
        .array(z.string())
        .describe('Job HighlightsPlease refer to [Enum constant]of recruitment')
        .optional(),
      job_type_id: z.string().describe('Job category.The enumeration is available form [「List job type」]'),
      max_level_id: z.string().describe('Highest rank').optional(),
      recruitment_type_id: z.string().describe('Type of employment'),
      required_degree: z
        .number()
        .describe(
          'Academic requirements Options:1(PrimaryEducation Primary Education),2(JuniorMiddleSchoolEducation Junior MiddleSchool Education),3(Secondary),4(SeniorSchoolGraduates Senior School Graduates),5(Associate),6(Bachelor),7(Master),8(Phd),20(NoLimit No Limit)',
        )
        .optional(),
      job_category_id: z.string().describe('Sequence').optional(),
      address_id_list: z
        .array(z.string())
        .describe(
          'The list of job address, enumeration is obtained through the interface "get address list", the purpose of selecting the place is "job address" current field and "address_id" must be filled in, if used at the same time, the current field shall prevail, it is recommended to use the current field',
        )
        .optional(),
      job_attribute: z.number().describe('job attribute Options:1(Concrete),2(Virtual)').optional(),
      expiry_timestamp: z.string().describe('Expiry Timestamp').optional(),
      interview_registration_schema_id: z
        .string()
        .describe(
          'Interview registration form ID. This field is required if "HR selects a registration form by job" has been selected in Feishu Hire "Settings - Information Registration Form Usage Settings - Interview Registration Form Usage", otherwise this field won\'t take effect',
        )
        .optional(),
      onboard_registration_schema_id: z
        .string()
        .describe(
          'Onboarding registration form ID. This field is required if "HR selects a registration form by job" has been selected in Feishu Hire "Settings - Information Registration Form Usage Settings - Onboarding Registration Form Usage", otherwise this field won\'t take effect',
        )
        .optional(),
      target_major_id_list: z
        .array(z.string())
        .describe(
          'Target major ID. The enumeration value is obtained via the ["get major by page"] API and matches the "mdm_code" in the returned value. "0" indicates unlimited major',
        )
        .optional(),
      portal_website_apply_form_schema_id: z
        .string()
        .describe(
          'The official website application form ID can be obtained through the [Get the recruitment official website application form template list] interface',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(Identify departments open_department_id),department_id(Identify departments department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const hireV1JobCombinedUpdate = {
  project: 'hire',
  name: 'hire.v1.job.combinedUpdate',
  sdkName: 'hire.v1.job.combinedUpdate',
  path: '/open-apis/hire/v1/jobs/:job_id/combined_update',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Update job-Update job. This interface is for full update. If the field is not filled with value, the original value will be cleared. Whether the field is required or not will be subject to the settings in the "Mange Job Fields" in the system',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      id: z.string().describe('Job ID , which can be queried through the [Get job list] interface').optional(),
      experience: z
        .number()
        .describe(
          'Working years Options:1(NoLimit No Limit),2(Graduate),3(UnderOneYear Under One Year),4(OneToThreeYear One To Three Year),5(ThreeToFiveYear Three To Five Year),6(FiveToSevenYear Five To Seven Year),7(SevenToTenYear Seven To Ten Year),8(OverTenYear Over Ten year)',
        )
        .optional(),
      expiry_time: z
        .number()
        .describe('Maturity date (deprecated). Please use expiry_timestamp field instead')
        .optional(),
      customized_data_list: z
        .array(
          z.object({
            object_id: z
              .string()
              .describe('Structure ID, which can be queried through the [Get job info] interface')
              .optional(),
            value: z.string().describe('Structure value').optional(),
          }),
        )
        .describe('custom data list')
        .optional(),
      min_level_id: z.string().describe('Minimum rank').optional(),
      min_salary: z.number().describe('Minimum wage').optional(),
      title: z.string().describe('Job title').optional(),
      job_managers: z
        .object({
          id: z.string().describe('Job ID, which can be queried through the [Get job list] interface').optional(),
          recruiter_id: z
            .string()
            .describe('Recruitment Manager ID, which can be queried through the [Search users] interface'),
          hiring_manager_id_list: z
            .array(z.string())
            .describe('List of Employer Manager IDs, which can be queried through the [Search users] interface'),
          assistant_id_list: z
            .array(z.string())
            .describe('Assistant ID List, which can be queried through the [Search users] interface')
            .optional(),
        })
        .describe('Position-related person in charge'),
      job_process_id: z
        .string()
        .describe(
          'Recruitment Process, which can be queried through the [Get recruitment process information] interface',
        )
        .optional(),
      subject_id: z.string().describe('Project').optional(),
      job_function_id: z
        .string()
        .describe('Function classification, obtained through "Acquisition Function Classification"')
        .optional(),
      department_id: z
        .string()
        .describe(
          'Department ID, must be passed in open_department_id in the format "od-xxxx". Available through the "Get Department Information List"',
        )
        .optional(),
      head_count: z.number().describe('Number of recruits').optional(),
      is_never_expired: z.boolean().describe('Is it effective for a long time'),
      max_salary: z.number().describe('Highest salary').optional(),
      requirement: z.string().describe('Job Requirements').optional(),
      description: z.string().describe('Description').optional(),
      highlight_list: z.array(z.string()).describe('Job Highlights').optional(),
      job_type_id: z.string().describe('Job category.The enumeration is available form [「List job type」]'),
      max_level_id: z.string().describe('Highest rank').optional(),
      required_degree: z
        .number()
        .describe(
          'Academic requirements Options:1(PrimaryEducation Primary Education),2(JuniorMiddleSchoolEducation Junior MiddleSchool Education),3(Secondary),4(SeniorSchoolGraduates Senior School Graduates),5(Associate),6(Bachelor),7(Master),8(Phd),20(NoLimit No Limit)',
        )
        .optional(),
      job_category_id: z.string().describe('Sequence').optional(),
      address_id_list: z
        .array(z.string())
        .describe(
          'Workplace, the enumeration is obtained through the interface "Get Address List", and the location is selected as "Job Address"',
        )
        .optional(),
      job_attribute: z.number().describe('job attribute Options:1(Concrete),2(Virtual)').optional(),
      expiry_timestamp: z.string().describe('Expiry Timestamp').optional(),
      target_major_id_list: z
        .array(z.string())
        .describe(
          'Target major ID. The enumeration value is obtained via the ["get major by page"] API and matches the "mdm_code" in the returned value. "0" indicates unlimited major',
        )
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'Department Id Type Options:open_department_id(Open Department ID Type),department_id(Department ID Type)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      job_id: z.string().describe('Job ID , which can be queried through the [Get job list] interface'),
    }),
  },
};
export const hireV1JobConfig = {
  project: 'hire',
  name: 'hire.v1.job.config',
  sdkName: 'hire.v1.job.config',
  path: '/open-apis/hire/v1/jobs/:job_id/config',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Get job config info-Get job config info',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({ job_id: z.string().describe('职位ID') }),
  },
};
export const hireV1JobGet = {
  project: 'hire',
  name: 'hire.v1.job.get',
  sdkName: 'hire.v1.job.get',
  path: '/open-apis/hire/v1/jobs/:job_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Get job info-Get job info by ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe('Department Id Type Options:open_department_id(Open Department ID),department_id(Department ID)')
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ job_id: z.string().describe('Job ID, request Path') }),
  },
};
export const hireV1JobGetDetail = {
  project: 'hire',
  name: 'hire.v1.job.getDetail',
  sdkName: 'hire.v1.job.getDetail',
  path: '/open-apis/hire/v1/jobs/:job_id/get_detail',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Get job details-Get the job details according to the job ID, including basic job information, job settings, and a list of related recruitment stores',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "rank ID" used in this call Options:people_admin_job_level_id("HR system management background" applicable rank ID. HR system management background is gradually offline, it is recommended not to continue to use this ID.),job_level_id(The rank ID applicable to the "Feishu Management Background" is obtained through the "Get Tenant Rank List" interface)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "sequence ID" used in this call Options:people_admin_job_category_id("HR system management background" applicable serial ID. HR system management background is gradually offline, it is recommended not to continue to use this ID.),job_family_id(The sequence ID applicable to the "Feishu Management Background" is obtained through the "Get Tenant Sequence List" interface)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ job_id: z.string().describe('Job ID, for details, please refer to: [Get job list] interface') }),
  },
};
export const hireV1JobList = {
  project: 'hire',
  name: 'hire.v1.job.list',
  sdkName: 'hire.v1.job.list',
  path: '/open-apis/hire/v1/jobs',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Get job list-Get job list',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        update_start_time: z.string().describe('Earliest update time, millisecond timestamp').optional(),
        update_end_time: z.string().describe('Latest update time, millisecond timestamp').optional(),
        page_size: z.number().describe('Page size').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The Type of department ID Options:open_department_id(By open_department_id),department_id(By department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const hireV1JobManagerBatchUpdate = {
  project: 'hire',
  name: 'hire.v1.jobManager.batchUpdate',
  sdkName: 'hire.v1.jobManager.batchUpdate',
  path: '/open-apis/hire/v1/jobs/:job_id/managers/batch_update',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Update job managers-Update job related personnel',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      recruiter_id: z.string().describe('Recruitment person ID').optional(),
      assistant_id_list: z.array(z.string()).describe('Recruitment Helper ID').optional(),
      hiring_manager_id_list: z.array(z.string()).describe('Employer Manager ID').optional(),
      update_option_list: z
        .array(
          z
            .number()
            .describe(
              'Options:1(JobManager Recruitment manager),2(Assistant Recruitment Facilitator),3(HireManager hiring manager)',
            ),
        )
        .describe(
          'Updated personnel type, optional values: 1 = recruiting person in charge; 2 = recruiting assistant; 3 = hiring manager;',
        ),
      creator_id: z.string().describe('Operator ID').optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ job_id: z.string().describe('Job ID') }),
  },
};
export const hireV1JobManagerGet = {
  project: 'hire',
  name: 'hire.v1.jobManager.get',
  sdkName: 'hire.v1.jobManager.get',
  path: '/open-apis/hire/v1/jobs/:job_id/managers/:manager_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Hire-Job-Get job manager-Obtain the recruiter information on the position according to the position ID, such as the person in charge of the recruitment, the hiring manager',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({
      job_id: z.string().describe('Job ID'),
      manager_id: z.string().describe('Pass in the job ID here'),
    }),
  },
};
export const hireV1JobOpen = {
  project: 'hire',
  name: 'hire.v1.job.open',
  sdkName: 'hire.v1.job.open',
  path: '/open-apis/hire/v1/jobs/:job_id/open',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Open job-For closed jobs, you can restart them through this interface',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      expiry_time: z
        .number()
        .describe(
          'Expiration date, millisecond timestamp (int64 type) **NOTE**: When `is_never_expired` is `false`, this field is required and greater than the current time',
        )
        .optional(),
      is_never_expired: z
        .boolean()
        .describe(
          'Whether it is valid for a long time **Optional values are**: * `true`: valid for a long time* `false`: specify expiration date',
        ),
    }),
    path: z.object({ job_id: z.string().describe('Job ID, available via [Get Job List]') }),
  },
};
export const hireV1JobRecruiter = {
  project: 'hire',
  name: 'hire.v1.job.recruiter',
  sdkName: 'hire.v1.job.recruiter',
  path: '/open-apis/hire/v1/jobs/:job_id/recruiter',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Get job manager-Obtain the recruiter information on the position according to the position ID, such as the person in charge of the recruitment, the hiring manager',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ job_id: z.string().describe('Job ID') }),
  },
};
export const hireV1JobUpdateConfig = {
  project: 'hire',
  name: 'hire.v1.job.updateConfig',
  sdkName: 'hire.v1.job.updateConfig',
  path: '/open-apis/hire/v1/jobs/:job_id/update_config',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Job-Update job config-Update job settings, including interview evaluation form, offer application form, etc.If no data is entered during update of the required field, the interface will report an error about the update failure',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      offer_apply_schema_id: z
        .string()
        .describe(
          'Offer application form, enumerated, obtained through the interface "Get Offer Application Form List"',
        )
        .optional(),
      offer_process_conf: z
        .string()
        .describe('Offer approval flow, enumeration is obtained through the interface "Get Offer approval flow list"')
        .optional(),
      recommended_evaluator_id_list: z.array(z.string()).describe('List of Proposed Assessor IDs').optional(),
      update_option_list: z
        .array(
          z
            .number()
            .describe(
              'Options:1(更新面试评价表 Update interview feedback form),2(更新 Offer 申请表 Update Offer Application Form),3(更新 Offer 审批流程 Update the Offer Approval Process),4(更新招聘需求 Update recruitment needs),5(更新建议面试官 Update Suggestions Interviewer),6(更新推荐评估人 Update Recommended Evaluators),8(更新关联职位 Update related jobs),9(更新自助约面配置 Update self-service appointment configuration),10(更新面试登记表 Update the interview registration form),11(更新入职登记表 Update onboarding registration form),12(更新官网申请表 Update the official website application form)',
            ),
        )
        .describe('Update options, pass in the configuration items to be updated'),
      assessment_template_biz_id: z
        .string()
        .describe(
          'Interview feedback form, enumeration is obtained through the interface [Get interview feedback form list]',
        )
        .optional(),
      interview_round_conf_list: z
        .array(
          z.object({
            interviewer_id_list: z.array(z.string()).describe('Suggested Interviewer ID List').optional(),
            round: z.number().describe('Interview round').optional(),
          }),
        )
        .describe('List of suggested interviewers')
        .optional(),
      jr_id_list: z
        .array(z.string())
        .describe(
          'Associate recruitment requirements, support associating multiple, enumeration is obtained through the interface "Get Recruitment Requirements"',
        )
        .optional(),
      interview_registration_schema_id: z
        .string()
        .describe(
          'Interview registration form ID, when "HR by position selection registration form" is selected in Feishu Hire "Settings - Information registration form usage settings - Interview registration form usage", this field is required; otherwise this field will not take effect',
        )
        .optional(),
      onboard_registration_schema_id: z
        .string()
        .describe(
          'Onboarding registration form ID. This field is required if "HR selects a registration form by job" has been selected in Feishu Hire "Settings - Information Registration Form Usage Settings - Onboarding Registration Form Usage", otherwise this field won\'t take effect',
        )
        .optional(),
      interview_round_type_conf_list: z
        .array(
          z.object({
            round_biz_id: z.string().describe('interview round type id').optional(),
            assessment_template_biz_id: z.string().describe('interview assessment id').optional(),
          }),
        )
        .describe('interview round type id list')
        .optional(),
      related_job_id_list: z
        .array(z.string())
        .describe(
          'Associated position list, if the position is a physical position, associate the virtual position id, if the position is a virtual position, associate the entity position id',
        )
        .optional(),
      interview_appointment_config: z
        .object({
          enable_interview_appointment_by_interviewer: z
            .boolean()
            .describe('Whether to open the interviewer self-service appointment')
            .optional(),
          config: z
            .object({
              interview_type: z
                .number()
                .describe(
                  'interview type Options:1(OnSite on-site interview),2(Phone Telephone interview),3(Video video interview)',
                )
                .optional(),
              talent_timezone_code: z.string().describe('timezone').optional(),
              contact_user_id: z.string().describe('contect user id').optional(),
              contact_mobile: z.string().describe('contect user phone number').optional(),
              contact_email: z.string().describe('contect user email').optional(),
              address_id: z.string().describe('location id list').optional(),
              video_type: z
                .number()
                .describe(
                  'location id Options:1(Zoom),2(NewCoderTech NowCoder Technology Types),3(NewCoderNoTech NowCoder non-technical type),4(AcmCoder match code),5(Lark Feishu),8(Hackerrank),9(LarkWithCoding Feishu (including code assessment)),100(None Do not use system tools)',
                )
                .optional(),
              cc: z.array(z.string()).describe('cc user id list').optional(),
              remark: z.string().describe('comment').optional(),
              interview_notification_template_id: z.string().describe('Interview Notice Template').optional(),
              appointment_notification_template_id: z.string().describe('Appointment Notice Template').optional(),
              cancel_interview_notification_template_id: z.string().describe('cancel interview notice').optional(),
            })
            .describe('config detail')
            .optional(),
        })
        .describe('Self-service appointment configuration')
        .optional(),
      portal_website_apply_form_schema_id: z
        .string()
        .describe(
          'The official website application form ID can be obtained through the [Get the recruitment official website application form template list] interface',
        )
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ job_id: z.string().describe('Job ID') }),
  },
};
export const hireV1LocationList = {
  project: 'hire',
  name: 'hire.v1.location.list',
  sdkName: 'hire.v1.location.list',
  path: '/open-apis/hire/v1/locations',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Recruitment related configuration-Location-Get address list-Get address list',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.number().optional(),
      usage: z
        .enum(['position_location', 'interview_location'])
        .describe('Address type Options:position_location(Position Location),interview_location(Interview location)'),
    }),
  },
};
export const hireV1LocationQuery = {
  project: 'hire',
  name: 'hire.v1.location.query',
  sdkName: 'hire.v1.location.query',
  path: '/open-apis/hire/v1/locations/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Location-Query address list-Query the location list based on the location type and location code to obtain location name information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      code_list: z
        .array(z.string())
        .describe(
          'Location code list, the maximum length does not exceed 100.If not passed, the full list will be paged and queried based on the location type',
        )
        .optional(),
      location_type: z
        .number()
        .describe('location type Options:1(country type),2(Province/State Type),3(City type),4(District type)'),
    }),
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.number().describe('Per page limit, data validation rules 1-100'),
    }),
  },
};
export const hireV1MinutesGet = {
  project: 'hire',
  name: 'hire.v1.minutes.get',
  sdkName: 'hire.v1.minutes.get',
  path: '/open-apis/hire/v1/minutes',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Interview-Get interview minutes details-Get interview minutes details for the assigned interview',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      interview_id: z
        .string()
        .describe(
          'Interview ID, which can be obtained according to the [Get Interview Information] and [Get Talent Interview Information] API',
        ),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z
        .number()
        .describe('The paging size represents the maximum number of statements in the minutes fetched by this request')
        .optional(),
    }),
  },
};
export const hireV1NoteCreate = {
  project: 'hire',
  name: 'hire.v1.note.create',
  sdkName: 'hire.v1.note.create',
  path: '/open-apis/hire/v1/notes',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Hire-Candidate management-Note-Create note-Create note information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      talent_id: z.string().describe('Talent ID'),
      application_id: z.string().describe('Delivery ID').optional(),
      creator_id: z.string().describe('Creator ID').optional(),
      content: z.string().describe('Content'),
      privacy: z
        .number()
        .describe('Note Private property (public by default) Options:1(Private),2(Public Open)')
        .optional(),
      notify_mentioned_user: z.boolean().describe('Whether to notify the user who was @').optional(),
      mention_entity_list: z
        .array(
          z.object({
            offset: z.number().describe('The offset of the @person in the content'),
            user_id: z
              .string()
              .describe('User ID of the person being @, please pass in the ID that matches user_id_type'),
          }),
        )
        .describe('@user list')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1NoteDelete = {
  project: 'hire',
  name: 'hire.v1.note.delete',
  sdkName: 'hire.v1.note.delete',
  path: '/open-apis/hire/v1/notes/:note_id',
  httpMethod: 'DELETE',
  description: '[Feishu/Lark]-Hire-Candidate management-Note-Delete Note-Delete specified remarks',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ note_id: z.string().describe('Remark ID').optional() }).optional(),
  },
};
export const hireV1NoteGet = {
  project: 'hire',
  name: 'hire.v1.note.get',
  sdkName: 'hire.v1.note.get',
  path: '/open-apis/hire/v1/notes/:note_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Candidate management-Note-Get note-Get note data by ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({ note_id: z.string().describe('Note ID') }),
  },
};
export const hireV1NoteList = {
  project: 'hire',
  name: 'hire.v1.note.list',
  sdkName: 'hire.v1.note.list',
  path: '/open-apis/hire/v1/notes',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Candidate management-Note-Get note list-Get note list',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_size: z.number().describe('Page size, default 10, maximum 200').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      talent_id: z.string().describe('Talent ID'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
    }),
  },
};
export const hireV1NotePatch = {
  project: 'hire',
  name: 'hire.v1.note.patch',
  sdkName: 'hire.v1.note.patch',
  path: '/open-apis/hire/v1/notes/:note_id',
  httpMethod: 'PATCH',
  description: '[Feishu/Lark]-Hire-Candidate management-Note-Update note-Update note data',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      content: z.string().describe('Note content'),
      operator_id: z.string().describe('Updater ID').optional(),
      notify_mentioned_user: z.boolean().describe('Whether to notify the user who was @').optional(),
      mention_entity_list: z
        .array(
          z.object({
            offset: z.number().describe('The offset of the @person in the content'),
            user_id: z
              .string()
              .describe('User ID of the person being @, please pass in the ID that matches user_id_type'),
          }),
        )
        .describe('@user list')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({ note_id: z.string().describe('Note ID') }),
  },
};
export const hireV1OfferApplicationFormGet = {
  project: 'hire',
  name: 'hire.v1.offerApplicationForm.get',
  sdkName: 'hire.v1.offerApplicationForm.get',
  path: '/open-apis/hire/v1/offer_application_forms/:offer_application_form_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Offer settings-Offer application form-Get offer application form template infomation-Get offer application form template infomation',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ offer_application_form_id: z.string().describe('Offer Application ID').optional() }).optional(),
  },
};
export const hireV1OfferApplicationFormList = {
  project: 'hire',
  name: 'hire.v1.offerApplicationForm.list',
  sdkName: 'hire.v1.offerApplicationForm.list',
  path: '/open-apis/hire/v1/offer_application_forms',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Offer settings-Offer application form-Get offer application form list-Get offer application form list',
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
        page_size: z.number().describe('Page size').optional(),
      })
      .optional(),
  },
};
export const hireV1OfferCustomFieldUpdate = {
  project: 'hire',
  name: 'hire.v1.offerCustomField.update',
  sdkName: 'hire.v1.offerCustomField.update',
  path: '/open-apis/hire/v1/offer_custom_fields/:offer_custom_field_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Offer settings-Offer application form-Update offer apply form custom fields-- This document supports updating the custom field configuration of the Offer application form in "Feishu Hire" - "Settings" - "Offer Application Form Settings" through the interface; - After the current modification of the application form information (including updating the custom fields), the schema_id of all application forms will be updated, that is, a new version will be added to all application forms, and the schema_id of the application form will be used in creating and updating offers; - After the custom field of the Offer application form in "Feishu Hire" is created, it is not supported to modify the field type, and this interface does not support updating the field type; - If the current field type is "formula", it does not support updating through the interface',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z
        .object({ zh_cn: z.string().describe('Chinese').optional(), en_us: z.string().describe('English').optional() })
        .describe('Custom field name, one of zh_cn and en_us required'),
      config: z
        .object({
          options: z
            .array(
              z.object({
                name: z
                  .object({
                    zh_cn: z.string().describe('Chinese').optional(),
                    en_us: z.string().describe('English').optional(),
                  })
                  .describe('Option name,one of zh_cn and en_us required')
                  .optional(),
              }),
            )
            .describe('Options Information')
            .optional(),
        })
        .describe(
          'Custom field configuration information, only when the field type is "radio" and "multi-select", configuration option information needs to be passed',
        )
        .optional(),
    }),
    path: z
      .object({
        offer_custom_field_id: z
          .string()
          .describe(
            'Offer application form custom field ID, which can be obtained through the interface "Get Offer Application Form Template Information"',
          )
          .optional(),
      })
      .optional(),
  },
};
export const hireV1OfferSchemaGet = {
  project: 'hire',
  name: 'hire.v1.offerSchema.get',
  sdkName: 'hire.v1.offerSchema.get',
  path: '/open-apis/hire/v1/offer_schemas/:offer_schema_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Deprecated Version (Not Recommended)-Hire-offer-Get Offer Schema Information',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ offer_schema_id: z.string().describe('Offer schema ID') }),
  },
};
export const hireV1OfferCreate = {
  project: 'hire',
  name: 'hire.v1.offer.create',
  sdkName: 'hire.v1.offer.create',
  path: '/open-apis/hire/v1/offers',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Offer-Create offer-Create offers from the application and apply form',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      application_id: z.string().describe('Application ID,please refer to: [Get application list]'),
      schema_id: z
        .string()
        .describe(
          'Offer application form template ID, used to describe the metadata definition of the application form structure, that is, a description of the application form content. Every time the user changes the offer application form template information, a new schema_id will be generated. When creating an offer, the latest schema_id should be passed in. You can first get the offer application form ID from the [Get job config info], and then use the [Get offer application form template infomation]interface Get the latest template ID in.If not filled in, the latest template ID will be automatically filled in',
        )
        .optional(),
      offer_type: z
        .number()
        .describe('Offer Type Options:1(正式 Offer Official Offer),2(实习 Offer Internship Offer)')
        .optional(),
      basic_info: z
        .object({
          department_id: z
            .string()
            .describe('Department ID,consistent with the `department_id_type` type in the input parameter'),
          leader_user_id: z.string().describe('Direct manager ID,the same type as the input parameter `user_id_type`'),
          employment_job_id: z.string().describe('Job ID').optional(),
          employee_type_id: z.string().describe('Person type ID').optional(),
          job_family_id: z.string().describe('Job sequence ID').optional(),
          job_level_id: z.string().describe('Job Level ID').optional(),
          probation_month: z.number().describe('Probation period').optional(),
          contract_year: z
            .number()
            .describe(
              'Contract period (year), it is recommended to use "contract_period", if the "contract period (year)" field in the offer application form is disabled, this field cannot be used',
            )
            .optional(),
          contract_period: z
            .object({
              period_type: z.number().describe('Contract cycle type Options:1(month),2(year)'),
              period: z.number().describe('Contract duration'),
            })
            .describe('Contract period (year/month)')
            .optional(),
          expected_onboard_date: z.string().describe('Estimated onboard date').optional(),
          onboard_address_id: z.string().describe('Location ID').optional(),
          work_address_id: z.string().describe('Location ID').optional(),
          owner_user_id: z.string().describe('Offer owner ID,the same type as the input parameter `user_id_type`'),
          recommended_words: z.string().describe('Offer recommendation').optional(),
          job_requirement_id: z.string().describe('Recruitment Requirement ID').optional(),
          job_process_type_id: z.number().describe('Recruitment process type ID').optional(),
          attachment_id_list: z.array(z.string()).describe('Attachment ID List').optional(),
          common_attachment_id_list: z
            .array(z.string())
            .describe(
              'List of common attachment IDs, you can use the [Create Attachment] api to create common attachments',
            )
            .optional(),
          attachment_description: z.string().describe('Attachment description').optional(),
          operator_user_id: z
            .string()
            .describe('Offer Operator ID,the same type as the input parameter `user_id_type`'),
          position_id: z
            .string()
            .describe(
              'Position ID, which can be obtained through [Query Position Information] (only for Feishu personnel tenants, if the link cannot be opened, it means that Feishu personnel has not enabled the job, please contact [Technical Support] to open)',
            )
            .optional(),
          job_offered: z.string().describe('entry position').optional(),
          job_grade_id: z
            .string()
            .describe('Job Grade ID, available through [Check Grade] (for Feishu personnel tenants only)')
            .optional(),
        })
        .describe('Offer basic information'),
      salary_info: z
        .object({
          currency: z.string().describe('Currency'),
          basic_salary: z
            .string()
            .describe(
              'Basic salary, when the "Salary Information" module in the Offer application form is enabled, the "Basic Salary" field is a required item',
            )
            .optional(),
          probation_salary_percentage: z.string().describe('Percentage probation period').optional(),
          award_salary_multiple: z.string().describe('Annual bonus months').optional(),
          option_shares: z.string().describe('Number of options').optional(),
          quarterly_bonus: z.string().describe('Quarterly Award Amount').optional(),
          half_year_bonus: z.string().describe('Semi-annual prize amount').optional(),
        })
        .describe('Offer salary information')
        .optional(),
      customized_info_list: z
        .array(
          z.object({
            id: z.string().describe('Custom field ID').optional(),
            value: z
              .string()
              .describe(
                'Custom field information, passed in as a string, such as: 1. Radio: "1" 2. Multiple choice: "[\\" 1\\ ",\\" 2\\ "]" 3. Date: "{" date ":" 2022-01-01 "}" 4. Year selection: "{" date ":" 2022 "}" 5. Month selection: "{" date ":" 2022-01 "}" 6. Single line of text: "xxx" 7. Multi-line text: "xxx" 8. Number: "123" 9. Amount: "123.1"',
              )
              .optional(),
          }),
        )
        .describe('Custom information')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The Type Of Department ID Used In This Call Options:open_department_id(Identify Departments By open_department_id),department_id(Identify Departments By department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
        employee_type_id_type: z
          .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
          .describe(
            'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const hireV1OfferGet = {
  project: 'hire',
  name: 'hire.v1.offer.get',
  sdkName: 'hire.v1.offer.get',
  path: '/open-apis/hire/v1/offers/:offer_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Offer-Get offer details-Get offer details based on offer ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID Options:open_department_id(By open_department_id),department_id(By department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
        employee_type_id_type: z
          .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
          .describe(
            'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
          )
          .optional(),
      })
      .optional(),
    path: z
      .object({ offer_id: z.string().describe('Offer ID,please refer to: [Get offer list]').optional() })
      .optional(),
  },
};
export const hireV1OfferInternOfferStatus = {
  project: 'hire',
  name: 'hire.v1.offer.internOfferStatus',
  sdkName: 'hire.v1.offer.internOfferStatus',
  path: '/open-apis/hire/v1/offers/:offer_id/intern_offer_status',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Offer-Update internship offer entry/exit status-Confirmation or abandonment of an internship offer in the "Internship pending" status, or termination of an internship offer in the "Internship enrolled" status',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      operation: z
        .enum(['confirm_onboarding', 'cancel_onboarding', 'offboard'])
        .describe(
          'Operation to update in/out status Options:confirm_onboarding(Confirm entry),cancel_onboarding(Give up employment),offboard(Terminate)',
        ),
      onboarding_info: z
        .object({ actual_onboarding_date: z.string().describe('Actual onboard date') })
        .describe('Entry form information (this field is required when operation is confirm_onboarding)')
        .optional(),
      offboarding_info: z
        .object({
          actual_offboarding_date: z
            .string()
            .describe('Actual departure date (actual departure date must be later than actual onboard date)'),
          notes: z.string().describe('Remarks').optional(),
        })
        .describe('Exit form information (this field is required when operation is offboard)')
        .optional(),
    }),
    path: z.object({ offer_id: z.string().describe('Offer ID').optional() }).optional(),
  },
};
export const hireV1OfferList = {
  project: 'hire',
  name: 'hire.v1.offer.list',
  sdkName: 'hire.v1.offer.list',
  path: '/open-apis/hire/v1/offers',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Offer-Get offer list-Get offer list based on talent ID',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.number().describe('Page size, maximum is 200').optional(),
      talent_id: z.string().describe('Talent ID'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      employee_type_id_type: z
        .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
        .describe(
          'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
        )
        .optional(),
    }),
  },
};
export const hireV1OfferOfferStatus = {
  project: 'hire',
  name: 'hire.v1.offer.offerStatus',
  sdkName: 'hire.v1.offer.offerStatus',
  path: '/open-apis/hire/v1/offers/:offer_id/offer_status',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Offer-Update Offer Status-Update the status of the candidate Offer with the Offer ID.- To update the approval status of the Offer, you need to open "Create and approve an Offer through the OA system" in "Settings - Offer Settings - Offer Rule Settings" in the system. If the current Offer has been approved through Feishu Hire, the approval status of the Offer cannot be updated through this interface- To update the sending and accepting status of the Offer, you need to enable "Send Offer through the OA system" in "Settings - Offer Settings - Offer Rule Settings" in the system; only the delivery stage is supported to be updated before "Pending onboarding"; if the current Offer has been sent through Feishu Hire If it has been sent to candidates, the sending and receiving status of the Offer cannot be updated through this interface',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      offer_status: z
        .number()
        .describe(
          'Offer Status Options:2(Approving Approval is in progress.),3(Withdrawn Approval has been withdrawn),4(Approved),5(Rejected Approval failed),6(OfferLetterSent Offer has been issued),7(OfferAccepted Candidate received),8(OfferRejected Candidate rejected),9(Obsolete Offer has expired),10(NoApproval Offer created)',
        ),
      expiration_date: z
        .string()
        .describe('Offer expiration time, required when the feedback status is "offer has been issued"')
        .optional(),
      termination_reason_id_list: z
        .array(z.string())
        .describe(
          'List of termination reasons, required when the feedback status is "Candidate Rejected"; up to 50 are passed in',
        )
        .optional(),
      termination_reason_note: z.string().describe('Termination remarks').optional(),
    }),
    path: z.object({ offer_id: z.string().describe('Offer ID').optional() }).optional(),
  },
};
export const hireV1OfferUpdate = {
  project: 'hire',
  name: 'hire.v1.offer.update',
  sdkName: 'hire.v1.offer.update',
  path: '/open-apis/hire/v1/offers/:offer_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Offer-Update offer info-Update offer information, including basic information, salary information, and custom information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      schema_id: z.string().describe('Template ID'),
      basic_info: z
        .object({
          department_id: z.string().describe('Department ID'),
          leader_user_id: z.string().describe('Direct manager ID'),
          employment_job_id: z.string().describe('Job ID').optional(),
          employee_type_id: z.string().describe('Person type ID').optional(),
          job_family_id: z.string().describe('Job sequence ID').optional(),
          job_level_id: z.string().describe('Job Level ID').optional(),
          probation_month: z.number().describe('Probation period').optional(),
          contract_year: z
            .number()
            .describe(
              'Contract period (year), it is recommended to use "contract_period", if the "contract period (year)" field in the offer application form is disabled, this field cannot be used',
            )
            .optional(),
          contract_period: z
            .object({
              period_type: z.number().describe('Contract cycle type Options:1(month),2(year)'),
              period: z.number().describe('Contract duration'),
            })
            .describe('Contract period (year/month)')
            .optional(),
          expected_onboard_date: z.string().describe('Estimated onboard date').optional(),
          onboard_address_id: z.string().describe('Location ID').optional(),
          work_address_id: z.string().describe('Location ID').optional(),
          owner_user_id: z.string().describe('Offer ID'),
          recommended_words: z.string().describe('Offer recommendation').optional(),
          job_requirement_id: z.string().describe('Recruitment Requirement ID').optional(),
          job_process_type_id: z.number().describe('Recruitment process type ID').optional(),
          attachment_id_list: z.array(z.string()).describe('Attachment ID List').optional(),
          common_attachment_id_list: z
            .array(z.string())
            .describe(
              'List of common attachment IDs, you can use the [Create Attachment] api to create common attachments',
            )
            .optional(),
          attachment_description: z.string().describe('Attachment description').optional(),
          operator_user_id: z.string().describe('Offer Operator ID'),
          position_id: z
            .string()
            .describe(
              'Position ID, which can be obtained through [Query Position Information] (only for Feishu personnel tenants, if the link cannot be opened, it means that Feishu personnel has not enabled the job, please contact [Technical Support] to open)',
            )
            .optional(),
          job_offered: z.string().describe('entry position').optional(),
          job_grade_id: z
            .string()
            .describe('Job Grade ID, available through [Check Grade] (for Feishu personnel tenants only)')
            .optional(),
        })
        .describe('Offer basic information'),
      salary_info: z
        .object({
          currency: z.string().describe('Currency'),
          basic_salary: z
            .string()
            .describe(
              'Basic salary, when the "Salary Information" module in the Offer application form is enabled, the "Basic Salary" field is a required item',
            )
            .optional(),
          probation_salary_percentage: z.string().describe('Percentage probation period').optional(),
          award_salary_multiple: z.string().describe('Annual bonus months').optional(),
          option_shares: z.string().describe('Number of options').optional(),
          quarterly_bonus: z.string().describe('Quarterly Award Amount').optional(),
          half_year_bonus: z.string().describe('Semi-annual prize amount').optional(),
        })
        .describe('Offer salary information')
        .optional(),
      customized_info_list: z
        .array(
          z.object({
            id: z.string().describe('Custom field ID').optional(),
            value: z
              .string()
              .describe(
                'Custom field information, passed in as a string, such as: 1. Radio: "1" 2. Multiple choice: "[\\" 1\\ ",\\" 2\\ "]" 3. Date: "{" date ":" 2022-01-01 "}" 4. Year selection: "{" date ":" 2022 "}" 5. Month selection: "{" date ":" 2022-01 "}" 6. Single line of text: "xxx" 7. Multi-line text: "xxx" 8. Number: "123" 9. Amount: "123.1"',
              )
              .optional(),
          }),
        )
        .describe('Custom information')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The Type Of Department ID Used In This Call Options:open_department_id(Identify departments By Open_department_id),department_id(Identify Departments By Department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        job_family_id_type: z
          .enum(['people_admin_job_category_id', 'job_family_id'])
          .describe(
            'The type of "Job Family ID" used in this request Options:people_admin_job_category_id(The Job Family ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_family_id(The Job Family ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job family] interface.)',
          )
          .optional(),
        employee_type_id_type: z
          .enum(['people_admin_employee_type_id', 'employee_type_enum_id'])
          .describe(
            'The type of "Workforce Type ID" used in this request Options:people_admin_employee_type_id(The Workforce Type ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),employee_type_enum_id(The Workforce Type ID applicable to "Feishu Management Backend" can be obtained through the [Query the workforce type] interface.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ offer_id: z.string().describe('Offer ID').optional() }).optional(),
  },
};
export const hireV1QuestionnaireList = {
  project: 'hire',
  name: 'hire.v1.questionnaire.list',
  sdkName: 'hire.v1.questionnaire.list',
  path: '/open-apis/hire/v1/questionnaires',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Interview-Get a list of interview satisfaction questionnaires-Get a list of interview satisfaction questionnaires',
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
        page_size: z.number().describe('Page size').optional(),
        application_id: z
          .string()
          .describe(
            'Delivery ID. When the Feishu Hire-Settings-Interview Feedback Questionnaire is set, the time to send the questionnaire is "After the interview process", and only inquiries through application_id are supported',
          )
          .optional(),
        interview_id: z
          .string()
          .describe(
            'Interview ID. when Feishu Hire - Settings - Interview Feedback Questionnaire is set, the questionnaire is sent "after each interview" or "after the first interview", and only supports inquiry through interview_id',
          )
          .optional(),
        update_start_time: z.string().describe('Earliest update').optional(),
        update_end_time: z.string().describe('Latest update time').optional(),
      })
      .optional(),
  },
};
export const hireV1ReferralAccountCreate = {
  project: 'hire',
  name: 'hire.v1.referralAccount.create',
  sdkName: 'hire.v1.referralAccount.create',
  path: '/open-apis/hire/v1/referral_account',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-referral account-Register Referral Account for External System-You can register a "Referral reward account" with the referrer\'s phone number or email address to obtain the corresponding referrer\'s account ID and query and perform actions on the referrer\'s account balance (credits/rewards) by using ["Referral account balance change"] and ["Withdraw referral account balance"] interfaces. If you need to disable this account, call the ["Disable referral account"] interface',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        mobile: z
          .object({
            code: z.string().describe('Mobile country code').optional(),
            number: z.string().describe('Mobile number').optional(),
          })
          .describe('Mobile')
          .optional(),
        email: z.string().describe('Email').optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const hireV1ReferralAccountDeactivate = {
  project: 'hire',
  name: 'hire.v1.referralAccount.deactivate',
  sdkName: 'hire.v1.referralAccount.deactivate',
  path: '/open-apis/hire/v1/referral_account/:referral_account_id/deactivate',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-referral account-Disable Referral Account for External System-Once you disable this referral account, its information won\'t be able to be obtained or modified via the ["Referral account balance change"] or ["Withdraw referral account balance"] interface',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ referral_account_id: z.string().describe('Account ID').optional() }).optional(),
  },
};
export const hireV1ReferralAccountEnable = {
  project: 'hire',
  name: 'hire.v1.referralAccount.enable',
  sdkName: 'hire.v1.referralAccount.enable',
  path: '/open-apis/hire/v1/referral_account/enable',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-referral account-Activate referral account-Enable the account according to the account ID. After activation, you can obtain and modify it through the interface ["referral account balance change event"], ["withdrawal of referral account balance"]',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        referral_account_id: z
          .string()
          .describe('Account ID, obtained after registering an account: [Register a referral account]')
          .optional(),
      })
      .optional(),
    params: z
      .object({ user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const hireV1ReferralAccountGetAccountAssets = {
  project: 'hire',
  name: 'hire.v1.referralAccount.getAccountAssets',
  sdkName: 'hire.v1.referralAccount.getAccountAssets',
  path: '/open-apis/hire/v1/referral_account/get_account_assets',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-referral account-Query referral account-Query the referral account info according to the account ID',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      referral_account_id: z
        .string()
        .describe('Account ID, obtained after registering an account: [Register a referral account]'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
  },
};
export const hireV1ReferralAccountReconciliation = {
  project: 'hire',
  name: 'hire.v1.referralAccount.reconciliation',
  sdkName: 'hire.v1.referralAccount.reconciliation',
  path: '/open-apis/hire/v1/referral_account/reconciliation',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-referral account-Withdrawal and Reconciliation API of Referral Account-You can sync the account top-up information within the time period to the recruitment system at a fixed time. The data will be compared against the withdrawn amount from the system to ensure prompt detection of top-up errors or other errors in the event of system exceptions or other unexpected circumstances',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      start_trans_time: z
        .string()
        .describe('When reconciling by time frame, the starting transaction time of the time period'),
      end_trans_time: z
        .string()
        .describe('When reconciling by time frame, the cut-off transaction time for the time period'),
      trade_details: z
        .array(
          z.object({
            account_id: z.string().describe('Account ID'),
            total_recharge_reward_info: z
              .object({ point_bonus: z.number().describe('Points Reward').optional() })
              .describe('The actual recharge amount of the account in the points mall during the time period')
              .optional(),
          }),
        )
        .describe('Transaction information')
        .optional(),
    }),
  },
};
export const hireV1ReferralAccountWithdraw = {
  project: 'hire',
  name: 'hire.v1.referralAccount.withdraw',
  sdkName: 'hire.v1.referralAccount.withdraw',
  path: '/open-apis/hire/v1/referral_account/:referral_account_id/withdraw',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-referral account-Withdraw Balance from Referral Account in Full Amount-You can withdraw rewards (credits or cash) from the referral account in full with the account ID. Before you call the interface, make sure you\'ve completed the ["Register referral account for external system"] step and obtained the account ID. After the withdrawal, the referrer\'s account balance (credits or cash) will be zeroed, and the reward amount deducted will be marked as "Issued" in the recruitment system',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      withdraw_bonus_type: z
        .array(z.number().describe('Options:1(point),2(cash)'))
        .describe('Reward type for requesting withdrawal'),
      external_order_id: z
        .string()
        .describe(
          'The bill of lading ID is provided by the requesting party when requesting. The subsequent interaction about this withdrawal operation is carried out with this bill of lading ID as the identifier. It needs to be guaranteed to be unique and used to ensure the idempotence of the withdrawal. Passing in the duplicate ID will return the corresponding bill of lading. Extracted amount details',
        ),
    }),
    path: z.object({ referral_account_id: z.string().describe('Account ID').optional() }).optional(),
  },
};
export const hireV1ReferralWebsiteJobPostGet = {
  project: 'hire',
  name: 'hire.v1.referralWebsiteJobPost.get',
  sdkName: 'hire.v1.referralWebsiteJobPost.get',
  path: '/open-apis/hire/v1/referral_websites/job_posts/:job_post_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Referral-Obtain Job Post Details of Referral Official Website-Obtain Job Post Details of Referral Official Website by Post ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ job_post_id: z.string().describe('Job Advertising ID') }),
  },
};
export const hireV1ReferralWebsiteJobPostList = {
  project: 'hire',
  name: 'hire.v1.referralWebsiteJobPost.list',
  sdkName: 'hire.v1.referralWebsiteJobPost.list',
  path: '/open-apis/hire/v1/referral_websites/job_posts',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Referral-Obtain Job List of Referral Official Website-Obtain the job list of the referral official website. Custom data can\'t be obtained from the interface. The job list with custom data can be obtained from "Obtain Job Post Details from Referral Official Website"',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        process_type: z
          .number()
          .describe(
            'Types of recruitment processes Options:1(social_process Social Recruitment),2(campus_process Campus Recruitment)',
          )
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('the number of records fetched per page,').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const hireV1ReferralGetByApplication = {
  project: 'hire',
  name: 'hire.v1.referral.getByApplication',
  sdkName: 'hire.v1.referral.getByApplication',
  path: '/open-apis/hire/v1/referrals/get_by_application',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Get candidates-Referral-Get referral-Get referral by application ID',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      application_id: z.string().describe('Application id'),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
    }),
  },
};
export const hireV1ReferralSearch = {
  project: 'hire',
  name: 'hire.v1.referral.search',
  sdkName: 'hire.v1.referral.search',
  path: '/open-apis/hire/v1/referrals/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Referral-Query talent referral information-Query talent referral information, sorted by the "Creation time" of the referral application in descending order',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      talent_id: z.string().describe('Talent ID，[「Get talent ID by mobile or email」]'),
      start_time: z
        .string()
        .describe(
          'The earliest creation time of the referral record.If not filled in, it defaults to all. A maximum of 200 records will be returned',
        )
        .optional(),
      end_time: z
        .string()
        .describe(
          'The latest creation time of the referral record. If not filled in, it defaults to all. A maximum of 200 records will be returned',
        )
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const hireV1RegistrationSchemaList = {
  project: 'hire',
  name: 'hire.v1.registrationSchema.list',
  sdkName: 'hire.v1.registrationSchema.list',
  path: '/open-apis/hire/v1/registration_schemas',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-application-Obtain List of Information Registration Form Templates-Obtain List of Information Registration Form Templates',
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
        scenario: z
          .number()
          .describe(
            'Applicable scenarios of registration forms. If this field is left empty, it means to obtain all types of information registration forms. Options:5(InterviewRegistration Interview registration form),6(OnboardRegistration Onboarding registration form),14(InfoUpdateRegistration Information update registration form)',
          )
          .optional(),
      })
      .optional(),
  },
};
export const hireV1ResumeSourceList = {
  project: 'hire',
  name: 'hire.v1.resumeSource.list',
  sdkName: 'hire.v1.resumeSource.list',
  path: '/open-apis/hire/v1/resume_sources',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Candidate management-Resume source-Get resume source list-Get resume source list',
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
      })
      .optional(),
  },
};
export const hireV1RoleGet = {
  project: 'hire',
  name: 'hire.v1.role.get',
  sdkName: 'hire.v1.role.get',
  path: '/open-apis/hire/v1/roles/:role_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Permissions-Get Role Detail-Obtain role details, including name, description, permission list, etc(Applicable to new version permissions. Regarding the main differences between new and old version permissions: the new permission system distinguishes between campus and experienced hire and separates permissions into feature permissions, field permissions, and data permissions)',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({ role_id: z.string().describe('Role ID. Call [Obtain List of Roles] to obtain').optional() })
      .optional(),
  },
};
export const hireV1RoleList = {
  project: 'hire',
  name: 'hire.v1.role.list',
  sdkName: 'hire.v1.role.list',
  path: '/open-apis/hire/v1/roles',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Recruitment related configuration-Permissions-Get role list-Get a list of roles',
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
        page_size: z.number().describe('Number of records fetched per page, maximum 200').optional(),
      })
      .optional(),
  },
};
export const hireV1SubjectList = {
  project: 'hire',
  name: 'hire.v1.subject.list',
  sdkName: 'hire.v1.subject.list',
  path: '/open-apis/hire/v1/subjects',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Recruitment related configuration-Subject-Get subject list-Get subject list',
  accessTokens: ['tenant'],
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
        page_size: z.number().describe('Page size, not to exceed 200').optional(),
      })
      .optional(),
  },
};
export const hireV1TalentBlocklistChangeTalentBlock = {
  project: 'hire',
  name: 'hire.v1.talentBlocklist.changeTalentBlock',
  sdkName: 'hire.v1.talentBlocklist.changeTalentBlock',
  path: '/open-apis/hire/v1/talent_blocklist/change_talent_block',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Talent-Add/remove block list-Add/remove talents from the blocked list based on their talent ID',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      talent_id: z.string().describe('Talent ID, which can be obtained through the [Get Talent List] interface'),
      option: z
        .number()
        .describe('operation type Options:1(Add Join the block list),2(Remove Remove from the blocked list)'),
      reason: z.string().describe("Block reason, required when'option 'is'Add to block list'").optional(),
    }),
  },
};
export const hireV1TalentFolderList = {
  project: 'hire',
  name: 'hire.v1.talentFolder.list',
  sdkName: 'hire.v1.talentFolder.list',
  path: '/open-apis/hire/v1/talent_folders',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Talent-Get talent folder information-Used to obtain talent folder information in the recruitment system',
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
        page_size: z.number().describe('Number of records fetched per page').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1TalentObjectQuery = {
  project: 'hire',
  name: 'hire.v1.talentObject.query',
  sdkName: 'hire.v1.talentObject.query',
  path: '/open-apis/hire/v1/talent_objects/query',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Candidate management-Talent-Get talent field-Get talent field',
  accessTokens: ['tenant'],
  schema: {},
};
export const hireV1TalentOperationLogSearch = {
  project: 'hire',
  name: 'hire.v1.talentOperationLog.search',
  sdkName: 'hire.v1.talentOperationLog.search',
  path: '/open-apis/hire/v1/talent_operation_logs/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Deprecated Version (Not Recommended)-Hire-人才-Search talent operation log list-Query the operation record of the operator to the talent',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      job_id_list: z.array(z.string()).describe('Job ID List').optional(),
      operator_id_list: z.array(z.string()).describe('List of operator IDs'),
      operation_list: z.array(z.number()).describe('List of operation type IDs'),
    }),
    params: z
      .object({
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        page_size: z.number().describe('Page size').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1TalentPoolBatchChangeTalentPool = {
  project: 'hire',
  name: 'hire.v1.talentPool.batchChangeTalentPool',
  sdkName: 'hire.v1.talentPool.batchChangeTalentPool',
  path: '/open-apis/hire/v1/talent_pools/:talent_pool_id/batch_change_talent_pool',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Talent Pool-Add/remove talents from the talent pool in batches-For the same talent pool, talent addition or removal operations can be performed in batches',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      talent_id_list: z.array(z.string()).describe('Talent ID list, please check: [Get Talent List]'),
      option_type: z
        .number()
        .describe(
          'operation type Options:1(Add Join the designated talent pool operation),2(Remove Remove from the designated talent pool)',
        ),
    }),
    path: z.object({ talent_pool_id: z.string().describe('Talent pool ID, please check: [Get talent pool list]') }),
  },
};
export const hireV1TalentPoolMoveTalent = {
  project: 'hire',
  name: 'hire.v1.talentPool.moveTalent',
  sdkName: 'hire.v1.talentPool.moveTalent',
  path: '/open-apis/hire/v1/talent_pools/:talent_pool_id/talent_relationship',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Talent Pool-Add Talent to Talent Pool-Add talents to the talent pool',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      talent_id: z.string().describe('Talent ID'),
      add_type: z
        .number()
        .describe('Remove talents from the original talent pool. Options:1(OnlyAdd No),2(AddAndRemoveFromOrigin Yes)'),
    }),
    path: z.object({ talent_pool_id: z.string().describe('Talent pool ID').optional() }).optional(),
  },
};
export const hireV1TalentPoolSearch = {
  project: 'hire',
  name: 'hire.v1.talentPool.search',
  sdkName: 'hire.v1.talentPool.search',
  path: '/open-apis/hire/v1/talent_pools/',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Candidate management-Talent Pool-Get Talent Pool List-Get the list of talent pools',
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
        id_list: z
          .array(z.string())
          .describe('Talent pool ID. The information of all talent pools will be returned if this field is left empty')
          .optional(),
      })
      .optional(),
  },
};
export const hireV1TalentTagList = {
  project: 'hire',
  name: 'hire.v1.talentTag.list',
  sdkName: 'hire.v1.talentTag.list',
  path: '/open-apis/hire/v1/talent_tags',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-application-Get talent tag info list-You can obtain the talent tag information list by keyword, ID list, type, and active/inactive status. The list is arranged in reverse order by creation time',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        keyword: z.string().describe('Keyword').optional(),
        id_list: z.array(z.string()).describe('ID list').optional(),
        type: z.number().describe('Tag type Options:1(Manual-Tagging),2(Auto-Tagging)').optional(),
        include_inactive: z.boolean().describe('Include inactive').optional(),
        page_size: z.number().describe('Page size').optional(),
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
export const hireV1TalentAddToFolder = {
  project: 'hire',
  name: 'hire.v1.talent.addToFolder',
  sdkName: 'hire.v1.talent.addToFolder',
  path: '/open-apis/hire/v1/talents/add_to_folder',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Talent-Add talents to folder-Add talents to the specified folder',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      talent_id_list: z
        .array(z.string())
        .describe('Talent ID List, which can be queried through the [Get talent list] interface'),
      folder_id: z
        .string()
        .describe('Folder ID, which can be queried through the [Get talent folder information] interface'),
    }),
  },
};
export const hireV1TalentBatchGetId = {
  project: 'hire',
  name: 'hire.v1.talent.batchGetId',
  sdkName: 'hire.v1.talent.batchGetId',
  path: '/open-apis/hire/v1/talents/batch_get_id',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Talent-Get talent ID by mobile or email-Get talent ID by mobile phone number or email',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        mobile_code: z
          .string()
          .describe('Mobile phone country code, default value: 86, that is, the Chinese mainland')
          .optional(),
        mobile_number_list: z
          .array(z.string())
          .describe('The mobile phone number and area code all use the value of the mobile_code parameter, up to 100')
          .optional(),
        email_list: z.array(z.string()).describe('Mailbox information list, up to 100').optional(),
        identification_type: z.number().describe('identification type').optional(),
        identification_number_list: z.array(z.string()).describe('identification number').optional(),
      })
      .optional(),
  },
};
export const hireV1TalentCombinedCreate = {
  project: 'hire',
  name: 'hire.v1.talent.combinedCreate',
  sdkName: 'hire.v1.talent.combinedCreate',
  path: '/open-apis/hire/v1/talents/combined_create',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Talent-Create talent-Used to create a talent within the enterprise. The name is a required field preset by the system. For email/phone fields, please confirm whether it is required in the Feishu recruitment standard resume template settings. Custom field information can be obtained with the 「Get Talent Field」 interface',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      init_source_id: z
        .string()
        .describe('Resume source ID, which can be queried through the [Get Resume Source List] interface')
        .optional(),
      folder_id_list: z.array(z.string()).describe('List of folder IDs').optional(),
      creator_id: z.string().describe('Creator ID').optional(),
      creator_account_type: z
        .number()
        .describe('Creator type Options:1(员工体系 Employee system),3(系统 System)')
        .optional(),
      resume_attachment_id: z.string().describe('Resume attachment ID').optional(),
      basic_info: z
        .object({
          name: z.string().describe('Name'),
          mobile: z.string().describe('Cell phone number').optional(),
          mobile_country_code: z.string().describe('Phone country code').optional(),
          email: z.string().describe('Email').optional(),
          identification: z
            .object({
              identification_type: z
                .number()
                .describe(
                  'Type of document Options:1(MainlandIDCard China - Resident Identity Card),2(Passport),3(HongKongIDCard China-Hong Kong and Macau Resident Residence Permit),4(TaiwanIDCard Mainland Travel Permit for China-Taiwan Residents),5(Others Other),6(HKMAMainlandTravelPermit Mainland Travel Permit for China-Hong Kong and Macao Residents),9(TWResidencePermit China-Taiwan Resident Residence Permit)',
                )
                .optional(),
              identification_number: z.string().describe('Certificate number').optional(),
            })
            .describe('Document information')
            .optional(),
          start_work_time: z.string().describe('Start working hours').optional(),
          birthday: z.string().describe('Date of birth').optional(),
          gender: z.number().describe('Gender Options:1(Male),2(Female),3(Other)').optional(),
          nationality_id: z.string().describe('Nationality code').optional(),
          current_city_code: z.string().describe('Location code').optional(),
          hometown_city_code: z.string().describe('Hometown code').optional(),
          customized_data: z
            .array(
              z.object({
                object_id: z.string().describe('Custom field ID').optional(),
                children: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z.string().describe('Custom field value').optional(),
                    }),
                  )
                  .describe('List of subfields')
                  .optional(),
              }),
            )
            .describe('Custom field list')
            .optional(),
        })
        .describe('Basic Information'),
      education_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            degree: z
              .number()
              .describe(
                'Education Options:1(PrimaryEducation Primary school),2(JuniorMiddleSchoolEducation Junior high school),3(Secondary Full-time),4(SeniorSchoolGraduates High school),5(Associate College),6(Bachelor Undergraduate),7(Master),8(Phd Doctor),9(Other)',
              )
              .optional(),
            school: z.string().describe('School').optional(),
            field_of_study: z.string().describe('Professional').optional(),
            start_time: z.string().describe('Start time').optional(),
            end_time: z.string().describe('End time').optional(),
            education_type: z
              .number()
              .describe(
                'Type of education Options:1(Overseas, Hong Kong and Taiwan Overseas and RTHK),2(FullTimeUnifiedEnrollment Full-time recruitment),3(PartTimeUnifiedEnrollment Part-time),4(SelfTaught Self-test),5(Others Other)',
              )
              .optional(),
            academic_ranking: z
              .number()
              .describe(
                'Achievement ranking Options:5(Top5Percent Top 5%),10(Top10Percent Top 10%),20(Top20Percent Top 20%),30(Top30Percent Top 30%),50(Top50Percent Top 50%),-1(Others Other)',
              )
              .optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Educational experience')
        .optional(),
      career_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            company: z.string().describe('Company name').optional(),
            title: z.string().describe('Job title').optional(),
            desc: z.string().describe('Description').optional(),
            start_time: z.string().describe('Start time').optional(),
            end_time: z.string().describe('End time').optional(),
            career_type: z
              .number()
              .describe('Type of experience Options:1(实习经历 Internship experience),2(工作经历 Work experience)')
              .optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Work experience')
        .optional(),
      project_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            name: z.string().describe('Project name').optional(),
            role: z.string().describe('Project role').optional(),
            link: z.string().describe('Project link').optional(),
            desc: z.string().describe('Description').optional(),
            start_time: z.string().describe('Start time').optional(),
            end_time: z.string().describe('End time').optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Project experience')
        .optional(),
      works_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            link: z.string().describe('Links to works').optional(),
            desc: z.string().describe('Description').optional(),
            attachment_id: z.string().describe('Attachment ID').optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Works')
        .optional(),
      award_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            title: z.string().describe('Award Name').optional(),
            award_time: z.string().describe('Award time').optional(),
            desc: z.string().describe('Description').optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Award')
        .optional(),
      language_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            language: z
              .number()
              .describe(
                'Language Options:1(English),2(French),3(Japanese),4(Korean),5(German),6(Russian),7(Spanish),8(Portuguese),9(Arabic),10(Hindi),11(Hindustani Hindustani language),12(Bengali Bengali language),13(Hausa Hausa language),14(Punjabi),15(Persian),16(Swahili Swahili language),17(Telugu Telugu language),18(Turkish),19(Italian),20(Javanese Java language),21(Tamil Tamil language),22(Marathi Marathi language),23(Vietnamese),24(Mandarin),25(Cantonese),26(Indonesian),27(Malayan Malay),28(Thai),29(Serbian)',
              )
              .optional(),
            proficiency: z
              .number()
              .describe(
                'Proficiency Options:1(Elementary Getting Started),2(LimitedWorking Daily conversation),3(ProfessionalWorking Business meeting),4(FullProfessional Accessible communication),5(NativeOrBilingual Mother tongue)',
              )
              .optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Language ability')
        .optional(),
      sns_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            sns_type: z
              .number()
              .describe(
                'SNS name Options:1(LinkedIn),2(Maimai),3(Wechat),4(Weibo),5(Github),6(Zhihu),7(Facebook),8(Twitter),9(Whatsapp),10(PersonalWebsite Personal website),11(QQ)',
              )
              .optional(),
            link: z.string().describe('URL/ID').optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Social accounts')
        .optional(),
      preferred_city_code_list: z.array(z.string()).describe('Intended location').optional(),
      self_evaluation: z
        .object({
          id: z.string().describe('ID').optional(),
          content: z.string().describe('Content').optional(),
          customized_data: z
            .array(
              z.object({
                object_id: z.string().describe('Custom field ID').optional(),
                children: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z.string().describe('Custom field value').optional(),
                    }),
                  )
                  .describe('List of subfields')
                  .optional(),
              }),
            )
            .describe('Custom fields')
            .optional(),
        })
        .describe('Self-evaluation')
        .optional(),
      customized_data: z
        .array(
          z.object({
            object_id: z.string().describe('Custom field ID').optional(),
            children: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  value: z.string().describe('Custom field value').optional(),
                }),
              )
              .describe('List of subfields')
              .optional(),
          }),
        )
        .describe('Custom module')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1TalentCombinedUpdate = {
  project: 'hire',
  name: 'hire.v1.talent.combinedUpdate',
  sdkName: 'hire.v1.talent.combinedUpdate',
  path: '/open-apis/hire/v1/talents/combined_update',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Talent-Update talent information-Used to update a talent in the enterprise. The name is a required field preset by the system. For email/phone fields, please confirm whether it is required in the Feishu recruitment standard resume template settings. Custom field information can be obtained with the 「Get Talent Field」 interface',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      talent_id: z.string().describe('Talent ID'),
      init_source_id: z
        .string()
        .describe('Resume source ID, which can be queried through the [Get Resume Source List] interface')
        .optional(),
      folder_id_list: z.array(z.string()).describe('List of folder IDs').optional(),
      operator_id: z.string().describe('Update ID').optional(),
      operator_account_type: z
        .number()
        .describe('Update type Options:1(员工体系 Employee system),3(系统 System)')
        .optional(),
      resume_attachment_id: z.string().describe('Resume attachment id').optional(),
      basic_info: z
        .object({
          name: z.string().describe('Name').optional(),
          mobile: z.string().describe('Cell phone number').optional(),
          mobile_country_code: z.string().describe('Phone country code').optional(),
          email: z.string().describe('Email').optional(),
          identification: z
            .object({
              identification_type: z
                .number()
                .describe(
                  'Type of document Options:1(MainlandIDCard China - Resident Identity Card),2(Passport),3(HongKongIDCard China-Hong Kong and Macau Resident Residence Permit),4(TaiwanIDCard Mainland Travel Permit for China-Taiwan Residents),5(Others Other),6(HKMAMainlandTravelPermit Mainland Travel Permit for China-Hong Kong and Macao Residents),9(TWResidencePermit China-Taiwan Resident Residence Permit)',
                )
                .optional(),
              identification_number: z.string().describe('Certificate number').optional(),
            })
            .describe('Document information')
            .optional(),
          start_work_time: z.string().describe('Start working hours').optional(),
          birthday: z.string().describe('Date of birth').optional(),
          gender: z.number().describe('Gender Options:1(Male),2(Female),3(Other)').optional(),
          nationality_id: z.string().describe('Nationality code').optional(),
          current_city_code: z.string().describe('Location code').optional(),
          hometown_city_code: z.string().describe('Hometown code').optional(),
          customized_data: z
            .array(
              z.object({
                object_id: z.string().describe('Custom field ID').optional(),
                children: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z.string().describe('Custom field value').optional(),
                    }),
                  )
                  .describe('List of subfields')
                  .optional(),
              }),
            )
            .describe('Custom field list')
            .optional(),
        })
        .describe('Basic Information'),
      education_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            degree: z
              .number()
              .describe(
                'Education Options:1(PrimaryEducation Primary school),2(JuniorMiddleSchoolEducation Junior high school),3(Secondary Full-time),4(SeniorSchoolGraduates High school),5(Associate College),6(Bachelor Undergraduate),7(Master),8(Phd Doctor),9(Other)',
              )
              .optional(),
            school: z.string().describe('School').optional(),
            field_of_study: z.string().describe('Professional').optional(),
            start_time: z.string().describe('Start time').optional(),
            end_time: z.string().describe('End time').optional(),
            education_type: z
              .number()
              .describe(
                'Type of education Options:1(Overseas, Hong Kong and Taiwan Overseas and RTHK),2(FullTimeUnifiedEnrollment Full-time recruitment),3(PartTimeUnifiedEnrollment Part-time),4(SelfTaught Self-test),5(Others Other)',
              )
              .optional(),
            academic_ranking: z
              .number()
              .describe(
                'Achievement ranking Options:5(Top5Percent Top 5%),10(Top10Percent Top 10%),20(Top20Percent Top 20%),30(Top30Percent Top 30%),50(Top50Percent Top 50%),-1(Others Other)',
              )
              .optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Educational experience')
        .optional(),
      career_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            company: z.string().describe('Company name').optional(),
            title: z.string().describe('Job title').optional(),
            desc: z.string().describe('Description').optional(),
            start_time: z.string().describe('Start time').optional(),
            end_time: z.string().describe('End time').optional(),
            career_type: z
              .number()
              .describe('Type of experience Options:1(Internship internship experience),2(Career work experience)')
              .optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Work experience')
        .optional(),
      project_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            name: z.string().describe('Project name').optional(),
            role: z.string().describe('Project role').optional(),
            link: z.string().describe('Project link').optional(),
            desc: z.string().describe('Description').optional(),
            start_time: z.string().describe('Start time').optional(),
            end_time: z.string().describe('End time').optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Project experience')
        .optional(),
      works_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            link: z.string().describe('Links to works').optional(),
            desc: z.string().describe('Description').optional(),
            attachment_id: z.string().describe('Attachment ID').optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Works')
        .optional(),
      award_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            title: z.string().describe('Award Name').optional(),
            award_time: z.string().describe('Award time').optional(),
            desc: z.string().describe('Description').optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Award')
        .optional(),
      language_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            language: z
              .number()
              .describe(
                'Language Options:1(English),2(French),3(Japanese),4(Korean),5(German),6(Russian),7(Spanish),8(Portuguese),9(Arabic),10(Hindi),11(Hindustani Hindustani language),12(Bengali Bengali language),13(Hausa Hausa language),14(Punjabi),15(Persian),16(Swahili Swahili language),17(Telugu Telugu language),18(Turkish),19(Italian),20(Javanese Java language),21(Tamil Tamil language),22(Marathi Marathi language),23(Vietnamese),24(Mandarin),25(Cantonese),26(Indonesian),27(Malayan Malay),28(Thai),29(Serbian)',
              )
              .optional(),
            proficiency: z
              .number()
              .describe(
                'Proficiency Options:1(Elementary Getting Started),2(LimitedWorking Daily conversation),3(ProfessionalWorking Business meeting),4(FullProfessional Accessible communication),5(NativeOrBilingual Mother tongue)',
              )
              .optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Language ability')
        .optional(),
      sns_list: z
        .array(
          z.object({
            id: z.string().describe('ID').optional(),
            sns_type: z
              .number()
              .describe(
                'SNS name Options:1(LinkedIn),2(Maimai),3(Wechat),4(Weibo),5(Github),6(Zhihu),7(Facebook),8(Twitter),9(Whatsapp),10(PersonalWebsite Personal website),11(QQ)',
              )
              .optional(),
            link: z.string().describe('URL/ID').optional(),
            customized_data: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  children: z
                    .array(
                      z.object({
                        object_id: z.string().describe('Custom field ID').optional(),
                        value: z.string().describe('Custom field value').optional(),
                      }),
                    )
                    .describe('List of subfields')
                    .optional(),
                }),
              )
              .describe('Custom fields')
              .optional(),
          }),
        )
        .describe('Social accounts')
        .optional(),
      preferred_city_code_list: z.array(z.string()).describe('Preferred city').optional(),
      self_evaluation: z
        .object({
          id: z.string().describe('ID').optional(),
          content: z.string().describe('Content').optional(),
          customized_data: z
            .array(
              z.object({
                object_id: z.string().describe('Custom field ID').optional(),
                children: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z.string().describe('Custom field value').optional(),
                    }),
                  )
                  .describe('List of subfields')
                  .optional(),
              }),
            )
            .describe('Custom fields')
            .optional(),
        })
        .describe('Self-evaluation')
        .optional(),
      customized_data: z
        .array(
          z.object({
            object_id: z.string().describe('Custom field ID').optional(),
            children: z
              .array(
                z.object({
                  object_id: z.string().describe('Custom field ID').optional(),
                  value: z.string().describe('Custom field value').optional(),
                }),
              )
              .describe('List of subfields')
              .optional(),
          }),
        )
        .describe('Custom module')
        .optional(),
    }),
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1TalentExternalInfoCreate = {
  project: 'hire',
  name: 'hire.v1.talentExternalInfo.create',
  sdkName: 'hire.v1.talentExternalInfo.create',
  path: '/open-apis/hire/v1/talents/:talent_id/external_info',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External talent-Create talent external info-Create talent external information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ external_create_time: z.string().describe('Talent creation time in external systems') }),
    path: z.object({ talent_id: z.string().describe('Talent ID') }),
  },
};
export const hireV1TalentExternalInfoUpdate = {
  project: 'hire',
  name: 'hire.v1.talentExternalInfo.update',
  sdkName: 'hire.v1.talentExternalInfo.update',
  path: '/open-apis/hire/v1/talents/:talent_id/external_info',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Hire-Get candidates-External system information-External talent-Update external talent info-Update external talent information',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ external_create_time: z.string().describe('Talent creation time in external systems') }),
    path: z.object({ talent_id: z.string().describe('Talent ID') }),
  },
};
export const hireV1TalentGet = {
  project: 'hire',
  name: 'hire.v1.talent.get',
  sdkName: 'hire.v1.talent.get',
  path: '/open-apis/hire/v1/talents/:talent_id',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Candidate management-Talent-Get talent V1-Get talent by ID',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({
      talent_id: z.string().describe('Talent ID , which can be queried through the [Get talent list] interface'),
    }),
  },
};
export const hireV1TalentList = {
  project: 'hire',
  name: 'hire.v1.talent.list',
  sdkName: 'hire.v1.talent.list',
  path: '/open-apis/hire/v1/talents',
  httpMethod: 'GET',
  description: '[Feishu/Lark]-Hire-Candidate management-Talent-Get talent list-Get talent list',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        keyword: z
          .string()
          .describe('Search keywords, support Boolean language (use and, or, not to connect keywords)')
          .optional(),
        update_start_time: z.string().describe('Earliest update time, millisecond timestamp').optional(),
        update_end_time: z.string().describe('Latest update time, millisecond timestamp').optional(),
        page_size: z.number().describe('Page size').optional(),
        sort_by: z
          .number()
          .describe(
            'collation Options:1(Descending by update date),2(in descending order of relevance),3(Descending order by delivery time),4(Descending by warehousing time)',
          )
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
        query_option: z
          .literal('ignore_empty_error')
          .describe('request control parameter Options:ignore_empty_error(Ignore error when result is empty)')
          .optional(),
      })
      .optional(),
  },
};
export const hireV1TalentOnboardStatus = {
  project: 'hire',
  name: 'hire.v1.talent.onboardStatus',
  sdkName: 'hire.v1.talent.onboardStatus',
  path: '/open-apis/hire/v1/talents/:talent_id/onboard_status',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Talent-Update Talent Onboard Status-Update the active status of talents. This API is applicable only to candidates who were not hired through applications in Feishu Hire. Candidates marked as "Onboarded" through this API can only be marked as "Offboarded" through the same API',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      operation: z
        .number()
        .describe('Operation Type 1: Onboarding 2: Resignation Options:1(onboard Onboarding),2(overboard Resign)'),
      onboard_time: z
        .string()
        .describe('Millisecond timestamp, required when the operation type is Onboarding')
        .optional(),
      overboard_time: z
        .string()
        .describe('Millisecond timestamp, required when the operation type is Resignation')
        .optional(),
    }),
    path: z
      .object({
        talent_id: z
          .string()
          .describe('Talent ID , which can be queried through the [Get talent list] interface')
          .optional(),
      })
      .optional(),
  },
};
export const hireV1TalentRemoveToFolder = {
  project: 'hire',
  name: 'hire.v1.talent.removeToFolder',
  sdkName: 'hire.v1.talent.removeToFolder',
  path: '/open-apis/hire/v1/talents/remove_to_folder',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Talent-Remove talent from specified folder-Removes talent from the specified folder based on the talent ID list',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      talent_id_list: z
        .array(z.string())
        .describe('Talent ID list, which can be obtained through the [Get Talent List] interface'),
      folder_id: z.string().describe('Folder ID, which can be obtained through the [Get Talent Folder List] interface'),
    }),
  },
};
export const hireV1TalentTag = {
  project: 'hire',
  name: 'hire.v1.talent.tag',
  sdkName: 'hire.v1.talent.tag',
  path: '/open-apis/hire/v1/talents/:talent_id/tag',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Talent-Operate Talent Tag-You can add and remove tags for talent',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      operation: z.number().describe('Operation type Options:1(add),2(remove)'),
      tag_id_list: z.array(z.string()).describe('Tag id list'),
    }),
    path: z.object({ talent_id: z.string().describe('Talent id') }),
  },
};
export const hireV1TerminationReasonList = {
  project: 'hire',
  name: 'hire.v1.terminationReason.list',
  sdkName: 'hire.v1.terminationReason.list',
  path: '/open-apis/hire/v1/termination_reasons',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Delivery management-Get the reason for terminating delivery-Gets the default application termination reason in the system and the user-configured custom application termination reason',
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
        page_size: z.number().describe('Number of records to get per page, default 10').optional(),
      })
      .optional(),
  },
};
export const hireV1TestSearch = {
  project: 'hire',
  name: 'hire.v1.test.search',
  sdkName: 'hire.v1.test.search',
  path: '/open-apis/hire/v1/tests/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-Exam-Get a list of written exams-Batch obtain the written examination information of talents in a delivery process, such as answer status, written examination score, etc. (currently, only 1W pieces of data can be obtained. If the amount of data is large, the full amount of data can be obtained in batches by controlling the test_start_time query criteria.)',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        application_id_list: z
          .array(z.string())
          .describe('Delivery ID list, up to 100, default query for all deliveries')
          .optional(),
        test_start_time_min: z.string().describe('Written test start time later than equal time').optional(),
        test_start_time_max: z.string().describe('Written test start time earlier than equal time').optional(),
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
        page_size: z.number().describe('Number of records fetched per page, up to 100').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1TodoList = {
  project: 'hire',
  name: 'hire.v1.todo.list',
  sdkName: 'hire.v1.todo.list',
  path: '/open-apis/hire/v1/todos',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Recruitment process follow-up-Batch get to-dos-Batch get to-dos',
  accessTokens: ['user'],
  schema: {
    params: z.object({
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.string().optional(),
      user_id: z
        .string()
        .describe(
          'User ID, when token is tenant token, this field must be passed in, when token is user token, this field is not passed',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id', 'people_admin_id']).describe('User ID type').optional(),
      type: z
        .enum(['evaluation', 'offer', 'exam', 'interview'])
        .describe(
          'To-do type Options:evaluation(Assessment to be done),offer(Offer to be done),exam(Written test to be done),interview(Interview to be done)',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const hireV1TripartiteAgreementCreate = {
  project: 'hire',
  name: 'hire.v1.tripartiteAgreement.create',
  sdkName: 'hire.v1.tripartiteAgreement.create',
  path: '/open-apis/hire/v1/tripartite_agreements',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-tripartite agreement-Create Tripartite Agreement-When the tenant enables the "Sync tripartite agreements via API" switch and configures "Tripartite agreement" at a specific stage in the campus hire process, a tripartite agreement and corresponding status can be created for campus hire with the offer location in Chinese mainland by using the application ID',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      application_id: z.string().describe('Delivery ID'),
      state: z
        .number()
        .describe(
          'Tripartite agreement status Options:1(NotStarted Not started),2(Applied Applied.),3(StudentProcessing Student processing),4(CompanyProcessing The company is processing it.),5(SchoolProcessing School processing),6(Terminated),7(Completed),8(TerminationProcessing Termination process in progress),9(Terminated)',
        ),
      create_time: z.string().describe('Tripartite protocol creation time, millisecond timestamp'),
    }),
  },
};
export const hireV1TripartiteAgreementDelete = {
  project: 'hire',
  name: 'hire.v1.tripartiteAgreement.delete',
  sdkName: 'hire.v1.tripartiteAgreement.delete',
  path: '/open-apis/hire/v1/tripartite_agreements/:tripartite_agreement_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-tripartite agreement-Delete Tripartite Agreement-Delete the three-party agreement in the delivery through the interface',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ tripartite_agreement_id: z.string().describe('Tripartite Agreement ID').optional() }).optional(),
  },
};
export const hireV1TripartiteAgreementList = {
  project: 'hire',
  name: 'hire.v1.tripartiteAgreement.list',
  sdkName: 'hire.v1.tripartiteAgreement.list',
  path: '/open-apis/hire/v1/tripartite_agreements',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-tripartite agreement-List Tripartite Agreement-Obtain the tripartite agreement information according to the tripartite agreement ID or the application IDSort by id by default',
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
        application_id: z
          .string()
          .describe('application ID, required application ID and one of the three-party agreement IDs')
          .optional(),
        tripartite_agreement_id: z
          .string()
          .describe('Tripartite agreement ID, required application id and one of the tripartite agreement IDs')
          .optional(),
      })
      .optional(),
  },
};
export const hireV1TripartiteAgreementUpdate = {
  project: 'hire',
  name: 'hire.v1.tripartiteAgreement.update',
  sdkName: 'hire.v1.tripartiteAgreement.update',
  path: '/open-apis/hire/v1/tripartite_agreements/:tripartite_agreement_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Hire-Candidate management-Delivery process-tripartite agreement-Update Tripartite Agreement-Update the three-party agreement in the delivery through the interface',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      state: z
        .number()
        .describe(
          'Tripartite agreement status Options:1(NotStarted Not started),2(Applied Applied.),3(StudentProcessing Student processing),4(CompanyProcessing The company is processing it.),5(SchoolProcessing School processing),6(Ended),7(Completed),8(TerminationProcessing Termination process in progress),9(Terminated)',
        ),
      modify_time: z
        .string()
        .describe(
          'The three-party agreement modification timestamp cannot be less than the creation time or the current modification time',
        ),
    }),
    path: z
      .object({
        tripartite_agreement_id: z
          .string()
          .describe('Three-party agreement ID, returned by the "Create Three-Party Agreement" interface')
          .optional(),
      })
      .optional(),
  },
};
export const hireV1UserRoleList = {
  project: 'hire',
  name: 'hire.v1.userRole.list',
  sdkName: 'hire.v1.userRole.list',
  path: '/open-apis/hire/v1/user_roles',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Recruitment related configuration-Permissions-Get user role list-Get a list of user role',
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
        page_size: z.number().describe('Number of records fetched per page, maximum 10').optional(),
        user_id: z.string().describe('User ID').optional(),
        role_id: z.string().describe('Role ID').optional(),
        update_start_time: z.string().describe('The earliest update time, millisecond timestamp').optional(),
        update_end_time: z.string().describe('Latest update time, millisecond timestamp').optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const hireV1WebsiteChannelCreate = {
  project: 'hire',
  name: 'hire.v1.websiteChannel.create',
  sdkName: 'hire.v1.websiteChannel.create',
  path: '/open-apis/hire/v1/websites/:website_id/channels',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Website-Create Promotion Channel of Official Recruitment Website-Create recruitment official website promotion channels according to the recruitment official website ID and promotion channel name',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ channel_name: z.string().describe('Promotion channel name') }),
    path: z.object({ website_id: z.string().describe('Official website ID').optional() }).optional(),
  },
};
export const hireV1WebsiteChannelDelete = {
  project: 'hire',
  name: 'hire.v1.websiteChannel.delete',
  sdkName: 'hire.v1.websiteChannel.delete',
  path: '/open-apis/hire/v1/websites/:website_id/channels/:channel_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Website-Delete Promotion Channel of Official Recruitment Website-Delete the recruitment official website promotion channel according to the recruitment official website ID and promotion channel ID',
  accessTokens: ['tenant'],
  schema: {
    path: z
      .object({
        website_id: z.string().describe('Official website ID').optional(),
        channel_id: z.string().describe('Promotion Channel ID').optional(),
      })
      .optional(),
  },
};
export const hireV1WebsiteChannelList = {
  project: 'hire',
  name: 'hire.v1.websiteChannel.list',
  sdkName: 'hire.v1.websiteChannel.list',
  path: '/open-apis/hire/v1/websites/:website_id/channels',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Website-Obtain Promotion Channel List of Official Recruitment Website-Get the list of promotion channels by pagination according to the ID of the recruitment official website',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        page_size: z.string().describe('Page size').optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ website_id: z.string().describe('Official website ID').optional() }).optional(),
  },
};
export const hireV1WebsiteChannelUpdate = {
  project: 'hire',
  name: 'hire.v1.websiteChannel.update',
  sdkName: 'hire.v1.websiteChannel.update',
  path: '/open-apis/hire/v1/websites/:website_id/channels/:channel_id',
  httpMethod: 'PUT',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Website-Update Promotion Channel of Official Recruitment Website-Change the name of the promotion channel according to the ID of the recruitment official website and the ID of the promotion channel',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ channel_name: z.string().describe('Promotion channel name') }),
    path: z
      .object({
        website_id: z.string().describe('Official website ID').optional(),
        channel_id: z.string().describe('Promotion Channel ID').optional(),
      })
      .optional(),
  },
};
export const hireV1WebsiteDeliveryTaskGet = {
  project: 'hire',
  name: 'hire.v1.websiteDeliveryTask.get',
  sdkName: 'hire.v1.websiteDeliveryTask.get',
  path: '/open-apis/hire/v1/websites/:website_id/delivery_tasks/:delivery_task_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Website-Obtain Resume Analysis and Create Application Result of Official Recruitment Website-Obtain the delivery task information of official recruitment website. If the obtained data is empty, continue to poll until the data is not empty, and then query the data in the data',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({
      website_id: z.string().describe('Official website ID'),
      delivery_task_id: z.string().describe('Delivery task ID'),
    }),
  },
};
export const hireV1WebsiteDeliveryCreateByAttachment = {
  project: 'hire',
  name: 'hire.v1.websiteDelivery.createByAttachment',
  sdkName: 'hire.v1.websiteDelivery.createByAttachment',
  path: '/open-apis/hire/v1/websites/:website_id/deliveries/create_by_attachment',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Website-Create Application to Official Recruitment Website by Resume Attachment Analysis-Create Application to Official Recruitment Website by Resume Attachment Analysis',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      job_post_id: z.string().describe('Job Advertisement ID'),
      user_id: z.string().describe('Official website user ID'),
      resume_file_id: z.string().describe('Resume file ID, generated using "Create Attachment"'),
      channel_id: z.string().describe('Official website promotion channel ID').optional(),
      application_preferred_city_code_list: z
        .array(z.string())
        .describe(
          'The list of intended delivery cities can be obtained from the list of work locations returned by "Get Job Information"',
        )
        .optional(),
      mobile_country_code: z
        .string()
        .describe(
          'Telephone international area code, which can be queried from "Get Address Code" (when the parameter value is inconsistent with the relevant value in the resume attachment, the parameter value will prevail)',
        )
        .optional(),
      mobile: z
        .string()
        .describe(
          'Phone number (when the parameter value is inconsistent with the relevant value in the resume attachment, the parameter value will prevail)',
        )
        .optional(),
      email: z
        .string()
        .describe(
          'Email (when the parameter value is inconsistent with the relevant value in the resume attachment, the parameter value will prevail)',
        )
        .optional(),
      identification: z
        .object({
          identification_type: z
            .number()
            .describe(
              'Type of ID Options:1(中国 - 居民身份证 China - Resident Identity Card),2(护照 Passport),3(中国 - 港澳居民居住证 China-Hong Kong and Macau Resident Residence Permit),4(中国 - 台湾居民来往大陆通行证 Mainland Travel Permit for China-Taiwan Residents),5(其他 Other),6(中国 - 港澳居民来往内地通行证 Mainland Travel Permit for China-Hong Kong and Macao Residents),9(中国 - 台湾居民居住证 China-Taiwan Resident Residence Permit)',
            )
            .optional(),
          identification_number: z.string().describe('ID number').optional(),
        })
        .describe(
          'ID number (when the parameter value is inconsistent with the relevant value in the resume attachment, the parameter value will prevail)',
        )
        .optional(),
    }),
    path: z.object({ website_id: z.string().describe('Official website ID') }),
  },
};
export const hireV1WebsiteDeliveryCreateByResume = {
  project: 'hire',
  name: 'hire.v1.websiteDelivery.createByResume',
  sdkName: 'hire.v1.websiteDelivery.createByResume',
  path: '/open-apis/hire/v1/websites/:website_id/deliveries/create_by_resume',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Website-Create Application to Official Recruitment Website-Create Application to Official Recruitment Website',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      job_post_id: z.string().describe('Job Advertising ID'),
      resume: z
        .object({
          internship_list: z
            .array(
              z.object({
                desc: z.string().describe('Description').optional(),
                end_time: z.number().describe('End time, if it is so far pass value -1').optional(),
                start_time: z.number().describe('Start time').optional(),
                title: z.string().describe('Job title').optional(),
                company: z.string().describe('Company').optional(),
                customized_data: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z
                        .string()
                        .describe('Customize the field value, see the interface description for the format')
                        .optional(),
                    }),
                  )
                  .describe('Custom Fields')
                  .optional(),
              }),
            )
            .describe('Internship experience')
            .optional(),
          basic_info: z
            .object({
              nationality_id: z.string().describe('Nationality, can be found from "Get Address Code"').optional(),
              start_work_time: z.number().describe('Starting time').optional(),
              current_home_address: z.string().describe('Home address').optional(),
              hometown_city_code: z.string().describe('Hometown, you can query from "Get Address Code"').optional(),
              mobile_country_code: z
                .string()
                .describe('Telephone international area code, can be found from "Get Address Code"')
                .optional(),
              identification: z
                .object({
                  identification_number: z.string().describe('Identification number').optional(),
                  identification_type: z
                    .number()
                    .describe(
                      'Type of identity document Options:1(中国 - 居民身份证 China-Resident Identity Card),2(护照 Passport),3(中国 - 港澳居民居住证 China-Hong Kong and Macao Residence Permit),4(中国 - 台湾居民来往大陆通行证 Mainland Travel Permit for Chinese-Taiwanese Residents),5(其他 Other),6(中国 - 港澳居民来往内地通行证 Mainland Travel Permit for China-Hong Kong and Macao Residents),9(中国 - 台湾居民居住证 China-Taiwan Residence Permit)',
                    )
                    .optional(),
                })
                .describe('Identity document')
                .optional(),
              marital_status: z
                .number()
                .describe('Marital status Options:1(已婚 Married),2(未婚 Unmarried)')
                .optional(),
              mobile: z.string().describe('Phone').optional(),
              current_city_code: z.string().describe('City, you can query from "Get Address Code"').optional(),
              experience_years: z.number().describe('Working years').optional(),
              gender: z.number().describe('Gender Options:1(Male),2(Female),3(Other)').optional(),
              birthday: z.number().describe('Date of birth').optional(),
              name: z.string().describe('Name'),
              preferred_city_code_list: z
                .array(z.string())
                .describe('Intention city, can be found from "Get address code"')
                .optional(),
              resume_source_id: z
                .string()
                .describe('Resume sources can be found in the "Get Resume Source List"')
                .optional(),
              age: z.number().describe('Age').optional(),
              customized_data: z
                .array(
                  z.object({
                    object_id: z.string().describe('Custom field ID').optional(),
                    value: z
                      .string()
                      .describe('Customize the field value, see the interface description for the format')
                      .optional(),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
              email: z.string().describe('Mailbox').optional(),
            })
            .describe('Basic information'),
          education_list: z
            .array(
              z.object({
                education_type: z
                  .number()
                  .describe(
                    'Education Type Options:1(NonMainland Non-Chinese mainland),2(FullTimeUnifiedEnrollment Full-time recruitment),3(PartTimeUnifiedEnrollment Part-time),4(SelfTaught Self-test),5(Others Other)',
                  )
                  .optional(),
                end_time: z
                  .number()
                  .describe(
                    'End time, if it is so far pass value -1.If "Today" is provided, the field can be viewed normally once the application has entered the system. However, it must be modified to a specific time in the edit mode',
                  )
                  .optional(),
                end_time_v2: z
                  .number()
                  .describe(
                    'End time - New"Today" is not provided. It is recommended to use this field to avoid the impact of ambiguous graduation date on candidate screening',
                  )
                  .optional(),
                field_of_study: z.string().describe('Professional').optional(),
                school: z.string().describe('School').optional(),
                start_time: z.number().describe('Start time').optional(),
                academic_ranking: z
                  .number()
                  .describe(
                    'Professional ranking Options:5(Top5Percent Top 5%),10(Top10Percent Top 10%),20(Top20Percent Top 20%),30(Top30Percent Top 30%),50(Top50Percent Top 50%),51(Others Other)',
                  )
                  .optional(),
                customized_data: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z
                        .string()
                        .describe('Customize the field value, see the interface description for the format')
                        .optional(),
                    }),
                  )
                  .describe('Custom Fields')
                  .optional(),
                degree: z
                  .number()
                  .describe(
                    "Degree Options:1(PrimaryEducation Primary school),2(JuniorMiddleSchoolEducation Junior high school),3(Secondary Full-time),4(SeniorSchoolGraduates High school),5(Associate College),6(Bachelor Undergraduate),7(Master Master's),8(Phd Doctor),9(Other)",
                  )
                  .optional(),
              }),
            )
            .describe('Educational experience')
            .optional(),
          self_evaluation: z
            .object({
              content: z.string().describe('Content').optional(),
              customized_data: z
                .array(
                  z.object({
                    object_id: z.string().describe('Custom field ID').optional(),
                    value: z
                      .string()
                      .describe('Customize the field value, see the interface description for the format')
                      .optional(),
                  }),
                )
                .describe('Custom Fields')
                .optional(),
            })
            .describe('Self-evaluation')
            .optional(),
          career_list: z
            .array(
              z.object({
                desc: z.string().describe('Description').optional(),
                end_time: z.number().describe('End time, if it is so far pass value -1').optional(),
                start_time: z.number().describe('Start time').optional(),
                title: z.string().describe('Job title').optional(),
                company: z.string().describe('Company').optional(),
                customized_data: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z
                        .string()
                        .describe('Customize the field value, see the interface description for the format')
                        .optional(),
                    }),
                  )
                  .describe('Custom Fields')
                  .optional(),
              }),
            )
            .describe('Work experience')
            .optional(),
          customized_data: z
            .array(
              z.object({
                object_id: z.string().describe('Custom field ID').optional(),
                children: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z
                        .string()
                        .describe('Customize the field value, see the interface description for the format')
                        .optional(),
                    }),
                  )
                  .describe('Fields under the module')
                  .optional(),
              }),
            )
            .describe('Custom Modules')
            .optional(),
          resume_attachment_id: z
            .string()
            .describe('Resume attachment ID, use "Create Attachment" to generate')
            .optional(),
          sns_list: z
            .array(
              z.object({
                sns_type: z
                  .number()
                  .describe(
                    'Social Account Type Options:1(LinkedIn),2(Maimai),3(Wechat),4(Weibo),5(Github),6(Zhihu),7(Facebook),8(Twitter),9(Whatsapp),10(PersonalWebsite Personal Website),11(QQ)',
                  )
                  .optional(),
                customized_data: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z
                        .string()
                        .describe('Customize the field value, see the interface description for the format')
                        .optional(),
                    }),
                  )
                  .describe('Custom Fields')
                  .optional(),
                link: z.string().describe('Link').optional(),
              }),
            )
            .describe('Social Account')
            .optional(),
          works_list: z
            .array(
              z.object({
                desc: z.string().describe('Work description').optional(),
                link: z.string().describe('Works Link').optional(),
                attachment: z
                  .object({ file_id: z.string().describe('File ID, generated using "Create Attachment"').optional() })
                  .describe('Attachment')
                  .optional(),
                customized_data: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z
                        .string()
                        .describe('Customize the field value, see the interface description for the format')
                        .optional(),
                    }),
                  )
                  .describe('Custom Fields')
                  .optional(),
              }),
            )
            .describe('Works')
            .optional(),
          award_list: z
            .array(
              z.object({
                customized_data: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z
                        .string()
                        .describe('Customize the field value, see the interface description for the format')
                        .optional(),
                    }),
                  )
                  .describe('Custom Fields')
                  .optional(),
                desc: z.string().describe('Description').optional(),
                title: z.string().describe('Award Name').optional(),
                award_time: z.number().describe('Award time').optional(),
              }),
            )
            .describe('Award record')
            .optional(),
          project_list: z
            .array(
              z.object({
                customized_data: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z
                        .string()
                        .describe('Customize the field value, see the interface description for the format')
                        .optional(),
                    }),
                  )
                  .describe('Custom Fields')
                  .optional(),
                desc: z.string().describe('Description').optional(),
                end_time: z.number().describe('End time, if it is so far pass value -1').optional(),
                link: z.string().describe('Project Link').optional(),
                name: z.string().describe('Project name').optional(),
                role: z.string().describe('Role').optional(),
                start_time: z.number().describe('Start time').optional(),
              }),
            )
            .describe('Project experience')
            .optional(),
          language_list: z
            .array(
              z.object({
                customized_data: z
                  .array(
                    z.object({
                      object_id: z.string().describe('Custom field ID').optional(),
                      value: z
                        .string()
                        .describe('Customize the field value, see the interface description for the format')
                        .optional(),
                    }),
                  )
                  .describe('Custom Fields')
                  .optional(),
                language: z
                  .number()
                  .describe(
                    'Language Options:1(English),2(French),3(Japanese),4(Korean),5(German),6(Russian),7(Spanish),8(Portuguese),9(Arabic),10(Hindi),11(Hindustani Hindustan language),12(Bengali),13(Hausa Hausa language),14(Punjabi Punjabi language),15(Persian),16(Swahili Swahili language),17(Telugu Telugu language),18(Turkish),19(Italian),20(Javanese),21(Tamil Tamil language),22(Marathi Marathi language),23(Vietnamese),24(Mandarin),25(Cantonese)',
                  )
                  .optional(),
                proficiency: z
                  .number()
                  .describe(
                    'Familiarity Options:1(Elementary Getting Started),2(LimitedWorking Daily conversation),3(ProfessionalWorking Business meeting),4(FullProfessional Barrier-free communication),5(NativeOrBilingual Mother tongue)',
                  )
                  .optional(),
              }),
            )
            .describe('Language ability')
            .optional(),
        })
        .describe('Talent Information'),
      user_id: z.string().describe('Official Website User ID'),
      application_preferred_city_code_list: z
        .array(z.string())
        .describe(
          'The list of intended delivery cities can be obtained from the list of workplaces returned by "Get Job Information"',
        )
        .optional(),
      channel_id: z.string().describe('Official website promotion channel ID').optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({ website_id: z.string().describe('Official website ID') }),
  },
};
export const hireV1WebsiteJobPostGet = {
  project: 'hire',
  name: 'hire.v1.websiteJobPost.get',
  sdkName: 'hire.v1.websiteJobPost.get',
  path: '/open-apis/hire/v1/websites/:website_id/job_posts/:job_post_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Website-Obtain Job Post Details of Official Recruitment Website-Obtain Job Post Details of Official Recruitment Website',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID Options:open_department_id(open_department_id),department_id(department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({
      website_id: z.string().describe('Official website ID'),
      job_post_id: z.string().describe('Job Advertising ID'),
    }),
  },
};
export const hireV1WebsiteJobPostList = {
  project: 'hire',
  name: 'hire.v1.websiteJobPost.list',
  sdkName: 'hire.v1.websiteJobPost.list',
  path: '/open-apis/hire/v1/websites/:website_id/job_posts',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Website-Obtain Job List of Official Recruitment Website-Get the job list under the recruitment official website. Custom data does not support list acquisition for the time being. Please get it from the "Get job advertisement details under the recruitment official website" interface',
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
        page_size: z
          .number()
          .describe('The number of records fetched per page, up to 10,f not passed, the default value is 10')
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The type of department ID used in this call Options:open_department_id(Identify departments by open_department_id),department_id(Identify departments by department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
        update_start_time: z.string().describe('Earliest update time, millisecond timestamp').optional(),
        update_end_time: z.string().describe('Latest update time, millisecond timestamp').optional(),
        create_start_time: z.string().describe('Earliest creation time, millisecond timestamp').optional(),
        create_end_time: z.string().describe('Latest creation time, millisecond timestamp').optional(),
      })
      .optional(),
    path: z.object({ website_id: z.string().describe('Official website ID').optional() }).optional(),
  },
};
export const hireV1WebsiteJobPostSearch = {
  project: 'hire',
  name: 'hire.v1.websiteJobPost.search',
  sdkName: 'hire.v1.websiteJobPost.search',
  path: '/open-apis/hire/v1/websites/:website_id/job_posts/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Website-Search for Job List of Official Recruitment Website-Search for Job List of Official Recruitment Website',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        job_type_id_list: z
          .array(z.string())
          .describe('Job Type List, For details, please refer to:[Get a list of job type]')
          .optional(),
        city_code_list: z.array(z.string()).describe('Job City List').optional(),
        job_function_id_list: z.array(z.string()).describe('Function classification list').optional(),
        subject_id_list: z.array(z.string()).describe('Job Project List').optional(),
        keyword: z.string().describe('Keyword').optional(),
        update_start_time: z.string().describe('Earliest update time, millisecond timestamp').optional(),
        update_end_time: z.string().describe('Latest update time, millisecond timestamp').optional(),
        create_start_time: z.string().describe('Earliest creation time, millisecond timestamp').optional(),
        create_end_time: z.string().describe('Latest creation time, millisecond timestamp').optional(),
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
        page_size: z
          .number()
          .describe('The number of records fetched per page, up to 10,if not passed, the default value is 10')
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        department_id_type: z
          .enum(['open_department_id', 'department_id'])
          .describe(
            'The Type of Department ID Options:open_department_id(open_department_id),department_id(department_id)',
          )
          .optional(),
        job_level_id_type: z
          .enum(['people_admin_job_level_id', 'job_level_id'])
          .describe(
            'The type of "Job Level ID" used in this request Options:people_admin_job_level_id(The Job Level ID applicable to "HCM Platform". The HCM Platform is gradually being offline. It is recommended not to continue using this ID type.),job_level_id(The Job Level ID applicable to "Feishu Management Backend" can be obtained through the [Query the list of job level] interface.)',
          )
          .optional(),
      })
      .optional(),
    path: z.object({ website_id: z.string().describe('Official ID').optional() }).optional(),
  },
};
export const hireV1WebsiteList = {
  project: 'hire',
  name: 'hire.v1.website.list',
  sdkName: 'hire.v1.website.list',
  path: '/open-apis/hire/v1/websites',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Website-Obtain List of Official Recruitment Websites-Obtain List of Official Recruitment Websites',
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
        page_size: z.number().describe('Number of records fetched per page, limit 10').optional(),
      })
      .optional(),
  },
};
export const hireV1WebsiteSiteUserCreate = {
  project: 'hire',
  name: 'hire.v1.websiteSiteUser.create',
  sdkName: 'hire.v1.websiteSiteUser.create',
  path: '/open-apis/hire/v1/websites/:website_id/site_users',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Hire-Get candidates-Website-Create User on Official Recruitment Website-Create User on Official Recruitment Website',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      name: z.string().describe('Name').optional(),
      email: z.string().describe('Mailbox').optional(),
      external_id: z.string().describe('External user ID'),
      mobile: z
        .string()
        .describe('Phone number, please provide it with the country code corresponding to the area code')
        .optional(),
      mobile_country_code: z
        .string()
        .describe('Country code, please provide it with the phone number, you can check from "Get Address Code"')
        .optional(),
    }),
    path: z.object({
      website_id: z
        .string()
        .describe('Official Website ID, which can be obtained from "Get Official Website Custom List"'),
    }),
  },
};
export const hireV1Tools = [
  hireV1AdvertisementPublish,
  hireV1AgencyBatchQuery,
  hireV1AgencyGet,
  hireV1AgencyGetAgencyAccount,
  hireV1AgencyOperateAgencyAccount,
  hireV1AgencyProtect,
  hireV1AgencyProtectSearch,
  hireV1AgencyQuery,
  hireV1ApplicationCancelOnboard,
  hireV1ApplicationCreate,
  hireV1ApplicationGet,
  hireV1ApplicationGetDetail,
  hireV1ApplicationInterviewList,
  hireV1ApplicationList,
  hireV1ApplicationOffer,
  hireV1ApplicationRecover,
  hireV1ApplicationTerminate,
  hireV1ApplicationTransferOnboard,
  hireV1ApplicationTransferStage,
  hireV1AttachmentGet,
  hireV1AttachmentPreview,
  hireV1BackgroundCheckOrderList,
  hireV1DiversityInclusionSearch,
  hireV1EcoAccountCustomFieldBatchDelete,
  hireV1EcoAccountCustomFieldBatchUpdate,
  hireV1EcoAccountCustomFieldCreate,
  hireV1EcoBackgroundCheckCustomFieldBatchDelete,
  hireV1EcoBackgroundCheckCustomFieldBatchUpdate,
  hireV1EcoBackgroundCheckCustomFieldCreate,
  hireV1EcoBackgroundCheckPackageBatchDelete,
  hireV1EcoBackgroundCheckPackageBatchUpdate,
  hireV1EcoBackgroundCheckPackageCreate,
  hireV1EcoBackgroundCheckCancel,
  hireV1EcoBackgroundCheckUpdateProgress,
  hireV1EcoBackgroundCheckUpdateResult,
  hireV1EcoExamPaperBatchDelete,
  hireV1EcoExamPaperBatchUpdate,
  hireV1EcoExamPaperCreate,
  hireV1EcoExamLoginInfo,
  hireV1EcoExamUpdateResult,
  hireV1EhrImportTaskPatch,
  hireV1EmployeeGet,
  hireV1EmployeeGetByApplication,
  hireV1EmployeePatch,
  hireV1EvaluationTaskList,
  hireV1EvaluationList,
  hireV1ExamMarkingTaskList,
  hireV1ExamCreate,
  hireV1ExternalApplicationCreate,
  hireV1ExternalApplicationDelete,
  hireV1ExternalApplicationList,
  hireV1ExternalApplicationUpdate,
  hireV1ExternalBackgroundCheckBatchQuery,
  hireV1ExternalBackgroundCheckCreate,
  hireV1ExternalBackgroundCheckDelete,
  hireV1ExternalBackgroundCheckUpdate,
  hireV1ExternalInterviewAssessmentCreate,
  hireV1ExternalInterviewAssessmentPatch,
  hireV1ExternalInterviewBatchQuery,
  hireV1ExternalInterviewCreate,
  hireV1ExternalInterviewDelete,
  hireV1ExternalInterviewUpdate,
  hireV1ExternalOfferBatchQuery,
  hireV1ExternalOfferCreate,
  hireV1ExternalOfferDelete,
  hireV1ExternalOfferUpdate,
  hireV1ExternalReferralRewardCreate,
  hireV1ExternalReferralRewardDelete,
  hireV1InterviewFeedbackFormList,
  hireV1InterviewRecordAttachmentGet,
  hireV1InterviewRecordGet,
  hireV1InterviewRecordList,
  hireV1InterviewRegistrationSchemaList,
  hireV1InterviewRoundTypeList,
  hireV1InterviewTaskList,
  hireV1InterviewGetByTalent,
  hireV1InterviewList,
  hireV1InterviewerList,
  hireV1InterviewerPatch,
  hireV1JobFunctionList,
  hireV1JobProcessList,
  hireV1JobPublishRecordSearch,
  hireV1JobRequirementSchemaList,
  hireV1JobRequirementCreate,
  hireV1JobRequirementDelete,
  hireV1JobRequirementList,
  hireV1JobRequirementListById,
  hireV1JobRequirementUpdate,
  hireV1JobSchemaList,
  hireV1JobTypeList,
  hireV1JobClose,
  hireV1JobCombinedCreate,
  hireV1JobCombinedUpdate,
  hireV1JobConfig,
  hireV1JobGet,
  hireV1JobGetDetail,
  hireV1JobList,
  hireV1JobManagerBatchUpdate,
  hireV1JobManagerGet,
  hireV1JobOpen,
  hireV1JobRecruiter,
  hireV1JobUpdateConfig,
  hireV1LocationList,
  hireV1LocationQuery,
  hireV1MinutesGet,
  hireV1NoteCreate,
  hireV1NoteDelete,
  hireV1NoteGet,
  hireV1NoteList,
  hireV1NotePatch,
  hireV1OfferApplicationFormGet,
  hireV1OfferApplicationFormList,
  hireV1OfferCustomFieldUpdate,
  hireV1OfferSchemaGet,
  hireV1OfferCreate,
  hireV1OfferGet,
  hireV1OfferInternOfferStatus,
  hireV1OfferList,
  hireV1OfferOfferStatus,
  hireV1OfferUpdate,
  hireV1QuestionnaireList,
  hireV1ReferralAccountCreate,
  hireV1ReferralAccountDeactivate,
  hireV1ReferralAccountEnable,
  hireV1ReferralAccountGetAccountAssets,
  hireV1ReferralAccountReconciliation,
  hireV1ReferralAccountWithdraw,
  hireV1ReferralWebsiteJobPostGet,
  hireV1ReferralWebsiteJobPostList,
  hireV1ReferralGetByApplication,
  hireV1ReferralSearch,
  hireV1RegistrationSchemaList,
  hireV1ResumeSourceList,
  hireV1RoleGet,
  hireV1RoleList,
  hireV1SubjectList,
  hireV1TalentBlocklistChangeTalentBlock,
  hireV1TalentFolderList,
  hireV1TalentObjectQuery,
  hireV1TalentOperationLogSearch,
  hireV1TalentPoolBatchChangeTalentPool,
  hireV1TalentPoolMoveTalent,
  hireV1TalentPoolSearch,
  hireV1TalentTagList,
  hireV1TalentAddToFolder,
  hireV1TalentBatchGetId,
  hireV1TalentCombinedCreate,
  hireV1TalentCombinedUpdate,
  hireV1TalentExternalInfoCreate,
  hireV1TalentExternalInfoUpdate,
  hireV1TalentGet,
  hireV1TalentList,
  hireV1TalentOnboardStatus,
  hireV1TalentRemoveToFolder,
  hireV1TalentTag,
  hireV1TerminationReasonList,
  hireV1TestSearch,
  hireV1TodoList,
  hireV1TripartiteAgreementCreate,
  hireV1TripartiteAgreementDelete,
  hireV1TripartiteAgreementList,
  hireV1TripartiteAgreementUpdate,
  hireV1UserRoleList,
  hireV1WebsiteChannelCreate,
  hireV1WebsiteChannelDelete,
  hireV1WebsiteChannelList,
  hireV1WebsiteChannelUpdate,
  hireV1WebsiteDeliveryTaskGet,
  hireV1WebsiteDeliveryCreateByAttachment,
  hireV1WebsiteDeliveryCreateByResume,
  hireV1WebsiteJobPostGet,
  hireV1WebsiteJobPostList,
  hireV1WebsiteJobPostSearch,
  hireV1WebsiteList,
  hireV1WebsiteSiteUserCreate,
];
