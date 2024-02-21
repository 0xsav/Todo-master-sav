import {
  BoardTaskWithoutStepError,
  EntityNotFoundError,
  NotImplementedError,
} from "../../errors";
import {
  EntityType,
  Id,
  ISaved,
  IBoardCreationProps,
  IBoardUpdateProps,
  isBoard,
  MaybePromise,
  IEntity,
  IBoard,
  ITask,
  isId,
  entityIsSaved,
  IFlowStep,
} from "../../models";
import { IBoardOperators, TBoardOperatorsProvider } from "../interfaces/board";
import { Injector } from "../../core";

export class BoardOperators extends Injector implements IBoardOperators {
  /**
   * Returns a board by id from the source. `undefined` will be also returned
   * if the type of the obtained board does not match the expected type.
   *
   */
  public get get() {
    const clone = this.clone.bind(this);
    const getId = this.getId.bind(this);
    const source = this.source;
    const get = async (id: Id) =>
      source.get(EntityType.Board)(id) as IBoard & ISaved;
    return async (idOrBoard: Id | (IBoard & ISaved)) => {
      let id: Id;
      if (isBoard(idOrBoard)) {
        id = getId(idOrBoard);
      } else {
        id = idOrBoard;
      }
      const board: (IBoard & ISaved) | undefined = await get(id);
      if (board !== undefined && board.type === EntityType.Board) {
        return clone(board);
      }
      return undefined;
    };
  }

  /**
   * Returns a board by id from the source or `EntityNotFoundError` is raised.
   * The error is also raised if the type of the received board does not match
   * the expected type.
   */
  public get getOrFail() {
    const clone = this.clone.bind(this);
    const getId = this.getId.bind(this);
    const source = this.source;
    const get = async (id: Id) =>
      source.get(EntityType.Board)(id) as IBoard & ISaved;
    return async (
      idOrBoard: Id | (IBoard & ISaved)
    ): Promise<IBoard & ISaved> => {
      let id: Id;
      if (isBoard(idOrBoard)) {
        id = getId(idOrBoard);
      } else {
        id = idOrBoard;
      }
      const board: (IBoard & ISaved) | undefined = await get(id);
      if (board !== undefined && board.type === EntityType.Board) {
        return clone(board);
      }
      throw new EntityNotFoundError(`Board with id "${String(id)}".`);
    };
  }

  /**
   * Required option A2.
   * Returns an entity collection with all the boards.
   */
  public get list() {
    const source = this.source;
    const requireOptions = this.config.requireOptions("A1");
    return requireOptions(async () => {
      const list = source.list as <E extends IEntity>(
        type: E["type"]
      ) => MaybePromise<Iterable<E & ISaved>>;
      const entities = await list<IBoard>(EntityType.Board);
      const collection = new Map(
        Array.from(entities).map((entity) => [entity.id, entity])
      );
      return collection;
    });
  }

  /**
   * Save a board. Notice that the returned board could have updated the id,
   * `createAt` or `updateAt` fields.
   */
  public get save() {
    const clone = this.clone.bind(this);
    const source = this.source;
    return async (board: IBoard) => {
      const newBoard = clone((await source.set(board)) as IBoard & ISaved);
      return newBoard;
    };
  }

  /**
   * Creates a board.
   */
  public get create() {
    const source = this.source;
    const cloneTasks = this.cloneTasks.bind(this);
    const cloneTaskSteps = this.cloneTaskSteps.bind(this);
    return async (props: IBoardCreationProps) => {
      const tasks = cloneTasks(props.tasks || new Map());
      const taskSteps = cloneTaskSteps(props.taskSteps || new Map());
      const board: IBoard = {
        tasks,
        taskSteps,
        ...props,
        type: EntityType.Board,
      };
      return (await source.set(board)) as IBoard & ISaved;
    };
  }

