import { z } from 'zod';
export type approvalV4ToolName =
  | 'approval.v4.approval.create'
  | 'approval.v4.approval.get'
  | 'approval.v4.approval.subscribe'
  | 'approval.v4.approval.unsubscribe'
  | 'approval.v4.externalApproval.create'
  | 'approval.v4.externalApproval.get'
  | 'approval.v4.externalInstance.check'
  | 'approval.v4.externalInstance.create'
  | 'approval.v4.externalTask.list'
  | 'approval.v4.instance.addSign'
  | 'approval.v4.instance.cancel'
  | 'approval.v4.instance.cc'
  | 'approval.v4.instanceComment.create'
  | 'approval.v4.instanceComment.delete'
  | 'approval.v4.instanceComment.list'
  | 'approval.v4.instanceComment.remove'
  | 'approval.v4.instance.create'
  | 'approval.v4.instance.get'
  | 'approval.v4.instance.list'
  | 'approval.v4.instance.preview'
  | 'approval.v4.instance.query'
  | 'approval.v4.instance.searchCc'
  | 'approval.v4.instance.specifiedRollback'
  | 'approval.v4.task.approve'
  | 'approval.v4.task.query'
  | 'approval.v4.task.reject'
  | 'approval.v4.task.resubmit'
  | 'approval.v4.task.search'
  | 'approval.v4.task.transfer';
