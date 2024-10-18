import { Device } from "../types/Device";
import ActionRunnerTouchService from "./ActionRunnerTouchService";
import ActionRunnerApkService from "./ActionRunnerApkService";
import ActionRunnerTypingService from "./ActionRunnerTypingService";
import ActionRunnerPressService from "./ActionRunnerPressService";

export default class ActionRunnerService {
  private action: object;
  private device: Device;

  constructor(action: object, device: Device) {
    this.action = action;
    this.device = device;
  }

  async execute(): Promise<{ success: boolean, result?: any, error?: any }> {
    try {
      const actionType = this.action.type

      let service;
      if (actionType === 'touch') {
        service = new ActionRunnerTouchService(this.action, this.device);
      } else if (actionType === 'typing') {
        service = new ActionRunnerTypingService(this.action, this.device);
      } else if (actionType === 'press') {
        service = new ActionRunnerPressService(this.action, this.device);
      } else if (actionType === 'apk') {
        service = new ActionRunnerApkService(this.action, this.device);
      } else if (actionType === 'wait') {
        service = this.createWaitService();
      } else {
        throw new Error('Invalid action type');
      }
      
      const { success, result, error } = await service.execute();
      return { success, result, error }
    } catch (error) {
      console.error("Unexpected error in ActionRunnerService: ", error);
      return { success: false, error: error };
    }
  }

  private createWaitService(): { execute: () => Promise<{ success: boolean }> } {
    const sleepTime = parseInt(this.action.sleepTime);
    if (isNaN(sleepTime) || sleepTime < 0) {
      throw new Error('Invalid sleep time for wait action');
    }
    return {
      execute: () => new Promise(resolve => setTimeout(() => resolve({ success: true }), sleepTime))
    };
  }
}
