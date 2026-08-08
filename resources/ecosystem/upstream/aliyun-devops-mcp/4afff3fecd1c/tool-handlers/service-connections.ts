import * as serviceConnection from '../operations/flow/serviceConnection.js';
import * as types from '../common/types.js';

export const handleServiceConnectionTools = async (request: any) => {
  switch (request.params.name) {
    // Service Connection Operations
    case "list_service_connections": {
      const args = types.ListServiceConnectionsSchema.parse(request.params.arguments);
      const serviceConnections = await serviceConnection.listServiceConnectionsFunc(
        args.organizationId,
        args.serviceConnectionType
      );
      return {
        content: [{ type: "text", text: JSON.stringify(serviceConnections, null, 2) }],
      };
    }

    default:
      return null;
  }
};