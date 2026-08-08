import * as organization from '../operations/organization/organization.js';
import * as members from '../operations/organization/members.js';
import * as types from '../common/types.js';

export const handleOrganizationTools = async (request: any) => {
  switch (request.params.name) {

    case "list_organization_departments": {
      const args = types.GetOrganizationDepartmentsSchema.parse(request.params.arguments);
      const departments = await organization.getOrganizationDepartmentsFunc(
        args.organizationId,
        args.parentId ?? undefined
      );
      return {
        content: [{ type: "text", text: JSON.stringify(departments, null, 2) }],
      };
    }

    case "get_organization_department_info": {
      const args = types.GetOrganizationDepartmentInfoSchema.parse(request.params.arguments);
      const departmentInfo = await organization.getOrganizationDepartmentInfoFunc(
        args.organizationId,
        args.id
      )
      return {
        content: [{ type: "text", text: JSON.stringify(departmentInfo, null, 2) }],
      };
    }

    case "get_organization_department_ancestors": {
      const args = types.GetOrganizationDepartmentAncestorsSchema.parse(request.params.arguments);
      const ancestors = await organization.getOrganizationDepartmentAncestorsFunc(
        args.organizationId,
        args.id
      );
      return {
        content: [{ type: "text", text: JSON.stringify(ancestors, null, 2) }],
      };
    }

    case "list_organization_members": {
      const args = types.GetOrganizationMembersSchema.parse(request.params.arguments);
      const orgMembers = await members.getOrganizationMembersFunc(
        args.organizationId,
        args.page ?? 1,
        args.perPage ?? 100
      );
      return {
        content: [{ type: "text", text: JSON.stringify(orgMembers, null, 2)}]
      }
    }

    case "get_organization_member_info": {
      const args = types.GetOrganizationMemberInfoSchema.parse(request.params.arguments);
      const memberInfo = await members.getOrganizationMemberInfoFunc(
        args.organizationId,
        args.memberId
      );
      return {
        content: [{ type: "text", text: JSON.stringify(memberInfo, null, 2)}]
      }
    }

    case "get_organization_member_info_by_user_id": {
      const args = types.GetOrganizationMemberByUserIdInfoSchema.parse(request.params.arguments);
      const memberInfo = await members.getOrganizationMemberByUserIdInfoFunc(args.organizationId, args.userId);
      return {
        content: [{ type: "text", text: JSON.stringify(memberInfo, null, 2)}]
      }
    }

    case "search_organization_members": {
      const args = types.SearchOrganizationMembersSchema.parse(request.params.arguments);
      const membersResult = await members.searchOrganizationMembersFunc(
        args.organizationId,
        args.includeChildren ?? false,
        args.page ?? 1,
        args.perPage ?? 100,
        args.deptIds ?? undefined,
        args.nextToken ?? undefined,
        args.query ?? undefined,
        args.roleIds ?? undefined,
        args.statuses ?? undefined,
      )
      return {
        content: [{ type: "text", text: JSON.stringify(membersResult, null, 2)}]
      }
    }

    case "list_organization_roles": {
      const args = types.ListOrganizationRolesSchema.parse(request.params.arguments);
      const roles = await organization.listOrganizationRolesFunc(args.organizationId);
      return {
        content: [{ type: "text", text: JSON.stringify(roles, null, 2)}]
      }
    }

    case "get_organization_role": {
      const args = types.GetOrganizationRoleSchema.parse(request.params.arguments);
      const role = await organization.getOrganizationRoleFunc(
        args.organizationId,
        args.roleId
      );
      return {
        content: [{ type: "text", text: JSON.stringify(role, null, 2)}]
      }
    }

    default:
      return null;
  }
};