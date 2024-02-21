import { interfaces } from "inversify";
import { EntityType, TSourceProvider } from "../..";
import { EntityNotFoundError, SavingRequiredError } from "../../errors";
import { getOperators, IGetOperatorsReturn } from "../../inversify.config";
import {
  EntityCollection,
  Id,
  IFlow,
  IFlowStep,
  ISaved,
  isFlow,
  ITask,
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
  });

  it("Get `EntityOperators.get()` retrieves a value.", async () => {
    // Prepare
    const length = source.length;
    const id = source.tasks.keys().next().value as Id;

    // Perform
    const entity = await ops.entity.get(EntityType.Task)(id);

    // Check
    source.expectLength.toBe(length);
    expect(entity).toBeDefined();
    expect(entity).toMatchObject({ id, type: EntityType.Task });
  });

  it("Get `EntityOperators.get()` retrieves undefined on fail.", async () => {
    // Prepare
    const length = source.length;

    // Perform
    const entity = await ops.entity.get(EntityType.Task)("NOT EXISTENT ID");

    // Check
    source.expectLength.toBe(length);
    expect(entity).toBeUndefined;
  });

  it("Get `EntityOperators.getOrFails()` retrieves value.", async () => {
    // Prepare
    const length = source.length;
    const id = source.tasks.keys().next().value as Id;

    // Perform
    const entity = await ops.entity.getOrFail(EntityType.Task)(id);

    // Check
    source.expectLength.toBe(length);
    expect(entity).toBeDefined();
    expect(entity).toMatchObject({ id, type: EntityType.Task });
  });

  it("Get `EntityOperators.getOrFails()` fail.", async () => {
    // Prepare
    const length = source.length;

    // Perform
    await expect(
      ops.entity.getOrFail(EntityType.Task)("NOT EXISTENT ID")
    ).rejects.toThrowError(EntityNotFoundError);

    // Check
    source.expectLength.toBe(length);
  });

  it("`EntityOperators.refresh()` refresh the value.", async () => {
    // Prepare
    const length = source.length;
    const entity = source.tasks.values().next().value as ITask & ISaved;
    source.tasks.set(entity.id, {
      id: entity.id,
      type: EntityType.Task,
    });

    // Perform
    const refreshedEntity = await ops.entity.refresh(entity);

    // Check
    source.expectLength.toBe(length);
    expect(refreshedEntity).toBeDefined();
    expect(entity).toMatchObject({ id: entity.id, type: EntityType.Task });
  });

  it("`EntityOperators.refresh()` returns undefined if invalid id.", async () => {
    // Prepare
    const length = source.length;
    const entity: ITask = { id: "NOT EXISTENT ID", type: EntityType.Task };

    // Perform
    const refreshedEntity = await ops.entity.refresh(entity);

    // Check
    source.expectLength.toBe(length);
    expect(refreshedEntity).toBeUndefined();
  });

  it("`EntityOperators.refreshOrFail()` refresh the value.", async () => {
    // Prepare
    const length = source.length;
    const entity = source.tasks.values().next().value as ITask & ISaved;
    source.tasks.set(entity.id, {
      id: entity.id,
      type: EntityType.Task,
    });

    // Perform
    const refreshedEntity = await ops.entity.refresh(entity);

    // Check
    source.expectLength.toBe(length);
    expect(refreshedEntity).toBeDefined();
    expect(entity).toMatchObject({ id: entity.id, type: EntityType.Task });
  });

  it("`EntityOperators.refreshOrFail()` throws `EntityNotFoundError`.", async () => {
    // Prepare
    const length = source.length;
    const entity: ITask = { id: "NOT EXISTENT ID", type: EntityType.Task };

    // Perform
    await expect(ops.entity.refreshOrFail(entity)).rejects.toThrowError(
      EntityNotFoundError
    );

    // Check
    source.expectLength.toBe(length);
  });

  it("`EntityOperators.list()` gets all.", async () => {
    // Prepare
    const length = source.tasks.size;

    // Perform
    const entities = await ops.entity.list(EntityType.Task);

    // Check
    expect(entities).toBeDefined();
    expect(entities).toBeInstanceOf(Map);
    expect(entities.size).toBe(length);
    source.tasks.forEach((task) => {
      expect(entities.has(task.id)).toBe(true);
      expect(entities.get(task.id)).toEqual(task);
    });
  });

  it("`EntityOperators.getProp()` gets a prop.", async () => {
    // Prepare
    const length = source.tasks.size;
    const entity: ITask = source.tasks.get(length - 1) as ITask;

    // Perform
    const prop = ops.entity.getProp("id")(entity);

    // Check
    expect(prop).toBeDefined();
    expect(prop).toBe(length - 1);
  });

  it("`EntityOperators.getId()` gets id.", async () => {
    // Prepare
    const length = source.tasks.size;
    const entity: ITask = source.tasks.get(length - 1) as ITask;

    // Perform
    const id = ops.entity.getId(entity);

    // Check
    expect(id).toBeDefined();
    expect(id).toBe(length - 1);
  });

  it("`EntityOperators.getId()` of not saved entity raises `SavingRequiredError`.", async () => {
    // Prepare
    const entity: ITask = { type: EntityType.Task };

    // Perform & Check
    expect(() => ops.entity.getId(entity)).toThrowError(SavingRequiredError);
  });

  it("`FlowStepOperators.getFlow()` returns a flow.", async () => {
    // Prepare
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
});
