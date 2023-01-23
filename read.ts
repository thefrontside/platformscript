import type { PSLiteral, PSMapKey, PSValue } from "./types.ts";
import { yaml } from "./deps.ts";
import * as data from "./data.ts";

export function read(source: string): PSLiteral<PSValue> {
  let result = yaml.parseDocument(source, { keepSourceTokens: true });
  let [error] = result.errors;
  if (error) {
    throw error;
  }
  return readNode(result.contents);
}

function readNode(node: yaml.ParsedNode | null): PSLiteral<PSValue> {
  if (yaml.isScalar(node)) {
    switch (typeof node.value) {
      case "number":
        return literal(node, {
          type: "number",
          value: node.value,
        });
      case "boolean":
        return literal(node, {
          type: "boolean",
          value: node.value,
        });
      case "string":
        return literal(node, {
          type: "string",
          value: node.value,
        });
      default:
        throw new Error(`unknown YAML node type '${typeof node.value}'`);
    }
  } else if (yaml.isMap(node)) {
    return literal(node, {
      type: "map",
      value: new Map(node.items.map((item) => {
        //TODO: revisit what is a map key
        let key = readNode(item.key);
        let value = readNode(item.value);
        return [key as PSMapKey, value];
      })),
    }) as PSLiteral;
  } else if (yaml.isSeq(node)) {
    return literal(node, {
      type: "list",
      value: node.items.map((item) => readNode(item)),
    });
  } else if (!node) {
    return data.string("") as PSLiteral<PSValue>;
  } else {
    throw new Error(`unrecognized YAML node: '${node.toString()}`);
  }
}

export function isLiteral<T extends PSValue>(
  value?: T | null,
): value is PSLiteral<T> {
  return !!value && yaml.isNode((value as PSLiteral<T>).node);
}

export function derive<T extends PSValue>(parent: T, child: T): T {
  if (isLiteral(parent)) {
    literal(parent.node, child);
  }
  return child;
}

function literal<T extends PSValue>(
  node: yaml.ParsedNode,
  value: T,
): PSLiteral<T> {
  return Object.defineProperty(value, "node", {
    enumerable: false,
    value: node,
  }) as PSLiteral<T>;
}
