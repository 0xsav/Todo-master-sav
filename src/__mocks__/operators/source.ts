import { interfaces } from "inversify";
import {
  Injector,
  ISourceOperators,
  EntityType,
  IBoard,
  Id,
  IEntity,
  IFlow,
  IFlowStep,
  ISaved,
  ITask,
} from "../..";

export class SourceOperatorsMock extends Injector implements ISourceOperators {
  protected expect: jest.Expect;

  public constructor(context: interfaces.Context, expect: jest.Expect) {
    super(context);
    this.expect = expect;
  }

  protected entityStorage: Map<EntityType, Map<Id, IEntity & ISaved>> =
    new Map();
  protected get allEntityStorages(): Iterable<Map<Id, IEntity & ISaved>> {
    return [this.tasks, this.flowSteps, this.flows, this.boards];
  }
  protected getNewId(): number {
    let length = this.length;
    while (length >= 0) {
      const isUsed = Array.from(this.allEntityStorages).reduce(
        (isUsed, storage) => isUsed || storage.has(length),
        false
      );
      if (!isUsed) {
        return length;
      }
      length--;
    }
    throw new Error("Unable to find a new Id");
  }

  public get tasks(): Map<Id, ITask & ISaved> {
    if (!this.entityStorage.has(EntityType.Task)) {
      this.entityStorage.set(EntityType.Task, new Map());
    }
    return this.entityStorage.get(EntityType.Task) as Map<Id, ITask & ISaved>;
  }

  public get flowSteps(): Map<Id, IFlowStep & ISaved> {
    if (!this.entityStorage.has(EntityType.FlowStep)) {
      this.entityStorage.set(EntityType.FlowStep, new Map());
    }
    return this.entityStorage.get(EntityType.FlowStep) as Map<
      Id,
      IFlowStep & ISaved
    >;
  }

  public get flows(): Map<Id, IFlow & ISaved> {
    if (!this.entityStorage.has(EntityType.Flow)) {
      this.entityStorage.set(EntityType.Flow, new Map());
    }
    return this.entityStorage.get(EntityType.Flow) as Map<Id, IFlow & ISaved>;
  }

  public get boards(): Map<Id, IBoard & ISaved> {
    if (!this.entityStorage.has(EntityType.Board)) {
      this.entityStorage.set(EntityType.Board, new Map());
    }
    return this.entityStorage.get(EntityType.Board) as Map<Id, IBoard & ISaved>;
  }

  public get entities() {
    const source = this;
    return <T extends EntityType>(type: T): Map<Id, IEntity & { type: T }> => {
      if (type === EntityType.Task) {
        return source.tasks as Map<Id, IEntity & { type: T }>;
      } else if (type === EntityType.FlowStep) {
        return source.flowSteps as Map<Id, IEntity & { type: T }>;
      } else if (type === EntityType.Flow) {
        return source.flows as unknown as Map<Id, IEntity & { type: T }>;
      } else if (type === EntityType.Board) {
        return source.boards as unknown as Map<Id, IEntity & { type: T }>;
      }
      throw new Error("Invalid entity type.");
    };
  }

  public get length(): number {
    return Array.from(this.allEntityStorages).reduce(
      (total, storage) => total + storage.size,
      0
    );
  }
  public get expectLength(): jest.JestMatchers<number> {
    return this.expect(this.length);
  }

  protected get cloneEntity() {
    const self = this;
    return <E extends IEntity>(entity: E): E => {
      const type = entity.type;
      if (type === EntityType.Task) {
        return { ...entity } as E;
      } else if (type === EntityType.FlowStep) {
        return { ...entity } as E;
      } else if (type === EntityType.Flow) {
        const flow = entity as unknown as IFlow;
        const steps = new Map(
          Array.from(flow.steps.values())
            .map(self.cloneEntity)
            .map((entity: IFlowStep & ISaved) => [entity.id, entity])
        );
        return {
          ...entity,
          steps,
        } as E;
      } else if (type === EntityType.Board) {
        const board = entity as unknown as IBoard;
        const tasks = new Map(
          Array.from(board.tasks.values())
            .map(self.cloneEntity)
            .map((entity: ITask & ISaved) => [entity.id, entity])
        );
        const taskSteps = new Map(board.taskSteps);
        return {
          ...entity,
          tasks,
          taskSteps,
        } as E;
      }
      throw new Error("Invalid entity type.");
    };
  }

