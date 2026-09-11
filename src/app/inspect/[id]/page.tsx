import { WorkflowHeader } from "@/components/layout/workflow-header";
import { AnalysisView } from "@/components/inspect/analysis-view";

export default async function InspectPage({
  params,
}: PageProps<"/inspect/[id]">) {
  const { id } = await params;

  return (
    <>
      <WorkflowHeader currentStep="inspect" />
      <main className="flex flex-1 flex-col">
        <AnalysisView id={id} />
      </main>
    </>
  );
}
