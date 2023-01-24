import * as semver from "./deps.ts";

export type SemVer = semver.SemVer;

export interface Lineage {
  name: string;
  ref: string;
  prefix: string;
}

export interface Impact {
  level: "major" | "minor" | "patch";
  lineage: Lineage;
  summary: string;
  details?: string;
}

export interface Release {
  lineage: Lineage;
  version: SemVer;
  tag: string;
}

export interface Note {
  ref: string;
  targetId: string;
  content: string;
}

export interface Commit {
  id: string;
  summary: string;
  refs: string[];
  tags: string[];
  line: string;
}

export interface Idempotent<T> {
  redundant: boolean;
  value: T;
}

export interface Signoff {
  commitId: string;
  releases: string[];
  taggedAt?: string;
}
