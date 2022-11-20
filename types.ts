//deno-lint-ignore-file no-explicit-any
import { Operation, YAMLNode } from "./deps.ts";

export interface PSEnv {
  eval(value: PSValue, scope?: PSMap): Operation<PSValue>;
}

export interface PSModule {
  url: string;
  symbols: PSMap;
  body: PSValue;
  value: PSValue;
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
  | PSExternal;

export type PSMapKey =
  | PSNumber
  | PSBoolean
  | PSString
  | PSRef;

export type PSMapEntry = [PSMapKey, PSValue];

export type PSLiteral<T extends PSValue = PSValue> = T & {
  node: YAMLNode;
  parent?: YAMLNode;
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
}

export interface PSTemplate {
  type: "template";
  value: string;
  expressions: { expression: PSLiteral; range: [number, number] }[];
}

export interface PSRef {
  type: "ref";
  value: string;
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
  value(call: PSFnCall): Operation<PSValue>;
}

export interface PSFnCall {
  arg: PSValue;
  rest: PSMap;
  env: PSEnv;
}
