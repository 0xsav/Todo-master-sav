import { interfaces } from "inversify";
import {
  Id,
  IFlowStep,
  ISaved,
  IFlowStepCreationProps,
  EntityCollection,
  IFlow,
  ITask,
} from "../../models";
import type { IInjector } from "../../core";
import { IBaseOperators } from "./base";

export interface IFlowStepOperators
  extends IBaseOperators<IFlowStep>,
    Omit<IInjector, "flowStep"> {
  get: (
    idOrStep: Id | (IFlowStep & ISaved)
  ) => Promise<(IFlowStep & ISaved) | undefined>;
  getOrFail: (
    idOrStep: Id | (IFlowStep & ISaved)
  ) => Promise<IFlowStep & ISaved>;
  list: () => Promise<EntityCollection<IFlowStep & ISaved>>;
  create: (props: IFlowStepCreationProps) => Promise<IFlowStep & ISaved>;

  getFlow: (idOrStep: Id | (IFlowStep & ISaved)) => Promise<IFlow & ISaved>;
  getTasks: (
    idOrStep: Id | (IFlowStep & ISaved)
  ) => Promise<EntityCollection<ITask & ISaved>>;
}
export type TFlowStepOperatorsProvider = (
  context: interfaces.Context
) => IFlowStepOperators;
