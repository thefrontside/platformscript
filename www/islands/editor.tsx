import MonacoEditor from '../components/monaco-editor.tsx';
import { useCallback, useRef, useState, useEffect } from "preact/hooks";
import type { OnMount, BeforeMount, OnChange } from "https://esm.sh/v102/@monaco-editor/react@4.4.6";

type EditorProps = { language: string; value: string; }

export type MonacoEditor = Parameters<OnMount>[0];
export type OnChangeArgs = Parameters<OnChange>;
export type Monaco = Parameters<BeforeMount>[0];


const LanguageId = 'yaml';

function handleEditorWillMount(monaco: Monaco) {
  monaco.languages.setLanguageConfiguration(LanguageId, {
    comments: {
      lineComment: '#',
    },
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
    ],
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],
    surroundingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '"', close: '"' },
      { open: "'", close: "'" },
    ],

    onEnterRules: [
      {
        beforeText: /:\s*$/,
        action: { indentAction: monaco.languages.IndentAction.Indent },
      },
    ],
  });

  monaco.languages.register({
    id: LanguageId,
    extensions: ['.yaml', '.yml'],
    aliases: ['YAML', 'yaml', 'YML', 'yml'],
    mimetypes: ['application/x-yaml'],
  });
}

export default function Editor({ language, value }: EditorProps) {
  const editorRef = useRef<MonacoEditor>(null);
  const [yaml, setYaml] = useState<string | undefined>('true');

  const handleEditorMount = useCallback((editor: MonacoEditor) => {
    editorRef.current = editor;
    editorRef.current.focus();
  }, []);

  return <MonacoEditor
    editorWillMount={handleEditorWillMount}
    editorDidMount={handleEditorMount} language={language}
    defaultValue={value}
    defaultLanguage="yaml"
    value={yaml}
    onChange={(value) => setYaml(value)}
    theme="vs-dark"
  />
}