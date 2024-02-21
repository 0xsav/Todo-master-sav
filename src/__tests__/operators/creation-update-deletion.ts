import { interfaces } from "inversify";
import { EntityType, IEntity, TSourceProvider } from "../..";
import { getOperators, IGetOperatorsReturn } from "../../inversify.config";
import { entityIsSaved, IFlow, ISaved, isEntity, isFlow } from "../../models";
import { SourceOperatorsMock, TSourceOperatorsMock } from "../../__mocks__";

describe("Creation and deletion operators", () => {
  let source: TSourceOperatorsMock;
  let ops: IGetOperatorsReturn;
  let initialLength: number;

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

    initialLength = source.length;
  });

  it("Create IEntity", async () => {
    await ops.entity.create(EntityType.Task)({});
    source.expectLength.toBe(initialLength + 1);
  });

  it("Update IEntity", async () => {
    // Prepare
    const entity = { type: EntityType.Task, id: 0 };

    // Perform
    const updatedEntity: IEntity = ops.entity.update({})(entity);

    // Check
    source.expectLength.toBe(initialLength);
    expect(updatedEntity).toMatchObject({
      type: EntityType.Task,
      id: updatedEntity.id,
    });
    expect(updatedEntity !== entity).toBeTruthy();
  });

  it("Update and save IEntity", async () => {
    // Prepare
    const entity = await source.set({ type: EntityType.Task });

    // Perform
    const notSavedEntity: IEntity = ops.entity.update({})(entity);
    const savedEntity = await ops.entity.save(notSavedEntity);

    // Check
    source.expectLength.toBe(initialLength + 1);
    expect(savedEntity).toBeDefined();
    expect(isEntity(savedEntity)).toBe(true);
    expect(entityIsSaved(savedEntity)).toBe(true);
    expect(source.tasks.get(savedEntity.id)).toBeDefined();
    expect(source.tasks.get(savedEntity.id)).toMatchObject({
      type: EntityType.Task,
      id: savedEntity.id,
    });
    expect(notSavedEntity !== savedEntity).toBeTruthy();
  });

  it("Delete IEntity", async () => {
    // Prepare
    const entity = await source.set({ type: EntityType.Task });

    // Perform
    const deletedEntity = await ops.entity.delete(entity);

    // Check
    source.expectLength.toBe(initialLength);
    expect(entity !== deletedEntity).toBeTruthy();
  });

  it("`FlowOperators.addSteps()` adds a step with !R2.", async () => {
    // Prepare
    const flowStep = await source.flowSteps.values().next().value;
    const parentFlow: IFlow & ISaved = await source.set({
      type: EntityType.Flow,
      steps: new Map([[flowStep.id, flowStep]]),
    } as IFlow);
    expect(parentFlow.steps.size).toBe(1);
    const flow: IFlow & ISaved = await source.set({
      type: EntityType.Flow,
      steps: new Map(),
    } as IFlow);
    expect(flow.steps.size).toBe(0);

    source.deactivateGetStepFlow();
    source.activateGetTasksWithStep();

    // Perform
    const updatedFlow = await ops.flow.addStep(flowStep)(flow);
    const updatedParentFlow = await source.get<IFlow>(EntityType.Flow)(
      parentFlow.id
    );

    // Check
    expect(updatedFlow).toBeDefined();
    expect(isEntity(updatedFlow)).toBe(true);
    expect(entityIsSaved(updatedFlow)).toBe(true);
    expect(isFlow(updatedFlow)).toBe(true);
    expect(updatedFlow !== flow).toBe(true);

    expect(updatedParentFlow.steps.size).toBe(1);
    expect(updatedFlow.steps.size).toBe(1);
  });

  it("`FlowOperators.addSteps()` adds a step with R2 && ST1.", async () => {
    // Prepare
    const flowStep = await source.flowSteps.values().next().value;
    const parentFlow: IFlow & ISaved = await source.set({
      type: EntityType.Flow,
      steps: new Map([[flowStep.id, flowStep]]),
    } as IFlow);
    expect(parentFlow.steps.size).toBe(1);
    const flow: IFlow & ISaved = await source.set({
      type: EntityType.Flow,
      steps: new Map(),
    } as IFlow);
    expect(flow.steps.size).toBe(0);

    source.activateGetStepFlow();

    // Perform
    const updatedFlow = await ops.flow.addStep(flowStep)(flow);
    const updatedParentFlow = await source.get<IFlow>(EntityType.Flow)(
      parentFlow.id
    );

    // Check
    expect(updatedFlow).toBeDefined();
    expect(isEntity(updatedFlow)).toBe(true);
    expect(entityIsSaved(updatedFlow)).toBe(true);
    expect(isFlow(updatedFlow)).toBe(true);
    expect(updatedFlow !== flow).toBe(true);

    // flow step is deattached from the previous parent flow
    expect(updatedParentFlow.steps.size).toBe(0);
    expect(updatedFlow.steps.size).toBe(1);
  });
});
