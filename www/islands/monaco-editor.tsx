import type monaco from "https://esm.sh/monaco-editor@0.34.1";
import type { MonacoEditorProps } from "../types/monaco.ts";

import { useEffect, useMemo, useRef } from "preact/hooks";

import { useMonaco } from "../hooks/use-monaco.ts";

export function MonacoEditor({
  width = '100%',
  height = '100%',
  value = null,
  defaultValue = "",
  language = "javascript",
  theme = null,
  options = {},
  overrideServices = {},
  editorWillMount = noop,
  editorDidMount = noop,
  editorWillUnmount = noop,
  onChange = noop,
  className = null,
}: MonacoEditorProps) {

  const containerElement = useRef<HTMLDivElement | null>(null);
  let lib = useMonaco([containerElement]);

  const editor = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const _subscription = useRef<monaco.IDisposable | null>(null);

  const __prevent_trigger_change_event = useRef<boolean | null>(null);

  const fixedWidth = processSize(width);

  const fixedHeight = processSize(height);

  const style = useMemo(
    () => ({
      width: fixedWidth,
      height: fixedHeight,
    }),
    [fixedWidth, fixedHeight]
  );

  const handlers = useMemo(() => {
    if (lib.type !== 'resolved') {
      return {
        handleEditorWillMount: noop,
        handleEditorDidMount: noop,
        handleEditorWillUnmount: noop,
        initMonaco: noop,
      }
    } else {
      let monaco = lib.value;
      const handleEditorWillMount = () => {
        const finalOptions = editorWillMount(monaco);
        return finalOptions || {};
      };

      const handleEditorDidMount = () => {
        if (editor.current !== null) {
          editorDidMount(editor.current, monaco);
          _subscription.current = editor.current.onDidChangeModelContent((event) => {
            if (!__prevent_trigger_change_event.current) {
              if (editor.current) {
                onChange(editor.current.getValue(), event);
              }
            }
          });
        }

      };

      const handleEditorWillUnmount = () => {
        if (editor.current) {
          editorWillUnmount(editor.current, monaco);
        }
      };

      const initMonaco = () => {
        const finalValue = value !== null ? value : defaultValue;
        if (containerElement.current) {
          // Before initializing monaco editor
          const finalOptions = { ...options, ...handleEditorWillMount() };
          editor.current = monaco.editor.create(
            containerElement.current,
            {
              value: finalValue,
              language,
              ...(className ? { extraEditorClassName: className } : {}),
              ...finalOptions,
              ...(theme ? { theme } : {}),
            },
            overrideServices
          );
          // After initializing monaco editor
          handleEditorDidMount();
        }
      };

      return {
        handleEditorWillMount,
        handleEditorDidMount,
        handleEditorWillUnmount,
        initMonaco,
      }
    }


  }, [lib, containerElement]);

  const {
    handleEditorWillUnmount,
    initMonaco,
  } = handlers;


  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(initMonaco, [handlers]);

  useEffect(() => {
    if (editor.current) {
      const model = editor.current.getModel();
      __prevent_trigger_change_event.current = true;
      editor.current.pushUndoStop();
      // pushEditOperations says it expects a cursorComputer, but doesn't seem to need one.
      model?.pushEditOperations(
        [],
        [
          {
            range: model.getFullModelRange(),
            text: value as string,
          },
        ],

        undefined
      );
      editor.current.pushUndoStop();
      __prevent_trigger_change_event.current = false;
    }
  }, [value]);

  useEffect(() => {
    if (editor.current) {
      const model = editor.current.getModel();
      if (lib.type === "resolved") {
        let monaco = lib.value;
        monaco.editor.setModelLanguage(model, language);
      }
    }
  }, [language]);

  useEffect(() => {
    if (editor.current) {
      // Don't pass in the model on update because monaco crashes if we pass the model
      // a second time. See https://github.com/microsoft/monaco-editor/issues/2027
      const { model: _model, ...optionsWithoutModel } = options;
      editor.current.updateOptions({
        ...(className ? { extraEditorClassName: className } : {}),
        ...optionsWithoutModel,
      });
    }
  }, [className, options]);

  useEffect(() => {
    if (editor.current) {
      editor.current.layout();
    }
  }, [width, height]);

  useEffect(() => {
    if (lib.type === 'resolved') {
      let monaco = lib.value;
      monaco.editor.setTheme(theme);
    }
  }, [theme]);

  useEffect(
    () => () => {
      if (editor.current) {
        handleEditorWillUnmount();
        editor.current.dispose();
        const model = editor.current.getModel();
        if (model) {
          model.dispose();
        }
      }
      if (_subscription.current) {
        _subscription.current.dispose();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div
      ref={containerElement}
      style={style}
      className="relative react-monaco-editor-container"
    />
  );
}

export default MonacoEditor;

export function processSize(size: number | string | undefined) {
  return !/^\d+$/.test(size as string) ? size : `${size}px`;
}

export function noop() {}
