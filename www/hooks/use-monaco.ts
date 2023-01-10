import { useState, useEffect } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

const monacoSrc = 'https://esm.sh/monaco-editor@0.34.1';

//only ever load the monaco library once.
let cache: AsyncState<MonacoModule> = { type: 'pending' };

export function useMonaco(deps: unknown[]): AsyncState<MonacoModule> {
  if (!IS_BROWSER) {
    return cache;
  }
  
  self.MonacoEnvironment = {
    getWorker: function (_moduleId, label) {
      return new Worker(`./worker.js?label=${label}`, { type: 'module' });
    },
  }

  return useAsync(async () => {
    if (cache.type !== 'resolved') {
      cache = await import(monacoSrc);
    }
    return cache;
  }, deps); 
}

export type AsyncState<T> = {
  type: 'resolved';
  value: T;
} | {
  type: 'rejected';
  error: Error;
} | {
  type: 'pending';
}

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  let [state, setState] = useState<AsyncState<T>>({ type: 'pending' });
  useEffect(() => {
    fn()
      .then(value => setState({ type: 'resolved', value }))
      .catch(error => setState({ type: 'rejected', error }));
  }, deps);
  return state;
}


