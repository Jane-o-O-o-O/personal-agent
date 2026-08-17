import { z } from 'zod';
export type driveV2ToolName =
  | 'drive.v2.fileLike.list'
  | 'drive.v2.permissionPublic.get'
  | 'drive.v2.permissionPublic.patch';
export const driveV2FileLikeList = {
  project: 'drive',
  name: 'drive.v2.fileLike.list',
  sdkName: 'drive.v2.fileLike.list',
  path: '/open-apis/drive/v2/files/:file_token/likes',
  httpMethod: 'GET',
  description:
    "[Feishu/Lark]-Docs-Space-Like-List Document's Likes-Get the list of likes for the specified document and returns by like time from near to far. This API supports paging",
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      file_type: z
        .enum(['doc', 'docx', 'file'])
        .describe(
          'Document type, the API will return a failure if the value is empty or does not match the actual type of the document. Options:doc(Docs),docx(Upgraded Docs),file(File)',
        ),
      page_size: z.number().describe('paging size').optional(),
      page_token: z
        .string()
        .describe(
          'Page identifier. It is not filled in the first request, indicating traversal from the beginning; when there will be more groups, the new page_token will be returned at the same time, and the next traversal can use the page_token to get more groups',
        )
        .optional(),
      user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional(),
    }),
    path: z.object({
      file_token: z
        .string()
        .describe('The document token specified to query the like list. [Click to learn how to get document token]'),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV2PermissionPublicGet = {
  project: 'drive',
  name: 'drive.v2.permissionPublic.get',
  sdkName: 'drive.v2.permissionPublic.get',
  path: '/open-apis/drive/v2/permissions/:token/public',
  httpMethod: 'GET',
  description:
    '[Feishu/Lark]-Docs-Permission-Setting-GetPermissionPublic-This interface is used to obtain permission settings for cloud documents according to filetoken',
  accessTokens: ['tenant', 'user'],
  schema: {
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides'])
        .describe(
          'File type, which needs to match the token of the file Options:doc(Doc),sheet(Sheet),file(File in My Space),wiki(Wiki node),bitable(Bitable),docx(Upgraded Docs),mindnote(Mindnote),minutes(Minutes),slides(Slides)',
        ),
    }),
    path: z.object({
      token: z
        .string()
        .describe(
          'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV2PermissionPublicPatch = {
  project: 'drive',
  name: 'drive.v2.permissionPublic.patch',
  sdkName: 'drive.v2.permissionPublic.patch',
  path: '/open-apis/drive/v2/permissions/:token/public',
  httpMethod: 'PATCH',
  description:
    '[Feishu/Lark]-Docs-Permission-Setting-UpdatePermissionPublic-This API is used to update the common settings of a document based on a filetoken',
  accessTokens: ['tenant', 'user'],
  schema: {
    data: z
      .object({
        external_access_entity: z
          .enum(['open', 'closed', 'allow_share_partner_tenant'])
          .describe(
            "Allow content to be shared outside the organization Options:open(open),closed(close),allow_share_partner_tenant(AllowSharePartnerTenant Allow sharing with affiliated organizations(This value can only be set if the tenant's background setting allows only associated organizations to share))",
          )
          .optional(),
        security_entity: z
          .enum(['anyone_can_view', 'anyone_can_edit', 'only_full_access'])
          .describe(
            'Who can create copies, print, download Options:anyone_can_view(AnyoneCanView Users with viewing permissions),anyone_can_edit(AnyoneCanEdit Users with editable permissions),only_full_access(OnlyFullAccess Users with manageable permissions (including me))',
          )
          .optional(),
        comment_entity: z
          .enum(['anyone_can_view', 'anyone_can_edit'])
          .describe(
            'Who can comment Options:anyone_can_view(AnyoneCanView Users with viewing permissions),anyone_can_edit(AnyoneCanEdit Users with editable permissions)',
          )
          .optional(),
        share_entity: z
          .enum(['anyone', 'same_tenant'])
          .describe(
            'Who can add and manage collaborators - organizational dimension Options:anyone(All users who can read or edit this document),same_tenant(SameTenant All users in your organization who can read or edit this document)',
          )
          .optional(),
        manage_collaborator_entity: z
          .enum(['collaborator_can_view', 'collaborator_can_edit', 'collaborator_full_access'])
          .describe(
            'Who can add and manage collaborators - collaborator dimension Options:collaborator_can_view(CollaboratorCanView Collaborators with viewing permissions),collaborator_can_edit(CollaboratorCanEdit Collaborators with editable permissions),collaborator_full_access(CollaboratorFullAccess Collaborators with manageable permissions (including me))',
          )
          .optional(),
        link_share_entity: z
          .enum([
            'tenant_readable',
            'tenant_editable',
            'partner_tenant_readable',
            'partner_tenant_editable',
            'anyone_readable',
            'anyone_editable',
            'closed',
          ])
          .describe(
            'Link sharing settings Options:tenant_readable(TenantReadable People in the organization who get the link can read it),tenant_editable(TenantEditable People in the organization who get the link can edit),partner_tenant_readable(PartnerTenantReadable People from affiliated organizations can read(This value can only be set if the tenant\'s background setting allows only associated organizations to share)),partner_tenant_editable(PartnerTenantEditable People from affiliated organizations can edit(This value can only be set if the tenant\'s background setting allows only associated organizations to share)),anyone_readable(AnyoneReadable Anyone with a link on the Internet can read it (only external_access_entity = "open")),anyone_editable(AnyoneEditable Editable by anyone with a link on the internet (only external_access_entity = "open")),closed(Close link share)',
          )
          .optional(),
        copy_entity: z
          .enum(['anyone_can_view', 'anyone_can_edit', 'only_full_access'])
          .describe(
            'Who can copy the content Options:anyone_can_view(AnyoneCanView Users with viewing permissions),anyone_can_edit(AnyoneCanEdit Users with editable permissions),only_full_access(OnlyFullAccess Collaborators with manageable permissions (including me))',
          )
          .optional(),
      })
      .optional(),
    params: z.object({
      type: z
        .enum(['doc', 'sheet', 'file', 'wiki', 'bitable', 'docx', 'mindnote', 'minutes', 'slides'])
        .describe(
          'File type, which needs to match the token of the file Options:doc(Doc),sheet(Sheet),file(File in My Space),wiki(Wiki node),bitable(Bitable),docx(Upgraded Docs),mindnote(Mindnote),minutes(Minutes),slides(Slides)',
        ),
    }),
    path: z.object({
      token: z
        .string()
        .describe(
          'Token of the file. For more information about how to obtain the token, see [How to get the token of docs resources]',
        ),
    }),
    useUAT: z.boolean().describe('Use user access token, otherwise use tenant access token').optional(),
  },
};
export const driveV2Tools = [driveV2FileLikeList, driveV2PermissionPublicGet, driveV2PermissionPublicPatch];
