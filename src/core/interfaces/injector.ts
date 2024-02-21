import type { IConfiguration } from "./configuration";
import type {
  IEntityOperators,
  IFlowStepOperators,
  IFlowOperators,
  ISourceOperators,
  IBoardOperators,
} from "../../operators";

export interface IInjector {
  source: ISourceOperators;
  config: IConfiguration;
  entity: IEntityOperators;
  flowStep: IFlowStepOperators;
  flow: IFlowOperators;
  board: IBoardOperators;
}
