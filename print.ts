import type { PSString, PSValue } from "./types.ts";

import { yaml } from "./deps.ts";
import * as data from "./data.ts";
import { isLiteral } from "./read.ts";

export function print(value: PSValue): PSString {
  let doc = new yaml.Document(toYAML(value));
  return data.string(doc.toString().slice(0, -1));
}

function toYAML(value: PSValue): yaml.Node {
  if (isLiteral(value)) {
    return value.node;
  }

  switch (value.type) {
    case "string":
    case "number":
    case "boolean":
      return new yaml.Scalar(value.value);
    case "list": {
      let seq = new yaml.YAMLSeq();
      for (let item of value.value) {
        seq.add(toYAML(item));
      }
      return seq;
    }
    case "map": {
      let map = new yaml.YAMLMap();
      for (let [k, v] of value.value.entries()) {
        map.add(new yaml.Pair(toYAML(k), toYAML(v)));
      }
      return map;
    }
    case "ref":
    case "template":
      return toYAML(value.value);
    case "fn": {
      let map = new yaml.YAMLMap();
      if (value.value.type === "platformscript") {
        map.add(
          new yaml.Pair(toYAML(value.value.head), toYAML(value.value.body)),
        );
      } else {
        let head = `(${value.param.name})=>`;
        let body = "<[native fn]>";
        map.add(new yaml.Pair(new yaml.Scalar(head), new yaml.Scalar(body)));
      }
      return map;
    }
    case "fncall":
      return toYAML(value.source);
    case "external":
      return new yaml.Scalar("<[external]>");
    default:
      throw new Error(`FATAL: non exhaustive print() match.`);
  }
}
