import JSADBClient from "./JSADBClient";
import { Device } from "../types/Device";
import { templateMatchingWithNMS } from "./ImageFinder";

export default class ActionRunnerTouchService {
  private jsadb: JSADBClient;
  private action: object;
  private device: Device;

  constructor(action: object, device: Device) {
    this.jsadb = new JSADBClient();
    this.action = action;
    this.device = device;
  }

  async execute(): Promise<any> {
    try {
      const subType = this.action.subType;

      switch (subType) {
        case 'coordinate':
          return await this.touchByCoordinate();
        case 'xpath':
          return await this.touchByXPath();
        case 'text':
          return await this.touchByText();
        case 'image':
          return await this.touchByImage();
        default:
          throw new Error('Invalid action subType for tap operation');
      }
    } catch (error) {
      console.error("Unexpected error in ActionRunnerTouchService: ", error);
      return { success: false, error: error }
    }
  }

  private async touchByCoordinate(): Promise<{ success: boolean, result?: any, error?: any }> {
    const { x, y } = this.action;
    const tapResult = await this.jsadb.tap(x, y, this.device.id);

    return { success: true, result: tapResult.result }
  }

  private async touchByXPath(): Promise<{ success: boolean, result?: any, error?: any }> {
    const xpath = this.action.xpath;
    const { success, result, error } = await this.touchByNodeFinder(xpath, 'XPath');

    return { success, result, error }
  }

  private async touchByText(): Promise<{ success: boolean, result?: any, error?: any }> {
    const text = this.action.text;
    const XText = `//node[translate(@text,"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz") = "${text.toLowerCase()}"]`;
    const { success, result, error } = await this.touchByNodeFinder(XText, 'text');

    return { success, result, error }
  }

  private async touchByNodeFinder(selector: string, selectorType: string): Promise<{ success: boolean, result?: any, error?: any }> {
    try {
      const { result } = await this.jsadb.findNodeByXPath(selector, this.device.id);
      if (result) {
        const { centerX, centerY } = this.calculateNodeCenter(result.bounds);
        const tapResult = await this.jsadb.tap(centerX, centerY, this.device.id);
        return { success: true, result: tapResult.result }
      }
      return { success: false, result: `Unable to find element with the given ${selectorType}` }
    } catch (error) {
      console.error(`Error finding node by ${selectorType}:`, error);
      return { success: false, error: error }
    }
  }

  private calculateNodeCenter(bounds: string): { centerX: number, centerY: number } {
    const boundsMatch = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
    if (boundsMatch) {
      const [, left, top, right, bottom] = boundsMatch.map(Number);
      return {
        centerX: Math.round((left + right) / 2),
        centerY: Math.round((top + bottom) / 2)
      };
    }
    throw new Error('Invalid bounds format');
  }

  private async touchByImage(): Promise<{ success: boolean, result?: any, error?: any }> {
    const { image: targetImage, area: searchArea } = this.action;

    try {
      const targetDimensions = await this.getImageDimensions(targetImage);
      const screenshotDataUrl = await this.captureScreenshot();
      const results = await this.performTemplateMatching(screenshotDataUrl, targetImage, searchArea);

      if (results.length > 0) {
        const match = results[0];
        const centerX = Math.round(match.x + targetDimensions.width / 2);
        const centerY = Math.round(match.y + targetDimensions.height / 2);
        const tapResult = await this.jsadb.tap(centerX, centerY, this.device.id);
        return { success: true, result: tapResult.result }
      } else {
        return { success: false, result: 'Unable to find the target image on the screen' }
      }
    } catch (error) {
      console.error("Error in image-based touch:", error);
      return { success: false, error: error }
    }
  }

  private async getImageDimensions(imageSrc: string): Promise<{ width: number, height: number }> {
    // Convert base64 to Blob
    const base64Response = await fetch(imageSrc);
    const blob = await base64Response.blob();

    // Create ImageBitmap
    const bitmap = await createImageBitmap(blob);

    return { width: bitmap.width, height: bitmap.height };
  }

  private async captureScreenshot(): Promise<string> {
    const { result: screenshotBase64 } = await this.jsadb.screenshot(this.device.id);
    return `data:image/png;base64,${screenshotBase64}`;
  }

  private async performTemplateMatching(
    screenshotDataUrl: string,
    targetImage: string,
    searchArea: any
  ): Promise<any[]> {
    return templateMatchingWithNMS(
      screenshotDataUrl,
      targetImage,
      1, // matching numbers
      0.8, // threshold
      searchArea || null
    );
  }

}