export const approvalV4ApprovalCreate = {
  project: 'approval',
  name: 'approval.v4.approval.create',
  sdkName: 'approval.v4.approval.create',
  path: '/open-apis/approval/v4/approvals',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval definition-Create an approval definition-This interface is used to create an approval definition, allowing flexible specification of the basic information, forms, and processes of the approval definition',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      approval_name: z
        .string()
        .describe(
          'Internationalized text key of the approval title. It starts with @i18n@ and has a minimum length of 9 characters',
        ),
      approval_code: z
        .string()
        .describe(
          'Approval Definition Code. Usage instructions:- When this parameter is not provided, it indicates a new approval definition will be created, and the final response will return an auto-generated Approval Definition Code from the system.- When this parameter is provided with a specified Approval Definition Code, it indicates that the interface is being called to update the contents of the specified approval definition, with the update method being a full update that overwrites the original definition content.Approval Definition Code. Retrieval methods:- After calling the [Create Approval Definition] interface, obtain the `approval_code` from the response parameters.- Log in to the approval management backend and retrieve it from the URL of the specified approval definition. For detailed instructions, see [What is Approval Code]',
        )
        .optional(),
      description: z
        .string()
        .describe(
          'Internationalized text key of the approval description. It starts with @i18n@ and has a minimum length of 9 characters',
        )
        .optional(),
      viewers: z
        .array(
          z.object({
            viewer_type: z
              .enum(['TENANT', 'DEPARTMENT', 'USER', 'NONE'])
              .describe(
                'Viewer type Options:TENANT(Users in a tenant),DEPARTMENT(Specified departments),USER(Specified users),NONE(No one)',
              )
              .optional(),
            viewer_user_id: z
              .string()
              .describe('When viewer_type is USER, fill in the user id according to user_id_type')
              .optional(),
            viewer_department_id: z
              .string()
              .describe('When viewer_type is DEPARTMENT, fill in the department id according to department_id_type')
              .optional(),
          }),
        )
        .describe(
          'The `viewers` field specifies who can initiate the approval from the frontend of the approval application. Usage instructions:- When `viewer_type` is `USER`, `viewer_user_id` needs to be provided.- When `viewer_type` is `DEPARTMENT`, `viewer_department_id` needs to be provided.- When `viewer_type` is `TENANT` or `NONE`, neither `viewer_user_id` nor `viewer_department_id` needs to be provided.**Note**: The maximum length of the list is 200',
        ),
      form: z
        .object({
          form_content: z
            .string()
            .describe(
              'Approval Definition Form. The form format is a JSON array. When actually passing the value, the JSON needs to be compressed and escaped into a String type. For descriptions of the JSON fields for each control within the form, refer to [Approval Definition Form Control Parameters].**Note**: The example values below are not escaped. You can refer to the example code in the **Request Example** section below',
            ),
        })
        .describe('Approval definition form'),
      node_list: z
        .array(
          z.object({
            id: z
              .string()
              .describe(
                'Node ID.- The ID of the start node is `START`- The ID of the end node is `END`The start and end nodes do not require `name`, `node_type`, or `approver` to be specified',
              ),
            name: z
              .string()
              .describe(
                'Internationalized text key of the node name. It starts with @i18n@ and has a minimum length of 9 characters',
              )
              .optional(),
            node_type: z
              .enum(['AND', 'OR', 'SEQUENTIAL'])
              .describe(
                "Current Node Approval Method.**Note**: When the value of this parameter is set to sequential approval (`SEQUENTIAL`), the type of approver (`approver.type`) must be set to initiator's choice (`Free`). Options:AND(Consensus Approval: Requires agreement from all approvers for the approval to be passed.),OR(Alternative Approval: Approval will be granted as long as one approver agrees.),SEQUENTIAL(Sequental Sequential Approval: Approval is carried out in the order of the approvers one by one.)",
              )
              .optional(),
            approver: z
              .array(
                z.object({
                  type: z
                    .enum([
                      'Supervisor',
                      'SupervisorTopDown',
                      'DepartmentManager',
                      'DepartmentManagerTopDown',
                      'Personal',
                      'Free',
                    ])
                    .describe(
                      'Types of Approvers. Instructions for Use:- When this parameter is set to Supervisor, SupervisorTopDown, DepartmentManager, or DepartmentManagerTopDown, the level parameter must be filled with the corresponding number of levels. For example, if there is a three-level approval from bottom to top, the parameter value should be Supervisor, and the level parameter value should be 3.- When this parameter is set to Personal, you need to fill in the corresponding user_id to specify the user.- When this parameter is set to Free, there is no need to specify user_id or level. Options:Supervisor(Manager (bottom up)),SupervisorTopDown(Manager (top down)),DepartmentManager(Department supervisor (bottom up)),DepartmentManagerTopDown(Department supervisor (top down)),Personal(Specified member),Free(Selected by the initiator)',
                    ),
                  user_id: z
                    .string()
                    .describe(
                      'User ID:- When the type is set to Personal, this parameter is used to specify the designated user.- The ID type must match the value of the query parameter user_id_type',
                    )
                    .optional(),
                  level: z
                    .string()
                    .describe(
                      'Approval level, when the type is Supervisor, SupervisorTopDown, DepartmentManager, DepartmentManagerTopDown, you need to fill in the corresponding level in the level, for example: review from the bottom to the top three levels, level = 3',
                    )
                    .optional(),
                }),
              )
              .describe('List of reviewers')
              .optional(),
            ccer: z
              .array(
                z.object({
                  type: z
                    .enum([
                      'Supervisor',
                      'SupervisorTopDown',
                      'DepartmentManager',
                      'DepartmentManagerTopDown',
                      'Personal',
                      'Free',
                    ])
                    .describe(
                      "Types of Copy Recipients. Instructions for Use:- When this parameter is set to Supervisor, SupervisorTopDown, DepartmentManager, or DepartmentManagerTopDown, the level parameter must be filled with the corresponding number of levels. For example, if there is a copy to three levels of supervisors from bottom to top, the parameter value should be Supervisor, and the level parameter value should be 3.- When this parameter is set to Personal, you need to fill in the corresponding user_id to specify the user.- When this parameter is set to Free, there is no need to specify user_id or level.- The copy recipient type does not support being set to initiator's choice (Free). Options:Supervisor(Manager (bottom up)),SupervisorTopDown(Manager (top down)),DepartmentManager(Department supervisor (bottom up)),DepartmentManagerTopDown(Department supervisor (top down)),Personal(Specified member),Free(Selected by the initiator (Copy recipient type does not support this option))",
                    ),
                  user_id: z
                    .string()
                    .describe(
                      'User ID:- When the type is set to Personal, this parameter is used to specify the designated user.- The ID type must match the value of the query parameter user_id_type',
                    )
                    .optional(),
                  level: z
                    .string()
                    .describe(
                      'Approval level, when the type is Supervisor, SupervisorTopDown, DepartmentManager, DepartmentManagerTopDown, you need to fill in the corresponding level in the level, for example: review from the bottom to the top three levels, level = 3',
                    )
                    .optional(),
                }),
              )
              .describe('Copy sender list')
              .optional(),
            privilege_field: z
              .object({
                writable: z
                  .array(z.string())
                  .describe(
                    'A list of form control item IDs with write permissions. The IDs need to be consistent with the control ID values passed in the form parameters',
                  ),
                readable: z
                  .array(z.string())
                  .describe(
                    'A list of form control item IDs with read permissions. The IDs need to be consistent with the control ID values passed in the form parameters',
                  ),
              })
              .describe('Control permissions for table items')
              .optional(),
            approver_chosen_multi: z
              .boolean()
              .describe('Whether to allow multiple selection of self-selected approvers')
              .optional(),
            approver_chosen_range: z
              .array(
                z.object({
                  type: z
                    .enum(['ALL', 'PERSONAL', 'ROLE'])
                    .describe(
                      'Approver Type Options:ALL(all people),PERSONAL(Designated Approver),ROLE(Designated Roles)',
                    )
                    .optional(),
                  id_list: z
                    .array(z.string())
                    .describe(
                      'ID list.- When type is set to ALL, no value needs to be provided.- When type is set to PERSONAL, provide the user ID, and the ID type must be consistent with the value of user_id_type.- When type is set to ROLE, provide the role ID. Obtaining method: After successfully [creating a role], you can obtain the role ID from the return result',
                    )
                    .optional(),
                }),
              )
              .describe('Select range of self-selected approvers')
              .optional(),
            starter_assignee: z
              .enum(['STARTER', 'AUTO_PASS', 'SUPERVISOR', 'DEPARTMENT_MANAGER'])
              .describe(
                'Operation when the approver is the submitter Options:STARTER(Requester Approval),AUTO_PASS(Auto-approve),SUPERVISOR(Manager Approval),DEPARTMENT_MANAGER(Department supervisor Approval)',
              )
              .optional(),
          }),
        )
        .describe(
          'Approval Definition Node List, used to set the various nodes required for the approval process. The start and end of the approval process are fixed as the start node and end node, respectively. Therefore, when passing values, the start node should be the first element of the list, and the end node should be the last element of the list.**Note**: The API method does not support setting conditional branches. If you need to set conditional branches, please go to [Approval Admin] to create the approval definition',
        ),
      settings: z
        .object({
          revert_interval: z
            .number()
            .describe(
              'The period of time (in seconds) during which an approval instance can be canceled after it is approved. It defaults to 31 days. 0 indicates not cancelable',
            )
            .optional(),
          revert_option: z
            .number()
            .describe('Whether an approval can be canceled after the first node. It defaults to 1. 0 indicates No')
            .optional(),
          reject_option: z
            .number()
            .describe(
              'Settings after approval is rejected. Options:0(RejectDefault Default setting, process terminated),1(RejectSubmit Return to submitter, the submitter can edit the process and resubmit)',
            )
            .optional(),
          quick_approval_option: z
            .number()
            .describe(
              'Quick approval configuration item, after enabling, approval can be done directly on the card.**Default value**: 1 Options:0(Close disable),1(Open enable)',
            )
            .optional(),
        })
        .describe('Other settings of the approval definition')
        .optional(),
      config: z
        .object({
          can_update_viewer: z.boolean().describe('Whether the visible scope can be modified. It defaults to false'),
          can_update_form: z.boolean().describe('Whether the form content can be modified. It defaults to false'),
          can_update_process: z.boolean().describe('Whether process nodes can be modified. It defaults to false'),
          can_update_revert: z
            .boolean()
            .describe('Whether the period of time for cancellation can be modified. It defaults to false'),
          help_url: z
            .string()
            .describe(
              'Used to configure the help page link, by clicking which users can be redirected to the help page from the Approval Admin',
            )
            .optional(),
        })
        .describe(
          'Approval definition configuration item, used to configure whether the corresponding approval definition can be modified by the user in the [Approval Admin]',
        )
        .optional(),
      icon: z
        .number()
        .describe(
          'Approval icon enumeration, default is 0. The icons from left to right and from top to bottom are numbered 0 to 24.',
        )
        .optional(),
      i18n_resources: z
        .array(
          z.object({
            locale: z
              .enum(['zh-CN', 'en-US', 'ja-JP'])
              .describe('Language Options:zh-CN(Zhcn Chinese),en-US(Enus English),ja-JP(Jajp Japanese)'),
            texts: z
              .array(
                z.object({
                  key: z
                    .string()
                    .describe(
                      "The copywriting key starts with `@i18n@`. This field is mainly used for internationalization, allowing users to provide copy in multiple languages simultaneously. The approval center will use the corresponding copy based on the user's current language environment. If the copy in the user's current language environment is not provided, the default language copy will be used",
                    ),
                  value: z.string().describe('Copywriting'),
                }),
              )
              .describe('Copywriting key and value'),
            is_default: z
              .boolean()
              .describe(
                'Whether to use the default language. If the default language is used, all keys should be contained; if a non-default language is used but its keys do not exist, the default language will be used instead',
              ),
          }),
        )
        .describe('Internationalized text'),
      process_manager_ids: z
        .array(z.string())
        .describe(
          'The list of user IDs for the approval process administrators.- The ID type is consistent with the query parameter `user_id_type`.- The maximum length of the list is 200',
        )
        .optional(),
    }),
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The type of Department ID used in this call. For a detailed description of Department ID, see [Department ID Introduction]. Options:department_id(DepartmentId Supports user-defined configuration of Department ID. When custom configuring, a deleted `department_id` can be reused, therefore the `department_id` is unique within the scope of non-deleted departments.),open_department_id(OpenDepartmentId The Department ID automatically generated by the system has a fixed prefix of `od-` and is globally unique within the tenant.)',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const approvalV4ApprovalGet = {
  project: 'approval',
  name: 'approval.v4.approval.get',
  sdkName: 'approval.v4.approval.get',
  path: '/open-apis/approval/v4/approvals/:approval_code',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Approval-Approval definition-View approval definitions-Retrieve information about a specific approval definition based on filters such as approval definition code, language, user ID, etc. The information includes approval definition name, status, form controls, and nodes. After obtaining the approval definition information, you can construct a request to [create an approval instance] based on the information',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        locale: z
          .enum(['zh-CN', 'en-US', 'ja-JP'])
          .describe(
            'Language options, defaulting to the default language defined in the approval configuration. Options:zh-CN(Zhcn Chinese),en-US(Enus English),ja-JP(Jajp Japanese)',
          )
          .optional(),
        with_admin_id: z
          .boolean()
          .describe(
            'Optional Whether to return a list of admin IDs with data permissions for the approval process**Default value**: false',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({
      approval_code: z
        .string()
        .describe(
          'Approval definition Code. Acquisition methods:- Call the [Create approval definition] API, and get the approval_code from the response parameters.- Log in to the approval management backend, and retrieve it from the URL of the specified approval definition. For specific operations, refer to [What is Approval Code]',
        ),
    }),
  },
};
export const approvalV4ApprovalSubscribe = {
  project: 'approval',
  name: 'approval.v4.approval.subscribe',
  sdkName: 'approval.v4.approval.subscribe',
  path: '/open-apis/approval/v4/approvals/:approval_code/subscribe',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval Events-Event interface-Subscribe to approval events-When the application [subscribes to approval events], it needs to call this interface to specify the approval definition Code (approval_code) to enable the subscription. Only after enabling it will the application be able to receive the events corresponding to that approval definition',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ approval_code: z.string().describe('Review Definition Unique Identifier') }),
  },
};
export const approvalV4ApprovalUnsubscribe = {
  project: 'approval',
  name: 'approval.v4.approval.unsubscribe',
  sdkName: 'approval.v4.approval.unsubscribe',
  path: '/open-apis/approval/v4/approvals/:approval_code/unsubscribe',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval Events-Event interface-Unsubscribe from approval events-After unsubscribing approval_code, you can no longer receive event notifications for the corresponding instance of the review definition',
  accessTokens: ['tenant'],
  schema: {
    path: z.object({ approval_code: z.string().describe('Review Definition Unique Identifier').optional() }).optional(),
  },
};
export const approvalV4ExternalApprovalCreate = {
  project: 'approval',
  name: 'approval.v4.externalApproval.create',
  sdkName: 'approval.v4.externalApproval.create',
  path: '/open-apis/approval/v4/external_approvals',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Third-party approval definition-Create a third-party approval definition-The third-party approval definition is used to set the basic information of the approval, such as the name and description. At the same time, it is also necessary to set the approval initiation page, data callback URL and other information of the third-party approval system, so as to associate Feishu approval with the third-party approval system, so that enterprise employees can directly initiate the third-party approval within Feishu approval, and the approval center can send the approval data back to the third-party approval system',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      approval_name: z
        .string()
        .describe(
          'The name of the third-party approval definition.- The internationalized text key (i.e. the key in the i18n_resources.texts parameter) is passed in here, and the value needs to be assigned in the i18n_resources.texts parameter in the Key:Value format.- This parameter needs to start with @i18n@ and be at least 9 characters long',
        ),
      approval_code: z
        .string()
        .describe(
          'This value is used to determine whether calling the current interface is to create or update an approval definition. Specific description:- If the value passed in can be matched to an existing approval definition approval_code, calling this interface will update the corresponding approval definition.- If the value passed in cannot be matched to any approval definition approval_code, a new approval definition will be created and the real approval_code of the new approval definition will be returned (not the value passed in through this parameter)',
        ),
      group_code: z
        .string()
        .describe(
          'The approval group to which the approval definition belongs is user-defined. Specific description:- If the group_code passed in does not currently exist, a new approval group will be created.- If the group_code already exists, the approval group name will be updated using group_name',
        ),
      group_name: z
        .string()
        .describe(
          'Approval group name. The approval definition group name on the approval initiation page comes from this field. Specific description:- The internationalized text key (i.e. the key in the i18n_resources.texts parameter) is passed in here, and it is also necessary to assign a value in the i18n_resources.texts parameter in the Key:Value format.- This parameter needs to start with @i18n@.- If group_code does not currently exist, group_name is required, which means that the group name is set when a new approval group is created.- If group_code exists, the group name will be updated. If it is not filled in, the group name will not be updated',
        )
        .optional(),
      description: z
        .string()
        .describe(
          'Description of the approval definition. When the company employee initiates the approval later, the description will be displayed on the approval initiation page.- The internationalized text key (i.e. the key in the i18n_resources.texts parameter) is passed in here, and the value needs to be assigned in the i18n_resources.texts parameter in the Key:Value format.- This parameter needs to start with @i18n@',
        )
        .optional(),
      external: z
        .object({
          biz_name: z
            .string()
            .describe(
              'The list is used to indicate which third-party system the approval comes from.**Note**:- The internationalized text key (i.e. the key in the i18n_resources.texts parameter) is passed in here, and the value needs to be assigned in the i18n_resources.texts parameter in the Key:Value format.- The parameter needs to start with @i18n@.- When assigning a value to this parameter in i18n_resources, there is no need to set the **from** prefix. The approval center will concatenate the **from** prefix by default',
            )
            .optional(),
          biz_type: z
            .string()
            .describe(
              'Approval definition business category, custom settings. Multiple approval definitions can be set to the same or different business types for classification',
            )
            .optional(),
          create_link_mobile: z
            .string()
            .describe(
              'The link for initiating a three-party approval on the mobile terminal.- If this link is set, when initiating an approval on the mobile terminal, it will jump to the three-party approval initiation page corresponding to this link.- If this link is not set, the approval will not be displayed on the mobile terminal',
            )
            .optional(),
          create_link_pc: z
            .string()
            .describe(
              'The link for initiating a three-party approval on the PC side.- If this link is set, when initiating an approval on the PC side, it will jump to the three-party approval initiation page corresponding to this link.- If this link is not set, the approval will not be displayed on the PC side',
            )
            .optional(),
          support_pc: z
            .boolean()
            .describe(
              'Approval defines whether to display the approval page on the PC side. If true, it will be displayed, otherwise it will not be displayed.**Note**: support_pc and support_mobile cannot both be false',
            )
            .optional(),
          support_mobile: z
            .boolean()
            .describe(
              'Approval defines whether to display the approval page on the mobile terminal. If true, it will be displayed, otherwise it will not be displayed.**Note**: support_pc and support_mobile cannot both be false',
            )
            .optional(),
          support_batch_read: z.boolean().describe('Whether marking as read in batches is supported').optional(),
          enable_mark_readed: z
            .boolean()
            .describe(
              'Supports labeling readable**Note**: This field is invalid and is not supported for the time being',
            )
            .optional(),
          enable_quick_operate: z
            .boolean()
            .describe(
              'Whether to support quick operation**Note**: This field is invalid and is not supported for the time being',
            )
            .optional(),
          action_callback_url: z
            .string()
            .describe(
              'The operation callback URL of the third-party system. After the task approver of the **pending approval** instance clicks to agree or reject the operation, the approval center calls this URL to notify the third-party system. For information about the callback address, see [Quick Approval Callback for Third-Party Approval]',
            )
            .optional(),
          action_callback_token: z
            .string()
            .describe(
              'The token brought during the callback is used by the business system to verify that the request comes from the approval center',
            )
            .optional(),
          action_callback_key: z
            .string()
            .describe(
              'Request parameter encryption key. If this parameter is configured, the request parameters will be encrypted and the request needs to be decrypted after receiving the request. For the encryption and decryption algorithm, refer to [Related External Option Description]',
            )
            .optional(),
          allow_batch_operate: z
            .boolean()
            .describe(
              'Whether batch approval is supported. When the value is true, the approver can process multiple tasks in batches when processing the approval tasks under this definition',
            )
            .optional(),
          exclude_efficiency_statistics: z
            .boolean()
            .describe('Whether approval process data is not included in efficiency statistics')
            .optional(),
        })
        .describe('Third-party approval related'),
      viewers: z
        .array(
          z.object({
            viewer_type: z
              .enum(['TENANT', 'DEPARTMENT', 'USER', 'NONE'])
              .describe(
                'Viewer type Options:TENANT(Users in a tenant),DEPARTMENT(Specified departments),USER(Specified users),NONE(No one)',
              )
              .optional(),
            viewer_user_id: z
              .string()
              .describe('When viewer_type is USER, fill in the user id according to user_id_type')
              .optional(),
            viewer_department_id: z
              .string()
              .describe('When viewer_type is DEPARTMENT, fill in the department id according to department_id_type')
              .optional(),
          }),
        )
        .describe(
          'The list of people who can see the approval. The maximum length of the list is 200. Only users in the list of people who can see the approval can see the approval on the approval initiation page. If this parameter is not passed, it means that no one can see it',
        )
        .optional(),
      i18n_resources: z
        .array(
          z.object({
            locale: z
              .enum(['zh-CN', 'en-US', 'ja-JP'])
              .describe('Language Options:zh-CN(Zhcn Chinese),en-US(Enus English),ja-JP(Jajp Japanese)'),
            texts: z
              .array(
                z.object({
                  key: z.string().describe('The text key needs to match the key of each parameter'),
                  value: z.string().describe('The copy Value is the parameter value corresponding to the copy Key'),
                }),
              )
              .describe(
                "Key:Value of the text. The key needs to start with @i18n@ and the value must be passed in according to the requirements of each parameter.**Description**: This field is mainly used for internationalization adaptation. It allows texts in multiple languages ​​to be set at the same time. The approval center will use the matching text based on the actual user's current voice environment. If the user's current voice environment text is not set, the default language text will be used",
              ),
            is_default: z
              .boolean()
              .describe(
                'Whether to use the default language. If the default language is used, all keys should be contained; if a non-default language is used but its keys do not exist, the default language will be used instead',
              ),
          }),
        )
        .describe('Internationalized text')
        .optional(),
      managers: z
        .array(z.string())
        .describe('Fill in the process managers id according to the user_id_type(Maximum supported length 200)')
        .optional(),
    }),
    params: z
      .object({
        department_id_type: z
          .enum(['department_id', 'open_department_id'])
          .describe(
            'The department ID type in this call. For a detailed description of department IDs, see [Department ID Description]. Options:department_id(DepartmentId Supports user-defined department ID. When customizing the configuration, the deleted department_id can be reused, so the department_id is unique within the scope of the non-deleted department.),open_department_id(OpenDepartmentId The department ID is automatically generated by the system. The ID prefix is ​​fixed to `od-` and is globally unique within the tenant.)',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const approvalV4ExternalApprovalGet = {
  project: 'approval',
  name: 'approval.v4.externalApproval.get',
  sdkName: 'approval.v4.externalApproval.get',
  path: '/open-apis/approval/v4/external_approvals/:approval_code',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Approval-Third-party approval definition-View third-party approval definition-Call this interface to obtain detailed information of the approval definition using the third-party approval definition code. This includes the name of the third-party approval definition, description, third-party approval initiation link, callback URL, and the list of visible personnel for the approval definition',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
    path: z.object({
      approval_code: z
        .string()
        .describe(
          'Third-party approval definition code can be obtained by:- Calling [Create Third-Party Approval Definition], which will return the approval definition code.- Logging into the approval management backend and obtaining it from the URL of the specified approval definition. For detailed instructions, see [What is Approval Code]',
        ),
    }),
  },
};
export const approvalV4ExternalInstanceCheck = {
  project: 'approval',
  name: 'approval.v4.externalInstance.check',
  sdkName: 'approval.v4.externalInstance.check',
  path: '/open-apis/approval/v4/external_instances/check',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Third-party approval instances-Verify instances-Call this interface to verify third-party approval instance data, used to determine whether server-side data is up to date. Submit the latest update time of the instance when making the request. If the server does not have the instance or the instance update time on the server is not the latest, the corresponding instance ID will be returned.For example, set a timed task every 5 minutes to compare the instances generated in the past 5 minutes using this interface. If the data does not exist on the server or is not the latest, you can go to [synchronize third-party approval instance] based on the instance ID and task ID returned by this interface',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      instances: z
        .array(
          z.object({
            instance_id: z
              .string()
              .describe(
                'Approval instance ID. Custom configuration needs to ensure uniqueness within the current enterprise and application.**Note**: When calling this interface and the [synchronize third-party approval instance] interface for the same third-party approval instance, it is necessary to ensure that the instance ID used is consistent',
              ),
            update_time: z.string().describe('Latest update time of the approval instance, Unix millisecond timestamp'),
            tasks: z
              .array(
                z.object({
                  task_id: z
                    .string()
                    .describe(
                      'Approval task ID within the approval instance. Custom configuration needs to ensure uniqueness within the current enterprise and application.**Note**: When calling this interface and the [synchronize third-party approval instance] interface for tasks within the same third-party approval instance, it is necessary to ensure that the task ID used is consistent',
                    ),
                  update_time: z.string().describe('Latest update time of the task, Unix millisecond timestamp'),
                }),
              )
              .describe('Task information'),
          }),
        )
        .describe('Instance information'),
    }),
  },
};
export const approvalV4ExternalInstanceCreate = {
  project: 'approval',
  name: 'approval.v4.externalInstance.create',
  sdkName: 'approval.v4.externalInstance.create',
  path: '/open-apis/approval/v4/external_instances',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Third-party approval instances-Sync instances-The Approval Center does not handle the circulation of approvals; the circulation of approvals occurs within the third-party system. This interface is used to synchronize the approval instances, approval tasks, and approval forwarding data generated in the third-party system after the approval circulation to the Approval Center',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      approval_code: z
        .string()
        .describe(
          'Approval Definition Code. The return value from [creating a third-party approval definition] is used to specify the approval definition to which the current instance belongs.**Note**: If the `title` parameter is set in the current interface, the approval instance name is displayed according to the `title`. If `title` is not set, the title of the approval instance is taken from the `name` parameter of the corresponding approval definition (`approval_code`)',
        ),
      status: z
        .enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELED', 'DELETED', 'HIDDEN', 'TERMINATED'])
        .describe(
          'Approval instance status Options:PENDING(Approving),APPROVED(The approval process has ended, and the result is approval.),REJECTED(The approval process has ended, and the result is rejection.),CANCELED(Approval sponsor withdraws),DELETED(Approval deleted),HIDDEN(Status hide (do not show status)),TERMINATED(Approval terminated)',
        ),
      extra: z
        .string()
        .describe(
          'Approval instance extension parameter, JSON format, needs to be compressed and escaped into a string when passing the value. The document number is realized by passing the business_key parameter.**Note**: The following example values ​​are not escaped, please pay attention to escape when using. You can view the escaped extra example value in the request body example',
        )
        .optional(),
      instance_id: z
        .string()
        .describe(
          'The approval instance is uniquely identified, user-defined, and it is necessary to ensure that the certificate tenant and the application are unique',
        ),
      links: z
        .object({
          pc_link: z
            .string()
            .describe(
              'The PC-side third-party approval instance jump link.**Description**:- When users use the Feishu PC side to view instance details, they will jump through this link.- At least one of pc_link and mobile_link must be filled in',
            ),
          mobile_link: z
            .string()
            .describe(
              'The mobile version of the third-party approval instance jump link.**Description**:- When users use the Feishu mobile version to view instance details, they will be redirected through this link.- At least one of pc_link and mobile_link must be filled in',
            )
            .optional(),
        })
        .describe(
          'Approval instance link information. The set link is used to click in the **Initiated** list of the approval center to jump back to the third-party approval system to view the approval details',
        ),
      title: z
        .string()
        .describe(
          'Approval display name.**Description**:- If this parameter is filled in, the approval name in the approval list uses this parameter. If this parameter is not filled in, the approval name uses the name defined by the approval.- The internationalized text Key (i.e. the Key in the i18n_resources.texts parameter) is passed in here, and the value needs to be assigned in the i18n_resources.texts parameter in the Key:Value format.- The Key needs to start with @i18n@',
        )
        .optional(),
      form: z
        .array(
          z.object({
            name: z
              .string()
              .describe(
                'The form field name.**Note**:- The internationalized text key (i.e. the key in the i18n_resources.texts parameter) is passed in here, and the value needs to be assigned in the i18n_resources.texts parameter in the Key:Value format.- The key needs to start with @i18n@',
              )
              .optional(),
            value: z
              .string()
              .describe(
                'Form Value.**Note**:- The value passed here is the key for internationalization texts (i.e., the Key from the `i18n_resources.texts` parameter), which also needs to be assigned in the `i18n_resources.texts` parameter in a Key:Value format.- The Key should start with `@i18n@`',
              )
              .optional(),
          }),
        )
        .describe(
          'The form data filled in by the user when submitting for approval is used for display in all approval lists. Multiple values can be submitted, but only the first 3 will be displayed in the approval center, and the total length should not exceed 2048 characters',
        )
        .optional(),
      user_id: z
        .string()
        .describe(
          'Approval Initiator user_id. The initiator can see all initiated approvals in the "Initiated" list in the Approval Center. In the "Pending", "Completed", and "CC" lists, this field is used to display the initiator of the approval. For the method to obtain the user ID, see [How to Obtain User ID].**Note**: At least one of the initiator\'s `open_id` or `user_id` must be provided',
        )
        .optional(),
      user_name: z
        .string()
        .describe(
          'Username of the approval initiator. If the initiator is not a real user (e.g., a department), and does not have a `user_id`, this parameter can be used to pass in a name.**Note**:- The value passed here is the key for internationalization texts (i.e., the Key from the `i18n_resources.texts` parameter), which also needs to be assigned in the `i18n_resources.texts` parameter in a Key:Value format.- The Key should start with `@i18n@`',
        )
        .optional(),
      open_id: z
        .string()
        .describe(
          'Approval Initiator open_id. The initiator can see all initiated approvals in the "Initiated" list in the Approval Center. In the "Pending", "Completed", and "CC" lists, this field is used to display the initiator of the approval. For the method to obtain the open ID, see [How to Obtain Open ID].**Note**: At least one of the initiator\'s `open_id` or `user_id` must be provided',
        )
        .optional(),
      department_id: z
        .string()
        .describe(
          'Department ID of the initiator, which is used to display the department of the initiator in the Approval Center list. If the value is not provided, it will not be displayed. For the method to obtain the department ID, see [Department ID].**Note**: If the user has not joined any department, pass an empty string `""`, and it will default to displaying the company name. If the `department_name` parameter is provided, the corresponding department name will be displayed',
        )
        .optional(),
      department_name: z
        .string()
        .describe(
          'Department name of the approval initiator. If the initiator is not a real user or does not belong to a department, this parameter can be used to pass in the department name.**Note**:- The value passed here is the key for internationalization texts (i.e., the Key from the `i18n_resources.texts` parameter), which also needs to be assigned in the `i18n_resources.texts` parameter in a Key:Value format.- The Key should start with `@i18n@`',
        )
        .optional(),
      start_time: z.string().describe('Approval initiation time, Unix millisecond timestamp'),
      end_time: z
        .string()
        .describe('Approval instance end time: 0 for unfinished approvals, Unix millisecond timestamp'),
      update_time: z
        .string()
        .describe(
          'The latest update time of the approval instance, unix millisecond timestamp, used for data version control in push operations. If the `update_mode` value is set to `UPDATE`, the approval instance information in the Approval Center will only be updated when the provided `update_time` has changed (i.e., is greater than the previous value).**Note**: This parameter is mainly used to prevent old data from updating new data during concurrent operations',
        ),
      display_method: z
        .enum(['BROWSER', 'SIDEBAR', 'NORMAL', 'TRUSTEESHIP'])
        .describe(
          'How to open an approval instance on the list page Options:BROWSER(Jump to the default browser of the system to open),SIDEBAR(Feishu middle side drawer open),NORMAL(Feishu inline page opens),TRUSTEESHIP(Open with hosting (i.e., hosting in the Feishu Approval Center))',
        )
        .optional(),
      update_mode: z
        .enum(['REPLACE', 'UPDATE'])
        .describe(
          'Update mode.- When `update_mode` is set to `REPLACE`, the current pushed data will always be used as the final data, and any extra tasks or copied data in the Approval Center that are not included in this push will be deleted.- When `update_mode` is set to `UPDATE`, the data in the Approval Center will not be deleted, but only new instances and task data will be added or updated.**Default value**: `REPLACE` Options:REPLACE(Full replacement, default),UPDATE(incremental update)',
        )
        .optional(),
      task_list: z
        .array(
          z.object({
            task_id: z
              .string()
              .describe(
                'Unique identifier within the approval instance to locate data when updating the approval task',
              ),
            user_id: z
              .string()
              .describe(
                "Approver's user_id, the method to obtain it can be found in [How to Obtain User ID].**Notes**:- This task will appear in the **Pending** or **Completed** list in the approver's Feishu Approval Center.- At least one of `user_id` or `open_id` must be provided",
              )
              .optional(),
            open_id: z
              .string()
              .describe(
                "Approver's open_id, the method to obtain it can be found in [How to Obtain Open ID].**Notes**:- This task will appear in the **Pending** or **Completed** list in the approver's Feishu Approval Center.- At least one of `user_id` or `open_id` must be provided",
              )
              .optional(),
            title: z
              .string()
              .describe(
                'Approval task name.**Notes**:- The value passed here is an internationalization document key (i.e., the key in `i18n_resources.texts` parameter), and the key needs to be assigned in `i18n_resources.texts` parameter in Key:Value format.- The key must start with `@i18n@`',
              )
              .optional(),
            links: z
              .object({
                pc_link: z
                  .string()
                  .describe(
                    'PC-side redirection link.**Notes**:- When the user views task details on the Feishu PC side, this link will be used for redirection.- At least one of `pc_link` or `mobile_link` must be provided',
                  ),
                mobile_link: z
                  .string()
                  .describe(
                    'Mobile-side redirection link.**Notes**:- When the user views task details on the Feishu mobile side, this link will be used for redirection.- At least one of `pc_link` or `mobile_link` must be provided',
                  )
                  .optional(),
              })
              .describe(
                "A third-party approval redirection link used in the Approval Center's **To-do** and **Done** sections, which allows users to return to the third-party approval system to view task details",
              ),
            status: z
              .enum(['PENDING', 'APPROVED', 'REJECTED', 'TRANSFERRED', 'DONE'])
              .describe(
                'Task status Options:PENDING(Pending approval),APPROVED(Task agreed),REJECTED(Reject Task denied),TRANSFERRED(Transefrred Task transfer),DONE(The task passed but the approver did not operate it; the approver cannot see the task. If you want to see it, you can copy the person.)',
              ),
            extra: z
              .string()
              .describe(
                'Extend json, the reason for the end of the task needs to be passed complete_reason field. The enumeration value and the corresponding description:- approved: agreed- rejected: rejected- node_auto_reject: Automatic rejection (due to logical judgment)- specific_rollback: return (including return to the sponsor, return to any intermediate approver)- add: and sign (add a new approver, approve with me)- add_pre: Pre-approver (add new approver, approve before me)- add_post: post-approver (add new approver, approve after me)- delete_assignee: Reductions- forward: manual transfer- forward_resign: automatic transfer upon resignation- recall: revocation (withdrawal of documents, invalidation of documents)- delete: delete the approval slip- admin_forward: the administrator operates the forwarding in the background- system_forward: the system automatically transfers- auto_skip: Auto Pass- manual_skip: manually skip- submit_again: resubmit tasks- restart: restart the process- others: others (as a backstop)',
              )
              .optional(),
            create_time: z.string().describe('Task creation time, Unix millisecond timestamp'),
            end_time: z
              .string()
              .describe('Task completion time: 0 for unfinished approvals, Unix millisecond timestamp'),
            update_time: z
              .string()
              .describe(
                'The last update time of the task, unix millisecond timestamp, which is used to push data versioning; update the policy update_time in the same instance',
              )
              .optional(),
            action_context: z
              .string()
              .describe(
                'Operation context, when the user operates, this parameter is included in the callback request to pass the context data of the task',
              )
              .optional(),
            action_configs: z
              .array(
                z.object({
                  action_type: z
                    .string()
                    .describe(
                      'Operation type, each task can be configured with 2 operations, which will be displayed in the approval list. When the user operates, the callback request will bring this field, indicating whether the user has agreed to the operation or refused the operation** Optional values are **:< Md-enum >< md-enum-item key = "APPROVE" > Agree </md-enum-item >< md-enum-item key = "REJECT" > Deny </md-enum-item >< Md-enum-item key = "{KEY}" > Any string, if any string is used, you need to provide action_name </md-enum-item ></Md-enum >',
                    ),
                  action_name: z
                    .string()
                    .describe(
                      'Action name. If `action_type` is not equal to `APPROVAL` or `REJECT`, this field must be provided to display the specific action name.**Notes**:- The value passed here is an internationalization text Key (i.e., the Key in the `i18n_resources.texts` parameter), which needs to be assigned in the `i18n_resources.texts` parameter in a Key:Value format.- The Key must start with `@i18n@`',
                    )
                    .optional(),
                  is_need_reason: z
                    .boolean()
                    .describe(
                      'Whether approval comments are required. When the value is `true`, after the approver operates on the task in the Approval Center, they will need to provide approval comments',
                    )
                    .optional(),
                  is_reason_required: z.boolean().describe('Approval comment is required').optional(),
                  is_need_attachment: z
                    .boolean()
                    .describe('Opinion whether to support uploading attachments')
                    .optional(),
                }),
              )
              .describe(
                'Quick action configuration at the task level.**Note**: Shortcut keys are currently only supported on the Feishu mobile side',
              )
              .optional(),
            display_method: z
              .enum(['BROWSER', 'SIDEBAR', 'NORMAL', 'TRUSTEESHIP'])
              .describe(
                'How to open approval tasks on the list page Options:BROWSER(Jump to the default browser of the system to open),SIDEBAR(Sidbar Feishu middle side drawer open),NORMAL(Feishu inline page opens),TRUSTEESHIP(Open in hosted mode)',
              )
              .optional(),
            exclude_statistics: z
              .boolean()
              .describe(
                'Tripartite mission support is not included in efficiency statistics.- false: Include efficiency statistics.- true: efficiency statistics are not included',
              )
              .optional(),
            node_id: z
              .string()
              .describe(
                'Approval node ID. It must meet the following conditions:- Within an approval process, each node ID must be unique. For example, in a process, the node IDs for direct superior, senior superior, etc., must be different.- Within the same third-party approval definition, the node ID should remain consistent across different approval instances for the same nodes. For example, if User A and User B both initiate leave requests, the node ID for the direct superior node should be consistent in both approval instances',
              )
              .optional(),
            node_name: z
              .string()
              .describe(
                'Node name.**Notes**:- The value passed here is an internationalization text Key (i.e., the Key in the `i18n_resources.texts` parameter), which needs to be assigned in the `i18n_resources.texts` parameter in a Key:Value format.- The Key must start with `@i18n@`',
              )
              .optional(),
            generate_type: z
              .enum(['EXTERNAL_CONSIGN', 'DEFAULT'])
              .describe(
                'task generation type, can be left blank, but do not fill in the blank string. Options:EXTERNAL_CONSIGN(ExternalConsign Give the agent a completed task),DEFAULT(Default task generated by system)',
              )
              .optional(),
          }),
        )
        .describe('Task list')
        .optional(),
      cc_list: z
        .array(
          z.object({
            cc_id: z.string().describe('Unique identity within the approval instance'),
            user_id: z
              .string()
              .describe(
                "CC recipient's `user_id`. For the method of obtaining, please refer to [How to get a user's User ID].**Note**: At least one of the CC recipient's `open_id` and `user_id` must be provided",
              )
              .optional(),
            open_id: z
              .string()
              .describe(
                "CC recipient's `open_id`. For the method of obtaining, please refer to [How to get a user's Open ID].**Note**: At least one of the CC recipient's `open_id` and `user_id` must be provided",
              )
              .optional(),
            links: z
              .object({
                pc_link: z
                  .string()
                  .describe(
                    'The jump link on the pc side, when the user uses the Feishu pc side, use this field to jump',
                  ),
                mobile_link: z
                  .string()
                  .describe(
                    'Third-party approval instance redirection link for mobile.**Note**:- When users view approval CC on Feishu mobile, this field is used for redirection.- At least one of `pc_link` and `mobile_link` must be provided',
                  )
                  .optional(),
              })
              .describe(
                "Approval CC redirection link. The configured link is used to redirect when clicking within the **CC'd** list in the approval center, taking you back to the third-party approval system to view approval CC details",
              ),
            read_status: z.enum(['READ', 'UNREAD']).describe('Read status Options:READ(read),UNREAD(unread)'),
            extra: z
              .string()
              .describe(
                'Extended fields. Use JSON format, and the values need to be compressed and escaped into a string when transmitting',
              )
              .optional(),
            title: z.string().describe('CC task name').optional(),
            create_time: z.string().describe('CC initiation time, Unix millisecond timestamp'),
            update_time: z
              .string()
              .describe(
                'CC latest update time, unix millisecond timestamp, used for pushing data versions. If the `update_mode` value is `UPDATE`, the approval instance information in the approval center will only be updated when the transmitted `update_time` changes (increases)',
              ),
            display_method: z
              .enum(['BROWSER', 'SIDEBAR', 'NORMAL', 'TRUSTEESHIP'])
              .describe(
                'How to open approval tasks on the list page Options:BROWSER(Jump to the default browser of the system to open),SIDEBAR(Feishu middle side drawer open),NORMAL(Feishu inline page opens),TRUSTEESHIP(Open in hosted mode)',
              )
              .optional(),
          }),
        )
        .describe('CC list')
        .optional(),
      i18n_resources: z
        .array(
          z.object({
            locale: z
              .enum([
                'zh-CN',
                'en-US',
                'ja-JP',
                'zh-HK',
                'zh-TW',
                'de-DE',
                'es-ES',
                'fr-FR',
                'id-ID',
                'it-IT',
                'ko-KR',
                'pt-BR',
                'th-TH',
                'vi-VN',
                'ms-MY',
                'ru-RU',
              ])
              .describe(
                'Language Options:zh-CN(Zhcn Chinese),en-US(Enus English),ja-JP(Jajp Japanese),zh-HK(Zhhk Traditional Chinese (Hong Kong, China)),zh-TW(Zhtw Traditional Chinese (Taiwan, China)),de-DE(Dede German),es-ES(Eses Spanish),fr-FR(Frfr French),id-ID(Idid Indonesian),it-IT(Itit Italian),ko-KR(Kokr Korean),pt-BR(Ptbr Portuguese),th-TH(Thth Thai),vi-VN(Vivn Vietnamese),ms-MY(Msmy Malay),ru-RU(Ruru Russian)',
              ),
            texts: z
              .array(
                z.object({ key: z.string().describe('Copywriting key'), value: z.string().describe('copywriting') }),
              )
              .describe(
                "Copy Key:Value. Keys need to start with `@i18n@` and pass Values according to the requirements of each parameter. This field is mainly used for internationalization, allowing users to input copies in multiple languages simultaneously. The approval center will use the corresponding copy according to the user's current language environment. If the copy for the user's current language environment is not provided, the default language copy will be used",
              ),
            is_default: z
              .boolean()
              .describe(
                'Whether the default language, the default language needs to include all keys, non-default language If the key does not exist, the default language will be used instead',
              ),
          }),
        )
        .describe('International copywriting'),
      trusteeship_url_token: z
        .string()
        .describe(
          'Document escrow authentication token, the escrow callback will be accompanied by this token to help the business party authenticate',
        )
        .optional(),
      trusteeship_user_id_type: z
        .string()
        .describe(
          'The type of user, which affects the selection of the user identity field of the request parameter, including the target user returned by the signature operation. Currently only "user_id" is supported',
        )
        .optional(),
      trusteeship_urls: z
        .object({
          form_detail_url: z.string().describe('Get the url address of the data related to the form schema').optional(),
          action_definition_url: z
            .string()
            .describe('Represents the url address for getting approval action area data')
            .optional(),
          approval_node_url: z.string().describe('Get the url address of the approval record related data').optional(),
          action_callback_url: z
            .string()
            .describe('The url address of the callback when the approval operation is performed')
            .optional(),
          pull_business_data_url: z
            .string()
            .describe(
              'Obtain the URL address of the hosted dynamic data. When using this interface, you must ensure that the interface address is synchronized in the data of the historical hosted document. If there is no such interface in the historical document, you need to re-synchronize the data of the historical hosted document to update the URL. This interface is used for the interactive use of the Feishu approval front-end and the line of business. Only the specific components of the approval front-end (the components provided by the Feishu approval front-end and the components that need to interface with the line of business) will be required',
            )
            .optional(),
        })
        .describe('The URL address of the interface of the document hosting callback access party')
        .optional(),
      trusteeship_cache_config: z
        .object({
          form_policy: z
            .enum(['DISABLE', 'IMMUTABLE', 'BY_NODE', 'BY_USER'])
            .describe(
              'Managed pre-cache policy Options:DISABLE(Not enabled, default),IMMUTABLE(Forms do not change with the process),BY_NODE(ByNode Update cache following process node changes),BY_USER(ByUser Store one copy for each to-do task)',
            )
            .optional(),
          form_vary_with_locale: z.boolean().describe('Whether the form changes with internationalization').optional(),
          form_version: z
            .string()
            .describe(
              'The version number of the currently used form, ensure that after the form is changed, the version number is increased, and the actual value is an int64 integer',
            )
            .optional(),
        })
        .describe('Managed pre-cache policy')
        .optional(),
      resource_region: z
        .string()
        .describe(
          'The area where the resource is located, the field for internal statistics does not need to be filled in',
        )
        .optional(),
    }),
  },
};
export const approvalV4ExternalTaskList = {
  project: 'approval',
  name: 'approval.v4.externalTask.list',
  sdkName: 'approval.v4.externalTask.list',
  path: '/open-apis/approval/v4/external_tasks',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Approval-Third-party approval tasks-Status of third-party approval tasks-This API is used to obtain the third-party approval status. After a user enters the query condition, the API returns the status of the approval instances that meet the condition.The API supports a combination of multiple parameters, including the following: 1. Obtain the task status of a specified instance by using instance_ids 2. Obtain the task status of a specified user by using user_ids 3. Obtain all the tasks of a specified status by using status 4. Obtain the next batch of data',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        approval_codes: z
          .array(z.string())
          .describe(
            'Approval definition codes, which are used to specify that only the data under these definitions will be obtained',
          )
          .optional(),
        instance_ids: z
          .array(z.string())
          .describe(
            'Approval instance IDs, which are used to specify that only the data under these instances will be obtained. Up to 20 IDs are supported',
          )
          .optional(),
        user_ids: z
          .array(z.string())
          .describe("Approver's user_ids, which are used to specify that only the data of these users will be obtained")
          .optional(),
        status: z
          .enum(['PENDING', 'APPROVED', 'REJECTED', 'TRANSFERRED', 'DONE'])
          .describe(
            'Approval task status, which is used to specify that data under this status will be obtained. For status values Options:PENDING(Approving),APPROVED(The approval process is over and the result is agreement),REJECTED(The approval process ends with a rejection),TRANSFERRED(Task transfer),DONE(The task passes but the approver does not operate the approver cannot see the task, if you want to see it, you can cc the person.)',
          )
          .optional(),
      })
      .optional(),
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
export const approvalV4InstanceAddSign = {
  project: 'approval',
  name: 'approval.v4.instance.addSign',
  sdkName: 'approval.v4.instance.addSign',
  path: '/open-apis/approval/v4/instances/add_sign',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Approval-Approval tasks-Add approvers',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z.string(),
      approval_code: z.string(),
      instance_code: z.string(),
      task_id: z.string(),
      comment: z.string().optional(),
      add_sign_user_ids: z.array(z.string()),
      add_sign_type: z
        .number()
        .describe('Options:1(add_sign_pre 前加签),2(add_sign_post 后加签),3(add_sign_parallel 并加签)'),
      approval_method: z
        .number()
        .describe('Options:1(or_sign 或签),2(add_sign 会签),3(sequential_sign 依次审批)')
        .optional(),
    }),
  },
};
export const approvalV4InstanceCancel = {
  project: 'approval',
  name: 'approval.v4.instance.cancel',
  sdkName: 'approval.v4.instance.cancel',
  path: '/open-apis/approval/v4/instances/cancel',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval instances-Revoke approval instances-If the enterprise administrator selects **Allow to revoke a request awaiting approval** or **Allow to revoke requests within x days** in the **More** of a specific approval definition in the approval backend, you can call this interface to revoke the approval instance of the specified submitter under the conditions that meet the revocation rules',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      approval_code: z
        .string()
        .describe(
          'Approval definition Code. Acquisition methods:- Call the [Create approval definition] API, and get the approval_code from the response parameters.- Log in to the approval management backend, and retrieve it from the URL of the specified approval definition. For specific operations, refer to [What is Approval Code]',
        ),
      instance_code: z
        .string()
        .describe(
          'Approval instance Code. Acquisition methods:- After [Creating approval instance], obtain the approval instance code from the returned results.- Call [Batch acquire approval instance ID] to get the approval instance code within the specified approval definition.- Call [Query instance list] and set filtering criteria to query the specified approval instance code',
        ),
      user_id: z
        .string()
        .describe(
          'The user ID of the individual submitting the approval, where the ID type matches the value of the query parameter user_id_type',
        ),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const approvalV4InstanceCc = {
  project: 'approval',
  name: 'approval.v4.instance.cc',
  sdkName: 'approval.v4.instance.cc',
  path: '/open-apis/approval/v4/instances/cc',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Approval-Approval instances-Notify someone of approval instances-Calling this API will CC the current approval instance to the specified user. The CC'ed user can view the approval instance details. For example, they can see the approval instance in the Feishu client under **Workplace > Approval > Approval Center > CC'd** list",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      approval_code: z
        .string()
        .describe(
          'Approval definition Code. Acquisition methods:- Call the [Create approval definition] API, and get the approval_code from the response parameters.- Log in to the approval management backend, and retrieve it from the URL of the specified approval definition. For specific operations, refer to [What is Approval Code]',
        ),
      instance_code: z
        .string()
        .describe(
          'Approval instance Code. Acquisition methods:- After [Creating approval instance], obtain the approval instance code from the returned results.- Call [Batch acquire approval instance ID] to get the approval instance code within the specified approval definition.- Call [Query instance list] and set filtering criteria to query the specified approval instance code',
        ),
      user_id: z
        .string()
        .describe('Fill in the user id of the person who initiated the cc according to the user_id_type'),
      cc_user_ids: z
        .array(z.string())
        .describe('According to the user_id_type, fill in the user id list of the copied person'),
      comment: z.string().describe('CC comment').optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const approvalV4InstanceCommentCreate = {
  project: 'approval',
  name: 'approval.v4.instanceComment.create',
  sdkName: 'approval.v4.instanceComment.create',
  path: '/open-apis/approval/v4/instances/:instance_id/comments',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Native approval comments-Create comments-Create or modify comments, or comment on replies under an approval instance (excluding approved, rejected, transferred, and other additional reasons or opinions)',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        content: z
          .string()
          .describe(
            'Comment content in JSON format, which needs to be compressed and escaped to a string when passed in. The following example value is not escaped, you can refer to the example content in the request body to edit.**Parameter description within JSON**:- text: string type, comment text content.- files: Attachment[] type, attachment information. - url: string type, attachment link. - thumbnailURL: string type, thumbnail link. - fileSize: int64 type, file size. - title: string type, title. - type: string type, attachment type, value image indicates the image type.**Note**:- If you need to @user, set the username text in this parameter, for example `@username`, and implement the @ effect through the at_info_list parameter.- For attachments, using HTTP resource links to transfer image resources on the PC may cause thumbnail anomalies, it is recommended to use HTTPS to transfer resource attachments',
          )
          .optional(),
        at_info_list: z
          .array(
            z.object({
              user_id: z
                .string()
                .describe(
                  'The ID of the mentioned person should be consistent with the value of the query parameter user_id_type',
                ),
              name: z.string().describe('Name of the member mentioned'),
              offset: z
                .string()
                .describe(
                  'The position of the person being mentioned in the comment, starting from 0. Used for offset override. For example:- Effect when the value is 0: @username text- Effect when the value is 2: te @username xt- Effect when the value is 4: text @username**Note**: This parameter takes effect by overwriting, so you need to first set the user name text content through the content parameter, and then use this parameter to overwrite the user name text content with the actual @effect',
                ),
            }),
          )
          .describe('List of members who have been mentioned in the comments (list may be empty)')
          .optional(),
        parent_comment_id: z
          .string()
          .describe(
            'Parent comment ID, if it is a reply comment, this value needs to be passed in. The method to obtain it:- Successfully calling the current interface will return the ID of this comment, you can save it for next use.- Call the [Get Comment] interface to get the comment ID',
          )
          .optional(),
        comment_id: z
          .string()
          .describe(
            'Comment ID. If you need to edit or delete a comment, you need to pass the ID of that comment to the current parameter. The method to obtain it:- Successfully calling the current interface will return the ID of this comment, you can save it for next use.- Call the [Get Comment] interface to get the comment ID',
          )
          .optional(),
        disable_bot: z
          .boolean()
          .describe(
            'Whether to disable Bot, when the value is true, only data is synchronized and Bot is not triggered.**Description**: In Feishu approval, enter false for custom approval and true for other cases',
          )
          .optional(),
        extra: z
          .string()
          .describe('Additional fields in JSON format should be compressed and escaped into a string when passed in')
          .optional(),
      })
      .optional(),
    params: z.object({
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      user_id: z.string().describe('The user ID should be consistent with the value of user_id_type'),
    }),
    path: z.object({
      instance_id: z
        .string()
        .describe(
          'Approval instance Code. Acquisition methods:- After [Creating approval instance], obtain the approval instance code from the returned results.- Call [Batch acquire approval instance ID] to get the approval instance code within the specified approval definition.- Call [Query instance list] and set filtering criteria to query the specified approval instance code.**Note**: Custom approval instance ID is supported',
        ),
    }),
  },
};
export const approvalV4InstanceCommentDelete = {
  project: 'approval',
  name: 'approval.v4.instanceComment.delete',
  sdkName: 'approval.v4.instanceComment.delete',
  path: '/open-apis/approval/v4/instances/:instance_id/comments/:comment_id',
  httpMethod: 'DELETE',
  description:
    '[Feishu/Lark]-Approval-Native approval comments-Delete comments-Delete a comment or a reply under a specific approval instance (excluding additional reasons or opinions such as approval, rejection, transfer, etc.). After deletion, the comment will no longer be displayed in the approval instance in the approval center, but instead will show **Comment Deleted**',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      user_id: z.string().describe('Fill in user ID according to user_id_type'),
    }),
    path: z.object({
      instance_id: z
        .string()
        .describe(
          'Approval instance Code. The methods to obtain it are as follows:- [Create an approval instance] and retrieve the approval instance Code from the returned result.- Call [Batch get approval instance IDs] to obtain the approval instance Code within the specified approval definition.- Call [Query instance list] and set filter conditions to query the specified approval instance Code.**Note**: Custom approval instance IDs are supported',
        ),
      comment_id: z
        .string()
        .describe(
          'Comment ID. The methods to obtain it are as follows:- Call [Create a comment], and the comment ID will be returned upon successful creation.- Call [Get comments] to obtain the comment ID',
        ),
    }),
  },
};
export const approvalV4InstanceCommentList = {
  project: 'approval',
  name: 'approval.v4.instanceComment.list',
  sdkName: 'approval.v4.instanceComment.list',
  path: '/open-apis/approval/v4/instances/:instance_id/comments',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Approval-Native approval comments-Receive comments-Obtain all comments and replies to comments under an approval instance according to Instance Code (excluding approved, rejected, transferred, and other additional reasons or opinions)',
  accessTokens: ['tenant'],
  schema: {
    params: z.object({
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      user_id: z.string().describe('User ID, the ID type should match the value of user_id_type'),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      page_size: z.number().optional(),
    }),
    path: z.object({
      instance_id: z
        .string()
        .describe(
          'Approval instance Code. The methods to obtain it are as follows:- [Create an approval instance] and retrieve the approval instance Code from the returned result.- Call [Batch get approval instance IDs] to obtain the approval instance Code within the specified approval definition.- Call [Query instance list] and set filter conditions to query the specified approval instance Code.**Note**: Custom approval instance IDs are supported',
        ),
    }),
  },
};
export const approvalV4InstanceCommentRemove = {
  project: 'approval',
  name: 'approval.v4.instanceComment.remove',
  sdkName: 'approval.v4.instanceComment.remove',
  path: '/open-apis/approval/v4/instances/:instance_id/comments/remove',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Native approval comments-Clear comments-Delete all comments and replies to comments under an approval instance (excluding approved, rejected, transferred, and other additional reasons or opinions)',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
        user_id: z.string().describe('Fill in user ID according to user_id_type').optional(),
      })
      .optional(),
    path: z.object({
      instance_id: z
        .string()
        .describe(
          'Approval instance Code. The methods to obtain it are as follows:- [Create an approval instance] and retrieve the approval instance Code from the returned result.- Call [Batch get approval instance IDs] to obtain the approval instance Code within the specified approval definition.- Call [Query instance list] and set filter conditions to query the specified approval instance Code.**Note**: Custom approval instance IDs are supported',
        ),
    }),
  },
};
export const approvalV4InstanceCreate = {
  project: 'approval',
  name: 'approval.v4.instance.create',
  sdkName: 'approval.v4.instance.create',
  path: '/open-apis/approval/v4/instances',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval instances-Create an approval instance-To call this interface and create an approval instance using a specified approval definition code, the caller needs to have a detailed understanding of the approval definition form. According to the defined form structure, the form values should be passed in through this interface',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      approval_code: z
        .string()
        .describe(
          'Approval definition Code. Acquisition methods:- Call the [Create approval definition] API, and get the approval_code from the response parameters.- Log in to the approval management backend, and retrieve it from the URL of the specified approval definition. For specific operations, refer to [What is Approval Code]',
        ),
      user_id: z
        .string()
        .describe(
          "The initiator's user_id or open_id must be passed in, with priority given to user_id if both are provided. For the way to get it, refer to [How to Obtain User ID]",
        )
        .optional(),
      open_id: z
        .string()
        .describe(
          "The initiator's open_id or user_id must be passed in, with priority given to user_id if both are provided. For the way to get it, refer to [How to Obtain Open ID]",
        )
        .optional(),
      department_id: z
        .string()
        .describe(
          "The initiator's department ID. If the user belongs to only one department, this field can be left empty. If the user belongs to multiple departments and no value is provided, the first department in the list will be selected by default. For the way to get it, refer to [Department ID].**Notes**:- Filling in the root department is not supported.- The department ID should be of department_id type",
        )
        .optional(),
      form: z
        .string()
        .describe(
          'Values of filled approval form controls must be provided as a JSON array, which needs to be compressed and escaped into a string when passed. Parameter descriptions for each control value can be found in [Approval Instance Form Control Parameters]',
        ),
      node_approver_user_id_list: z
        .array(
          z.object({
            key: z
              .string()
              .describe(
                "The node_id or custom_node_id of the node can be obtained by calling the [View Specified Approval Definition] API and retrieving it from the node_list parameter in the interface's response",
              )
              .optional(),
            value: z
              .array(z.string())
              .describe(
                'The approver list requires the user_id of users. Refer to [How to Obtain User ID] for the method to acquire user_ids',
              )
              .optional(),
          }),
        )
        .describe(
          'If the approval process definition includes a node where the initiator needs to select an approver, this parameter should be used to specify the approver for the corresponding node (by designating the approver using the user_id).**Notes**: If both node_approver_user_id_list and node_approver_open_id_list are provided, the approvers will be the union of both lists',
        )
        .optional(),
      node_approver_open_id_list: z
        .array(
          z.object({
            key: z
              .string()
              .describe(
                "The node_id or custom_node_id of the node can be obtained by calling the [View Specified Approval Definition] API and retrieving it from the node_list parameter in the interface's response",
              )
              .optional(),
            value: z
              .array(z.string())
              .describe(
                "The approver list requires the user open_id. Refer to [How to Obtain User's Open ID] for the method to acquire open_ids",
              )
              .optional(),
          }),
        )
        .describe(
          'If the approval process definition includes a node where the initiator needs to select an approver, this parameter should be used to specify the approver for the corresponding node (by designating the approver using the open_id).**Notes**: If both node_approver_user_id_list and node_approver_open_id_list are provided, the approvers will be the union of both lists',
        )
        .optional(),
      node_cc_user_id_list: z
        .array(
          z.object({
            key: z
              .string()
              .describe(
                "The node_id for a node can be obtained by calling the [View Specified Approval Definition] API and retrieving it from the node_list parameter in the interface's response",
              )
              .optional(),
            value: z
              .array(z.string())
              .describe(
                "The CC recipient list requires the user_id. Refer to [How to Obtain User's User ID] for the method to acquire user_ids",
              )
              .optional(),
          }),
        )
        .describe(
          'If the approval process definition includes a node where the initiator needs to select the CC recipient, this parameter should be used to specify the CC recipient for the corresponding node (by designating the recipient using the user_id).**Notes**: If both node_cc_user_id_list and node_cc_open_id_list are provided, the CC recipients will be the union of both lists',
        )
        .optional(),
      node_cc_open_id_list: z
        .array(
          z.object({
            key: z
              .string()
              .describe(
                'The node_id of a node can be obtained by calling the [View Specified Approval Definition] API and retrieving it from the node_list parameter in the response of the API',
              )
              .optional(),
            value: z
              .array(z.string())
              .describe(
                "The CC recipient list requires the user's open_id. Refer to [How to Obtain User's Open ID] for the method to acquire open_ids",
              )
              .optional(),
          }),
        )
        .describe(
          'If the approval process definition includes a node where the initiator needs to select the CC recipient, this parameter should be used to specify the CC recipient for the corresponding node (by designating the recipient using the open_id).**Notes**: If both node_cc_user_id_list and node_cc_open_id_list are provided, the CC recipients will be the union of both lists',
        )
        .optional(),
      uuid: z
        .string()
        .describe(
          'Approval instance uuid, used for idempotent action. A single uuid can only be used to create 1 approval instance. In the case of a conflict, the error code 60012 will be returned. The format must be: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX (case-insensitive)',
        )
        .optional(),
      allow_resubmit: z
        .boolean()
        .describe(
          'Whether the **Submit** button is configured is applicable when the approver of the task returns the approval document, allowing the approval submitter to click **Submit** within the same approval instance to submit the document again',
        )
        .optional(),
      allow_submit_again: z
        .boolean()
        .describe(
          'Create an approval instance interface to support configuration whether to allow submit again or not, applicable to periodic bill of lading scenarios, where a new instance is launched again based on the current form content',
        )
        .optional(),
      cancel_bot_notification: z
        .string()
        .describe(
          'Configure the bot to suppress specified notification results. Optional values:- 1: Cancel push.- 2: Cancel rejection push.- 4: Cancel the instance and cancel the push.Supports canceling a single bot notification, and also supports canceling multiple bot notifications at the same time. Bit operation, that is, if you need to cancel the two notifications 1 and 2, you need to pass in the sum value 3',
        )
        .optional(),
      forbid_revoke: z.boolean().describe('Configure whether revocation can be prohibited').optional(),
      i18n_resources: z
        .array(
          z.object({
            locale: z
              .enum(['zh-CN', 'en-US', 'ja-JP'])
              .describe('Language Options:zh-CN(Zhcn Chinese),en-US(Enus English),ja-JP(Jajp Japanese)'),
            texts: z
              .array(
                z.object({
                  key: z.string().describe('The copywriting Key needs to match the Keys of each parameter'),
                  value: z.string().describe('Copywriting'),
                }),
              )
              .describe(
                "Copywriting Key:Value. The Key needs to start with @i18n@ and the Value should be passed in according to the requirements of each parameter.**Explanation**: This field is mainly used for internationalization and allows setting copywriting for multiple languages simultaneously. The approval center will use the matched copywriting based on the actual language environment of the current user. If the copywriting for the user's current language environment is not set, the default language copywriting will be used",
              ),
            is_default: z
              .boolean()
              .describe(
                'Whether to use the default language. If the default language is used, all keys should be contained; if a non-default language is used but its keys do not exist, the default language will be used instead',
              ),
          }),
        )
        .describe('Internationalized text. Only the value of input and textarea are supported')
        .optional(),
      title: z
        .string()
        .describe(
          'Display name of the approval instance. If this parameter is filled in, the approval name in the approval list will use this parameter. If this parameter is not filled in, the approval name will use the name defined by the approval.**Explanation**: The Key for the internationalized copywriting is passed here (i.e., the Key in the i18n_resources.texts parameter). It must start with @i18n@ and also needs to be assigned in the i18n_resources.texts parameter in the format of Key:Value',
        )
        .optional(),
      title_display_method: z
        .number()
        .describe(
          'Display mode for the title on the approval details page. Options:0(display_all If both the approval definition and approval instance have a title, display both, separated by a vertical line.),1(display_instance_title If both the approval definition and approval instance have a title, only display the title of the approval instance.)',
        )
        .optional(),
      node_auto_approval_list: z
        .array(
          z.object({
            node_id_type: z
              .enum(['CUSTOM', 'NON_CUSTOM'])
              .describe('Node ID type Options:CUSTOM(Custom node ID),NON_CUSTOM(NonCustom Non-custom node ID)')
              .optional(),
            node_id: z
              .string()
              .describe(
                'The value of the node ID can be obtained by calling the [Get Specified Approval Definition] API. The node ID can be found in the node_list parameter of the API response',
              )
              .optional(),
          }),
        )
        .describe('Set up auto-approval nodes')
        .optional(),
    }),
  },
};
export const approvalV4InstanceGet = {
  project: 'approval',
  name: 'approval.v4.instance.get',
  sdkName: 'approval.v4.instance.get',
  path: '/open-apis/approval/v4/instances/:instance_id',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Approval-Approval instances-Obtain details of an approval instance-You can obtain detailed information about a specific approval instance using the Approval Instance Code, including the name of the approval instance, creation time, user who initiated the approval, status, and task list, among other information',
  accessTokens: ['tenant'],
  schema: {
    params: z
      .object({
        locale: z
          .enum(['zh-CN', 'en-US', 'ja-JP'])
          .describe(
            'Language. The default value is the language configured with the value `true` for `is_default` in the `i18n_resources` parameter when [creating the approval definition]. Options:zh-CN(Zhcn Chinese),en-US(Enus English),ja-JP(Jajp Japanese)',
          )
          .optional(),
        user_id: z
          .string()
          .describe(
            'The user ID of the person who initiated the approval, with the ID type specified by the `user_id_type` parameter',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
    path: z.object({
      instance_id: z
        .string()
        .describe(
          'Approval instance Code. Acquisition methods:- After [Creating approval instance], obtain the approval instance code from the returned results.- Call [Batch acquire approval instance ID] to get the approval instance code within the specified approval definition.- Call [Query instance list] and set filtering criteria to query the specified approval instance code',
        ),
    }),
  },
};
export const approvalV4InstanceList = {
  project: 'approval',
  name: 'approval.v4.instance.list',
  sdkName: 'approval.v4.instance.list',
  path: '/open-apis/approval/v4/instances',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Approval-Approval instances-Obtain IDs of multiple approval instances-This API is used to obtain the instance_codes of multiple approval instances in batches based on a specified approval_code. This can be used to obtain all approval instances of a tenant's approval definition.The results are sorted by default in the order of when the approval was created",
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
      approval_code: z
        .string()
        .describe(
          'Approval definition Code. Acquisition methods:- Call the [Create approval definition] API, and get the approval_code from the response parameters.- Log in to the approval management backend, and retrieve it from the URL of the specified approval definition. For specific operations, refer to [What is Approval Code]',
        ),
      start_time: z
        .string()
        .describe(
          'The start interval for the creation time of the approval instance, in milliseconds timestamp.**Note**: start_time and end_time form the time interval query condition. The interface will return the approval instance data created within this time interval',
        ),
      end_time: z
        .string()
        .describe(
          'The end interval for the creation time of the approval instance, in milliseconds timestamp.**Note**: start_time and end_time form the time interval query condition. The interface will return the Codes of the approval instances created within this time interval',
        ),
    }),
  },
};
export const approvalV4InstancePreview = {
  project: 'approval',
  name: 'approval.v4.instance.preview',
  sdkName: 'approval.v4.instance.preview',
  path: '/open-apis/approval/v4/instances/preview',
  httpMethod: 'POST',
  description: '[Feishu/Lark]-Approval-Approval instances-Preview approval instances',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z.string(),
      approval_code: z.string().optional(),
      department_id: z.string().optional(),
      form: z.string().optional(),
      instance_code: z.string().optional(),
      locale: z.string().optional(),
      task_id: z.string().optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'user_id', 'union_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const approvalV4InstanceQuery = {
  project: 'approval',
  name: 'approval.v4.instance.query',
  sdkName: 'approval.v4.instance.query',
  path: '/open-apis/approval/v4/instances/query',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval search-List of instances-The interface queries the list of qualified review instances in the review system through different conditions',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_id: z.string().describe('Fill in the user id according to the user_id_type').optional(),
        approval_code: z
          .string()
          .describe(
            'Approval Instance Code. Obtaining method:- Call the [Create Approval Instance] API and obtain the instance_code from the response parameters.- Call the [Batch Get Approval Instance ID] API to get the required approval instance code. **Note**:- user_id, approval_code, instance_code, instance_external_id, group_external_id cannot all be empty simultaneously.- Query results for instance_code and instance_external_id are a union set',
          )
          .optional(),
        instance_code: z
          .string()
          .describe(
            'Approval Instance Code. Obtaining method:- Call the [Create Approval Instance] API and obtain the instance_code from the response parameters.- Call the [Batch Get Approval Instance ID] API to get the required approval instance code.**Note**:- user_id, approval_code, instance_code, instance_external_id, and group_external_id cannot all be empty simultaneously.- Query results for instance_code and instance_external_id are a union set',
          )
          .optional(),
        instance_external_id: z
          .string()
          .describe(
            'Third-party ID of the approval instance.**Note**:- user_id, approval_code, instance_code, instance_external_id, and group_external_id cannot all be empty simultaneously.- Query results for instance_code and instance_external_id are a union set',
          )
          .optional(),
        group_external_id: z
          .string()
          .describe(
            'Third-party ID of the approval definition group.**Note**:- user_id, approval_code, instance_code, instance_external_id, and group_external_id cannot all be empty simultaneously.- Query results for approval_code and group_external_id are a union set',
          )
          .optional(),
        instance_title: z
          .string()
          .describe(
            'Approval instance title.**Note**: The approval instance title only exists for third-party approvals',
          )
          .optional(),
        instance_status: z
          .enum(['PENDING', 'RECALL', 'REJECT', 'DELETED', 'APPROVED', 'ALL'])
          .describe(
            'Approval instance status.**Default value**: ALL Options:PENDING(Under review),RECALL(Withdraw),REJECT(Reject),DELETED(Deleted),APPROVED(Approverd Pass),ALL(All states)',
          )
          .optional(),
        instance_start_time_from: z
          .string()
          .describe(
            'Instance query start time, Unix millisecond timestamp. Together with the `instance_start_time_to` parameter forms the time period query condition and will only return approval instances within this time period.**Note**: The query time span must not exceed 30 days, and the start and end times must either be both set or both unset',
          )
          .optional(),
        instance_start_time_to: z
          .string()
          .describe(
            'Instance query end time, Unix millisecond timestamp. Together with the `instance_start_time_from` parameter forms the time period query condition and will only return approval instances within this time period.**Note**: The query time span must not exceed 30 days, and the start and end times must either be both set or both unset',
          )
          .optional(),
        locale: z
          .enum(['zh-CN', 'en-US', 'ja-JP'])
          .describe('Language. Options:zh-CN(ZhCn Chinese),en-US(EnUs English),ja-JP(JaJp Japanese)')
          .optional(),
      })
      .optional(),
    params: z
      .object({
        page_size: z
          .number()
          .describe(
            'Page size: If the current page contains revoked approval instances, the number of data entries per page in the query result might be less than the page_size value. For example, if page_size is set to 10, but the current page shows only 6 entries, it indicates that 4 entries are revoked approval instances',
          )
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const approvalV4InstanceSearchCc = {
  project: 'approval',
  name: 'approval.v4.instance.searchCc',
  sdkName: 'approval.v4.instance.searchCc',
  path: '/open-apis/approval/v4/instances/search_cc',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval search-List of cc information-The interface queries the qualified review cc list in the review system through different conditions',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_id: z.string().describe('Fill in the user id according to the x_user_type').optional(),
        approval_code: z
          .string()
          .describe(
            'Approval Definition Code. The retrieval methods are as follows:- Call the [Create Approval Definition] interface and obtain the `approval_code` from the response parameters.- Log in to the approval management backend and get it from the URL of the specified approval definition. For detailed operations, please refer to [What is Approval Code].**Note**:- `user_id`, `approval_code`, `instance_code`, `instance_external_id`, and `group_external_id` cannot all be empty simultaneously.- Query results for `approval_code` and `group_external_id` are obtained through union',
          )
          .optional(),
        instance_code: z
          .string()
          .describe(
            'Approval Instance Code. The retrieval methods are as follows:- Call the [Create Approval Instance] interface and obtain the `instance_code` from the response parameters.- Call the [Batch Get Approval Instance ID] interface to get the required approval instance code.**Note**:- `user_id`, `approval_code`, `instance_code`, `instance_external_id`, and `group_external_id` cannot all be empty simultaneously.- Query results for `instance_code` and `instance_external_id` are obtained through union',
          )
          .optional(),
        instance_external_id: z
          .string()
          .describe(
            'Third-party ID of Approval Instance.**Note**:- `user_id`, `approval_code`, `instance_code`, `instance_external_id`, and `group_external_id` cannot all be empty simultaneously.- Query results for `instance_code` and `instance_external_id` are obtained through union',
          )
          .optional(),
        group_external_id: z
          .string()
          .describe(
            'Third-party ID of Approval Definition Group.**Note**:- `user_id`, `approval_code`, `instance_code`, `instance_external_id`, and `group_external_id` cannot all be empty simultaneously.- Query results for `approval_code` and `group_external_id` are obtained through union',
          )
          .optional(),
        cc_title: z.string().describe('Approval CC title (only for third-party reviews)').optional(),
        read_status: z
          .enum(['READ', 'UNREAD', 'ALL'])
          .describe(
            'Approval CC status Note: if not in the collection, report an error Options:READ(Read),UNREAD(Unread),ALL(All states)',
          )
          .optional(),
        cc_create_time_from: z
          .string()
          .describe(
            'CC Query Start Time, Unix millisecond timestamp. Forms a time period query condition with the `cc_create_time_from` parameter, and will only return approval copies within that time period.**Note**: The query time span cannot exceed 30 days. Start and end times must both be set or both be unset',
          )
          .optional(),
        cc_create_time_to: z
          .string()
          .describe(
            'CC Query End Time, Unix millisecond timestamp. Forms a time period query condition with the `cc_create_time_from` parameter, and will only return approval copies within that time period.**Note**: The query time span cannot exceed 30 days. Start and end times must both be set or both be unset',
          )
          .optional(),
        locale: z
          .enum(['zh-CN', 'en-US', 'ja-JP'])
          .describe('Language Options:zh-CN(ZhCn Chinese),en-US(EnUs English),ja-JP(JaJp Japanese)')
          .optional(),
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
  },
};
export const approvalV4InstanceSpecifiedRollback = {
  project: 'approval',
  name: 'approval.v4.instance.specifiedRollback',
  sdkName: 'approval.v4.instance.specifiedRollback',
  path: '/open-apis/approval/v4/instances/specified_rollback',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval tasks-Return approval task-Rolls back the current approval to one or more approved task nodes. After the rollback, the approved nodes will generate approval tasks again',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      user_id: z
        .string()
        .describe(
          'The user ID of the approver for the current approval task must match the ID type with the query parameter user_id_type. You can call [Get Single Approval Instance Details] to retrieve the user ID from the task_list parameter in the returned result, where the task status must be PENDING',
        ),
      task_id: z
        .string()
        .describe(
          'The approval task ID that needs to be reverted. You can call [Get Single Approval Instance Details] to retrieve the task ID from the task_list parameter in the returned result, where the task status must be PENDING',
        ),
      reason: z.string().describe('Reason for rollback').optional(),
      extra: z.string().describe('extra info').optional(),
      task_def_key_list: z
        .array(z.string())
        .describe(
          'The node_key of the task that needs to be reverted to. You can call [Get Single Approval Instance Details] to retrieve the node_key from the timeline parameter in the returned result, where the dynamic type must be PASS',
        ),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const approvalV4TaskApprove = {
  project: 'approval',
  name: 'approval.v4.task.approve',
  sdkName: 'approval.v4.task.approve',
  path: '/open-apis/approval/v4/tasks/approve',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval tasks-Agree to approval task-Approves a single approval task. After that, the approval process will be transferred to the next approver',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      approval_code: z
        .string()
        .describe(
          'Approval definition Code. Acquisition methods:- Call the [Create approval definition] API, and get the approval_code from the response parameters.- Log in to the approval management backend, and retrieve it from the URL of the specified approval definition. For specific operations, refer to [What is Approval Code]',
        ),
      instance_code: z
        .string()
        .describe(
          'pproval instance Code. Acquisition methods:- After [Creating approval instance], obtain the approval instance code from the returned results.- Call [Batch acquire approval instance ID] to get the approval instance code within the specified approval definition.- Call [Query instance list] and set filtering criteria to query the specified approval instance code',
        ),
      user_id: z.string().describe('Fill in the operation user id according to the user_id_type'),
      comment: z.string().describe('Opinion').optional(),
      task_id: z
        .string()
        .describe(
          'Approval task ID, call [Get Single Approval Instance Details] and retrieve the required ID from the `task_list` in the returned result',
        ),
      form: z
        .string()
        .describe(
          'If a conditional branch is added in the process design of the approval definition, it is necessary to pass in the control data required for the conditional branch (a JSON array), otherwise, it will affect the subsequent branch condition flow.**Note**: When passing the value, the JSON must be serialized into a string. The example parameter values are not escaped; the correct example for passing values can be found in the **Request Body Example** below',
        )
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const approvalV4TaskQuery = {
  project: 'approval',
  name: 'approval.v4.task.query',
  sdkName: 'approval.v4.task.query',
  path: '/open-apis/approval/v4/tasks/query',
  httpMethod: 'GET',
  description: "[Feishu/Lark]-Approval-Approval search-Query the user's task list",
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      page_size: z.number().optional(),
      page_token: z.string().optional(),
      user_id: z.string().describe('User ID to query'),
      topic: z
        .enum(['1', '2', '3', '17', '18'])
        .describe(
          'Topic of task group to query, such as "Pending", "Done", etc. Options:1(TodoApproval 待办审批),2(DoneApproval 已办审批),3(InitiatedApproval 已发起审批),17(UnreadNotice 未读知会),18(ReadNotice 已读知会)',
        ),
      user_id_type: z.enum(['user_id', 'union_id', 'open_id']).describe('User ID type').optional(),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const approvalV4TaskReject = {
  project: 'approval',
  name: 'approval.v4.task.reject',
  sdkName: 'approval.v4.task.reject',
  path: '/open-apis/approval/v4/tasks/reject',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval tasks-Refuse to approve tasks-Rejects a single approval task. This ends the approval process',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      approval_code: z
        .string()
        .describe(
          'Approval definition Code. Acquisition methods:- Call the [Create approval definition] API, and get the approval_code from the response parameters.- Log in to the approval management backend, and retrieve it from the URL of the specified approval definition. For specific operations, refer to [What is Approval Code]',
        ),
      instance_code: z
        .string()
        .describe(
          'Approval instance Code. Acquisition methods:- After [Creating approval instance], obtain the approval instance code from the returned results.- Call [Batch acquire approval instance ID] to get the approval instance code within the specified approval definition.- Call [Query instance list] and set filtering criteria to query the specified approval instance code',
        ),
      user_id: z.string().describe('Fill in the operation user id according to the user_id_type'),
      comment: z.string().describe('Opinion').optional(),
      task_id: z
        .string()
        .describe(
          'Approval task ID, call [Get single approval instance details] and retrieve the required ID from the task_list in the returned result',
        ),
      form: z
        .string()
        .describe(
          'If a conditional branch is added in the process design of the approval definition, it is necessary to pass in the control data required for the conditional branch (a JSON array), otherwise, it will affect the subsequent branch condition flow.**Note**: When passing the value, the JSON must be serialized into a string. The example parameter values are not escaped; the correct example for passing values can be found in the **Request Body Example** below',
        )
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const approvalV4TaskResubmit = {
  project: 'approval',
  name: 'approval.v4.task.resubmit',
  sdkName: 'approval.v4.task.resubmit',
  path: '/open-apis/approval/v4/tasks/resubmit',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval tasks-Resubmit the task for approval-For the approval tasks that are returned to the initiator, the reinitiation operation can be performed. After initiation, the approval process will move to the next approver',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      approval_code: z
        .string()
        .describe(
          'Approval definition Code. Acquisition methods:- Call the [Create approval definition] API, and get the approval_code from the response parameters.- Log in to the approval management backend, and retrieve it from the URL of the specified approval definition. For specific operations, refer to [What is Approval Code]',
        ),
      instance_code: z
        .string()
        .describe(
          'Approval instance Code. Acquisition methods:- After [Creating approval instance], obtain the approval instance code from the returned results.- Call [Batch acquire approval instance ID] to get the approval instance code within the specified approval definition.- Call [Query instance list] and set filtering criteria to query the specified approval instance code',
        ),
      user_id: z.string().describe('Fill in the operation user id according to the user_id_type'),
      comment: z.string().describe('Opinion').optional(),
      task_id: z
        .string()
        .describe(
          'Approval task ID, call [Get single approval instance details] and retrieve the required ID from the task_list in the returned result',
        ),
      form: z
        .string()
        .describe(
          'Approval form control values in a JSON array, which need to be compressed and escaped into a string when passed. This parameter is used in the same way as the form parameter in [Create Approval Instance]',
        ),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const approvalV4TaskSearch = {
  project: 'approval',
  name: 'approval.v4.task.search',
  sdkName: 'approval.v4.task.search',
  path: '/open-apis/approval/v4/tasks/search',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval search-Query list of tasks-The interface queries the list of qualified review tasks in the review system through different conditions',
  accessTokens: ['tenant'],
  schema: {
    data: z
      .object({
        user_id: z.string().describe('Fill in the Approver id according to the user_id_type').optional(),
        approval_code: z
          .string()
          .describe(
            'Approval Definition Code. Methods to obtain:- After calling the [Create Approval Definition] interface, retrieve from the response parameter `approval_code`.- Log into the approval management backend and obtain from the URL of the specified approval definition. Detailed steps can be found in [What is Approval Code].**Note**:- `user_id`, `approval_code`, `instance_code`, `instance_external_id`, and `group_external_id` cannot all be empty simultaneously.- The query results for `approval_code` and `group_external_id` are the union of their results',
          )
          .optional(),
        instance_code: z
          .string()
          .describe(
            'Approval Instance Code. Methods to obtain:- After calling the [Create Approval Instance] interface, retrieve from the response parameter `instance_code`.- Call the [Batch Retrieve Approval Instance ID] interface to obtain the required approval instance Code.**Note**:- `user_id`, `approval_code`, `instance_code`, `instance_external_id`, and `group_external_id` cannot all be empty simultaneously.- The query results for `instance_code` and `instance_external_id` are the union of their results',
          )
          .optional(),
        instance_external_id: z
          .string()
          .describe(
            'Third-party ID of the approval instance.**Note**:- `user_id`, `approval_code`, `instance_code`, `instance_external_id`, and `group_external_id` cannot all be empty simultaneously.- The query results for `instance_code` and `instance_external_id` are the union of their results',
          )
          .optional(),
        group_external_id: z
          .string()
          .describe(
            'Third-party ID of the approval definition group.**Note**:- `user_id`, `approval_code`, `instance_code`, `instance_external_id`, and `group_external_id` cannot all be empty simultaneously.- The query results for `approval_code` and `group_external_id` are the union of their results',
          )
          .optional(),
        task_title: z.string().describe('Review task title (only for third-party reviews)').optional(),
        task_status: z
          .enum(['PENDING', 'REJECTED', 'APPROVED', 'TRANSFERRED', 'DONE', 'RM_REPEAT', 'PROCESSED', 'ALL'])
          .describe(
            'Review task statusNote: if not in the collection, report an error Options:PENDING(Under review),REJECTED(Reject),APPROVED(Approverd Pass),TRANSFERRED(Transfer),DONE(Completed),RM_REPEAT(Deduplicate),PROCESSED(Processed),ALL(All states)',
          )
          .optional(),
        task_start_time_from: z
          .string()
          .describe(
            'Task query start time, Unix millisecond timestamp. Together with the `task_start_time_to` parameter, it forms a time period query condition, and only approval tasks within this time period will be returned.**Note**: The query time span must not exceed 30 days, and the start and end times must either be both set or both unset',
          )
          .optional(),
        task_start_time_to: z
          .string()
          .describe(
            'Task query end time, Unix millisecond timestamp. Together with the `task_start_time_from` parameter, it forms a time period query condition, and only approval tasks within this time period will be returned.**Note**: The query time span must not exceed 30 days, and the start and end times must either be both set or both unset',
          )
          .optional(),
        locale: z
          .enum(['zh-CN', 'en-US', 'ja-JP'])
          .describe('Language. Options:zh-CN(ZhCn Chinese),en-US(EnUs English),ja-JP(JaJp Japanese)')
          .optional(),
        task_status_list: z
          .array(z.string())
          .describe(
            'Query tasks with multiple statuses. When this parameter is filled, the `task_status` parameter will become invalid.**Optional values are**:- `PENDING`: In approval- `REJECTED`: Rejected- `APPROVED`: Approved- `TRANSFERRED`: Transferred- `DONE`: Completed- `RM_REPEAT`: Deduplicated- `PROCESSED`: Processed',
          )
          .optional(),
        order: z
          .number()
          .describe(
            'Sort by task time Options:0(UpdateTimeDESC Sort by approval task update time (`update_time`) in descending order.),1(UpdateTimeASC Sort by approval task update time (`update_time`) in ascending order.),2(StartTimeDESC Sort by approval task start time (`start_time`) in descending order.),3(StartTimeASC Sort by approval task start time (`start_time`) in ascending order.)',
          )
          .optional(),
      })
      .optional(),
    params: z
      .object({
        page_size: z
          .number()
          .describe(
            'Page size. If the current page contains tasks within revoked instances, the number of data entries per page in the query result may be less than the `page_size` value. For example, if `page_size` is set to 10, but the actual query result on the current page only shows 6 entries, this indicates that 4 entries are tasks within revoked instances',
          )
          .optional(),
        page_token: z
          .string()
          .describe(
            'Page identifier. It is not filled in the first request, indicating traversal from the beginning when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
          )
          .optional(),
        user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
      })
      .optional(),
  },
};
export const approvalV4TaskTransfer = {
  project: 'approval',
  name: 'approval.v4.task.transfer',
  sdkName: 'approval.v4.task.transfer',
  path: '/open-apis/approval/v4/tasks/transfer',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Approval-Approval tasks-Transfer the approval task-Transfers a single approval task. After that, the approval process will be transferred to the transfer recipient',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      approval_code: z
        .string()
        .describe(
          'Approval definition Code. Acquisition methods:- Call the [Create approval definition] API, and get the approval_code from the response parameters.- Log in to the approval management backend, and retrieve it from the URL of the specified approval definition. For specific operations, refer to [What is Approval Code]',
        ),
      instance_code: z
        .string()
        .describe(
          'Approval instance Code. Acquisition methods:- After [Creating approval instance], obtain the approval instance code from the returned results.- Call [Batch acquire approval instance ID] to get the approval instance code within the specified approval definition.- Call [Query instance list] and set filtering criteria to query the specified approval instance code',
        ),
      user_id: z.string().describe('Fill in the operation user id according to the user_id_type'),
      comment: z.string().describe('Opinion').optional(),
      transfer_user_id: z
        .string()
        .describe('Fill in the unique ID of the transferred person according to the user_id_type'),
      task_id: z
        .string()
        .describe(
          'Approval task ID, call [Get single approval instance details] and retrieve the required ID from the task_list in the returned result',
        ),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const approvalV4Tools = [
  approvalV4ApprovalCreate,
  approvalV4ApprovalGet,
  approvalV4ApprovalSubscribe,
  approvalV4ApprovalUnsubscribe,
  approvalV4ExternalApprovalCreate,
  approvalV4ExternalApprovalGet,
  approvalV4ExternalInstanceCheck,
  approvalV4ExternalInstanceCreate,
  approvalV4ExternalTaskList,
  approvalV4InstanceAddSign,
  approvalV4InstanceCancel,
  approvalV4InstanceCc,
  approvalV4InstanceCommentCreate,
  approvalV4InstanceCommentDelete,
  approvalV4InstanceCommentList,
  approvalV4InstanceCommentRemove,
  approvalV4InstanceCreate,
  approvalV4InstanceGet,
  approvalV4InstanceList,
  approvalV4InstancePreview,
  approvalV4InstanceQuery,
  approvalV4InstanceSearchCc,
  approvalV4InstanceSpecifiedRollback,
  approvalV4TaskApprove,
  approvalV4TaskQuery,
  approvalV4TaskReject,
  approvalV4TaskResubmit,
  approvalV4TaskSearch,
  approvalV4TaskTransfer,
];
