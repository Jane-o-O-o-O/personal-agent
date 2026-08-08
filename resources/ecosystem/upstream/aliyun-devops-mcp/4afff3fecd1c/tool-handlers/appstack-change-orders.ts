import { z } from 'zod';
import { 
  createChangeOrder,
  listChangeOrderVersions,
  getChangeOrder,
  listChangeOrderJobLogs,
  findTaskOperationLog,
  executeJobAction,
  listChangeOrdersByOrigin,
  CreateChangeOrderRequestSchema,
  ListChangeOrderVersionsRequestSchema,
  GetChangeOrderRequestSchema,
  ListChangeOrderJobLogsRequestSchema,
  FindTaskOperationLogRequestSchema,
  ExecuteJobActionRequestSchema,
  ListChangeOrdersByOriginRequestSchema
} from '../operations/appstack/changeOrders.js';

/**
 * Handle the appstack change order tool requests
 * 
 * @param request - The tool request
 * @returns The tool response or null if not handled
 */
export async function handleAppStackChangeOrderTools(request: any) {
  switch (request.params.name) {
    case 'create_change_order':
      const createParams = CreateChangeOrderRequestSchema.parse(request.params.arguments);
      const createResult = await createChangeOrder(createParams);
      return {
        content: [{ type: "text", text: JSON.stringify(createResult, null, 2) }],
      };
      
    case 'list_change_order_versions':
      const listVersionsParams = ListChangeOrderVersionsRequestSchema.parse(request.params.arguments);
      const listVersionsResult = await listChangeOrderVersions(listVersionsParams);
      return {
        content: [{ type: "text", text: JSON.stringify(listVersionsResult, null, 2) }],
      };
      
    case 'get_change_order':
      const getParams = GetChangeOrderRequestSchema.parse(request.params.arguments);
      const getResult = await getChangeOrder(getParams);
      return {
        content: [{ type: "text", text: JSON.stringify(getResult, null, 2) }],
      };
      
    case 'list_change_order_job_logs':
      const listLogsParams = ListChangeOrderJobLogsRequestSchema.parse(request.params.arguments);
      const listLogsResult = await listChangeOrderJobLogs(listLogsParams);
      return {
        content: [{ type: "text", text: JSON.stringify(listLogsResult, null, 2) }],
      };
      
    case 'find_task_operation_log':
      const findLogParams = FindTaskOperationLogRequestSchema.parse(request.params.arguments);
      const findLogResult = await findTaskOperationLog(findLogParams);
      return {
        content: [{ type: "text", text: JSON.stringify(findLogResult, null, 2) }],
      };
      
    case 'execute_job_action':
      const executeParams = ExecuteJobActionRequestSchema.parse(request.params.arguments);
      const executeResult = await executeJobAction(executeParams);
      return {
        content: [{ type: "text", text: JSON.stringify(executeResult, null, 2) }],
      };
      
    case 'list_change_orders_by_origin':
      const listByOriginParams = ListChangeOrdersByOriginRequestSchema.parse(request.params.arguments);
      const listByOriginResult = await listChangeOrdersByOrigin(listByOriginParams);
      return {
        content: [{ type: "text", text: JSON.stringify(listByOriginResult, null, 2) }],
      };
      
    default:
      return null;
  }
}