import * as vmDeployOrder from '../operations/flow/vmDeployOrder.js';
import * as types from '../common/types.js';

export const handleVMDeployOrderTools = async (request: any) => {
  switch (request.params.name) {
    case "stop_vm_deploy_order": {
      const args = types.StopVMDeployOrderSchema.parse(request.params.arguments);
      const result = await vmDeployOrder.stopVMDeployOrderFunc(
        args.organizationId,
        args.pipelineId,
        args.deployOrderId
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result }) }],
      };
    }

    case "skip_vm_deploy_machine": {
      const args = types.SkipVMDeployMachineSchema.parse(request.params.arguments);
      const result = await vmDeployOrder.skipVMDeployMachineFunc(
        args.organizationId,
        args.pipelineId,
        args.deployOrderId,
        args.machineSn
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result }) }],
      };
    }

    case "retry_vm_deploy_machine": {
      const args = types.RetryVMDeployMachineSchema.parse(request.params.arguments);
      const result = await vmDeployOrder.retryVMDeployMachineFunc(
        args.organizationId,
        args.pipelineId,
        args.deployOrderId,
        args.machineSn
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result }) }],
      };
    }

    case "resume_vm_deploy_order": {
      const args = types.ResumeVMDeployOrderSchema.parse(request.params.arguments);
      const result = await vmDeployOrder.resumeVMDeployOrderFunc(
        args.organizationId,
        args.pipelineId,
        args.deployOrderId
      );
      return {
        content: [{ type: "text", text: JSON.stringify({ success: result }) }],
      };
    }

    case "get_vm_deploy_order": {
      const args = types.GetVMDeployOrderSchema.parse(request.params.arguments);
      const deployOrder = await vmDeployOrder.getVMDeployOrderFunc(
        args.organizationId,
        args.pipelineId,
        args.deployOrderId
      );
      return {
        content: [{ type: "text", text: JSON.stringify(deployOrder, null, 2) }],
      };
    }

    case "get_vm_deploy_machine_log": {
      const args = types.GetVMDeployMachineLogSchema.parse(request.params.arguments);
      const log = await vmDeployOrder.getVMDeployMachineLogFunc(
        args.organizationId,
        args.pipelineId,
        args.deployOrderId,
        args.machineSn
      );
      return {
        content: [{ type: "text", text: JSON.stringify(log, null, 2) }],
      };
    }

    default:
      return null;
  }
};