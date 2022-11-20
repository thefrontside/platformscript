import { describe, eval2js, expect, it } from "./suite.ts";

describe("templates", () => {
  it("can evaluate a template literal", async () => {
    expect(await eval2js("Hello %($thing)!", { thing: "World" })).toEqual(
      "Hello World!",
    );
  });

  it("can match several referenrces across multiple lines", async () => {
    expect(await eval2js(`" %(one) %(two) %(three) fin."`)).toEqual(
      " one two three fin.",
    );
  });

  it("recognizes when the template is the entirety of the string", async () => {
    expect(await eval2js("'%(hi)'")).toEqual("hi");
  });
});
