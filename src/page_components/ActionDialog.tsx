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
import { RefreshCcw } from "lucide-react"
import { useContext, useEffect, useState } from "react"
import ActionFormTouch from "./ActionFormTouch"
import ActionFormSwipe from "./ActionFormSwipe"
import { Separator } from "@/components/ui/separator"
import ActionFormTyping from "./ActionFormTyping"
import ActionFormProcessData from "./ActionFormProcessData"
import ActionFormApk from "./ActionFormApk"
import ActionFormPress from "./ActionFormPress"
import ActionFormRandomize from "./ActionFormRandomize"
import ActionFormJavascript from "./ActionFormJavascript"
import ActionFormWait from "./ActionFormWait"
import { WorkflowContext } from "@/contexts/WorkflowContext"
import { ActionContext } from "@/contexts/ActionContext"

export function ActionDialog({open, setOpen, btnTitle}: {open: boolean, setOpen: (open: boolean) => void, btnTitle?: string}) {
  const { workflow, setWorkflow, currentActionId } = useContext(WorkflowContext);
  const workflowData = workflow.data
  const action = currentActionId && workflowData ? workflowData[currentActionId] : {}
  const actionData = action && action.data?.action || {}

  const handleActionTypeChange = (value: string) => {
    setWorkflow((prevWorkflow: any) => ({
      ...prevWorkflow,
      data: {
        ...prevWorkflow.data,
        [currentActionId]: {
          ...prevWorkflow.data[currentActionId],
          data: {
            ...prevWorkflow.data[currentActionId].data,
            action: {
              ...prevWorkflow.data[currentActionId].data.action,
              type: value
            }
          }
        }
      }
    }));
  }

  const handleActionLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLabel = e.target.value;
    setWorkflow((prevWorkflow: any) => ({
      ...prevWorkflow,
      data: {
        ...prevWorkflow.data,
        [currentActionId]: {
          ...prevWorkflow.data[currentActionId],
          data: {
            ...prevWorkflow.data[currentActionId].data,
            label: newLabel
          }
        }
      }
    }));
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={btnTitle ? "" : "hidden"}>{btnTitle}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-[1200px] w-[70%]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Step for &nbsp;
            <Select onValueChange={handleActionTypeChange} value={actionData.type}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select an action" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="touch">Touch</SelectItem>
                  <SelectItem value="typing">Typing</SelectItem>
                  <SelectItem value="processData">Process Data</SelectItem>
                  <SelectItem value="apk">APK</SelectItem>
                  <SelectItem value="press">Press</SelectItem>
                  <SelectItem value="randomize">Randomize</SelectItem>
                  <SelectItem value="javascript">Javascript</SelectItem>
                  <SelectItem value="wait">Wait</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <Label htmlFor="name" className="ml-4 mr-2 text-right">
              Name
            </Label>
            <Input
              id="name"
              className="w-[40%] font-normal"
              value={action?.data?.label}
              onChange={handleActionLabelChange}
            />
          </DialogTitle>
        </DialogHeader>
        {actionData.type === 'touch' && <ActionFormTouch />}
        {actionData.type === 'typing' && <ActionFormTyping />}
        {actionData.type === 'processData' && <ActionFormProcessData />}
        {actionData.type === 'apk' && <ActionFormApk />}
        {actionData.type === 'press' && <ActionFormPress />}
        {actionData.type === 'javascript' && <ActionFormJavascript />}
        {actionData.type === 'wait' && <ActionFormWait />}
        {actionData.type === 'randomize' && <ActionFormRandomize />}
      </DialogContent>
    </Dialog>
  )
}
