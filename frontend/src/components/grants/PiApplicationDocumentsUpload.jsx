"use client";

import GrantProposalDocumentsUpload from "@/components/grants/GrantProposalDocumentsUpload";

const POSTDOC_TYPES = [
  { value: "cv", label: "Curriculum Vitae (CV)" },
  { value: "cover_letter", label: "Cover letter" },
  { value: "publications", label: "Publications list / portfolio" },
];

const PHD_TYPES = [
  { value: "cv", label: "Curriculum Vitae (CV)" },
  { value: "cover_letter", label: "Cover letter / motivation (optional)" },
];

export default function PiApplicationDocumentsUpload({ grantId, documents = [], isPostdoc, disabled, onChange, onUploaded }) {
  const docTypes = isPostdoc ? POSTDOC_TYPES : PHD_TYPES;

  return (
    <GrantProposalDocumentsUpload
      grantId={grantId}
      documents={documents}
      onChange={onChange}
      onUploaded={(app) => {
        if (app?.lifecycle?.candidate?.documents) {
          onChange(app.lifecycle.candidate.documents);
        }
        onUploaded?.(app);
      }}
      docTypes={docTypes}
      defaultDocType={isPostdoc ? "cv" : "cv"}
      disabled={disabled}
      helperText={isPostdoc ? "CV and cover letter are required to submit." : "CV is required. Upload admission documents if applying concurrently."}
    />
  );
}
