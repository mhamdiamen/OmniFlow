"use client";

import { BlockNoteView, Theme } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import { useEffect, useRef } from "react";
import { PartialBlock } from "@blocknote/core";
import { useTheme } from "next-themes";

interface BlockPreviewProps {
  content: string; // JSON string of the editor content
}

const BlockPreview = ({ content }: BlockPreviewProps) => {
  const { resolvedTheme } = useTheme(); // Get the resolved theme (light/dark)

  // Custom dark theme to match BlockEditor
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

  // Initialize the editor with default content
  const editor = useCreateBlockNote({
    initialContent: content ? JSON.parse(content) : undefined,
  });

  // Make sure content updates are reflected
  useEffect(() => {
    if (!content) return;
    
    try {
      const parsedContent = JSON.parse(content);
      if (Array.isArray(parsedContent) && parsedContent.length > 0) {
        editor.replaceBlocks(editor.document, parsedContent);
      }
    } catch (error) {
      console.error("Failed to parse content:", error);
    }
  }, [content, editor]);

  return (
    <div className="overflow-y-auto h-full p-4 scrollbar-hide">
      <BlockNoteView
        editor={editor}
        editable={false} // Make the editor non-editable
        theme={resolvedTheme === "dark" ? customDarkTheme : "light"} // Use the same theme approach as BlockEditor
      />
    </div>
  );
};

export default BlockPreview;