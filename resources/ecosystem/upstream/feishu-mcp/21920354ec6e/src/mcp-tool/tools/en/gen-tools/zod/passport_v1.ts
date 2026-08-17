import { z } from 'zod';
export type passportV1ToolName = 'passport.v1.session.logout' | 'passport.v1.session.query';
export const passportV1SessionLogout = {
  project: 'passport',
  name: 'passport.v1.session.logout',
  sdkName: 'passport.v1.session.logout',
  path: '/open-apis/passport/v1/sessions/logout',
  httpMethod: 'POST',
  description:
    '[Feishu/Lark]-Authenticate and Authorize-Login state management-Log out-This interface is used to log out of the user login state',
  accessTokens: ['tenant'],
  schema: {
    data: z.object({
      idp_credential_id: z
        .string()
        .describe('The unique identifier of the idp, required when logout_type = 2')
        .optional(),
      logout_type: z
        .number()
        .describe(
          'Used to identify the type of logout Options:1(UserID UserID),2(IdpCredentialID),3(SessionUUID Session uuid)',
        ),
      terminal_type: z
        .array(z.number())
        .describe(
          'Logout terminal_type, default all logout.- 1：pc- 2：web- 3：android- 4：iOS- 5：server- 6：old version mini program- 8：other mobile',
        )
        .optional(),
      user_id: z
        .string()
        .describe(
          'User ID categories, is consistent with the query parameter user_id_type.required when logout_type = 1',
        )
        .optional(),
      logout_reason: z
        .number()
        .describe(
          'Logout prompt, optional.- 34：You have changed your login password, please log in again.- 35：Your login status has expired, please log in again. - 36：Your password has expired. Please use the Forgot Password function on the login page to change your password and log in again',
        )
        .optional(),
      sid: z
        .string()
        .describe('The session that needs to be logged out accurately, required when logout_type = 3')
        .optional(),
    }),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const passportV1SessionQuery = {
  project: 'passport',
  name: 'passport.v1.session.query',
  sdkName: 'passport.v1.session.query',
  path: '/open-apis/passport/v1/sessions/query',
  httpMethod: 'POST',
  description:
    "[Feishu/Lark]-Authenticate and Authorize-Login state management-Obtain desensitized user login information in batches-This interface is used to query the user's login information",
  accessTokens: ['tenant'],
  schema: {
    data: z.object({ user_ids: z.array(z.string()).describe('User ID').optional() }).optional(),
    params: z
      .object({ user_id_type: z.enum(['open_id', 'union_id', 'user_id']).describe('User ID type').optional() })
      .optional(),
  },
};
export const passportV1Tools = [passportV1SessionLogout, passportV1SessionQuery];
