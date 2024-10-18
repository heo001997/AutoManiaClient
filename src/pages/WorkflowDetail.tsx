import React, { useCallback, useEffect, useState, useRef, useContext } from "react";
import { ArrowBigLeft, ArrowLeft, CirclePlus, FileSliders, House, LayoutGrid, MoveDown, MoveLeft, MoveRight, Play, Plus, PlusCircle, RefreshCcw, Square, Sun } from "lucide-react"
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
import ScreenMirror from '@/components/ScreenMirror';
import '@xyflow/react/dist/style.css';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type OnConnect,
  Edge,
  EdgeChange,
  NodeChange,
} from '@xyflow/react';
import { AppNode, PositionLoggerNode } from '@/page_components/PositionLoggerNode';
import '@xyflow/react/dist/style.css';
import { WorkflowContext } from "@/contexts/WorkflowContext";
import { ActionContext } from "@/contexts/ActionContext";
import WorkflowRunnerService from "@/services/WorkflowRunnerService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { RunnerDialog } from "@/page_components/RunnerDialog";
import { Runner } from "@/types/Runner";
import { updateRunner } from "@/store/slices/runnersSlice";

export default function WorkflowDetail() {
  const dispatch = useAppDispatch();
  const { id } = useParams();
  const currentDevice = useAppSelector((state) => state.devices.currentDevice);
  const [workflow, setWorkflow] = useState<Workflow | object>({});
  const [currentActionId, setCurrentActionId] = useState<string>('');
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [openRunnerSelect, setOpenRunnerSelect] = useState(false);
  const [selectedRunner, setSelectedRunner] = useState<Runner | null>(null);
  const [runners, setRunners] = useState<Runner[]>([]);
  const [openRunnerDialog, setOpenRunnerDialog] = useState(false);
  const [runnerForm, setRunnerForm] = useState<Runner>({
    id: 0,
    name: '',
    deviceId: '',
    data: [],
    updatedAt: new Date(),
    createdAt: new Date()
  });
  const devices = useAppSelector((state: RootState) => state.devices.devices);

  useEffect(() => {
    const fetchRunners = async () => {
      try {
        const fetchedRunners = await databaseService.runners.getAllRunners();
        setRunners(fetchedRunners);
      } catch (error) {
        console.error("Error fetching runners:", error);
      }
    };
    fetchRunners();
  }, []);

  const onConnect: OnConnect = useCallback((connection) => {
    console.log("New connection:", connection);
    return setEdges((edges) => {
      const newEdges = addEdge(connection, edges);
      handleSetWorkflow((prevWorkflow: Workflow) => {
        if (connection.sourceHandle === "source-right") {
          const currentNode = connection.source
          const successNode = connection.target
          return {
            ...prevWorkflow,
            data: {
              ...prevWorkflow.data,
              [currentNode]: {
                ...prevWorkflow.data[currentNode],
                data: {
                  ...prevWorkflow.data[currentNode].data,
                  successNode: successNode
                }
              },
              [successNode]: {
                ...prevWorkflow.data[successNode],
                data: {
                  ...prevWorkflow.data[successNode].data,
                  previousNode: currentNode
                }
              }
            },
            edges: newEdges,
          };
        } else if (connection.sourceHandle === "source-bottom") {
          const currentNode = connection.source
          const failedNode = connection.target
          return {
            ...prevWorkflow,
            data: {
              ...prevWorkflow.data,
              [currentNode]: {
                ...prevWorkflow.data[currentNode],
                data: {
                  ...prevWorkflow.data[currentNode].data,
                  failedNode: failedNode
                }
              },
              [failedNode]: {
                ...prevWorkflow.data[failedNode],
                data: {
                  ...prevWorkflow.data[failedNode].data,
                  previousNode: currentNode
                }
              }
            },
            edges: newEdges,
          };
        }
      });
      return newEdges;
    });
  },
  [setEdges]);

  function handleOnEdgesChange(changes: EdgeChange<Edge>[]){
    console.log("handleOnEdgesChange changes: ", changes)
    if (changes.length > 0) {
      onEdgesChange(changes)
      if (changes[0].type === 'remove') {
        handleSetWorkflow((prevWorkflow: Workflow) => {
          const removedEdge = prevWorkflow.edges.find((edge: Edge) => edge.id === changes[0].id)
          const newEdges = prevWorkflow.edges.filter((edge: Edge) => edge.id !== changes[0].id)
          console.log("removedEdge: ", removedEdge)

          const sourceNode = removedEdge.source
          const targetNode = removedEdge.target
          console.log("sourceNode: ", sourceNode)
          console.log("targetNode: ", targetNode)
          
          let newSourceNode;
          if (removedEdge.sourceHandle === "source-right") {
            // remove the successNode from the source node
            newSourceNode = {
              ...prevWorkflow.data[sourceNode],
              data: {
                ...prevWorkflow.data[sourceNode].data,
                successNode: undefined
              }
            }
          } else if (removedEdge.sourceHandle === "source-bottom") {
            // remove the failedNode from the source node
            newSourceNode = {
              ...prevWorkflow.data[sourceNode],
              data: {
                ...prevWorkflow.data[sourceNode].data,
                failedNode: undefined
              }
            }
          }

          let newTargetNode;
          if (removedEdge.targetHandle === "target-left") {
            // remove the previousNode from the target node
            newTargetNode = {
              ...prevWorkflow.data[targetNode],
              data: {
                ...prevWorkflow.data[targetNode].data,
                previousNode: undefined
              }
            }
          }

          return {
            ...prevWorkflow,
            edges: newEdges,
            data: {
              ...prevWorkflow.data,
              [sourceNode]: newSourceNode,
              [targetNode]: newTargetNode
            },
          };
        });
        console.log("remove edge: ", changes[0])
      }
    }
  }

  useEffect(() => {
    if (id) {
      const fetchWorkflow = async () => {
        try {
          const fetchedWorkflow = await databaseService.workflows.getWorkflow(Number(id));
          if (fetchedWorkflow) {
            if (Object.keys(fetchedWorkflow.data).length === 0) {
              const newNode: AppNode = { id: 'start', type: 'position-logger', position: { x: 0, y: 0 }, data: { label: 'Start', action: {} } }
              handleSetWorkflow((prevWorkflow: Workflow) => ({ ...fetchedWorkflow, data: { 'start': newNode } }));
            } else {
              setWorkflow(fetchedWorkflow);
            }
          }
        } catch (error) {
          console.error("Error fetching workflow:", error);
        }
      };
      fetchWorkflow();
    }
  }, [id]);

  useEffect(() => {
    if (workflow && workflow.data) {
      console.log("Workflow changed, re-set Nodes and Edges: ", workflow)
      const nodes = Object.values(workflow.data);
      setNodes(nodes);
      setEdges(workflow.edges);
    }
  }, [workflow])

  if (!workflow) {
    return <div>Loading...</div>;
  }

  function handleNodeClick(event: React.MouseEvent<Element, MouseEvent>, node: AppNode): void {
    if (node.id === 'start') return
    
    setCurrentActionId(node.id);
    setOpenActionDialog(true)
  }

  function handleSetWorkflow(updater: (prevWorkflow: Workflow) => Workflow) {
    setWorkflow((prevWorkflow: Workflow) => {
      const currentWorkflow = updater(prevWorkflow);
      console.log("currentWorkflow: ", currentWorkflow);

      // Update the workflow in the database
      if (currentWorkflow && currentWorkflow.id) {
        databaseService.workflows.updateWorkflow(currentWorkflow.id, currentWorkflow)
          .then(() => {
            console.log("Workflow updated in database:", currentWorkflow);
          })
          .catch((error) => {
            console.error("Error updating workflow in database:", error);
          });
        return currentWorkflow;
      } else {
        console.error("Cannot update workflow: missing id");
        return prevWorkflow;
      }
    });
  }

  function workflowRunner() {
    if (isRunning) {
      // Stop the workflow
      if (worker) {
        console.log("Workflow force stopping!!!");
        worker.terminate();
        setWorker(null);
      }
      setIsRunning(false);
    } else {
      // Start the workflow
      const newWorker = new Worker(new URL('../services/WorkflowRunnerWorker.ts', import.meta.url), { type: 'module' });
      newWorker.onmessage = (event) => {
        const { success, result, error } = event.data;
        if (success) {
          console.log("Workflow executed successfully", result);
        } else {
          console.error("Unexpected error in workflowRunner", error);
        }
        setIsRunning(false);
        setWorker(null);
      };
      newWorker.postMessage({ workflow, device: currentDevice, runner: runnerForm });
      setWorker(newWorker);
      setIsRunning(true);
    }
  }

  function handleOnNodesChange(changes: NodeChange<AppNode>[]){
    if (changes.length > 0) {
      const node = changes[0]
      const nodeId = node.id
      if (node.type === 'position') {
        handleSetWorkflow((prevWorkflow: Workflow) => {
          const node = prevWorkflow.data[nodeId]
          const newPosition = {
            x: changes[0].position.x || prevWorkflow.data[nodeId].position.x,
            y: changes[0].position.y || prevWorkflow.data[nodeId].position.y
          }
          const newWorkflow = {
            ...prevWorkflow,
            data: {
              ...prevWorkflow.data,
              [nodeId]: {
                ...prevWorkflow.data[nodeId],
                position: { ...newPosition }
              },
            },
          }
          return newWorkflow
        });
      }
    }
    onNodesChange(changes)
  }

  function handleSetRunnerForm(updater: (prevRunner: Runner) => Runner, isSaved: boolean = true) {
    setRunnerForm((prevRunner: Runner) => {
      const currentRunner = updater(prevRunner);
      console.log("currentRunner: ", currentRunner);

      // Update the runner in the database and Redux store
      if (currentRunner && currentRunner.id) {
        databaseService.runners.updateRunner(currentRunner.id, currentRunner)
          .then(() => {
            console.log("Runner updated in database:", currentRunner);
            // Dispatch action to update Redux store
            dispatch(updateRunner({
              ...currentRunner,
              updatedAt: new Date().toISOString(),
              createdAt: currentRunner.createdAt.toISOString()
            }));
          })
          .catch((error) => {
            console.error("Error updating runner in database:", error);
          });
        return currentRunner;
      } else {
        if (isSaved) {
          console.error("Cannot update runner: missing id", currentRunner);
          return prevRunner;
        } else {
          console.log("Runner temporary updated:", currentRunner);
          return currentRunner;
        }
      }
    });
  }

  const handleOpenRunnerDialog = async () => {
    try {
      if (selectedRunner) { 
        const runner = await databaseService.runners.getRunner(selectedRunner?.id);
        console.log("runner: ", runner)
        if (runner) {
          console.log("runner: ", runner);
          // Set Runner Form
          handleSetRunnerForm((prevRunner: Runner) => ({
            ...runner,
            workflowId: (workflow as Workflow).id
          }), false);
          setOpenRunnerDialog(true);
        }
      }
    } catch (error) {
      console.error("Error fetching runner:", error);
    }
  };

  return (
    <Layout currentPage="Workflows">
      <WorkflowContext.Provider value={{ workflow, setWorkflow: handleSetWorkflow, currentActionId }}>
        <ActionDialog open={openActionDialog} setOpen={setOpenActionDialog} />
        <ScreenMirror device={currentDevice} />
        <div className="w-full items-start gap-4 flex">
          <Card className="sm:col-span-2 flex-grow" x-chunk="dashboard-05-chunk-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex justify-between items-center">
                <div className="flex flex-col w-full mr-2">
                  <div className="flex flex-row gap-2 items-center justify-between">
                    <div className="flex flex-row gap-2 items-center">
                      <div className="text-lg font-semibold">Flow:</div>
                      <div className="text-lg font-normal">{workflow.name}</div>
                    </div>
                    <div className="flex flex-row gap-2 items-center">
                      <div className="text-lg font-semibold">Runner:</div>
                      <Popover open={openRunnerSelect} onOpenChange={setOpenRunnerSelect}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openRunnerSelect}
                            className="w-[200px] justify-between"
                          >
                            {selectedRunner ? selectedRunner.name : "Select a runner"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Search a runner" />
                            <CommandList>
                              <CommandEmpty>No runner found.</CommandEmpty>
                              <CommandGroup>
                                {runners.map((runner) => (
                                  <CommandItem
                                    key={runner.id}
                                    value={runner.id.toString()}
                                    onSelect={() => {
                                      setSelectedRunner(runner);
                                      setOpenRunnerSelect(false);
                                      setRunnerForm(runner);
                                      // Add logic here to load the selected runner
                                    }}
                                    className={cn(
                                      selectedRunner?.id === runner.id && "bg-accent"
                                    )}
                                  >
                                    {runner.name}
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4",
                                        selectedRunner?.id === runner.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <Button variant="outline" size="icon" onClick={handleOpenRunnerDialog}>
                        <FileSliders />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="icon" onClick={workflowRunner}>
                  {isRunning ? <Square /> : <Play />}
                </Button>
              </CardTitle>
              <Separator className="my-2" />
            </CardHeader>
            <CardContent className="flex flex-col items-center px-6 py-0 text-sm gap-2 flex-wrap h-[600px] 2xl:min-h-[800px]">
              <ReactFlow
                nodes={nodes}
                nodeTypes={{ 'position-logger': PositionLoggerNode }}
                onNodesChange={handleOnNodesChange}
                onEdgesChange={handleOnEdgesChange}
                edges={edges}
                edgeTypes={{}}
                onNodeClick={(event, node) => handleNodeClick(event, node)}
                onConnect={onConnect}
                proOptions={{ hideAttribution: true }}
                fitView
              >
                <Background />
                <MiniMap />
                <Controls />
              </ReactFlow>
            </CardContent>
            <CardFooter>
            </CardFooter>
          </Card>
        </div>
        <RunnerDialog
          open={openRunnerDialog}
          setOpen={setOpenRunnerDialog}
          runnerForm={runnerForm}
          setRunnerForm={handleSetRunnerForm}
          devices={devices}
          workflow={workflow}
          isHideWorkflow={true}
        />
      </WorkflowContext.Provider>
    </Layout>
  )
}
