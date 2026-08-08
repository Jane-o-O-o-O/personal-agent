import { 
  createGlobalVar,
  getGlobalVar,
  updateGlobalVar,
  listGlobalVars,
  CreateGlobalVarRequestSchema,
  GetGlobalVarRequestSchema,
  UpdateGlobalVarRequestSchema,
  ListGlobalVarsRequestSchema
} from '../operations/appstack/globalVars.js';

/**
 * Handle the appstack global variables tool requests
 * 
 * @param request - The tool request
 * @returns The tool response or null if not handled
 */
export async function handleAppStackGlobalVarTools(request: any) {
  switch (request.params.name) {
    case 'create_global_var':
      const createParams = CreateGlobalVarRequestSchema.parse(request.params.arguments);
      const createResult = await createGlobalVar(createParams);
      return {
        content: [{ type: "text", text: JSON.stringify(createResult, null, 2) }],
      };
      
    case 'get_global_var':
      const getParams = GetGlobalVarRequestSchema.parse(request.params.arguments);
      const getResult = await getGlobalVar(getParams);
      return {
        content: [{ type: "text", text: JSON.stringify(getResult, null, 2) }],
      };
      
    case 'update_global_var':
      const updateParams = UpdateGlobalVarRequestSchema.parse(request.params.arguments);
      const updateResult = await updateGlobalVar(updateParams);
      return {
        content: [{ type: "text", text: JSON.stringify(updateResult, null, 2) }],
      };
      
    case 'list_global_vars':
      const listParams = ListGlobalVarsRequestSchema.parse(request.params.arguments);
      const listResult = await listGlobalVars(listParams);
      return {
        content: [{ type: "text", text: JSON.stringify(listResult, null, 2) }],
      };
      
    default:
      return null;
  }
}