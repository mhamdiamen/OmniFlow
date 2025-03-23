"use client";

import { useTheme } from "next-themes";
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { BlockNoteView, Theme } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { useEdgeStore } from "@/lib/edgestore";
import { useEffect, useCallback, useRef } from "react";
import { debounce } from "lodash"; // Import debounce from lodash

// Add this to prevent multiple Yjs imports
if (typeof window !== "undefined") {
  // @ts-ignore
  window._yjs_instance = window._yjs_instance || {};
}

interface EditorProps {
  onChange: (value: string) => void;
  initialContent?: string;
  editable?: boolean;
}

const BlockEditor = ({ onChange, initialContent, editable }: EditorProps) => {
  const { resolvedTheme } = useTheme();
  const { edgestore } = useEdgeStore();

  const handleUpload = async (file: File) => {
    const response = await edgestore.publicFiles.upload({ file });
    return response.url;
  };
  const customDarkTheme: Theme = {
    colors: {
      editor: {
        text: "#FFFFFF", // White text
        background: "#0a0a0a", // Dark background
      },
      menu: {
        text: "#FFFFFF", // White text
        background: "#0a0a0a", // Dark menu background
      },
      tooltip: {
        text: "#FFFFFF", // White text
        background: "#0a0a0a", // Dark tooltip background
      },
      hovered: {
        text: "#FFFFFF", // White text
        background: "#0a0a0a", // Dark hover background
      },
      selected: {
        text: "#FFFFFF", // White text
        background: "#0a0a0a", // Dark selected background
      },
    },
    borderRadius: 4, // Rounded corners
    fontFamily: "Arial, sans-serif", // Custom font
  };
  // Initialize the editor
  const editor = useCreateBlockNote({
    uploadFile: handleUpload,
  });

  // Ref to track if the initial content has been set
  const isInitialContentSet = useRef(false);

  // Parse initialContent and set it in the editor (only once)
  useEffect(() => {
    if (!initialContent || isInitialContentSet.current) return;

    let parsedInitialContent: PartialBlock[];
    try {
      parsedInitialContent = JSON.parse(initialContent);
    } catch (error) {
      console.error("Failed to parse initial content:", error);
      return;
    }

    // Replace the editor's content with the parsed initial content
    editor.replaceBlocks(editor.document, parsedInitialContent);
    isInitialContentSet.current = true; // Mark initial content as set
  }, [initialContent, editor]);

  // Debounced onChange handler
  const debouncedOnChange = useCallback(
    debounce(() => {
      const contentJSON = JSON.stringify(editor.document);
      onChange(contentJSON);
    }, 300), // Debounce for 300ms
    [editor, onChange]
  );

  // Handle editor changes
  const handleEditorChange = useCallback(() => {
    debouncedOnChange();
  }, [debouncedOnChange]);

  return (
    <div
      className="overflow-y-auto h-full p-4 scrollbar-hide" // Added scrollbar-hide class
    >
      <BlockNoteView
        editor={editor}
        editable={editable}
        theme={resolvedTheme === "dark" ? customDarkTheme : "light"}
        onChange={handleEditorChange}
      />
    </div>
  );
};

export default BlockEditor;