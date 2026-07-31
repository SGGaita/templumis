"use client";

import { useEffect, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { fetchScholarshipDocumentBlob } from "@/lib/api";

export default function DocumentPreviewDialog({ open, onClose, previewPath, fileName, mime }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !previewPath) {
      setBlobUrl(null);
      setError("");
      return undefined;
    }

    let cancelled = false;
    let url = null;
    setLoading(true);
    setError("");

    fetchScholarshipDocumentBlob(previewPath)
      .then((objectUrl) => {
        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        url = objectUrl;
        setBlobUrl(objectUrl);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [open, previewPath]);

  const handleClose = () => {
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
    onClose();
  };

  const isPdf = mime === "application/pdf" || String(fileName || "").toLowerCase().endsWith(".pdf");
  const isImage = mime?.startsWith("image/");

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{fileName || "Document preview"}</DialogTitle>
      <DialogContent dividers sx={{ minHeight: 320, p: 0 }}>
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}
        {!loading && !error && blobUrl && isPdf && (
          <Box
            component="iframe"
            src={blobUrl}
            title={fileName}
            sx={{ width: "100%", height: "70vh", border: "none" }}
          />
        )}
        {!loading && !error && blobUrl && isImage && (
          <Box sx={{ p: 2, textAlign: "center", bgcolor: "#f5f5f5" }}>
            <Box
              component="img"
              src={blobUrl}
              alt={fileName}
              sx={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
            />
          </Box>
        )}
        {!loading && !error && blobUrl && !isPdf && !isImage && (
          <Typography variant="body2" sx={{ p: 3 }}>
            Preview not available for this file type. Use Open in new tab.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {blobUrl && (
          <Button
            startIcon={<OpenInNewIcon />}
            href={blobUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ textTransform: "none" }}
          >
            Open in new tab
          </Button>
        )}
        <Button onClick={handleClose} sx={{ textTransform: "none" }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