  /**
   * Update a board.
   */
  public get update() {
    const clone = this.clone.bind(this);
    const cloneTasks = this.cloneTasks.bind(this);
    const cloneTaskSteps = this.cloneTaskSteps.bind(this);
    return <EU extends IBoardUpdateProps>(props: EU) =>
      <E extends IBoard>(board: E) => {
        const newProps = { ...props };
        if ("tasks" in props && props.tasks !== undefined) {
          newProps["tasks"] = cloneTasks(props.tasks);
        }
        if ("taskSteps" in props && props.taskSteps !== undefined) {
          newProps["taskSteps"] = cloneTaskSteps(props.taskSteps);
        }
        const newEntity: E = {
          ...clone(board),
          ...newProps,
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
    return <E extends IBoard>(board: E): Promise<E> =>
      entityOps.delete<E>(board);
  }

  protected get cloneTasks() {
    const cloneTask = this.task.clone;
    return <E extends IBoard>(tasks: E["tasks"]): E["tasks"] => {
      const newSteps = new Map(
        Array.from(tasks.values())
          .map(cloneTask)
          .map((entity: ITask & ISaved) => [entity.id, entity])
      );
      return newSteps;
    };
  }

  protected get cloneTaskSteps() {
    return <E extends IBoard>(taskSteps: E["taskSteps"]): E["taskSteps"] => {
      return new Map(taskSteps);
    };
  }

  /**
   * The identity function. Effectively, creates a copy of the board.
   */
  public get clone() {
    const cloneTasks = this.cloneTasks.bind(this);
    const cloneTaskSteps = this.cloneTaskSteps.bind(this);
    return <E extends IBoard>(board: E): E => {
      const tasks = cloneTasks(board.tasks);
      const taskSteps = cloneTaskSteps(board.taskSteps);
      const newEntity: E = { ...board, tasks, taskSteps };
      return newEntity;
    };
  }

  /**
   * Update the board from the source. Effectively, concatenates `getId` and
   * `get`.
   */
  public get refresh() {
    const getId = this.getId.bind(this);
    const get = this.get.bind(this);
    return async (board: IBoard) => {
      const id = getId(board);
      return await get(id);
    };
  }

  /**
   * Update the board from the source. Effectively, concatenates `getId` and
   * `getOrFail`.
   */
  public get refreshOrFail() {
    const getId = this.getId.bind(this);
    const getOrFail = this.getOrFail.bind(this);
    return async (board: IBoard) => {
      const id = getId(board);
      return await getOrFail(id);
    };
  }

  /**
   * Extracts the `id` from the board.
   */
  public get getId() {
    return this.entity.getId;
  }

  /**
   * Extracts a prop from the board.
   */
  public get getProp() {
    const cloneTasks = this.cloneTasks.bind(this);
    const cloneTaskSteps = this.cloneTaskSteps.bind(this);
    return <K extends keyof IBoard>(prop: K) =>
      (board: IBoard) =>
        prop === "tasks"
          ? (cloneTasks(board.tasks) as IBoard[K])
          : prop === "taskSteps"
          ? (cloneTaskSteps(board.taskSteps) as IBoard[K])
          : board[prop];
  }

  /**
   * Adds a task to the board. If R1 is set, first the task will be removed
   * from its current board. That operation will be saved.
   */
  public get addTask() {
    const getOrFail = this.getOrFail.bind(this);
    const getTaskOrFail = this.task.getOrFail.bind(this.task);
    const hasTaskUniqueBoard = this.config.hasTaskUniqueBoard;
    const getTaskId = this.task.getId.bind(this.task);
    const getTaskBoard = (
      this.source.getTaskBoard as (
        id: Id
      ) => Promise<(IBoard & ISaved) | undefined>
    ).bind(this.source);
    const removeTask = this.removeTask.bind(this);
    const save = this.save.bind(this);
    const getTasks = this.getProp("tasks");
    const getTaskSteps = this.getProp("taskSteps");
    const getFlow = this.getProp("flow");
    const update = this.update.bind(this);
    return (idOrTask: (ITask & ISaved) | Id) =>
      async (idOrBoard: IBoard | Id) => {
        const task = isId(idOrTask) ? await getTaskOrFail(idOrTask) : idOrTask;
        // if has R1 remove current parent
        if (hasTaskUniqueBoard() && entityIsSaved(task)) {
          const taskId = getTaskId(task);
          let currentParent: IBoard | undefined = await getTaskBoard(taskId);
          if (currentParent !== undefined) {
            currentParent = await removeTask(task)(currentParent);
            await save(currentParent);
          }
        }
        const board = isId(idOrBoard) ? await getOrFail(idOrBoard) : idOrBoard;
        const taskId = getTaskId(idOrTask);
        const flow = getFlow(board);
        const tasks = getTasks(board);
        const taskSteps = getTaskSteps(board);
        tasks.set(taskId, task);
        if (flow.defaultStepId !== undefined) {
          taskSteps.set(taskId, flow.defaultStepId);
        }
        return update({ tasks, taskSteps })(board);
      };
  }

  /**
   * Removes a task to the board.
   */
  public get removeTask() {
    const getOrFail = this.getOrFail.bind(this);
    const getTaskId = this.task.getId.bind(this.task);
    const getTasks = this.getProp("tasks");
    const getTaskSteps = this.getProp("taskSteps");
    const update = this.update.bind(this);
    return (idOrTask: (ITask & ISaved) | Id) =>
      async (idOrBoard: IBoard | Id) => {
        const board = isId(idOrBoard) ? await getOrFail(idOrBoard) : idOrBoard;
        const taskId = getTaskId(idOrTask);
        const tasks = getTasks(board);
        const taskSteps = getTaskSteps(board);
        tasks.delete(taskId);
        taskSteps.delete(taskId);
        return update({ tasks, taskSteps })(board);
      };
  }

  /**
   * Returns `true` if the board has the task, `false` otherwise.
   */
  public get hasTask() {
    const getOrFail = this.getOrFail.bind(this);
    const getTaskId = this.task.getId.bind(this.task);
    const getTasks = this.getProp("tasks");
    const getTaskSteps = this.getProp("taskSteps");
    return (idOrTask: (ITask & ISaved) | Id) =>
      async (idOrBoard: IBoard | Id) => {
        const board = isId(idOrBoard) ? await getOrFail(idOrBoard) : idOrBoard;
        const taskId = getTaskId(idOrTask);
        const tasks = getTasks(board);
        const taskSteps = getTaskSteps(board);
        const isInTasks = tasks.has(taskId);
        const hasStep = taskSteps.has(taskId);
        if (isInTasks && hasStep) {
          return true;
        } else if (!isInTasks && !hasStep) {
          return false;
        } else if (isInTasks && !hasStep) {
          throw new BoardTaskWithoutStepError(
            `In board with id ${String(board?.id)} and task with id ${String(
              taskId
            )}.`
          );
        } else if (!isInTasks && hasStep) {
          throw new EntityNotFoundError(
            `Board with id ${String(board?.id)} has no task with id ${String(
              taskId
            )} but has an associated flowStep.`
          );
        }
        throw new NotImplementedError("Imposible case");
      };
  }

  /**
   * Returns the flowStep's `id` associated to the task in the context of the board.
   */
  public get getTaskStepId() {
    const getOrFail = this.getOrFail.bind(this);
    const getTaskId = this.task.getId.bind(this.task);
    return (idOrTask: (ITask & ISaved) | Id) =>
      async (idOrBoard: IBoard | Id) => {
        const board = isId(idOrBoard) ? await getOrFail(idOrBoard) : idOrBoard;
        const taskId = getTaskId(idOrTask);
        const flowStepId = taskId && board.taskSteps.get(taskId);
        if (flowStepId === undefined) {
          throw new BoardTaskWithoutStepError(
            `On board ${String(board.id)} task ${String(
              taskId
            )} has no step associated.`
          );
        }
        return flowStepId;
      };
  }

  /**
   * Returns the flowStep associated to the task in the context of the board.
   */
  public get getTaskStep() {
    const getOrFail = this.getOrFail.bind(this);
    const getTaskId = this.task.getId.bind(this.task);
    const getFlowStep = this.flowStep.getOrFail.bind(this.flowStep);
    return (idOrTask: (ITask & ISaved) | Id) =>
      async (idOrBoard: IBoard | Id) => {
        const board = isId(idOrBoard) ? await getOrFail(idOrBoard) : idOrBoard;
        const taskId = getTaskId(idOrTask);
        const flowStepId = taskId && board.taskSteps.get(taskId);
        if (flowStepId === undefined) {
          throw new BoardTaskWithoutStepError(
            `On board ${String(board.id)} task ${String(
              taskId
            )} has no step associated.`
          );
        }
        return await getFlowStep(flowStepId);
      };
  }

  /**
   * Set a task’s state to a flowStep in the context of the board.
   */
  public get setTaskStep() {
    const getOrFail = this.getOrFail.bind(this);
    const getTaskId = this.task.getId.bind(this.task);
    const getFlowStepId = this.flowStep.getId.bind(this.flowStep);
    const getTaskSteps = this.getProp("taskSteps");
    const update = this.update.bind(this);
    return (idOrFlowStep: (IFlowStep & ISaved) | Id) =>
      (idOrTask: (ITask & ISaved) | Id) =>
      async (idOrBoard: IBoard | Id) => {
        const board = isId(idOrBoard) ? await getOrFail(idOrBoard) : idOrBoard;
        const taskId = getTaskId(idOrTask);
        // TODO: Check task is in board
        const flowStepId = getFlowStepId(idOrFlowStep);
        // TODO: Check step is in the flow associated to the board
        const taskSteps = getTaskSteps(board);
        taskSteps.set(taskId, flowStepId);
        return update({ taskSteps })(board);
      };
  }
}
export const defaultBoardOperatorsProvider: TBoardOperatorsProvider = (
  context
) => new BoardOperators(context);
