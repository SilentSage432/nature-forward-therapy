"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type EditorPreviewContextValue = {
  previewEditor: boolean;
  setPreviewEditor: (value: boolean) => void;
};

const EditorPreviewContext = createContext<EditorPreviewContextValue | null>(
  null,
);

export function EditorPreviewProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [previewEditor, setPreviewEditorState] = useState(false);
  const setPreviewEditor = useCallback((value: boolean) => {
    setPreviewEditorState(value);
  }, []);

  const value = useMemo(
    () => ({ previewEditor, setPreviewEditor }),
    [previewEditor, setPreviewEditor],
  );

  return (
    <EditorPreviewContext.Provider value={value}>
      {children}
    </EditorPreviewContext.Provider>
  );
}

export function useEditorPreview(): EditorPreviewContextValue {
  const ctx = useContext(EditorPreviewContext);
  if (!ctx) {
    return {
      previewEditor: false,
      setPreviewEditor: () => undefined,
    };
  }
  return ctx;
}
