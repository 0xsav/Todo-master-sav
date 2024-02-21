import { EntityNotFoundError, SavingRequiredError } from "../../errors";
import {
  entityIsSaved,
  EntityType,
  Id,
  IEntity,
  ISaved,
  IEntityCreationProps,
  IEntityUpdateProps,
  isId,
  MaybePromise,
  EntityCollection,
} from "../../models";
import {
  IEntityOperators,
  TEntityOperatorsProvider,
} from "../interfaces/entity";
import { Injector } from "../../core";

export class EntityOperators extends Injector implements IEntityOperators {
  /**
   * Returns an entity by id from the source. `undefined` will be also returned
   * if the type of the obtained entity does not match the expected type.
   *
   */
  public get get() {
    const clone = this.clone.bind(this);
    const source = this.source;
    return (type: EntityType) => {
      const get = source.get(type);
      return async (id: Id) => {
        const entity: (IEntity & ISaved) | undefined = await get(id);
        if (entity !== undefined && entity.type === type) {
          return clone(entity);
        }
        return undefined;
      };
    };
  }

  /**
   * Returns an entity by id from the source or `EntityNotFoundError` is raised.
   * The error is also raised if the type of the received entity does not match
   * the expected type.
   */
  public get getOrFail() {
    const clone = this.clone.bind(this);
    const source = this.source;
    return (type: EntityType) => {
      const get = source.get(type);
      return async (id: Id) => {
        const entity = await get(id);
        if (entity !== undefined && entity.type === type) {
          return clone(entity);
        }
        throw new EntityNotFoundError(`Type ${type} with id "${String(id)}".`);
      };
    };
  }

  /**
   * Required option A2.
   * Returns an entity collection with all the entities of a certain type.
   */
  public get list() {
    const source = this.source;
    const requireOptions = this.config.requireOptions("A1");
    return requireOptions(async (type: EntityType) => {
      const list = source.list as <E extends IEntity>(
        type: E["type"]
      ) => MaybePromise<Iterable<E & ISaved>>;
      const entities = await list(type);
      const collection = new Map(
        Array.from(entities).map((entity) => [entity.id, entity])
      );
      return collection;
    });
  }

  /**
   * Save an entity. Notice that the returned entity could have updated the id,
   * `createAt` or `updateAt` fields.
   */
  public get save() {
    const clone = this.clone.bind(this);
    const source = this.source;
    return async (entity: IEntity) => {
      return clone(await source.set(entity));
    };
  }

  /**
   * Creates an entity.
   */
  public get create() {
    const source = this.source;
    return (type: EntityType) => async (props: IEntityCreationProps) => {
      const entity: IEntity = {
        ...props,
        type,
      };
      return await source.set(entity);
    };
  }

  /**
   * Update an entity.
   */
  public get update() {
    const clone = this.clone.bind(this);
    return <EU extends IEntityUpdateProps>(props: EU) =>
      <E extends IEntity>(entity: E) => {
        const newEntity: E = {
          ...clone(entity),
          ...props,
        } as E;

        return newEntity;
      };
  }

  /**
   * If entity is saved, request deletion to the source. Then returns a copy
   * of the entity.
   */
  public get delete() {
    const clone = this.clone.bind(this);
    const source = this.source;
    return this.requireSavedEntity(
      async <E extends IEntity>(entity: E): Promise<E> => {
        if (entityIsSaved(entity)) {
          await source.delete(entity.type)(entity.id);
        }
        return clone(entity);
      }
    );
  }

  /**
   * The identity function. Effectively, creates a copy of the entity.
   */
  public get clone() {
    return <E extends IEntity>(entity: E): E => {
      const newEntity: IEntity = {
        ...entity,
      };
      return newEntity as E;
    };
  }

  /**
   * Update the entity from the source. Effectively, concatenates `getId` and
   * `get`.
   */
  public get refresh() {
    const getId = this.getId.bind(this);
    const get = this.get.bind(this);
    return async (entity: IEntity) => {
      const id = getId(entity);
      return await get(entity.type)(id);
    };
  }

  /**
   * Update the entity from the source. Effectively, concatenates `getId` and
   * `getOrFail`.
   */
  public get refreshOrFail() {
    const getId = this.getId.bind(this);
    const getOrFail = this.getOrFail.bind(this);
    return async (entity: IEntity) => {
      const id = getId(entity);
      return await getOrFail(entity.type)(id);
    };
  }

  /**
   * Extracts the `id` from the entity.
   */
  public get getId() {
    const requireSavedEntity = this.requireSavedEntity.bind(this);
    return (idOrEntity: Id | IEntity) => {
      if (isId(idOrEntity)) {
        return idOrEntity;
      }
      return requireSavedEntity((entity: IEntity & ISaved) => entity.id)(
        idOrEntity
      );
    };
  }

  /**
   * Extracts the `id` from the entity.
   */
  public get getProp() {
    return <K extends keyof IEntity>(prop: K) =>
      (entity: IEntity) =>
        entity[prop];
  }

  /**
   * Creates a collection from an iterable of saved entities.
   */
  public get toCollection() {
    return <E extends IEntity>(entities: Iterable<E & ISaved>) => {
      const collection: EntityCollection<E & ISaved> = new Map();
      for (const entity of entities) {
        collection.set(entity.id, entity);
      }
      return collection;
    };
  }

  /**
   * Merges several collections into a new single one.
   */
  public get mergeCollections() {
    return <E extends IEntity>(
      collections: Iterable<EntityCollection<E & ISaved>>
    ): EntityCollection<E & ISaved> => {
      const result: EntityCollection<E & ISaved> = new Map();
      for (const collection of collections) {
        collection.forEach((value, key) => result.set(key, value));
      }
      return result;
    };
  }

  /**
   * Requires the entity to have `id`. Otherwise a `SavingRequiredError` is thrown.
   */
  public get requireSavedEntity() {
    return <E extends IEntity, RT extends any | undefined | null>(
      fn: (entity: E & ISaved) => RT
    ) => {
      return (entity: E): RT => {
        if (!entityIsSaved(entity)) {
          throw new SavingRequiredError(`Type ${entity.type}`);
        }
        return fn(entity);
      };
    };
  }
}
export const defaultEntityOperatorsProvider: TEntityOperatorsProvider = (
  context
) => new EntityOperators(context);
