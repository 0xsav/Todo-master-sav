import { EntityNotFoundError, FlowStepInUseError } from "../../errors";
import {
  EntityType,
  Id,
  ISaved,
  IFlowCreationProps,
  IFlowUpdateProps,
  isFlow,
  MaybePromise,
  IEntity,
  IFlow,
  IFlowStep,
  isId,
  EntityCollection,
} from "../../models";
import { IFlowOperators, TFlowOperatorsProvider } from "../interfaces/flow";
import { Injector } from "../../core";

export class FlowOperators extends Injector implements IFlowOperators {
  /**
   * Returns a flow by id from the source. `undefined` will be also returned
   * if the type of the obtained flow does not match the expected type.
   *
   */
  public get get() {
    const clone = this.clone.bind(this);
    const getId = this.getId.bind(this);
    const source = this.source;
    const get = async (id: Id) =>
      source.get(EntityType.Flow)(id) as IFlow & ISaved;
    return async (idOrFlow: Id | (IFlow & ISaved)) => {
      let id: Id;
      if (isFlow(idOrFlow)) {
        id = getId(idOrFlow);
      } else {
        id = idOrFlow;
      }
      const flow: (IFlow & ISaved) | undefined = await get(id);
      if (flow !== undefined && flow.type === EntityType.Flow) {
        return clone(flow);
      }
      return undefined;
    };
  }

  /**
   * Returns a flow by id from the source or `EntityNotFoundError` is raised.
   * The error is also raised if the type of the received flow does not match
   * the expected type.
   */
  public get getOrFail() {
    const clone = this.clone.bind(this);
    const getId = this.getId.bind(this);
    const source = this.source;
    const get = async (id: Id) =>
      source.get(EntityType.Flow)(id) as IFlow & ISaved;
    return async (idOrFlow: Id | (IFlow & ISaved)): Promise<IFlow & ISaved> => {
      let id: Id;
      if (isFlow(idOrFlow)) {
        id = getId(idOrFlow);
      } else {
        id = idOrFlow;
      }
      const flow: (IFlow & ISaved) | undefined = await get(id);
      if (flow !== undefined && flow.type === EntityType.Flow) {
        return clone(flow);
      }
      throw new EntityNotFoundError(`Flow with id "${String(id)}".`);
    };
  }

  /**
   * Required option A2.
   * Returns an entity collection with all the flows.
   */
  public get list() {
    const source = this.source;
    const requireOptions = this.config.requireOptions("A1");
    return requireOptions(async () => {
      const list = source.list as <E extends IEntity>(
        type: E["type"]
      ) => MaybePromise<Iterable<E & ISaved>>;
      const entities = await list<IFlow>(EntityType.Flow);
      const collection = new Map(
        Array.from(entities).map((entity) => [entity.id, entity])
      );
      return collection;
    });
  }

  /**
   * Save a flow. Notice that the returned flow could have updated the id,
   * `createAt` or `updateAt` fields.
   */
  public get save() {
    const clone = this.clone.bind(this);
    const source = this.source;
    return async (flow: IFlow) => {
      const newFlow = clone((await source.set(flow)) as IFlow & ISaved);
      return newFlow;
    };
  }

  /**
   * Creates a flow.
   */
  public get create() {
    const source = this.source;
    return async (props: IFlowCreationProps) => {
      const steps = props.steps || new Map();
      const flow: IFlow = {
        steps,
        ...props,
        type: EntityType.Flow,
      };
      return (await source.set(flow)) as IFlow & ISaved;
    };
  }

