export const tap =
  <T extends any | void>(fn: (value: T) => any | void | undefined | null) =>
  (value: T): T => {
    fn(value);
    return value;
  };
