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
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import InsertDriveFileOutlinedIcon from "@mui/icons-material/InsertDriveFileOutlined";
import { BRAND } from "@/lib/brand";
import { ST } from "@/lib/staffTheme";
import { validateFileUpload } from "@/lib/scholarshipSchemas";
import { uploadScholarshipDocument, deleteScholarshipDocument } from "@/lib/api";
import DocumentPreviewDialog from "@/components/staff/financial-aid/DocumentPreviewDialog";

const MAX_FILES = 10;
const MAX_MB = 10;

export default function SupportingDocumentsUpload({
  scholId,
  documents = [],
  onChange,
  error,
  onBlur,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [localError, setLocalError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);

  const addFiles = useCallback(
    async (fileList) => {
      if (!fileList?.length || !scholId) return;
      setLocalError("");
      setUploading(true);
      const next = [...documents];
      const errors = [];

      try {
        for (const file of Array.from(fileList)) {
          if (next.length >= MAX_FILES) {
            errors.push(`Maximum ${MAX_FILES} documents allowed`);
            break;
          }
          const result = validateFileUpload(file, { maxMb: MAX_MB });
          if (!result.ok) {
            errors.push(`${file.name}: ${result.message}`);
            continue;
          }
          const duplicate = next.some((d) => d.name === file.name);
          if (duplicate) continue;

          const res = await uploadScholarshipDocument(scholId, file);
          const meta = res.document || res;
          next.push(meta);
        }
        onChange(next);
        onBlur?.();
      } catch (e) {
        errors.push(e.message || "Upload failed");
      } finally {
        setUploading(false);
      }

      if (errors.length) setLocalError(errors[0]);
    },
    [documents, scholId, onChange, onBlur]
  );

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const removeAt = async (index) => {
    const doc = documents[index];
    if (doc?.storage_key && scholId) {
      try {
        const res = await deleteScholarshipDocument(scholId, doc.storage_key);
        onChange(res.supporting_documents || documents.filter((_, i) => i !== index));
      } catch (e) {
        setLocalError(e.message);
        return;
      }
    } else {
      onChange(documents.filter((_, i) => i !== index));
    }
    onBlur?.();
  };

  const openPreview = (doc) => {
    if (!doc.storage_key || !scholId) {
      setLocalError("This file has no stored copy — remove and upload again to enable preview.");
      return;
    }
    setPreview({
      path: `/sis-lms/scholarships/applications/draft/${encodeURIComponent(scholId)}/documents/${encodeURIComponent(doc.storage_key)}`,
      name: doc.name,
      mime: doc.mime,
    });
  };

  const displayError = error || localError;

  return (
    <Box id="field-supporting_documents" sx={{ mt: 2 }}>
      <Typography variant="subtitle2" fontWeight={700} sx={{ color: BRAND.navy, mb: 0.5 }}>
        Supporting certified documents
      </Typography>
      <Typography variant="body2" sx={{ color: ST.colors.textSecondary, mb: 2, lineHeight: 1.6 }}>
        Upload official documents that support your application. Files are saved securely and can be
        previewed by the financial aid office.
      </Typography>

      <Box
        onDragEnter={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragOver(false);
        }}
        onDrop={handleDrop}
        sx={{
          border: `2px dashed ${dragOver ? BRAND.teal : ST.colors.border}`,
          borderRadius: 2,
          bgcolor: dragOver ? BRAND.tealLight : ST.colors.bg,
          py: 4,
          px: 2,
          textAlign: "center",
          transition: "border-color 0.15s, background 0.15s",
          cursor: uploading ? "wait" : "pointer",
          opacity: uploading ? 0.7 : 1,
        }}
        component="label"
      >
        <input
          type="file"
          hidden
          multiple
          disabled={uploading || !scholId}
          accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg"
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {uploading ? (
          <CircularProgress size={32} sx={{ color: BRAND.teal, mb: 1 }} />
        ) : (
          <CloudUploadOutlinedIcon sx={{ fontSize: 40, color: dragOver ? BRAND.teal : BRAND.navyMuted, mb: 1 }} />
        )}
        <Typography variant="body2" fontWeight={600} sx={{ color: BRAND.navy }}>
          {uploading ? "Uploading…" : "Drag and drop files here, or click to browse"}
        </Typography>
        <Typography variant="caption" sx={{ color: ST.colors.textSecondary, display: "block", mt: 0.75 }}>
          PDF, PNG, or JPEG · up to {MAX_MB} MB each · {MAX_FILES} files max
        </Typography>
      </Box>

      {documents.length > 0 && (
        <List dense sx={{ mt: 2, bgcolor: "white", borderRadius: 2, border: `1px solid ${ST.colors.border}` }}>
          {documents.map((doc, index) => (
            <ListItem
              key={doc.storage_key || `${doc.name}-${index}`}
              secondaryAction={
                <Box>
                  <IconButton
                    edge="end"
                    aria-label="Preview file"
                    size="small"
                    onClick={() => openPreview(doc)}
                    sx={{ mr: 0.5 }}
                  >
                    <VisibilityOutlinedIcon fontSize="small" />
                  </IconButton>
                  <IconButton edge="end" aria-label="Remove file" size="small" onClick={() => removeAt(index)}>
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </Box>
              }
            >
              <InsertDriveFileOutlinedIcon sx={{ mr: 1.5, color: BRAND.teal, fontSize: 22 }} />
              <ListItemText
                primary={doc.name}
                secondary={
                  doc.storage_key
                    ? `${doc.size_mb ?? "—"} MB · uploaded`
                    : `${doc.size_mb ?? "—"} MB · re-upload to enable preview`
                }
                primaryTypographyProps={{ fontWeight: 600, fontSize: 14 }}
                secondaryTypographyProps={{ fontSize: 12 }}
              />
            </ListItem>
          ))}
        </List>
      )}

      {displayError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {displayError}
        </Alert>
      )}

      <DocumentPreviewDialog
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        previewPath={preview?.path}
        fileName={preview?.name}
        mime={preview?.mime}
      />
    </Box>
  );
}
