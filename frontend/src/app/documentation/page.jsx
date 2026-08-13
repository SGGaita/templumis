"use client";

import DocsShell from "@/components/docs/DocsShell";
import DocsRenderer from "@/components/docs/DocsRenderer";
import { overviewTitle, overviewSubtitle, overviewBlocks } from "@/lib/docs/overview";

export default function DocumentationPage() {
  return (
    <DocsShell title={overviewTitle} subtitle={overviewSubtitle}>
      <DocsRenderer blocks={overviewBlocks} />
    </DocsShell>
  );
}
