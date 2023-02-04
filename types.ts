//deno-lint-ignore-file no-explicit-any
import { Operation, YAMLParsedNode } from "./deps.ts";

export interface PSEnv {
  eval(value: PSValue, scope?: PSMap): Operation<PSValue>;
  call(fn: PSFn, arg: PSValue, options?: PSMap): Operation<PSValue>;
}

export interface PSModule {
  url: URL;
  source: PSValue;
  value: PSValue;
  imports: {
    module: PSModule;
    bindings: {
      name: string;
      alias?: string;
      all: boolean;
    }[];
  }[];
}

export type PSValue =
  | PSNumber
  | PSBoolean
  | PSString
  | PSTemplate
  | PSRef
  | PSList
  | PSMap
  | PSFn
  | PSFnCall
  | PSExternal;

export type PSMapKey =
  | PSNumber
  | PSBoolean
  | PSString
  | PSRef;

export type PSMapEntry = [PSMapKey, PSValue];

export type PSLiteral<T extends PSValue = PSValue> = T & {
  node: YAMLParsedNode;
};

export interface PSNumber {
  type: "number";
  value: number;
}

export interface PSBoolean {
  type: "boolean";
  value: boolean;
}

export interface PSString {
  type: "string";
  value: string;
  quote?: "single" | "double";
}

export interface PSTemplate {
  type: "template";
  value: PSString;
  expressions: { expression: PSValue; range: [number, number] }[];
}

export interface PSRef {
  type: "ref";
  value: PSString;
  key: string;
  path: string[];
}

export interface PSList {
  type: "list";
  value: PSValue[];
}

export interface PSMap {
  type: "map";
  value: Pick<Map<PSMapKey, PSValue>, "get" | "set" | "entries">;
}

export interface PSExternal {
  type: "external";
  value: any;
  view?(path: string[], value: any): PSValue | void;
}

export interface PSFn {
  type: "fn";
  param: { name: string };
  value: {
    type: "native";
    call(cxt: PSFnCallContext): Operation<PSValue>;
  } | {
    type: "platformscript";
    head: PSString;
    body: PSValue;
  };
}

export interface PSFnCall {
  type: "fncall";
  value: PSRef | PSFn;
  arg: PSValue;
  rest: PSMap;
  source: PSMap;
}

export interface PSFnCallContext {
  fn: PSFn;
  arg: PSValue;
  rest: PSMap;
  env: PSEnv;
}

export interface PSFnParam {
  name: string;
}
