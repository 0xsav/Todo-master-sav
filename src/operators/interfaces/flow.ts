import { interfaces } from "inversify";
import {
  Id,
  ISaved,
  IFlowCreationProps,
  EntityCollection,
  IFlow,
  IFlowStep,
} from "../../models";
import type { IInjector } from "../../core";
import { IBaseOperators } from "./base";

export interface IFlowOperators
  extends IBaseOperators<IFlow>,
    Omit<IInjector, "flow"> {
  get: (
    idOrFlow: Id | (IFlow & ISaved)
  ) => Promise<(IFlow & ISaved) | undefined>;
  getOrFail: (idOrFlow: Id | (IFlow & ISaved)) => Promise<IFlow & ISaved>;
  list: () => Promise<EntityCollection<IFlow & ISaved>>;
  create: (props: IFlowCreationProps) => Promise<IFlow & ISaved>;

  getSteps: (flow: IFlow) => EntityCollection<IFlowStep & ISaved>;
  addStep: (
    idOrStep: Id | (IFlowStep & ISaved)
  ) => (idOrFlow: Id | IFlow) => Promise<IFlow>;
  removeStep: (
    idOrStep: Id | (IFlowStep & ISaved)
  ) => (idOrFlow: Id | IFlow) => Promise<IFlow>;
}
export type TFlowOperatorsProvider = (
  context: interfaces.Context
) => IFlowOperators;
