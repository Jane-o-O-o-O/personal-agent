import * as resourceMember from '../operations/flow/resourceMember.js';
import * as types from '../common/types.js';

export const handleResourceMemberTools = async (request: any) => {
  switch (request.params.name) {
    case "delete_resource_member": {
      const args = types.DeleteResourceMemberSchema.parse(request.params.arguments);
      const result = await resourceMember.deleteResourceMemberFunc(
        args.organizationId,
        args.resourceType,
        args.resourceId,
        args.userId
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result }) }],
      };
    }

    case "list_resource_members": {
      const args = types.ResourceMemberBaseSchema.parse(request.params.arguments);
      const members = await resourceMember.listResourceMembersFunc(
        args.organizationId,
        args.resourceType,
        args.resourceId
      );
      return {
        content: [{ type: "text", text: JSON.stringify(members, null, 2) }],
      };
    }

    case "update_resource_member": {
      const args = types.UpdateResourceMemberSchema.parse(request.params.arguments);
      const result = await resourceMember.updateResourceMemberFunc(
        args.organizationId,
        args.resourceType,
        args.resourceId,
        args.roleName,
        args.userId
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result }) }],
      };
    }

    case "create_resource_member": {
      const args = types.CreateResourceMemberSchema.parse(request.params.arguments);
      const result = await resourceMember.createResourceMemberFunc(
        args.organizationId,
        args.resourceType,
        args.resourceId,
        args.roleName,
        args.userId
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result }) }],
      };
    }

    case "update_resource_owner": {
      const args = types.UpdateResourceOwnerSchema.parse(request.params.arguments);
      const result = await resourceMember.updateResourceOwnerFunc(
        args.organizationId,
        args.resourceType,
        args.resourceId,
        args.newOwnerId
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result }) }],
      };
    }

    default:
      return null;
  }
};