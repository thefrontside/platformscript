import { MonacoEditor } from "../components/monaco-editor.tsx";
import type { MonacoEditorCreateOptions } from "../types/monaco.ts";
import { useState } from "preact/hooks";
import { useTask, sleep } from "../hooks/use-task.ts";

//https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IStandaloneEditorConstructionOptions.html
const sharedOptions: MonacoEditorCreateOptions = {
  tabSize: 2,
  automaticLayout: true,
  minimap: { enabled: false },
};

const sourceOptions = {
  ...sharedOptions,
}

const previewOptions = {
  ...sharedOptions,
  readOnly: true,
}

export default function PSPlayground() {
  let [result, setResult] = useState("");
  let onChange = useTask<string>(function* (value) {
    yield* sleep(200);
    setResult(value)
  }, [result]);

  return (
    <div class="h-full grid grid-cols-2 gap-4">
      <MonacoEditor value="true" language="yaml" options={sourceOptions} onChange={onChange} />

      <MonacoEditor value={String(result)} language="yaml" options={previewOptions} />
    </div>
  )
}
