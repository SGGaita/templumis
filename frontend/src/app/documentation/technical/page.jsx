"use client";

import DocsShell from "@/components/docs/DocsShell";
import DocsRenderer from "@/components/docs/DocsRenderer";
import { technicalTitle, technicalSubtitle, technicalBlocks } from "@/lib/docs/technical";

export default function TechnicalDocsPage() {
  return (
    <DocsShell title={technicalTitle} subtitle={technicalSubtitle}>
      <DocsRenderer blocks={technicalBlocks} />
    </DocsShell>
  );
}
