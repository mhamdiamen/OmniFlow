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
        text: "#f6f6f6", // White text
        background: "#0d0d0d", // Dark background
      },
      menu: {
        text: "#f6f6f6", // White text
        background: "#0d0d0d", // Dark menu background
      },
      tooltip: {
        text: "#f6f6f6", // White text
        background: "#0d0d0d", // Dark tooltip background
      },
      hovered: {
        text: "#f6f6f6", // White text
        background: "#0d0d0d", // Dark hover background
      },
      selected: {
        text: "#f6f6f6", // White text
        background: "#0d0d0d", // Dark selected background
      },
    },
    borderRadius: 4, // Rounded corners
    fontFamily: "Arial, sans-serif", // Custom font
  };

  // Custom light theme
  const customLightTheme: Theme = {
    colors: {
      editor: {
        text: "#000000", // Black text
        background: "#f6f6f6", // Light gray background
      },
      menu: {
        text: "#000000", // Black text
        background: "#f6f6f6", // Light gray menu background
      },
      tooltip: {
        text: "#000000", // Black text
        background: "#f6f6f6", // Light gray tooltip background
      },
      hovered: {
        text: "#000000", // Black text
        background: "#e0e0e0", // Slightly darker gray for hover
      },
      selected: {
        text: "#000000", // Black text
        background: "#d0d0d0", // Even darker gray for selected
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
        theme={resolvedTheme === "dark" ? customDarkTheme : customLightTheme} // Use custom light theme
      />
    </div>
  );
};

export default BlockPreview;