// import type { PSValue, PSRef } from "../types.ts";

// import { assert, describe, expect, it } from "./suite.ts";
// import * as ps from "../mod.ts";

// describe("scope", () => {
//   it("can tell if all of the references are balanced", () => {
//     let program = ps.parse("$(x): { $(y): '%($x) %($y)' }");
//     assert(program.type === "fn");
//     let holes = unsatisfied(program);
//     expect(holes.length).toEqual(0);
//   });

//   it("can tell if all of the references are satisfied", () => {
//     let program = ps.parse("$(x): { $(): '%($x) %($y)' }");
//     assert(program.type === "fn");
//     let holes = unsatisfied(program);
//     let [hole] = holes;
//     expect(hole).toBeDefined();
//     expect(hole.key).toEqual('y');
//   });
// })

// function unsatisfied(value: PSValue): PSRef[] {
//   if (value.type === 'fn') {
//     let { body, param } = value;
//     return unsatisfied(body).filter(ref => ref.key !== param.name)
//   } else if (value.type === 'template') {
//     return value.expressions.reduce((refs, expr) => {
//       return refs.concat(unsatisfied(expr.expression));
//     },[] as PSRef[]);
//   } else if (value.type === 'ref') {
//     return [value];
//   } else {
//     return [];
//   }
// }
