import * as tag from '../operations/flow/tag.js';
import * as types from '../common/types.js';

export const handleTagTools = async (request: any) => {
  switch (request.params.name) {
    case "create_tag": {
      const args = types.CreateTagSchema.parse(request.params.arguments);
      const tagId = await tag.createTagFunc(
        args.organizationId,
        args.name,
        args.color,
        args.flowTagGroupId
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ id: tagId }) }],
      };
    }

    case "create_tag_group": {
      const args = types.CreateTagGroupSchema.parse(request.params.arguments);
      const tagGroupId = await tag.createTagGroupFunc(
        args.organizationId,
        args.name
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ id: tagGroupId }) }],
      };
    }

    case "list_tag_groups": {
      const args = types.BaseTagSchema.parse(request.params.arguments);
      const tagGroups = await tag.listTagGroupsFunc(args.organizationId);
      return {
        content: [{ type: "text", text: JSON.stringify(tagGroups, null, 2) }],
      };
    }

    case "delete_tag_group": {
      const args = types.DeleteTagGroupSchema.parse(request.params.arguments);
      const result = await tag.deleteTagGroupFunc(
        args.organizationId,
        args.id
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result }) }],
      };
    }

    case "update_tag_group": {
      const args = types.UpdateTagGroupSchema.parse(request.params.arguments);
      const result = await tag.updateTagGroupFunc(
        args.organizationId,
        args.id,
        args.name
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result }) }],
      };
    }

    case "get_tag_group": {
      const args = types.GetTagGroupSchema.parse(request.params.arguments);
      const tagGroup = await tag.getTagGroupFunc(
        args.organizationId,
        args.id
      );
      return {
        content: [{ type: "text", text: JSON.stringify(tagGroup, null, 2) }],
      };
    }

    case "delete_tag": {
      const args = types.DeleteTagSchema.parse(request.params.arguments);
      const result = await tag.deleteTagFunc(
        args.organizationId,
        args.id
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result }) }],
      };
    }

    case "update_tag": {
      const args = types.UpdateTagSchema.parse(request.params.arguments);
      const result = await tag.updateTagFunc(
        args.organizationId,
        args.id,
        args.name,
        args.color,
        args.flowTagGroupId
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result }) }],
      };
    }

    default:
      return null;
  }
};