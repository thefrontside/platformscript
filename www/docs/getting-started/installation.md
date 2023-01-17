---
title: Installation
description: Install the `pls` executable
---

> 💡 Installing the `pls` executable currently requires the [Deno CLI][] version
> 1.29.2 or higher to be [installed][]. This requirement will
> be removed once the preview period is over.

To install the Platformscript interpreter on your system, run the following:

``` shellsession
$ deno install -A @@INSTALLER@@
```

This will install the `pls` executable on your path, which you can confirm by
running

``` shellsession
$ pls --version
```

[Deno CLI]: https://deno.land
[installed]: https://deno.land/manual/getting_started/installation
