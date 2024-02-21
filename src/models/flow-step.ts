import { EntityType, IEntity, isEntity } from "./entity";

export interface IFlowStep extends IEntity {
  type: EntityType.FlowStep;
}

export const isFlowStep = (obj: any): obj is IFlowStep =>
  isEntity(obj) && obj.type === EntityType.FlowStep;

export interface IFlowStepCreationProps {}
export interface IFlowStepUpdateProps {}
