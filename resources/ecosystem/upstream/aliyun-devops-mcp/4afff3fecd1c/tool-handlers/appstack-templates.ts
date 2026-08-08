import { z } from 'zod';
import { 
  searchAppTemplates,
  SearchAppTemplatesRequestSchema
} from '../operations/appstack/appTemplates.js';

/**
 * Handle the appstack template tool requests
 * 
 * @param request - The tool request
 * @returns The tool response or null if not handled
 */
export async function handleAppStackTemplateTools(request: any) {
  switch (request.params.name) {
    case 'search_app_templates':
      const searchParams = SearchAppTemplatesRequestSchema.parse(request.params.arguments);
      const searchResult = await searchAppTemplates(searchParams);
      return {
        content: [{ type: "text", text: JSON.stringify(searchResult, null, 2) }],
      };
      
    default:
      return null;
  }
}