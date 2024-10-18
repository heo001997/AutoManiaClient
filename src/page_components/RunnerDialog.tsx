import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Check, ChevronsUpDown, RefreshCcw, SaveIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { databaseService } from '@/services/DatabaseService'
import { Badge } from "@/components/ui/badge"
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { addRunner } from '@/store/slices/runnersSlice';
import RunnerFormObject from "./RunnerFormObject"
import { Runner, SerializableRunner } from "@/types/Runner"
import { CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Workflow } from "@/types/Workflow"
import { RootState } from '@/store/store';
import { Device } from '@/types/Device';

export interface RunnerDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  btnTitle?: string;
  runnerForm: Runner;
  setRunnerForm: (form: Runner, isSaved?: boolean) => void;
  devices: Device[];
  workflow: Workflow; // Add this line
  isHideWorkflow?: boolean;
}

export function RunnerDialog({
  open,
  setOpen,
  btnTitle,
  runnerForm,
  setRunnerForm,
  devices,
  workflow,
  isHideWorkflow,
}: RunnerDialogProps) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [openWorkflow, setOpenWorkflow] = useState(false);
  const dispatch = useAppDispatch();
  const [openDevice, setOpenDevice] = useState(false);

  useEffect(() => {
    const fetchWorkflows = async () => {
      const workflows = await databaseService.workflows.getAllWorkflows();
      setWorkflows(workflows);
    };
    fetchWorkflows();
  }, []);

  const handleSave = async () => {
    try {
      const newRunner = await databaseService.runners.createRunner({
        name: runnerForm.name,
        data: runnerForm.data,
      });

      // Create a serializable runner object
      const serializableRunner: SerializableRunner = {
        id: newRunner,
        name: runnerForm.name,
        data: runnerForm.data,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Dispatch action to add the new runner to Redux store
      dispatch(addRunner(serializableRunner));
      console.log("New runner created:", serializableRunner);
      setOpen(false);
    } catch (error) {
      console.error("Error saving runner:", error);
    }
  };

  const handleWorkflowChange = (value: string) => {
    const newValue = runnerForm.workflowId?.toString() === value ? undefined : parseInt(value);
    setRunnerForm((prevRunnerForm: Runner) => ({ ...prevRunnerForm, workflowId: newValue }));
    setOpenWorkflow(false);
  };

  const handleDeviceChange = (value: string) => {
    const newValue = runnerForm.deviceId === value ? undefined : value;
    setRunnerForm((prevRunnerForm: Runner) => ({ ...prevRunnerForm, deviceId: newValue }));
    setOpenDevice(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={btnTitle ? "" : "hidden"}>{btnTitle}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[1200px] w-[70%]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Runner for &nbsp;
            {
              runnerForm.id && !isHideWorkflow &&
              <>
                <Label htmlFor="workflow" className="ml-4 mr-2">
                  Workflow
                </Label>
                <div className="flex items-center gap-2">
                  <Popover open={openWorkflow} onOpenChange={setOpenWorkflow}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openWorkflow}
                        className="w-[200px] justify-between"
                      >
                        {
                          runnerForm.workflowId ? 
                            workflows.find((workflow) => workflow.id.toString() === runnerForm.workflowId.toString())?.name : 
                            "Select a workflow"
                        }
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search a workflow" />
                        <CommandList>
                          <CommandEmpty>No workflow found.</CommandEmpty>
                          <CommandGroup>
                            {
                              workflows.map((workflow) => (
                                <CommandItem
                                  key={workflow.id}
                                  value={workflow.id.toString()}
                                  onSelect={() => handleWorkflowChange(workflow.id.toString())}
                                  className={cn(
                                    runnerForm.workflowId === workflow.id && "bg-accent"
                                  )}
                                >
                                  {workflow.name}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      runnerForm.workflowId === workflow.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))
                            }
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <Label htmlFor="device" className="ml-4 mr-2">
                  Device
                </Label>
                <div className="flex items-center gap-2">
                  <Popover open={openDevice} onOpenChange={setOpenDevice}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openDevice}
                        className="min-w-[220px] justify-between truncate"
                      >
                        {
                          runnerForm.deviceId ? 
                            devices.find((device) => device.id === runnerForm.deviceId)?.name : 
                            "Select a device"
                        }
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[200px] p-0">
                      <Command>
                        <CommandInput placeholder="Search a device" />
                        <CommandList>
                          <CommandEmpty>No device found.</CommandEmpty>
                          <CommandGroup>
                            {
                              devices.map((device) => (
                                <CommandItem
                                  key={device.id}
                                  value={device.id}
                                  onSelect={() => handleDeviceChange(device.id)}
                                  className={cn(
                                    runnerForm.deviceId === device.id && "bg-accent"
                                  )}
                                >
                                  {device.name}
                                  <Check
                                    className={cn(
                                      "ml-auto h-4 w-4",
                                      runnerForm.deviceId === device.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))
                            }
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            }
            <Label htmlFor="name" className="ml-4 mr-2">
              Name
            </Label>
            {
              !runnerForm.id ?
              <Input
                id="name"
                className="w-[40%]"
                value={runnerForm.name}
                onChange={(e) => setRunnerForm(prevRunnerForm => ({ ...prevRunnerForm, name: e.target.value }), false)}
              /> :
              <Badge className="text-lg" variant="outline">
                {runnerForm.name}
              </Badge>
            }
            {
              !runnerForm.id &&
              <Button
                onClick={handleSave}
                className="ml-2 self-end"
                disabled={!runnerForm.name}
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                Save
                </Button>
            }
          </DialogTitle>
        </DialogHeader>
        {
          runnerForm.id &&
          <div className="max-h-[60vh] overflow-auto">
            <RunnerFormObject runner={runnerForm} setRunner={setRunnerForm} />
          </div>
        }
      </DialogContent>
    </Dialog>
  )
}
