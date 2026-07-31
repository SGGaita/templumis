"use client";

import { useCallback, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import CircularProgress from "@mui/material/CircularProgress";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";
import { uploadGrantDocument, deleteGrantDocument, fetchGrantDocumentBlob } from "@/lib/api";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

const MAX_FILES = 20;
const MAX_MB = 15;

const DOC_TYPES = [
  { value: "abstract", label: "Abstract (≤300 words in PDF/Markdown)" },
  { value: "methodology", label: "Methodology & Experimental Design" },
  { value: "dmp", label: "Data Management Plan (DMP)" },
  { value: "supporting", label: "Supporting / other" },
];

const TYPE_LABELS = Object.fromEntries(DOC_TYPES.map((d) => [d.value, d.label]));

function validateGrantFile(file) {
  const allowed = ["application/pdf", "image/png", "image/jpeg", "text/markdown", "text/plain"];
  const ext = (file.name || "").toLowerCase();
  const isMd = ext.endsWith(".md");
  if (!allowed.includes(file.type) && !isMd) {
    return { ok: false, message: "Only PDF, PNG, JPEG, or Markdown (.md) allowed" };
  }
  if (file.size > MAX_MB * 1024 * 1024) {
    return { ok: false, message: `File must be ≤ ${MAX_MB} MB` };
  }
  return { ok: true };
}

export default function GrantProposalDocumentsUpload({
  grantId,
  documents = [],
  onChange,
  onUploaded,
  docTypes: docTypesProp,
  defaultDocType = "abstract",
  disabled = false,
  helperText,
  title = "Narrative uploads",
}) {
  const typeOptions = docTypesProp || DOC_TYPES;
  const typeLabels = Object.fromEntries(typeOptions.map((d) => [d.value, d.label]));
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState(defaultDocType);
  const [preview, setPreview] = useState(null);

  const addFiles = useCallback(
    async (fileList) => {
      if (!fileList?.length || !grantId) return;
      setLocalError("");
      setUploading(true);
      const errors = [];

      try {
        let next = [...documents];
        for (const file of Array.from(fileList)) {
          if (next.length >= MAX_FILES) {
            errors.push(`Maximum ${MAX_FILES} documents allowed`);
            break;
          }
          const result = validateGrantFile(file);
          if (!result.ok) {
            errors.push(`${file.name}: ${result.message}`);
            continue;
          }
          const res = await uploadGrantDocument(grantId, file, docType);
          next = res.documents || [...next, res.document];
          onUploaded?.(res.application);
        }
        onChange(next);
      } catch (e) {
        errors.push(e.message || "Upload failed");
      } finally {
        setUploading(false);
      }
      if (errors.length) setLocalError(errors[0]);
    },
    [documents, grantId, docType, onChange, onUploaded]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const removeAt = async (index) => {
    const doc = documents[index];
    if (doc?.storage_key && grantId) {
      try {
        const res = await deleteGrantDocument(grantId, doc.storage_key);
        onChange(res.documents || documents.filter((_, i) => i !== index));
        onUploaded?.(res.application);
      } catch (e) {
        setLocalError(e.message);
      }
    } else {
      onChange(documents.filter((_, i) => i !== index));
    }
  };

  const openPreview = async (doc) => {
    if (!doc.storage_key || !grantId) {
      setLocalError("Re-upload to enable preview.");
      return;
    }
    try {
      const url = await fetchGrantDocumentBlob(grantId, doc.storage_key);
      setPreview({ url, name: doc.name, mime: doc.mime });
    } catch (e) {
      setLocalError(e.message);
    }
  };

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontSize: 13 }}>
        {helperText || "Upload your abstract, methodology, and data management plan as PDF or Markdown files. Multiple documents per section are allowed."}
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          select
          size="small"
          label="Document type for next upload"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          disabled={disabled}
          sx={{ minWidth: 280 }}
        >
          {typeOptions.map((t) => (
            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Box
        onDragOver={(e) => { if (!disabled) { e.preventDefault(); setDragOver(true); } }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        sx={{
          border: `2px dashed ${dragOver ? BRAND.teal : ST.colors.border}`,
          borderRadius: 2,
          p: 4,
          textAlign: "center",
          bgcolor: dragOver ? `${BRAND.teal}08` : ST.colors.bg,
          cursor: disabled || uploading ? "not-allowed" : "pointer",
          opacity: disabled || uploading ? 0.6 : 1,
          pointerEvents: disabled ? "none" : "auto",
          transition: "border-color 0.2s, background 0.2s",
        }}
        onClick={() => !disabled && document.getElementById(`grant-doc-input-${grantId}`)?.click()}
      >
        <input
          id={`grant-doc-input-${grantId}`}
          type="file"
          hidden
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.md,application/pdf,image/png,image/jpeg,text/markdown"
          disabled={uploading || !grantId || disabled}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
        />
        {uploading ? (
          <CircularProgress size={32} sx={{ color: BRAND.teal }} />
        ) : (
          <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: BRAND.teal, mb: 1 }} />
        )}
        <Typography variant="body2" fontWeight={600}>
          {uploading ? "Uploading…" : "Drag and drop files here, or click to browse"}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
          PDF, Markdown (.md), PNG, JPEG · up to {MAX_MB} MB each · max {MAX_FILES} files
        </Typography>
      </Box>

      {(localError) && <Alert severity="error" sx={{ mt: 2 }}>{localError}</Alert>}

      {documents.length > 0 && (
        <List dense sx={{ mt: 2, bgcolor: "white", border: `1px solid ${ST.colors.border}`, borderRadius: 2 }}>
          {documents.map((doc, idx) => (
            <ListItem
              key={doc.storage_key || `${doc.name}-${idx}`}
              secondaryAction={
                <Box>
                  <IconButton size="small" onClick={() => openPreview(doc)} title="Preview">
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => removeAt(idx)} title="Remove">
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <InsertDriveFileOutlinedIcon sx={{ mr: 1.5, color: BRAND.navy }} />
              <ListItemText
                primary={doc.name}
                secondary={
                  <Box component="span" sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
                    <Chip size="small" label={typeLabels[doc.doc_type] || TYPE_LABELS[doc.doc_type] || doc.doc_type || "Document"} sx={{ height: 20, fontSize: 10 }} />
                    <Typography component="span" variant="caption">{doc.size_mb ?? "—"} MB</Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      <Dialog
        open={Boolean(preview)}
        onClose={() => { if (preview?.url) URL.revokeObjectURL(preview.url); setPreview(null); }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{preview?.name || "Document preview"}</DialogTitle>
        <DialogContent>
          {preview?.mime === "application/pdf" ? (
            <Box component="iframe" src={preview.url} sx={{ width: "100%", height: 480, border: "none" }} title="PDF preview" />
          ) : preview?.mime?.startsWith("image/") ? (
            <Box component="img" src={preview.url} alt={preview.name} sx={{ maxWidth: "100%", height: "auto" }} />
          ) : (
            <Typography variant="body2" color="text.secondary">Preview not available for this file type — download from your uploads list.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { if (preview?.url) URL.revokeObjectURL(preview.url); setPreview(null); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
