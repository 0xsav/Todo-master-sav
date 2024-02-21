import { EntityType, IEntity, isEntity } from "./entity";

export interface ITask extends IEntity {
  type: EntityType.Task;
}

export const isTask = (obj: any): obj is ITask =>
  isEntity(obj) && obj.type === EntityType.Task;

export interface ITaskCreationProps {}
export interface ITaskUpdateProps {}
