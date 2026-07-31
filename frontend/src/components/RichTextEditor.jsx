"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import FormatListNumberedIcon from "@mui/icons-material/FormatListNumbered";
import { ST } from "@/lib/staffTheme";

function ToolbarButton({ active, disabled, onClick, children, title }) {
  return (
    <IconButton
      size="small"
      title={title}
      disabled={disabled}
      onClick={onClick}
      sx={{
        width: 28,
        height: 28,
        borderRadius: 1,
        color: active ? ST.colors.info : ST.colors.textSecondary,
        bgcolor: active ? ST.colors.infoLight : "transparent",
        "&:hover": { bgcolor: active ? ST.colors.infoLight : ST.colors.bg },
      }}
    >
      {children}
    </IconButton>
  );
}

/** Normalize plain-text legacy values to HTML for Tiptap. */
export function toEditorHtml(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.startsWith("<")) return raw;
  return `<p>${raw.replace(/\n/g, "</p><p>")}</p>`;
}

/** Strip HTML tags for plain-text previews / validation display. */
export function stripHtml(html) {
  return String(html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function RichTextDisplay({ html, sx = {} }) {
  const content = String(html || "").trim();
  if (!content) return null;
  const isHtml = content.startsWith("<");
  if (isHtml) {
    return (
      <Box
        sx={{
          fontSize: 13,
          lineHeight: 1.75,
          color: "text.primary",
          "& p": { m: 0, mb: 1 },
          "& ul, & ol": { pl: 2.5, my: 1 },
          ...sx,
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return (
    <Typography variant="body2" sx={{ lineHeight: 1.75, fontSize: 13, whiteSpace: "pre-wrap", ...sx }}>
      {content}
    </Typography>
  );
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  disabled = false,
  placeholder = "Start writing…",
  minHeight = 160,
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: toEditorHtml(value),
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      const html = ed.isEmpty ? "" : ed.getHTML();
      onChange?.(html);
    },
  });

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [editor, disabled]);

  useEffect(() => {
    if (!editor) return;
    const next = toEditorHtml(value);
    const current = editor.isEmpty ? "" : editor.getHTML();
    if (next !== current) {
      editor.commands.setContent(next || "<p></p>", false);
    }
  }, [editor, value]);

  return (
    <Box sx={{ mb: 2 }}>
      {label && (
        <Typography
          variant="caption"
          component="label"
          sx={{
            display: "block",
            mb: 0.75,
            fontWeight: 600,
            color: disabled ? ST.colors.textSecondary : "text.secondary",
            fontSize: 12,
          }}
        >
          {label}
        </Typography>
      )}
      <Box
        sx={{
          border: `1px solid ${disabled ? ST.colors.border : ST.colors.border}`,
          borderRadius: 1,
          bgcolor: disabled ? ST.colors.bg : "white",
          opacity: disabled ? 0.92 : 1,
          transition: "border-color 0.15s, opacity 0.15s",
          "&:focus-within": disabled ? {} : { borderColor: ST.colors.info, boxShadow: `0 0 0 1px ${ST.colors.info}40` },
          "& .ProseMirror": {
            minHeight,
            px: 1.5,
            py: 1.25,
            outline: "none",
            fontSize: 14,
            lineHeight: 1.65,
            color: disabled ? ST.colors.textSecondary : "text.primary",
            "& p.is-editor-empty:first-of-type::before": {
              content: "attr(data-placeholder)",
              color: ST.colors.textSecondary,
              float: "left",
              height: 0,
              pointerEvents: "none",
            },
            "& p": { m: 0, mb: 0.75 },
            "& ul, & ol": { pl: 2.5, my: 0.75 },
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, px: 0.75, py: 0.5, borderBottom: `1px solid ${ST.colors.border}` }}>
          <ToolbarButton
            title="Bold"
            disabled={disabled || !editor}
            active={editor?.isActive("bold")}
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <FormatBoldIcon sx={{ fontSize: 18 }} />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            disabled={disabled || !editor}
            active={editor?.isActive("italic")}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          >
            <FormatItalicIcon sx={{ fontSize: 18 }} />
          </ToolbarButton>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <ToolbarButton
            title="Bullet list"
            disabled={disabled || !editor}
            active={editor?.isActive("bulletList")}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            <FormatListBulletedIcon sx={{ fontSize: 18 }} />
          </ToolbarButton>
          <ToolbarButton
            title="Numbered list"
            disabled={disabled || !editor}
            active={editor?.isActive("orderedList")}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          >
            <FormatListNumberedIcon sx={{ fontSize: 18 }} />
          </ToolbarButton>
        </Box>
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
