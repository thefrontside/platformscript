import { MonacoEditor } from "../components/monaco-editor.tsx";
import type { MonacoEditorCreateOptions } from "../types/monaco.ts";
import { useEffect, useState } from "preact/hooks";
import { sleep, useTask } from "../hooks/use-task.ts";

import { createYSEnv, parse, ps2js } from "../../mod.ts";

//https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IStandaloneEditorConstructionOptions.html
const sharedOptions: MonacoEditorCreateOptions = {
  tabSize: 2,
  automaticLayout: true,
  minimap: { enabled: false },
};

const sourceOptions = {
  ...sharedOptions,
};

const previewOptions = {
  ...sharedOptions,
  readOnly: true,
};

export default function PSPlayground() {
  let value = "true";
  let [result, setResult] = useState("");
  let onChange = useTask<string>(function* (value) {
    yield* sleep(200);
    try {
      let program = parse(value);
      let env = createYSEnv();
      let ps = yield* env.eval(program);
      let js = ps2js(ps);
      setResult(JSON.stringify(js, null, 2));
    } catch (error) {
      setResult(JSON.stringify(
        {
          name: error.name,
          message: error.message,
        },
        null,
        2,
      ));
    }
  }, [result]);

  useEffect(() => setResult(value), []);

  return (
    <div class="h-full grid grid-cols-2 gap-4">
      <MonacoEditor
        value={value}
        language="yaml"
        options={sourceOptions}
        onChange={onChange}
      />
      <MonacoEditor
        value={String(result)}
        language="json"
        options={previewOptions}
      />
    </div>
  );
}
