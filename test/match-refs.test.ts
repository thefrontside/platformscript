import { describe, expect, it } from "./suite.ts";

import { matchRefs } from "../convert.ts";

describe("matching references", () => {
  it("can match several referenrces across multiple lines", () => {
    let match = matchRefs(`$one  $two.xyz
$three
`);
    expect(match.total).toEqual(false);
    expect(match.holes.length).toEqual(3);
    let [one, two, three] = match.holes;
    expect(one.range).toEqual([0, 4]);
    expect(two.range).toEqual([6, 14]);
    expect(three.range).toEqual([15, 21]);

    let ref = two.ref;
    expect(ref.value).toEqual("$two.xyz");
    expect(ref.key).toEqual("two");
    expect(ref.path).toEqual(["two", "xyz"]);
  });

  it("recognizes when the reference is the entirety of the string", () => {
    expect(matchRefs("$one").total).toEqual(true);
  });
});
