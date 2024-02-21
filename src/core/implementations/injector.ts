import { interfaces } from "inversify";
import {
  IBoardOperators,
  IEntityOperators,
  IFlowOperators,
  IFlowStepOperators,
  ISourceOperators,
  ITaskOperators,
} from "../../operators";
import { Identificators } from "../../identificators";
import { IInjector } from "../interfaces/injector";
import { IConfiguration } from "../interfaces/configuration";

export class Injector implements IInjector {
  constructor(protected context: interfaces.Context) {}

  public get source(): ISourceOperators {
    return this.context.container.get<ISourceOperators>(Identificators.Source);
  }

  public get config(): IConfiguration {
    return this.context.container.get<IConfiguration>(
      Identificators.Configuration
    );
  }

  public get entity(): IEntityOperators {
    return this.context.container.get<IEntityOperators>(
      Identificators.EntityOperators
    );
  }

  public get task(): ITaskOperators {
    return this.context.container.get<ITaskOperators>(
      Identificators.TaskOperators
    );
  }

  public get flowStep(): IFlowStepOperators {
    return this.context.container.get<IFlowStepOperators>(
      Identificators.FlowStepOperators
    );
  }

  public get flow(): IFlowOperators {
    return this.context.container.get<IFlowOperators>(
      Identificators.FlowOperators
    );
  }

  public get board(): IBoardOperators {
    return this.context.container.get<IBoardOperators>(
      Identificators.BoardOperators
    );
  }
}
