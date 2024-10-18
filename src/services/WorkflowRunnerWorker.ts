import WorkflowRunnerService from './WorkflowRunnerService';

const ctx: Worker = self as any;

ctx.onmessage = async (event) => {
  const { workflow, device, runner } = event.data;
  console.log("WorkflowRunnerWorker runner: ", runner)
  const service = new WorkflowRunnerService(workflow, device, runner);
  const result = await service.execute();
  ctx.postMessage(result);
};
