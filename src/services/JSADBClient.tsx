import { Device } from "../types/Device";

class JSADBClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:9744') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, value));
    
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json()
  }

  async runCommand(command: string, device: string): Promise<any> {
    return this.request<any>('/run-command', { command: encodeURIComponent(command), device });
  }

  async getDeviceList(): Promise<Device[]> {
    const response = await this.request<string[]>('/get-device-list');
    const devices: Device[] = response.map((id: string) => ({ id, deviceId: id, name: `Device ${id}` }));
    return devices;
  }

  async tap(x: number, y: number, device: string): Promise<any> {
    return this.request<any>('/tap', { x: x.toString(), y: y.toString(), device });
  }

  async swipe(xPoint1: number, yPoint1: number, xPoint2: number, yPoint2: number, durationInMs: number, device: string): Promise<any> {
    return this.request<any>('/swipe', {
      xPoint1: xPoint1.toString(),
      yPoint1: yPoint1.toString(),
      xPoint2: xPoint2.toString(),
      yPoint2: yPoint2.toString(),
      durationInMs: durationInMs.toString(),
      device
    });
  }

  async type(text: string, device: string): Promise<any> {
    return this.request<any>('/type', { text, device });
  }

  async screenshot(deviceId: string): Promise<any> {
    return this.request<any>('/screenshot', { device: deviceId });
  }

  async dumpWindowXML(device: string): Promise<any> {
    return this.request<any>('/dump-window-xml', { device });
  }

  async existsInDump(query: string, prop: string): Promise<any> {
    return this.request<any>('/exists-in-dump', { query, prop });
  }

  async getResolution(device: string): Promise<any> {
    return this.request<any>('/get-resolution', { device });
  }

  async listInstalledApps(device: string, includeSystemApps: boolean = false): Promise<any> {
    return this.request<any>('/list-installed-apps', { device, includeSystemApps: includeSystemApps.toString() });
  }

  async appExists(appPackageName: string, device: string): Promise<any> {
    return this.request<any>('/app-exists', { appPackageName, device });
  }

  async clearAppCache(appPackageName: string, device: string): Promise<any> {
    return this.request<any>('/clear-app-cache', { appPackageName, device });
  }

  async openApp(appPackageName: string, device: string): Promise<any> {
    return this.request<any>('/open-app', { appPackageName, device });
  }

  async installApp(appPath: string, device: string): Promise<any> {
    return this.request<any>('/install-app', { appPath, device });
  }

  async goToHome(device: string): Promise<any> {
    return this.request<any>('/go-to-home', { device });
  }

  async connectDevice(device: string): Promise<any> {
    return this.request<any>('/connect-device', { device });
  }

  async wait(time: number): Promise<any> {
    return this.request<any>('/wait', { time: time.toString() });
  }

  async getBatteryDetails(device: string): Promise<any> {
    return this.request<any>('/battery-details', { device });
  }

  async serviceCheck(service: string, device: string): Promise<any> {
    return this.request<any>('/service-check', { service, device });
  }

  async findNearestNode(device: string, x: number, y: number): Promise<any> {
    return this.request<any>('/find-nearest-node', { x: x.toString(), y: y.toString(), device });
  }

  async findNodeByXPath(xpath: string, device: string): Promise<any> {
    return this.request<any>('/find-node-by-xpath', { xpath, device });
  }

  async getCurrentInputText(device: string): Promise<any> {
    return this.request<any>('/get-current-input-text', { device });
  }

  async clearCurrentInput(device: string, currentText: string | null = null): Promise<any> {
    const params: Record<string, string> = { device };
    if (currentText) {
      params.currentText = currentText;
    }
    return this.request<any>('/clear-current-input', params);
  }

  async screenAwake(device: string, isOn: boolean): Promise<any> {
    return this.request<any>('/screen-awake', { device, isOn: isOn.toString() });
  }
}

export default JSADBClient;
