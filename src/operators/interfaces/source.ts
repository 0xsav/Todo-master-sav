import { interfaces } from "inversify";
import {
  EntityType,
  IBoard,
  Id,
  IEntity,
  IFlow,
  ISaved,
  ITask,
  MaybePromise,
} from "../../models";

export interface ISourceOperators {
  get: <E extends IEntity>(
    type: E["type"]
  ) => (id: Id) => MaybePromise<(E & ISaved) | undefined>;
  set: (entity: IEntity) => MaybePromise<IEntity & ISaved>;
  delete: (type: EntityType) => (id: Id) => MaybePromise<void>;
  // optional
  list?: <E extends IEntity>(
    type: E["type"]
  ) => MaybePromise<Iterable<E & ISaved>>;
  getTaskBoard?: (id: Id) => MaybePromise<(IBoard & ISaved) | undefined>;
  getStepFlow?: (id: Id) => MaybePromise<IFlow & ISaved>;
  getTasksWithStep?: (id: Id) => MaybePromise<Iterable<ITask & ISaved>>;
}

export type TSourceProvider = (context: interfaces.Context) => ISourceOperators;
