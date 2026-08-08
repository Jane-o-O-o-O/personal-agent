// 定义工具集枚举
export enum Toolset {
  BASE = "base",
  CODE_MANAGEMENT = "code-management",
  ORGANIZATION_MANAGEMENT = "organization-management",
  PROJECT_MANAGEMENT = "project-management",
  PIPELINE_MANAGEMENT = "pipeline-management",
  PACKAGES_MANAGEMENT = "packages-management",
  APPLICATION_DELIVERY = "application-delivery",
  TEST_MANAGEMENT = "test-management"
}

// 定义工具接口（与MCP SDK中的Tool接口兼容，但更宽松以适应zodToJsonSchema的输出）
export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    [key: string]: unknown;
    type: "object";
    properties?: { [key: string]: unknown };
    required?: string[];
  };
  title?: string;
  outputSchema?: {
    [key: string]: unknown;
    type: "object";
    properties?: { [key: string]: unknown };
    required?: string[];
  };
  annotations?: {
    [key: string]: unknown;
    title?: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
  };
  [key: string]: unknown;
}

// 定义工具集配置接口
export interface ToolsetConfig {
  name: Toolset;
  description: string;
  tools: () => Tool[];
}

// 定义工具集管理器接口
export interface ToolsetManager {
  getAllTools(): Tool[];
  getToolsByToolset(toolsetName: Toolset): Tool[];
  getEnabledTools(enabledToolsets: Toolset[]): Tool[];
}

// 默认启用的工具集
export const DEFAULT_ENABLED_TOOLSETS: Toolset[] = [
  Toolset.BASE,
  Toolset.CODE_MANAGEMENT,
  Toolset.ORGANIZATION_MANAGEMENT,
  Toolset.PROJECT_MANAGEMENT,
  Toolset.PIPELINE_MANAGEMENT,
  Toolset.PACKAGES_MANAGEMENT,
  Toolset.APPLICATION_DELIVERY,
  Toolset.TEST_MANAGEMENT
];