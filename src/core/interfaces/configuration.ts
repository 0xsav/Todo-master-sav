import { interfaces } from "inversify";
import type { IInjector } from "./injector";

export interface IConfiguration extends Omit<IInjector, "config"> {
  hasTaskUniqueBoard: () => boolean;
  hasStepUniqueFlow: () => boolean;
  canGetTasksFromStep: () => boolean;
  requireOptions: (
    ...options: (TOptions[] | TOptions)[]
  ) => <F extends (...args: any[]) => any | void | undefined | null>(
    fn: F
  ) => F;
}

export type TConfigurationProvider = (
  context: interfaces.Context
) => IConfiguration;
export type TOptions =
  | "A1"
  | "!A1"
  | "R1"
  | "!R1"
  | "R2"
  | "!R2"
  | "ST1"
  | "!ST1";
