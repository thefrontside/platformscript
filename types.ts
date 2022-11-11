import { Operation, YAMLNode } from "./deps.ts";

export interface YSEnv {
  eval(value: YSValue, scope?: YSMap): Operation<YSValue>;
}

export interface YSModule {
  url: string;
  symbols: YSMap;
  value: YSValue;
}

export type YSValue =
  | YSNumber
  | YSBoolean
  | YSString
  | YSRef
  | YSList
  | YSMap
  | YSFn;

export type YSLiteral<T extends YSValue> = T & {
  node: YAMLNode;
};

export interface YSNumber {
  type: "number";
  value: number;
}

export interface YSBoolean {
  type: "boolean";
  value: boolean;
}

export interface YSString {
  type: "string";
  value: string;
}

export interface YSRef {
  type: "ref";
  name: string;
  path: [string, ...string[]];
}

export interface YSList {
  type: "list";
  value: YSValue[];
}

export interface YSMap {
  type: "map";
  value: Record<string, YSValue>;
}

export interface YSFn {
  type: "fn";
  value(call: YSFnCall): Operation<YSValue>;
}

export interface YSFnCall {
  arg: YSValue;
  rest: YSMap;
  env: YSEnv;
}
