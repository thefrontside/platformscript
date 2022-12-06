export interface ExecResult {
  status: Deno.ProcessStatus;
  stdout: string;
  stderr: string;
}

export async function exec(cmd: string[]): Promise<string> {
  let result = await execSafe(cmd);
  if (result.status.success) {
    return result.stdout;
  } else {
    let message = result.stdout.trim()
      ? `${result.stdout}\n${result.stderr}`
      : result.stderr;
    let error = new Error(message);
    error.name = "ExecError";
    throw error;
  }
}

export async function execSafe(cmd: string[]) {
  let p = Deno.run({
    cmd,
    stdout: "piped",
    stderr: "piped",
  });

  try {
    let [status, stdout, stderr] = await Promise.all([
      p.status(),
      p.output(),
      p.stderrOutput(),
    ]);
    let decoder = new TextDecoder();
    return {
      status,
      stdout: decoder.decode(stdout),
      stderr: decoder.decode(stderr),
    };
  } finally {
    p.close();
  }
}

export async function sh(cmdSpec: string | string[]): Promise<void> {
  let encoder = new TextEncoder();
  let cmd = Array.isArray(cmdSpec) ? cmdSpec : cmdSpec.split(/s+/);
  let str = Array.isArray(cmdSpec) ? cmdSpec.join(" ") : cmdSpec;
  Deno.stdout.write(encoder.encode(`${str}\n`));

  let result = await exec(cmd);

  Deno.stdout.write(encoder.encode(result));
}
