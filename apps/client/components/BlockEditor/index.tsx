import { useTheme } from "next-themes";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

export default function BlockNoteEditor({ setIssue }) {
  const editor = useCreateBlockNote();
  const { resolvedTheme } = useTheme();

  return (
    <BlockNoteView
      editor={editor}
      sideMenu={false}
      theme={resolvedTheme as any}
      onChange={() => {
        setIssue(editor.document);
      }}
    />
  );
}
