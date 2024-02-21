import { interfaces } from "inversify";
import { EntityType, TSourceProvider } from "../..";
import { NotImplementedError } from "../../errors";
import { getOperators, IGetOperatorsReturn } from "../../inversify.config";
import {
  EntityCollection,
  IFlow,
  IFlowStep,
  ISaved,
  isFlow,
} from "../../models";
import { SourceOperatorsMock, TSourceOperatorsMock } from "../../__mocks__";

describe("Retrieving operators", () => {
  let source: TSourceOperatorsMock;
  let ops: IGetOperatorsReturn;

  beforeEach(async () => {
    const sourceProvider: TSourceProvider = (context: interfaces.Context) =>
      new SourceOperatorsMock(context, expect);
    ops = getOperators({ providers: { source: sourceProvider } });
    source = ops.source as TSourceOperatorsMock;

    // populate
    await Promise.all(
      Array.from(Array(5))
        .map((_, i) => ({
          id: i,
          type: EntityType.Task,
        }))
        .map(source.set)
    );
    await Promise.all(
      Array.from(Array(3))
        .map(() => ({ type: EntityType.FlowStep }))
        .map(source.set)
    );
    await source.set({ type: EntityType.Flow, steps: source.flowSteps });
  });

  it("`FlowStepOperators.getFlow()` returns a flow.", async () => {
    // Prepare
    source.flows.clear();
    const flowSteps: EntityCollection<IFlowStep & ISaved> = source.flowSteps;
    const excludedFlowStep = flowSteps.values().next().value as IFlowStep &
      ISaved;
    flowSteps.delete(excludedFlowStep.id);
    const includedFlowStep = flowSteps.values().next().value as IFlowStep &
      ISaved;
    const flow: IFlow = { type: EntityType.Flow, steps: flowSteps };
    source.set(flow);

    // Perform
    const parentFlow = await ops.flowStep.getFlow(includedFlowStep);

    // Check
    expect(parentFlow).toBeDefined();
    expect(isFlow(parentFlow)).toBe(true);
    expect(parentFlow).toMatchObject(flow);
    expect(parentFlow !== flow).toBe(true);
  });

  it("`FlowStepOperators.getFlow()` throws `NotImplementedError` when option R2 is not provided.", async () => {
    // Prepare
    const flowSteps: EntityCollection<IFlowStep & ISaved> = source.flowSteps;
    const excludedFlowStep = flowSteps.values().next().value as IFlowStep &
      ISaved;
    flowSteps.delete(excludedFlowStep.id);
    const includedFlowStep = flowSteps.values().next().value as IFlowStep &
      ISaved;
    const flow: IFlow = { type: EntityType.Flow, steps: flowSteps };
    source.set(flow);

    source.deactivateGetStepFlow();

    // Perform & Check
    expect(() => ops.flowStep.getFlow(includedFlowStep)).toThrowError(
      NotImplementedError
    );
  });

  it("`FlowStepOperators.getFlow()` do not fail.", async () => {
    // Prepare
    const flowSteps: EntityCollection<IFlowStep & ISaved> = source.flowSteps;
    const excludedFlowStep = flowSteps.values().next().value as IFlowStep &
      ISaved;
    flowSteps.delete(excludedFlowStep.id);
    const includedFlowStep = flowSteps.values().next().value as IFlowStep &
      ISaved;
    const flow: IFlow = { type: EntityType.Flow, steps: flowSteps };
    source.set(flow);

    // Perform & Check
    await ops.flowStep.getFlow(includedFlowStep);
  });

  it("`FlowStepOperators.getFlow()` throws `NotImplementedError` when option R2 is not provided.", async () => {
    // Prepare
    const flowSteps: EntityCollection<IFlowStep & ISaved> = source.flowSteps;
    const excludedFlowStep = flowSteps.values().next().value as IFlowStep &
      ISaved;
    flowSteps.delete(excludedFlowStep.id);
    const includedFlowStep = flowSteps.values().next().value as IFlowStep &
      ISaved;
    const flow: IFlow = { type: EntityType.Flow, steps: flowSteps };
    source.set(flow);

    source.deactivateGetStepFlow();

    // Perform & Check
    expect(() => ops.flowStep.getFlow(includedFlowStep)).toThrowError(
      NotImplementedError
    );
  });

  it("`FlowOperators.addSteps()` do not fail with !R2.", async () => {
    // Prepare
    const flow: IFlow = { type: EntityType.Flow, steps: new Map() };
    source.deactivateGetStepFlow();
    source.activateGetTasksWithStep();

    // Perform & Check
    const flowStep = source.flowSteps.values().next().value;
    await ops.flow.addStep(flowStep)(flow);
  });

  it("`FlowOperators.addSteps()` do not fail with R2 && ST1.", async () => {
    // Prepare
    const flow: IFlow = { type: EntityType.Flow, steps: new Map() };
    source.activateGetStepFlow();
    source.activateGetTasksWithStep();

    // Perform & Check
    const flowStep = source.flowSteps.values().next().value;
    await ops.flow.addStep(flowStep)(flow);
  });

  it("`FlowOperators.addSteps()` throws `NotImplementedError` when R2 && !ST1.", async () => {
    // Prepare
    const flow: IFlow = { type: EntityType.Flow, steps: new Map() };
    source.activateGetStepFlow();
    source.deactivateGetTasksWithStep();

    // Perform & Check
    const flowStep = source.flowSteps.values().next().value;
    expect(() => ops.flow.addStep(flowStep)(flow)).toThrowError(
      NotImplementedError
    );
  });
});
