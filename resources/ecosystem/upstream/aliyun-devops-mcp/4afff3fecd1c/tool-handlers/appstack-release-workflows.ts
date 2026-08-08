import { 
  listSystemAllReleaseWorkflows,
  createSystemReleaseWorkflows,
  updateSystemReleaseStage,
  executeReleaseStage,
  ListSystemAllReleaseWorkflowsRequestSchema,
  CreateSystemReleaseWorkflowsRequestSchema,
  UpdateSystemReleaseStageRequestSchema,
  ExecuteReleaseStageRequestSchema
} from '../operations/appstack/releaseWorkflows.js';

/**
 * Handle the appstack release workflow tool requests (system level)
 * 
 * @param request - The tool request
 * @returns The tool response or null if not handled
 */
export async function handleAppStackReleaseWorkflowTools(request: any) {
  switch (request.params.name) {
    case 'list_system_release_workflows':
      const listParams = ListSystemAllReleaseWorkflowsRequestSchema.parse(request.params.arguments);
      const listResult = await listSystemAllReleaseWorkflows(listParams);
      return {
        content: [{ type: "text", text: JSON.stringify(listResult, null, 2) }],
      };
      
    case 'create_system_release_workflow':
      const createParams = CreateSystemReleaseWorkflowsRequestSchema.parse(request.params.arguments);
      const createResult = await createSystemReleaseWorkflows(createParams);
      return {
        content: [{ type: "text", text: JSON.stringify(createResult, null, 2) }],
      };
      
    case 'update_system_release_stage':
      const updateParams = UpdateSystemReleaseStageRequestSchema.parse(request.params.arguments);
      const updateResult = await updateSystemReleaseStage(updateParams);
      return {
        content: [{ type: "text", text: JSON.stringify(updateResult, null, 2) }],
      };
      
    case 'execute_system_release_stage':
      const executeParams = ExecuteReleaseStageRequestSchema.parse(request.params.arguments);
      const executeResult = await executeReleaseStage(executeParams);
      return {
        content: [{ type: "text", text: JSON.stringify(executeResult, null, 2) }],
      };
      
    default:
      return null;
  }
}

