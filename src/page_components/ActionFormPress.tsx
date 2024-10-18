import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { FlaskConical } from "lucide-react";
import { useState, useEffect, useContext } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import JSADBClient from "@/services/JSADBClient";
import { Separator } from "@/components/ui/separator";
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { WorkflowContext } from "@/contexts/WorkflowContext";

export default function ActionFormPress() {
  const { workflow, setWorkflow, currentActionId } = useContext(WorkflowContext);
  const action = currentActionId ? workflow.data[currentActionId] : {}
  const actionData = action.data?.action || {}
  const [packageName, setPackageName] = useState<string>(actionData.packageName || '');
  const [open, setOpen] = useState(false);
  const [installedApps, setInstalledApps] = useState<string[]>([]);
  const device = useSelector((state: RootState) => state.devices.currentDevice);
  const jsadb = new JSADBClient();
  const [selectedButton, setSelectedButton] = useState<string>(actionData.button || '');

  useEffect(() => {
    if (device) {
      fetchInstalledApps();
    }
  }, [device]);

  const fetchInstalledApps = async () => {
    if (device) {
      try {
        const { result } = await jsadb.listInstalledApps(device.id, false);
        console.log("result: ", result);
        setInstalledApps(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error("Error fetching installed apps:", error);
        setInstalledApps([]);
      }
    }
  };

  const handleTestClick = async () => {
    if (!device || !selectedButton) {
      console.error("Device or button is missing");
      return;
    }

    try {
      let result;
      switch (selectedButton) {
        case 'back':
          result = await jsadb.runCommand(`input keyevent 4`, device.id);
          break;
        case 'home':
          result = await jsadb.goToHome(device.id);
          break;
        case 'menu':
          result = await jsadb.runCommand(`input keyevent 187`, device.id);
          break;
        default:
          throw new Error("Invalid action selected");
      }
      console.log(`Button ${selectedButton} successfully:`, result);
      // You might want to add some user feedback here
    } catch (error) {
      console.error(`Error pressing ${selectedButton} button:`, error);
      // You might want to show an error message to the user here
    }
  };

  function handleButtonChange(value: string): void {
    setSelectedButton(value)
    setWorkflow((prev: any) => {
      return {
        ...prev, 
        data: {
          ...prev.data, [currentActionId]: {
            ...prev.data[currentActionId], data: {
              ...prev.data[currentActionId].data, 
              action: {
                ...prev.data[currentActionId].data.action,
                button: value
              }
            }
          }
        }
      }
    })
  }

  return (
    <div>
      <Separator className="mb-5" />
      <div className="flex flex-col gap-4 grow">
        <div className="flex flex-col gap-2">
          <Label className="pb-2">
            Action Properties
          </Label>
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2 items-center">
              <Label htmlFor="content">
                Button
              </Label>
              <div className="flex gap-2 items-center justify-between w-full">
                <Select onValueChange={handleButtonChange} value={selectedButton}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a button" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="back">Back</SelectItem>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="menu">Menu</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 gap-2"
                onClick={handleTestClick}
              >
                <FlaskConical className="h-3.5 w-5" />
                <span className="lg:sr-only xl:not-sr-only xl:whitespace-nowrap">
                  Test
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}