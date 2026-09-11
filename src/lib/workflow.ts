/**
 * The approved ClearImage workflow, in order.
 * Landing ("/") is the entry page and is not part of the numbered
 * step indicator — the indicator covers the file-handling steps only.
 *
 * Provenance is NOT a numbered step: it is a branch reached from Inspect
 * via the "Full Report" action, so it is intentionally absent here.
 */
export const workflowSteps = [
  { id: "upload", label: "Upload", href: "/upload" },
  { id: "inspect", label: "Inspect", href: "/inspect" },
  { id: "cleanup", label: "Clean", href: "/cleanup" },
  { id: "export", label: "Export", href: "/export" },
] as const;

export type WorkflowStepId = (typeof workflowSteps)[number]["id"];
