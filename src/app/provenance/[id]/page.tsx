import { WorkflowHeader } from "@/components/layout/workflow-header";
import { ProvenanceView } from "@/components/provenance/provenance-view";

export default async function ProvenancePage({
  params,
}: PageProps<"/provenance/[id]">) {
  const { id } = await params;

  return (
    <>
      {/* Provenance is a branch off Inspect, not its own numbered step. */}
      <WorkflowHeader currentStep="inspect" />
      <main className="flex flex-1 flex-col">
        <ProvenanceView id={id} />
      </main>
    </>
  );
}
