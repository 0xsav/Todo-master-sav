import {
  EntityNotFoundError,
  InvalidBoardAssociationError,
} from "../../errors";
import {
  EntityType,
  Id,
  ITask,
  ISaved,
  ITaskCreationProps,
  ITaskUpdateProps,
  isTask,
  MaybePromise,
  IBoard,
  IFlowStep,
  IEntity,
  isId,
} from "../../models";
import { ITaskOperators, TTaskOperatorsProvider } from "../interfaces/task";
import { Injector } from "../../core";

export class TaskOperators extends Injector implements ITaskOperators {
  /**
   * Returns a task by id from the source. `undefined` will be also returned
   * if the type of the obtained task does not match the expected type.
   *
   */
  public get get() {
    const clone = this.clone.bind(this);
    const getId = this.getId.bind(this);
    const source = this.source;
    const get = async (id: Id) =>
      source.get(EntityType.Task)(id) as ITask & ISaved;
    return async (idOrTask: Id | (ITask & ISaved)) => {
      let id: Id;
      if (isTask(idOrTask)) {
        id = getId(idOrTask);
      } else {
        id = idOrTask;
      }
      const task: (ITask & ISaved) | undefined = await get(id);
      if (task !== undefined && task.type === EntityType.Task) {
        return clone(task);
      }
      return undefined;
    };
  }

  /**
   * Returns a task by id from the source or `EntityNotFoundError` is raised.
   * The error is also raised if the type of the received task does not match
   * the expected type.
   */
  public get getOrFail() {
    const clone = this.clone.bind(this);
    const getId = this.getId.bind(this);
    const source = this.source;
    const get = async (id: Id) =>
      source.get(EntityType.Task)(id) as ITask & ISaved;
    return async (idOrTask: Id | (ITask & ISaved)) => {
      let id: Id;
      if (isTask(idOrTask)) {
        id = getId(idOrTask);
      } else {
        id = idOrTask;
      }
      const task: (ITask & ISaved) | undefined = await get(id);
      if (task !== undefined && task.type === EntityType.Task) {
        return clone(task);
      }
      throw new EntityNotFoundError(`Task with id "${String(id)}".`);
    };
  }

  /**
   * Required option A2.
   * Returns an entity collection with all the tasks.
   */
  public get list() {
    const source = this.source;
    const requireOptions = this.config.requireOptions("A1");
    return requireOptions(async () => {
      const list = source.list as <E extends IEntity>(
        type: E["type"]
      ) => MaybePromise<Iterable<E & ISaved>>;
      const entities = await list<ITask>(EntityType.Task);
      const collection = new Map(
        Array.from(entities).map((entity) => [entity.id, entity])
      );
      return collection;
    });
  }

  /**
   * Save a task. Notice that the returned task could have updated the id,
   * `createAt` or `updateAt` fields.
   */
  public get save() {
    const clone = this.clone.bind(this);
    const source = this.source;
    return async (task: ITask) => {
      return clone((await source.set(task)) as ITask & ISaved);
    };
  }

  /**
   * Creates a task.
   */
  public get create() {
    const source = this.source;
    return async (props: ITaskCreationProps) => {
      const task: ITask = {
        ...props,
        type: EntityType.Task,
      };
      return (await source.set(task)) as ITask & ISaved;
    };
  }

  /**
   * Update a task.
   */
  public get update() {
    const clone = this.clone.bind(this);
    return <EU extends ITaskUpdateProps>(props: EU) =>
      <E extends ITask>(task: E) => {
        const newEntity: E = {
          ...clone(task),
          ...props,
        } as E;

        return newEntity;
      };
  }

  /**
   * If entity is saved, request deletion to the source. Then returns a copy
   * of the entity.
   */
  public get delete() {
    const entityOps = this.entity;
    return <E extends ITask>(task: E): Promise<E> => entityOps.delete<E>(task);
  }

  /**
   * The identity function. Effectively, creates a copy of the task.
   */
  public get clone() {
    return <E extends ITask>(task: E): E => {
      const newEntity: ITask = {
        ...task,
      };
      return newEntity as E;
    };
  }

  /**
   * Update the task from the source. Effectively, concatenates `getId` and
   * `get`.
   */
  public get refresh() {
    const getId = this.getId.bind(this);
    const get = this.get.bind(this);
    return async (task: ITask) => {
      const id = getId(task);
      return await get(id);
    };
  }

  /**
   * Update the task from the source. Effectively, concatenates `getId` and
   * `getOrFail`.
   */
  public get refreshOrFail() {
    const getId = this.getId.bind(this);
    const getOrFail = this.getOrFail.bind(this);
    return async (task: ITask) => {
      const id = getId(task);
      return await getOrFail(id);
    };
  }

  /**
   * Extracts the `id` from the task.
   */
  public get getId() {
    return this.entity.getId;
  }

  /**
   * Extracts the `id` from the task.
   */
  public get getProp() {
    return <K extends keyof ITask>(prop: K) =>
      (task: ITask) =>
        task[prop];
  }

  /**
   * Required option R1.
   * Returns the board at which task belongs, if any.
   */
  public get getBoard() {
    const requireOptions = this.config.requireOptions("R1");
    const getId = this.getId.bind(this);
    const source = this.source;
    return requireOptions(async (idOrTask: Id | (ITask & ISaved)) => {
      const getTaskBoard = source.getTaskBoard as (
        id: Id
      ) => MaybePromise<(IBoard & ISaved) | undefined>;
      return await getTaskBoard(getId(idOrTask));
    });
  }

  /**
   * Required option R1.
   * Returns the associated flowStep in its board, if any.
   */
  public get getTaskStep() {
    const requireOptions = this.config.requireOptions("R1");
    const getBoard = this.getBoard.bind(this);
    const getTaskStepFromBoard = this.board.getTaskStep.bind(this.board);
    return requireOptions(async (idOrTask: Id | (ITask & ISaved)) => {
      const board = await getBoard(idOrTask);
      if (board === undefined) {
        return undefined;
      }
      return getTaskStepFromBoard(idOrTask)(board);
    });
  }

  /**
   * Required option R1.
   * Assigns a flowStep to the task in its board. The operation on the board
   * will be saved.
   * If task has no board as parent, a `InvalidBoardAssociationError` will be raised.
   * If the flowStep is not valid, a InvalidFlowStepError will be raised.
   */
  public get setTaskStep() {
    const getId = this.getId.bind(this);
    const getOrFail = this.getOrFail.bind(this);
    const clone = this.clone.bind(this);
    const requireOptions = this.config.requireOptions("R1");
    const getBoard = this.getBoard.bind(this);
    const setTaskStepFromBoard = this.board.setTaskStep.bind(this.board);
    return (flowStep: Id | (IFlowStep & ISaved)) =>
      requireOptions(async (idOrTask: Id | (ITask & ISaved)) => {
        const board = await getBoard(idOrTask);
        if (board === undefined) {
          const id = getId(idOrTask);
          throw new InvalidBoardAssociationError(
            `Task with id ${String(id)} has no board as a parent.`
          );
        }
        await setTaskStepFromBoard(flowStep)(idOrTask)(board);
        return isId(idOrTask) ? await getOrFail(idOrTask) : clone(idOrTask);
      });
  }
}

export const defaultTaskOperatorsProvider: TTaskOperatorsProvider = (context) =>
  new TaskOperators(context);
