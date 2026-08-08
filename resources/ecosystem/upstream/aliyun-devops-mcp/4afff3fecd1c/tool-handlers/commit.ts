import { 
  listCommits,
  getCommit,
  createCommitComment,
  ListCommitsRequestSchema,
  GetCommitRequestSchema,
  CreateCommitCommentRequestSchema
} from '../operations/codeup/commits.js';

/**
 * Handle the commit tool requests
 * 
 * @param request - The tool request
 * @returns The tool response or null if not handled
 */
export async function handleCommitTools(request: any) {
  switch (request.params.name) {
    case 'list_commits':
      const listCommitsParams = ListCommitsRequestSchema.parse(request.params.arguments);
      const listCommitsResult = await listCommits(listCommitsParams);
      return {
        content: [{ type: "text", text: JSON.stringify(listCommitsResult, null, 2) }],
      };
      
    case 'get_commit':
      const getCommitParams = GetCommitRequestSchema.parse(request.params.arguments);
      const getCommitResult = await getCommit(getCommitParams);
      return {
        content: [{ type: "text", text: JSON.stringify(getCommitResult, null, 2) }],
      };
      
    case 'create_commit_comment':
      const createCommitCommentParams = CreateCommitCommentRequestSchema.parse(request.params.arguments);
      const createCommitCommentResult = await createCommitComment(createCommitCommentParams);
      return {
        content: [{ type: "text", text: JSON.stringify(createCommitCommentResult, null, 2) }],
      };
      
    default:
      return null;
  }
}