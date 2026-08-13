"use client";

import DocsShell from "@/components/docs/DocsShell";
import DocsRenderer from "@/components/docs/DocsRenderer";
import { userGuideTitle, userGuideSubtitle, userGuideBlocks } from "@/lib/docs/userGuide";

export default function UserGuidePage() {
  return (
    <DocsShell title={userGuideTitle} subtitle={userGuideSubtitle}>
      <DocsRenderer blocks={userGuideBlocks} />
    </DocsShell>
  );
}
