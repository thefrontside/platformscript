import { useState, useRef, useEffect } from "preact/hooks";

const monacoSrc = 'https://esm.sh/monaco-editor@0.34.1';

function getMonacoUrl(path?: string) {
  if (path) {
    return `${monacoSrc}/${path}`;
  } else {
    return monacoSrc;

  }
}


export function Editor() {

  let ref = useRef(null);

  let lib = useAsync(async () => {
    if (ref.current) {
      let mod = await import(`${monacoSrc}`);
      self.MonacoEnvironment = {
	getWorkerUrl: function (moduleId, label) {
          console.dir({ moduleId, label });
          if (moduleId === 'workerMain.js') {
            return getMonacoUrl('esm/vs/editor/editor.worker');
          } else {
            return getMonacoUrl(`esm/vs/language/${label}/${label}.worker`);
          }
	}
      };
      mod.editor.create(ref.current, {
        value: 'true',
        language: 'yaml',

      });
      return mod;
    } else {
      return await new Promise(() => {});
    }
  }, [ref])

  if (lib.type === 'pending') {
    return <div ref={ref}>Loading</div>
  } else if (lib.type === 'rejected') {
    return <div ref={ref}>{String(lib.error)}</div>
  } else {
    return <div ref={ref}></div>
  }
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

export default Editor;
