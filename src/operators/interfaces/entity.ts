import { interfaces } from "inversify";
import {
  EntityCollection,
  EntityType,
  Id,
  IEntity,
  IEntityCreationProps,
  ISaved,
} from "../../models";
import type { IInjector } from "../../core";
import { IBaseOperators } from "./base";

export interface IEntityOperators
  extends IBaseOperators<IEntity>,
    Omit<IInjector, "entity"> {
  get: (
    type: EntityType
  ) => (id: Id) => Promise<(IEntity & ISaved) | undefined>;
  getOrFail: (type: EntityType) => (id: Id) => Promise<IEntity & ISaved>;
  list: (type: EntityType) => Promise<EntityCollection<IEntity & ISaved>>;
  create: (
    type: EntityType
  ) => (props: IEntityCreationProps) => Promise<IEntity & ISaved>;

  // collections
  toCollection: <E extends IEntity>(
    entities: Iterable<E & ISaved>
  ) => EntityCollection<E & ISaved>;
  mergeCollections: <E extends IEntity>(
    collections: Iterable<EntityCollection<E & ISaved>>
  ) => EntityCollection<E & ISaved>;

  // higher order
  requireSavedEntity: <E extends IEntity, RT extends any | undefined | null>(
    fn: (entity: E & ISaved) => RT
  ) => (entity: E) => RT;
}
export type TEntityOperatorsProvider = (
  context: interfaces.Context
) => IEntityOperators;
