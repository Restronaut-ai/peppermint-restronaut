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
      className="bg-muted rounded-md min-h-32 ring-1 ring-border focus:ring-2 focus:ring-primary p-2 placeholder:text-foreground/85"
      onChange={() => {
        setIssue(editor.document);
      }}
    />
  );
}
