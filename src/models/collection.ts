import { Id, isId, isIterable } from "./base";
import { IEntity } from "./entity";

export type EntityCollection<T extends IEntity> = Map<Id, T>;
export const isEntityCollection = (
  obj: any
): obj is EntityCollection<IEntity> => obj instanceof Map;
export type EntityReferenceCollection = Iterable<Id>;
export const isEntityReferenceCollection = (
  obj: any
): obj is EntityReferenceCollection =>
  isIterable(obj) && (obj.length === 0 || isId(obj[0]));
