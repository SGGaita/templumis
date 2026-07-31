"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Paper from "@mui/material/Paper";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { ST } from "@/lib/staffTheme";
import {
  normalizeScholarshipType,
  ESSAY_TARGET_WORDS,
  countEssayWords,
  validateFileUpload,
  getSupportingDocuments,
} from "@/lib/scholarshipSchemas";
import SupportingDocumentsUpload from "./SupportingDocumentsUpload";

function FileDropZone({ label, fieldKey, meta, onChange, error, media }) {
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = validateFileUpload(file, { media });
    if (!result.ok) {
      onChange(fieldKey, null, result.message);
      return;
    }
    onChange(fieldKey, result.meta, null);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Button variant="outlined" component="label" size="small" sx={{ textTransform: "none" }}>
        Upload PDF / PNG / JPEG (≤{media ? 50 : 10} MB)
        <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg" onChange={handleFile} />
      </Button>
      {meta?.name && (
        <Typography variant="caption" sx={{ display: "block", mt: 1, color: ST.colors.success }}>
          ✓ {meta.name} — integrity scan passed (mock)
        </Typography>
      )}
      {error && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}

export default function DynamicApplicationForm({
  scholarship,
  autoFill,
  formData,
  onChange,
  onBlur,
  fieldErrors = {},
}) {
  const schemaType = normalizeScholarshipType(scholarship);
  const essayWords = countEssayWords(formData.essay_merit);
  const essayOk =
    essayWords >= ESSAY_TARGET_WORDS * 0.9 && essayWords <= ESSAY_TARGET_WORDS * 1.1;

  const setField = (key, value) => onChange({ [key]: value });

  return (
    <Paper elevation={0} sx={{ p: 2.5, border: `1px solid ${ST.colors.border}`, borderRadius: 2, mb: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
        Dynamic application form
      </Typography>
      <ChipType schemaType={schemaType} />

      <Typography variant="overline" sx={{ color: ST.colors.textSecondary, mt: 2, display: "block" }}>
        SIS auto-fill (read-only)
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, mb: 2 }}>
        {["full_name", "student_id", "email", "major", "program", "gpa", "credits_completed"].map((k) => (
          <TextField
            key={k}
            size="small"
            label={k.replace(/_/g, " ")}
            value={autoFill[k] || formData[k] || ""}
            InputProps={{ readOnly: true }}
            sx={{ "& .MuiInputBase-input": { bgcolor: ST.colors.bg } }}
          />
        ))}
      </Box>

      <FormControlLabel
        control={
          <Checkbox
            checked={!!formData.personal_statement_ack}
            onChange={(e) => setField("personal_statement_ack", e.target.checked)}
          />
        }
        label="I confirm the information above is accurate per university records"
      />
      {fieldErrors.personal_statement_ack && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {fieldErrors.personal_statement_ack}
        </Alert>
      )}

      {schemaType === "merit" && (
        <Box sx={{ mt: 2 }} id="field-essay_merit">
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1 }}>
            Merit essay ({ESSAY_TARGET_WORDS} words ±10%)
          </Typography>
          <TextField
            multiline
            minRows={8}
            fullWidth
            value={formData.essay_merit || ""}
            onChange={(e) => setField("essay_merit", e.target.value)}
            onBlur={onBlur}
            error={!!fieldErrors.essay_merit || (formData.essay_merit && !essayOk)}
            helperText={
              fieldErrors.essay_merit ||
              `${essayWords} / ${ESSAY_TARGET_WORDS} words${essayOk ? " ✓" : ""}`
            }
          />
        </Box>
      )}

      {schemaType === "need-based" && (
        <SupportingDocumentsUpload
          scholId={scholarship?.id}
          documents={getSupportingDocuments(formData)}
          onChange={(docs) => setField("supporting_documents", docs)}
          onBlur={onBlur}
          error={fieldErrors.supporting_documents}
        />
      )}

      {schemaType === "talent" && (
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Portfolio URL (GitHub, YouTube, Behance, etc.)"
            value={formData.portfolio_url || ""}
            onChange={(e) => setField("portfolio_url", e.target.value)}
            onBlur={onBlur}
            sx={{ mb: 2 }}
            id="field-portfolio_url"
            error={!!fieldErrors.portfolio_url}
            helperText={fieldErrors.portfolio_url}
          />
          <TextField
            multiline
            minRows={4}
            fullWidth
            label="Talent statement"
            value={formData.talent_statement || ""}
            onChange={(e) => setField("talent_statement", e.target.value)}
            onBlur={onBlur}
            id="field-talent_statement"
            error={!!fieldErrors.talent_statement}
            helperText={fieldErrors.talent_statement}
          />
          <FileDropZone
            label="Media sample (optional, ≤50 MB)"
            fieldKey="media_doc_meta"
            meta={formData.media_doc_meta}
            media
            onChange={(key, meta) => setField(key, meta)}
          />
        </Box>
      )}
    </Paper>
  );
}

function ChipType({ schemaType }) {
  const labels = {
    merit: "Merit-Based Schema",
    "need-based": "Need-Based Schema",
    talent: "Talent / Niche Schema",
  };
  return (
    <Typography variant="caption" sx={{ color: ST.colors.primary, fontWeight: 700 }}>
      {labels[schemaType]}
    </Typography>
  );
}
