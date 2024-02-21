import { interfaces } from "inversify";
import {
  Id,
  ISaved,
  IBoardCreationProps,
  EntityCollection,
  IBoard,
  ITask,
  IFlowStep,
} from "../../models";
import type { IInjector } from "../../core";
import { IBaseOperators } from "./base";

export interface IBoardOperators
  extends IBaseOperators<IBoard>,
    Omit<IInjector, "board"> {
  get: (
    idOrBoard: Id | (IBoard & ISaved)
  ) => Promise<(IBoard & ISaved) | undefined>;
  getOrFail: (idOrBoard: Id | (IBoard & ISaved)) => Promise<IBoard & ISaved>;
  list: () => Promise<EntityCollection<IBoard & ISaved>>;
  create: (props: IBoardCreationProps) => Promise<IBoard & ISaved>;

  addTask: (
    idOrTask: (ITask & ISaved) | Id
  ) => (board: IBoard | Id) => Promise<IBoard>;
  removeTask: (
    idOrTask: (ITask & ISaved) | Id
  ) => (board: IBoard | Id) => Promise<IBoard>;
  hasTask: (
    idOrTask: (ITask & ISaved) | Id
  ) => (board: IBoard | Id) => Promise<boolean>;
  getTaskStepId: (
    idOrTask: (ITask & ISaved) | Id
  ) => (board: IBoard | Id) => Promise<Id>;
  getTaskStep: (
    idOrTask: (ITask & ISaved) | Id
  ) => (board: IBoard | Id) => Promise<IFlowStep & ISaved>;
  setTaskStep: (
    idOrFlowStep: (IFlowStep & ISaved) | Id
  ) => (
    idOrTask: (ITask & ISaved) | Id
  ) => (board: IBoard | Id) => Promise<IBoard>;
}
export type TBoardOperatorsProvider = (
  context: interfaces.Context
) => IBoardOperators;
