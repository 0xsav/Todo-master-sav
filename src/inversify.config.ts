import { Container } from "inversify";
import { Configuration, IConfiguration } from "./core";
import {
  defaultBoardOperatorsProvider,
  defaultEntityOperatorsProvider,
  defaultFlowOperatorsProvider,
  defaultFlowStepOperatorsProvider,
  defaultTaskOperatorsProvider,
  IBoardOperators,
  IEntityOperators,
  IFlowOperators,
  IFlowStepOperators,
  ISourceOperators,
  ITaskOperators,
  TBoardOperatorsProvider,
  TEntityOperatorsProvider,
  TFlowOperatorsProvider,
  TFlowStepOperatorsProvider,
  TSourceProvider,
  TTaskOperatorsProvider,
} from "./operators";
import { Identificators } from "./identificators";

interface IGetContainerProps {
  providers: {
    source: TSourceProvider;
    entity?: TEntityOperatorsProvider;
    task?: TTaskOperatorsProvider;
    flowStep?: TFlowStepOperatorsProvider;
    flow?: TFlowOperatorsProvider;
    board?: TBoardOperatorsProvider;
  };
}

/**
 * Provide an _inversify_ container with the library operators.
 *
 * @param props: {
 *  source: TSourceProvider The source provider.
 * }
 *
 * @return Container;
 */
export const getContainer: (props: IGetContainerProps) => Container = ({
  providers: {
    source: sourceProvider,
    entity: entityProvider = defaultEntityOperatorsProvider,
    task: taskProvider = defaultTaskOperatorsProvider,
    flowStep: flowStepProvider = defaultFlowStepOperatorsProvider,
    flow: flowProvider = defaultFlowOperatorsProvider,
    board: boardProvider = defaultBoardOperatorsProvider,
  },
}) => {
  const container = new Container({ defaultScope: "Singleton" });

  // Source operations
  container
    .bind<ISourceOperators>(Identificators.Source)
    .toDynamicValue(sourceProvider);

  // Configuration
  container
    .bind<IConfiguration>(Identificators.Configuration)
    .toDynamicValue((context) => new Configuration(context));

  // Entity
  container
    .bind<IEntityOperators>(Identificators.EntityOperators)
    .toDynamicValue(entityProvider);

  // Task
  container
    .bind<ITaskOperators>(Identificators.TaskOperators)
    .toDynamicValue(taskProvider);

  // FlowStep
  container
    .bind<IFlowStepOperators>(Identificators.FlowStepOperators)
    .toDynamicValue(flowStepProvider);

  // Flow
  container
    .bind<IFlowOperators>(Identificators.FlowOperators)
    .toDynamicValue(flowProvider);

  // Board
  container
    .bind<IBoardOperators>(Identificators.BoardOperators)
    .toDynamicValue(boardProvider);

  return container;
};

export interface IGetOperatorsReturn {
  source: ISourceOperators;
  entity: IEntityOperators;
  task: ITaskOperators;
  flowStep: IFlowStepOperators;
  flow: IFlowOperators;
  board: IBoardOperators;
}

/**
 * Provide a regular object containing with the library operators.
 *
 * @param props: {
 *  source: TSourceProvider The source provider.
 * }
 *
 * @return Container;
 */
export const getOperators: (
  props: IGetContainerProps
) => IGetOperatorsReturn = (props) => {
  const container = getContainer(props);

  const ops: IGetOperatorsReturn = {
    source: container.get<ISourceOperators>(Identificators.Source),
    entity: container.get<IEntityOperators>(Identificators.EntityOperators),
    task: container.get<ITaskOperators>(Identificators.TaskOperators),
    flowStep: container.get<IFlowStepOperators>(
      Identificators.FlowStepOperators
    ),
    flow: container.get<IFlowOperators>(Identificators.FlowOperators),
    board: container.get<IBoardOperators>(Identificators.BoardOperators),
  };
  return ops;
};
