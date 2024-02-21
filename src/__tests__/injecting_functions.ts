import { Container, interfaces } from "inversify";

describe("Tests on how to inject functions", () => {
  beforeAll(async () => {});

  it("Injection of function with access to all context by using dynamic values", async () => {
    // interface
    type TAddA = (text: string) => string;
    type TAddB = (text: string) => string;

    // utils
    type Factory<T> = (context: interfaces.Context) => T;

    // factories
    const addAFactory: Factory<TAddA> =
      ({ container }) =>
      (text) => {
        const addB = container.get<TAddB>("B");
        expect(addB("text")).toBe("textB");
        return text + "A";
      };
    const addBFactory: Factory<TAddB> =
      ({ container }) =>
      (text) => {
        container.get<TAddA>("A");
        return text + "B";
      };

    // binding
    const container = new Container({ defaultScope: "Singleton" });
    container.bind<TAddA>("A").toDynamicValue(addAFactory);
    container.bind<TAddB>("B").toDynamicValue(addBFactory);

    // Then
    const addA = container.get<TAddA>("A");
    expect(addA).toBeInstanceOf(Function);
    expect(addA("text")).toBe("textA");

    const addB = container.get<TAddB>("B");
    expect(addB).toBeInstanceOf(Function);
    expect(addB("text")).toBe("textB");
  });

  it("Injection of function with access to all context by using dynamic values and several containers", async () => {
    // keys
    const Add = {
      A: "AddA",
      B: "AddB",
    };
    const Prepend = {
      A: "PrependA",
      B: "PrependB",
    };
    // interfaces
    // first container
    type TAddA = (text: string) => string;
    type TAddB = (text: string) => string;
    // second container
    type TPrependA = (text: string) => string;
    type TPrependB = (text: string) => string;

    // utils
    type Factory<T> = (context: interfaces.Context) => T;

    // factories
    const addAFactory: Factory<TAddA> =
      ({ container }) =>
      (text) => {
        container.get<TAddB>(Add.B);
        const prependA = container.get<TPrependA>(Prepend.A);
        expect(prependA("text")).toBe("Atext");
        container.get<TPrependB>(Prepend.B);
        return text + "A";
      };
    const addBFactory: Factory<TAddB> =
      ({ container }) =>
      (text) => {
        container.get<TAddA>(Add.A);
        container.get<TPrependA>(Prepend.A);
        container.get<TPrependB>(Prepend.B);
        return text + "B";
      };
    const prependAFactory: Factory<TPrependA> =
      ({ container }) =>
      (text) => {
        container.get<TAddA>(Add.A);
        container.get<TAddB>(Add.B);
        container.get<TPrependB>(Prepend.B);
        return "A" + text;
      };
    const prependBFactory: Factory<TPrependB> =
      ({ container }) =>
      (text) => {
        container.get<TAddA>(Add.A);
        container.get<TAddB>(Add.B);
        container.get<TPrependA>(Prepend.A);
        return "B" + text;
      };

    // binding
    const addContainer = new Container({ defaultScope: "Singleton" });
    addContainer.bind<TAddA>(Add.A).toDynamicValue(addAFactory);
    addContainer.bind<TAddB>(Add.B).toDynamicValue(addBFactory);

    const prependContainer = new Container({ defaultScope: "Singleton" });
    prependContainer.bind<TPrependA>(Prepend.A).toDynamicValue(prependAFactory);
    prependContainer.bind<TPrependB>(Prepend.B).toDynamicValue(prependBFactory);

    const childContainer = Container.merge(addContainer, prependContainer);

    // Then
    const addA = childContainer.get<TAddA>(Add.A);
    expect(addA).toBeInstanceOf(Function);
    expect(addA("text")).toBe("textA");

    const addB = childContainer.get<TAddB>(Add.B);
    expect(addB).toBeInstanceOf(Function);
    expect(addB("text")).toBe("textB");

    const prependA = childContainer.get<TAddA>(Prepend.A);
    expect(prependA).toBeInstanceOf(Function);
    expect(prependA("text")).toBe("Atext");

    const prependB = childContainer.get<TAddB>(Prepend.B);
    expect(prependB).toBeInstanceOf(Function);
    expect(prependB("text")).toBe("Btext");
  });
});
