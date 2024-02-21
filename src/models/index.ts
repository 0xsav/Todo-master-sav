import { IBoard } from "./board";
import { IFlow } from "./flow";
import { IFlowStep } from "./flow-step";
import { ITask } from "./task";

export * from "./base";
export * from "./task";
export * from "./board";
export * from "./flow-step";
export * from "./flow";
export * from "./entity";
export * from "./collection";

export type TAnyEntity = ITask | IBoard | IFlowStep | IFlow;
