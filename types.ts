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
  | PSRef
  | PSList
  | PSMap
  | PSFn;

export type PSLiteral<T extends PSValue> = T & {
  node: YAMLNode;
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

export interface PSRef {
  type: "ref";
  spec: string;
  key: string;
  path: string[];
}

export interface PSList {
  type: "list";
  value: PSValue[];
}

export interface PSMap {
  type: "map";
  value: Record<string, PSValue>;
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
