"use client";

import DocsShell from "@/components/docs/DocsShell";
import DocsRenderer from "@/components/docs/DocsRenderer";
import { apiTitle, apiSubtitle, apiBlocks } from "@/lib/docs/api";

export default function ApiDocsPage() {
  return (
    <DocsShell title={apiTitle} subtitle={apiSubtitle}>
      <DocsRenderer blocks={apiBlocks} />
    </DocsShell>
  );
}
