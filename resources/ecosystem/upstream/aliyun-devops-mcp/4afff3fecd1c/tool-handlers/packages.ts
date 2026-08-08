import * as packageRepositories from '../operations/packages/repositories.js';
import * as artifacts from '../operations/packages/artifacts.js';
import * as types from '../common/types.js';

export const handlePackageManagementTools = async (request: any) => {
  switch (request.params.name) {
    // Package Repository Operations
    case "list_package_repositories": {
      const args = types.ListPackageRepositoriesSchema.parse(request.params.arguments);
      const packageRepoList = await packageRepositories.listPackageRepositoriesFunc(
        args.organizationId,
        args.repoTypes ?? undefined,
        args.repoCategories ?? undefined,
        args.perPage,
        args.page
      );
      return {
        content: [{ type: "text", text: JSON.stringify(packageRepoList, null, 2) }],
      };
    }

    // Package Artifact Operations
    case "list_artifacts": {
      const args = types.ListArtifactsSchema.parse(request.params.arguments);
      const artifactsList = await artifacts.listArtifactsFunc(
        args.organizationId,
        args.repoId,
        args.repoType,
        args.page,
        args.perPage,
        args.search ?? undefined,
        args.orderBy,
        args.sort
      );
      return {
        content: [{ type: "text", text: JSON.stringify(artifactsList, null, 2) }],
      };
    }
    
    case "get_artifact": {
      const args = types.GetArtifactSchema.parse(request.params.arguments);
      const artifact = await artifacts.getArtifactFunc(
        args.organizationId,
        args.repoId,
        args.id,
        args.repoType
      );
      return {
        content: [{ type: "text", text: JSON.stringify(artifact, null, 2) }],
      };
    }

    default:
      return null;
  }
};