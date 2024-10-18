import { Runner } from "@/types/Runner";
import { Device } from "../types/Device";
import ActionRunnerService from "./ActionRunnerService";

export default class WorkflowRunnerService {
  private workflow: object;
  private device: Device;
  private actions: object[];
  private runner: Runner;

  constructor(workflow: object, device: Device, runner: Runner) {
    this.workflow = workflow;
    this.device = device;
    this.actions = workflow.data || {};
    this.runner = runner;
  }

  async execute(): Promise<any> {
    try {
      console.log("runner: ", this.runner)
      console.log("this.workflow: ", this.workflow)
      console.log("actions: ", this.actions)
      const startNode = this.actions.start;
      console.log("startNode: ", startNode)

      const { success, result, error } = await this.runAllActions(startNode.data.successNode);
      return { success, result, error };
    } catch (error) {
      console.error("Error in execute", error);
      return { success: false, error: error };
    }
  }

  async runAllActions(actionId: string): Promise<{ success: boolean, result?: any, error?: any }> {
    try {
      const currentActionNode = this.actions[actionId];
      console.log("currentActionNode: ", currentActionNode)
      if (!currentActionNode) return { success: true, result: 'No more nextNode to execute, workflow finished!!!' }
      
      const currentAction = currentActionNode.data.action;
      const service = new ActionRunnerService(currentAction, this.device);
      const { success, result, error } = await service.execute();
      if (success) {
        const nextActionId = currentActionNode.data.successNode;
        console.log("Action executed successfully", result);
        console.log("To successNode with nextActionId: ", nextActionId)
        return this.runAllActions(nextActionId);
      } else {
        if (error) throw error;
        
        const nextActionId = currentActionNode.data.failedNode;
        console.error("Action executed failed", result);
        console.log("To failedNode with nextActionId: ", nextActionId)
        return this.runAllActions(nextActionId);
      }
    } catch (error) {
      console.error("Unexpected error in runAllActions", error);
      return { success: false, error: error };
    }
  }
}
