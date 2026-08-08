import * as effort from '../operations/projex/effort.js';
import * as types from '../common/types.js';

export const handleEffortTools = async (request: any) => {
  switch (request.params.name) {
    case "list_current_user_effort_records": {
      const args = types.ListCurrentUserEffortRecordsSchema.parse(request.params.arguments);
      const effortRecords = await effort.listCurrentUserEffortRecords({
        organizationId: args.organizationId,
        startDate: args.startDate,
        endDate: args.endDate
      });
      return {
        content: [{ type: "text", text: JSON.stringify(effortRecords, null, 2) }],
      };
    }

    case "list_effort_records": {
      const args = types.ListEffortRecordsSchema.parse(request.params.arguments);
      const effortRecords = await effort.listEffortRecords({
        id: args.id,
        organizationId: args.organizationId
      });
      return {
        content: [{ type: "text", text: JSON.stringify(effortRecords, null, 2) }],
      };
    }

    case "create_effort_record": {
      const args = types.CreateEffortRecordSchema.parse(request.params.arguments);
      const result = await effort.createEffortRecord({
        id: args.id,
        organizationId: args.organizationId,
        actualTime: args.actualTime,
        description: args.description,
        gmtEnd: args.gmtEnd,
        gmtStart: args.gmtStart,
        operatorId: args.operatorId,
        workType: args.workType
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

    case "list_estimated_efforts": {
      const args = types.ListEstimatedEffortsSchema.parse(request.params.arguments);
      const estimatedEfforts = await effort.listEstimatedEfforts({
        id: args.id,
        organizationId: args.organizationId
      });
      return {
        content: [{ type: "text", text: JSON.stringify(estimatedEfforts, null, 2) }],
      };
    }

    case "create_estimated_effort": {
      const args = types.CreateEstimatedEffortSchema.parse(request.params.arguments);
      const result = await effort.createEstimatedEffort({
        id: args.id,
        organizationId: args.organizationId,
        description: args.description,
        operatorId: args.operatorId,
        owner: args.owner,
        spentTime: args.spentTime,
        workType: args.workType
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

    case "update_effort_record": {
      const args = types.UpdateEffortRecordSchema.parse(request.params.arguments);
      await effort.updateEffortRecord({
        organizationId: args.organizationId,
        workitemId: args.workitemId,
        id: args.id,
        actualTime: args.actualTime,
        description: args.description,
        gmtEnd: args.gmtEnd,
        gmtStart: args.gmtStart,
        operatorId: args.operatorId,
        workType: args.workType
      });
      return {
        content: [{ type: "text", text: "Effort record updated successfully" }],
      };
    }

    case "update_estimated_effort": {
      const args = types.UpdateEstimatedEffortSchema.parse(request.params.arguments);
      await effort.updateEstimatedEffort({
        organizationId: args.organizationId,
        workitemId: args.workitemId,
        id: args.id,
        description: args.description,
        operatorId: args.operatorId,
        owner: args.owner,
        spentTime: args.spentTime,
        workType: args.workType
      });
      return {
        content: [{ type: "text", text: "Estimated effort updated successfully" }],
      };
    }

    default:
      return null;
  }
};