import { z } from 'zod';
import { 
  createAppTag,
  updateAppTag,
  searchAppTag,
  updateAppTagBind,
  CreateAppTagRequestSchema,
  UpdateAppTagRequestSchema,
  SearchAppTagRequestSchema,
  UpdateAppTagBindRequestSchema
} from '../operations/appstack/appTags.js';

/**
 * Handle the appstack tag tool requests
 * 
 * @param request - The tool request
 * @returns The tool response or null if not handled
 */
export async function handleAppStackTagTools(request: any) {
  switch (request.params.name) {
    case 'create_app_tag':
      const createParams = CreateAppTagRequestSchema.parse(request.params.arguments);
      const createResult = await createAppTag(createParams);
      return {
        content: [{ type: "text", text: JSON.stringify(createResult, null, 2) }],
      };
      
    case 'update_app_tag':
      const updateParams = UpdateAppTagRequestSchema.parse(request.params.arguments);
      const updateResult = await updateAppTag(updateParams);
      return {
        content: [{ type: "text", text: JSON.stringify(updateResult, null, 2) }],
      };
      
    case 'search_app_tags':
      const searchParams = SearchAppTagRequestSchema.parse(request.params.arguments);
      const searchResult = await searchAppTag(searchParams);
      return {
        content: [{ type: "text", text: JSON.stringify(searchResult, null, 2) }],
      };
      
    case 'update_app_tag_bind':
      const bindParams = UpdateAppTagBindRequestSchema.parse(request.params.arguments);
      await updateAppTagBind(bindParams);
      return {
        content: [{ type: "text", text: "Application tag bindings updated successfully" }],
      };
      
    default:
      return null;
  }
}