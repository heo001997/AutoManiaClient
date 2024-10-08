import React, { useEffect, useState } from "react";
import { ArrowBigLeft, CirclePlus, House, LayoutGrid, MoveDown, MoveLeft, MoveRight, RefreshCcw, Sun } from "lucide-react"
import Layout from '@/components/Layout';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ActionDialog } from "@/page_components/ActionDialog"
import { RootState } from '../store';
import { addDevice, setCurrentDevice } from '@/store/slices/devicesSlice';
import { Device } from '@/types/Device';
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import JSADBClient from "@/services/JSADBClient"
import { Toggle } from "@/components/ui/toggle"
import { useParams } from 'react-router-dom';
import { databaseService } from '@/services/DatabaseService';
import type { Workflow } from "@/types/Workflow";


export default function WorkflowDetail() {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [keepScreenOnActive, setKeepScreenOnActive] = useState(false);

  const dispatch = useAppDispatch();
  const devices = useAppSelector((state: RootState) => state.devices.devices);

  const availableDevices = devices.map((device: Device) => (
    <SelectItem key={device.id} value={device.id}>{device.name}</SelectItem>
  ));

  const handleDeviceChange = (deviceId: string) => {
    console.log("handleDeviceChange: ", deviceId);
    console.log("handleDeviceChange devices: ", devices);
    const device = devices.find((d: Device) => d.id === deviceId);
    if (device) {
      dispatch(setCurrentDevice(device));
      
      // Construct the screencap mirror URL
      const baseUrl = 'http://localhost:6173/';
      const params = new URLSearchParams({
        action: 'stream',
        udid: device.deviceId,
        player: 'broadway',
        ws: `ws://localhost:6173/?action=proxy-adb&remote=tcp:8886&udid=${device.deviceId}`
      });
      const screencapUrl = `${baseUrl}#!${params.toString()}`;
      
      // Update the screencap mirror
      updateScreencapMirror(screencapUrl);
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

  useEffect(() => {
    const jsadbClient = new JSADBClient();
    jsadbClient.getDeviceList().then((fetchedDevices) => {
      console.log("devices: ", fetchedDevices);
      fetchedDevices.forEach((device) => {
        dispatch(addDevice(device));
      });

      if (fetchedDevices.length === 1) {
        setSelectedDevice(fetchedDevices[0]);
        handleDeviceChange(fetchedDevices[0].id);
      }

      const storedCurrentDevice = localStorage.getItem('currentDevice');
      if (storedCurrentDevice) {
        const currentDevice = JSON.parse(storedCurrentDevice) as Device;
        handleDeviceChange(currentDevice.id);
      }
    });
  }, [devices]);

  const handleKeepScreenOnToggle = async (isPressed: boolean) => {
    setKeepScreenOnActive(isPressed);
    if (selectedDevice) {
      try {
        const jsadbClient = new JSADBClient();
        const response = await jsadbClient.screenAwake(selectedDevice.id, isPressed);
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

  useEffect(() => {
    if (id) {
      const fetchWorkflow = async () => {
        try {
          const fetchedWorkflow = await databaseService.getWorkflow(Number(id));
          if (fetchedWorkflow) {
            setWorkflow(fetchedWorkflow);
          }
        } catch (error) {
          console.error("Error fetching workflow:", error);
        }
      };
      fetchWorkflow();
    }
  }, [id]);

  const jsadb = new JSADBClient();

  const handleBackClick = async () => {
    if (selectedDevice) {
      await jsadb.runCommand(`input keyevent 4`);
    }
  };

  const handleHomeClick = async () => {
    if (selectedDevice) {
      await jsadb.goToHome(selectedDevice.id);
    }
  };

  const handleMenuClick = async () => {
    if (selectedDevice) {
      await jsadb.runCommand(`input keyevent 187`);
    }
  };

  if (!workflow) {
    return <div>Loading...</div>;
  }

  return (
    <Layout currentPage="Workflows">
      <ActionDialog open={openActionDialog} setOpen={setOpenActionDialog}/>
        <div className="max-w-[500px] xl:min-w-[320px] 2xl:min-w-[450px] ">
          <Card className="overflow-hidden" x-chunk="dashboard-05-chunk-4">
            <CardHeader className="bg-muted/50">
              <CardTitle className="group flex items-center gap-2 text-lg">
                Screencap
              </CardTitle>
              <div className="flex justify-center gap-1 items-center">
                <Select 
                  onValueChange={(value) => handleDeviceChange(value)}
                  value={selectedDevice?.deviceId}
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
                <div className="flex items-center space-x-2">
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
        <div className="w-full items-start gap-4">
          <Card className="sm:col-span-2" x-chunk="dashboard-05-chunk-0">
            <CardHeader className="pb-3">
              <CardTitle>
                Flow: {workflow.name}
              </CardTitle>
              <CardDescription className="max-w-lg text-balance leading-relaxed">
                Build your flow here
              </CardDescription>
              <Separator className="my-2" />
            </CardHeader>
            <CardContent className="flex flex-col items-center p-6 text-sm gap-2 flex-wrap">
              <div className="group flex justify-center items-center text-sm gap-2 flex-wrap">
                <Button className="w-32 hidden group-hover:block">Failed</Button>
                <MoveLeft className="hidden group-hover:block" />
                <Button className="w-32" onClick={() => setOpenActionDialog(true)}>On Step</Button>
                <MoveRight className="hidden group-hover:block"/>
                <Button className="w-32 hidden group-hover:block">Success</Button>
              </div>
              <div className="flex justify-center items-center text-sm gap-2 flex-wrap">
                <MoveDown/>
              </div>
              <div className="group flex justify-center items-center text-sm gap-2 flex-wrap">
                <Button className="w-32 hidden group-hover:block">Failed</Button>
                <MoveLeft className="hidden group-hover:block" />
                <Button className="w-32">Step</Button>
                <MoveRight className="hidden group-hover:block"/>
                <Button className="w-32 hidden group-hover:block">Success</Button>
              </div>
              <div className="flex justify-center items-center text-sm gap-2 flex-wrap">
                <MoveDown/>
              </div>
              <div className="group flex justify-center items-center text-sm gap-2 flex-wrap">
                <Button className="w-32 hidden group-hover:block">Failed</Button>
                <MoveLeft className="hidden group-hover:block" />
                <Button className="w-32"><CirclePlus className="w-4 h-4" /></Button>
                <MoveRight className="hidden group-hover:block"/>
                <Button className="w-32 hidden group-hover:block">Success</Button>
              </div>
            </CardContent>
            <CardFooter>
            </CardFooter>
          </Card>
        </div>
    </Layout>
  )
}