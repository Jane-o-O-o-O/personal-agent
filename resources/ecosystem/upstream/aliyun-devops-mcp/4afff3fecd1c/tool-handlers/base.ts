import * as organization from '../operations/organization/organization.js';

export const handleBaseTools = async (request: any) => {
  switch (request.params.name) {
    case "get_current_organization_info": {
      const currentOrgInfo = await organization.getCurrentOrganizationInfoFunc();
      return {
        content: [{ type: "text", text: JSON.stringify(currentOrgInfo, null, 2) }],
      };
    }

    case "get_user_organizations": {
      const userOrgs = await organization.getUserOrganizationsFunc();
      return {
        content: [{ type: "text", text: JSON.stringify(userOrgs, null, 2) }],
      };
    }

    case "get_current_user": {
      const currentUserInfo = await organization.getCurrentUserFunc();
      return {
        content: [{ type: "text", text: JSON.stringify(currentUserInfo, null, 2) }],
      };
    }

    default:
      return null;
  }
};