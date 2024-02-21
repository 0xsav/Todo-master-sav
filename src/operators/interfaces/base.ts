import { Id, IEntity, ISaved, IEntityUpdateProps } from "../../models";
import type { IInjector } from "../../core";

export interface IBaseOperators<IBase extends IEntity>
  extends Omit<IInjector, "entity" | "task" | "board" | "flow" | "flowStep"> {
  save: (entity: IBase) => Promise<IBase & ISaved>;
  update: <EU extends IEntityUpdateProps>(
    props: EU
  ) => <E extends IBase>(entity: E) => E;
  delete: <E extends IBase>(entity: E) => Promise<E>;
  clone: <E extends IBase>(entity: E) => E;
  refresh: (entity: IBase) => Promise<(IBase & ISaved) | undefined>;
  refreshOrFail: (entity: IBase) => Promise<IBase & ISaved>;
  getId: (entity: IBase | Id) => Id;
  getProp: <K extends keyof IBase>(prop: K) => (entity: IBase) => IBase[K];
}
