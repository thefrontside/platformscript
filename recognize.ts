import type { PSMapKey, PSString, PSTemplate, PSValue } from "./types.ts";

import { derive, read } from "./read.ts";
import * as data from "./data.ts";

export function recognize(value: PSValue): PSValue {
  if (value.type === "string") {
    let expressions = matchTemplate(value.value);
    if (expressions.length > 0) {
      return {
        type: "template",
        value,
        expressions,
      };
    } else if (value.quote) {
      return value;
    } else {
      let match = matchReference(value.value);
      if (match) {
        return {
          type: "ref",
          value,
          key: match.key,
          path: match.path,
        };
      } else {
        return value;
      }
    }
  } else if (value.type === "map") {
    let entries = [...value.value.entries()];
    let [first] = entries;
    if (!first) {
      return value;
    } else {
      let [firstKey, firstValue] = first;
      let fnmatch = String(firstKey.value).match(/^\(\s*(.*)\)\s*=>$/);
      if (fnmatch) {
        let param = fnmatch[1];
        let body = recognize(firstValue);
        return {
          type: "fn",
          param: { name: param },
          value: {
            type: "platformscript",
            head: firstKey as PSString,
            body,
          },
        };
      } else {
        let $firstKey = recognize(firstKey);
        if ($firstKey.type === "ref") {
          let [, ...rest] = entries;
          return {
            type: "fncall",
            value: $firstKey,
            arg: firstValue,
            rest: {
              type: "map",
              value: new Map(rest),
            },
            source: value,
          };
        }
        return derive(value, {
          type: "map",
          value: new Map(entries.map(([k, v]) => {
            let value = recognize(v);

            //match method syntax
            let mmatch = String(k.value).match(/^\s*(.+)\((.*)\)\s*$/);
            if (mmatch) {
              let [, key, param] = mmatch;
              return [data.string(key), {
                type: "fn",
                param: { name: param },
                value: {
                  type: "platformscript",
                  head: k as PSString,
                  body: value,
                },
              }];
            } else {
              return [k as PSMapKey, value];
            }
          })),
        });
      }
    }
  } else {
    return value;
  }
}

function matchTemplate(value: string) {
  let valueIdx = 0;
  let exprIdx = 1;
  let regex = /%\(([\s\S]+?)\)/gmd;
  let i = value.matchAll(regex);

  let expressions: PSTemplate["expressions"] = [];

  for (let next = i.next(); !next.done; next = i.next()) {
    let match = next.value;
    let expression = recognize(read(match[exprIdx]));

    expressions.push({
      expression,

      //@ts-expect-error RegExpMatchArray#indices not yet in the default TS lib
      range: match.indices[valueIdx],
    });
  }
  return expressions;
}

function matchReference(value: string) {
  let pathIdx = 1;
  let match = value.match(/^\$(\S+)$/);

  if (match) {
    let [key, ...path] = match[pathIdx].split(".");
    return {
      key,
      path,
    };
  }
}