  /* ISourceOperators methods */

  public get get() {
    const source = this;
    return <E extends IEntity>(type: E["type"]) =>
      (id: Id): E & ISaved => {
        return source.entities(type).get(id) as E & ISaved;
      };
  }

  public get set() {
    const getNewId = this.getNewId.bind(this);
    const entities = this.entities.bind(this);
    const clone = this.cloneEntity.bind(this);
    return <E extends IEntity>(entity: E) => {
      const entityCopy = clone(entity);
      if (entityCopy.id === undefined) {
        entityCopy.id = getNewId();
      }
      entities(entityCopy.type).set(entityCopy.id, entityCopy);
      return entityCopy as E & ISaved;
    };
  }

  public get delete() {
    const source = this;
    return (type: EntityType) =>
      (id: Id): void => {
        source.entities(type).delete(id);
      };
  }

  /* ISourceOperators optional methods */

  protected isListActivated: boolean = true;
  public activateList = () => (this.isListActivated = true);
  public deactivateList = () => (this.isListActivated = false);
  public get list() {
    if (!this.isListActivated) {
      return undefined;
    }
    const source = this;
    return <E extends IEntity>(type: E["type"]) => {
      return Array.from(source.entities(type).values()) as (E & ISaved)[];
    };
  }

  protected isGetTaskBoardActivated: boolean = true;
  public activateGetTaskBoard = () => (this.isGetTaskBoardActivated = true);
  public deactivateGetTaskBoard = () => (this.isGetTaskBoardActivated = false);
  public get getTaskBoard() {
    if (!this.isGetTaskBoardActivated) {
      return undefined;
    }
    const boards = this.boards;
    return (id: Id) => {
      for (const board of boards.values()) {
        const task = board.tasks.get(id);
        if (task !== undefined) {
          return board;
        }
      }
      return undefined;
    };
  }

  protected isGetStepFlowActivated: boolean = true;
  public activateGetStepFlow = () => (this.isGetStepFlowActivated = true);
  public deactivateGetStepFlow = () => (this.isGetStepFlowActivated = false);
  public get getStepFlow() {
    if (!this.isGetStepFlowActivated) {
      return undefined;
    }
    const flows = this.flows;
    return (id: Id) => {
      for (const flow of flows.values()) {
        if (flow.steps.has(id)) {
          return flow;
        }
      }
      throw new Error(
        `SourceOperatorsMock: FlowStep with id ${String(
          id
        )} has not associated flow.`
      );
    };
  }

  protected isGetTasksWithStepActivated: boolean = true;
  public activateGetTasksWithStep = () =>
    (this.isGetTasksWithStepActivated = true);
  public deactivateGetTasksWithStep = () =>
    (this.isGetTasksWithStepActivated = false);
  public get getTasksWithStep() {
    if (!this.isGetTasksWithStepActivated) {
      return undefined;
    }
    const tasks = this.tasks;
    const boards = this.boards;
    return (id: Id) => {
      const relatedTasks = new Set<ITask & ISaved>();
      for (const board of boards.values()) {
        for (const [taskId, flowStepId] of board.taskSteps.entries()) {
          if (flowStepId === id) {
            const task = tasks.get(taskId);
            if (task === undefined) {
              throw new Error(
                `SourceOperatorsMock: Task with id ${String(
                  taskId
                )} is in 'taskSteps' mapping of board with id ${String(
                  board.id
                )}, but task is not stored`
              );
            }
            relatedTasks.add(task);
          }
        }
      }
      return relatedTasks;
    };
  }
}

export type TSourceOperatorsMock = SourceOperatorsMock;
