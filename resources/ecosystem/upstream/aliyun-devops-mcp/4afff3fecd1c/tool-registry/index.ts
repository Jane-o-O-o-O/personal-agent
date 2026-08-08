import { defaultToolsetManager } from '../common/toolsetManager.js';
import { Toolset } from '../common/toolsets.js';

// 保持向后兼容的接口
export const getAllTools = () => defaultToolsetManager.getAllTools();

// 新增按工具集获取工具的接口
export const getToolsByToolset = (toolsetName: Toolset) => defaultToolsetManager.getToolsByToolset(toolsetName);

// 新增获取启用工具的接口
export const getEnabledTools = (enabledToolsets: Toolset[]) => defaultToolsetManager.getEnabledTools(enabledToolsets);