  /**
   * Update a flow.
   */
  public get update() {
    const clone = this.clone.bind(this);
    const cloneSteps = this.cloneSteps.bind(this);
    return <EU extends IFlowUpdateProps>(props: EU) =>
      <E extends IFlow>(flow: E) => {
        const newProps = { ...props };
        if ("steps" in props && props.steps !== undefined) {
          newProps["steps"] = cloneSteps(props.steps);
        }
        const newEntity: E = {
          ...clone(flow),
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
    return <E extends IFlow>(flow: E): Promise<E> => entityOps.delete<E>(flow);
  }

  protected get cloneSteps() {
    const cloneFlowStep = this.flowStep.clone;
    return <E extends IFlow>(steps: E["steps"]): IFlow["steps"] => {
      const newSteps = new Map(
        Array.from(steps.values())
          .map(cloneFlowStep)
          .map((entity: IFlowStep & ISaved) => [entity.id, entity])
      );
      return newSteps;
    };
  }

  /**
   * The identity function. Effectively, creates a copy of the flow.
   */
  public get clone() {
    const cloneSteps = this.cloneSteps.bind(this);
    return <E extends IFlow>(flow: E): E => {
      const steps = cloneSteps(flow.steps);
      const newEntity: IFlow = { ...flow, steps };
      return newEntity as E;
    };
  }

  /**
   * Update the flow from the source. Effectively, concatenates `getId` and
   * `get`.
   */
  public get refresh() {
    const getId = this.getId.bind(this);
    const get = this.get.bind(this);
    return async (flow: IFlow) => {
      const id = getId(flow);
      return await get(id);
    };
  }

  /**
   * Update the flow from the source. Effectively, concatenates `getId` and
   * `getOrFail`.
   */
  public get refreshOrFail() {
    const getId = this.getId.bind(this);
    const getOrFail = this.getOrFail.bind(this);
    return async (flow: IFlow) => {
      const id = getId(flow);
      return await getOrFail(id);
    };
  }

  /**
   * Extracts the `id` from the flow.
   */
  public get getId() {
    return this.entity.getId;
  }

  /**
   * Extracts a prop from the flow.
   */
  public get getProp() {
    const cloneSteps = this.cloneSteps.bind(this);
    return <K extends keyof IFlow>(prop: K) =>
      (flow: IFlow) =>
        prop === "steps" ? (cloneSteps(flow.steps) as IFlow[K]) : flow[prop];
  }

  /**
   * Extracts steps from the flow.
   */
  public get getSteps() {
    const cloneSteps = this.cloneSteps.bind(this);
    return (flow: IFlow) => cloneSteps(flow.steps);
  }

  /**
   * Required either not option R2 or option ST1.
   * Adds a flowStep to the flow. If option R2 is selected, the flowStep will be first removed from the current parent, and the operation will be saved. If the current flowStep have associated tasks, an error `FlowStepInUseError` will be raised.
   */
  public get addStep() {
    const requireOptions = this.config.requireOptions(["!R2"], ["ST1"]);
    const hasStepUniqueFlow = this.config.hasStepUniqueFlow;
    const getStepFlow = this.flowStep.getFlow;
    const removeStep = this.removeStep.bind(this);
    const save = this.save.bind(this);
    const getOrFail = this.getOrFail.bind(this);
    const getOrFailStep = this.flowStep.getOrFail.bind(this);
    const getSteps = this.getProp("steps");
    const update = this.update.bind(this);
    return requireOptions(
      (idOrStep: (IFlowStep & ISaved) | Id) => async (idOrFlow: IFlow | Id) => {
        // if option R2, remove current parent
        if (hasStepUniqueFlow()) {
          // remove current parent
          let currentParent = await getStepFlow(idOrStep);
          // required option ST1
          currentParent = (await removeStep(idOrStep)(currentParent)) as IFlow &
            ISaved;
          await save(currentParent);
        }
        // get flow
        const flow: IFlow = isId(idOrFlow)
          ? await getOrFail(idOrFlow)
          : idOrFlow;
        // get flow
        const flowStep: IFlowStep & ISaved = isId(idOrStep)
          ? await getOrFailStep(idOrStep)
          : idOrStep;
        const steps: EntityCollection<IFlowStep & ISaved> = getSteps(flow);
        steps.set(flowStep.id, flowStep);
        return update({ steps })(flow);
      }
    );
  }

  /**
   * Requires option ST1.
   * Removes a flowStep from the flow. If the current flowStep have
   * associated tasks, an error FlowStepInUseError will be raised.
   */
  public get removeStep() {
    const requireOptions = this.config.requireOptions(["ST1"]);
    const getStepTasks = this.flowStep.getTasks;
    const getOrFail = this.getOrFail.bind(this);
    const getSteps = this.getProp("steps");
    const getFlowStepId = this.flowStep.getId;
    const update = this.update.bind(this);
    return requireOptions(
      (idOrStep: (IFlowStep & ISaved) | Id) =>
        async (idOrFlow: IFlow | Id): Promise<IFlow> => {
          // since option ST1, check no tasks are associated to flowStep
          const tasks = await getStepTasks(idOrStep);
          if (tasks.size > 0) {
            const id = getFlowStepId(idOrStep);
            throw new FlowStepInUseError(`FlowStep with id ${String(id)}.`);
          }

          const flow: IFlow = isId(idOrFlow)
            ? await getOrFail(idOrFlow)
            : idOrFlow;
          const steps: EntityCollection<IFlowStep & ISaved> = getSteps(flow);
          const flowStepId = getFlowStepId(idOrStep);
          steps.delete(flowStepId);
          return update({ steps })(flow);
        }
    );
  }
}
export const defaultFlowOperatorsProvider: TFlowOperatorsProvider = (context) =>
  new FlowOperators(context);
