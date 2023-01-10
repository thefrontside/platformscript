import { useState, useEffect } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

const monacoSrc = 'https://esm.sh/monaco-editor@0.34.1';

declare global {
  interface Window {
    MonacoEnvironment:  {
      getWorker(moduleId: string, label: string): Worker;
    };
  }
}

export function useMonaco(deps: unknown[]): AsyncState<MonacoModule> {
  if (!IS_BROWSER) {
    return { type: 'pending' }
  }
  
  self.MonacoEnvironment = {
    getWorker: function (_moduleId, label) {
      return new Worker(`./worker.js?label=${label}`, { type: 'module' });
    },
  }

  return useAsync(() => import(monacoSrc), deps); 
}

type AsyncState<T> = {
  type: 'resolved';
  value: T;
} | {
  type: 'rejected';
  error: Error;
} | {
  type: 'pending';
}

function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  let [state, setState] = useState<AsyncState<T>>({ type: 'pending' });
  useEffect(() => {
    fn()
      .then(value => setState({ type: 'resolved', value }))
      .catch(error => setState({ type: 'rejected', error }));
  }, deps);
  return state;
}


