---
title: Installation
description: Install the `pls` executable and execute some first steps.
---

> 💡 Installing the `pls` executable currently requires the [Deno CLI][Deno CLI]
> version 1.29.2 or higher to be [installed][installed]. This requirement will
> be removed once the preview period is over.

To install the Platformscript interpreter on your system, run the following:

```shellsession
$ deno install -A @@INSTALLER@@
```

This will install the `pls` executable on your path, which you can confirm by
running

```shellsession
$ pls --version
```

Once you have `pls` installed, you can use it to run PlatformScript programs.

To try it out, create a file called `welcome.yaml` and paste the following
text into it:

```yaml
Welcome to PlatformScript!
```

You can now use `pls` to execute PlatformScript programs. To do this we use the
`run` command. Try it out in your console with the file you just created.

```shellsession
$ pls run welcome.yaml

```

> 💡By default, the result of evaluating a PlatformScript value is itself. Hence
> the program to print out "Welcome to PlatformScript" is nothing more than the
> YAML string `Welcome to PlatformScript!`

<!-- TODO add link to module docs when available -->

What's happening here is that the `pls run` command is evaluating the
PlatformScript module contained in the file `welcome.yaml`. But modules can
be located anywhere adressable by a URL, not just on the local filesystem. For
example, you can run run the preceding example online with the command:

```shellsession
$ pls run https://pls.pub/std/examples/welcome.yaml
Welcome to PlatformScript!
```

[Deno CLI]: https://deno.land
[installed]: https://deno.land/manual/getting_started/installation
