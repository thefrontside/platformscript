import type { MonacoModule } from "../types/monaco.ts";

import { useState, useEffect } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

const monacoSrc = 'https://esm.sh/monaco-editor@0.34.1';

type Cache = {
  state: 'empty';
} | {
  state: 'attempting';
  attempt: Promise<MonacoModule>;
} | {
  state: 'resolved';
  mod: MonacoModule;
} | {
  state: 'rejected';
  error: Error;
};

let cache: Cache = { state: 'empty' };

export function useMonaco(): AsyncState<MonacoModule> {
  if (!IS_BROWSER) {
    return { type: "pending" };
  }


  return useAsync(async () => {
    if (cache.state === 'resolved') {
      return cache.mod;
    } else if (cache.state === 'attempting') {
      return await cache.attempt;
    } else {
      let attempt = load();
      cache = {
        state: 'attempting',
        attempt,
      };
      return await attempt;
    }
  });
}

async function load() {
  try {
    let mod = await import(monacoSrc);

    self.MonacoEnvironment = {
      getWorker: function (_moduleId, label) {
        return new Worker(`./worker.js?label=${label}&v=0.34.1`, { type: 'module' });
      },
    };

    // <link rel="stylesheet" type="text/css" href="https://esm.sh/monaco-editor@0.34.1/min/vs/editor/editor.main.css"/>    
    document.head.appendChild(Object.assign(document.createElement('link'), {
      rel: "stylesheet",
      type: "text/css",
      href: "https://esm.sh/monaco-editor@0.34.1/min/vs/editor/editor.main.css",
    }));

    cache = {
      state: 'resolved',
      mod,
    };

    return mod;
  } catch (error) {
    cache = {
      state: 'rejected',
      error,
    };
    throw error;
  }
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
