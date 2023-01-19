---
title: Introduction
description: Introduction to PlatformScript
---

PlatformScript is a declarative, statically typed, secure, and embeddable
programming language that uses 100% pure YAML as its syntax.

## Features at a Glance.

- Uses lexically scoped **variables** to bind values names to values and
  reference them later.
- **Functions** are first class citizens. They can even be bound to variables
  and passed to other functions for higher order programming.
- Fluent **templating** allows building strings with _any_ set of PlatformScript
  expressions, not just simple substitutions.
- Define new syntactic forms with PlatformScript itself using **macros**.
- Compose programs with an elegant **module system** for sharing code based on
  simple URLs.
- **Native extensions** expose new functionality with any language that can be
  compiled to WASM
- Powerful execution model based on **structured concurrency** prevents leaked
  resources by default.

## Philosophy

PlatformScript is designed to eliminate the bugs, validation errors, and tedium
of working with YAML by bringing to bear all the rigor and tooling of a modern
language such as type-checkers, language servers, linters, etc...

It will always use plain YAML without extensions as it syntax, so that
all PlatformScript programs can be represented as YAML documents, and
it adopts a policy of "no magic" as in no magic functions, no magic
variables, and a small, consistent set of evaluation rules.

PlatformScript should always be an excellent choice to replace configuration
files and special one-off DSLs, especially those that use YAML for their syntax.

## Built with Deno

PlatformScript is built with [Deno][Deno], but more than that, it adopts Deno's
system of thinking about developer experience; especially as it pertains to
modules and code sharing.

[Deno]: https://deno.land
