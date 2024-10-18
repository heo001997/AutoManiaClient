import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PlusCircle, Trash, Play, Square, Smartphone } from "lucide-react"
import { RunnerDialog } from "@/page_components/RunnerDialog"
import { databaseService } from '@/services/DatabaseService';
import type { Runner } from "@/types/Runner";
import { useAppDispatch, useAppSelector } from '@/hooks/reduxHooks';
import { setRunners, deleteRunner, updateRunner } from '@/store/slices/runnersSlice';
import { useAppSelector as useSelector } from '@/hooks/reduxHooks';
import { RootState } from '@/store/store';
import { Device } from '@/types/Device';
import ScreenMirror from '@/components/ScreenMirror';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function Runner() {
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [runnerForm, setRunnerForm] = useState({
    name: '',
    data: [{}]
  });
  const [workflowMap, setWorkflowMap] = useState(new Map<number, string>());
  const [isRunning, setIsRunning] = useState<{ [key: number]: boolean }>({});
  const [workers, setWorkers] = useState<{ [key: number]: Worker | null }>({});
  const devices = useSelector((state: RootState) => state.devices.devices);
  console.log("devices: ", devices);

  const dispatch = useAppDispatch();
  const runners = useAppSelector((state) => state.runners.runners);

  const [openScreenMirrors, setOpenScreenMirrors] = useState<{ [key: string]: boolean }>({});

  const handleDelete = async (id: number) => {
    try {
      await databaseService.runners.deleteRunner(id);
      dispatch(deleteRunner(id));
      console.log(`Runner with id ${id} deleted successfully`);
    } catch (error) {
      console.error("Error deleting runner:", error);
    }
  };

  const handleRowClick = async (id: number) => {
    try {
      const runner = await databaseService.runners.getRunner(id);
      if (runner) {
        console.log("runner: ", runner);
        setRunnerForm(runner);
        setOpenActionDialog(true);
      }
    } catch (error) {
      console.error("Error fetching runner:", error);
    }
  };

  const handleAddRunner = () => {
    setRunnerForm({
      name: '',
      data: [{
        variable: '',
        type: '',
        value: ''
      }]
    });
    setOpenActionDialog(true);
  };

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
  };

  const handlePlay = async (id: number) => {
    if (isRunning[id]) {
      // Stop the workflow
      if (workers[id]) {
        console.log(`Workflow for runner ${id} force stopping!!!`);
        workers[id]?.terminate();
        setWorkers(prev => ({ ...prev, [id]: null }));
      }
      setIsRunning(prev => ({ ...prev, [id]: false }));
    } else {
      try {
        const runner = await databaseService.runners.getRunner(id);
        if (runner && runner.workflowId && runner.deviceId) {
          const workflow = await databaseService.workflows.getWorkflow(runner.workflowId);
          const device = devices.find((d: Device) => d.id === runner.deviceId);
          if (workflow && device) {
            // Start the workflow
            const newWorker = new Worker(new URL('../services/WorkflowRunnerWorker.ts', import.meta.url), { type: 'module' });
            newWorker.onmessage = (event) => {
              const { success, result, error } = event.data;
              if (success) {
                console.log(`Workflow for runner ${id} executed successfully`, result);
              } else {
                console.error(`Unexpected error in workflowRunner for runner ${id}`, error);
              }
              setIsRunning(prev => ({ ...prev, [id]: false }));
              setWorkers(prev => ({ ...prev, [id]: null }));
            };
            newWorker.postMessage({ workflow, device: device, runnerData: runner.data });
            setWorkers(prev => ({ ...prev, [id]: newWorker }));
            setIsRunning(prev => ({ ...prev, [id]: true }));
          } else {
            console.error(`Workflow not found for runner ${id}`);
          }
        } else {
          console.error(`Runner ${id} not found or has no associated workflow`);
        }
      } catch (error) {
        console.error("Error playing runner:", error);
      }
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const fetchedRunners = await databaseService.runners.getAllRunners();
        const serializedRunners = fetchedRunners.map(runner => ({
          ...runner,
          updatedAt: runner.updatedAt.toISOString(),
          createdAt: runner.createdAt.toISOString(),
          data: Array.isArray(runner.data) ? runner.data : [runner.data]
        }));
        dispatch(setRunners(serializedRunners));

        const fetchedWorkflows = await databaseService.workflows.getAllWorkflows();
        const newWorkflowMap = new Map(fetchedWorkflows.map(w => [w.id, w.name]));
        setWorkflowMap(newWorkflowMap);

        console.log('All runners:', serializedRunners);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    
    fetchData();
  }, []);

  return (
    <Layout currentPage="Runners">
      <RunnerDialog
        open={openActionDialog}
        setOpen={setOpenActionDialog}
        runnerForm={runnerForm}
        setRunnerForm={handleSetRunnerForm}
        devices={devices}
      />
      <div className="w-full items-start gap-4">
        <div className="grid auto-rows-max items-start gap-4">
            <div className="flex items-center">
              <Button
                variant="outline"
                className="h-7 gap-1"
                onClick={handleAddRunner}
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Add Runner</span>
              </Button>
            </div>
              <Card x-chunk="dashboard-05-chunk-3">
                <CardHeader className="px-7">
                  <CardTitle>Runners</CardTitle>
                  <CardDescription>
                    Your runner storage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="w-full overflow-auto">
                    <div className="min-w-[800px] max-h-[75vh]">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Id</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Workflow</TableHead>
                            <TableHead className="hidden sm:table-cell max-w-52">
                              Data
                            </TableHead>
                            <TableHead className="hidden sm:table-cell">
                              Updated At
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                              Created At
                            </TableHead>
                            <TableHead className="hidden md:table-cell">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {runners.map((runner, idx) => (
                            <TableRow 
                              key={runner.id} 
                              className={idx % 2 === 0 ? "bg-accent" : ""} 
                              onClick={() => handleRowClick(runner.id)}
                            >
                              <TableCell>{runner.id}</TableCell>
                              <TableCell>{runner.name}</TableCell>
                              <TableCell>{workflowMap.get(runner.workflowId) || ''}</TableCell>
                              <TableCell className="max-w-52 truncate">{JSON.stringify(runner.data)}</TableCell>
                              <TableCell>{new Date(runner.updatedAt).toLocaleString()}</TableCell>
                              <TableCell>{new Date(runner.createdAt).toLocaleString()}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="ghost" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenScreenMirrors(prev => ({...prev, [runner.id]: true}));
                                    }}
                                  >
                                    <Smartphone className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePlay(runner.id);
                                    }}
                                  >
                                    {isRunning[runner.id] ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(runner.id);
                                    }}
                                  >
                                    <Trash className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </CardContent>
              </Card>
        </div>
      </div>
      {Object.entries(openScreenMirrors).map(([runnerId, isOpen]) => 
        isOpen && (
          <ScreenMirror 
            key={runnerId}
            device={devices.find((d: Device) => d.id === runners.find(r => r.id.toString() === runnerId)?.deviceId)}
            wrapperClassName="2xl:min-w-[30px] 2xl:max-w-[400px] fixed top-20 left-20 z-50"
            onClose={() => setOpenScreenMirrors(prev => ({...prev, [runnerId]: false}))}
          />
        )
      )}
    </Layout>
  )
}
