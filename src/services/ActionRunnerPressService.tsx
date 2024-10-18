import JSADBClient from "./JSADBClient";
import { Device } from "../types/Device";
import { templateMatchingWithNMS } from "./ImageFinder";

export default class ActionRunnerApkService {
  private jsadb: JSADBClient;
  private action: object;
  private device: Device;

  constructor(action: object, device: Device) {
    this.jsadb = new JSADBClient();
    this.action = action;
    this.device = device;
  }

  async execute(): Promise<{ success: boolean, result?: any, error?: any }> {
    try {
      const button = this.action.button;

      if (!button) throw new Error("No button provided for press action");

      if (button === 'back') {
        const result = await this.jsadb.runCommand(`input keyevent 4`, this.device.id);
        return { success: true, result: result.result };
      } else if (button === 'home') {
        const result = await this.jsadb.goToHome(this.device.id);
        return { success: true, result: result.result };
      } else if (button === 'menu') {
        const result = await this.jsadb.runCommand(`input keyevent 187`, this.device.id);
        return { success: true, result: result.result };
      } else {
        throw new Error("Invalid button provided for press action");
      }
    } catch (error) {
      console.error("Error running input action: ", error);
      return { success: false, error: error };
    }
  }
}
