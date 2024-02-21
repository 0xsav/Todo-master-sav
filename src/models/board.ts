import { Id } from "./base";
import { EntityCollection } from "./collection";
import { EntityType, IEntity, ISaved, isEntity } from "./entity";
import { IFlow } from "./flow";
import { ITask } from "./task";

export interface IBoard extends IEntity {
  type: EntityType.Board;
  flow: IFlow;
  tasks: EntityCollection<ITask & ISaved>;
  taskSteps: Map<Id, Id>;
}

export const isBoard = (obj: any): obj is IBoard =>
  isEntity(obj) && obj.type === EntityType.Board;

export interface IBoardCreationProps {
  flow: IFlow;
  tasks?: EntityCollection<ITask & ISaved>;
  taskSteps?: Map<Id, Id>;
}
export interface IBoardUpdateProps {
  flow?: IFlow;
  tasks?: EntityCollection<ITask & ISaved>;
  taskSteps?: Map<Id, Id>;
}
