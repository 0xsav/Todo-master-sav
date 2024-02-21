import { EntityNotFoundError } from "../../errors";
import {
  EntityType,
  Id,
  IFlowStep,
  ISaved,
  IFlowStepCreationProps,
  IFlowStepUpdateProps,
  isFlowStep,
  MaybePromise,
  IEntity,
  IFlow,
  ITask,
} from "../../models";
import {
  IFlowStepOperators,
  TFlowStepOperatorsProvider,
} from "../interfaces/flow-step";
import { Injector } from "../../core";

export class FlowStepOperators extends Injector implements IFlowStepOperators {
  /**
   * Returns a flowStep by id from the source. `undefined` will be also returned
   * if the type of the obtained flowStep does not match the expected type.
   *
   */
  public get get() {
    const clone = this.clone.bind(this);
    const getId = this.getId.bind(this);
    const source = this.source;
    const get = async (id: Id) =>
      source.get(EntityType.FlowStep)(id) as IFlowStep & ISaved;
    return async (idOrFlowStep: Id | (IFlowStep & ISaved)) => {
      let id: Id;
      if (isFlowStep(idOrFlowStep)) {
        id = getId(idOrFlowStep);
      } else {
        id = idOrFlowStep;
      }
      const flowStep: (IFlowStep & ISaved) | undefined = await get(id);
      if (flowStep !== undefined && flowStep.type === EntityType.FlowStep) {
        return clone(flowStep);
      }
      return undefined;
    };
  }

  /**
   * Returns a flowStep by id from the source or `EntityNotFoundError` is raised.
   * The error is also raised if the type of the received flowStep does not match
   * the expected type.
   */
  public get getOrFail() {
    const clone = this.clone.bind(this);
    const getId = this.getId.bind(this);
    const source = this.source;
    const get = async (id: Id) =>
      source.get(EntityType.FlowStep)(id) as IFlowStep & ISaved;
    return async (idOrFlowStep: Id | (IFlowStep & ISaved)) => {
      let id: Id;
      if (isFlowStep(idOrFlowStep)) {
        id = getId(idOrFlowStep);
      } else {
        id = idOrFlowStep;
      }
      const flowStep: (IFlowStep & ISaved) | undefined = await get(id);
      if (flowStep !== undefined && flowStep.type === EntityType.FlowStep) {
        return clone(flowStep);
      }
      throw new EntityNotFoundError(`FlowStep with id "${String(id)}".`);
    };
  }

  /**
   * Required option A2.
   * Returns an entity collection with all the flowSteps.
   */
  public get list() {
    const source = this.source;
    const requireOptions = this.config.requireOptions("A1");
    return requireOptions(async () => {
      const list = source.list as <E extends IEntity>(
        type: E["type"]
      ) => MaybePromise<Iterable<E & ISaved>>;
      const entities = await list<IFlowStep>(EntityType.FlowStep);
      const collection = new Map(
        Array.from(entities).map((entity) => [entity.id, entity])
      );
      return collection;
    });
  }

  /**
   * Save a flowStep. Notice that the returned flowStep could have updated the id,
   * `createAt` or `updateAt` fields.
   */
  public get save() {
    const clone = this.clone.bind(this);
    const source = this.source;
    return async (flowStep: IFlowStep) => {
      return clone((await source.set(flowStep)) as IFlowStep & ISaved);
    };
  }

  /**
   * Creates a flowStep.
   */
  public get create() {
    const source = this.source;
    return async (props: IFlowStepCreationProps) => {
      const flowStep: IFlowStep = {
        ...props,
        type: EntityType.FlowStep,
      };
      return (await source.set(flowStep)) as IFlowStep & ISaved;
    };
  }

  /**
   * Update a flowStep.
   */
  public get update() {
    const clone = this.clone.bind(this);
    return <EU extends IFlowStepUpdateProps>(props: EU) =>
      <E extends IFlowStep>(flowStep: E) => {
        const newEntity: E = {
          ...clone(flowStep),
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
    return <E extends IFlowStep>(flowStep: E): Promise<E> =>
      entityOps.delete<E>(flowStep);
  }

  /**
   * The identity function. Effectively, creates a copy of the flowStep.
   */
  public get clone() {
    return <E extends IFlowStep>(flowStep: E): E => {
      const newEntity: IFlowStep = {
        ...flowStep,
      };
      return newEntity as E;
    };
  }

  /**
   * Update the flowStep from the source. Effectively, concatenates `getId` and
   * `get`.
   */
  public get refresh() {
    const getId = this.getId.bind(this);
    const get = this.get.bind(this);
    return async (flowStep: IFlowStep) => {
      const id = getId(flowStep);
      return await get(id);
    };
  }

  /**
   * Update the flowStep from the source. Effectively, concatenates `getId` and
   * `getOrFail`.
   */
  public get refreshOrFail() {
    const getId = this.getId.bind(this);
    const getOrFail = this.getOrFail.bind(this);
    return async (flowStep: IFlowStep) => {
      const id = getId(flowStep);
      return await getOrFail(id);
    };
  }

  /**
   * Extracts the `id` from the flowStep.
   */
  public get getId() {
    return this.entity.getId;
  }

  /**
   * Extracts the `id` from the flowStep.
   */
  public get getProp() {
    return <K extends keyof IFlowStep>(prop: K) =>
      (flowStep: IFlowStep) =>
        flowStep[prop];
  }

  /**
   * Required option R2.
   * Returns the flow at which the flow step belongs.
   */
  public get getFlow() {
    const requireOptions = this.config.requireOptions("R2");
    const getId = this.getId.bind(this);
    const source = this.source;
    return requireOptions(async (idOrStep: Id | (IFlowStep & ISaved)) => {
      const getStepFlow = source.getStepFlow as (
        id: Id
      ) => MaybePromise<IFlow & ISaved>;
      return await getStepFlow(getId(idOrStep));
    });
  }

  /**
   * Required option ST1.
   * Returns the associated tasks.
   */
  public get getTasks() {
    const requireOptions = this.config.requireOptions("ST1");
    const getId = this.getId.bind(this);
    const source = this.source;
    return requireOptions(async (idOrStep: Id | (IFlowStep & ISaved)) => {
      const getTasksWithStep = source.getTasksWithStep as (
        id: Id
      ) => MaybePromise<Iterable<ITask & ISaved>>;
      const entities = await getTasksWithStep(getId(idOrStep));
      const collection = new Map(
        Array.from(entities).map((entity) => [entity.id, entity])
      );
      return collection;
    });
  }
}
export const defaultFlowStepOperatorsProvider: TFlowStepOperatorsProvider = (
  context
) => new FlowStepOperators(context);
