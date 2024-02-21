import { NotImplementedError } from "../../errors";
import type { IConfiguration, TOptions } from "../interfaces/configuration";
import { Injector } from "./injector";

export class Configuration extends Injector implements IConfiguration {
  public get hasTaskUniqueBoard() {
    const source = this.source;
    return () => source.getTaskBoard !== undefined;
  }

  public get hasStepUniqueFlow() {
    const source = this.source;
    return () => source.getStepFlow !== undefined;
  }

  public get canGetTasksFromStep() {
    const source = this.source;
    return () => source.getTasksWithStep !== undefined;
  }

  /**
   * Returns an array with the current options.
   *
   * @return TOptions[]
   */
  protected currentOptions(): TOptions[] {
    return [
      this.source.list !== undefined ? "A1" : "!A1",
      this.hasTaskUniqueBoard() ? "R1" : "!R1",
      this.hasStepUniqueFlow() ? "R2" : "!R2",
      this.canGetTasksFromStep() ? "ST1" : "!ST1",
    ];
  }

  /**
   * Checks if the actual configuration matches the specified options.
   *
   * Options are given in the form [ [A1, ..., An], ..., [ Z1, ..., Zm ] ]
   * meaning (A1 and ... and An) or ... or (Z1 and ... Zn)
   *
   * @return boolean
   */
  protected matchesOptions(options: (TOptions[] | TOptions)[]): boolean {
    for (let opts of options) {
      if (!Array.isArray(opts)) {
        opts = [opts];
      }
      const match = opts.every((option: TOptions) => {
        switch (option) {
          case "A1":
            return this.source.list !== undefined;
          case "!A1":
            return this.source.list === undefined;
          case "R1":
            return this.hasTaskUniqueBoard();
          case "!R1":
            return !this.hasTaskUniqueBoard();
          case "R2":
            return this.hasStepUniqueFlow();
          case "!R2":
            return !this.hasStepUniqueFlow();
          case "ST1":
            return this.canGetTasksFromStep();
          case "!ST1":
            return !this.canGetTasksFromStep();
        }
      });
      if (match) {
        return true;
      }
    }
    return false;
  }

  /**
   * Function is call if condition holds. Otherwise a `NotImplementedError` is thrown.
   *
   * Options are given in the form [ [A1, ..., An], ..., [ Z1, ..., Zm ] ]
   * meaning (A1 and ... and An) or ... or (Z1 and ... Zn)
   *
   */
  public get requireOptions() {
    const config = this;
    return (...options: (TOptions | TOptions[])[]) =>
      <F extends (...args: any[]) => any | void | undefined | null>(fn: F) => {
        return ((...args: Parameters<F>) => {
          if (!config.matchesOptions(options)) {
            throw new NotImplementedError(
              `Required options ${options}.\nCurrent options: ${this.currentOptions()}.`
            );
          }
          return fn(...args);
        }) as F;
      };
  }
}
