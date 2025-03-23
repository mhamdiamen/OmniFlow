"use client";

import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { useEffect, useRef } from "react";
import { PartialBlock } from "@blocknote/core";
import { useTheme } from "next-themes"; // Import useTheme for dynamic theme handling

interface BlockPreviewProps {
  content: string; // JSON string of the editor content
}

const BlockPreview = ({ content }: BlockPreviewProps) => {
  const { resolvedTheme } = useTheme(); // Get the resolved theme (light/dark)

  // Initialize the editor
  const editor = useCreateBlockNote();

  // Ref to track if the initial content has been set
  const isInitialContentSet = useRef(false);

  // Parse the content and set it in the editor
  useEffect(() => {
    if (!content || isInitialContentSet.current) return;

    let parsedContent: PartialBlock[];
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error("Failed to parse content:", error);
      return;
    }

    // Replace the editor's content with the parsed content
    if (Array.isArray(parsedContent) && parsedContent.length > 0) {
      editor.replaceBlocks(editor.document, parsedContent);
      isInitialContentSet.current = true;
    }
  }, [content, editor]);

  return (
    <div
      className="overflow-y-auto" // Enable vertical scrolling
      style={{
        height: "850px", // A4 paper height (29.7cm)
        maxHeight: "850px", // Ensure it doesn't exceed A4 height
        borderRadius: "8px", // Optional: Add rounded corners
        padding: "16px", // Optional: Add padding for better spacing
      }}
    >
      <BlockNoteView
        editor={editor}
        editable={false} // Make the editor non-editable
        theme={resolvedTheme === "dark" ? "dark" : "light"} // Dynamic theme
      />
    </div>
  );
};

export default BlockPreview;