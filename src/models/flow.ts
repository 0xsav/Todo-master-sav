import { Id } from "./base";
import { EntityCollection } from "./collection";
import { EntityType, IEntity, ISaved, isEntity } from "./entity";
import { IFlowStep } from "./flow-step";

export interface IFlow extends IEntity {
  type: EntityType.Flow;
  steps: EntityCollection<IFlowStep & ISaved>;
  defaultStepId?: Id;
}

export const isFlow = (obj: any): obj is IFlow =>
  isEntity(obj) && obj.type === EntityType.Flow;

export interface IFlowCreationProps {
  steps?: EntityCollection<IFlowStep & ISaved>;
  defaultStepId?: Id;
}
export interface IFlowUpdateProps {
  steps?: EntityCollection<IFlowStep & ISaved>;
  defaultStepId?: Id;
}
