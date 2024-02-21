import { Container, interfaces } from "inversify";

describe("Injection of classes via toDynamicValue", () => {
  beforeAll(async () => {});

  // keys
  const Types = {
    Add: "Add",
    Prepend: "Prepend",
  };
  // interfaces
  interface TBase {
    add: TAdd; // Exposing it here just for testing
    prepend: TPrepend; // Exposing it here just for testing
  }
  interface TAdd extends TBase {
    A: (text: string) => string;
    B: (text: string) => string;
  }
  interface TPrepend extends TBase {
    A: (text: string) => string;
    B: (text: string) => string;
  }
  // classes
  class Base implements TBase {
    constructor(protected context: interfaces.Context) {}
    get add(): TAdd {
      return this.context.container.get<TAdd>(Types.Add);
    }
    get prepend(): TPrepend {
      return this.context.container.get<TPrepend>(Types.Prepend);
    }
  }
  class Add extends Base implements TAdd {
    get A() {
      return (text: string): string => {
        expect(this).toBeInstanceOf(Add);
        expect(this.prepend.A("text")).toBe("Atext");
        return text + "A";
      };
    }
    get B() {
      return (text: string): string => {
        expect(this).toBeInstanceOf(Add);
        return text + "B";
      };
    }
  }
  class Prepend extends Base implements TPrepend {
    get A() {
      return (text: string): string => {
        expect(this).toBeInstanceOf(Prepend);
        return "A" + text;
      };
    }
    get B() {
      return (text: string): string => {
        expect(this).toBeInstanceOf(Prepend);
        return "B" + text;
      };
    }
  }

  type TContainerProvider = (props?: {
    addFactory?: (context: interfaces.Context) => TAdd;
    prependFactory?: (context: interfaces.Context) => TPrepend;
  }) => Container;
  const getContainer: TContainerProvider = ({
    addFactory = (context: interfaces.Context) => new Add(context),
    prependFactory = (context: interfaces.Context) => new Prepend(context),
  } = {}) => {
    // binding
    const container = new Container({ defaultScope: "Singleton" });
    container.bind<TAdd>(Types.Add).toDynamicValue(addFactory);
    container.bind<TPrepend>(Types.Prepend).toDynamicValue(prependFactory);
    return container;
  };

  it("Members are functions", async () => {
    const container = getContainer();
    const addA = container.get<TAdd>(Types.Add).A;
    expect(addA).toBeInstanceOf(Function);
    expect(addA("text")).toBe("textA");

    const addB = container.get<TAdd>(Types.Add).B;
    expect(addB).toBeInstanceOf(Function);
    expect(addB("text")).toBe("textB");

    const prependA = container.get<TPrepend>(Types.Prepend).A;
    expect(prependA).toBeInstanceOf(Function);
    expect(prependA("text")).toBe("Atext");

    const prependB = container.get<TPrepend>(Types.Prepend).B;
    expect(prependB).toBeInstanceOf(Function);
    expect(prependB("text")).toBe("Btext");
  });

  it("Circular dependency", async () => {
    const container = getContainer();
    const add = container.get<TAdd>(Types.Add);
    const prepend = container.get<TPrepend>(Types.Prepend);

    expect(add.prepend).toBe(prepend);
    expect(prepend.add).toBe(add);
  });

  it("Extension as a regular class with interface", async () => {
    // interfaces
    interface TAddExtended extends TAdd {
      wrapA: (text: string) => string;
    }

    // classes
    class AddExtended extends Add implements TAddExtended {
      wrapA(text: string) {
        expect(this).toBeInstanceOf(AddExtended);
        return this.prepend.A(this.A(text));
      }
    }

    // then
    const container = getContainer({
      addFactory: (context) => new AddExtended(context),
    });
    const add = container.get<TAddExtended>(Types.Add);
    expect(add).toBeInstanceOf(AddExtended);
    expect(add.wrapA("text")).toBe("AtextA");
  });

  it("Extension as a regular class without interface", async () => {
    // classes
    class AddExtended extends Add {
      wrapA(text: string) {
        expect(this).toBeInstanceOf(AddExtended);
        return this.prepend.A(this.A(text));
      }
    }

    // then
    const container = getContainer({
      addFactory: (context) => new AddExtended(context),
    });
    const add = container.get<AddExtended>(Types.Add);
    expect(add).toBeInstanceOf(AddExtended);
    expect(add.wrapA("text")).toBe("AtextA");
  });

  it("Extension as a regular class with methods as getters", async () => {
    // classes
    class AddExtended extends Add {
      get wrapA() {
        return (text: string): string => {
          expect(this).toBeInstanceOf(AddExtended);
          return this.prepend.A(this.A(text));
        };
      }
    }

    // then
    const container = getContainer({
      addFactory: (context) => new AddExtended(context),
    });
    const wrapA = container.get<AddExtended>(Types.Add).wrapA;
    expect(wrapA).toBeInstanceOf(Function);
    expect(wrapA("text")).toBe("AtextA");
  });
});
