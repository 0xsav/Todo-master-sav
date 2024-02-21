import { interfaces } from "inversify";
import {
  Id,
  ITask,
  ISaved,
  ITaskCreationProps,
  IBoard,
  IFlowStep,
  EntityCollection,
} from "../../models";
import type { IInjector } from "../../core";
import { IBaseOperators } from "./base";

export interface ITaskOperators
  extends IBaseOperators<ITask>,
    Omit<IInjector, "task"> {
  get: (
    idOrTask: Id | (ITask & ISaved)
  ) => Promise<(ITask & ISaved) | undefined>;
  getOrFail: (idOrTask: Id | (ITask & ISaved)) => Promise<ITask & ISaved>;
  list: () => Promise<EntityCollection<ITask & ISaved>>;
  create: (props: ITaskCreationProps) => Promise<ITask & ISaved>;

  getBoard: (
    idOrTask: Id | (ITask & ISaved)
  ) => Promise<(IBoard & ISaved) | undefined>;
  getTaskStep: (
    idOrTask: Id | (ITask & ISaved)
  ) => Promise<(IFlowStep & ISaved) | undefined>;
  setTaskStep: (
    idOrStep: Id | (IFlowStep & ISaved)
  ) => (idOrTask: Id | (ITask & ISaved)) => Promise<ITask & ISaved>;
}
export type TTaskOperatorsProvider = (
  context: interfaces.Context
) => ITaskOperators;
