import { Id, isId } from "./base";

export enum EntityType {
  Task = "Task",
  Board = "Board",
  FlowStep = "FlowStep",
  Flow = "Flow",
}

export interface IEntity {
  id?: Id;
  type: EntityType;
}

export const isEntity = (obj: any): obj is IEntity =>
  typeof obj === "object" &&
  "type" in obj &&
  Object.values(EntityType).includes(obj.type);

export interface IEntityCreationProps {}
export interface IEntityUpdateProps {}
export interface ISaved {
  id: Id;
}

export const entityIsSaved = (entity: IEntity): entity is IEntity & ISaved =>
  isId(entity.id);
