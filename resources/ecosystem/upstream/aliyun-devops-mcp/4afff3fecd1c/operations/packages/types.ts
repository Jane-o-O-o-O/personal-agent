import { z } from "zod";

// Package Repository related schemas
export const PackageRepositorySchema = z.object({
  accessLevel: z.string().nullable().optional().describe("Access level: PRIVATE - Private repository (only accessible to repository members), INTERNAL - Organization-wide visibility (accessible to all organization members)"),
  latestUpdate: z.number().int().nullable().optional().describe("Latest update time in milliseconds"),
  repoCategory: z.string().nullable().optional().describe("Repository mode: Hybrid/Local/Proxy/ProxyCache/Group"),
  repoDesc: z.string().nullable().optional().describe("Repository description"),
  repoDescriptor: z.string().nullable().optional().describe("Repository descriptor file"),
  repoId: z.string().nullable().optional().describe("Repository ID"),
  repoName: z.string().nullable().optional().describe("Repository name"),
  repoType: z.string().nullable().optional().describe("Repository type: GENERIC/DOCKER/MAVEN/NPM/NUGET"),
  star: z.boolean().nullable().optional().describe("Whether the repository is favorited"),
});

export const ListPackageRepositoriesSchema = z.object({
  organizationId: z.string().describe("Organization ID"),
  repoTypes: z.string().optional().describe("Repository types, available values: GENERIC/DOCKER/MAVEN/NPM/NUGET, multiple types can be separated by commas"),
  repoCategories: z.string().optional().describe("Repository modes, available values: Hybrid/Local/Proxy/ProxyCache/Group, multiple modes can be separated by commas"),
  perPage: z.number().int().optional().default(8).describe("Number of items per page, default value is 8"),
  page: z.number().int().optional().default(1).describe("Current page number"),
});

// Artifact related schemas
export const ArtifactVersionSchema = z.object({
  createTime: z.number().int().nullable().optional().describe("Creation time in milliseconds"),
  creator: z.string().nullable().optional().describe("Creator"),
  gmtDownload: z.number().int().nullable().optional().describe("Latest download time in milliseconds"),
  id: z.number().int().nullable().optional().describe("Artifact version ID"),
  modifier: z.string().nullable().optional().describe("Modifier"),
  updateTime: z.number().int().nullable().optional().describe("Modification time in milliseconds"),
  version: z.string().nullable().optional().describe("Version number"),
});

export const ArtifactSchema = z.object({
  downloadCount: z.number().int().nullable().optional().describe("Download count"),
  gmtDownload: z.number().int().nullable().optional().describe("Latest download time in milliseconds"),
  id: z.number().int().nullable().optional().describe("Artifact ID"),
  latestUpdate: z.number().int().nullable().optional().describe("Latest update time in milliseconds"),
  module: z.string().nullable().optional().describe("Module name"),
  organization: z.string().nullable().optional().describe("Organization information"),
  repositoryId: z.string().nullable().optional().describe("Repository ID"),
  versions: z.array(ArtifactVersionSchema).nullable().optional().describe("Version list"),
});

export const ListArtifactsSchema = z.object({
  organizationId: z.string().describe("Organization ID"),
  repoId: z.string().describe("Repository ID"),
  repoType: z.string().describe("Repository type, available values: GENERIC/DOCKER/MAVEN/NPM/NUGET"),
  page: z.number().int().optional().default(1).describe("Current page number"),
  perPage: z.number().int().optional().default(8).describe("Number of items per page, default is 10"),
  search: z.string().optional().describe("Search by package name"),
  orderBy: z.string().optional().default("latestUpdate").describe("Sort method: latestUpdate - by latest update time in milliseconds; gmtDownload - by latest download time in milliseconds"),
  sort: z.string().optional().default("desc").describe("Sort order: asc - ascending; desc - descending"),
});

export const GetArtifactSchema = z.object({
  organizationId: z.string().describe("Organization ID"),
  repoId: z.string().describe("Repository ID"),
  id: z.number().int().describe("Artifact ID, can be obtained from ListArtifacts API"),
  repoType: z.string().describe("Repository type, available values: GENERIC/DOCKER/MAVEN/NPM/NUGET/PYPI"),
});

// Type exports
export type PackageRepository = z.infer<typeof PackageRepositorySchema>;
export type Artifact = z.infer<typeof ArtifactSchema>;