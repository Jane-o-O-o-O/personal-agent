import { 
  getEnvVariableGroups,
  createVariableGroup,
  deleteVariableGroup,
  getVariableGroup,
  updateVariableGroup,
  getAppVariableGroups,
  getAppVariableGroupsRevision,
  GetEnvVariableGroupsRequestSchema,
  CreateVariableGroupRequestSchema,
  DeleteVariableGroupRequestSchema,
  GetVariableGroupRequestSchema,
  UpdateVariableGroupRequestSchema,
  GetAppVariableGroupsRequestSchema,
  GetAppVariableGroupsRevisionRequestSchema
} from '../operations/appstack/variableGroups.js';

/**
 * Handle the appstack variable groups tool requests
 * 
 * @param request - The tool request
 * @returns The tool response or null if not handled
 */
export async function handleAppStackVariableGroupTools(request: any) {
  switch (request.params.name) {
    case 'get_env_variable_groups':
      const getEnvParams = GetEnvVariableGroupsRequestSchema.parse(request.params.arguments);
      const getEnvResult = await getEnvVariableGroups(getEnvParams);
      return {
        content: [{ type: "text", text: JSON.stringify(getEnvResult, null, 2) }],
      };
      
    case 'create_variable_group':
      const createParams = CreateVariableGroupRequestSchema.parse(request.params.arguments);
      const createResult = await createVariableGroup(createParams);
      return {
        content: [{ type: "text", text: JSON.stringify(createResult, null, 2) }],
      };
      
    case 'delete_variable_group':
      const deleteParams = DeleteVariableGroupRequestSchema.parse(request.params.arguments);
      const deleteResult = await deleteVariableGroup(deleteParams);
      return {
        content: [{ type: "text", text: JSON.stringify(deleteResult, null, 2) }],
      };
      
    case 'get_variable_group':
      const getParams = GetVariableGroupRequestSchema.parse(request.params.arguments);
      const getResult = await getVariableGroup(getParams);
      return {
        content: [{ type: "text", text: JSON.stringify(getResult, null, 2) }],
      };
      
    case 'update_variable_group':
      const updateParams = UpdateVariableGroupRequestSchema.parse(request.params.arguments);
      const updateResult = await updateVariableGroup(updateParams);
      return {
        content: [{ type: "text", text: JSON.stringify(updateResult, null, 2) }],
      };
      
    case 'get_app_variable_groups':
      const getAppParams = GetAppVariableGroupsRequestSchema.parse(request.params.arguments);
      const getAppResult = await getAppVariableGroups(getAppParams);
      return {
        content: [{ type: "text", text: JSON.stringify(getAppResult, null, 2) }],
      };
      
    case 'get_app_variable_groups_revision':
      const getAppRevParams = GetAppVariableGroupsRevisionRequestSchema.parse(request.params.arguments);
      const getAppRevResult = await getAppVariableGroupsRevision(getAppRevParams);
      return {
        content: [{ type: "text", text: JSON.stringify(getAppRevResult, null, 2) }],
      };
      
    default:
      return null;
  }
}