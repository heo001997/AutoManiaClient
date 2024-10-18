import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { Button } from "@/components/ui/button"
import { ArrowBigLeft, House, LayoutGrid, Sun, X } from "lucide-react"
import { Device } from '@/types/Device';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { addDevice, setCurrentDevice } from '@/store/slices/devicesSlice';
import { RootState } from '@/store';
import JSADBClient from '@/services/JSADBClient';
import Draggable from 'react-draggable';

interface ScreenMirrorProps {
  device: Device;
  wrapperClassName?: string;
  onClose?: () => void;
}

const ScreenMirror: React.FC<ScreenMirrorProps> = ({ device, wrapperClassName, onClose }) => {
  const [keepScreenOnActive, setKeepScreenOnActive] = useState(false);
  const jsadb = new JSADBClient();
  const nodeRef = useRef(null);

  const dispatch = useAppDispatch();
  const devices = useAppSelector((state: RootState) => state.devices.devices);
  const availableDevices = devices.map((device: Device) => (
    <SelectItem key={device.id} value={device.id}>{device.name}</SelectItem>
  ));

  const handleKeepScreenOnToggle = async (isPressed: boolean) => {
    setKeepScreenOnActive(isPressed);
    if (device) {
      try {
        const jsadbClient = new JSADBClient();
        const response = await jsadbClient.screenAwake(device.id, isPressed);
        if (!response.success) {
          console.error(`Failed to keep screen on: ${response.error}`);
          setKeepScreenOnActive(!isPressed); // Revert the state if the API call fails
        } else {
          console.log('Keep screen on command sent successfully');
        }
      } catch (error) {
        console.error('Error sending keep screen on command:', error);
        setKeepScreenOnActive(!isPressed); // Revert the state if there's an error
      }
    }
  };
    
  const updateScreencapMirror = (url: string) => {
    const cardContent = document.querySelector('.screencap-mirror');
    if (cardContent) {
      // Clear existing content
      cardContent.innerHTML = '';
      
      // Create and append an iframe for the screencap mirror
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.style.border = 'none';
      iframe.style.width = '100%';
      
      // Set initial height
      iframe.style.height = '100%';
      
      // Append the iframe to get its dimensions
      cardContent.appendChild(iframe);
      
      // Function to update iframe height
      const updateHeight = () => {
        const width = iframe.offsetWidth;
        const height = Math.round(width / 0.57);
        iframe.style.height = `${height}px`;
      };
      
      // Update height initially and on window resize
      updateHeight();
      window.addEventListener('resize', updateHeight);
      
      // Center the iframe
      iframe.style.display = 'block';
      iframe.style.marginLeft = 'auto';
      iframe.style.marginRight = 'auto';
    }
  };

  const handleDeviceChange = () => {
    dispatch(setCurrentDevice(device));
    if (!device) return;
    
    // Construct the screencap mirror URL
    const baseUrl = 'localhost:9745';
    const params = new URLSearchParams({
      action: 'stream',
      udid: device.deviceId,
      player: 'broadway',
      ws: `ws://${baseUrl}/?action=proxy-adb&remote=tcp:8886&udid=${device.deviceId}`
    });
    const screencapUrl = `http://${baseUrl}/#!${params.toString()}`;
    
    // Update the screencap mirror
    updateScreencapMirror(screencapUrl);
  };

  const handleBackClick = async () => {
    if (device) {
      await jsadb.runCommand(`input keyevent 4`, device.id);
    }
  };

  const handleHomeClick = async () => {
    if (device) {
      await jsadb.goToHome(device.id);
    }
  };

  const handleMenuClick = async () => {
    if (device) {
      await jsadb.runCommand(`input keyevent 187`, device.id);
    }
  };

  useEffect(() => {
    handleDeviceChange();
  }, [device]);

  return (
    <Draggable handle=".drag-handle" nodeRef={nodeRef}>
      <div ref={nodeRef} className={`min-w-[350px] max-w-[500px] xl:min-w-[320px] 2xl:min-w-[450px] ${wrapperClassName}`}>
        <Card className="overflow-hidden" x-chunk="dashboard-05-chunk-4">
          <CardHeader className="bg-muted/50 p-4 drag-handle cursor-move">
            <div className="flex justify-between items-center">
              <div className="flex gap-1 items-center">
                <Select 
                  onValueChange={handleDeviceChange}
                  value={device?.deviceId}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a device" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {availableDevices}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Toggle
                  size="sm"
                  pressed={keepScreenOnActive}
                  onPressedChange={handleKeepScreenOnToggle}
                  variant="outline"
                  className={`flex items-center gap-2 h-8 px-2 ${
                    keepScreenOnActive
                      ? 'bg-accent text-accent-foreground border-2 border-dashed'
                      : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
                    Awake
                  </span>
                </Toggle>
                {onClose && (
                  <Button variant="outline" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 screencap-mirror text-sm">
            {/* The screencap mirror will be inserted here by the updateScreencapMirror function */}
          </CardContent>
          <CardFooter className="flex flex-col justify-center border-t bg-muted/50 px-6 py-3">
            <div>
              <div className="flex justify-center gap-1">
                <Button size="sm" variant="outline" className="h-8 gap-2" onClick={handleBackClick}>
                  <ArrowBigLeft className="h-3.5 w-3.5" />
                  <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
                    Back
                  </span>
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleHomeClick}>
                  <House className="h-3.5 w-3.5" />
                  <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
                    Home
                  </span>
                </Button>
                <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleMenuClick}>
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
                    Menu
                  </span>
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </Draggable>
  );
};

export default ScreenMirror;
