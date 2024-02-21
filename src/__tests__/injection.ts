describe("General about injection", () => {
  beforeAll(async () => {});

  it("Calling a regular method with bind, make `this` to change", async () => {
    class Foo {
      expectThis() {
        return expect(this);
      }
    }
    const foo = new Foo();

    foo.expectThis().toBe(foo);
    foo.expectThis.bind(undefined)().toBeUndefined();
    foo.expectThis.apply(undefined, []).toBeUndefined();
    foo.expectThis.call(undefined).toBeUndefined();
    const savedMethod = foo.expectThis;
    savedMethod().toBeUndefined();
  });

  it("Calling a getter function with bind, make `this` to change", async () => {
    class Foo {
      get expectThis() {
        return () => expect(this);
      }
    }
    const foo = new Foo();

    foo.expectThis().toBe(foo);
    foo.expectThis.bind(undefined)().toBe(foo);
    foo.expectThis.apply(undefined, []).toBe(foo);
    foo.expectThis.call(undefined).toBe(foo);
    const savedMethod = foo.expectThis;
    savedMethod().toBe(foo);
  });
});
