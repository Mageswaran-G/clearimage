import { WorkflowHeader } from "@/components/layout/workflow-header";
import { CleanupView } from "@/components/cleanup/cleanup-view";

export default async function CleanupPage({
  params,
}: PageProps<"/cleanup/[id]">) {
  const { id } = await params;

  return (
    <>
      <WorkflowHeader currentStep="cleanup" />
      <main className="flex flex-1 flex-col bg-graphite">
        <CleanupView id={id} />
      </main>
    </>
  );
}
